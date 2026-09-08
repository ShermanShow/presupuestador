import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { empresa } from "@/config/empresa";

export async function POST(req: NextRequest) {
  const { cliente, producto, vendedor: vendedorData } = await req.json();

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");

  if (!smtpUser || !smtpPass) {
    return NextResponse.json(
      { error: "SMTP no configurado. Completar .env.local" },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: #1d4ed8; padding: 24px 32px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Presupuesto</h1>
        <p style="color: #93c5fd; margin: 4px 0 0; font-size: 13px;">${empresa.nombre}</p>
      </div>
      <div style="background: #f9fafb; padding: 24px 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 15px;">Hola <strong>${cliente.nombre} ${cliente.apellido}</strong>,</p>
        <p>Te enviamos el presupuesto solicitado para el siguiente equipo:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #1d4ed8; color: white;">
              <th style="text-align: left; padding: 12px 16px;">Equipo</th>
              <th style="text-align: right; padding: 12px 16px;">Precio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 16px; border-bottom: 1px solid #f3f4f6;">
                <strong>${producto.nombre}</strong><br>
                <span style="color: #6b7280; font-size: 13px;">${producto.descripcion}</span>
              </td>
              <td style="padding: 16px; text-align: right; font-size: 20px; font-weight: bold; color: #1d4ed8; border-bottom: 1px solid #f3f4f6;">
                USD ${cliente.precio.toLocaleString("es-AR")}
              </td>
            </tr>
          </tbody>
        </table>

        ${cliente.notas ? `<p style="background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; font-size: 13px;"><strong>Notas:</strong> ${cliente.notas}</p>` : ""}

        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
          Este presupuesto tiene una validez de 15 días. Los precios están en dólares estadounidenses (USD).
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 13px; color: #6b7280;">
          <strong>${empresa.nombre}</strong><br>
          ${empresa.direccion}<br>
          ${empresa.telefono} | ${empresa.email}<br>
          ${empresa.web}
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${empresa.nombre}" <${smtpUser}>`,
      to: cliente.email,
      subject: `Presupuesto ${producto.nombre} — ${empresa.nombre}`,
      html,
    });
    // Guardar en Excel (no bloquear el envío de mail si falla)
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, "presupuestos.xlsx");

      const workbook = new ExcelJS.Workbook();
      let worksheet: ExcelJS.Worksheet;
      if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet("Presupuestos") || workbook.addWorksheet("Presupuestos");
      } else {
        worksheet = workbook.addWorksheet("Presupuestos");
        worksheet.addRow([
          "Fecha",
          "Nº de Presupuesto",
          "Vendedor",
          "Nombre",
          "Apellido",
          "Empresa",
          "Telefono",
          "Email",
          "Equipo",
          "Precio",
          "Notas adicionales",
        ]);
      }

      // Generar numero de presupuesto simple (base 1100 + filas existentes)
      const baseNumero = 1100;
      const nextNumero = worksheet.rowCount <= 1 ? baseNumero : baseNumero + (worksheet.rowCount - 1);

      const vendedor = vendedorData?.nombre ?? "";
      const equipo = producto.id === "otro" ? (cliente.nombrePersonalizado || "Equipo a cotizar") : producto.nombre;
      const fechaNow = new Date().toLocaleString("es-AR");

      worksheet.addRow([
        fechaNow,
        nextNumero,
        vendedor,
        cliente.nombre,
        cliente.apellido,
        cliente.empresa || "",
        cliente.telefono || "",
        cliente.email || "",
        equipo,
        cliente.precio ?? "",
        cliente.notas || "",
      ]);

      await workbook.xlsx.writeFile(filePath);
    } catch (err) {
      console.error("Error guardando en Excel:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando mail:", err);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
