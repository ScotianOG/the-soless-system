// src/routes/stats/getGlobalRank.ts
import { PrismaClient } from "@prisma/client";

export async function getGlobalRank(
  prisma: PrismaClient,
  userId: string
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user) return 0;

  const higherRanked = await prisma.user.count({
    where: {
      points: {
        gt: user.points,
      },
    },
  });

  return higherRanked + 1;
}
