export interface Vendedor {
  id: string;
  nombre: string;
  telefono: string;
  whatsapp?: string;
  email: string;
}

export const empresa = {
  nombre: "Sistemas y Soluciones Digitales SRL",
  telefono: "(011) 4342-5742",
  whatsapp: "5491127870446",
  whatsappDisplay: "(911) 2787-0446",
  email: "info@sistemasysoluciones.com",
  direccion: "Av. Belgrano 748 - Piso 4 Oficina 43, CABA, Argentina",
  web: "www.sistemasysoluciones.com",
  logo: "/logo.png",
};

export const vendedores: Vendedor[] = [
  {
    id: "sistemas",
    nombre: "Sistemas",
    telefono: "(011) 4342-5742",
    whatsapp: "5491127870446",
    email: "info@sistemasysoluciones.com",
  },
  {
    id: "javier",
    nombre: "Javier",
    telefono: "11-3343-4545",
    whatsapp: "5491133434545",
    email: "jhilario@sistemasysoluciones.com",
  },
  {
    id: "andrea",
    nombre: "Andrea",
    telefono: "11-5598-9813",
    whatsapp: "5491155989813",
    email: "apozzi@sistemasysoluciones.com",
  },
];

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  descripcionLarga: string;
  precioBase: number;
  imagenes: string[];
  imagenShowroom?: string;
  youtubeUrl?: string;
  folletos?: string[];
  datasheet?: string;
}

export const productos: Producto[] = [
  {
    id: "hi1804uv",
    nombre: "Huenu HI1804UV",
    descripcion: "Plotter UV híbrido de gran formato",
    descripcionLarga:
      "Plotter UV híbrido diseñado para empresas que buscan integrar en un solo equipo la impresión sobre materiales rígidos y flexibles. Ancho de trabajo de 1,80 metros y capacidad para materiales de hasta 30 mm de espesor. Ideal para cartelería, packaging, material POP, vidrio, madera y acrílico.",
    precioBase: 20850,
    imagenes: ["/productos/hi1804uv-2.png", "/productos/hi1804uv-video.jpg"],
    imagenShowroom: "/productos/hi1804uv-showroom.jpg.png",
    youtubeUrl: "https://youtu.be/YjPzlvVwA4g",
    folletos: ["/huenu-hi1804uv-brochure/huenu-hi1804uv-brochure.png"],
    datasheet: "/huenu-hi1804uv-brochure/hi1804uv-datasheet.svg",
  },
  {
    id: "hr1804uv",
    nombre: "Huenu HR1804UV",
    descripcion: "Plotter UV rollo a rollo",
    descripcionLarga:
      "Plotter UV rollo a rollo con acabados de alto valor que permite crear aplicaciones con barniz, relieve y colores especiales en un único equipo. Perfecto para wallpapers, displays, gráficas vehiculares, vidrieras, vinilo y cuerina.",
    precioBase: 11400,
    imagenes: ["/productos/hr1804uv-1.png", "/productos/hr1804uv-video.jpg"],
    imagenShowroom: "/productos/hr1804uv-showroom.jpg.png",
    youtubeUrl: "https://youtu.be/BmA7l8gAUNc",
    folletos: ["/huenu-hr1804uv-brochure/huenu-hr1804uv-brochure.jpg"],
    datasheet: "/huenu-hr1804uv-brochure/hr1804uv-datasheet.svg",
  },
  {
    id: "hf6090",
    nombre: "Huenu HF6090",
    descripcion: "Plotter UV cama plana",
    descripcionLarga:
      "Plotter UV de cama plana profesional para impresión directa sobre objetos y materiales rígidos. Formato 600×900 mm que permite trabajar múltiples piezas simultáneamente. Aplicaciones en vidrio, acrílico, madera, merchandising y carcasas.",
    precioBase: 16600,
    imagenes: ["/productos/hf6090-1.jpg", "/productos/hf6090-2.jpg"],
    imagenShowroom: "/productos/hf6090-showroom.jpg.png",
    folletos: ["/huenu-hf6090-brochure/huenu-hf6090-brochure.jpg"],
    datasheet: "/huenu-hf6090-brochure/hf6090-datasheet.svg",
  },
  {
    id: "fc7090u",
    nombre: "Mesa de Corte Teneth FC7090U",
    descripcion: "Mesa de corte digital compacta",
    descripcionLarga:
      "Mesa de corte digital compacta de 700×900 mm diseñada para trabajos gráficos, etiquetas, stickers y packaging liviano con corte de contorno preciso. Precisión ±0,1 mm con sistema de registro por cámara CCD.",
    precioBase: 7400,
    imagenes: ["/productos/fc7090u-1.png", "/productos/fc7090u-video.jpg"],
    imagenShowroom: "/productos/fc7090u-showroom.jpg.png",
    youtubeUrl: "https://youtu.be/U2SFTxDewdE",
    datasheet: "/teneth-fc7090u-brochure/fc7090u-datasheet.svg",
  },
  {
    id: "otro",
    nombre: "Otro",
    descripcion: "",
    descripcionLarga: "",
    precioBase: 0,
    imagenes: [],
  },
];
