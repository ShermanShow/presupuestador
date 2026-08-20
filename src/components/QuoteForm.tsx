"use client";

import { useEffect, useState } from "react";
import { productos, empresa, vendedores as vendedoresIniciales, Vendedor } from "@/config/empresa";
import QuotePreview from "./QuotePreview";

export interface ClienteData {
  nombre: string;
  apellido: string;
  empresa: string;
  telefono: string;
  email: string;
  productoId: string;
  nombrePersonalizado: string;
  precio: number;
  notas: string;
  vendedorId: string;
}

export interface OpcionesPDF {
  incluirFotos: boolean;
  incluirFolleto: boolean;
}

export default function QuoteForm() {
  const [vendedores, setVendedores] = useState<Vendedor[]>(vendedoresIniciales);
  const [form, setForm] = useState<ClienteData>({
    nombre: "",
    apellido: "",
    empresa: "",
    telefono: "",
    email: "",
    productoId: productos[0].id,
    nombrePersonalizado: "",
    precio: productos[0].precioBase,
    notas: "",
    vendedorId: vendedores[0].id,
  });
  const [opciones, setOpciones] = useState<OpcionesPDF>({
    incluirFotos: false,
    incluirFolleto: false,
  });
  const [loggedClientId, setLoggedClientId] = useState<string | null>(null);
  const [numeroPresupuesto, setNumeroPresupuesto] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [enviandoMail, setEnviandoMail] = useState(false);
  const [mailStatus, setMailStatus] = useState<"idle" | "ok" | "error">("idle");

  // Detección de cambios sin guardar
  const [cleanSignature, setCleanSignature] = useState<string | null>(null);
  const [preparado, setPreparado] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNumero, setEditingNumero] = useState<number | null>(null);

  const propSignature = JSON.stringify([form, opciones]);
  const dirty = cleanSignature !== null && propSignature !== cleanSignature;

  // Tomar el estado precargado como "limpio" cuando termina la inicialización
  useEffect(() => {
    if (preparado && cleanSignature === null) setCleanSignature(propSignature);
  }, [preparado, cleanSignature, propSignature]);

  // Avisar al intentar salir / cerrar / recargar con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    let vendedorList = vendedoresIniciales;
    fetch("/api/vendedores")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.vendedores) && data.vendedores.length) {
          vendedorList = data.vendedores;
          setVendedores(data.vendedores);
          setForm((current) => ({ ...current, vendedorId: data.vendedores.some((v: Vendedor) => v.id === current.vendedorId) ? current.vendedorId : data.vendedores[0].id }));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        aplicarPresupuestoGuardado(vendedorList);
        setPreparado(true);
      });
  }, []);

  const productoSeleccionado = productos.find((p) => p.id === form.productoId)!;
  const esOtro = form.productoId === "otro";
  const tieneFolleto = !esOtro && !!(productoSeleccionado.folletos?.length || productoSeleccionado.datasheet);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === "productoId") {
      const prod = productos.find((p) => p.id === value)!;
      setForm((f) => ({ ...f, productoId: value, precio: prod.precioBase, nombrePersonalizado: "" }));
      if (value === "otro") {
        setOpciones({ incluirFotos: false, incluirFolleto: false });
      } else if (!prod.folletos?.length) {
        setOpciones((o) => ({ ...o, incluirFolleto: false }));
      }
    } else if (name === "precio") {
      setForm((f) => ({ ...f, precio: parseFloat(value) || 0 }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleWhatsApp() {
    const vendedor = vendedores.find((v) => v.id === form.vendedorId)!;
    const telefonoLimpio = form.telefono.replace(/[\s\-().+]/g, "");
    const texto = encodeURIComponent(
      `Hola ${form.nombre} ${form.apellido}!\nTe enviamos el presupuesto de *${productoSeleccionado.nombre}*.\nCualquier consulta estamos a tu disposicion.\n${empresa.nombre}\nTel. ${vendedor.telefono}\nWeb ${empresa.web}`
    );
    // asegurar que quede registrado antes de abrir WhatsApp (no bloquear UI)
    logQuoteIfNeeded().finally(() => window.open(`https://wa.me/${telefonoLimpio}?text=${texto}`, "_blank"));
  }

  async function handleMail() {
    setEnviandoMail(true);
    setMailStatus("idle");
    try {
      await logQuoteIfNeeded();
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente: form, producto: productoSeleccionado, vendedor: vendedorSeleccionado }),
      });
      setMailStatus(res.ok ? "ok" : "error");
    } catch {
      setMailStatus("error");
    } finally {
      setEnviandoMail(false);
    }
  }

  const vendedorSeleccionado = vendedores.find((v) => v.id === form.vendedorId) ?? vendedores[0];

  // Pre-cargar un presupuesto guardado (traído desde el historial) para editarlo
  function aplicarPresupuestoGuardado(vendedorList: Vendedor[]) {
    try {
      const raw = sessionStorage.getItem("presupuesto_editar_equipo");
      if (!raw) return;
      const p = JSON.parse(raw);
      sessionStorage.removeItem("presupuesto_editar_equipo");

      let productoId = productos[0].id;
      let nombrePersonalizado = "";
      const equipoTexto = p.equipo || "";
      const match = productos.find((prod) => prod.nombre === equipoTexto);
      if (match) productoId = match.id;
      else if (equipoTexto) { productoId = "otro"; nombrePersonalizado = equipoTexto; }

      let vendedorId = vendedorList[0]?.id || vendedoresIniciales[0].id;
      const vendMatch = vendedorList.find((v) => v.nombre === p.vendedor);
      if (vendMatch) vendedorId = vendMatch.id;

      setForm({
        nombre: p.nombre || "",
        apellido: p.apellido || "",
        empresa: p.empresa || "",
        telefono: p.telefono || "",
        email: p.email || "",
        productoId,
        nombrePersonalizado,
        precio: typeof p.precio === "number" ? p.precio : 0,
        notas: p.notas || "",
        vendedorId,
      });
      setOpciones({
        incluirFotos: !!p.opciones?.incluirFotos,
        incluirFolleto: !!p.opciones?.incluirFolleto,
      });
      if (typeof p.numero === "number") {
        setNumeroPresupuesto(p.numero);
        setEditingNumero(p.numero);
      }
      setEditingId(p.id || null);
    } catch (err) {
      console.error("Error precargando presupuesto:", err);
      sessionStorage.removeItem("presupuesto_editar_equipo");
    }
  }

  async function logQuoteIfNeeded() {
    if (loggedClientId && !editingId) return;
    try {
      if (editingId) {
        const res = await fetch("/api/log-quote", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, cliente: form, producto: productoSeleccionado, opciones }),
        });
        const data = await res.json();
        if (res.ok) {
          setCleanSignature(JSON.stringify([form, opciones]));
          if (data?.presupuesto?.numero) setNumeroPresupuesto(data.presupuesto.numero);
        } else {
          console.error("Error actualizando presupuesto:", data);
        }
        return;
      }
      const clientId = (typeof crypto !== "undefined" && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
      const res = await fetch("/api/log-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente: form, producto: productoSeleccionado, opciones, clientId }),
      });
      const data = await res.json();
      setLoggedClientId(clientId);
      if (data && data.numero) {
        setNumeroPresupuesto(data.numero);
        localStorage.setItem("presupuestador_ultimo_numero", String(data.numero));
      }
    } catch (err) {
      console.error("Error logueando presupuesto:", err);
    }
  }

  const formValido = Boolean(form.nombre.trim());

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-4">
          <img src={empresa.logo} alt="Logo" className="h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{empresa.nombre}</h1>
            <p className="text-sm text-gray-500">Generador de Presupuestos</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {dirty && <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-800">⚠ Sin guardar</span>}
            <a href="/presupuestos/historial" onClick={(e) => { if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés salir igual?")) e.preventDefault(); }} className="text-xs font-semibold text-gray-600 hover:text-gray-800">Historial</a>
            <a href="/admin" className="text-xs font-semibold text-orange-700 hover:text-orange-800">Administración</a>
          </div>
        </div>

        {editingId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            Editando presupuesto <strong>N° {editingNumero}</strong> — al ver/enviar se actualizará el registro original.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Vendedor */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Vendedor</h2>
          <div className="flex gap-2 mb-5">
            {vendedores.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, vendedorId: v.id }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                  form.vendedorId === v.id
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                }`}
                style={form.vendedorId === v.id ? { backgroundColor: "#E85500", borderColor: "#E85500" } : {}}
              >
                {v.nombre}
              </button>
            ))}
          </div>

          <hr className="my-5 border-gray-100" />

          {/* Datos del cliente */}
          <h2 className="text-lg font-semibold text-gray-700 mb-5">Datos del cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Pérez"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Empresa</label>
              <input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Mi Empresa SA"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="+54 11 1234-5678"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@empresa.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          <hr className="my-5 border-gray-100" />

          {/* Equipo y precio */}
          <h2 className="text-lg font-semibold text-gray-700 mb-5">Equipo y precio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Equipo</label>
              <select name="productoId" value={form.productoId} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {form.productoId !== "otro" && (
                <p className="text-xs text-gray-400 mt-1">{productoSeleccionado.descripcion}</p>
              )}
            </div>
            {form.productoId === "otro" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del equipo</label>
                <input
                  name="nombrePersonalizado"
                  value={form.nombrePersonalizado}
                  onChange={handleChange}
                  placeholder="Ej: Plotter de corte XY-500"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Precio (USD)</label>
              <input name="precio" type="number" value={form.precio} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Notas adicionales</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={3}
              placeholder="Condiciones especiales, financiación, etc."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>

          <hr className="my-5 border-gray-100" />

          {/* Opciones del PDF */}
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Contenido del PDF</h2>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-3">

            <label className={`flex items-start gap-3 ${esOtro ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={opciones.incluirFotos}
                disabled={esOtro}
                onChange={(e) => setOpciones((o) => ({ ...o, incluirFotos: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Incluir fotos del equipo</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {esOtro ? "No disponible para equipos personalizados" : `Se agregan ${productoSeleccionado.imagenes.length} foto${productoSeleccionado.imagenes.length > 1 ? "s" : ""} antes del presupuesto`}
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 ${tieneFolleto ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}>
              <input
                type="checkbox"
                checked={opciones.incluirFolleto}
                disabled={!tieneFolleto}
                onChange={(e) => setOpciones((o) => ({ ...o, incluirFolleto: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Incluir folleto y datasheet</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  {tieneFolleto
                    ? `Se agrega${productoSeleccionado.folletos?.length ? " el folleto" : ""}${productoSeleccionado.folletos?.length && productoSeleccionado.datasheet ? " y" : ""}${productoSeleccionado.datasheet ? " el datasheet técnico" : ""}`
                    : "Folleto/datasheet no disponible para este equipo"}
                </p>
              </div>
            </label>

          </div>

          {/* Botones */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={async () => { await logQuoteIfNeeded(); setShowPreview(true); }} disabled={!formValido}
              className="flex items-center gap-2 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
              style={{ backgroundColor: "#E85500" }}>
              👁 Ver presupuesto
            </button>
            <button onClick={handleWhatsApp} disabled={!formValido}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
              💬 Enviar por WhatsApp
            </button>
            <button onClick={handleMail} disabled={!formValido || enviandoMail || !form.email}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
              ✉️ {enviandoMail ? "Enviando..." : "Enviar por Mail"}
            </button>
          </div>

          {mailStatus === "ok" && <p className="mt-3 text-sm text-green-600">✓ Mail enviado a {form.email}</p>}
          {mailStatus === "error" && <p className="mt-3 text-sm text-red-500">✗ Error al enviar. Revisá la configuración SMTP.</p>}
        </div>
      </div>

      {showPreview && (
        <QuotePreview
          cliente={form}
          producto={productoSeleccionado}
          opciones={opciones}
          vendedor={vendedorSeleccionado}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
