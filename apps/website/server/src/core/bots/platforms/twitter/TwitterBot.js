"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterBot = void 0;
const twitter_api_v2_1 = require("twitter-api-v2");
const BasePlatformBot_1 = require("../BasePlatformBot");
const EngagementTrackerFactory_1 = require("../../../engagement/EngagementTrackerFactory");
const client_1 = require("@prisma/client");
const TwitterTweetHandler_1 = require("./handlers/TwitterTweetHandler");
const TwitterStreamHandler_1 = require("./handlers/TwitterStreamHandler");
const UserManager_1 = require("../../../user/UserManager");
const RewardManager_1 = require("../../../contest/RewardManager");
class TwitterBot extends BasePlatformBot_1.BasePlatformBot {
    constructor(config) {
        super(config);
        this.stream = null;
        this.keywords = [
            "soless",
            "solarium",
            "solspace",
            "soulie",
            "#soless",
            "@SOLessSystem",
        ];
        this.accountId = null;
        this.isStreaming = false;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.token = config.token;
        this.client = new twitter_api_v2_1.TwitterApi({
            appKey: this.clientId || "",
            appSecret: this.clientSecret || "",
            accessToken: this.token || "",
            accessSecret: config.accessSecret || "",
        });
        // Initialize services
        this.prisma = new client_1.PrismaClient();
        const engagementTracker = EngagementTrackerFactory_1.EngagementTrackerFactory.getTracker("TWITTER");
        const userManager = UserManager_1.UserManager.getInstance();
        const rewardManager = RewardManager_1.RewardManager.getInstance();
        // Initialize handlers
        this.tweetHandler = new TwitterTweetHandler_1.TwitterTweetHandler("TWITTER", engagementTracker, userManager, rewardManager);
        this.streamHandler = new TwitterStreamHandler_1.TwitterStreamHandler(this.client, "TWITTER", engagementTracker, userManager, rewardManager);
    }
    async start() {
        try {
            // Verify credentials
            const user = await this.client.v2.me();
            this.accountId = user.data.id;
            console.log(`Twitter bot started successfully as @${user.data.username} (ID: ${this.accountId})`);
            // Start stream after getting account ID
            await this.setupStream();
        }
        catch (error) {
            console.error("Failed to start Twitter bot:", error);
            throw error;
        }
    }
    async setupStream() {
        if (!this.accountId)
            return;
        try {
            console.log("Setting up Twitter stream...");
            // Set up rules for the stream
            const rules = await this.client.v2.streamRules();
            // Delete any existing rules
            if (rules.data?.length) {
                await this.client.v2.updateStreamRules({
                    delete: { ids: rules.data.map((rule) => rule.id) },
                });
            }
            // Add our tracking rules
            await this.client.v2.updateStreamRules({
                add: [
                    { value: `${this.keywords.join(" OR ")}`, tag: "soless_keywords" },
                                    const rules = [
                    { value: `@SOLessSystem`, tag: "mentions" },
                ],
            });
            // Start filtered stream and attach handlers
            const stream = await this.client.v2.searchStream({
                "tweet.fields": [
                    "referenced_tweets",
                    "author_id",
                    "created_at",
                    "public_metrics",
                ],
                "user.fields": ["username", "public_metrics"],
                expansions: [
                    "author_id",
                    "referenced_tweets.id",
                    "in_reply_to_user_id",
                ],
            });
            this.stream = stream;
            this.isStreaming = true;
            // Process incoming tweets
            stream.on("data", async (data) => {
                try {
                    // Check if it's a retweet
                    if (data.data.referenced_tweets?.some((ref) => ref.type === "retweeted")) {
                        await this.tweetHandler.handleRetweet(data.data);
                    }
                    else {
                        await this.tweetHandler.handleMessage(data.data);
                    }
                }
                catch (error) {
                    console.error("Error processing tweet:", error);
                }
            });
            stream.on("error", (error) => {
                console.error("Twitter stream error:", error);
                this.isStreaming = false;
            });
            console.log("Twitter stream started successfully");
        }
        catch (error) {
            console.error("Failed to set up Twitter stream:", error);
            this.isStreaming = false;
        }
    }
    async stop() {
        try {
            // Clean up the stream if it exists
            if (this.stream) {
                this.stream.close();
                this.isStreaming = false;
            }
            console.log("Twitter bot stopped successfully");
        }
        catch (error) {
            console.error("Failed to stop Twitter bot:", error);
            throw error;
        }
    }
    async searchRecentMentions() {
        try {
            const mentions = await this.client.v2.search(`@SOLessSystem`, {
                "tweet.fields": ["referenced_tweets", "created_at", "public_metrics"],
                max_results: 10,
            });
            return mentions;
        }
        catch (error) {
            console.error("Failed to fetch recent mentions:", error);
            return null;
        }
    }
    async trackTweet(tweetId) {
        try {
            const tweet = await this.client.v2.singleTweet(tweetId, {
                "tweet.fields": [
                    "referenced_tweets",
                    "created_at",
                    "public_metrics",
                    "author_id",
                ],
                "user.fields": ["username"],
                expansions: ["author_id"],
            });
            // Check if it's a retweet
            if (tweet.data.referenced_tweets?.some((ref) => ref.type === "retweeted")) {
                await this.tweetHandler.handleRetweet(tweet.data);
            }
            else {
                await this.tweetHandler.handleMessage(tweet.data);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to track tweet ${tweetId}:`, error);
            return false;
        }
    }
    getClient() {
        return this.client;
    }
}
exports.TwitterBot = TwitterBot;
