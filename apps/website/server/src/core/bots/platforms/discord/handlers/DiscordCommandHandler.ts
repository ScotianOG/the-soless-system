// src/core/bots/platforms/discord/handlers/DiscordCommandHandler.ts
import { Message } from "discord.js";
import { CommandHandler } from "../../../handlers/CommandHandler";
import { UserManager } from "../../../../user/UserManager";
import { RewardManager } from "../../../../contest/RewardManager";
import { EngagementTracker } from "../../../../engagement/EngagementTracker";
import { Platform } from "../../../../../types";

interface UserStreaks {
  telegramStreak: number;
  discordStreak: number;
  twitterStreak: number;
}

interface UserTransaction {
  id: string;
  userId: string;
  platform: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
  amount: number;
  reason: string;
  contestId: string | null;
}

interface ContestEntry {
  contest: {
    id: string;
    name: string;
    status: string;
  };
}

interface UserData {
  id: string;
  wallet: string;
  streaks: UserStreaks;
  pointTransactions: UserTransaction[];
  contestEntries: ContestEntry[];
}

interface UserStatsResponse {
  user: UserData;
  contestStats: {
    totalPoints: number;
    rank: number;
    platformPoints: {
      [key in Platform]: number;
    };
  };
  platforms: Record<
    Platform,
    {
      verified: boolean;
      code?: string;
      expiresAt?: Date;
    }
  >;
}

import { EngagementType } from "../../../../types/engagement";

interface EngagementData {
  userId: string;
  type: EngagementType;
  metadata: Record<string, unknown>;
  platform: Platform;
  timestamp: Date;
}

export class DiscordCommandHandler extends CommandHandler {
  constructor(
    platform: Platform,
    engagementTracker: EngagementTracker,
    userManager: UserManager,
    rewardManager: RewardManager
  ) {
    super(platform, engagementTracker, userManager, rewardManager);
  }

  async handleCommand(
    command: string,
    args: string[],
    message: Message
  ): Promise<void> {
    try {
      // Validate command with error handling
      let isValid = false;
      try {
        isValid = await this.validateCommand(message.author.id, command);
      } catch (validateError) {
        console.error("Error during command validation:", validateError);
        try {
          await message.reply(
            "Sorry, there was an error validating your account. Please try again later."
          );
        } catch (replyError) {
          console.error("Error sending validation error reply:", replyError);
        }
        return;
      }

      if (!isValid) {
        try {
          await message.reply("Please verify your account first!");
        } catch (replyError) {
          console.error("Error sending validation failure reply:", replyError);
        }
        return;
      }

      switch (command.toLowerCase()) {
        case "points":
          try {
            await this.handlePointsCommand(message);
          } catch (pointsError) {
            console.error("Error in points command:", pointsError);
            try {
              await message.reply(
                "Sorry, there was an error retrieving your points. Please try again later."
              );
            } catch (replyError) {
              console.error("Error sending points error reply:", replyError);
            }
          }
          break;
        case "rewards":
          try {
            await this.handleRewardsCommand(message);
          } catch (rewardsError) {
            console.error("Error in rewards command:", rewardsError);
            try {
              await message.reply(
                "Sorry, there was an error retrieving rewards. Please try again later."
              );
            } catch (replyError) {
              console.error("Error sending rewards error reply:", replyError);
            }
          }
          break;
        case "help":
          try {
            await message.reply(this.getHelpMessage());
          } catch (helpError) {
            console.error("Error in help command:", helpError);
          }
          break;
        case "soulieplay":
          try {
            await this.handleMusicCommand(message, args);
          } catch (musicError) {
            console.error("Error in music command:", musicError);
            try {
              await message.reply(
                "Sorry, there was an error processing your music command. Please try again later."
              );
            } catch (replyError) {
              console.error("Error sending music error reply:", replyError);
            }
          }
          break;
        default:
          try {
            await message.reply(
              "Unknown command. Use !help to see available commands."
            );
          } catch (defaultError) {
            console.error("Error sending default command reply:", defaultError);
          }
      }
    } catch (error) {
      console.error("Error handling Discord command:", error);
      try {
        await message.reply(
          "Sorry, an error occurred while processing your command. Please try again later."
        );
      } catch (replyError) {
        console.error("Error sending error reply:", replyError);
      }
    }
  }

