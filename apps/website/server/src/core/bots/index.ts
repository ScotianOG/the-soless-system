// src/core/bots/index.ts
import { BotManager } from "./BotManager";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables - prioritize .env.local for production secrets
const envLocalPath = path.resolve(process.cwd(), ".env.local");
const envPath = path.resolve(process.cwd(), ".env");

// Load .env.local first (production secrets), then .env as fallback
// Override existing environment variables to ensure correct token is used
dotenv.config({ path: envLocalPath, override: true });
dotenv.config({ path: envPath });

console.log("Starting bot service...");

// Debug environment loading
console.log("Environment debug:", {
  envLocalExists: require("fs").existsSync(envLocalPath),
  envExists: require("fs").existsSync(envPath),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN
    ? `${process.env.TELEGRAM_BOT_TOKEN.substring(0, 10)}...`
    : "NOT_SET",
});
let botManager: BotManager | null = null;

// Handle shutdown gracefully
async function shutdown(signal?: string) {
  console.log(`Shutting down bot service... (Signal: ${signal || "unknown"})`);
  if (botManager) {
    await botManager.stop();
  }
  process.exit(0);
}

// Handle various shutdown signals
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  shutdown("UNCAUGHT_EXCEPTION").catch(console.error);
});

async function main() {
  try {
    // Validate Telegram environment
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN not found in environment");
    }

    // Create and initialize bot manager
    const config: any = {
      enabled: true,
      telegramToken: process.env.TELEGRAM_BOT_TOKEN,
    };

    // Add Discord configuration if available
    if (process.env.DISCORD_BOT_TOKEN) {
      config.discordToken = process.env.DISCORD_BOT_TOKEN;
      console.log("Discord bot token found in environment");
    }

    // Add Twitter configuration if available
    if (
      process.env.TWITTER_API_KEY &&
      process.env.TWITTER_API_SECRET &&
      process.env.TWITTER_ACCESS_TOKEN &&
      process.env.TWITTER_ACCESS_SECRET
    ) {
      config.twitterConfig = {
        apiKey: process.env.TWITTER_API_KEY,
        apiSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
      };
      console.log("Twitter API credentials found in environment");
    }

    botManager = BotManager.getInstance(config);
    await botManager.initialize();
    console.log("Bot service initialized successfully");

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

// Start if running directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main as startBot };
