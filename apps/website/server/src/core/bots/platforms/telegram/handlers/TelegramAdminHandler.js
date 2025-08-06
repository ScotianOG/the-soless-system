"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramAdminHandler = void 0;
const BaseHandler_1 = require("../../BaseHandler");
class TelegramAdminHandler extends BaseHandler_1.BaseHandler {
    constructor(bot) {
        super("TELEGRAM");
    }
    async initialize() {
        // Admin functionality disabled for now
    }
}
exports.TelegramAdminHandler = TelegramAdminHandler;
