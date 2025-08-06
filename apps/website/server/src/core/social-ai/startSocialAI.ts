// src/core/social-ai/startSocialAI.ts

import { SocialAIManager } from "./SocialAIManager";
import { BotManager } from "../bots/BotManager";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface SocialAIEnvironment {
  // Twitter API credentials
  TWITTER_API_KEY?: string;
  TWITTER_API_SECRET?: string;
  TWITTER_ACCESS_TOKEN?: string;
  TWITTER_ACCESS_SECRET?: string;

  // AI Engine configuration
  AI_ENGINE_URL?: string;
  AI_ENGINE_ENABLED?: string;

  // Social AI configuration
  SOCIAL_AI_ENABLED?: string;
  SOCIAL_AI_CONTENT_POSTING?: string;
  SOCIAL_AI_ENGAGEMENT_MONITORING?: string;
  SOCIAL_AI_TREND_ANALYSIS?: string;
}

class SocialAIBootstrap {
  private env: SocialAIEnvironment;

  constructor() {
    this.env = process.env as SocialAIEnvironment;
  }

  validateEnvironment(): boolean {
    const required = [
      "TWITTER_API_KEY",
      "TWITTER_API_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_SECRET",
    ];

    const missing = required.filter(
      (key) => !this.env[key as keyof SocialAIEnvironment]
    );

    if (missing.length > 0) {
      console.error("❌ Missing required environment variables:", missing);
      return false;
    }

    console.log("✅ All required environment variables present");
    return true;
  }

  createConfiguration() {
    return {
      enabled: this.env.SOCIAL_AI_ENABLED !== "false",
      twitter: {
        apiKey: this.env.TWITTER_API_KEY!,
        apiSecret: this.env.TWITTER_API_SECRET!,
        accessToken: this.env.TWITTER_ACCESS_TOKEN!,
        accessSecret: this.env.TWITTER_ACCESS_SECRET!,
      },
      aiEngine: {
        url: this.env.AI_ENGINE_URL || "http://localhost:3000",
        enabled: this.env.AI_ENGINE_ENABLED !== "false",
      },
      schedules: {
        contentPosting: this.env.SOCIAL_AI_CONTENT_POSTING !== "false",
        engagementMonitoring:
          this.env.SOCIAL_AI_ENGAGEMENT_MONITORING !== "false",
        trendAnalysis: this.env.SOCIAL_AI_TREND_ANALYSIS !== "false",
      },
    };
  }

  async startWithExistingBots(): Promise<void> {
    console.log(
      "🤖 Starting SOLess Social AI with existing bot integration..."
    );

    try {
      // Check if BotManager is already running
      let botManager: BotManager | null = null;

      try {
        botManager = BotManager.getInstance();
        console.log("✅ Found existing BotManager instance");
      } catch (error) {
        console.log(
          "ℹ️ No existing BotManager found, Social AI will run independently"
        );
      }

      // Initialize Social AI
      const config = this.createConfiguration();
      const socialAI = SocialAIManager.getInstance(config);

      await socialAI.initialize();
      await socialAI.start();

      console.log("🎉 SOLess Social AI is now active!");
      console.log("📊 Configuration:", {
        contentPosting: config.schedules.contentPosting,
        engagementMonitoring: config.schedules.engagementMonitoring,
        trendAnalysis: config.schedules.trendAnalysis,
        aiEngineEnabled: config.aiEngine.enabled,
      });

      // Keep the process alive
      process.on("SIGINT", async () => {
        console.log("\n🛑 Gracefully shutting down Social AI...");
        await socialAI.stop();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        console.log("\n🛑 Gracefully shutting down Social AI...");
        await socialAI.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error("❌ Failed to start Social AI:", error);
      process.exit(1);
    }
  }

  async startStandalone(): Promise<void> {
    console.log("🚀 Starting SOLess Social AI in standalone mode...");

    try {
      const config = this.createConfiguration();
      const socialAI = SocialAIManager.getInstance(config);

      await socialAI.initialize();
      await socialAI.start();

      console.log("🎉 Social AI running standalone!");

      // Keep process alive
      process.stdin.resume();
    } catch (error) {
      console.error("❌ Failed to start standalone Social AI:", error);
      process.exit(1);
    }
  }

  displayStartupInfo(): void {
    console.log("");
    console.log("🚀 SOLess Social AI System");
    console.log("==========================");
    console.log("");
    console.log("Features:");
    console.log("• 🤖 Automated content posting");
    console.log("• 💬 Intelligent engagement monitoring");
    console.log("• 📈 Trend analysis and response");
    console.log("• 🧠 AI-powered content generation");
    console.log("• 📊 Performance analytics");
    console.log("");
    console.log("Integration:");
    console.log("• 🐦 Twitter API v2");
    console.log("• 🧠 Soulie AI Engine");
    console.log("• 🤖 Existing Bot System");
    console.log("• 📱 Cross-platform coordination");
    console.log("");
  }
}

async function main() {
  const bootstrap = new SocialAIBootstrap();

  bootstrap.displayStartupInfo();

  // Validate environment
  if (!bootstrap.validateEnvironment()) {
    console.log("");
    console.log("💡 Required Environment Variables:");
    console.log("TWITTER_API_KEY=your_twitter_api_key");
    console.log("TWITTER_API_SECRET=your_twitter_api_secret");
    console.log("TWITTER_ACCESS_TOKEN=your_twitter_access_token");
    console.log("TWITTER_ACCESS_SECRET=your_twitter_access_secret");
    console.log("");
    console.log("Optional Environment Variables:");
    console.log("AI_ENGINE_URL=http://localhost:3000");
    console.log("SOCIAL_AI_ENABLED=true");
    console.log("SOCIAL_AI_CONTENT_POSTING=true");
    console.log("SOCIAL_AI_ENGAGEMENT_MONITORING=true");
    console.log("SOCIAL_AI_TREND_ANALYSIS=true");
    console.log("");
    process.exit(1);
  }

  // Check startup mode
  const args = process.argv.slice(2);
  const mode = args[0] || "integrated";

  switch (mode) {
    case "standalone":
      await bootstrap.startStandalone();
      break;
    case "integrated":
    default:
      await bootstrap.startWithExistingBots();
      break;
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error in Social AI startup:", error);
    process.exit(1);
  });
}

export { SocialAIBootstrap };
