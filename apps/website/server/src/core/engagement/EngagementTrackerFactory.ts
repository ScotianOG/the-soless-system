// server/src/core/engagement/EngagementTrackerFactory.ts
import { Platform } from "@prisma/client";
import { EngagementTracker } from "./EngagementTracker";

/**
 * Factory for creating EngagementTracker instances
 * Replaces the problematic singleton pattern
 */
export class EngagementTrackerFactory {
  private static trackers = new Map<Platform, EngagementTracker>();

  /**
   * Get or create an EngagementTracker for a specific platform
   * Each platform gets its own isolated instance
   */
  static getTracker(platform: Platform): EngagementTracker {
    if (!this.trackers.has(platform)) {
      this.trackers.set(platform, new EngagementTracker(platform));
    }
    return this.trackers.get(platform)!;
  }

  /**
   * Create a new tracker instance (useful for testing)
   */
  static createTracker(platform: Platform): EngagementTracker {
    return new EngagementTracker(platform);
  }

  /**
   * Clear all cached trackers (useful for testing)
   */
  static clearCache(): void {
    this.trackers.clear();
  }

  /**
   * Get all active platforms
   */
  static getActivePlatforms(): Platform[] {
    return Array.from(this.trackers.keys());
  }
}
