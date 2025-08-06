// src/core/social-ai/SocialAIAgent.ts

import { TwitterApi, TweetV2PostTweetResult } from "twitter-api-v2";
import { prisma } from "../../lib/prisma";
import axios from "axios";

interface ContentTemplate {
  type:
    | "educational"
    | "announcement"
    | "engagement"
    | "trending"
    | "milestone";
  templates: string[];
  frequency: number; // posts per day
  timeSlots: string[]; // optimal posting times
}

interface SocialMetrics {
  followers: number;
  engagement_rate: number;
  best_performing_content: string[];
  trending_hashtags: string[];
}

export class SocialAIAgent {
  private client: TwitterApi;
  private aiEngineUrl: string;
  private isActive: boolean = false;
  private scheduledPosts: Map<string, NodeJS.Timeout> = new Map();

  // Content templates based on SOLess ecosystem
  private contentTemplates: ContentTemplate[] = [
    {
      type: "educational",
      templates: [
        "🧠 SOLess Fact: Cross-chain swaps between #Solana and #Sonic are now gasless! Trade without worrying about transaction fees. #DeFi #SOLessSwap",
        "💡 Did you know? SOUL tokens are automatically burned with every trade, making the remaining supply more scarce over time. #Tokenomics #SOUL",
        "🎯 SOLspace automatically detects viral content and mints it as NFTs. Your viral tweets could become valuable digital assets! #NFTs #ViralContent",
        "🔥 With SOLarium, your NFTs have guaranteed floor prices. No more worthless jpegs - real utility, real value. #NFTs #SOLarium",
      ],
      frequency: 2,
      timeSlots: ["09:00", "15:00"],
    },
    {
      type: "engagement",
      templates: [
        "What's your biggest challenge with cross-chain trading? 🤔 Share below and Soulie might have the perfect solution! #CryptoProblems",
        "Which feature excites you most? 🚀\n\n💱 Gasless trading\n🔥 Automatic burns\n🎨 Viral NFT minting\n🏆 Engagement contests\n\nComment your choice!",
        "Tag someone who needs to hear about gasless cross-chain trading! 👇 #SOLessSwap #CrossChain",
        "What would you do if your viral tweet automatically became a valuable NFT? Tell us below! 👇 #SOLspace",
      ],
      frequency: 1,
      timeSlots: ["12:00", "18:00"],
    },
    {
      type: "trending",
      templates: [
        "While others talk about #Web3 adoption, we're building it. Real utility, real users, real value. 🚀 #SOLess #BuildingTheNext",
        "🌊 The future of social media is here: Your content = Your wealth. Every viral post = Valuable NFT. #SOLspace #CreatorEconomy",
        "Cross-chain bridges that actually work. No failed transactions, no lost funds, just seamless trading. #DeFi #CrossChain #SOLessSwap",
      ],
      frequency: 1,
      timeSlots: ["10:00", "16:00", "20:00"],
    },
  ];

