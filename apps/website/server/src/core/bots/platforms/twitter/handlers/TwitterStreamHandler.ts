// src/core/bots/platforms/twitter/handlers/TwitterStreamHandler.ts
import { TwitterApi } from "twitter-api-v2";
import { BaseHandler } from "../../../handlers/BaseHandler";
import { configManager } from "../../../../../config/ConfigManager";
import { TwitterTweetHandler } from "./TwitterTweetHandler";
import { Platform } from "../../../../types/platform";
import { logger } from "../../../../../utils/logger";
import { retry } from "../../../../../utils/retry";
import { RateLimiter } from "../../../../../utils/rateLimiter";

interface StreamRule {
  value: string;
  tag: string;
}

export class TwitterStreamHandler extends BaseHandler {
  private client: TwitterApi;
  private tweetHandler: TwitterTweetHandler;
  private stream: ReturnType<TwitterApi["v2"]["searchStream"]> | null = null;
  private rateLimiter: RateLimiter;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor(
    client: TwitterApi,
    platform: Platform,
    engagementTracker: any,
    userManager: any,
    rewardManager: any
  ) {
    super(platform, engagementTracker, userManager, rewardManager);
    this.client = client;
    this.tweetHandler = new TwitterTweetHandler(
      "TWITTER",
      engagementTracker,
      userManager,
      rewardManager
    );
    this.rateLimiter = new RateLimiter({
      maxRequests: 450,
      timeWindow: 15 * 60 * 1000, // 15 minutes
    });
  }

  private async resetStreamRules(): Promise<void> {
    try {
      const rules = await this.client.v2.streamRules();
      if (rules.data?.length) {
        await this.client.v2.updateStreamRules({
          delete: { ids: rules.data.map((rule) => rule.id) },
        });
      }
    } catch (error) {
      logger.error(
        "Failed to reset stream rules",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private async addTrackingRules(): Promise<void> {
    try {
      const config = configManager.getPlatformConfig("TWITTER").tracking;
      const rules: StreamRule[] = [
        ...config.keywords.map((keyword: string) => ({
          value: keyword,
          tag: `keyword_${keyword}`,
        })),
        ...config.hashtags.map((hashtag: string) => ({
          value: hashtag,
          tag: `hashtag_${hashtag}`,
        })),
      ];

      await this.client.v2.updateStreamRules({
        add: rules,
      });
    } catch (error) {
      logger.error(
        "Failed to add tracking rules",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private async startStream(): Promise<void> {
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

      this.stream.on("data", async (data: any) => {
        try {
          await this.rateLimiter.checkLimit();

          if (
            data.data.referenced_tweets?.some(
              (ref: { type: string }) => ref.type === "retweeted"
            )
          ) {
            await this.tweetHandler.handleRetweet(data.data);
          } else {
            await this.tweetHandler.handleMessage(data.data);
          }
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Rate limit exceeded"
          ) {
            logger.warn("Rate limit reached, skipping tweet processing");
          } else {
            logger.error(
              "Error processing tweet:",
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      });

      this.stream.on("error", (error: Error) => {
        logger.error("Error in Twitter stream:", error);
        this.reconnectStream();
      });
    } catch (error) {
      logger.error(
        "Failed to start stream",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  private async reconnectStream(): Promise<void> {
    try {
      await this.cleanup();
      await retry(() => this.startStream(), this.MAX_RETRIES, this.RETRY_DELAY);
      logger.info("Successfully reconnected to Twitter stream");
    } catch (error) {
      logger.error(
        "Failed to reconnect to Twitter stream:",
        error instanceof Error ? error.message : String(error)
      );
      // Schedule reconnection attempt with exponential backoff
      setTimeout(
        () => this.reconnectStream(),
        this.RETRY_DELAY * Math.pow(2, this.MAX_RETRIES)
      );
    }
  }

  async setupStream(): Promise<void> {
    try {
      await this.resetStreamRules();
      await this.addTrackingRules();
      await this.startStream();
      logger.info("Twitter stream setup completed successfully");
    } catch (error) {
      logger.error(
        "Failed to setup Twitter stream",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.stream) {
      try {
        const stream = await this.stream;
        if (stream?.destroy) {
          await stream.destroy();
        }
        this.stream = null;
        logger.info("Twitter stream cleaned up successfully");
      } catch (error) {
        logger.error(
          "Error cleaning up Twitter stream:",
          error instanceof Error ? error.message : String(error)
        );
        throw error;
      }
    }
  }
}
