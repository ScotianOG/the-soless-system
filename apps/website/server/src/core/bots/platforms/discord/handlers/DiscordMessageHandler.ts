import { Message, MessageReaction, User, PartialUser } from 'discord.js';
import { MessageHandler } from '../../../handlers/MessageHandler';
import { Platform } from '../../../../types';
import { EngagementTracker } from '../../../../engagement/EngagementTracker';
import { UserManager } from '../../../../user/UserManager';
import { RewardManager } from '../../../../contest/RewardManager';

export class DiscordMessageHandler extends MessageHandler {
    constructor(
        platform: Platform,
        engagementTracker: EngagementTracker,
        userManager: UserManager,
        rewardManager: RewardManager
    ) {
        super(platform, engagementTracker, userManager, rewardManager);
    }

    async handleMessage(message: Message): Promise<void> {
        if (message.author.bot) return;

        const user = await this.userManager.getUserByPlatform(
            this.platform,
            message.author.id
        );
        if (!user) return;

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

    async handleReaction(reaction: MessageReaction, user: User | PartialUser): Promise<void> {
        if (user.bot) return;

        const discordUser = await this.userManager.getUserByPlatform(
            this.platform,
            user.id
        );
        if (!discordUser) return;

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
