"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterStreamHandler = void 0;
const BaseHandler_1 = require("../../../handlers/BaseHandler");
const ConfigManager_1 = require("../../../../../config/ConfigManager");
const TwitterTweetHandler_1 = require("./TwitterTweetHandler");
const logger_1 = require("../../../../../utils/logger");
const retry_1 = require("../../../../../utils/retry");
const rateLimiter_1 = require("../../../../../utils/rateLimiter");
class TwitterStreamHandler extends BaseHandler_1.BaseHandler {
    constructor(client, platform, engagementTracker, userManager, rewardManager) {
        super(platform, engagementTracker, userManager, rewardManager);
        this.stream = null;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000;
        this.client = client;
        this.tweetHandler = new TwitterTweetHandler_1.TwitterTweetHandler("TWITTER", engagementTracker, userManager, rewardManager);
        this.rateLimiter = new rateLimiter_1.RateLimiter({
            maxRequests: 450,
            timeWindow: 15 * 60 * 1000, // 15 minutes
        });
    }
    async resetStreamRules() {
        try {
            const rules = await this.client.v2.streamRules();
            if (rules.data?.length) {
                await this.client.v2.updateStreamRules({
                    delete: { ids: rules.data.map((rule) => rule.id) },
                });
            }
        }
        catch (error) {
            logger_1.logger.error("Failed to reset stream rules", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async addTrackingRules() {
        try {
            const config = ConfigManager_1.configManager.getPlatformConfig("TWITTER").tracking;
            const rules = [
                ...config.keywords.map((keyword) => ({
                    value: keyword,
                    tag: `keyword_${keyword}`,
                })),
                ...config.hashtags.map((hashtag) => ({
                    value: hashtag,
                    tag: `hashtag_${hashtag}`,
                })),
            ];
            await this.client.v2.updateStreamRules({
                add: rules,
            });
        }
        catch (error) {
            logger_1.logger.error("Failed to add tracking rules", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async startStream() {
        try {
            this.stream = await this.client.v2.searchStream({
                "tweet.fields": [
                    "author_id",
                    "created_at",
                    "referenced_tweets",
                    "attachments",
                ],
                expansions: ["referenced_tweets.id"],
            });
            this.stream.on("data", async (data) => {
                try {
                    await this.rateLimiter.checkLimit();
                    if (data.data.referenced_tweets?.some((ref) => ref.type === "retweeted")) {
                        await this.tweetHandler.handleRetweet(data.data);
                    }
                    else {
                        await this.tweetHandler.handleMessage(data.data);
                    }
                }
                catch (error) {
                    if (error instanceof Error &&
                        error.message === "Rate limit exceeded") {
                        logger_1.logger.warn("Rate limit reached, skipping tweet processing");
                    }
                    else {
                        logger_1.logger.error("Error processing tweet:", error instanceof Error ? error.message : String(error));
                    }
                }
            });
            this.stream.on("error", (error) => {
                logger_1.logger.error("Error in Twitter stream:", error);
                this.reconnectStream();
            });
        }
        catch (error) {
            logger_1.logger.error("Failed to start stream", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async reconnectStream() {
        try {
            await this.cleanup();
            await (0, retry_1.retry)(() => this.startStream(), this.MAX_RETRIES, this.RETRY_DELAY);
            logger_1.logger.info("Successfully reconnected to Twitter stream");
        }
        catch (error) {
            logger_1.logger.error("Failed to reconnect to Twitter stream:", error instanceof Error ? error.message : String(error));
            // Schedule reconnection attempt with exponential backoff
            setTimeout(() => this.reconnectStream(), this.RETRY_DELAY * Math.pow(2, this.MAX_RETRIES));
        }
    }
    async setupStream() {
        try {
            await this.resetStreamRules();
            await this.addTrackingRules();
            await this.startStream();
            logger_1.logger.info("Twitter stream setup completed successfully");
        }
        catch (error) {
            logger_1.logger.error("Failed to setup Twitter stream", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    async cleanup() {
        if (this.stream) {
            try {
                const stream = await this.stream;
                if (stream?.destroy) {
                    await stream.destroy();
                }
                this.stream = null;
                logger_1.logger.info("Twitter stream cleaned up successfully");
            }
            catch (error) {
                logger_1.logger.error("Error cleaning up Twitter stream:", error instanceof Error ? error.message : String(error));
                throw error;
            }
        }
    }
}
exports.TwitterStreamHandler = TwitterStreamHandler;
