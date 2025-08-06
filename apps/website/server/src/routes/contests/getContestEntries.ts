// src/routes/contests/getContestEntries.ts
import { PrismaClient } from "@prisma/client";

export async function getContestEntries(prisma: PrismaClient, wallet: string) {
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user) throw new Error("User not found");

  return prisma.contestEntry.findMany({
    where: { userId: user.id },
    include: {
      contest: true,
      user: {
        select: {
          wallet: true,
          points: true,
          telegramUsername: true,
          discordUsername: true,
          twitterUsername: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
