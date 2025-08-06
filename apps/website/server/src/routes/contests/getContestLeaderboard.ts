// src/routes/contests/getContestLeaderboard.ts
import { PrismaClient } from "@prisma/client";

export async function getContestLeaderboard(
  prisma: PrismaClient,
  contestId: string
) {
  return prisma.contestEntry.findMany({
    where: { contestId },
    orderBy: { points: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          wallet: true,
          telegramUsername: true,
          discordUsername: true,
          twitterUsername: true,
        },
      },
    },
  });
}
