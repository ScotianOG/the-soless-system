"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramMessageHandler = void 0;
const BaseHandler_1 = require("../../BaseHandler");
class TelegramMessageHandler extends BaseHandler_1.BaseHandler {
    constructor(bot) {
        super("TELEGRAM");
    }
    async initialize() {
        // Functionality moved to TelegramBot.ts
    }
}
exports.TelegramMessageHandler = TelegramMessageHandler;
