import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
