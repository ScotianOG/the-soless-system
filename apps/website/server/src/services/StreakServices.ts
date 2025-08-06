import { PrismaClient, UserStreak } from "@prisma/client";
import { Platform } from "../types";

type StreakField = 'telegramStreak' | 'discordStreak' | 'twitterStreak';
type LastActivityField = 'lastTelegram' | 'lastDiscord' | 'lastTwitter';

export class StreakService {
  private static instance: StreakService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  async updateStreak(wallet: string, platform: Platform) {
    const user = await this.prisma.user.findUnique({
      where: { wallet },
      include: { streaks: true },
    });

    if (!user) throw new Error("User not found");

    if (!user.streaks) {
      await this.prisma.userStreak.create({
        data: {
          userId: user.id,
          telegramStreak: 0,
          discordStreak: 0,
          twitterStreak: 0,
        },
      });
    }

    const platformName = Platform[platform].toLowerCase();
    const streakField = `${platformName}Streak` as StreakField;
    const lastActivityField = `last${
      platformName.charAt(0).toUpperCase() + platformName.slice(1)
    }` as LastActivityField;
    const now = new Date();
    const lastActivity = user.streaks?.[lastActivityField as keyof UserStreak];

    let newStreak = Number(user.streaks?.[streakField as keyof UserStreak] || 0);

    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const timeDiff = now.getTime() - lastDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff > 1) {
        newStreak = 1;
      } else if (daysDiff === 1) {
        newStreak += 1;

        // Check for streak bonus (every 3 days)
        if (newStreak % 3 === 0) {
          await this.prisma.$transaction([
            // Add streak bonus points
            this.prisma.user.update({
              where: { id: user.id },
              data: { points: { increment: 5 } },
            }),
            // Record point transaction
            this.prisma.pointHistory.create({
              data: {
                userId: user.id,
                points: 5,
                reason: "STREAK_BONUS",
                platform: platform.toUpperCase() as Platform,
              },
            }),
          ]);
        }
      }
    } else {
      newStreak = 1;
    }

    const updatedStreak = await this.prisma.userStreak.update({
      where: { userId: user.id },
      data: {
        [streakField as keyof UserStreak]: newStreak,
        [lastActivityField as keyof UserStreak]: now,
      },
    });

    return updatedStreak;
  }
}
