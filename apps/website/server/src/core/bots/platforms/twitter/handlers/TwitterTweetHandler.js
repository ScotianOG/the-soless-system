"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterTweetHandler = void 0;
// src/core/bots/platforms/twitter/handlers/TwitterTweetHandler.ts
const MessageHandler_1 = require("../../../handlers/MessageHandler");
const ConfigManager_1 = require("../../../../../config/ConfigManager");
const logger_1 = require("../../../../../utils/logger");
const rateLimiter_1 = require("../../../../../utils/rateLimiter");
const errors_1 = require("../../../../../utils/errors");
class TwitterTweetHandler extends MessageHandler_1.MessageHandler {
    constructor(platform, engagementTracker, userManager, rewardManager) {
        super(platform, engagementTracker, userManager, rewardManager);
        this.COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes
        this.rateLimiter = new rateLimiter_1.RateLimiter({
            maxRequests: 300,
            timeWindow: 15 * 60 * 1000, // 15 minutes
        });
    }
    validateTweet(tweet) {
        if (!tweet?.id) {
            throw new errors_1.ValidationError("Invalid tweet: Missing tweet ID");
        }
        if (!tweet?.author_id) {
            throw new errors_1.ValidationError("Invalid tweet: Missing author ID");
        }
        if (!tweet?.text) {
            throw new errors_1.ValidationError("Invalid tweet: Missing tweet content");
        }
    }
    async createEngagementEvent(userId, type, metadata) {
        return {
            platform: this.platform,
            userId,
            type: type === "TWEET" || type === "MENTION" ? "MESSAGE" : "REACTION",
            timestamp: new Date(),
            metadata,
        };
    }
    async handleMessage(tweet) {
        try {
            await this.rateLimiter.checkLimit();
            this.validateTweet(tweet);
            const user = await this.userManager.getUserByPlatform(this.platform, tweet.author_id);
            if (!user) {
                logger_1.logger.warn(`No registered user found for Twitter ID: ${tweet.author_id}`);
                return;
            }
            // Track base tweet engagement
            const engagementEvent = await this.createEngagementEvent(user.id, "MESSAGE", {
                tweetId: tweet.id,
                length: tweet.text.length,
            });
            await this.engagementTracker.trackEngagement(engagementEvent);
            // Handle keyword mentions
            await this.processKeywordMentions(tweet, user.id);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                logger_1.logger.warn("Tweet validation failed:", error.message);
            }
            else if (error instanceof Error &&
                error.message === "Rate limit exceeded") {
                logger_1.logger.warn("Rate limit reached for tweet processing");
            }
            else {
                logger_1.logger.error("Error processing tweet:", error instanceof Error ? error.message : String(error));
            }
        }
    }
    async processKeywordMentions(tweet, userId) {
        try {
            const config = ConfigManager_1.configManager.getPlatformConfig("TWITTER").tracking;
            const tweetText = tweet.text.toLowerCase();
            const mentionedKeywords = [...config.keywords, ...config.hashtags].filter((keyword) => tweetText.includes(keyword.toLowerCase()));
            if (mentionedKeywords.length > 0) {
                const mentionEvent = await this.createEngagementEvent(userId, "MESSAGE", {
                    tweetId: tweet.id,
                    keywords: mentionedKeywords,
                });
                await this.engagementTracker.trackEngagement(mentionEvent);
            }
        }
        catch (error) {
            logger_1.logger.error("Error processing keyword mentions:", error instanceof Error ? error.message : String(error));
        }
    }
    async handleRetweet(tweet) {
        try {
            await this.rateLimiter.checkLimit();
            this.validateTweet(tweet);
            const user = await this.userManager.getUserByPlatform(this.platform, tweet.author_id);
            if (!user) {
                logger_1.logger.warn(`No registered user found for Twitter ID: ${tweet.author_id}`);
                return;
            }
            const originalTweetId = tweet.referenced_tweets?.find((ref) => ref.type === "retweeted")?.id;
            if (!originalTweetId) {
                throw new errors_1.ValidationError("Invalid retweet: No original tweet reference found");
            }
            const retweetEvent = await this.createEngagementEvent(user.id, "REACTION", {
                tweetId: tweet.id,
                originalTweetId: originalTweetId,
            });
            await this.engagementTracker.trackEngagement(retweetEvent);
        }
        catch (error) {
            logger_1.logger.error("Error processing retweet:", error instanceof Error ? error.message : String(error));
        }
    }
    async handleReaction(reaction) {
        try {
            await this.rateLimiter.checkLimit();
            const user = await this.userManager.getUserByPlatform(this.platform, reaction.userId);
            if (!user) {
                logger_1.logger.warn(`No registered user found for Twitter ID: ${reaction.userId}`);
                return;
            }
            const reactionEvent = await this.createEngagementEvent(user.id, "REACTION", {
                tweetId: reaction.messageId,
            });
            await this.engagementTracker.trackEngagement(reactionEvent);
        }
        catch (error) {
            logger_1.logger.error("Error processing reaction:", error instanceof Error ? error.message : String(error));
        }
    }
}
exports.TwitterTweetHandler = TwitterTweetHandler;
