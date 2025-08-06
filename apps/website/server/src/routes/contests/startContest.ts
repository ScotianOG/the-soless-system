// src/routes/contests/startContest.ts
import { PrismaClient } from "@prisma/client";

interface StartContestParams {
  name: string;
  endTime: string | Date;
  rules?: Record<string, any>;
}

export async function startContest(
  prisma: PrismaClient,
  params: StartContestParams
) {
  // End any active contests
  await prisma.contest.updateMany({
    where: { status: "ACTIVE" },
    data: { status: "COMPLETED" },
  });

  // Create new contest
  return prisma.contest.create({
    data: {
      name: params.name,
      startTime: new Date(),
      endTime: new Date(params.endTime),
      status: "ACTIVE",
      rules: params.rules || {},
    },
  });
}
