"use client";

import { useState, useEffect } from "react";
import { Producto } from "@/config/empresa";
import { ClienteData, OpcionesPDF } from "./QuoteForm";
import type { QuotePDFProps } from "./QuotePDF";

const STORAGE_KEY = "presupuestador_ultimo_numero";
const NUMERO_INICIAL = 1100;

function obtenerSiguienteNumero(): number {
  const guardado = localStorage.getItem(STORAGE_KEY);
  return guardado ? parseInt(guardado) + 1 : NUMERO_INICIAL;
}

function guardarNumero(n: number) {
  localStorage.setItem(STORAGE_KEY, n.toString());
}

// Convierte un blob a PNG via canvas (para webp y SVG)
async function canvasConvert(blob: Blob, scale = 1): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      // SVGs sin width/height explícito reportan 0 — usamos A4 a 96dpi como fallback
      const w = img.naturalWidth  || 794;
      const h = img.naturalHeight || 1123;
      const canvas = document.createElement("canvas");
      canvas.width  = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error("no canvas ctx")); return; }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => { URL.revokeObjectURL(objectUrl); reject(e); };
    img.src = objectUrl;
  });
}

// PNG/JPG: fetch directo → base64 (sin canvas, sin pérdida de calidad)
// Detecta WebP por magic bytes (RIFF....WEBP) aunque la extensión diga .png
async function fetchToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const isWebP = header[0]===0x52 && header[1]===0x49 && header[2]===0x46 && header[3]===0x46 &&
                 header[8]===0x57 && header[9]===0x45 && header[10]===0x42 && header[11]===0x50;
  if (isWebP) return canvasConvert(blob);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function toBase64PNG(url: string, scale = 1): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return canvasConvert(blob, scale);
}

function toBase64SVG(url: string): Promise<string> {
  return toBase64PNG(url, 3);
}

// webp por extensión → canvas; el resto → fetchToBase64 (que detecta WebP por bytes si es necesario)
function convertImage(url: string): Promise<string> {
  return url.toLowerCase().endsWith(".webp") ? toBase64PNG(url) : fetchToBase64(url);
}

interface Props {
  cliente: ClienteData;
  producto: Producto;
  opciones: OpcionesPDF;
  onClose: () => void;
}

export default function QuotePreview({ cliente, producto, opciones, onClose }: Props) {
  const [numeroPresupuesto] = useState<number>(() => obtenerSiguienteNumero());
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Assets convertidos a base64
  const [logoSrc, setLogoSrc]         = useState("");
  const [imagenesSrc, setImagenesSrc] = useState<string[]>([]);
  const [showroomSrc, setShowroomSrc] = useState("");
  const [folletosSrc, setFolletosSrc] = useState<string[]>([]);
  const [datasheetSrc, setDatasheetSrc] = useState("");

  // Librerías cargadas dinámicamente (evita SSR crash)
  const [PDFViewer, setPDFViewer]       = useState<any>(null);
  const [pdfFn, setPdfFn]               = useState<any>(null);
  const [QuotePDFComp, setQuotePDFComp] = useState<any>(null);

  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  useEffect(() => {
    const assetFetches: Promise<void>[] = [
      fetchToBase64("/logo.png").then(setLogoSrc),
    ];
    if (opciones.incluirFotos && producto.imagenes.length > 0)
      assetFetches.push(Promise.all(producto.imagenes.map(convertImage)).then(setImagenesSrc));
    if (opciones.incluirFotos && producto.imagenShowroom)
      assetFetches.push(convertImage(producto.imagenShowroom).then(setShowroomSrc));
    if (opciones.incluirFolleto && producto.folletos?.length)
      assetFetches.push(Promise.all(producto.folletos.map(convertImage)).then(setFolletosSrc));
    if (opciones.incluirFolleto && producto.datasheet)
      assetFetches.push(toBase64SVG(producto.datasheet).then(setDatasheetSrc));

    const libFetches = Promise.all([
      import("@react-pdf/renderer").then((m) => {
        setPDFViewer(() => m.PDFViewer);
        setPdfFn(() => m.pdf);
      }),
      import("./QuotePDF").then((m) => setQuotePDFComp(() => m.default)),
    ]);

    Promise.all([...assetFetches, libFetches])
      .then(() => setLoadingAssets(false))
      .catch((err) => {
        console.error("Error cargando assets del PDF:", err);
        setLoadingAssets(false);
      });
  }, [opciones, producto]);

  const pdfProps: QuotePDFProps = {
    cliente, producto, opciones,
    logoSrc, imagenesSrc, showroomSrc, folletosSrc, datasheetSrc,
    numeroPresupuesto, fecha,
  };

  const filename = `Presupuesto_${cliente.apellido}_${producto.id}_PPTO${numeroPresupuesto}.pdf`;

  async function handleDescargar() {
    if (!pdfFn || !QuotePDFComp) return;
    setGenerating(true);
    try {
      const blob = await pdfFn(<QuotePDFComp {...pdfProps} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      guardarNumero(numeroPresupuesto);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col">

      {/* Barra de acciones */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm flex-shrink-0">
        <span className="font-semibold text-gray-700">Vista previa del presupuesto</span>
        <div className="flex gap-2">
          <button
            onClick={handleDescargar}
            disabled={loadingAssets || generating}
            style={{ backgroundColor: "#E85500" }}
            className="hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {generating ? "Generando..." : "⬇ Descargar PDF"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        {loadingAssets || !PDFViewer || !QuotePDFComp ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Preparando vista previa...</p>
            </div>
          </div>
        ) : (
          <PDFViewer width="100%" height="100%" showToolbar={true}>
            <QuotePDFComp {...pdfProps} />
          </PDFViewer>
        )}
      </div>

    </div>
  );
}
