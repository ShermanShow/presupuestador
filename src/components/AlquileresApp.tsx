"use client";

import { useEffect, useMemo, useState } from "react";

type Equipo = {
  id: string; marca: string; modelo: string; tipo: string; tecnologia: string;
  ppm: number; duplex: boolean; scan: boolean; equipoUsd: number;
  cpcBnUsd: number; cpcColorUsd: number; fotoUrl?: string;
};
type Config = { dolar: number; amortizacionMeses: number; precioBnUsd: number; multiplicadorColor: number };

const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value || 0);
const usd = (value: number) => `USD ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(value || 0)}`;

export default function AlquileresApp() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [config, setConfig] = useState<Config>({ dolar: 1550, amortizacionMeses: 15, precioBnUsd: 0.02, multiplicadorColor: 3 });
  const [source, setSource] = useState<"demo" | "supabase">("demo");
  const [bnaQuote, setBnaQuote] = useState<{ venta: number; horaActualizacion: string | null } | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [onlyColor, setOnlyColor] = useState(false);
  const [client, setClient] = useState("");
  const [seller, setSeller] = useState("Sistemas");
  const [notes, setNotes] = useState("");
  const [amort, setAmort] = useState(15);
  const [dolar, setDolar] = useState(1550);
  const [bnCopies, setBnCopies] = useState(2000);
  const [bnUsd, setBnUsd] = useState(0.02);
  const [colorCopies, setColorCopies] = useState(0);
  const [colorCpc, setColorCpc] = useState(0);
  const [colorMult, setColorMult] = useState(3);
  const [finalRent, setFinalRent] = useState<number | null>(null);
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alquileres/equipos")
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data.equipos) ? data.equipos : [];
        setEquipos(list);
        setSource(data.source === "supabase" ? "supabase" : "demo");
        if (data.config) {
          setConfig(data.config);
          setAmort(data.config.amortizacionMeses);
          setDolar(data.config.dolar);
          setBnUsd(data.config.precioBnUsd);
          setColorMult(data.config.multiplicadorColor);
        }
        if (list[0]) {
          setSelectedId(list[0].id);
          setColorCpc(list[0].cpcColorUsd || 0);
        }
      })
      .catch(() => setSaved("No se pudo cargar el catálogo."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/cotizacion-bna")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("BNA no disponible")))
      .then((quote) => {
        setBnaQuote(quote);
        if (Number.isFinite(quote.venta)) setDolar(quote.venta);
      })
      .catch(() => setBnaQuote(null));
  }, []);

  const filtered = useMemo(() => equipos.filter((equipo) => {
    const haystack = `${equipo.marca} ${equipo.modelo} ${equipo.tecnologia}`.toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) &&
      (tipo === "TODOS" || equipo.tipo === tipo) && (!onlyColor || equipo.tipo === "COLOR");
  }), [equipos, search, tipo, onlyColor]);

  const selected = equipos.find((equipo) => equipo.id === selectedId) || null;
  const equipoUsd = selected?.equipoUsd || 0;
  const amortUsd = equipoUsd / Math.max(1, amort || config.amortizacionMeses);
  const bnComponent = bnCopies * Math.max(0, bnUsd);
  const colorComponent = colorCopies * Math.max(0, colorCpc) * Math.max(0, colorMult);
  const rentUsd = amortUsd + bnComponent + colorComponent;
  const suggested = Math.round(rentUsd * Math.max(0, dolar));
  const rent = finalRent ?? suggested;
  const bnExcedenteArs = Math.max(0, bnUsd) * Math.max(0, dolar);
  const colorExcedenteArs = Math.max(0, colorCpc) * Math.max(0, colorMult) * Math.max(0, dolar);
  const calculationFields: Array<[string, number, (value: number) => void]> = [
    ["Amortización (meses)", amort, setAmort], ["Dólar", dolar, setDolar],
    ["Copias B&N", bnCopies, setBnCopies], ["Precio B&N (USD)", bnUsd, setBnUsd],
    ["Copias color", colorCopies, setColorCopies], ["CPC color (USD)", colorCpc, setColorCpc],
    ["Multiplicador color", colorMult, setColorMult],
  ];

  function choose(equipo: Equipo) {
    setSelectedId(equipo.id);
    setColorCpc(equipo.cpcColorUsd || 0);
    setFinalRent(null);
  }

  async function save() {
    if (!selected) return;
    setSaved("Guardando...");
    const payload = {
      cliente: client || null, vendedor: seller, equipo_id: selected.id,
      equipo_snapshot: selected, valor_equipo_usd: equipoUsd, amortizacion_meses: amort, dolar,
      copias_bn_incluidas: bnCopies, precio_bn_usd: bnUsd, copias_color_incluidas: colorCopies,
      cpc_color_usd: colorCpc, multiplicador_color: colorMult, precio_color_usd: colorCpc * colorMult,
      renta_sugerida_usd: rentUsd, renta_sugerida_ars: suggested, renta_final_ars: rent,
      excedente_bn_ars: bnExcedenteArs, excedente_color_ars: colorExcedenteArs, observaciones: notes || null,
    };
    const response = await fetch("/api/alquileres/guardar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setSaved(response.ok ? "Presupuesto guardado." : `No se pudo guardar: ${data.error || "error desconocido"}`);
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#20242a]">
      <header className="bg-gradient-to-r from-[#2f3237] to-[#44484f] px-5 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><img src="/logo.png" alt="Sistemas y Soluciones" className="h-11 w-auto" /><div><h1 className="font-bold">Sistemas y Soluciones Digitales SRL</h1><p className="text-xs text-gray-300">Cotizador de alquileres</p></div></div>
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/20 px-3 py-1">Datos: {source === "supabase" ? "Supabase" : "demo"}</span><span className="rounded-full border border-white/20 px-3 py-1">Dólar: BNA venta {bnaQuote ? money(bnaQuote.venta) : "configuración"}</span><span className="rounded-full border border-white/20 px-3 py-1">Amortización default: {config.amortizacionMeses} meses</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="mb-5"><h2 className="text-2xl font-bold">Seleccioná el equipo y calculá el alquiler</h2><p className="mt-1 text-sm text-gray-500">Filtrá el catálogo y ajustá los parámetros de la propuesta.</p></div>
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold">1. Buscar equipo</h3>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Buscar modelo o marca</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ej: Ricoh IM..." className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <label className="mb-1 block text-xs font-semibold text-gray-600">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option>TODOS</option><option>B&N</option><option>COLOR</option></select>
            <label className="mb-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyColor} onChange={(e) => setOnlyColor(e.target.checked)} /> Solo color</label>
            <div className="border-t border-gray-100 pt-4 text-sm text-gray-500">{loading ? "Cargando catálogo..." : `${filtered.length} equipos encontrados`}</div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold">Catálogo de equipos</h3></div>
            <div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Equipo</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">PPM</th><th className="px-4 py-3">CPC B&N</th><th className="px-4 py-3">CPC color</th><th className="px-4 py-3">Valor</th><th /></tr></thead><tbody>{filtered.map((equipo) => <tr key={equipo.id} className={`border-t border-gray-100 ${selectedId === equipo.id ? "bg-orange-50" : "hover:bg-gray-50"}`}><td className="px-4 py-3 font-semibold">{equipo.marca} {equipo.modelo}<div className="text-xs font-normal text-gray-400">{equipo.tecnologia}</div></td><td className="px-4 py-3">{equipo.tipo}</td><td className="px-4 py-3">{equipo.ppm || "—"}</td><td className="px-4 py-3">{usd(equipo.cpcBnUsd)}</td><td className="px-4 py-3">{equipo.cpcColorUsd ? usd(equipo.cpcColorUsd) : "—"}</td><td className="px-4 py-3">{usd(equipo.equipoUsd)}</td><td className="px-4 py-3"><button onClick={() => choose(equipo)} className="rounded-lg bg-[#f28c28] px-3 py-2 text-xs font-bold text-white">Elegir</button></td></tr>)}</tbody></table></div>
          </section>
        </div>
        {selected && <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">2. Cálculo del alquiler</p><h3 className="mt-1 text-xl font-bold">{selected.marca} {selected.modelo}</h3></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">EDITABLE</span></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{calculationFields.map(([label, value, setter]) => <label key={label} className="text-xs font-semibold text-gray-600">{label}{label === "Dólar" && bnaQuote && <span className="ml-1 font-normal text-green-700">(BNA venta)</span>}<input type="number" value={value} onChange={(e) => setter(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" /></label>)}</div>
            <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm"><div className="flex justify-between border-b border-dashed border-orange-200 py-2"><span>Amortización mensual</span><strong>{usd(amortUsd)}</strong></div><div className="flex justify-between border-b border-dashed border-orange-200 py-2"><span>Copias B&N incluidas</span><strong>{usd(bnComponent)}</strong></div><div className="flex justify-between border-b border-dashed border-orange-200 py-2"><span>Copias color incluidas</span><strong>{usd(colorComponent)}</strong></div><div className="flex justify-between pt-3 font-bold"><span>Renta mensual sugerida</span><strong>{usd(rentUsd)}</strong></div></div>
            <div className="mt-4 rounded-xl bg-[#30343a] p-5 text-white"><p className="text-xs uppercase tracking-widest text-gray-300">Renta sugerida</p><div className="mt-1 text-3xl font-black">{money(suggested)} + IVA</div><p className="mt-1 text-xs text-gray-300">Podés modificar el valor final antes de guardar.</p></div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-orange-600">3. Datos de la propuesta</p><div className="mt-4 space-y-3"><label className="block text-xs font-semibold text-gray-600">Cliente<input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre o empresa" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" /></label><label className="block text-xs font-semibold text-gray-600">Vendedor<select value={seller} onChange={(e) => setSeller(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal"><option>Sistemas</option><option>Javier</option><option>Andrea</option></select></label><label className="block text-xs font-semibold text-gray-600">Renta final (ARS)<input type="number" value={finalRent ?? suggested} onChange={(e) => setFinalRent(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" /></label><label className="block text-xs font-semibold text-gray-600">Notas<textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal" /></label></div><button onClick={save} className="mt-5 w-full rounded-lg bg-[#f28c28] px-4 py-3 font-bold text-white hover:bg-orange-600">Guardar presupuesto</button>{saved && <p className="mt-3 text-sm text-gray-600">{saved}</p>}</div>
        </section>}
      </div>
    </main>
  );
}
