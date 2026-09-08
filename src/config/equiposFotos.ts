// Fotos de equipos para el presupuesto de alquiler.
//
// Clave: `${marca} ${modelo}` EXACTO tal como figura en `equipos_alquiler`
// (y en los equipos demo de src/app/api/alquileres/equipos/route.ts).
//
// Valor: ruta pública de la foto (los archivos viven en public/equipos/).
//
// Ejemplo:
//   "RICOH IM 550 SPF": "/equipos/ricoh-im550.jpg"
//
// Cuando las fotos estén en public/equipos/, completar acá el mapeo.
export const FOTO_POR_MODELO: Record<string, string> = {
  "RICOH IM 550 SPF": "/equipos/ricoh-im550.png",
};
