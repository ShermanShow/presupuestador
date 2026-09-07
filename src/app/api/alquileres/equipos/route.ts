import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export type EquipoAlquiler = {
  id: string;
  activo: boolean;
  marca: string;
  modelo: string;
  tipo: string;
  tecnologia: string;
  toner: string;
  platina: string;
  ppm: number;
  ppmTexto: string;
  capacidad: number;
  red: string;
  duplex: boolean;
  duplexScan: boolean;
  ardf: boolean;
  copia: boolean;
  scan: boolean;
  equipoUsd: number;
  cpcBnUsd: number;
  cpcColorUsd: number;
  fotoUrl?: string;
};

export type ConfigAlquileres = {
  dolar: number;
  amortizacionMeses: number;
  precioBnUsd: number;
  multiplicadorColor: number;
};

const fallbackEquipos: EquipoAlquiler[] = [
  { id: "demo-ricoh-im550", activo: true, marca: "RICOH", modelo: "IM 550 SPF", tipo: "B&N", tecnologia: "LASER", toner: "ORIGINAL", platina: "OFICIO", ppm: 55, ppmTexto: "55", capacidad: 500, red: "SI", duplex: true, duplexScan: true, ardf: true, copia: true, scan: true, equipoUsd: 1350, cpcBnUsd: 0.0053, cpcColorUsd: 0 },
  { id: "demo-ricoh-imc300", activo: true, marca: "RICOH", modelo: "IM C300 F", tipo: "COLOR", tecnologia: "LASER", toner: "ORIGINAL", platina: "A4", ppm: 30, ppmTexto: "30", capacidad: 250, red: "SI", duplex: true, duplexScan: true, ardf: true, copia: true, scan: true, equipoUsd: 1263, cpcBnUsd: 0.0081, cpcColorUsd: 0.0425 },
  { id: "demo-xerox-c7020", activo: true, marca: "XEROX", modelo: "VERSALINK C7020 D", tipo: "COLOR", tecnologia: "LASER", toner: "ORIGINAL", platina: "A3", ppm: 20, ppmTexto: "20", capacidad: 520, red: "SI", duplex: true, duplexScan: true, ardf: true, copia: true, scan: true, equipoUsd: 1800, cpcBnUsd: 0.0163, cpcColorUsd: 0.0649 },
]; 

