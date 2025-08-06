"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotManager = void 0;
// src/core/bots/BotManager.ts
const TelegramBot_1 = require("./platforms/telegram/TelegramBot");
const DiscordBot_1 = require("./platforms/discord/DiscordBot");
const TwitterBot_1 = require("./platforms/twitter/TwitterBot");
class BotManager {
    constructor(config) {
        this.telegramBot = null;
        this.discordBot = null;
        this.twitterBot = null;
        this.config = config;
    }
    static getInstance(config) {
        if (!BotManager.instance && config) {
            BotManager.instance = new BotManager(config);
        }
        if (!BotManager.instance) {
            throw new Error("BotManager not initialized");
        }
        return BotManager.instance;
    }
    async initialize() {
        if (this.config.telegramToken) {
            const telegramConfig = {
                token: this.config.telegramToken,
                platform: "TELEGRAM",
            };
            this.telegramBot = new TelegramBot_1.TelegramBot(telegramConfig);
            await this.telegramBot.start();
        }
        if (this.config.discordToken) {
            const discordConfig = {
                token: this.config.discordToken,
                platform: "DISCORD",
            };
            this.discordBot = new DiscordBot_1.DiscordBot(discordConfig);
            await this.discordBot.start();
        }
        if (this.config.twitterConfig) {
            const twitterConfig = {
                token: this.config.twitterConfig.accessToken,
                platform: "TWITTER",
                clientId: this.config.twitterConfig.apiKey,
                clientSecret: this.config.twitterConfig.apiSecret,
                accessSecret: this.config.twitterConfig.accessSecret,
            };
            this.twitterBot = new TwitterBot_1.TwitterBot(twitterConfig);
            await this.twitterBot.start();
        }
    }
    async stop() {
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
    getTelegramBot() {
        return this.telegramBot;
    }
    getDiscordBot() {
        return this.discordBot;
    }
    getTwitterBot() {
        return this.twitterBot;
    }
}
exports.BotManager = BotManager;
BotManager.instance = null;
