"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    JWT_SECRET: zod_1.z.string(),
    DATABASE_URL: zod_1.z.string(),
    TELEGRAM_BOT_TOKEN: zod_1.z.string(),
    DISCORD_BOT_TOKEN: zod_1.z.string(),
    TWITTER_API_KEY: zod_1.z.string(),
    TWITTER_API_SECRET: zod_1.z.string(),
    TWITTER_ACCESS_TOKEN: zod_1.z.string(),
    TWITTER_ACCESS_SECRET: zod_1.z.string(),
    TELEGRAM_CHAT_ID: zod_1.z.string(),
    VITE_FRONTEND_URL: zod_1.z.string(),
    TWITTER_CLIENT_ID: zod_1.z.string().optional(),
    TWITTER_CLIENT_SECRET: zod_1.z.string().optional(),
    TWITTER_REDIRECT_URI: zod_1.z.string().optional(),
    DISCORD_GUILD_ID: zod_1.z.string().optional(),
});
// Parse and export the typed environment variables
exports.env = envSchema.parse(process.env);
