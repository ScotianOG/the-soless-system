import { RateLimiterConfig } from '../types';

export class RateLimiter {
  private timestamps: Map<string, number[]>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(config: RateLimiterConfig) {
    this.timestamps = new Map();
    this.windowMs = config.timeWindow;
    this.maxRequests = config.maxRequests;
  }

  async checkLimit(key: string = 'default'): Promise<boolean> {
    const now = Date.now();
    const timestamps = this.timestamps.get(key) || [];

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validTimestamps.length >= this.maxRequests) {
      return true;
    }

    validTimestamps.push(now);
    this.timestamps.set(key, validTimestamps);
    return false;
  }

  clear(key: string): void {
    this.timestamps.delete(key);
  }

  clearAll(): void {
    this.timestamps.clear();
  }
}

export default RateLimiter;
