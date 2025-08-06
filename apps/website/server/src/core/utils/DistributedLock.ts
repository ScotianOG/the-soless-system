// filepath: server/src/core/utils/DistributedLock.ts
import Redis from "ioredis";
import { logger } from "../utils/Logger";

export interface LockOptions {
  ttl?: number; // Time to live in milliseconds (default: 30s)
  retryDelay?: number; // Delay between retry attempts (default: 100ms)
  maxRetries?: number; // Maximum number of retry attempts (default: 10)
}

export class DistributedLock {
  private redis: Redis;
  private defaultOptions: Required<LockOptions> = {
    ttl: 30000, // 30 seconds
    retryDelay: 100, // 100ms
    maxRetries: 10,
  };

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on("error", (error) => {
      logger.error("Redis connection error", undefined, error);
    });
  }

  /**
   * Acquire a distributed lock
   */
  async acquire(
    lockKey: string,
    options: LockOptions = {}
  ): Promise<string | null> {
    const opts = { ...this.defaultOptions, ...options };
    const lockValue = this.generateLockValue();
    const lockKeyFull = `lock:${lockKey}`;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        // Try to set the lock with NX (only if not exists) and PX (expiration in ms)
        const result = await this.redis.set(
          lockKeyFull,
          lockValue,
          "PX",
          opts.ttl,
          "NX"
        );

        if (result === "OK") {
          logger.debug(`Lock acquired: ${lockKey}`, {
            metadata: { lockValue, ttl: opts.ttl, attempt: attempt + 1 },
          });
          return lockValue;
        }

        // Lock not acquired, wait before retry
        if (attempt < opts.maxRetries) {
          await this.sleep(opts.retryDelay);
        }
      } catch (error) {
        logger.error(
          `Error acquiring lock ${lockKey}`,
          undefined,
          error instanceof Error ? error : new Error(String(error))
        );
        if (attempt === opts.maxRetries) {
          throw error;
        }
        await this.sleep(opts.retryDelay);
      }
    }

    logger.warn(
      `Failed to acquire lock after ${opts.maxRetries + 1} attempts: ${lockKey}`
    );
    return null;
  }

  /**
   * Release a distributed lock
   */
  async release(lockKey: string, lockValue: string): Promise<boolean> {
    const lockKeyFull = `lock:${lockKey}`;

    // Lua script to ensure we only delete our lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = (await this.redis.eval(
        script,
        1,
        lockKeyFull,
        lockValue
      )) as number;
      const released = result === 1;

      if (released) {
        logger.debug(`Lock released: ${lockKey}`, { metadata: { lockValue } });
      } else {
        logger.warn(`Failed to release lock (may have expired): ${lockKey}`, {
          metadata: { lockValue },
        });
      }

      return released;
    } catch (error) {
      logger.error(
        `Error releasing lock ${lockKey}`,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Extend the TTL of an existing lock
   */
  async extend(
    lockKey: string,
    lockValue: string,
    additionalTtl: number
  ): Promise<boolean> {
    const lockKeyFull = `lock:${lockKey}`;

    // Lua script to extend TTL only if we own the lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    try {
      const result = (await this.redis.eval(
        script,
        1,
        lockKeyFull,
        lockValue,
        additionalTtl
      )) as number;
      const extended = result === 1;

      if (extended) {
        logger.debug(`Lock extended: ${lockKey}`, {
          metadata: { lockValue, additionalTtl },
        });
      }

      return extended;
    } catch (error) {
      logger.error(
        `Error extending lock ${lockKey}`,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Execute a function with distributed lock protection
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const lockValue = await this.acquire(lockKey, options);

    if (!lockValue) {
      throw new Error(`Failed to acquire lock: ${lockKey}`);
    }

    try {
      logger.debug(`Executing function with lock: ${lockKey}`);
      const result = await fn();
      return result;
    } finally {
      await this.release(lockKey, lockValue);
    }
  }

  /**
   * Check if a lock exists
   */
  async exists(lockKey: string): Promise<boolean> {
    const lockKeyFull = `lock:${lockKey}`;
    try {
      const result = await this.redis.exists(lockKeyFull);
      return result === 1;
    } catch (error) {
      logger.error(
        `Error checking lock existence ${lockKey}`,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Get the current holder of a lock
   */
  async getHolder(lockKey: string): Promise<string | null> {
    const lockKeyFull = `lock:${lockKey}`;
    try {
      return await this.redis.get(lockKeyFull);
    } catch (error) {
      logger.error(
        `Error getting lock holder ${lockKey}`,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  /**
   * Force release a lock (dangerous - use only for cleanup)
   */
  async forceRelease(lockKey: string): Promise<boolean> {
    const lockKeyFull = `lock:${lockKey}`;
    try {
      const result = await this.redis.del(lockKeyFull);
      const released = result === 1;

      if (released) {
        logger.warn(`Lock force released: ${lockKey}`);
      }

      return released;
    } catch (error) {
      logger.error(
        `Error force releasing lock ${lockKey}`,
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  private generateLockValue(): string {
    return `${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup - close Redis connection
   */
  async cleanup(): Promise<void> {
    try {
      await this.redis.quit();
      logger.debug("DistributedLock Redis connection closed");
    } catch (error) {
      logger.error(
        "Error closing DistributedLock Redis connection",
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Alias methods for backward compatibility
   */
  async acquireLock(
    lockKey: string,
    ttl: number = 30000
  ): Promise<string | null> {
    return this.acquire(lockKey, { ttl });
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    return this.release(lockKey, lockValue);
  }
}

// Singleton instance
let lockInstance: DistributedLock | null = null;

export function getDistributedLock(): DistributedLock {
  if (!lockInstance) {
    lockInstance = new DistributedLock();
  }
  return lockInstance;
}

// Cleanup on process exit
process.on("SIGINT", async () => {
  if (lockInstance) {
    await lockInstance.cleanup();
  }
});

process.on("SIGTERM", async () => {
  if (lockInstance) {
    await lockInstance.cleanup();
  }
});
