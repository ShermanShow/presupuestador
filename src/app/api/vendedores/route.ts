import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminPassword = () => process.env.ADMIN_PASSWORD || "1234";
const authorized = (request: NextRequest) => request.headers.get("x-admin-password") === adminPassword();
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase no configurado");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const query = client().from("vendedores").select("id,nombre,email,telefono,activo,created_at,updated_at").order("nombre");
    const { data, error } = await (authorized(request) ? query : query.eq("activo", true));
    if (error) throw error;
    return NextResponse.json({ vendedores: data || [] });
  } catch (error) {
    console.error("Error leyendo vendedores:", error);
    return NextResponse.json({ error: "No se pudieron cargar los vendedores" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  try {
    const body = await request.json();
    const values = { nombre: String(body.nombre || "").trim(), email: String(body.email || "").trim(), telefono: String(body.telefono || "").trim() };
    if (!values.nombre || !values.email || !values.telefono) return NextResponse.json({ error: "Nombre, mail y teléfono son obligatorios" }, { status: 400 });
    const { data, error } = await client().from("vendedores").insert(values).select("id,nombre,email,telefono,activo").single();
    if (error) throw error;
    return NextResponse.json({ vendedor: data }, { status: 201 });
  } catch (error) {
    console.error("Error creando vendedor:", error);
    return NextResponse.json({ error: "No se pudo crear el vendedor" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id || "");
    const values = { nombre: String(body.nombre || "").trim(), email: String(body.email || "").trim(), telefono: String(body.telefono || "").trim() };
    if (!id || !values.nombre || !values.email || !values.telefono) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    const { data, error } = await client().from("vendedores").update({ ...values, activo: body.activo !== false, updated_at: new Date().toISOString() }).eq("id", id).select("id,nombre,email,telefono,activo").single();
    if (error) throw error;
    return NextResponse.json({ vendedor: data });
  } catch (error) {
    console.error("Error actualizando vendedor:", error);
    return NextResponse.json({ error: "No se pudo actualizar el vendedor" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Falta el vendedor" }, { status: 400 });
    const { error } = await client().from("vendedores").update({ activo: false, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error desactivando vendedor:", error);
    return NextResponse.json({ error: "No se pudo desactivar el vendedor" }, { status: 400 });
  }
}
