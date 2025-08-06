"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
// server/src/core/utils/Logger.ts
const uuid_1 = require("uuid");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(serviceName = "engagement-service") {
        this.serviceName = serviceName;
    }
    static getInstance(serviceName) {
        if (!Logger.instance) {
            Logger.instance = new Logger(serviceName);
        }
        return Logger.instance;
    }
    formatMessage(level, message, context, error) {
        const timestamp = new Date().toISOString();
        const correlationId = context?.correlationId || (0, uuid_1.v4)();
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
    error(message, context, error) {
        console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
    }
    warn(message, context) {
        console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
    info(message, context) {
        console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
    debug(message, context) {
        if (process.env.NODE_ENV === "development") {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
        }
    }
    /**
     * Generate a new correlation ID for tracking requests
     */
    generateCorrelationId() {
        return (0, uuid_1.v4)();
    }
    /**
     * Create a child logger with persistent context
     */
    child(persistentContext) {
        return new ChildLogger(this, persistentContext);
    }
}
exports.Logger = Logger;
class ChildLogger {
    constructor(parent, persistentContext) {
        this.parent = parent;
        this.persistentContext = persistentContext;
    }
    mergeContext(context) {
        return {
            ...this.persistentContext,
            ...context,
        };
    }
    error(message, context, error) {
        this.parent.error(message, this.mergeContext(context), error);
    }
    warn(message, context) {
        this.parent.warn(message, this.mergeContext(context));
    }
    info(message, context) {
        this.parent.info(message, this.mergeContext(context));
    }
    debug(message, context) {
        this.parent.debug(message, this.mergeContext(context));
    }
}
// Create default logger instance
exports.logger = Logger.getInstance("engagement-contest");
