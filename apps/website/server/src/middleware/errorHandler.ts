// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { EngagementError } from "../core/errors/EngagementErrors";
import { ConfigValidationError } from "../config/ConfigManager";

import { ErrorRequestHandler } from "express";

// Extend Request interface to include correlation ID
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId: string;
    timestamp: string;
    context?: Record<string, any>;
  };
  details?: any;
}

export class StructuredLogger {
  static logError(
    error: Error,
    correlationId: string,
    context?: Record<string, any>
  ): void {
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

    logger.error(JSON.stringify(logEntry, null, 2));
  }

  static logWarn(
    message: string,
    correlationId: string,
    context?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      correlationId,
      message,
      context,
    };

    logger.warn(JSON.stringify(logEntry, null, 2));
  }

  static logInfo(
    message: string,
    correlationId: string,
    context?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      correlationId,
      message,
      context,
    };

    logger.info(JSON.stringify(logEntry, null, 2));
  }
}

// Middleware to add correlation ID to all requests
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get correlation ID from header or generate new one
  req.correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();

  // Set response header
  res.setHeader("x-correlation-id", req.correlationId);

  next();
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.correlationId || uuidv4();
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
  let context: Record<string, any> | undefined;

  // Handle known error types
  if (err instanceof EngagementError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    context = err.context;
  } else if (err instanceof ConfigValidationError) {
    statusCode = 500;
    errorCode = err.code;
    message = err.message;
    context = { field: err.field, value: err.value };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    errorCode = "DATABASE_ERROR";
    message = "Database error occurred";
    context = { prismaCode: err.code };
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Validation error";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = err.message;
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID_FORMAT";
    message = "Invalid ID format provided";
  } else if (err.message.includes("duplicate key")) {
    statusCode = 409;
    errorCode = "DUPLICATE_RESOURCE";
    message = "Resource already exists";
  } else if (err.message.includes("not found")) {
    statusCode = 404;
    errorCode = "RESOURCE_NOT_FOUND";
    message = "Requested resource not found";
  }

  const errorResponse: ErrorResponse = {
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

// Async error wrapper for route handlers
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response): void {
  const correlationId = req.correlationId || uuidv4();

  StructuredLogger.logWarn("Route not found", correlationId, {
    url: req.url,
    method: req.method,
  });

  const errorResponse: ErrorResponse = {
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
