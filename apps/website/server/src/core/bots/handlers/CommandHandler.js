"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandler = void 0;
class CommandHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        this.platform = platform;
        this.engagementTracker = engagementTracker;
        this.userManager = userManager;
        this.rewardManager = rewardManager;
    }
    async trackCommand(userId, command, args) {
        await this.engagementTracker.trackEngagement({
            userId,
            platform: this.platform,
            type: "COMMAND",
            metadata: {
                command,
                args,
            },
            timestamp: new Date(),
        });
    }
}
exports.CommandHandler = CommandHandler;
