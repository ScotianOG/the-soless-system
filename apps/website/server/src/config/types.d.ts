declare module "@/config/env" {
  import { z } from "zod";

  export type Env = {
    JWT_SECRET: string;
    DATABASE_URL: string;
    TELEGRAM_BOT_TOKEN: string;
    DISCORD_BOT_TOKEN: string;
    TWITTER_API_KEY: string;
    TWITTER_API_SECRET: string;
    TWITTER_ACCESS_TOKEN: string;
    TWITTER_ACCESS_SECRET: string;
    TELEGRAM_CHAT_ID: string;
    VITE_FRONTEND_URL: string;
    TWITTER_CLIENT_ID?: string;
    TWITTER_CLIENT_SECRET?: string;
    TWITTER_REDIRECT_URI?: string;
    DISCORD_GUILD_ID?: string;
  };

  export const env: Env;
}
