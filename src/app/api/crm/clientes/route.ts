import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const pass = () => process.env.ADMIN_PASSWORD || "1234";
function db() { const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) throw new Error("Supabase no configurado"); return createClient(url, key, { auth: { persistSession: false } }); }
function ok(request: NextRequest) { return request.headers.get("x-admin-password") === pass(); }

export async function GET(request: NextRequest) {
  if (!ok(request)) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  const search = new URL(request.url).searchParams.get("q")?.trim() || "";
  const query = db().from("clientes").select("*").order("updated_at", { ascending: false }).limit(100);
  const { data, error } = search ? await query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,empresa.ilike.%${search}%,email.ilike.%${search}%,telefono.ilike.%${search}%`) : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ clientes: data || [] });
}

export async function POST(request: NextRequest) {
  if (!ok(request)) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  const body = await request.json();
  if (!String(body.nombre || "").trim()) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const { data, error } = await db().from("clientes").insert({ nombre: String(body.nombre).trim(), apellido: body.apellido || null, empresa: body.empresa || null, telefono: body.telefono || null, email: body.email || null, estado: body.estado || "Presupuestado", origen: "manual" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cliente: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!ok(request)) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  const body = await request.json();
  const { data, error } = await db().from("clientes").update({ nombre: body.nombre, apellido: body.apellido || null, empresa: body.empresa || null, telefono: body.telefono || null, email: body.email || null, estado: body.estado, updated_at: new Date().toISOString() }).eq("id", body.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cliente: data });
}
