import { BaseHandler } from "./BaseHandler";

// src/core/bots/handlers/ContestHandler.ts
export abstract class ContestHandler extends BaseHandler {
    protected async startContest(userId: string): Promise<void> {
        if (!await this.validateAdminCommand(userId)) return;
        await this.rewardManager.startNewContest();
    }

    protected async endContest(userId: string): Promise<void> {
        if (!await this.validateAdminCommand(userId)) return;
        await this.rewardManager.endCurrentContest();
    }

    protected abstract validateAdminCommand(userId: string): Promise<boolean>;
}