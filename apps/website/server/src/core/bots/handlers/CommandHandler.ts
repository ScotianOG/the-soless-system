import { Platform } from "@prisma/client";
import { EngagementTracker } from "../../engagement/EngagementTracker";
import { UserManager } from "../../user/UserManager";
import { RewardManager } from "../../contest/RewardManager";

export abstract class CommandHandler {
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

  protected async trackCommand(
    userId: string,
    command: string,
    args: string[]
  ): Promise<void> {
    await this.engagementTracker.trackEngagement({
      userId,
      platform: this.platform,
      type: "COMMAND",
      metadata: {
        command,
        args,
      },
      timestamp: new Date(),
    });
  }

  abstract handleCommand(
    command: string,
    args: string[],
    context: any
  ): Promise<void>;
}
