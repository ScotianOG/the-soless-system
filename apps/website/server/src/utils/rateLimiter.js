"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor(config) {
        this.timestamps = new Map();
        this.windowMs = config.timeWindow;
        this.maxRequests = config.maxRequests;
    }
    async checkLimit(key = 'default') {
        const now = Date.now();
        const timestamps = this.timestamps.get(key) || [];
        // Remove timestamps outside the window
        const validTimestamps = timestamps.filter((timestamp) => now - timestamp < this.windowMs);
        if (validTimestamps.length >= this.maxRequests) {
            return true;
        }
        validTimestamps.push(now);
        this.timestamps.set(key, validTimestamps);
        return false;
    }
    clear(key) {
        this.timestamps.delete(key);
    }
    clearAll() {
        this.timestamps.clear();
    }
}
exports.RateLimiter = RateLimiter;
exports.default = RateLimiter;
