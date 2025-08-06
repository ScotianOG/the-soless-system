// server/src/core/utils/Logger.ts
import { v4 as uuidv4 } from "uuid";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  platform?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

export class Logger {
  private static instance: Logger;
  private serviceName: string;

  constructor(serviceName: string = "engagement-service") {
    this.serviceName = serviceName;
  }

  static getInstance(serviceName?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName);
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const correlationId = context?.correlationId || uuidv4();

    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      correlationId,
      message,
      context: context
        ? {
            userId: context.userId,
            platform: context.platform,
            operation: context.operation,
            metadata: context.metadata,
          }
        : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    return JSON.stringify(logEntry);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Generate a new correlation ID for tracking requests
   */
  generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Create a child logger with persistent context
   */
  child(persistentContext: Partial<LogContext>): ChildLogger {
    return new ChildLogger(this, persistentContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private persistentContext: Partial<LogContext>
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return {
      ...this.persistentContext,
      ...context,
    };
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }
}

// Create default logger instance
export const logger = Logger.getInstance("engagement-contest");
