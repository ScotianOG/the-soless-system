"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminHandler = void 0;
const EngagementTrackerFactory_1 = require("../../engagement/EngagementTrackerFactory");
const UserManager_1 = require("../../user/UserManager");
const RewardManager_1 = require("../../contest/RewardManager");
class AdminHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        this.platform = platform;
        this.engagementTracker =
            engagementTracker || EngagementTrackerFactory_1.EngagementTrackerFactory.getTracker(platform);
        this.userManager = userManager || new UserManager_1.UserManager();
        this.rewardManager = rewardManager || new RewardManager_1.RewardManager();
    }
    /**
     * Track admin command usage
     * @param userId The admin's user ID
     * @param command The command that was used
     */
    async trackAdminCommand(userId, command) {
        if (this.engagementTracker) {
            await this.engagementTracker.trackCommand(userId, `admin_${command}`);
        }
    }
    /**
     * Format statistics for display
     * @param stats The statistics object
     */
    formatStats(stats) {
        return `
Platform Statistics:
Total Users: ${stats.totalUsers}
Active Users (24h): ${stats.activeUsers}
Total Engagements: ${stats.totalEngagements}
    `.trim();
    }
    /**
     * Validate admin command arguments
     * @param args The command arguments
     * @param minArgs Minimum number of required arguments
     * @param usage Usage string to show if validation fails
     */
    validateArgs(args, minArgs, usage) {
        return args.length >= minArgs;
    }
    /**
     * Log admin actions for auditing
     * @param userId Admin user ID
     * @param action Action performed
     * @param details Additional details about the action
     */
    async logAdminAction(userId, action, details) {
        console.log(`[ADMIN ACTION] ${this.platform} - ${userId} - ${action}`, details || "");
    }
}
exports.AdminHandler = AdminHandler;