  // Implement the abstract method from base class
  protected async validateCommand(
    userId: string,
    command: string
  ): Promise<boolean> {
    try {
      const user = await this.userManager.getUserByPlatform(
        this.platform,
        userId
      );
      if (!user) return false;
      return true;
    } catch (error) {
      console.error("Error validating command:", error);
      return false;
    }
  }

  // Implement help message
  protected getHelpMessage(): string {
    return [
      "**Available Commands**",
      "!points - Check your points and stats",
      "!rewards - View available rewards",
      "!soulieplay <song> - Share music",
      "!help - Show this help message",
    ].join("\n");
  }

  async handleRewardsCommand(message: Message): Promise<void> {
    try {
      // TODO: Implement rewards command
      await message.reply("Rewards feature coming soon!");
    } catch (error) {
      console.error("Error in handleRewardsCommand:", error);
      try {
        await message.reply(
          "Sorry, there was an error retrieving rewards information. Please try again later."
        );
      } catch (replyError) {
        console.error("Error sending rewards error reply:", replyError);
      }
    }
  }

  private async handlePointsCommand(message: Message): Promise<void> {
    try {
      const user = await this.userManager.getUserByPlatform(
        "DISCORD",
        message.author.id
      );
      if (!user) return;

      const stats = (await this.userManager.getUserStats(
        user.id
      )) as UserStatsResponse;
      const response = [
        "🏆 **Your SOLess Stats**",
        "",
        `Total Points: ${stats.contestStats.totalPoints}`,
        `Global Rank: #${stats.contestStats.rank}`,
        "",
        "🎮 Discord Activity",
        `• Current Streak: ${stats.user.streaks.discordStreak} days`,
        `• Platform Points: ${stats.contestStats.platformPoints.DISCORD || 0}`,
        "",
        "🎵 Recent Activity",
        ...stats.user.pointTransactions
          .slice(0, 3)
          .map((tx: UserTransaction) => `• ${tx.reason} (+${tx.amount})`),
      ].join("\n");

      await message.reply({ content: response });
    } catch (error) {
      console.error("Error in handlePointsCommand:", error);
      try {
        await message.reply(
          "Sorry, there was an error retrieving your stats. Please try again later."
        );
      } catch (replyError) {
        console.error("Error sending points error reply:", replyError);
      }
    }
  }

  private async handleMusicCommand(
    message: Message,
    args: string[]
  ): Promise<void> {
    try {
      const songInfo = args.join(" ");
      if (!songInfo) {
        await message.reply('Please provide a song link or "artist - song"');
        return;
      }

      const user = await this.userManager.getUserByPlatform(
        "DISCORD",
        message.author.id
      );
      if (!user) return;

      await this.trackEngagement({
        userId: user.id,
        type: "MUSIC_SHARE" as EngagementType,
        metadata: { songInfo },
        platform: this.platform,
        timestamp: new Date(),
      });

      await message.reply("🎵 Thanks for sharing! Points awarded.");
    } catch (error) {
      console.error("Error in handleMusicCommand:", error);
      try {
        await message.reply(
          "Sorry, there was an error processing your music share. Please try again later."
        );
      } catch (replyError) {
        console.error("Error sending music error reply:", replyError);
      }
    }
  }

  protected async trackEngagement(data: EngagementData): Promise<void> {
    try {
      await this.engagementTracker.trackEngagement(data);
    } catch (error) {
      console.error("Error tracking engagement:", error);
      // Don't rethrow - we want engagement tracking failures to be non-fatal
    }
  }
}
