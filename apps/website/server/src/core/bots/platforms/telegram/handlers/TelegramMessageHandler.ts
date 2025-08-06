// src/core/bots/platforms/telegram/handlers/TelegramMessageHandler.ts
import { Bot } from "grammy";
import { BaseHandler } from "../../BaseHandler";
import { Platform } from "../../../../types";

export class TelegramMessageHandler extends BaseHandler {
  constructor(bot: Bot) {
    super("TELEGRAM" as Platform);
  }

  async initialize(): Promise<void> {
    // Functionality moved to TelegramBot.ts
  }
}
