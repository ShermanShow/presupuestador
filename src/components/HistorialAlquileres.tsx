"use client";

import { useEffect, useMemo, useState } from "react";

type PresupuestoAlquiler = {
  id: string;
  numero: string;
  fecha: string;
  cliente: string | null;
  vendedor: string | null;
  equipo_id: string | null;
  equipo_snapshot: {
    marca?: string;
    modelo?: string;
    tipo?: string;
    ppm?: number;
    tecnologia?: string;
  } | null;
  renta_final_ars: number | null;
  renta_sugerida_ars: number | null;
  renta_sugerida_usd: number | null;
  valor_equipo_usd: number | null;
  amortizacion_meses: number | null;
  dolar: number | null;
  copias_bn_incluidas: number | null;
  precio_bn_usd: number | null;
  copias_color_incluidas: number | null;
  cpc_color_usd: number | null;
  multiplicador_color: number | null;
  precio_color_usd: number | null;
  excedente_bn_ars: number | null;
  excedente_color_ars: number | null;
  validez_dias: number | null;
  observaciones: string | null;
  estado: string | null;
};

const ars = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
const usd = (n: number | null | undefined) =>
  n == null ? "—" : `USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n)}`;

function estadoBadge(estado: string | null) {
  switch ((estado || "").toUpperCase()) {
    case "ENVIADO": return "bg-green-100 text-green-700";
    case "COTIZADO": return "bg-blue-100 text-blue-700";
    case "CERRADO": return "bg-purple-100 text-purple-700";
    case "VENDIDO": return "bg-emerald-100 text-emerald-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function HistorialAlquileres() {
  const [items, setItems] = useState<PresupuestoAlquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState<PresupuestoAlquiler | null>(null);

  // Filtros
  const [q, setQ] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [estado, setEstado] = useState("");
  const [minRenta, setMinRenta] = useState("");
  const [maxRenta, setMaxRenta] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Opciones para los select (derivadas del listado completo)
  const [opciones, setOpciones] = useState<{ marcas: string[]; modelos: string[]; vendedores: string[]; estados: string[] }>({
    marcas: [], modelos: [], vendedores: [], estados: [],
  });

  useEffect(() => {
    fetch("/api/alquileres/guardar?limit=500")
      .then((r) => r.json())
      .then((d) => {
        const list: PresupuestoAlquiler[] = d.presupuestos || [];
        setOpciones({
          marcas: [...new Set(list.map((i) => i.equipo_snapshot?.marca).filter(Boolean))].sort() as string[],
          modelos: [...new Set(list.map((i) => i.equipo_snapshot?.modelo).filter(Boolean))].sort() as string[],
          vendedores: [...new Set(list.map((i) => i.vendedor).filter(Boolean))].sort() as string[],
          estados: [...new Set(list.map((i) => i.estado).filter(Boolean))].sort() as string[],
        });
      })
      .catch(() => {});
  }, []);

  function cargar() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (marca) params.set("marca", marca);
    if (modelo) params.set("modelo", modelo);
    if (vendedor) params.set("vendedor", vendedor);
    if (estado) params.set("estado", estado);
    if (minRenta) params.set("min_renta", minRenta);
    if (maxRenta) params.set("max_renta", maxRenta);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    fetch(`/api/alquileres/guardar?${params.toString()}`)
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
  }, [q, marca, modelo, vendedor, estado, minRenta, maxRenta, desde, hasta]);

  function limpiar() {
    setQ(""); setMarca(""); setModelo(""); setVendedor(""); setEstado("");
    setMinRenta(""); setMaxRenta(""); setDesde(""); setHasta("");
  }

  const hayFiltros = q || marca || modelo || vendedor || estado || minRenta || maxRenta || desde || hasta;
  const total = useMemo(() => items.length, [items]);

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm";
  const labelCls = "block text-xs font-semibold text-gray-600";

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#20242a]">
      <header className="bg-gradient-to-r from-[#2f3237] to-[#44484f] px-5 py-4 text-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Sistemas y Soluciones" className="h-11 w-auto" />
            <div>
              <h1 className="font-bold">Sistemas y Soluciones Digitales SRL</h1>
              <p className="text-xs text-gray-300">Historial de presupuestos de alquiler</p>
            </div>
          </div>
          <a href="/alquileres" className="rounded-full border border-white/20 px-3 py-1 text-xs transition hover:bg-white/10">← Volver al cotizador</a>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        {/* Filtros */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className={labelCls}>Buscar (cliente, equipo, vendedor)</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: RICOH, Juan, María..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Marca</label>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} className={inputCls}>
                <option value="">Todas</option>
                {opciones.marcas.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Modelo / equipo</label>
              <select value={modelo} onChange={(e) => setModelo(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {opciones.modelos.map((m) => <option key={m}>{m}</option>)}
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
              <label className={labelCls}>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {opciones.estados.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Renta final desde</label>
              <input type="number" min="0" value={minRenta} onChange={(e) => setMinRenta(e.target.value)} placeholder="$ min" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Renta final hasta</label>
              <input type="number" min="0" value={maxRenta} onChange={(e) => setMaxRenta(e.target.value)} placeholder="$ max" className={inputCls} />
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
                <th className="px-4 py-3 text-right">Renta final</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-orange-50/40">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(p.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">{p.numero}</td>
                  <td className="px-4 py-3 font-medium">{p.cliente || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.vendedor || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.equipo_snapshot?.marca || ""} {p.equipo_snapshot?.modelo || "—"}</span>
                    {p.equipo_snapshot?.tipo && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">{p.equipo_snapshot.tipo}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{ars(p.renta_final_ars)}</td>
                  <td className="px-4 py-3"><span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${estadoBadge(p.estado)}`}>{p.estado || "—"}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setDetalle(p)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200">Ver</button>
                  </td>
                </tr>
              ))}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {hayFiltros ? "No hay presupuestos que cumplan esos filtros." : "Todavía no hay presupuestos guardados. Generá uno en el cotizador y tocá «Guardar presupuesto»."}
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
                <h2 className="text-xl font-bold">{detalle.cliente || "Sin cliente"}</h2>
                <p className="text-sm text-gray-500">{detalle.numero} · {new Date(detalle.fecha).toLocaleString("es-AR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${estadoBadge(detalle.estado)}`}>{detalle.estado || "—"}</span>
                <button onClick={() => setDetalle(null)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200">Cerrar</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Equipo</p>
                <p className="mt-1 font-semibold">{detalle.equipo_snapshot?.marca || "—"} {detalle.equipo_snapshot?.modelo || ""}</p>
                <p className="text-xs text-gray-500">Tipo: {detalle.equipo_snapshot?.tipo || "—"} · PPM: {detalle.equipo_snapshot?.ppm ?? "—"} · {detalle.equipo_snapshot?.tecnologia || ""}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vendedor</p>
                <p className="mt-1 font-semibold">{detalle.vendedor || "—"}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Renta final</p>
                <p className="mt-1 text-lg font-black text-orange-600">{ars(detalle.renta_final_ars)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Renta sugerida</p>
                <p className="mt-1 font-semibold">{ars(detalle.renta_sugerida_ars)}</p>
                <p className="text-xs text-gray-400">{usd(detalle.renta_sugerida_usd)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Valor del equipo</p>
                <p className="mt-1 font-semibold">{usd(detalle.valor_equipo_usd)}</p>
                <p className="text-xs text-gray-400">{detalle.amortizacion_meses ?? "—"} meses de amortización</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dólar usado</p>
                <p className="mt-1 font-semibold">{usd(detalle.dolar)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Copias incluidas</p>
                <p className="mt-1 text-sm">B&N: {detalle.copias_bn_incluidas ?? "—"} · Color: {detalle.copias_color_incluidas ?? "—"}</p>
                <p className="text-xs text-gray-400">B&N {usd(detalle.precio_bn_usd)} · Color {usd(detalle.cpc_color_usd)} × {detalle.multiplicador_color ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Excedentes</p>
                <p className="mt-1 text-sm">B&N: {ars(detalle.excedente_bn_ars)}</p>
                <p className="text-sm">Color: {ars(detalle.excedente_color_ars)}</p>
              </div>
            </div>

            {detalle.observaciones && (
              <div className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-700">Observaciones</p>
                <p className="mt-1">{detalle.observaciones}</p>
              </div>
            )}
            <p className="mt-4 text-xs text-gray-400">Validez: {detalle.validez_dias ?? "—"} días</p>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
