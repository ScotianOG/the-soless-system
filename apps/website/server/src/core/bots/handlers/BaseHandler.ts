// src/core/bots/handlers/BaseHandler.ts
import { EngagementTracker } from "../../engagement/EngagementTracker";
import { UserManager } from "../../user/UserManager";
import { RewardManager } from "../../contest/RewardManager";
import { Platform } from "../../types/platform";

// Base handler for message processing

export abstract class BaseHandler {
  protected platform: Platform;
  protected engagementTracker: EngagementTracker;
  protected userManager: UserManager;
  protected rewardManager: RewardManager;

  constructor(
    platform: Platform,
    engagementTracker: EngagementTracker,
    userManager: UserManager,
    rewardManager: RewardManager
  ) {
    this.platform = platform;
    this.engagementTracker = engagementTracker;
    this.userManager = userManager;
    this.rewardManager = rewardManager;
  }

  protected async trackEngagement(data: {
    userId: string;
    type: "REACTION" | "MESSAGE" | "COMMAND";
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.engagementTracker.trackEngagement({
      platform: this.platform,
      userId: data.userId,
      type: data.type,
      metadata: data.metadata,
      timestamp: new Date()
    });
  }
}

// Base message handler class

export abstract class MessageHandler {

    abstract handleMessage(message: any): Promise<void>;

    abstract handleReaction(reaction: any, user: any): Promise<void>;

    abstract processMessage(id: any, content: string): void;

    abstract trackEngagement(data: any): void;

}

export abstract class CommandHandler {

  abstract handleCommand(command: string, args: string[], message: any): Promise<void>;

  abstract validateCommand(userId: string, command: string): Promise<boolean>;

  abstract getHelpMessage(): any;

}

export abstract class AdminHandler {

  abstract isAdmin(userId: string): Promise<boolean>;

  abstract handleAdminCommand(command: string, args: string[], message: any): Promise<void>;

  abstract getMainGuild(): any;

}
