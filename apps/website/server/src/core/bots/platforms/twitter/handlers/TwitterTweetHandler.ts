// src/core/bots/platforms/twitter/handlers/TwitterTweetHandler.ts
import { MessageHandler } from "../../../handlers/MessageHandler";
import { TweetV2, TwitterApi } from "twitter-api-v2";
import { configManager } from "../../../../../config/ConfigManager";
import { Platform } from "../../../../types/platform";
import { logger } from "../../../../../utils/logger";
import { RateLimiter } from "../../../../../utils/rateLimiter";
import { ValidationError } from "../../../../../utils/errors";

interface EngagementEvent {
  platform: Platform;
  userId: string;
  type: "REACTION" | "MESSAGE" | "COMMAND";
  timestamp: Date;
  metadata: {
    tweetId: string;
    length?: number;
    keywords?: string[];
    originalTweetId?: string;
  };
}

interface ReactionEvent {
  userId: string;
  messageId: string;
  type: "LIKE" | "RETWEET" | "REPLY";
}

export class TwitterTweetHandler extends MessageHandler {
  public rateLimiter: RateLimiter;
  private readonly COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes

  constructor(
    platform: Platform,
    engagementTracker: any,
    userManager: any,
    rewardManager: any
  ) {
    super(platform, engagementTracker, userManager, rewardManager);
    this.rateLimiter = new RateLimiter({
      maxRequests: 300,
      timeWindow: 15 * 60 * 1000, // 15 minutes
    });
  }

  private validateTweet(tweet: TweetV2): asserts tweet is TweetV2 & {
    id: string;
    text: string;
    author_id: string;
  } {
    if (!tweet?.id) {
      throw new ValidationError("Invalid tweet: Missing tweet ID");
    }
    if (!tweet?.author_id) {
      throw new ValidationError("Invalid tweet: Missing author ID");
    }
    if (!tweet?.text) {
      throw new ValidationError("Invalid tweet: Missing tweet content");
    }
  }

  private async createEngagementEvent(
    userId: string,
    type: string,
    metadata: EngagementEvent["metadata"]
  ): Promise<EngagementEvent> {
    return {
      platform: this.platform,
      userId,
      type: type === "TWEET" || type === "MENTION" ? "MESSAGE" : "REACTION",
      timestamp: new Date(),
      metadata,
    };
  }

  async handleMessage(tweet: TweetV2): Promise<void> {
    try {
      await this.rateLimiter.checkLimit();
      this.validateTweet(tweet);

      const user = await this.userManager.getUserByPlatform(
        this.platform,
        tweet.author_id
      );

      if (!user) {
        logger.warn(
          `No registered user found for Twitter ID: ${tweet.author_id}`
        );
        return;
      }

      // Track base tweet engagement
      const engagementEvent = await this.createEngagementEvent(
        user.id,
        "MESSAGE",
        {
          tweetId: tweet.id,
          length: tweet.text.length,
        }
      );

      await this.engagementTracker.trackEngagement(engagementEvent);

      // Handle keyword mentions
      await this.processKeywordMentions(tweet, user.id);
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn("Tweet validation failed:", error.message);
      } else if (
        error instanceof Error &&
        error.message === "Rate limit exceeded"
      ) {
        logger.warn("Rate limit reached for tweet processing");
      } else {
        logger.error(
          "Error processing tweet:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  private async processKeywordMentions(
    tweet: TweetV2 & { id: string; text: string },
    userId: string
  ): Promise<void> {
    try {
      const config = configManager.getPlatformConfig("TWITTER").tracking;
      const tweetText = tweet.text.toLowerCase();

      const mentionedKeywords = [...config.keywords, ...config.hashtags].filter(
        (keyword) => tweetText.includes(keyword.toLowerCase())
      );

      if (mentionedKeywords.length > 0) {
        const mentionEvent = await this.createEngagementEvent(
          userId,
          "MESSAGE",
          {
            tweetId: tweet.id,
            keywords: mentionedKeywords,
          }
        );

        await this.engagementTracker.trackEngagement(mentionEvent);
      }
    } catch (error) {
      logger.error(
        "Error processing keyword mentions:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async handleRetweet(tweet: TweetV2): Promise<void> {
    try {
      await this.rateLimiter.checkLimit();
      this.validateTweet(tweet);

      const user = await this.userManager.getUserByPlatform(
        this.platform,
        tweet.author_id
      );

      if (!user) {
        logger.warn(
          `No registered user found for Twitter ID: ${tweet.author_id}`
        );
        return;
      }

      const originalTweetId = tweet.referenced_tweets?.find(
        (ref) => ref.type === "retweeted"
      )?.id;

      if (!originalTweetId) {
        throw new ValidationError(
          "Invalid retweet: No original tweet reference found"
        );
      }

      const retweetEvent = await this.createEngagementEvent(
        user.id,
        "REACTION",
        {
          tweetId: tweet.id,
          originalTweetId: originalTweetId,
        }
      );

      await this.engagementTracker.trackEngagement(retweetEvent);
    } catch (error) {
      logger.error(
        "Error processing retweet:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async handleReaction(reaction: ReactionEvent): Promise<void> {
    try {
      await this.rateLimiter.checkLimit();

      const user = await this.userManager.getUserByPlatform(
        this.platform,
        reaction.userId
      );

      if (!user) {
        logger.warn(
          `No registered user found for Twitter ID: ${reaction.userId}`
        );
        return;
      }

      const reactionEvent = await this.createEngagementEvent(
        user.id,
        "REACTION",
        {
          tweetId: reaction.messageId,
        }
      );

      await this.engagementTracker.trackEngagement(reactionEvent);
    } catch (error) {
      logger.error(
        "Error processing reaction:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
