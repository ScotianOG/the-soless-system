// src/routes/contests/getAllContests.ts
import { PrismaClient } from "@prisma/client";

export async function getAllContests(prisma: PrismaClient) {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: {
        startTime: "desc",
      },
      include: {
        entries: {
          select: {
            qualifiedAt: true,
          },
        },
      },
    });

    return contests.map((contest) => ({
      id: contest.id,
      name: contest.name,
      startTime: contest.startTime,
      endTime: contest.endTime,
      status: contest.status,
      rules: contest.rules,
      qualifiedUsers: contest.entries.filter(
        (entry) => entry.qualifiedAt !== null
      ).length,
      totalEntries: contest.entries.length,
      createdAt: contest.createdAt,
      updatedAt: contest.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching all contests:", error);
    throw error;
  }
}
