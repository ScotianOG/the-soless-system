// src/core/bots/types.ts
export interface CoreBotConfig {
  telegramToken: string;
  discordToken: string;
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
}

export interface BotHandler {
  start(): Promise<void>;
  stop(): Promise<void>;
}
