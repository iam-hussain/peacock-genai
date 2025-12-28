/**
 * Logger utility
 * Provides structured logging functionality
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return `${prefix} ${message}${args.length > 0 ? ' ' + args.map(String).join(' ') : ''}`
}

export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(formatMessage('info', message, ...args))
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(formatMessage('warn', message, ...args))
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(formatMessage('error', message, ...args))
  },
  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, ...args))
    }
  },
}

