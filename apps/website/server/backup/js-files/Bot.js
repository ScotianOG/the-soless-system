"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
class Bot {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        this.platform = platform;
        this.engagementTracker = engagementTracker;
        this.userManager = userManager;
        this.rewardManager = rewardManager;
    }
}
exports.Bot = Bot;