  // Trending topics to monitor and respond to
  private trendingTopics = [
    "#Solana",
    "#DeFi",
    "#CrossChain",
    "#NFTs",
    "#Web3",
    "#CryptoTrading",
    "#Blockchain",
    "#ViralContent",
    "#CreatorEconomy",
    "#Sonic",
  ];

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
    aiEngineUrl: string;
  }) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessSecret,
    });
    this.aiEngineUrl = config.aiEngineUrl;
  }

  async start(): Promise<void> {
    console.log("🤖 Starting SOLess Social AI Agent...");
    this.isActive = true;

    // Schedule content posting
    this.scheduleContentPosting();

    // Start monitoring for engagement opportunities
    this.startEngagementMonitoring();

    // Schedule daily analytics review
    this.scheduleDailyAnalytics();

    console.log("✅ Social AI Agent is now active!");
  }

  async stop(): Promise<void> {
    this.isActive = false;

    // Clear all scheduled posts
    for (const [id, timeout] of this.scheduledPosts) {
      clearTimeout(timeout);
    }
    this.scheduledPosts.clear();

    console.log("🛑 Social AI Agent stopped.");
  }

  private scheduleContentPosting(): void {
    for (const template of this.contentTemplates) {
      template.timeSlots.forEach((timeSlot) => {
        this.scheduleRecurringPost(template, timeSlot);
      });
    }
  }

  private scheduleRecurringPost(
    template: ContentTemplate,
    timeSlot: string
  ): void {
    const [hours, minutes] = timeSlot.split(":").map(Number);

    const schedulePost = () => {
      const now = new Date();
      const postTime = new Date();
      postTime.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (postTime <= now) {
        postTime.setDate(postTime.getDate() + 1);
      }

      const delay = postTime.getTime() - now.getTime();

      const timeoutId = setTimeout(async () => {
        if (this.isActive) {
          await this.createAndPostContent(template);
          schedulePost(); // Schedule next occurrence
        }
      }, delay);

      this.scheduledPosts.set(`${template.type}_${timeSlot}`, timeoutId);
    };

    schedulePost();
  }

  private async createAndPostContent(template: ContentTemplate): Promise<void> {
    try {
      // Get AI-enhanced content
      const content = await this.generateAIContent(template);

      // Add current metrics or news if relevant
      const enhancedContent = await this.enhanceWithRealTimeData(content);

      // Post to Twitter
      const result = await this.postTweet(enhancedContent);

      // Log success
      await this.logSocialActivity("post", result.data.id, enhancedContent);

      console.log(
        `📤 Posted ${template.type} content: ${enhancedContent.substring(
          0,
          50
        )}...`
      );
    } catch (error) {
      console.error(`❌ Failed to post ${template.type} content:`, error);
    }
  }

  private async generateAIContent(template: ContentTemplate): Promise<string> {
    try {
      // Get random template
      const baseTemplate =
        template.templates[
          Math.floor(Math.random() * template.templates.length)
        ];

      // Enhance with AI if available
      if (this.aiEngineUrl) {
        const prompt = `
          Enhance this social media post about SOLess while keeping it under 280 characters:
          "${baseTemplate}"
          
          Make it more engaging while maintaining the core message. Include relevant emojis.
          Keep hashtags. Focus on ${template.type} style content.
        `;

        const response = await axios.post(`${this.aiEngineUrl}/api/chat`, {
          message: prompt,
          conversationId: `social_ai_${Date.now()}`,
        });

        return response.data.response || baseTemplate;
      }

      return baseTemplate;
    } catch (error) {
      console.error("AI content enhancement failed, using template:", error);
      return template.templates[
        Math.floor(Math.random() * template.templates.length)
      ];
    }
  }

  private async enhanceWithRealTimeData(content: string): Promise<string> {
    try {
      // Get recent SOLess metrics
      const metrics = await this.getSocialMetrics();

      // Add milestone celebrations
      if (content.includes("milestone") && metrics.followers > 0) {
        const followerMilestone = this.getFollowerMilestone(metrics.followers);
        if (followerMilestone) {
          return `🎉 ${followerMilestone}! ${content}`;
        }
      }

      // Add trending hashtags if relevant
      if (
        metrics.trending_hashtags.length > 0 &&
        !content.includes("#SOLess")
      ) {
        const trendingTag = metrics.trending_hashtags[0];
        return `${content} ${trendingTag}`;
      }

      return content;
    } catch (error) {
      return content;
    }
  }

  private async postTweet(content: string): Promise<TweetV2PostTweetResult> {
    return await this.client.v2.tweet(content);
  }

  private startEngagementMonitoring(): void {
    // Monitor for mentions and opportunities to engage
    this.monitorMentions();
    this.monitorTrendingTopics();
  }

  private async monitorMentions(): Promise<void> {
    if (!this.isActive) return;

    try {
      // Search for recent mentions
      const mentions = await this.client.v2.search(
        "(@SOLessSystem OR soless OR solarium OR solspace) -is:retweet",
        {
          "tweet.fields": ["created_at", "author_id", "public_metrics"],
          "user.fields": ["username", "public_metrics"],
          max_results: 10,
        }
      );

      for (const tweet of (mentions.data as any) || []) {
        await this.considerEngagement(tweet);
      }
    } catch (error) {
      console.error("Error monitoring mentions:", error);
    }

    // Schedule next check
    setTimeout(() => this.monitorMentions(), 10 * 60 * 1000); // Every 10 minutes
  }

  private async monitorTrendingTopics(): Promise<void> {
    if (!this.isActive) return;

    try {
      for (const topic of this.trendingTopics) {
        const tweets = await this.client.v2.search(
          `${topic} -is:retweet lang:en`,
          {
            "tweet.fields": ["created_at", "public_metrics"],
            max_results: 5,
          }
        );

        for (const tweet of (tweets.data as any) || []) {
          // Only engage with high-quality, high-engagement content
          if (tweet.public_metrics && tweet.public_metrics.like_count > 50) {
            await this.considerTopicalEngagement(tweet, topic);
          }
        }
      }
    } catch (error) {
      console.error("Error monitoring trending topics:", error);
    }

    // Schedule next check
    setTimeout(() => this.monitorTrendingTopics(), 30 * 60 * 1000); // Every 30 minutes
  }

  private async considerEngagement(tweet: any): Promise<void> {
    try {
      // Skip if we've already engaged with this tweet
      const existingEngagement = await prisma.socialAIActivity.findFirst({
        where: {
          type: "MENTION_DETECTED",
          content: tweet.id,
        },
      });

      if (existingEngagement) return;

      // Generate contextual response
      const response = await this.generateContextualResponse(tweet.text);

      if (response && response.length > 0) {
        // Reply to the tweet
        await this.client.v2.reply(response, tweet.id);

        // Log the engagement
        await this.logSocialActivity("reply", tweet.id, response);

        console.log(
          `💬 Replied to tweet ${tweet.id}: ${response.substring(0, 50)}...`
        );
      }
    } catch (error) {
      console.error(`Error engaging with tweet ${tweet.id}:`, error);
    }
  }

  private async considerTopicalEngagement(
    tweet: any,
    topic: string
  ): Promise<void> {
    try {
      // Only engage occasionally to avoid spam
      if (Math.random() > 0.1) return; // 10% chance to engage

      const existingEngagement = await prisma.socialAIActivity.findFirst({
        where: {
          type: "TOPICAL_ENGAGEMENT",
          content: tweet.id,
        },
      });

      if (existingEngagement) return;

      // Generate topical response
      const response = await this.generateTopicalResponse(tweet.text, topic);

      if (response) {
        // Like the tweet (less intrusive than replying)
        await this.client.v2.like("self", tweet.id);

        // Occasionally reply with value-add content
        if (Math.random() > 0.7) {
          // 30% chance to reply
          await this.client.v2.reply(response, tweet.id);
          await this.logSocialActivity("reply", tweet.id, response);
        } else {
          await this.logSocialActivity("like", tweet.id, "");
        }

        console.log(`👍 Engaged with trending ${topic} tweet: ${tweet.id}`);
      }
    } catch (error) {
      console.error(`Error with topical engagement for ${topic}:`, error);
    }
  }

  private async generateContextualResponse(
    tweetText: string
  ): Promise<string | null> {
    try {
      const prompt = `
        Generate a helpful, engaging reply to this tweet about SOLess/DeFi/NFTs:
        "${tweetText}"
        
        Rules:
        - Be helpful and informative
        - Maximum 280 characters
        - Don't be salesy or spammy
        - Only respond if genuinely relevant to SOLess ecosystem
        - Use Soulie's personality: sarcastic but helpful
        - If not relevant to SOLess, return empty string
      `;

      const response = await axios.post(`${this.aiEngineUrl}/api/chat`, {
        message: prompt,
        conversationId: `engagement_${Date.now()}`,
      });

      const aiResponse = response.data.response;

      // Don't respond if AI says it's not relevant
      if (
        aiResponse.trim().length < 10 ||
        aiResponse.toLowerCase().includes("not relevant")
      ) {
        return null;
      }

      return aiResponse;
    } catch (error) {
      console.error("Failed to generate contextual response:", error);
      return null;
    }
  }

  private async generateTopicalResponse(
    tweetText: string,
    topic: string
  ): Promise<string | null> {
    try {
      const responses = {
        "#DeFi":
          "🔥 Want truly gasless DeFi? SOLessSwap eliminates gas fees entirely on cross-chain trades. The future is here! #GaslessDeFi",
        "#CrossChain":
          "⚡ Cross-chain trading without the headaches. SOLessSwap connects Solana & Sonic seamlessly. Try it yourself! #CrossChain",
        "#NFTs":
          "🎨 What if your viral content automatically became valuable NFTs? That's exactly what SOLspace does. #CreatorEconomy",
        "#Web3":
          "🚀 Web3 should just work. That's why we built SOLless - real utility, real users, real value. #BuildingWeb3",
        "#Solana":
          "⚡ Love Solana? Wait until you see what we're building with cross-chain connectivity. #SolanaEcosystem",
      };

      return (responses as any)[topic] || null;
    } catch (error) {
      return null;
    }
  }

  private async getSocialMetrics(): Promise<SocialMetrics> {
    try {
      const user = await this.client.v2.me({
        "user.fields": ["public_metrics"],
      });

      return {
        followers: user.data.public_metrics?.followers_count || 0,
        engagement_rate: 0.05, // Default 5%
        best_performing_content: [],
        trending_hashtags: ["#DeFi", "#CrossChain", "#NFTs"],
      };
    } catch (error) {
      console.error("Error getting social metrics:", error);
      return {
        followers: 0,
        engagement_rate: 0.05,
        best_performing_content: [],
        trending_hashtags: [],
      };
    }
  }

  private getFollowerMilestone(followers: number): string | null {
    const milestones = [
      100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000,
    ];
    const nearestMilestone = milestones.find(
      (m) => followers >= m && followers < m + 50
    );

    if (nearestMilestone) {
      return `We just hit ${nearestMilestone} followers`;
    }

    return null;
  }

  private async logSocialActivity(
    action: string,
    externalId: string,
    content: string
  ): Promise<void> {
    try {
      await prisma.socialAIActivity.create({
        data: {
          type: action.toUpperCase(),
          action,
          platform: "TWITTER",
          content,
          metadata: {
            externalId,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error logging social activity:", error);
    }
  }

  private scheduleDailyAnalytics(): void {
    const runAnalytics = () => {
      if (this.isActive) {
        this.performDailyAnalytics();

        // Schedule next run (24 hours)
        setTimeout(runAnalytics, 24 * 60 * 60 * 1000);
      }
    };

    // Run first analytics in 1 hour
    setTimeout(runAnalytics, 60 * 60 * 1000);
  }

  private async performDailyAnalytics(): Promise<void> {
    try {
      console.log("📊 Performing daily social media analytics...");

      // Analyze yesterday's performance
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const activities = await prisma.socialAIActivity.findMany({
        where: {
          platform: "TWITTER",
          createdAt: {
            gte: yesterday,
          },
        },
      });

      console.log(
        `📈 Yesterday: ${activities.length} social activities logged`
      );

      // TODO: Add more sophisticated analytics
      // - Best performing content types
      // - Optimal posting times
      // - Engagement rate trends
      // - Follower growth
    } catch (error) {
      console.error("Error in daily analytics:", error);
    }
  }
}
