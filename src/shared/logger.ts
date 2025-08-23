/**
 * Logger utility with colored output and different log levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogContext {
  component?: string;
  method?: string;
  url?: string;
  provider?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level].padEnd(5);
    const component = context?.component ? `[${context.component}]` : '';
    const method = context?.method ? `[${context.method}]` : '';
    const url = context?.url ? `[${context.url}]` : '';
    const provider = context?.provider ? `[${context.provider}]` : '';
    const requestId = context?.requestId ? `[${context.requestId}]` : '';

    const contextStr = [component, method, url, provider, requestId].filter(Boolean).join(' ');

    return `${timestamp} ${levelStr} ${contextStr} ${message}`;
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '\x1b[31m'; // Red
      case LogLevel.WARN:
        return '\x1b[33m'; // Yellow
      case LogLevel.INFO:
        return '\x1b[36m'; // Cyan
      case LogLevel.DEBUG:
        return '\x1b[35m'; // Magenta
      case LogLevel.TRACE:
        return '\x1b[90m'; // Gray
      default:
        return '\x1b[0m'; // Reset
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level <= this.level) {
      const formattedMessage = this.formatMessage(level, message, context);
      const color = this.getColor(level);
      const reset = '\x1b[0m';

      console.log(`${color}${formattedMessage}${reset}`);
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log(LogLevel.TRACE, message, context);
  }

  // Specialized logging methods
  navigation(url: string, context?: LogContext): void {
    this.info(`Navigating to: ${url}`, { ...context, url });
  }

  aiRequest(provider: string, model: string, url: string, context?: LogContext): void {
    this.info(`AI Request - Provider: ${provider}, Model: ${model}, URL: ${url}`, {
      ...context,
      provider,
      url,
      model,
    });
  }

  aiResponse(
    provider: string,
    tokensUsed?: number,
    responseTime?: number,
    context?: LogContext
  ): void {
    this.info(
      `AI Response - Provider: ${provider}, Tokens: ${tokensUsed}, Time: ${responseTime}ms`,
      {
        ...context,
        provider,
        tokensUsed,
        responseTime,
      }
    );
  }

  streamChunk(chunkSize: number, totalTokens: number, context?: LogContext): void {
    this.debug(`Stream chunk: ${chunkSize} chars, Total tokens: ${totalTokens}`, context);
  }

  cacheHit(url: string, context?: LogContext): void {
    this.debug(`Cache hit for: ${url}`, { ...context, url });
  }

  cacheMiss(url: string, context?: LogContext): void {
    this.debug(`Cache miss for: ${url}`, { ...context, url });
  }

  errorWithDetails(error: Error, context?: LogContext): void {
    this.error(`${error.name}: ${error.message}`, context);
    if (error.stack) {
      this.trace(`Stack trace: ${error.stack}`, context);
    }
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.debug(`${operation} completed in ${duration}ms`, context);
  }

  // Set log level
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.level;
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, context?: LogContext) => logger.error(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logTrace = (message: string, context?: LogContext) => logger.trace(message, context);
