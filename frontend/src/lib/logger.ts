type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  correlationId?: string;
  data?: Record<string, unknown>;
}

class Logger {
  private readonly module: string;

  constructor(module?: string) {
    this.module = module ?? "app";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const configuredLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ?? "info";
    return levels.indexOf(level) >= levels.indexOf(configuredLevel);
  }

  private createEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      module: this.module,
      correlationId: data?.correlationId as string | undefined,
      data,
    };
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;

    switch (entry.level) {
      case "debug":
        console.debug(prefix, entry.message, entry.data ?? "");
        break;
      case "info":
        console.info(prefix, entry.message, entry.data ?? "");
        break;
      case "warn":
        console.warn(prefix, entry.message, entry.data ?? "");
        break;
      case "error":
        console.error(prefix, entry.message, entry.data ?? "");
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(this.createEntry("debug", message, data));
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(this.createEntry("info", message, data));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(this.createEntry("warn", message, data));
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log(this.createEntry("error", message, data));
  }

  child(module: string): Logger {
    return new Logger(`${this.module}:${module}`);
  }
}

export function createLogger(module?: string): Logger {
  return new Logger(module);
}

export const logger = createLogger();
