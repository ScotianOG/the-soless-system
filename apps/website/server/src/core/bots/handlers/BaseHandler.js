"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminHandler = exports.CommandHandler = exports.MessageHandler = exports.BaseHandler = void 0;
// Base handler for message processing
class BaseHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        this.platform = platform;
        this.engagementTracker = engagementTracker;
        this.userManager = userManager;
        this.rewardManager = rewardManager;
    }
    async trackEngagement(data) {
        await this.engagementTracker.trackEngagement({
            platform: this.platform,
            userId: data.userId,
            type: data.type,
            metadata: data.metadata,
            timestamp: new Date()
        });
    }
}
exports.BaseHandler = BaseHandler;
// Base message handler class
class MessageHandler {
}
exports.MessageHandler = MessageHandler;
class CommandHandler {
}
exports.CommandHandler = CommandHandler;
class AdminHandler {
}
exports.AdminHandler = AdminHandler;
