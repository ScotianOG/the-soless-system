// src/routes/contests/getContestRewards.ts
import { PrismaClient } from "@prisma/client";

export async function getContestRewards(prisma: PrismaClient, wallet: string) {
  const user = await prisma.user.findUnique({
    where: { wallet },
  });

  if (!user) throw new Error("User not found");

  return prisma.contestReward.findMany({
    where: { userId: user.id },
    include: {
      contest: {
        select: {
          name: true,
          endTime: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
