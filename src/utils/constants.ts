/**
 * Constantes Globales - Masecor Web
 *
 * Punto único de referencia para datos de la empresa,
 * configuración de WhatsApp y metadatos SEO.
 */

export const SITE_CONFIG = {
  name: 'Masecor',
  tagline: 'Fábrica de Bachas y Mesadas de Acero Inoxidable',
  description:
    'Masecor - Fábrica argentina de bachas, piletas y mesadas de acero inoxidable AISI 304. Calidad premium desde 1987. Distribución a todo el país.',
  url: 'https://masecor.com.ar',
  locale: 'es_AR',
  language: 'es',
} as const;

export const COMPANY_INFO = {
  foundedYear: 1987,
  material: 'Acero Inoxidable AISI 304',
  country: 'Argentina',
  province: 'Córdoba',
  address: 'Eco Parque Industrial Córdoba',
  mapsUrl: 'https://maps.app.goo.gl/7kLYTQNb1PaQygxZ8',
  mapsLat: -31.3827248,
  mapsLng: -64.0797741,
  phone: '+54 351 665-9066',
  email: 'masecor@masecor.com',
} as const;

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/masecor.aceros/',
  facebook: 'https://web.facebook.com/masecor.srl/',
} as const;

export const WHATSAPP_CONFIG = {
  /** Número de WhatsApp de ventas (formato internacional sin +) */
  phoneNumber: '5493516659066',
  /** Mensaje base para consultas generales */
  defaultMessage:
    'Hola Masecor, estoy visitando su sitio web y me gustaría obtener más información.',
  /** Genera un mensaje pre-armado para un producto específico */
  productMessage: (productName: string): string =>
    `Hola Masecor, estoy interesado/a en *${productName}* que vi en su sitio web. ¿Podrían darme más información sobre disponibilidad y precios?`,
  /** Mensaje para futuros distribuidores o mayoristas */
  distributorMessage:
    'Hola Masecor, me gustaría recibir información para sumarme como distribuidor/mayorista y conocer los requisitos y lista de precios.',
  /** Mensaje para cotización de trabajos especiales a medida */
  specialWorkMessage:
    'Hola Masecor, represento a una empresa/proyecto y me gustaría solicitar presupuesto para un trabajo especial a medida en acero inoxidable.',
  /** Mensaje general para garantías */
  warrantyMessage:
    'Hola Masecor, me comunico por una consulta relacionada a la garantía de un producto.',
} as const;

export const SEO_DEFAULTS = {
  titleTemplate: '%s | Masecor',
  defaultTitle: 'Masecor | Acero Inoxidable',
  defaultDescription: SITE_CONFIG.description,
  defaultImage: '/og-image.jpg',
  twitterHandle: '@masecor',
} as const;

/**
 * Genera la URL completa de WhatsApp con mensaje pre-armado.
 */
export function getWhatsAppUrl(message?: string): string {
  const text = encodeURIComponent(message ?? WHATSAPP_CONFIG.defaultMessage);
  return `https://wa.me/${WHATSAPP_CONFIG.phoneNumber}?text=${text}`;
}
