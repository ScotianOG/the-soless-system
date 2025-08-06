// server/src/core/errors/EngagementErrors.ts
export class EngagementError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;
  public readonly correlationId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>,
    correlationId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.correlationId = correlationId;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EngagementError.prototype);
  }

  toJSON(): Record<string, any> {
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

export class ValidationError extends EngagementError {
  constructor(
    message: string,
    context?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, "VALIDATION_ERROR", 400, context, correlationId);
  }
}

export class CooldownError extends EngagementError {
  constructor(
    platform: string,
    type: string,
    remainingTime: number,
    correlationId?: string
  ) {
    const message = `Engagement type "${type}" is on cooldown for platform "${platform}". Try again in ${remainingTime} seconds.`;
    super(
      message,
      "COOLDOWN_ACTIVE",
      429,
      {
        platform,
        type,
        remainingTime,
      },
      correlationId
    );
  }
}

export class DailyLimitError extends EngagementError {
  constructor(
    platform: string,
    type: string,
    limit: number,
    correlationId?: string
  ) {
    const message = `Daily limit of ${limit} reached for engagement type "${type}" on platform "${platform}".`;
    super(
      message,
      "DAILY_LIMIT_EXCEEDED",
      429,
      {
        platform,
        type,
        limit,
      },
      correlationId
    );
  }
}

export class ContestNotFoundError extends EngagementError {
  constructor(contestId?: string, correlationId?: string) {
    const message = contestId
      ? `Contest with ID "${contestId}" not found`
      : "No active contest found";
    super(message, "CONTEST_NOT_FOUND", 404, { contestId }, correlationId);
  }
}

export class UserNotFoundError extends EngagementError {
  constructor(userId: string, correlationId?: string) {
    super(
      `User with ID "${userId}" not found`,
      "USER_NOT_FOUND",
      404,
      { userId },
      correlationId
    );
  }
}

export class DatabaseTransactionError extends EngagementError {
  constructor(operation: string, originalError: Error, correlationId?: string) {
    super(
      `Database transaction failed during "${operation}": ${originalError.message}`,
      "DATABASE_TRANSACTION_ERROR",
      500,
      { operation, originalError: originalError.message },
      correlationId
    );
  }
}

export class ConcurrencyError extends EngagementError {
  constructor(resource: string, correlationId?: string) {
    super(
      `Concurrent modification detected for resource: ${resource}`,
      "CONCURRENCY_ERROR",
      409,
      { resource },
      correlationId
    );
  }
}

export class RateLimitError extends EngagementError {
  constructor(
    userId: string,
    dailyPoints: number,
    maxPoints: number,
    correlationId?: string
  ) {
    super(
      `Daily point limit exceeded. Current: ${dailyPoints}, Max: ${maxPoints}`,
      "RATE_LIMIT_EXCEEDED",
      429,
      { userId, dailyPoints, maxPoints },
      correlationId
    );
  }
}
