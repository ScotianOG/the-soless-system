"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAnnounceMessage = exports.validateBulkUpdatePoints = exports.validateSetUserPoints = exports.validateDistributeRewards = exports.validateClaimReward = exports.validateGetContestEntries = exports.validateCreateContest = exports.validateGetUserEngagement = exports.validateBulkEngagementTracking = exports.validateEngagementTracking = exports.RateLimitSchemas = exports.AdminSchemas = exports.ContestSchemas = exports.EngagementSchemas = exports.CommonSchemas = void 0;
exports.validateRequest = validateRequest;
exports.sanitizeInput = sanitizeInput;
exports.validateFileUpload = validateFileUpload;
exports.validateRequestSize = validateRequestSize;
const zod_1 = require("zod");
const EngagementErrors_1 = require("../core/errors/EngagementErrors");
// Common validation schemas
exports.CommonSchemas = {
    // User validation
    userId: zod_1.z.string().uuid("Invalid user ID format"),
    walletAddress: zod_1.z
        .string()
        .regex(/^[A-HJ-NP-Z1-9]{32,44}$/, "Invalid wallet address format"),
    contestId: zod_1.z.string().uuid("Invalid contest ID format"),
    // Platform validation
    platform: zod_1.z.enum(["TELEGRAM", "DISCORD", "TWITTER"], {
        errorMap: () => ({
            message: "Platform must be TELEGRAM, DISCORD, or TWITTER",
        }),
    }),
    // Points and engagement validation
    points: zod_1.z
        .number()
        .int()
        .min(0)
        .max(10000, "Points must be between 0 and 10000"),
    engagementType: zod_1.z.string().min(1).max(50),
    // Pagination validation
    pagination: zod_1.z.object({
        page: zod_1.z.number().int().min(1).default(1),
        limit: zod_1.z.number().int().min(1).max(100).default(20),
    }),
    // Contest validation
    contestFormData: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        endTime: zod_1.z.string().datetime().or(zod_1.z.date()),
        rules: zod_1.z.record(zod_1.z.any()).optional(),
    }),
    // Engagement metadata validation
    engagementMetadata: zod_1.z
        .object({
        messageId: zod_1.z.string().optional(),
        channelId: zod_1.z.string().optional(),
        content: zod_1.z.string().max(2000).optional(),
        url: zod_1.z.string().url().optional(),
        hashtags: zod_1.z.array(zod_1.z.string()).optional(),
        mentions: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
};
// Enhanced engagement tracking validation
exports.EngagementSchemas = {
    trackEngagement: zod_1.z.object({
        userId: exports.CommonSchemas.userId,
        platform: exports.CommonSchemas.platform,
        type: exports.CommonSchemas.engagementType,
        points: exports.CommonSchemas.points.optional(),
        metadata: exports.CommonSchemas.engagementMetadata,
    }),
    bulkTrackEngagement: zod_1.z.object({
        engagements: zod_1.z
            .array(zod_1.z.object({
            userId: exports.CommonSchemas.userId,
            platform: exports.CommonSchemas.platform,
            type: exports.CommonSchemas.engagementType,
            points: exports.CommonSchemas.points.optional(),
            metadata: exports.CommonSchemas.engagementMetadata,
        }))
            .min(1)
            .max(100), // Limit bulk operations
    }),
    getUserEngagement: zod_1.z.object({
        userId: exports.CommonSchemas.userId,
        platform: exports.CommonSchemas.platform.optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        ...exports.CommonSchemas.pagination.shape,
    }),
};
// Contest validation schemas
exports.ContestSchemas = {
    createContest: exports.CommonSchemas.contestFormData,
    getContestEntries: zod_1.z.object({
        contestId: exports.CommonSchemas.contestId,
        ...exports.CommonSchemas.pagination.shape,
    }),
    claimReward: zod_1.z.object({
        rewardId: zod_1.z.string().uuid("Invalid reward ID format"),
    }),
    distributeRewards: zod_1.z.object({
        contestId: exports.CommonSchemas.contestId,
    }),
};
// Admin validation schemas
exports.AdminSchemas = {
    setUserPoints: zod_1.z.object({
        userId: exports.CommonSchemas.userId,
        points: zod_1.z.number().int().min(-1000).max(1000),
        reason: zod_1.z.string().min(1).max(200),
    }),
    bulkUpdatePoints: zod_1.z.object({
        updates: zod_1.z
            .array(zod_1.z.object({
            userId: exports.CommonSchemas.userId,
            points: zod_1.z.number().int().min(-1000).max(1000),
            reason: zod_1.z.string().min(1).max(200),
        }))
            .min(1)
            .max(50),
    }),
    announceMessage: zod_1.z.object({
        message: zod_1.z.string().min(1).max(1000),
        platforms: zod_1.z.array(exports.CommonSchemas.platform).min(1),
        urgent: zod_1.z.boolean().default(false),
    }),
};
// Rate limiting validation
exports.RateLimitSchemas = {
    checkRateLimit: zod_1.z.object({
        userId: exports.CommonSchemas.userId,
        action: zod_1.z.string().min(1).max(50),
        platform: exports.CommonSchemas.platform,
    }),
};
// Generic validation middleware factory
function validateRequest(schema) {
    return (req, res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const firstError = error.errors[0];
                const validationError = new EngagementErrors_1.ValidationError(`Validation failed: ${firstError.message} at ${firstError.path.join(".")}`, {
                    field: firstError.path.join("."),
                    value: firstError.received || "unknown",
                    expected: firstError.expected || "unknown",
                    errors: error.errors,
                }, req.correlationId);
                next(validationError);
            }
            else {
                next(error);
            }
        }
    };
}
// Process query parameters to convert strings to appropriate types
function processQueryParams(data) {
    const processed = { ...data };
    // Convert string numbers to numbers
    for (const key in processed) {
        const value = processed[key];
        if (typeof value === "string") {
            // Try to convert to number if it looks like a number
            if (/^\d+$/.test(value)) {
                processed[key] = parseInt(value, 10);
            }
            else if (/^\d+\.\d+$/.test(value)) {
                processed[key] = parseFloat(value);
            }
            // Convert boolean strings
            else if (value === "true") {
                processed[key] = true;
            }
            else if (value === "false") {
                processed[key] = false;
            }
        }
    }
    return processed;
}
// Specific validation middleware for common endpoints
exports.validateEngagementTracking = validateRequest(exports.EngagementSchemas.trackEngagement);
exports.validateBulkEngagementTracking = validateRequest(exports.EngagementSchemas.bulkTrackEngagement);
exports.validateGetUserEngagement = validateRequest(exports.EngagementSchemas.getUserEngagement);
exports.validateCreateContest = validateRequest(exports.ContestSchemas.createContest);
exports.validateGetContestEntries = validateRequest(exports.ContestSchemas.getContestEntries);
exports.validateClaimReward = validateRequest(exports.ContestSchemas.claimReward);
exports.validateDistributeRewards = validateRequest(exports.ContestSchemas.distributeRewards);
exports.validateSetUserPoints = validateRequest(exports.AdminSchemas.setUserPoints);
exports.validateBulkUpdatePoints = validateRequest(exports.AdminSchemas.bulkUpdatePoints);
exports.validateAnnounceMessage = validateRequest(exports.AdminSchemas.announceMessage);
// Sanitization middleware
function sanitizeInput(req, res, next) {
    // Sanitize string inputs to prevent XSS
    const sanitizeObject = (obj) => {
        if (typeof obj === "string") {
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
                .replace(/javascript:/gi, "") // Remove javascript: protocols
                .replace(/on\w+=/gi, "") // Remove event handlers
                .trim();
        }
        else if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }
        else if (obj && typeof obj === "object") {
            const sanitized = {};
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
function validateFileUpload(allowedTypes = ["image/jpeg", "image/png", "image/gif"], maxSize = 5 * 1024 * 1024 // 5MB default
) {
    return (req, res, next) => {
        if (!req.file) {
            return next();
        }
        const { mimetype, size } = req.file;
        if (!allowedTypes.includes(mimetype)) {
            return next(new EngagementErrors_1.ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`, { allowedTypes, receivedType: mimetype }, req.correlationId));
        }
        if (size > maxSize) {
            return next(new EngagementErrors_1.ValidationError(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`, { maxSize, receivedSize: size }, req.correlationId));
        }
        next();
    };
}
// Request size validation
function validateRequestSize(maxSize = 1024 * 1024) {
    // 1MB default
    return (req, res, next) => {
        const contentLength = parseInt(req.headers["content-length"] || "0", 10);
        if (contentLength > maxSize) {
            return next(new EngagementErrors_1.ValidationError(`Request too large. Maximum size: ${maxSize / 1024}KB`, { maxSize, receivedSize: contentLength }, req.correlationId));
        }
        next();
    };
}
