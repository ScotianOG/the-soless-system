import { UserManager } from "../user/UserManager";
import { RewardManager } from "../contest/RewardManager";
import { EngagementTracker } from "../engagement/EngagementTracker";
import { Platform } from "../types";

export abstract class BaseBot {
  protected platform: Platform;
  protected engagementTracker: EngagementTracker;
  protected userManager: UserManager;
  protected rewardManager: RewardManager;
  protected _isRunning: boolean = false;

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

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  public isRunning(): boolean {
    return this._isRunning;
  }

  protected async handleError(error: Error, context: string): Promise<void> {
    console.error(`[${this.platform}] Error in ${context}:`, error);
    // Add error reporting integration here
  }
}
