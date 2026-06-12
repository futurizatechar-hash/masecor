/**
 * Logger Centralizado - Masecor Web
 *
 * Sistema de logging estructurado enterprise.
 * Reemplaza llamadas directas a console.log con niveles
 * de severidad y formato consistente.
 *
 * @example
 * ```ts
 * import { logger } from '../utils/logger';
 * logger.info('Producto cargado', { id: 'bacha-cuore' });
 * logger.error('Error al cargar imagen', { src: '/img/product.webp' });
 * ```
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * Nivel mínimo de log a mostrar.
 * En producción solo se muestran WARN y ERROR.
 */
const MIN_LEVEL: LogLevel =
  import.meta.env.MODE === 'production' ? 'WARN' : 'DEBUG';

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level}]`;
  return entry.data
    ? `${prefix} ${entry.message} ${JSON.stringify(entry.data)}`
    : `${prefix} ${entry.message}`;
}

function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'DEBUG':
    case 'INFO':
      // eslint-disable-next-line no-console
      console.log(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    case 'ERROR':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) =>
    log('DEBUG', message, data),
  info: (message: string, data?: Record<string, unknown>) =>
    log('INFO', message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    log('WARN', message, data),
  error: (message: string, data?: Record<string, unknown>) =>
    log('ERROR', message, data),
};
