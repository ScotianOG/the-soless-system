// src/core/bots/handlers/AdminHandler.ts
import { Platform } from "../../types/platform";
import { EngagementTracker } from "../../engagement/EngagementTracker";
import { EngagementTrackerFactory } from "../../engagement/EngagementTrackerFactory";
import { UserManager } from "../../user/UserManager";
import { RewardManager } from "../../contest/RewardManager";

export abstract class AdminHandler {
  protected platform!: Platform;
  protected engagementTracker!: EngagementTracker;
  protected userManager!: UserManager;
  protected rewardManager!: RewardManager;

  constructor(
    platform: Platform,
    engagementTracker?: EngagementTracker,
    userManager?: UserManager,
    rewardManager?: RewardManager
  ) {
    this.platform = platform;
    this.engagementTracker =
      engagementTracker || EngagementTrackerFactory.getTracker(platform);
    this.userManager = userManager || new UserManager();
    this.rewardManager = rewardManager || new RewardManager();
  }

  /**
   * Check if a user has admin privileges
   * @param userId The platform-specific user ID
   */
  abstract isAdmin(userId: string): Promise<boolean>;

  /**
   * Handle admin-specific commands
   * @param command The command name
   * @param args Command arguments
   * @param message The original message object (platform-specific)
   */
  abstract handleAdminCommand(
    command: string,
    args: string[],
    message: any
  ): Promise<void>;

  /**
   * Get the main guild/group/chat where the bot operates
   * This is platform-specific and might return different types
   */
  abstract getMainGuild(): Promise<any>;

  /**
   * Track admin command usage
   * @param userId The admin's user ID
   * @param command The command that was used
   */
  protected async trackAdminCommand(
    userId: string,
    command: string
  ): Promise<void> {
    if (this.engagementTracker) {
      await this.engagementTracker.trackCommand(userId, `admin_${command}`);
    }
  }

  /**
   * Format statistics for display
   * @param stats The statistics object
   */
  protected formatStats(stats: {
    totalUsers: number;
    activeUsers: number;
    totalEngagements: number;
  }): string {
    return `
Platform Statistics:
Total Users: ${stats.totalUsers}
Active Users (24h): ${stats.activeUsers}
Total Engagements: ${stats.totalEngagements}
    `.trim();
  }

  /**
   * Validate admin command arguments
   * @param args The command arguments
   * @param minArgs Minimum number of required arguments
   * @param usage Usage string to show if validation fails
   */
  protected validateArgs(
    args: string[],
    minArgs: number,
    usage: string
  ): boolean {
    return args.length >= minArgs;
  }

  /**
   * Log admin actions for auditing
   * @param userId Admin user ID
   * @param action Action performed
   * @param details Additional details about the action
   */
  protected async logAdminAction(
    userId: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    console.log(
      `[ADMIN ACTION] ${this.platform} - ${userId} - ${action}`,
      details || ""
    );
  }
}
