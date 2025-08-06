// src/core/bots/platforms/BasePlatformBot.ts
export interface BaseBotConfig {
  token: string;
  platform: "TELEGRAM" | "DISCORD" | "TWITTER";
  clientId?: string;
  clientSecret?: string;
  accessSecret?: string;
}

export abstract class BasePlatformBot {
  protected token: string;
  protected platform: "TELEGRAM" | "DISCORD" | "TWITTER";

  constructor(config: BaseBotConfig) {
    this.token = config.token;
    this.platform = config.platform;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
