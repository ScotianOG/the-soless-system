"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBot = main;
// src/core/bots/index.ts
const BotManager_1 = require("./BotManager");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
const envPath = path_1.default.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });
console.log("Starting bot service...");
let botManager = null;
// Handle shutdown gracefully
async function shutdown(signal) {
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
        const config = {
            enabled: true,
            telegramToken: process.env.TELEGRAM_BOT_TOKEN,
        };
        // Add Discord configuration if available
        if (process.env.DISCORD_BOT_TOKEN) {
            config.discordToken = process.env.DISCORD_BOT_TOKEN;
            console.log("Discord bot token found in environment");
        }
        // Add Twitter configuration if available
        if (process.env.TWITTER_API_KEY &&
            process.env.TWITTER_API_SECRET &&
            process.env.TWITTER_ACCESS_TOKEN &&
            process.env.TWITTER_ACCESS_SECRET) {
            config.twitterConfig = {
                apiKey: process.env.TWITTER_API_KEY,
                apiSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_SECRET,
            };
            console.log("Twitter API credentials found in environment");
        }
        botManager = BotManager_1.BotManager.getInstance(config);
        await botManager.initialize();
        console.log("Bot service initialized successfully");
        // Keep the process alive
        process.stdin.resume();
    }
    catch (error) {
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
