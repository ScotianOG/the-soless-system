// src/core/bots/BotManager.ts
import { TelegramBot } from "./platforms/telegram/TelegramBot";
import { DiscordBot } from "./platforms/discord/DiscordBot";
import { TwitterBot } from "./platforms/twitter/TwitterBot";
import { BaseBotConfig } from "./platforms/BasePlatformBot";

export interface BotManagerConfig {
  enabled: boolean;
  telegramToken: string;
  discordToken?: string;
  twitterConfig?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

export class BotManager {
  private static instance: BotManager | null = null;
  private telegramBot: TelegramBot | null = null;
  private discordBot: DiscordBot | null = null;
  private twitterBot: TwitterBot | null = null;
  private config: BotManagerConfig;

  private constructor(config: BotManagerConfig) {
    this.config = config;
  }

  static getInstance(config?: BotManagerConfig): BotManager {
    if (!BotManager.instance && config) {
      BotManager.instance = new BotManager(config);
    }
    if (!BotManager.instance) {
      throw new Error("BotManager not initialized");
    }
    return BotManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.config.telegramToken) {
      const telegramConfig: BaseBotConfig = {
        token: this.config.telegramToken,
        platform: "TELEGRAM",
      };
      this.telegramBot = new TelegramBot(telegramConfig);
      await this.telegramBot.start();
    }

    if (this.config.discordToken) {
      const discordConfig: BaseBotConfig = {
        token: this.config.discordToken,
        platform: "DISCORD",
      };
      this.discordBot = new DiscordBot(discordConfig);
      await this.discordBot.start();
    }

    if (this.config.twitterConfig) {
      const twitterConfig: BaseBotConfig = {
        token: this.config.twitterConfig.accessToken,
        platform: "TWITTER",
        clientId: this.config.twitterConfig.apiKey,
        clientSecret: this.config.twitterConfig.apiSecret,
        accessSecret: this.config.twitterConfig.accessSecret,
      };
      this.twitterBot = new TwitterBot(twitterConfig);
      await this.twitterBot.start();
    }
  }

  async stop(): Promise<void> {
    if (this.telegramBot) {
      await this.telegramBot.stop();
    }

    if (this.discordBot) {
      await this.discordBot.stop();
    }

    if (this.twitterBot) {
      await this.twitterBot.stop();
    }
  }

  getTelegramBot(): TelegramBot | null {
    return this.telegramBot;
  }

  getDiscordBot(): DiscordBot | null {
    return this.discordBot;
  }

  getTwitterBot(): TwitterBot | null {
    return this.twitterBot;
  }
}
