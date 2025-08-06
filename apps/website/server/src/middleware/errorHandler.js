"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.StructuredLogger = void 0;
exports.correlationIdMiddleware = correlationIdMiddleware;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const EngagementErrors_1 = require("../core/errors/EngagementErrors");
const ConfigManager_1 = require("../config/ConfigManager");
class StructuredLogger {
    static logError(error, correlationId, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: "ERROR",
            correlationId,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            context,
        };
        logger_1.logger.error(JSON.stringify(logEntry, null, 2));
    }
    static logWarn(message, correlationId, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: "WARN",
            correlationId,
            message,
            context,
        };
        logger_1.logger.warn(JSON.stringify(logEntry, null, 2));
    }
    static logInfo(message, correlationId, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: "INFO",
            correlationId,
            message,
            context,
        };
        logger_1.logger.info(JSON.stringify(logEntry, null, 2));
    }
}
exports.StructuredLogger = StructuredLogger;
// Middleware to add correlation ID to all requests
function correlationIdMiddleware(req, res, next) {
    // Get correlation ID from header or generate new one
    req.correlationId = req.headers["x-correlation-id"] || (0, uuid_1.v4)();
    // Set response header
    res.setHeader("x-correlation-id", req.correlationId);
    next();
}
const errorHandler = (err, req, res, next) => {
    const correlationId = req.correlationId || (0, uuid_1.v4)();
    const timestamp = new Date().toISOString();
    // Log the error with correlation ID
    StructuredLogger.logError(err, correlationId, {
        url: req.url,
        method: req.method,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });
    let statusCode = 500;
    let errorCode = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred";
    let context;
    // Handle known error types
    if (err instanceof EngagementErrors_1.EngagementError) {
        statusCode = err.statusCode;
        errorCode = err.code;
        message = err.message;
        context = err.context;
    }
    else if (err instanceof ConfigManager_1.ConfigValidationError) {
        statusCode = 500;
        errorCode = err.code;
        message = err.message;
        context = { field: err.field, value: err.value };
    }
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        statusCode = 400;
        errorCode = "DATABASE_ERROR";
        message = "Database error occurred";
        context = { prismaCode: err.code };
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = 400;
        errorCode = "VALIDATION_ERROR";
        message = "Validation error";
    }
    else if (err.name === "ValidationError") {
        statusCode = 400;
        errorCode = "VALIDATION_ERROR";
        message = err.message;
    }
    else if (err.name === "CastError") {
        statusCode = 400;
        errorCode = "INVALID_ID_FORMAT";
        message = "Invalid ID format provided";
    }
    else if (err.message.includes("duplicate key")) {
        statusCode = 409;
        errorCode = "DUPLICATE_RESOURCE";
        message = "Resource already exists";
    }
    else if (err.message.includes("not found")) {
        statusCode = 404;
        errorCode = "RESOURCE_NOT_FOUND";
        message = "Requested resource not found";
    }
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            message,
            correlationId,
            timestamp,
            context,
        },
    };
    // Include error details in development
    if (process.env.NODE_ENV === "development") {
        errorResponse.details = {
            stack: err.stack,
            originalError: err.message,
        };
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
// Async error wrapper for route handlers
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// 404 handler for unmatched routes
function notFoundHandler(req, res) {
    const correlationId = req.correlationId || (0, uuid_1.v4)();
    StructuredLogger.logWarn("Route not found", correlationId, {
        url: req.url,
        method: req.method,
    });
    const errorResponse = {
        success: false,
        error: {
            code: "ROUTE_NOT_FOUND",
            message: `Route ${req.method} ${req.url} not found`,
            correlationId,
            timestamp: new Date().toISOString(),
        },
    };
    res.status(404).json(errorResponse);
}
