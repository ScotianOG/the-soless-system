"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
class MessageHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        this.platform = platform;
        this.engagementTracker = engagementTracker;
        this.userManager = userManager;
        this.rewardManager = rewardManager;
    }
    async processMessage(userId, content) {
        await this.engagementTracker.trackEngagement({
            userId,
            platform: this.platform,
            type: "MESSAGE",
            metadata: {
                content,
                length: content.length,
                wordCount: content.split(/\s+/).length,
            },
            timestamp: new Date(),
        });
    }
}
exports.MessageHandler = MessageHandler;
