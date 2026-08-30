type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === "development";
const isBrowser = typeof window !== "undefined";

const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "auth",
  "credential",
  "key",
];

function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((k) => lowerKey.includes(k));
    sanitized[key] = isSensitive ? "[REDACTED]" : sanitize(value);
  }
  return sanitized;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const prefix = isBrowser ? "[CLIENT]" : "[SERVER]";
  const ctx = context ? ` ${JSON.stringify(sanitize(context))}` : "";
  return `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}${ctx}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (isDevelopment) {
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    if (isDevelopment) {
      console.info(formatMessage("info", message, context));
    }
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatMessage("warn", message, context));
  },

  error(message: string, context?: LogContext) {
    console.error(formatMessage("error", message, context));
  },

  auth: (event: string, context?: LogContext) => {
    logger.info(`AUTH: ${event}`, context);
  },

  db: (operation: string, context?: LogContext) => {
    logger.debug(`DB: ${operation}`, context);
  },

  action: (name: string, context?: LogContext) => {
    logger.info(`ACTION: ${name}`, context);
  },
};

export function createLogger(prefix: string) {
  return {
    debug: (message: string, context?: LogContext) => logger.debug(`[${prefix}] ${message}`, context),
    info: (message: string, context?: LogContext) => logger.info(`[${prefix}] ${message}`, context),
    warn: (message: string, context?: LogContext) => logger.warn(`[${prefix}] ${message}`, context),
    error: (message: string, context?: LogContext) => logger.error(`[${prefix}] ${message}`, context),
  };
}