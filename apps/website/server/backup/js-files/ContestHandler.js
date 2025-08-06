"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContestHandler = void 0;
const BaseHandler_1 = require("./BaseHandler");
// src/core/bots/handlers/ContestHandler.ts
class ContestHandler extends BaseHandler_1.BaseHandler {
    async startContest(userId) {
        if (!await this.validateAdminCommand(userId))
            return;
        await this.rewardManager.startNewContest();
    }
    async endContest(userId) {
        if (!await this.validateAdminCommand(userId))
            return;
        await this.rewardManager.endCurrentContest();
    }
}
exports.ContestHandler = ContestHandler;
