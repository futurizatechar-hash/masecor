/**
 * Declaraciones de tipos globales - Masecor Web
 *
 * Extiende la interfaz Window para soportar
 * herramientas de analíticas (GA4, etc.)
 */

interface Window {
  gtag?: (
    command: string,
    action: string,
    params?: Record<string, unknown>,
  ) => void;
  dataLayer?: Array<Record<string, unknown>>;
}
