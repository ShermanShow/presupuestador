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
  if (!url || !key) return NextResponse.json({ equipos: fallbackEquipos, config: fallbackConfig, source: "demo" });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [{ data: equipos, error: equiposError }, { data: config, error: configError }] = await Promise.all([
    supabase.from("equipos_alquiler").select("*").order("marca").order("modelo"),
    supabase.from("config_alquileres").select("*").order("clave"),
  ]);

  if (equiposError || configError) {
    return NextResponse.json({ equipos: fallbackEquipos, config: fallbackConfig, source: "demo", warning: equiposError?.message || configError?.message }, { status: 200 });
  }
  return NextResponse.json({ equipos: (equipos || []).map(normalizeEquipo), config: normalizeConfig((config || []) as Record<string, unknown>[]), source: "supabase" });
}
