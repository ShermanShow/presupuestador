"use client";

import { useEffect, useMemo, useState } from "react";

type PresupuestoEquipo = {
  id: string;
  numero: number | null;
  created_at: string;
  vendedor: string | null;
  nombre: string | null;
  apellido: string | null;
  empresa: string | null;
  telefono: string | null;
  email: string | null;
  equipo: string | null;
  precio: number | null;
  notas: string | null;
  opciones: { incluirFotos?: boolean; incluirFolleto?: boolean } | null;
};

const usd = (n: number | null | undefined) =>
  n == null ? "—" : `USD ${new Intl.NumberFormat("es-AR").format(n)}`;

export default function HistorialPresupuestos() {
  const [items, setItems] = useState<PresupuestoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState<PresupuestoEquipo | null>(null);

  // Filtros
  const [q, setQ] = useState("");
  const [equipo, setEquipo] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [minPrecio, setMinPrecio] = useState("");
  const [maxPrecio, setMaxPrecio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Opciones para los select (derivadas del listado completo)
  const [opciones, setOpciones] = useState<{ equipos: string[]; vendedores: string[] }>({ equipos: [], vendedores: [] });

  useEffect(() => {
    fetch("/api/log-quote?limit=500")
      .then((r) => r.json())
      .then((d) => {
        const list: PresupuestoEquipo[] = d.presupuestos || [];
        setOpciones({
          equipos: [...new Set(list.map((i) => i.equipo).filter(Boolean))].sort() as string[],
          vendedores: [...new Set(list.map((i) => i.vendedor).filter(Boolean))].sort() as string[],
        });
      })
      .catch(() => {});
  }, []);

  function cargar() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (equipo) params.set("equipo", equipo);
    if (vendedor) params.set("vendedor", vendedor);
    if (minPrecio) params.set("min_precio", minPrecio);
    if (maxPrecio) params.set("max_precio", maxPrecio);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    fetch(`/api/log-quote?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setItems([]); }
        else setItems(d.presupuestos || []);
      })
      .catch(() => { setError("No se pudo cargar el historial."); setItems([]); })
      .finally(() => setLoading(false));
  }

  // Autoconsulta con debounce ante cualquier cambio de filtro
  useEffect(() => {
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, equipo, vendedor, minPrecio, maxPrecio, desde, hasta]);

  function limpiar() {
    setQ(""); setEquipo(""); setVendedor(""); setMinPrecio(""); setMaxPrecio(""); setDesde(""); setHasta("");
  }

  // Abrir el presupuesto en el cotizador para verlo, modificarlo y descargarlo como PDF
  function editarPresupuesto(p: PresupuestoEquipo) {
    sessionStorage.setItem("presupuesto_editar_equipo", JSON.stringify(p));
    window.location.href = "/";
  }

  const hayFiltros = q || equipo || vendedor || minPrecio || maxPrecio || desde || hasta;
  const total = useMemo(() => items.length, [items]);

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";
  const labelCls = "block text-xs font-semibold text-gray-600";

  return (
    <main className="min-h-screen bg-gray-50 text-[#20242a]">
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Sistemas y Soluciones" className="h-10 w-auto" />
            <div>
              <h1 className="font-bold">{`Sistemas y Soluciones Digitales SRL`}</h1>
              <p className="text-xs text-gray-500">Historial de presupuestos de equipos</p>
            </div>
          </div>
          <a href="/" className="rounded-full border border-gray-200 px-3 py-1 text-xs transition hover:bg-gray-50">← Volver al presupuestador</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className={labelCls}>Buscar (cliente, equipo, vendedor)</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: Huenu, Juan, María..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Equipo</label>
              <select value={equipo} onChange={(e) => setEquipo(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {opciones.equipos.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vendedor</label>
              <select value={vendedor} onChange={(e) => setVendedor(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {opciones.vendedores.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Precio desde (USD)</label>
              <input type="number" min="0" value={minPrecio} onChange={(e) => setMinPrecio(e.target.value)} placeholder="$ min" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Precio hasta (USD)</label>
              <input type="number" min="0" value={maxPrecio} onChange={(e) => setMaxPrecio(e.target.value)} placeholder="$ max" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Desde (fecha)</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hasta (fecha)</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={inputCls} />
            </div>
            <button onClick={limpiar} disabled={!hayFiltros}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40">
              Limpiar filtros
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">{loading ? "Cargando..." : `${total} presupuesto${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`}</p>

        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {/* Listado */}
        <div className="mt-3 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-orange-50/40">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{p.numero ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{[p.nombre, p.apellido].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.vendedor || "—"}</td>
                  <td className="px-4 py-3 font-medium">{p.equipo || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{usd(p.precio)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => editarPresupuesto(p)} className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100">Editar / PDF</button>
                      <button onClick={() => setDetalle(p)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200">Detalle</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {hayFiltros ? "No hay presupuestos que cumplan esos filtros." : "Todavía no hay presupuestos guardados. Generá uno en el presupuestador y tocá «Ver presupuesto»."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      {/* Detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetalle(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{[detalle.nombre, detalle.apellido].filter(Boolean).join(" ") || "Sin cliente"}</h2>
                <p className="text-sm text-gray-500">Nº {detalle.numero ?? "—"} · {new Date(detalle.created_at).toLocaleString("es-AR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => editarPresupuesto(detalle)} className="rounded-lg bg-[#E85500] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90">Editar y bajar PDF</button>
                <button onClick={() => setDetalle(null)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200">Cerrar</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Equipo</p>
                <p className="mt-1 font-semibold">{detalle.equipo || "—"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vendedor</p>
                <p className="mt-1 font-semibold">{detalle.vendedor || "—"}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Precio</p>
                <p className="mt-1 text-lg font-black text-orange-600">{usd(detalle.precio)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Empresa</p>
                <p className="mt-1 font-semibold">{detalle.empresa || "—"}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contacto</p>
                <p className="mt-1 text-sm">{detalle.email || "—"}</p>
                <p className="text-sm text-gray-500">{detalle.telefono || "—"}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contenido del PDF</p>
                <p className="mt-1 text-sm">Fotos: {detalle.opciones?.incluirFotos ? "Sí" : "No"}</p>
                <p className="text-sm">Folleto: {detalle.opciones?.incluirFolleto ? "Sí" : "No"}</p>
              </div>
            </div>

            {detalle.notas && (
              <div className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-700">Notas</p>
                <p className="mt-1">{detalle.notas}</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
