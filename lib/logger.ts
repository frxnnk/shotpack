interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
}

class Logger {
  private logs: Map<string, LogEntry[]> = new Map();

  log(jobId: string, level: 'info' | 'warn' | 'error', message: string, meta?: any) {
    if (!this.logs.has(jobId)) {
      this.logs.set(jobId, []);
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      meta,
    };

    this.logs.get(jobId)!.push(entry);
    
    const logMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${jobId}] ${message}`;
    console.log(logMessage, meta || '');
  }

  info(jobId: string, message: string, meta?: any) {
    this.log(jobId, 'info', message, meta);
  }

  warn(jobId: string, message: string, meta?: any) {
    this.log(jobId, 'warn', message, meta);
  }

  error(jobId: string, message: string, meta?: any) {
    this.log(jobId, 'error', message, meta);
  }

  getLogs(jobId: string): LogEntry[] {
    return this.logs.get(jobId) || [];
  }

  clearLogs(jobId: string) {
    this.logs.delete(jobId);
  }
}

export const logger = new Logger();