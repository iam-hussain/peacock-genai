/**
 * Logger Utility
 * Centralized logging for the application with request ID support
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  data?: unknown;
}

class Logger {
  private getRequestId(): string | undefined {
    // In Next.js, we can get request ID from async context if needed
    return undefined;
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    requestId?: string
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: requestId || this.getRequestId(),
      data,
    };

    // In production, you might want to send logs to a service
    // For now, we'll use console with structured format
    const requestIdPart = entry.requestId ? ` [${entry.requestId}]` : "";
    const logMessage = `[${entry.timestamp}]${requestIdPart} [${level.toUpperCase()}] ${message}`;

    // Format data if provided
    const dataStr = data
      ? typeof data === "object"
        ? JSON.stringify(data)
        : String(data)
      : "";

    switch (level) {
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(logMessage, dataStr);
        }
        break;
      case "info":
        console.info(logMessage, dataStr);
        break;
      case "warn":
        console.warn(logMessage, dataStr);
        break;
      case "error":
        console.error(logMessage, dataStr);
        break;
    }
  }

  debug(message: string, data?: unknown, requestId?: string): void {
    this.log("debug", message, data, requestId);
  }

  info(message: string, data?: unknown, requestId?: string): void {
    this.log("info", message, data, requestId);
  }

  warn(message: string, data?: unknown, requestId?: string): void {
    this.log("warn", message, data, requestId);
  }

  error(message: string, data?: unknown, requestId?: string): void {
    this.log("error", message, data, requestId);
  }
}

export const logger = new Logger();
