"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordVoiceHandler = void 0;
const BaseHandler_1 = require("../../../handlers/BaseHandler");
const ConfigManager_1 = require("../../../../../config/ConfigManager");
class DiscordVoiceHandler extends BaseHandler_1.BaseHandler {
    constructor() {
        super(...arguments);
        this.voiceSessionTracker = new Map();
    }
    async handleVoiceStateUpdate(oldState, newState) {
        const userId = newState.member?.id;
        if (!userId || newState.member?.user.bot)
            return;
        const user = await this.userManager.getUserByPlatform("DISCORD", userId);
        if (!user)
            return;
        // User joined voice channel
        if (!oldState.channelId && newState.channelId) {
            this.voiceSessionTracker.set(userId, new Date());
        }
        // User left voice channel
        else if (oldState.channelId && !newState.channelId) {
            const joinTime = this.voiceSessionTracker.get(userId);
            if (!joinTime)
                return;
            const duration = (new Date().getTime() - joinTime.getTime()) / 1000;
            this.voiceSessionTracker.delete(userId);
            if (duration >=
                ConfigManager_1.configManager.getPlatformConfig("DISCORD").voiceChat.minDuration) {
                await this.trackEngagement({
                    userId: user.id,
                    type: "MESSAGE",
                    metadata: {
                        duration,
                        channelId: oldState.channelId,
                    },
                });
            }
        }
    }
}
exports.DiscordVoiceHandler = DiscordVoiceHandler;
