"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ConcurrencyError = exports.DatabaseTransactionError = exports.UserNotFoundError = exports.ContestNotFoundError = exports.DailyLimitError = exports.CooldownError = exports.ValidationError = exports.EngagementError = void 0;
// server/src/core/errors/EngagementErrors.ts
class EngagementError extends Error {
    constructor(message, code, statusCode = 500, context, correlationId) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.correlationId = correlationId;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, EngagementError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            context: this.context,
            correlationId: this.correlationId,
            stack: this.stack,
        };
    }
}
exports.EngagementError = EngagementError;
class ValidationError extends EngagementError {
    constructor(message, context, correlationId) {
        super(message, "VALIDATION_ERROR", 400, context, correlationId);
    }
}
exports.ValidationError = ValidationError;
class CooldownError extends EngagementError {
    constructor(platform, type, remainingTime, correlationId) {
        const message = `Engagement type "${type}" is on cooldown for platform "${platform}". Try again in ${remainingTime} seconds.`;
        super(message, "COOLDOWN_ACTIVE", 429, {
            platform,
            type,
            remainingTime,
        }, correlationId);
    }
}
exports.CooldownError = CooldownError;
class DailyLimitError extends EngagementError {
    constructor(platform, type, limit, correlationId) {
        const message = `Daily limit of ${limit} reached for engagement type "${type}" on platform "${platform}".`;
        super(message, "DAILY_LIMIT_EXCEEDED", 429, {
            platform,
            type,
            limit,
        }, correlationId);
    }
}
exports.DailyLimitError = DailyLimitError;
class ContestNotFoundError extends EngagementError {
    constructor(contestId, correlationId) {
        const message = contestId
            ? `Contest with ID "${contestId}" not found`
            : "No active contest found";
        super(message, "CONTEST_NOT_FOUND", 404, { contestId }, correlationId);
    }
}
exports.ContestNotFoundError = ContestNotFoundError;
class UserNotFoundError extends EngagementError {
    constructor(userId, correlationId) {
        super(`User with ID "${userId}" not found`, "USER_NOT_FOUND", 404, { userId }, correlationId);
    }
}
exports.UserNotFoundError = UserNotFoundError;
class DatabaseTransactionError extends EngagementError {
    constructor(operation, originalError, correlationId) {
        super(`Database transaction failed during "${operation}": ${originalError.message}`, "DATABASE_TRANSACTION_ERROR", 500, { operation, originalError: originalError.message }, correlationId);
    }
}
exports.DatabaseTransactionError = DatabaseTransactionError;
class ConcurrencyError extends EngagementError {
    constructor(resource, correlationId) {
        super(`Concurrent modification detected for resource: ${resource}`, "CONCURRENCY_ERROR", 409, { resource }, correlationId);
    }
}
exports.ConcurrencyError = ConcurrencyError;
class RateLimitError extends EngagementError {
    constructor(userId, dailyPoints, maxPoints, correlationId) {
        super(`Daily point limit exceeded. Current: ${dailyPoints}, Max: ${maxPoints}`, "RATE_LIMIT_EXCEEDED", 429, { userId, dailyPoints, maxPoints }, correlationId);
    }
}
exports.RateLimitError = RateLimitError;
