import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import { empresa, Producto } from "@/config/empresa";
import { ClienteData, OpcionesPDF } from "./QuoteForm";

const ORANGE  = "#E85500";
const BG_PAGE = "#C4B9B0";
const BG_SECT = "#F5F0EB";
const DARK    = "#1a1a1a";
const GRAY    = "#6b7280";
const LGRAY   = "#e5e7eb";

const S = StyleSheet.create({
  pageBg:    { backgroundColor: BG_PAGE, fontFamily: "Helvetica" },
  pageWhite: { backgroundColor: "#ffffff" },

  // Esquinas decorativas
  cornerTR: { position: "absolute", top: 0, right: 0, width: 65, height: 65, backgroundColor: ORANGE, borderBottomLeftRadius: 65 },
  cornerBL: { position: "absolute", bottom: 0, left: 0,  width: 65, height: 65, backgroundColor: ORANGE, borderTopRightRadius:  65 },

  // Tarjeta blanca — flex:1 la hace llenar la página completa
  card: { flex: 1, margin: 22, backgroundColor: "white", borderRadius: 12, padding: 28 },

  // ── Header ──
  headerRow:  { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: LGRAY, borderBottomStyle: "solid" },
  logoWrap:   { flex: 1 },
  logo:       { height: 38, width: 160, objectFit: "contain" },
  divV:       { width: 1, backgroundColor: LGRAY, alignSelf: "stretch", marginHorizontal: 20 },
  presRight:  { alignItems: "flex-end" },
  presTitle:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: ORANGE, textTransform: "uppercase" },
  presNum:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginTop: 5 },
  presFecha:  { fontSize: 9, color: GRAY, marginTop: 3 },

  // ── Contacto ──
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  bullet:     { width: 8, height: 8, backgroundColor: ORANGE, borderRadius: 4, marginRight: 8 },
  contactTxt: { fontSize: 9, color: "#4b5563" },
  sep:        { height: 1, backgroundColor: LGRAY, marginVertical: 14 },

  // ── Cliente ──
  clientBox:   { backgroundColor: BG_SECT, borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 18 },
  initCircle:  { width: 40, height: 40, backgroundColor: ORANGE, borderRadius: 20, marginRight: 12, alignItems: "center", justifyContent: "center" },
  initTxt:     { color: "white", fontSize: 14, fontFamily: "Helvetica-Bold" },
  clientLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: ORANGE, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  clientName:  { fontSize: 15, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  clientInfo:  { fontSize: 9, color: "#4b5563", marginBottom: 2 },

  // ── Tabla ──
  tableWrap: { borderRadius: 8, overflow: "hidden", marginBottom: 0 },
  thead:     { flexDirection: "row", backgroundColor: ORANGE },
  thDesc:    { flex: 1,    color: "white", fontFamily: "Helvetica-Bold", fontSize: 9, padding: 11 },
  thCant:    { width: 52,  color: "white", fontFamily: "Helvetica-Bold", fontSize: 9, padding: 11, textAlign: "center" },
  thPrecio:  { width: 105, color: "white", fontFamily: "Helvetica-Bold", fontSize: 9, padding: 11, textAlign: "right" },
  trow:      { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderBottomStyle: "solid" },
  tdDesc:    { flex: 1, paddingVertical: 14, paddingHorizontal: 11 },
  tdName:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 3 },
  tdSub:     { fontSize: 8, color: GRAY },
  tdCant:    { width: 52,  paddingVertical: 14, paddingHorizontal: 11, textAlign: "center", fontSize: 11, color: "#374151", borderLeftWidth: 1, borderLeftColor: LGRAY, borderLeftStyle: "dashed" },
  tdPrecio:  { width: 105, paddingVertical: 14, paddingHorizontal: 11, textAlign: "right",  fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, borderLeftWidth: 1, borderLeftColor: LGRAY, borderLeftStyle: "dashed" },

  // ── Total ──
  totalRow:   { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingVertical: 12, paddingHorizontal: 11, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: LGRAY, borderBottomStyle: "solid" },
  totalLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#374151", marginRight: 24 },
  totalValue: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ORANGE },

  // ── Notas ──
  notesBox:   { backgroundColor: BG_SECT, borderRadius: 8, padding: 14, marginBottom: 16 },
  notesLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: ORANGE, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  notesTxt:   { fontSize: 9, color: "#374151", lineHeight: 1.5 },

  // ── Condiciones ──
  condRow:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 7 },
  check:    { width: 14, height: 14, backgroundColor: ORANGE, borderRadius: 7, alignItems: "center", justifyContent: "center", marginRight: 9, marginTop: 1 },
  checkTxt: { color: "white", fontSize: 8, fontFamily: "Helvetica-Bold" },
  condTxt:  { flex: 1, fontSize: 8, color: "#4b5563", lineHeight: 1.4 },

  // ── Footer ──
  footer:     { borderTopWidth: 1, borderTopColor: LGRAY, borderTopStyle: "solid", paddingTop: 14, alignItems: "center", marginTop: "auto" },
  footerName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: GRAY },
  footerWeb:  { fontSize: 8, color: "#9ca3af", marginTop: 2 },

  // ── Página de fotos ──
  secTitle:  { fontSize: 8, fontFamily: "Helvetica-Bold", color: ORANGE, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 },
  descTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 6 },
  descTxt:   { fontSize: 9, color: "#4b5563", lineHeight: 1.7 },

  // ── Video link ──
  videoRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 14, marginTop: 5 },
  videoIcon: { width: 14, height: 14, backgroundColor: ORANGE, borderRadius: 7, alignItems: "center", justifyContent: "center", marginRight: 7 },
  videoIconTxt: { color: "white", fontSize: 7, fontFamily: "Helvetica-Bold" },
  videoTxt:  { fontSize: 8, color: ORANGE, textDecoration: "none" },
});

