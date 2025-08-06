// src/core/contest/RewardNotifier.ts
import { PrismaClient } from "@prisma/client";
import { Bot } from "grammy";
import { RewardType, ContestTier } from "../types/contest";
import { Platform } from "../types";

/**
 * Factory for creating RewardNotifier instances
 * Replaces singleton pattern for better testability and isolation
 */
export class RewardNotifierFactory {
  private static instance: RewardNotifier | null = null;

  static getInstance(): RewardNotifier {
    if (!this.instance) {
      this.instance = new RewardNotifier();
    }
    return this.instance;
  }

  static createInstance(): RewardNotifier {
    return new RewardNotifier();
  }

  static clearInstance(): void {
    this.instance = null;
  }
}

export class RewardNotifier {
  private static instance: RewardNotifier | null = null;
  private prisma: PrismaClient;
  private telegramBot?: Bot;

  constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): RewardNotifier {
    if (!this.instance) {
      this.instance = new RewardNotifier();
    }
    return this.instance;
  }

  setTelegramBot(bot: Bot) {
    this.telegramBot = bot;
  }

  async notifyRewardEarned(
    userId: string,
    rewardType: RewardType,
    tier: ContestTier
  ) {
    try {
      // Get user's platform accounts
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          telegramAccount: true,
          discordAccount: true,
          twitterAccount: true,
        },
      });

      if (!user) return;

      // Prepare notification message
      const message = this.formatRewardMessage(rewardType, tier);

      // Send notifications to all connected platforms
      await Promise.all([
        this.sendTelegramNotification(
          user.telegramAccount?.platformId,
          message
        ),
        this.sendDiscordNotification(user.discordAccount?.platformId, message),
        this.sendTwitterNotification(user.twitterAccount?.platformId, message),
      ]);

      // Record notification
      await this.prisma.notification.create({
        data: {
          userId,
          type: "REWARD_EARNED",
          message,
          metadata: {
            rewardType,
            tierName: tier.name,
          },
        },
      });
    } catch (error) {
      console.error("Error sending reward notification:", error);
    }
  }

  async notifyRankUpdate(
    userId: string,
    contestId: string,
    rank: number,
    reward: { amount: string; description: string }
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          telegramAccount: true,
        },
      });

      if (!user) return;

      const message = [
        "🎉 *Rank Update* 🎉",
        "",
        `Congratulations! You're now rank #${rank}!`,
        "",
        `• Prize: ${reward.amount} USDC`,
        `• ${reward.description}`,
        "",
        "Keep earning points to maintain or improve your rank!",
      ].join("\n");

      await this.sendTelegramNotification(
        user.telegramAccount?.platformId,
        message
      );
    } catch (error) {
      console.error("Error sending rank update:", error);
    }
  }

  async notifyContestEnd(contestId: string) {
    try {
      const contest = await this.prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          entries: {
            orderBy: { points: "desc" },
            take: 10,
            include: {
              user: {
                include: {
                  telegramAccount: true,
                },
              },
            },
          },
        },
      });

      if (!contest) return;

      // Using the actual Prisma types
      const formatLeaderboardEntry = (
        entry: (typeof contest.entries)[0],
        index: number
      ) =>
        `${index + 1}. ${
          entry.user.telegramAccount?.username || "Anonymous"
        }: ${entry.points} points`;

      const leaderboardMessage = [
        "🏆 *Contest Results* 🏆",
        "",
        "Final Rankings:",
        ...contest.entries.map(formatLeaderboardEntry),
        "",
        "Winners will receive their USDC rewards automatically!",
        "",
        "Check /rewards to view your rewards.",
      ].join("\n");

      // Notify all participants
      for (const entry of contest.entries) {
        if (entry.user.telegramAccount?.platformId) {
          await this.sendTelegramNotification(
            entry.user.telegramAccount.platformId,
            leaderboardMessage
          );
        }
      }
    } catch (error) {
      console.error("Error sending contest end notifications:", error);
    }
  }

  private async sendTelegramNotification(
    telegramId: string | undefined,
    message: string
  ) {
    if (!telegramId || !this.telegramBot) return;

    try {
      await this.telegramBot.api.sendMessage(telegramId, message, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error sending Telegram notification:", error);
    }
  }

  private async sendDiscordNotification(
    discordId: string | undefined,
    message: string
  ) {
    // Discord notification will be implemented when Discord bot is set up
    // This is just a placeholder for future implementation
    if (!discordId) return;

    try {
      // Implementation will depend on how the Discord bot is set up
      console.log(`[Discord Notification] To ${discordId}: ${message}`);
    } catch (error) {
      console.error("Error sending Discord notification:", error);
    }
  }

  private async sendTwitterNotification(
    twitterId: string | undefined,
    message: string
  ) {
    // Twitter notification will be implemented when Twitter bot is set up
    // This is just a placeholder for future implementation
    if (!twitterId) return;

    try {
      // Implementation will depend on how the Twitter API integration is set up
      console.log(`[Twitter Notification] To ${twitterId}: ${message}`);
    } catch (error) {
      console.error("Error sending Twitter notification:", error);
    }
  }

  private formatRewardMessage(
    rewardType: RewardType,
    tier: ContestTier
  ): string {
    return [
      "🎉 *Reward Earned!* 🎉",
      "",
      `Congratulations! You've earned a ${this.formatRewardType(rewardType)}!`,
      "",
      `Tier: ${tier.name}`,
      `Required Points: ${tier.minPoints}`,
      "",
      "Use /rewards to view and claim your rewards.",
      "",
      "⚠️ Some rewards may have expiration dates. Make sure to claim them in time!",
    ].join("\n");
  }

  private formatRewardType(rewardType: RewardType): string {
    const formats: Record<RewardType, string> = {
      USDC: "USDC Reward",
      SOLANA: "SOL Reward",
      SOUL: "SOUL Token Reward",
      WHITELIST: "Whitelist Spot",
      FREE_MINT: "Free Mint",
      FREE_GAS: "Free Gas",
      NO_FEES: "No Trading Fees",
      NONE: "No Reward",
    };
    return formats[rewardType] || rewardType;
  }
}

export default RewardNotifier.getInstance();
