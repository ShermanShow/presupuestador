import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase no está configurado" }, { status: 503 });

  const sp = new URL(request.url).searchParams;
  const q = sp.get("q")?.trim() || "";
  const marca = sp.get("marca")?.trim() || "";
  const modelo = sp.get("modelo")?.trim() || "";
  const vendedor = sp.get("vendedor")?.trim() || "";
  const estado = sp.get("estado")?.trim() || "";
  const minRenta = sp.get("min_renta");
  const maxRenta = sp.get("max_renta");
  const desde = sp.get("desde");
  const hasta = sp.get("hasta");
  const limit = Math.min(Math.max(parseInt(sp.get("limit") || "200", 10) || 200, 1), 500);

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  let query = supabase.from("presupuestos_alquiler").select("*");
  if (q)
    query = query.or(`cliente.ilike.%${q}%,vendedor.ilike.%${q}%,equipo_snapshot->>modelo.ilike.%${q}%,equipo_snapshot->>marca.ilike.%${q}%`);
  if (marca) query = query.eq("equipo_snapshot->>marca", marca);
  if (modelo) query = query.eq("equipo_snapshot->>modelo", modelo);
  if (vendedor) query = query.ilike("vendedor", `%${vendedor}%`);
  if (estado) query = query.eq("estado", estado);
  if (minRenta) query = query.gte("renta_final_ars", Number(minRenta));
  if (maxRenta) query = query.lte("renta_final_ars", Number(maxRenta));
  if (desde) query = query.gte("fecha", new Date(desde).toISOString());
  if (hasta) query = query.lte("fecha", new Date(hasta).toISOString());
  query = query.order("fecha", { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Error leyendo presupuestos de alquiler:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ presupuestos: data || [] });
}

export async function POST(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase no está configurado" }, { status: 503 });

  const payload = await request.json();
  const row = {
    numero: `ALQ-${Date.now()}`,
    fecha: new Date().toISOString(),
    cliente: payload.cliente || null,
    contacto: payload.contacto || null,
    email: payload.email || null,
    telefono: payload.telefono || null,
    vendedor: payload.vendedor || null,
    equipo_id: payload.equipo_id,
    equipo_snapshot: payload.equipo_snapshot,
    valor_equipo_usd: payload.valor_equipo_usd,
    amortizacion_meses: payload.amortizacion_meses,
    dolar: payload.dolar,
    copias_bn_incluidas: payload.copias_bn_incluidas,
    precio_bn_usd: payload.precio_bn_usd,
    copias_color_incluidas: payload.copias_color_incluidas,
    cpc_color_usd: payload.cpc_color_usd,
    multiplicador_color: payload.multiplicador_color,
    precio_color_usd: payload.precio_color_usd,
    renta_sugerida_usd: payload.renta_sugerida_usd,
    renta_sugerida_ars: payload.renta_sugerida_ars,
    renta_final_ars: payload.renta_final_ars,
    excedente_bn_ars: payload.excedente_bn_ars,
    excedente_color_ars: payload.excedente_color_ars,
    validez_dias: payload.validez_dias ?? 15,
    observaciones: payload.observaciones || null,
    estado: payload.estado || "BORRADOR",
  };
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("presupuestos_alquiler").insert(row).select("*").single();
  if (error) {
    console.error("Error guardando alquiler:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, presupuesto: data });
}
