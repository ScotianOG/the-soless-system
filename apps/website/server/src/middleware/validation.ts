// server/src/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ValidationError } from "../core/errors/EngagementErrors";

// Extend Request interface to include file uploads
declare module "express-serve-static-core" {
  interface Request {
    file?: any; // Multer.File would be the proper type but requires @types/multer
    files?: any[] | { [fieldname: string]: any[] }; // Multer.File[] would be proper type
  }
}

// Common validation schemas
export const CommonSchemas = {
  // User validation
  userId: z.string().uuid("Invalid user ID format"),
  walletAddress: z
    .string()
    .min(32, "Wallet address too short")
    .max(50, "Wallet address too long"),
  contestId: z.string().uuid("Invalid contest ID format"),

  // Platform validation
  platform: z.enum(["TELEGRAM", "DISCORD", "TWITTER"], {
    errorMap: () => ({
      message: "Platform must be TELEGRAM, DISCORD, or TWITTER",
    }),
  }),

  // Points and engagement validation
  points: z
    .number()
    .int()
    .min(0)
    .max(10000, "Points must be between 0 and 10000"),
  engagementType: z.string().min(1).max(50),

  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  // Contest validation
  contestFormData: z.object({
    name: z.string().min(1).max(100),
    endTime: z.string().datetime().or(z.date()),
    rules: z.record(z.any()).optional(),
  }),

  // Engagement metadata validation
  engagementMetadata: z
    .object({
      messageId: z.string().optional(),
      channelId: z.string().optional(),
      content: z.string().max(2000).optional(),
      url: z.string().url().optional(),
      hashtags: z.array(z.string()).optional(),
      mentions: z.array(z.string()).optional(),
    })
    .optional(),
};

// Enhanced engagement tracking validation
export const EngagementSchemas = {
  trackEngagement: z.object({
    userId: CommonSchemas.userId,
    platform: CommonSchemas.platform,
    type: CommonSchemas.engagementType,
    points: CommonSchemas.points.optional(),
    metadata: CommonSchemas.engagementMetadata,
  }),

  bulkTrackEngagement: z.object({
    engagements: z
      .array(
        z.object({
          userId: CommonSchemas.userId,
          platform: CommonSchemas.platform,
          type: CommonSchemas.engagementType,
          points: CommonSchemas.points.optional(),
          metadata: CommonSchemas.engagementMetadata,
        })
      )
      .min(1)
      .max(100), // Limit bulk operations
  }),

  getUserEngagement: z.object({
    userId: CommonSchemas.userId,
    platform: CommonSchemas.platform.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    ...CommonSchemas.pagination.shape,
  }),
};

// Contest validation schemas
export const ContestSchemas = {
  createContest: CommonSchemas.contestFormData,

  getContestEntries: z.object({
    contestId: CommonSchemas.contestId,
    ...CommonSchemas.pagination.shape,
  }),

  claimReward: z.object({
    rewardId: z.string().uuid("Invalid reward ID format"),
  }),

  distributeRewards: z.object({
    contestId: CommonSchemas.contestId,
  }),
};

// Admin validation schemas
export const AdminSchemas = {
  setUserPoints: z.object({
    userId: CommonSchemas.userId,
    points: z.number().int().min(-1000).max(1000),
    reason: z.string().min(1).max(200),
  }),

  bulkUpdatePoints: z.object({
    updates: z
      .array(
        z.object({
          userId: CommonSchemas.userId,
          points: z.number().int().min(-1000).max(1000),
          reason: z.string().min(1).max(200),
        })
      )
      .min(1)
      .max(50),
  }),

  announceMessage: z.object({
    message: z.string().min(1).max(1000),
    platforms: z.array(CommonSchemas.platform).min(1),
    urgent: z.boolean().default(false),
  }),
};

// Rate limiting validation
export const RateLimitSchemas = {
  checkRateLimit: z.object({
    userId: CommonSchemas.userId,
    action: z.string().min(1).max(50),
    platform: CommonSchemas.platform,
  }),
};

// Generic validation middleware factory
export function validateRequest<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const correlationId = req.correlationId;

      // Combine params, query, and body for validation
      const requestData = {
        ...req.params,
        ...req.query,
        ...req.body,
      };

      // Convert string numbers to actual numbers for query params
      const processedData = processQueryParams(requestData);

      // Validate the request data
      const validatedData = schema.parse(processedData);

      // Attach validated data to request
      req.validatedData = validatedData;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const validationError = new ValidationError(
          `Validation failed: ${firstError.message} at ${firstError.path.join(
            "."
          )}`,
          {
            field: firstError.path.join("."),
            value: (firstError as any).received || "unknown",
            expected: (firstError as any).expected || "unknown",
            errors: error.errors,
          },
          req.correlationId
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
}

// Process query parameters to convert strings to appropriate types
function processQueryParams(data: any): any {
  const processed = { ...data };

  // Convert string numbers to numbers
  for (const key in processed) {
    const value = processed[key];
    if (typeof value === "string") {
      // Try to convert to number if it looks like a number
      if (/^\d+$/.test(value)) {
        processed[key] = parseInt(value, 10);
      } else if (/^\d+\.\d+$/.test(value)) {
        processed[key] = parseFloat(value);
      }
      // Convert boolean strings
      else if (value === "true") {
        processed[key] = true;
      } else if (value === "false") {
        processed[key] = false;
      }
    }
  }

  return processed;
}

// Specific validation middleware for common endpoints
export const validateEngagementTracking = validateRequest(
  EngagementSchemas.trackEngagement
);
export const validateBulkEngagementTracking = validateRequest(
  EngagementSchemas.bulkTrackEngagement
);
export const validateGetUserEngagement = validateRequest(
  EngagementSchemas.getUserEngagement
);

export const validateCreateContest = validateRequest(
  ContestSchemas.createContest
);
export const validateGetContestEntries = validateRequest(
  ContestSchemas.getContestEntries
);
export const validateClaimReward = validateRequest(ContestSchemas.claimReward);
export const validateDistributeRewards = validateRequest(
  ContestSchemas.distributeRewards
);

export const validateSetUserPoints = validateRequest(
  AdminSchemas.setUserPoints
);
export const validateBulkUpdatePoints = validateRequest(
  AdminSchemas.bulkUpdatePoints
);
export const validateAnnounceMessage = validateRequest(
  AdminSchemas.announceMessage
);

// Sanitization middleware
export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Sanitize string inputs to prevent XSS
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
        .replace(/javascript:/gi, "") // Remove javascript: protocols
        .replace(/on\w+=/gi, "") // Remove event handlers
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

// File upload validation
export function validateFileUpload(
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif"],
  maxSize: number = 5 * 1024 * 1024 // 5MB default
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    const { mimetype, size } = req.file;

    if (!allowedTypes.includes(mimetype)) {
      return next(
        new ValidationError(
          `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
          { allowedTypes, receivedType: mimetype },
          req.correlationId
        )
      );
    }

    if (size > maxSize) {
      return next(
        new ValidationError(
          `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
          { maxSize, receivedSize: size },
          req.correlationId
        )
      );
    }

    next();
  };
}

// Request size validation
export function validateRequestSize(maxSize: number = 1024 * 1024) {
  // 1MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);

    if (contentLength > maxSize) {
      return next(
        new ValidationError(
          `Request too large. Maximum size: ${maxSize / 1024}KB`,
          { maxSize, receivedSize: contentLength },
          req.correlationId
        )
      );
    }

    next();
  };
}

// Extend Express Request type to include validated data
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
    }
  }
}
