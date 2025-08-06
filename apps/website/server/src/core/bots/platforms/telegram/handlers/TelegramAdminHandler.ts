// src/core/bots/platforms/telegram/handlers/TelegramAdminHandler.ts
import { Bot } from "grammy";
import { BaseHandler } from "../../BaseHandler";
import { Platform } from "../../../../types";

export class TelegramAdminHandler extends BaseHandler {
  constructor(bot: Bot) {
    super("TELEGRAM" as Platform);
  }

  async initialize(): Promise<void> {
    // Admin functionality disabled for now
  }
}
