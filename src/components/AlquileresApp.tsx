// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FOTO_POR_MODELO } from "@/config/equiposFotos";

type Equipo = {
  id: string; activo: boolean; marca: string; modelo: string; tipo: string; tecnologia: string;
  toner: string; platina: string; ppm: number; ppmTexto: string; capacidad: number; red: string;
  duplex: boolean; duplexScan: boolean; ardf: boolean; copia: boolean; scan: boolean;
  equipoUsd: number; cpcBnUsd: number; cpcColorUsd: number;
  fotoUrl?: string;
};
type Config = { dolar: number; amortizacionMeses: number; precioBnUsd: number; multiplicadorColor: number };

const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const usd = (n: number) => `USD ${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(n || 0)}`;


function ProposalPreview({ selected, client, setClient, seller, setSeller, rent, setRent, validity, setValidity, notes, setNotes, bnCopies, bnUsd, colorCopies, colorCpc, colorMult, dolar }: any) {
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const features = [
    selected.copia && selected.scan ? "Copiadora / Impresora / Escáner." : selected.copia ? "Copiadora / Impresora." : "Impresora.",
    selected.ppm ? `${selected.ppm} páginas por minuto.` : "",
    selected.capacidad ? `Capacidad declarada: ${selected.capacidad} hojas.` : "",
    selected.duplex ? "Dúplex automático." : "",
    selected.ardf ? "ARDF / alimentador." : "",
    selected.duplexScan ? "Scan dúplex." : "",
    selected.red ? "Conectividad a red / Wi-Fi." : "",
  ].filter(Boolean);
  async function downloadPdf() {
    setDownloading(true);
    setPdfError("");
    try {
      const node = document.getElementById("proposal-pdf");
      if (!node) return;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210; const pageHeight = 297; const margin = 8;
      const imageWidth = pageWidth - margin * 2; const imageHeight = canvas.height * imageWidth / canvas.width;
      const pageContentHeight = pageHeight - margin * 2;
      let offset = 0; let page = 0;
      while (offset < imageHeight) {
        if (page) pdf.addPage();
        const slice = document.createElement("canvas");
        const sliceHeight = Math.min(canvas.height - Math.floor(offset * canvas.width / imageWidth), Math.floor(pageContentHeight * canvas.width / imageWidth));
        slice.width = canvas.width; slice.height = sliceHeight;
        slice.getContext("2d")?.drawImage(canvas, 0, Math.floor(offset * canvas.width / imageWidth), canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        pdf.addImage(slice.toDataURL("image/png"), "PNG", margin, margin, imageWidth, sliceHeight * imageWidth / canvas.width);
        offset += pageContentHeight; page++;
      }
      const pad2 = (n: number) => String(n).padStart(2, "0");
      const now = new Date();
      const ts = `${pad2(now.getFullYear() % 100)}${pad2(now.getMonth() + 1)}${pad2(now.getHours())}${pad2(now.getMinutes())}`;
      const nombreArchivo = (client || "cliente").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      pdf.save(`${ts}-${nombreArchivo}.pdf`);
    } catch (err) {
      console.error("Error generando PDF de alquiler:", err);
      setPdfError("No se pudo generar el PDF. Revisá la consola (F12) y probá de nuevo.");
    } finally { setDownloading(false); }
  }
  const excedenteBn = bnUsd; const excedenteColor = colorCpc * colorMult;
  const fotoSrc = selected.fotoUrl || FOTO_POR_MODELO[`${selected.marca} ${selected.modelo}`] || null;
  return <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">4. Propuesta editable</p><h3 className="mt-1 text-xl font-bold">Vista previa del presupuesto</h3></div>
      <button onClick={downloadPdf} disabled={downloading} className="rounded-lg bg-[#f28c28] px-4 py-3 font-bold text-white disabled:opacity-60">{downloading ? "Generando PDF..." : "Descargar PDF"}</button>
    </div>
    {pdfError && <p className="mb-3 text-xs font-semibold text-red-600">{pdfError}</p>}
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-xs font-semibold text-gray-600">Cliente<input value={client} onChange={e => setClient(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-gray-600">Vendedor<input value={seller} onChange={e => setSeller(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-gray-600">Renta final (ARS)<input type="number" value={rent} onChange={e => setRent(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-gray-600">Validez (días)<input type="number" value={validity} onChange={e => setValidity(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-semibold text-gray-600 sm:col-span-2 lg:col-span-1">Observaciones<input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>
    </div>
    <div id="proposal-pdf" className="mx-auto max-w-[760px] bg-white px-8 py-8 text-[12px] leading-[1.45] text-[#111827]">
      <div className="flex items-center border-b pb-5" style={{ borderColor: "#e5e7eb" }}><img src="/logo.png" alt="Sistemas y Soluciones" className="h-12 w-auto" /></div>
      <div className="pt-7 text-right text-[10px]">Buenos Aires, {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())}</div>
      <h4 className="mt-5 text-[17px] font-black">{client || "Cliente"}</h4>
      <p className="mt-3">De nuestra mayor consideración, por la presente, de acuerdo a lo solicitado, tengo el agrado de hacerles llegar la siguiente propuesta de trabajo.</p>
      <h5 className="mt-7 border-b pb-2 text-[16px] font-black" style={{ borderColor: "#e5e7eb" }}> EQUIPOS A INSTALAR:</h5>
      <div className="mt-3 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="pl-4 text-[14px] font-black">Una (1) {selected.marca} {selected.modelo}</p>
          <p className="mt-2 pl-4 font-bold">Prestaciones más destacadas:</p>
          <ul className="mt-1 list-disc space-y-1 pl-10">{features.map((feature: string) => <li key={feature}>{feature}</li>)}</ul>
        </div>
        {fotoSrc && (
          <div className="w-44 shrink-0">
            <img src={fotoSrc} alt={`${selected.marca} ${selected.modelo}`} className="w-full" />
          </div>
        )}
      </div>
      <h5 className="mt-7 border-b pb-2 text-[16px] font-black" style={{ borderColor: "#e5e7eb" }}> CONDICIONES DE CONTRATACIÓN:</h5>
      <p className="mt-3 pl-4"><b> Valor de renta:</b> El precio del alquiler mensual del equipo es de <b>{money(rent)}</b> e incluye las primeras {bnCopies} impresiones B&N del mes.</p>
      <p className="mt-2 pl-4"><b> Excedente:</b> El valor de la impresión B&N es de <b>{money(excedenteBn * dolar)}</b> por copia.</p>
      {colorCopies > 0 && <p className="mt-2 pl-4"><b> Excedente color:</b> El valor por copia color es de <b>{money(excedenteColor * dolar)}</b>.</p>}
      <h5 className="mt-7 border-b pb-2 text-[16px] font-black" style={{ borderColor: "#e5e7eb" }}> MODALIDAD DE SERVICIO:</h5>
      <p className="mt-3">El servicio incluye:</p>
      <ul className="mt-1 list-disc space-y-1 pl-6"><li>Instalación y configuración de los equipos.</li><li>Todos los insumos y mano de obra incluidos en caso de renta (menos el papel).</li><li>Mano de obra on site.</li><li>Compromiso con la calidad del servicio.</li><li>Los precios están expresados en pesos y no incluyen el IVA.</li><li>La oferta tiene validez por {validity} días.</li></ul>
      {notes && <p className="mt-4"><b>Observaciones:</b> {notes}</p>}
      <p className="mt-8">Quedando a su disposición por cualquier inquietud, lo saludo muy atentamente.</p>
      <p className="mt-8 font-bold">{seller || "Sistemas y Soluciones"}</p>
      <div className="mt-10 grid grid-cols-4 border-t pt-2 text-center text-[8px]" style={{ borderColor: "#d1d5db", color: "#6b7280" }}><span>Web<br />sistemassoluciones.com</span><span>E-mail<br />info@sistemassoluciones.com</span><span>Dirección<br />Curapalige 510 - Nave 7</span><span>Teléfono<br />011 - 4342 5742</span></div>
    </div>
  </section>;
}

export default function AlquileresApp() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [config, setConfig] = useState<Config>({ dolar: 1550, amortizacionMeses: 15, precioBnUsd: .02, multiplicadorColor: 3 });
  const [bna, setBna] = useState<number | null>(null); const [source, setSource] = useState("demo"); const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(""); const [search, setSearch] = useState(""); const [tipo, setTipo] = useState(""); const [marca, setMarca] = useState(""); const [toner, setToner] = useState(""); const [platina, setPlatina] = useState(""); const [minPpm, setMinPpm] = useState(0); const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  const [copy, setCopy] = useState(false); const [scan, setScan] = useState(false); const [duplex, setDuplex] = useState(false); const [ardf, setArdf] = useState(false); const [duplexScan, setDuplexScan] = useState(false); const [network, setNetwork] = useState(false);
  const [sort, setSort] = useState("price"); const [client, setClient] = useState(""); const [seller, setSeller] = useState("Sistemas"); const [notes, setNotes] = useState(""); const [saved, setSaved] = useState("");
  const [amort, setAmort] = useState(15); const [validity, setValidity] = useState(7); const [dolar, setDolar] = useState(1550); const [bnCopies, setBnCopies] = useState(2000); const [bnUsd, setBnUsd] = useState(.02); const [colorCopies, setColorCopies] = useState(0); const [colorCpc, setColorCpc] = useState(0); const [colorMult, setColorMult] = useState(3); const [finalRent, setFinalRent] = useState<number | null>(null);

  // Detección de cambios sin guardar
  const [cleanSignature, setCleanSignature] = useState<string | null>(null);
  const propSignature = JSON.stringify([client, seller, finalRent, validity, notes, selectedId, amort, dolar, bnCopies, bnUsd, colorCopies, colorCpc, colorMult]);
  const dirty = cleanSignature !== null && propSignature !== cleanSignature;

  // Tomar el estado cargado como "limpio" recién cuando termina la carga inicial
  useEffect(() => {
    if (!loading && cleanSignature === null) setCleanSignature(propSignature);
  }, [loading, cleanSignature, propSignature]);

  // Avisar al intentar salir / cerrar / recargar con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => { Promise.all([fetch("/api/alquileres/equipos").then(r => r.json()), fetch("/api/cotizacion-bna").then(r => r.ok ? r.json() : null)]).then(([data, quote]) => { const list = Array.isArray(data.equipos) ? data.equipos : []; setEquipos(list); setSource(data.source || "demo"); if (data.config) { setConfig(data.config); setAmort(data.config.amortizacionMeses); setDolar(data.config.dolar); setBnUsd(data.config.precioBnUsd); setColorMult(data.config.multiplicadorColor); } if (quote?.venta) { setBna(quote.venta); setDolar(quote.venta); } if (list[0]) { setSelectedId(list[0].id); setColorCpc(list[0].cpcColorUsd || 0); } }).catch(() => setSaved("No se pudo cargar el catálogo.")).finally(() => setLoading(false)); }, []);

  const options = (key: keyof Equipo) => [...new Set(equipos.map(e => String(e[key] || "")).filter(Boolean))].sort();
  const filtered = useMemo(() => equipos.filter(e => { const q = `${e.marca} ${e.modelo} ${e.tecnologia}`.toLowerCase(); return (includeDiscontinued || e.activo) && (!search || q.includes(search.toLowerCase())) && (!tipo || e.tipo === tipo) && (!marca || e.marca === marca) && (!toner || e.toner === toner) && (!platina || e.platina === platina) && e.ppm >= minPpm && (!copy || e.copia) && (!scan || e.scan) && (!duplex || e.duplex) && (!ardf || e.ardf) && (!duplexScan || e.duplexScan) && (!network || Boolean(e.red)); }), [equipos, includeDiscontinued, search, tipo, marca, toner, platina, minPpm, copy, scan, duplex, ardf, duplexScan, network]).sort((a, b) => sort === "ppm" ? b.ppm - a.ppm : sort === "cpc" ? a.cpcBnUsd - b.cpcBnUsd : a.equipoUsd - b.equipoUsd);
  const selected = equipos.find(e => e.id === selectedId) || null; const equipoUsd = selected?.equipoUsd || 0; const amortUsd = equipoUsd / Math.max(1, amort); const bnComponent = bnCopies * Math.max(0, bnUsd); const colorComponent = colorCopies * Math.max(0, colorCpc) * Math.max(0, colorMult); const rentUsd = amortUsd + bnComponent + colorComponent; const suggested = Math.round(rentUsd * Math.max(0, dolar)); const rent = finalRent ?? suggested;
  const selectValues = (value: string, setter: (v: string) => void, values: string[], first: string) => <select value={value} onChange={e => setter(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">{first}</option>{values.map(v => <option key={v}>{v}</option>)}</select>;
  const required = (value: boolean, setter: (v: boolean) => void, label: string) => <label className="block text-xs font-semibold text-gray-600">{label}<select value={value ? "SI" : ""} onChange={e => setter(e.target.value === "SI")} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">No importa</option><option value="SI">Sí</option></select></label>;
  function choose(e: Equipo) { setSelectedId(e.id); setColorCpc(e.cpcColorUsd || 0); setFinalRent(null); }
  function reset() { setSearch(""); setTipo(""); setMarca(""); setToner(""); setPlatina(""); setMinPpm(0); setIncludeDiscontinued(false); setCopy(false); setScan(false); setDuplex(false); setArdf(false); setDuplexScan(false); setNetwork(false); }
  async function save() { if (!selected) return; setSaved("Guardando..."); const payload = { cliente: client || null, vendedor: seller, equipo_id: selected.id.startsWith("demo-") ? null : selected.id, equipo_snapshot: selected, valor_equipo_usd: equipoUsd, amortizacion_meses: amort, dolar, copias_bn_incluidas: bnCopies, precio_bn_usd: bnUsd, copias_color_incluidas: colorCopies, cpc_color_usd: colorCpc, multiplicador_color: colorMult, precio_color_usd: colorCpc * colorMult, renta_sugerida_usd: rentUsd, renta_sugerida_ars: suggested, renta_final_ars: rent, excedente_bn_ars: bnUsd * dolar, excedente_color_ars: colorCpc * colorMult * dolar, observaciones: notes || null }; const r = await fetch("/api/alquileres/guardar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await r.json(); if (r.ok) setCleanSignature(propSignature); setSaved(r.ok ? "Presupuesto guardado." : `No se pudo guardar: ${data.error || "error desconocido"}`); }

  return <main className="min-h-screen bg-[#f5f6f8] text-[#20242a]"><header className="bg-gradient-to-r from-[#2f3237] to-[#44484f] px-5 py-4 text-white"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><img src="/logo.png" alt="Sistemas y Soluciones" className="h-11 w-auto" /><div><h1 className="font-bold">Sistemas y Soluciones Digitales SRL</h1><p className="text-xs text-gray-300">Cotizador de alquileres</p></div></div><div className="flex flex-wrap gap-2 text-xs">{dirty && <span className="rounded-full border border-amber-300 bg-amber-400/20 px-3 py-1 font-semibold text-amber-200">⚠ Sin guardar</span>}<span className="rounded-full border border-white/20 px-3 py-1">Datos: {source}</span><span className="rounded-full border border-white/20 px-3 py-1">BNA venta: {bna ? money(bna) : "no disponible"}</span><a href="/alquileres/historial" onClick={(e) => { if (dirty && !window.confirm("Hay cambios sin guardar. ¿Querés salir igual?")) e.preventDefault(); }} className="rounded-full border border-white/20 px-3 py-1 transition hover:bg-white/10">Historial</a></div></div></header><div className="mx-auto max-w-[1500px] px-4 py-6"><div className="mb-5"><h2 className="text-2xl font-bold">Encontrá el equipo adecuado y calculá el alquiler</h2><p className="mt-1 text-sm text-gray-500">Cada filtro reduce el listado a los equipos compatibles con la necesidad del cliente.</p></div><div className="grid gap-5 lg:grid-cols-[360px_1fr]"><aside className="rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-200 px-5 py-4"><h3 className="font-bold"><span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-xs text-orange-700">1</span> Necesidad del cliente</h3><span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700">FILTROS</span></div><div className="p-5"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">Tipo de impresión</p><div className="mb-4 grid grid-cols-3 gap-2">{[["", "Todos"], ["B&N", "Blanco y negro"], ["COLOR", "Color"]].map(([v, l]) => <button key={v} onClick={() => setTipo(v)} className={`rounded-lg border px-2 py-2 text-xs ${tipo === v ? "border-orange-400 bg-orange-50 font-bold text-orange-700" : "border-gray-200"}`}>{l}</button>)}</div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-gray-600">Tamaño / platina{selectValues(platina, setPlatina, options("platina"), "Cualquiera")}</label><label className="block text-xs font-semibold text-gray-600">Velocidad mínima<select value={minPpm} onChange={e => setMinPpm(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="0">Cualquiera</option>{[20,25,30,35,40,50].map(v => <option key={v} value={v}>{v} ppm</option>)}</select></label><label className="block text-xs font-semibold text-gray-600">Marca{selectValues(marca, setMarca, options("marca"), "Todas")}</label><label className="block text-xs font-semibold text-gray-600">Tóner{selectValues(toner, setToner, options("toner"), "Cualquiera")}</label></div><p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-gray-600">Funciones obligatorias</p><div className="grid gap-3 sm:grid-cols-2">{required(copy, setCopy, "Copiadora")}{required(scan, setScan, "Escáner")}{required(duplex, setDuplex, "Dúplex")}{required(ardf, setArdf, "ARDF / alimentador")}{required(duplexScan, setDuplexScan, "Escaneo doble faz")}{required(network, setNetwork, "Red")}</div><label className="mt-3 block text-xs font-semibold text-gray-600">Incluir discontinuados<select value={includeDiscontinued ? "SI" : ""} onChange={e => setIncludeDiscontinued(e.target.value === "SI")} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">No</option><option value="SI">Sí, para consultar histórico</option></select></label><div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4"><button onClick={reset} className="text-xs font-bold text-orange-700">Limpiar filtros</button><b className="text-sm">{loading ? "Cargando..." : `${filtered.length} equipos`}</b></div></div></aside><section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4"><h3 className="font-bold">Equipos compatibles</h3><select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"><option value="price">Ordenar por precio</option><option value="cpc">Ordenar por CPC B&N</option><option value="ppm">Ordenar por velocidad</option></select></div><div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-4 sm:grid-cols-4"><div><b className="block text-xl">{filtered.length}</b><span className="text-xs text-gray-500">compatibles</span></div><div><b className="block text-xl">{filtered.length ? Math.max(...filtered.map(e => e.ppm)) : 0}</b><span className="text-xs text-gray-500">PPM máximo</span></div><div><b className="block text-xl">{filtered.length ? usd(Math.min(...filtered.map(e => e.cpcBnUsd))) : ""}</b><span className="text-xs text-gray-500">CPC B&N mínimo</span></div><div><b className="block text-xl">{filtered.length ? usd(Math.min(...filtered.map(e => e.equipoUsd))) : ""}</b><span className="text-xs text-gray-500">Equipo desde</span></div></div><div className="max-h-[620px] overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="sticky top-0 bg-gray-50 text-[11px] uppercase text-gray-500"><tr><th className="px-4 py-3">Equipo</th><th className="px-4 py-3">Tipo / tamaño</th><th className="px-4 py-3">PPM</th><th className="px-4 py-3">Funciones</th><th className="px-4 py-3">CPC B&N</th><th className="px-4 py-3">CPC color</th><th className="px-4 py-3">Valor USD</th><th /></tr></thead><tbody>{filtered.length ? filtered.map(e => <tr key={e.id} className={`border-t border-gray-100 ${selectedId === e.id ? "bg-orange-50" : "hover:bg-orange-50"}`}><td className="px-4 py-3 font-semibold">{e.marca} {e.modelo}<div className="text-xs font-normal text-gray-400">{e.tecnologia} - {e.toner || ""}{!e.activo && " - DISCONTINUADO"}</div></td><td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold">{e.tipo}</span><div className="mt-2 text-xs text-gray-500">{e.platina || ""}</div></td><td className="px-4 py-3 font-bold">{e.ppmTexto || e.ppm || ""}</td><td className="px-4 py-3 text-xs">{[e.copia && "Copia", e.scan && "Scan", e.duplex && "Dúplex", e.ardf && "ARDF", e.red && "Red"].filter(Boolean).join(" - ") || ""}</td><td className="px-4 py-3">{usd(e.cpcBnUsd)}</td><td className="px-4 py-3">{e.cpcColorUsd ? usd(e.cpcColorUsd) : ""}</td><td className="px-4 py-3">{usd(e.equipoUsd)}</td><td className="px-4 py-3"><button onClick={() => choose(e)} className="rounded-lg bg-[#f28c28] px-3 py-2 text-xs font-bold text-white">Elegir</button></td></tr>) : <tr><td colSpan={8} className="p-12 text-center text-sm text-gray-500"><b>No hay equipos que cumplan todos los filtros.</b><br />Probá aflojando algún requisito.</td></tr>}</tbody></table></div></section></div>{selected && <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]"><div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-orange-600">2. Cálculo del alquiler</p><h3 className="mt-1 text-xl font-bold">{selected.marca} {selected.modelo}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Amortización (meses)", amort, setAmort], ["Dólar", dolar, setDolar], ["Copias B&N", bnCopies, setBnCopies], ["Precio B&N (USD)", bnUsd, setBnUsd], ["Copias color", colorCopies, setColorCopies], ["CPC color (USD)", colorCpc, setColorCpc], ["Multiplicador color", colorMult, setColorMult]].map(([label, value, set]) => <label key={String(label)} className="text-xs font-semibold text-gray-600">{String(label)}<input type="number" value={value as number} onChange={e => (set as (v: number) => void)(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>)}</div><div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm"><div className="flex justify-between border-b border-dashed border-orange-200 py-2"><span>Amortización mensual</span><strong>{usd(amortUsd)}</strong></div><div className="flex justify-between border-b border-dashed border-orange-200 py-2"><span>Copias B&N incluidas</span><strong>{usd(bnComponent)}</strong></div><div className="flex justify-between border-b border-dashed border-orange-200 py-2"><span>Copias color incluidas</span><strong>{usd(colorComponent)}</strong></div><div className="flex justify-between pt-3 font-bold"><span>Renta mensual sugerida</span><strong>{usd(rentUsd)}</strong></div></div><div className="mt-4 rounded-xl bg-[#30343a] p-5 text-white"><p className="text-xs uppercase tracking-widest text-gray-300">Renta sugerida</p><div className="mt-1 text-3xl font-black">{money(suggested)} + IVA</div><p className="mt-1 text-xs text-gray-300">Podés modificar el valor final antes de guardar.</p></div></div><div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-orange-600">3. Datos de la propuesta</p><div className="mt-4 space-y-3"><label className="block text-xs font-semibold text-gray-600">Cliente<input value={client} onChange={e => setClient(e.target.value)} placeholder="Nombre o empresa" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold text-gray-600">Vendedor<input value={seller} onChange={e => setSeller(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold text-gray-600">Renta final (ARS)<input type="number" value={finalRent ?? suggested} onChange={e => setFinalRent(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label><label className="block text-xs font-semibold text-gray-600">Notas<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label></div><button onClick={save} className="mt-5 w-full rounded-lg bg-[#f28c28] px-4 py-3 font-bold text-white">Guardar presupuesto</button>{saved && <p className="mt-3 text-sm text-gray-600">{saved}</p>}</div></section>}{selected && <ProposalPreview selected={selected} client={client} setClient={setClient} seller={seller} setSeller={setSeller} rent={rent} setRent={setFinalRent} validity={validity} setValidity={setValidity} notes={notes} setNotes={setNotes} bnCopies={bnCopies} bnUsd={bnUsd} colorCopies={colorCopies} colorCpc={colorCpc} colorMult={colorMult} dolar={dolar} />}</div></main>;
}






