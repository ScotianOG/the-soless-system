// src/routes/stats/getActionBreakdown.ts
import { PrismaClient } from "@prisma/client";
import { ActionBreakdown } from "./types";

export async function getActionBreakdown(
  prisma: PrismaClient,
  days: number = 7
): Promise<ActionBreakdown[]> {
  // Calculate start date based on days parameter
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get counts by engagement type
  const actionCounts = await prisma.$queryRaw`
    SELECT "type", COUNT(*) as count
    FROM "Engagement"
    WHERE "timestamp" >= ${startDate}
    GROUP BY "type"
    ORDER BY count DESC
  `;

  let totalCount = 0;
  const results: ActionBreakdown[] = [];

  if (Array.isArray(actionCounts)) {
    // First calculate total
    actionCounts.forEach((action: any) => {
      totalCount += Number(action.count);
    });

    // Then calculate percentages
    actionCounts.forEach((action: any) => {
      const count = Number(action.count);
      results.push({
        type: action.type,
        count,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
      });
    });
  }

  return results;
}
