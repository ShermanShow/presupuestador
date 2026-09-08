import { NextResponse } from "next/server";

const BNA_URL = "https://www.bna.com.ar/Personas";

function parseBnaBillete(html: string) {
  const match = html.match(/Dolar U\.S\.A<\/td>\s*<td>([\d.,]+)<\/td>\s*<td>([\d.,]+)<\/td>/i);
  if (!match) throw new Error("No se encontró la cotización billete del BNA");
  const number = (value: string) => Number(value.replace(/\./g, "").replace(",", "."));
  const updateMatch = html.match(/Hora Actualizaci[oó]n:\s*([^<]+)/i);
  return {
    compra: number(match[1]),
    venta: number(match[2]),
    horaActualizacion: updateMatch?.[1]?.trim() || null,
  };
}

export async function GET() {
  try {
    const response = await fetch(BNA_URL, { cache: "no-store", headers: { "User-Agent": "presupuestador/1.0" } });
    if (!response.ok) throw new Error(`BNA respondió ${response.status}`);
    const quote = parseBnaBillete(await response.text());
    return NextResponse.json({ ...quote, fuente: BNA_URL, obtenidoEn: new Date().toISOString() });
  } catch (error) {
    console.error("Error consultando BNA:", error);
    return NextResponse.json({ error: "No se pudo consultar la cotización oficial del BNA" }, { status: 503 });
  }
}
