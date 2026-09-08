import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { empresa, vendedores } from "@/config/empresa";

async function enviarNotificacion() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass || smtpPass === "tu_contraseña_de_aplicacion_aqui") return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({
    from: `"${empresa.nombre}" <${smtpUser}>`,
    to: "emarti@sistemasysoluciones.com",
    subject: "Se cargaron presupuestos en el presupuestador",
    text: "Se cargaron presupuestos en el presupuestador",
  });
}

export async function GET(request: NextRequest) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const sp = new URL(request.url).searchParams;
  const q = sp.get("q")?.trim() || "";
  const equipo = sp.get("equipo")?.trim() || "";
  const vendedor = sp.get("vendedor")?.trim() || "";
  const minPrecio = sp.get("min_precio");
  const maxPrecio = sp.get("max_precio");
  const desde = sp.get("desde");
  const hasta = sp.get("hasta");
  const limit = Math.min(Math.max(parseInt(sp.get("limit") || "200", 10) || 200, 1), 500);

  let query = supabase
    .from("presupuestos")
    .select("id,numero,created_at,vendedor,nombre,apellido,empresa,telefono,email,equipo,precio,notas,opciones");
  if (q)
    query = query.or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,empresa.ilike.%${q}%,email.ilike.%${q}%,equipo.ilike.%${q}%,vendedor.ilike.%${q}%`);
  if (equipo) query = query.ilike("equipo", `%${equipo}%`);
  if (vendedor) query = query.ilike("vendedor", `%${vendedor}%`);
  if (minPrecio) query = query.gte("precio", Number(minPrecio));
  if (maxPrecio) query = query.lte("precio", Number(maxPrecio));
  if (desde) query = query.gte("created_at", new Date(desde).toISOString());
  if (hasta) query = query.lte("created_at", new Date(hasta).toISOString());
  query = query.order("created_at", { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("Error leyendo presupuestos:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ presupuestos: data || [] });
}

export async function PATCH(req: NextRequest) {
  const { id, cliente, producto, opciones } = await req.json();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }
  if (!id) return NextResponse.json({ error: "Falta el id del presupuesto" }, { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  try {
    let vendedor = vendedores.find((v) => v.id === cliente.vendedorId) ?? vendedores[0];
    const { data: vendedorDb } = await supabase
      .from("vendedores")
      .select("id,nombre,email,telefono,activo")
      .eq("id", cliente.vendedorId)
      .eq("activo", true)
      .maybeSingle();
    if (vendedorDb) vendedor = vendedorDb;
    const equipo = producto.id === "otro" ? (cliente.nombrePersonalizado || "Equipo a cotizar") : producto.nombre;

    const updates = {
      vendedor: vendedor.nombre,
      nombre: cliente.nombre,
      apellido: cliente.apellido || null,
      empresa: cliente.empresa || null,
      telefono: cliente.telefono || null,
      email: cliente.email || null,
      equipo,
      precio: cliente.precio ?? null,
      notas: cliente.notas || null,
      opciones: opciones || null,
    };

    const { data, error } = await supabase.from("presupuestos").update(updates).eq("id", id).select("numero").single();
    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Error actualizando en Supabase" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, presupuesto: data });
  } catch (err) {
    console.error("Error en /api/log-quote PATCH:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { cliente, producto, opciones, clientId } = await req.json();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase no configurado. Definir SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  try {
    let vendedor = vendedores.find((v) => v.id === cliente.vendedorId) ?? vendedores[0];
    const { data: vendedorDb } = await supabase
      .from("vendedores")
      .select("id,nombre,email,telefono,activo")
      .eq("id", cliente.vendedorId)
      .eq("activo", true)
      .maybeSingle();
    if (vendedorDb) vendedor = vendedorDb;
    const equipo = producto.id === "otro" ? (cliente.nombrePersonalizado || "Equipo a cotizar") : producto.nombre;

    // Evitar duplicados si clientId existe
    if (clientId) {
      const { data: existing } = await supabase
        .from("presupuestos")
        .select("numero")
        .eq("client_id", clientId)
        .limit(1)
        .single();
      if (existing && (existing as any).numero) {
        return NextResponse.json({ ok: true, numero: (existing as any).numero });
      }
    }

    const insertPayload = {
      vendedor: vendedor.nombre,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      empresa: cliente.empresa || null,
      telefono: cliente.telefono || null,
      email: cliente.email || null,
      equipo,
      precio: cliente.precio ?? null,
      notas: cliente.notas || null,
      client_id: clientId || null,
      opciones: opciones || null,
    };

    const { data, error } = await supabase
      .from("presupuestos")
      .insert(insertPayload)
      .select("numero")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Error guardando en Supabase" }, { status: 500 });
    }

    const numero = (data as any)?.numero ?? null;

    // Mantener un registro de cliente para el CRM, incluso si solo se cargó el nombre.
    const clientFields = {
      nombre: cliente.nombre,
      apellido: cliente.apellido || null,
      empresa: cliente.empresa || null,
      telefono: cliente.telefono || null,
      email: cliente.email || null,
      estado: "Presupuestado",
      origen: "presupuestador",
      updated_at: new Date().toISOString(),
    };
    let crmClient: any = null;
    if (cliente.email) {
      const result = await supabase.from("clientes").select("id").eq("email", cliente.email).limit(1).maybeSingle();
      crmClient = result.data;
    }
    if (!crmClient && cliente.telefono) {
      const result = await supabase.from("clientes").select("id").eq("telefono", cliente.telefono).limit(1).maybeSingle();
      crmClient = result.data;
    }
    if (crmClient) await supabase.from("clientes").update(clientFields).eq("id", crmClient.id);
    else await supabase.from("clientes").insert(clientFields);

    // Notificación por mail (sin bloquear la respuesta)
    enviarNotificacion().catch((err) => console.error("Error enviando notificación:", err));

    return NextResponse.json({ ok: true, numero });
  } catch (err) {
    console.error("Error en /api/log-quote:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