// Catálogo comercial compartido para alquileres. Los nombres de modelo se
// conservan tal como se usan internamente en la planilla de costos.
const catalogoKonica: EquipoAlquiler[] = [
  ["ACCPRESS C2060", "COLOR", 20500, 0.02, 0.0220848918, 60],
  ["ACCPRESS C3080", "COLOR", 25200, 0.02, 0.0220848918, 80],
  ["ACCPRESS C4065", "COLOR", 27350, 0.02, 0.0236782704, 65],
  ["ACCPRESS C4080", "COLOR", 34500, 0.02, 0.0236782704, 80],
  ["ACCPRINT C3070", "COLOR", 24000, 0.02, 0.0220848918, 70],
  ["ACCPRINT C3070L", "COLOR", 23000, 0.02, 0.0230866727, 70],
  ["BIZC558", "COLOR", 3850, 0.02, 0.0400680584, 55],
  ["BIZC658", "COLOR", 4050, 0.02, 0.0400680584, 65],
  ["BIZC659", "COLOR", 4550, 0.02, 0.0296223723, 65],
  ["C308-C368", "COLOR", 2600, 0.02, 0.0440193958, 30],
  ["C450I", "COLOR", 3600, 0.02, 0.0351719645, 45],
  ["C458", "COLOR", 3600, 0.02, 0.0402219095, 45],
  ["C550I", "COLOR", 3850, 0.02, 0.0351719645, 55],
  ["C6085", "COLOR", 31700, 0.02, 0.0180362422, 85],
  ["C6100", "COLOR", 31700, 0.02, 0.0180362422, 100],
  ["308-368", "B&N", 2450, 0.0075879250, 0, 36],
  ["450I", "B&N", 2900, 0.0069511612, 0, 45],
  ["458.0", "B&N", 3000, 0.0091872604, 0, 45],
  ["550I", "B&N", 3150, 0.0106775334, 0, 55],
  ["ACCPRESS 6120", "B&N", 12400, 0.0052190176, 0, 120],
  ["BIZ558E", "B&N", 3300, 0.0069601712, 0, 58],
  ["BIZ658E", "B&N", 3600, 0.0069601712, 0, 65],
  ["BIZ808", "B&N", 4150, 0.0065039412, 0, 80],
  ["BIZ958", "B&N", 4250, 0.0065039412, 0, 95],
  ["BIZPRO 1100", "B&N", 9350, 0.0053133683, 0, 100],
].map(([modelo, tipo, equipoUsd, cpcBnUsd, cpcColorUsd, ppm], index) => ({
  id: `catalogo-konica-${String(modelo).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  activo: true,
  marca: "KONICA MINOLTA",
  modelo: String(modelo),
  tipo: String(tipo),
  tecnologia: "LASER",
  toner: tipo === "COLOR" ? "CMYK" : "K",
  platina: "A3",
  ppm: Number(ppm),
  ppmTexto: String(ppm),
  capacidad: 0,
  red: "SI",
  duplex: true,
  duplexScan: true,
  ardf: true,
  copia: true,
  scan: true,
  equipoUsd: Number(equipoUsd),
  cpcBnUsd: Number(cpcBnUsd),
  cpcColorUsd: Number(cpcColorUsd),
}));

const catalogoCompleto = [...fallbackEquipos, ...catalogoKonica];

const fallbackConfig: ConfigAlquileres = { dolar: 1550, amortizacionMeses: 15, precioBnUsd: 0.02, multiplicadorColor: 3 };

function numberFrom(row: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

function textFrom(row: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) if (row[key] !== null && row[key] !== undefined) return String(row[key]);
  return fallback;
}

function boolFrom(row: Record<string, unknown>, keys: string[]) {
  const value = textFrom(row, keys).toLowerCase();
  return value === "true" || value === "si" || value === "sí" || value === "1";
}

function normalizeEquipo(row: Record<string, unknown>, index: number): EquipoAlquiler {
  return {
    id: textFrom(row, ["id", "uuid", "codigo", "row"], `equipo-${index}`),
    activo: boolFrom(row, ["activo", "active"]) || textFrom(row, ["estado"]).toUpperCase() !== "DISC.",
    marca: textFrom(row, ["marca", "brand"], "—"),
    modelo: textFrom(row, ["modelo", "model", "nombre"], "Equipo sin modelo"),
    tipo: textFrom(row, ["tipo", "tipo_equipo"], "B&N"),
    tecnologia: textFrom(row, ["tecnologia", "technology"], ""),
    toner: textFrom(row, ["toner_tipo", "toner"], ""),
    platina: textFrom(row, ["platina", "tamanio", "tamaño"], ""),
    ppm: numberFrom(row, ["ppm", "velocidad", "ppm_raw"]),
    ppmTexto: textFrom(row, ["ppm_texto", "ppm_raw", "ppm"], ""),
    capacidad: numberFrom(row, ["capacidad", "cap"]),
    red: textFrom(row, ["red"], ""),
    duplex: boolFrom(row, ["duplex", "doble_faz"]),
    duplexScan: boolFrom(row, ["duplex_scan", "dscan"]),
    ardf: boolFrom(row, ["ardf", "alimentador"]),
    copia: boolFrom(row, ["copia", "copy", "copiadora"]),
    scan: boolFrom(row, ["scan", "scanner", "escaner", "escanner"]),
    equipoUsd: numberFrom(row, ["equipo_usd", "valor_equipo_usd", "precio_usd", "valor_usd"]),
    cpcBnUsd: numberFrom(row, ["cpc_bn_usd", "costo_copia_bn_usd", "cpc_usd"]),
    cpcColorUsd: numberFrom(row, ["cpc_color_usd", "costo_copia_color_usd"]),
    fotoUrl: textFrom(row, ["foto_url", "imagen_url", "image_url", "foto"], "") || undefined,
  };
}

function normalizeConfig(rows: Record<string, unknown> | Record<string, unknown>[]): ConfigAlquileres {
  const list = Array.isArray(rows) ? rows : [rows];
  const values = new Map(list.map((row) => [String(row.clave || ""), Number(row.valor_numeric)]));
  const get = (keys: string[], fallback: number) => {
    for (const key of keys) if (Number.isFinite(values.get(key))) return values.get(key)!;
    return fallback;
  };
  return {
    dolar: get(["dolar", "tipo_cambio", "cotizacion_dolar"], fallbackConfig.dolar),
    amortizacionMeses: get(["amortizacion_meses", "meses_amortizacion", "amortizacion"], fallbackConfig.amortizacionMeses),
    precioBnUsd: get(["precio_bn_usd", "precio_copia_bn", "costo_bn_usd", "bn_usd", "cpc_bn_usd"], fallbackConfig.precioBnUsd),
    multiplicadorColor: get(["multiplicador_color", "color_mult"], fallbackConfig.multiplicadorColor),
  };
}

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ equipos: catalogoCompleto, config: fallbackConfig, source: "catalogo" });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: equipos, error: equiposError }, { data: config, error: configError }] = await Promise.all([
    supabase.from("equipos_alquiler").select("*").order("marca").order("modelo"),
    supabase.from("config_alquileres").select("*").order("clave"),
  ]);

  if (equiposError || configError) {
    return NextResponse.json({ equipos: catalogoCompleto, config: fallbackConfig, source: "catalogo", warning: equiposError?.message || configError?.message }, { status: 200 });
  }
  const dbEquipos = (equipos || []).map(normalizeEquipo);
  const claves = new Set(dbEquipos.map((equipo) => `${equipo.marca} ${equipo.modelo}`.toUpperCase()));
  const faltantes = catalogoKonica.filter((equipo) => !claves.has(`${equipo.marca} ${equipo.modelo}`.toUpperCase()));
  return NextResponse.json({ equipos: [...dbEquipos, ...faltantes], config: normalizeConfig((config || []) as Record<string, unknown>[]), source: faltantes.length ? "supabase+catalogo" : "supabase" });
}
