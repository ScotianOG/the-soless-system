"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseBot = void 0;
class BaseBot {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        this._isRunning = false;
        this.platform = platform;
        this.engagementTracker = engagementTracker;
        this.userManager = userManager;
        this.rewardManager = rewardManager;
    }
    isRunning() {
        return this._isRunning;
    }
    async handleError(error, context) {
        console.error(`[${this.platform}] Error in ${context}:`, error);
        // Add error reporting integration here
    }
}
exports.BaseBot = BaseBot;
