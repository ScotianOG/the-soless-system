// src/core/bots/Bot.ts
import { Platform } from '../types/platform';

export abstract class Bot {
  protected platform: Platform;
  protected engagementTracker: any;
  protected userManager: any;
  protected rewardManager: any;

  constructor(
    platform: Platform,
    engagementTracker: any,
    userManager: any,
    rewardManager: any
  ) {
    this.platform = platform;
    this.engagementTracker = engagementTracker;
    this.userManager = userManager;
    this.rewardManager = rewardManager;
  }

  abstract start(): Promise<void>;
}
