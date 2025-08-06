// src/routes/contests/getCurrentContest.ts
import { PrismaClient } from '@prisma/client';

export async function getCurrentContest(prisma: PrismaClient) {
  return prisma.contest.findFirst({
    where: { status: "ACTIVE" },
    include: {
      entries: {
        orderBy: { points: "desc" },
        take: 10,
        include: { user: true },
      },
    },
  });
}