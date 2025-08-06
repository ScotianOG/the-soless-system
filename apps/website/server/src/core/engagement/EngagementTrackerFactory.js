"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementTrackerFactory = void 0;
const EngagementTracker_1 = require("./EngagementTracker");
/**
 * Factory for creating EngagementTracker instances
 * Replaces the problematic singleton pattern
 */
class EngagementTrackerFactory {
    /**
     * Get or create an EngagementTracker for a specific platform
     * Each platform gets its own isolated instance
     */
    static getTracker(platform) {
        if (!this.trackers.has(platform)) {
            this.trackers.set(platform, new EngagementTracker_1.EngagementTracker(platform));
        }
        return this.trackers.get(platform);
    }
    /**
     * Create a new tracker instance (useful for testing)
     */
    static createTracker(platform) {
        return new EngagementTracker_1.EngagementTracker(platform);
    }
    /**
     * Clear all cached trackers (useful for testing)
     */
    static clearCache() {
        this.trackers.clear();
    }
    /**
     * Get all active platforms
     */
    static getActivePlatforms() {
        return Array.from(this.trackers.keys());
    }
}
exports.EngagementTrackerFactory = EngagementTrackerFactory;
EngagementTrackerFactory.trackers = new Map();
