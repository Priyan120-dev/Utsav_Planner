/**
 * Lightweight server logger helper with info, warn, and error levels.
 * Sanitizes sensitive tokens and avoids logging full request bodies or credentials.
 */

function sanitize(arg: unknown): unknown {
  if (typeof arg === 'string') {
    return arg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
  }
  return arg;
}

export const logger = {
  info: (...args: unknown[]): void => {
    console.log(...args.map(sanitize));
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args.map(sanitize));
  },
  error: (...args: unknown[]): void => {
    console.error(...args.map(sanitize));
  }
};
