export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export class AppLogger {
  constructor(private readonly context: string) {}

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      meta,
    };
    const formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}`;
    if (level === 'error') {
      console.error(formatted, meta ?? '');
    } else if (level === 'warn') {
      console.warn(formatted, meta ?? '');
    } else {
      console.log(formatted, meta ?? '');
    }
    return entry;
  }

  debug(message: string, meta?: Record<string, unknown>) {
    return this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    return this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    return this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    return this.log('error', message, meta);
  }
}
