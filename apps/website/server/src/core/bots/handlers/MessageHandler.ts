import { Platform } from "@prisma/client";
import { EngagementTracker } from "../../engagement/EngagementTracker";
import { UserManager } from "../../user/UserManager";
import { RewardManager } from "../../contest/RewardManager";

export abstract class MessageHandler {
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

  protected async processMessage(
    userId: string,
    content: string
  ): Promise<void> {
    await this.engagementTracker.trackEngagement({
      userId,
      platform: this.platform,
      type: "MESSAGE",
      metadata: {
        content,
        length: content.length,
        wordCount: content.split(/\s+/).length,
      },
      timestamp: new Date(),
    });
  }

  abstract handleMessage(context: any): Promise<void>;
  abstract handleReaction(reaction: any, user?: any): Promise<void>;
}
