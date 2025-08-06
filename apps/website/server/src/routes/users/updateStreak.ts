// src/routes/users/updateStreak.ts
import { PrismaClient, Platform } from "@prisma/client";
import { UpdateStreakRequest, UserStreaks } from "./types";

export async function updateStreak(
  prisma: PrismaClient,
  data: UpdateStreakRequest
): Promise<UserStreaks> {
  const user = await prisma.user.findUnique({
    where: { wallet: data.wallet },
    include: { streaks: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create streaks record if it doesn't exist
  if (!user.streaks) {
    await prisma.userStreak.create({
      data: {
        userId: user.id,
        telegramStreak: 0,
        discordStreak: 0,
        twitterStreak: 0,
      },
    });
  }

  type StreakField = "telegramStreak" | "discordStreak" | "twitterStreak";
  type LastActivityField = "lastTelegram" | "lastDiscord" | "lastTwitter";

  const streakField = `${data.platform.toLowerCase()}Streak` as StreakField;
  const lastActivityField = `last${
    data.platform.charAt(0).toUpperCase() + data.platform.slice(1)
  }` as LastActivityField;

  const now = new Date();
  const lastActivity = user.streaks?.[lastActivityField];
  const currentStreak = user.streaks?.[streakField] ?? 0;

  let newStreak = currentStreak;

  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    const timeDiff = now.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) {
      // Streak broken
      newStreak = 1;
    } else if (daysDiff === 1) {
      // Streak continues
      newStreak += 1;

      // Check for streak bonus (every 3 days)
      if (newStreak % 3 === 0) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { points: { increment: 5 } },
          }),
          prisma.pointHistory.create({
            data: {
              userId: user.id,
              points: 5,
              reason: "STREAK_BONUS",
              platform: data.platform.toUpperCase() as Platform,
            },
          }),
        ]);
      }
    }
  } else {
    // First activity
    newStreak = 1;
  }

  const updatedStreak = await prisma.userStreak.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      telegramStreak: streakField === "telegramStreak" ? 1 : 0,
      discordStreak: streakField === "discordStreak" ? 1 : 0,
      twitterStreak: streakField === "twitterStreak" ? 1 : 0,
      [lastActivityField]: now,
    },
    update: {
      [streakField]: newStreak,
      [lastActivityField]: now,
    },
  });

  // Convert null dates to undefined to match UserStreaks interface
  return {
    ...updatedStreak,
    lastTelegram: updatedStreak.lastTelegram || undefined,
    lastDiscord: updatedStreak.lastDiscord || undefined,
    lastTwitter: updatedStreak.lastTwitter || undefined,
  };
}
