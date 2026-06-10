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

export async function POST(req: NextRequest) {
  const { cliente, producto, opciones, clientId } = await req.json();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase no configurado. Definir SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  try {
    const vendedor = vendedores.find((v) => v.id === cliente.vendedorId) ?? vendedores[0];
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

    // Notificación por mail (sin bloquear la respuesta)
    enviarNotificacion().catch((err) => console.error("Error enviando notificación:", err));

    return NextResponse.json({ ok: true, numero });
  } catch (err) {
    console.error("Error en /api/log-quote:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
