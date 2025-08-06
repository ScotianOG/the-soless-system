// src/core/bots/platforms/discord/handlers/DiscordVoiceHandler.ts
import { VoiceState } from "discord.js";
import { BaseHandler } from "../../../handlers/BaseHandler";
import { configManager } from "../../../../../config/ConfigManager";

export class DiscordVoiceHandler extends BaseHandler {
  private voiceSessionTracker: Map<string, Date> = new Map();

  async handleVoiceStateUpdate(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    const userId = newState.member?.id;
    if (!userId || newState.member?.user.bot) return;

    const user = await this.userManager.getUserByPlatform("DISCORD", userId);
    if (!user) return;

    // User joined voice channel
    if (!oldState.channelId && newState.channelId) {
      this.voiceSessionTracker.set(userId, new Date());
    }
    // User left voice channel
    else if (oldState.channelId && !newState.channelId) {
      const joinTime = this.voiceSessionTracker.get(userId);
      if (!joinTime) return;

      const duration = (new Date().getTime() - joinTime.getTime()) / 1000;
      this.voiceSessionTracker.delete(userId);

      if (
        duration >=
        configManager.getPlatformConfig("DISCORD").voiceChat.minDuration
      ) {
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
