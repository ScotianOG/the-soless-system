"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordMessageHandler = void 0;
const MessageHandler_1 = require("../../../handlers/MessageHandler");
class DiscordMessageHandler extends MessageHandler_1.MessageHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        super(platform, engagementTracker, userManager, rewardManager);
    }
    async handleMessage(message) {
        if (message.author.bot)
            return;
        const user = await this.userManager.getUserByPlatform(this.platform, message.author.id);
        if (!user)
            return;
        await this.processMessage(user.id, message.content);
        // Check for embeds/attachments
        if (message.attachments.size > 0 || message.embeds.length > 0) {
            await this.engagementTracker.trackEngagement({
                userId: user.id,
                platform: this.platform,
                type: 'MESSAGE',
                timestamp: new Date(),
                metadata: {
                    attachments: message.attachments.size,
                    embeds: message.embeds.length
                }
            });
        }
        // Check for reward eligibility
        await this.rewardManager.checkAndAwardEngagementRewards(user.id);
    }
    async handleReaction(reaction, user) {
        if (user.bot)
            return;
        const discordUser = await this.userManager.getUserByPlatform(this.platform, user.id);
        if (!discordUser)
            return;
        await this.engagementTracker.trackEngagement({
            userId: discordUser.id,
            platform: this.platform,
            type: 'REACTION',
            timestamp: new Date(),
            metadata: {
                emoji: reaction.emoji.name,
                messageId: reaction.message.id
            }
        });
        // Check for reward eligibility
        await this.rewardManager.checkAndAwardEngagementRewards(discordUser.id);
    }
}
exports.DiscordMessageHandler = DiscordMessageHandler;
