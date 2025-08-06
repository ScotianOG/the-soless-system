import { z } from 'zod';

// Define the environment schema type
export type Env = z.infer<typeof envSchema>;

const envSchema = z.object({
  JWT_SECRET: z.string(),
  DATABASE_URL: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
  DISCORD_BOT_TOKEN: z.string(),
  TWITTER_API_KEY: z.string(),
  TWITTER_API_SECRET: z.string(),
  TWITTER_ACCESS_TOKEN: z.string(),
  TWITTER_ACCESS_SECRET: z.string(),
  TELEGRAM_CHAT_ID: z.string(),
  VITE_FRONTEND_URL: z.string(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  TWITTER_REDIRECT_URI: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
});

// Parse and export the typed environment variables
export const env: Env = envSchema.parse(process.env);
