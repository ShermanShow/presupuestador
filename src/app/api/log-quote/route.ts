import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { vendedores } from "@/config/empresa";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cliente, producto, opciones, clientId } = body;

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
        "ClientId",
      ]);
    }

    // Si clientId provisto, buscar fila existente
    if (clientId) {
      const idCol = worksheet.getColumn("L"); // 12th column is ClientId
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if ((row.getCell(12).value || "") === clientId) {
          const existingNumero = row.getCell(2).value as number | undefined;
          return NextResponse.json({ ok: true, numero: existingNumero ?? null });
        }
      }
    }

    const baseNumero = 1100;
    const nextNumero = baseNumero + Math.max(0, worksheet.rowCount - 1);

    const vendedor = vendedores.find((v) => v.id === cliente.vendedorId)?.nombre ?? "";
    const equipo = producto.id === "otro" ? (cliente.nombrePersonalizado || "Equipo a cotizar") : producto.nombre;
    const fechaNow = new Date().toLocaleString("es-AR");

    const newRow = [
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
      clientId || "",
    ];

    worksheet.addRow(newRow);
    await workbook.xlsx.writeFile(filePath);

    return NextResponse.json({ ok: true, numero: nextNumero });
  } catch (err) {
    console.error("Error guardando log de presupuesto:", err);
    return NextResponse.json({ error: "Error guardando" }, { status: 500 });
  }
}