export interface QuotePDFProps {
  cliente: ClienteData;
  producto: Producto;
  opciones: OpcionesPDF;
  logoSrc: string;
  imagenesSrc: string[];
  showroomSrc: string;
  folletosSrc: string[];
  datasheetSrc: string;
  numeroPresupuesto: number;
  fecha: string;
}

export default function QuotePDF({
  cliente, producto, opciones,
  logoSrc, imagenesSrc, showroomSrc, folletosSrc, datasheetSrc,
  numeroPresupuesto, fecha,
}: QuotePDFProps) {
  const initials = `${cliente.nombre?.[0] ?? ""}${cliente.apellido?.[0] ?? ""}`.toUpperCase();
  const conds = [
    "Este presupuesto tiene una validez de 15 días a partir de la fecha de emisión.",
    "Los precios están expresados en dólares estadounidenses (USD).",
    `Para consultas: ${empresa.telefono}  |  WhatsApp: ${empresa.whatsappDisplay}.`,
  ];

  const fotoH = imagenesSrc.length === 1 ? 270 : 185;

  return (
    <Document>

      {/* ── PÁGINA DE FOTOS ── */}
      {opciones.incluirFotos && imagenesSrc.length > 0 && (
        <Page size="A4" style={S.pageBg}>
          <View style={S.cornerTR} fixed />
          <View style={S.cornerBL} fixed />
          <View style={S.card}>
            <Text style={S.secTitle}>Galería del equipo</Text>

            {/* Imágenes apiladas verticalmente */}
            {imagenesSrc.map((src, i) => {
              const isVideo = !!producto.youtubeUrl && i === imagenesSrc.length - 1;
              return (
                <View key={i}>
                  {isVideo ? (
                    <Link src={producto.youtubeUrl!}>
                      <Image
                        src={src}
                        style={{
                          width: "100%",
                          height: fotoH,
                          objectFit: "contain",
                          borderRadius: 8,
                          marginBottom: 0,
                        }}
                      />
                    </Link>
                  ) : (
                    <Image
                      src={src}
                      style={{
                        width: "100%",
                        height: fotoH,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginBottom: i < imagenesSrc.length - 1 ? 10 : 18,
                      }}
                    />
                  )}
                  {isVideo && (
                    <Link src={producto.youtubeUrl!}>
                      <View style={S.videoRow}>
                        <View style={S.videoIcon}>
                          <Text style={S.videoIconTxt}>▶</Text>
                        </View>
                        <Text style={S.videoTxt}>Ver video en YouTube  ·  {producto.youtubeUrl}</Text>
                      </View>
                    </Link>
                  )}
                </View>
              );
            })}

            {/* Imagen showroom — aplicaciones juntas */}
            {!!showroomSrc && (
              <>
                <Text style={[S.secTitle, { marginTop: 4, marginBottom: 8 }]}>Aplicaciones</Text>
                <Image
                  src={showroomSrc}
                  style={{ width: "100%", height: 135, objectFit: "cover", borderRadius: 8, marginBottom: 14 }}
                />
              </>
            )}

            <View style={{ borderLeftWidth: 3, borderLeftColor: ORANGE, borderLeftStyle: "solid", paddingLeft: 12, marginTop: 4 }}>
              <Text style={S.descTitle}>{producto.nombre}</Text>
              <Text style={S.descTxt}>{producto.descripcionLarga}</Text>
            </View>

            {/* Footer de página de fotos */}
            <View style={S.footer}>
              <Text style={S.footerName}>{empresa.nombre}</Text>
              <Text style={S.footerWeb}>{empresa.web}</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── PÁGINAS DE FOLLETO ── */}
      {opciones.incluirFolleto && folletosSrc.map((src, i) => (
        <Page key={i} size="A4" style={S.pageWhite}>
          <Image src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </Page>
      ))}

      {/* ── DATASHEET (SVG → PNG 3×) ── */}
      {opciones.incluirFolleto && !!datasheetSrc && (
        <Page size="A4" style={S.pageWhite}>
          <Image src={datasheetSrc} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </Page>
      )}

      {/* ── PRESUPUESTO ── */}
      <Page size="A4" style={S.pageBg}>
        <View style={S.cornerTR} fixed />
        <View style={S.cornerBL} fixed />
        <View style={S.card}>

          {/* Header */}
          <View style={S.headerRow}>
            <View style={S.logoWrap}>
              <Image src={logoSrc} style={S.logo} />
            </View>
            <View style={S.divV} />
            <View style={S.presRight}>
              <Text style={S.presTitle}>Presupuesto</Text>
              <Text style={S.presNum}>N° PPTO-{numeroPresupuesto}</Text>
              <Text style={S.presFecha}>{fecha}</Text>
            </View>
          </View>

          {/* Contacto */}
          <View style={{ marginBottom: 4 }}>
            {[empresa.direccion, `${empresa.telefono}  |  ${empresa.email}`, empresa.web].map((txt, i) => (
              <View key={i} style={S.contactRow}>
                <View style={S.bullet} />
                <Text style={S.contactTxt}>{txt}</Text>
              </View>
            ))}
          </View>

          <View style={S.sep} />

          {/* Cliente */}
          <View style={S.clientBox}>
            <View style={S.initCircle}>
              <Text style={S.initTxt}>{initials}</Text>
            </View>
            <View>
              <Text style={S.clientLabel}>CLIENTE</Text>
              <Text style={S.clientName}>{cliente.nombre} {cliente.apellido}</Text>
              {!!cliente.empresa  && <Text style={S.clientInfo}>{cliente.empresa}</Text>}
              {!!cliente.email    && <Text style={S.clientInfo}>{cliente.email}</Text>}
              {!!cliente.telefono && <Text style={S.clientInfo}>{cliente.telefono}</Text>}
            </View>
          </View>

          {/* Tabla */}
          <View style={S.tableWrap}>
            <View style={S.thead}>
              <Text style={S.thDesc}>Descripción</Text>
              <Text style={S.thCant}>Cant.</Text>
              <Text style={S.thPrecio}>Precio</Text>
            </View>
            <View style={S.trow}>
              <View style={S.tdDesc}>
                <Text style={S.tdName}>{producto.nombre}</Text>
                <Text style={S.tdSub}>{producto.descripcion}</Text>
              </View>
              <Text style={S.tdCant}>1</Text>
              <Text style={S.tdPrecio}>USD {cliente.precio.toLocaleString("es-AR")}</Text>
            </View>
          </View>

          {/* Total */}
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>TOTAL</Text>
            <Text style={S.totalValue}>USD {cliente.precio.toLocaleString("es-AR")}</Text>
          </View>

          {/* Notas */}
          {!!cliente.notas && (
            <View style={S.notesBox}>
              <Text style={S.notesLabel}>NOTAS</Text>
              <Text style={S.notesTxt}>{cliente.notas}</Text>
            </View>
          )}

          {/* Condiciones */}
          <View style={{ marginBottom: 8 }}>
            {conds.map((txt, i) => (
              <View key={i} style={S.condRow}>
                <View style={S.check}>
                  <Text style={S.checkTxt}>v</Text>
                </View>
                <Text style={S.condTxt}>{txt}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={S.footer}>
            <Text style={S.footerName}>{empresa.nombre}</Text>
            <Text style={S.footerWeb}>{empresa.web}</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}
