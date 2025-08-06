// src/routes/stats/getTimeSeriesStats.ts
import { PrismaClient } from "@prisma/client";
import { TimeSeriesStats, TimeFrame, Platform } from "./types";

export async function getTimeSeriesStats(
  prisma: PrismaClient,
  timeFrame: TimeFrame = "WEEK"
): Promise<TimeSeriesStats[]> {
  // Define the date range based on timeframe
  const startDate = new Date();
  let dateFormat: string;
  let groupBy: string;

  switch (timeFrame) {
    case "DAY":
      // Last 24 hours by hour
      startDate.setHours(startDate.getHours() - 24);
      dateFormat = "YYYY-MM-DD HH24";
      groupBy = "hour";
      break;
    case "WEEK":
      // Last 7 days by day
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = "YYYY-MM-DD";
      groupBy = "day";
      break;
    case "MONTH":
      // Last 30 days by day
      startDate.setDate(startDate.getDate() - 30);
      dateFormat = "YYYY-MM-DD";
      groupBy = "day";
      break;
    case "YEAR":
      // Last 12 months by month
      startDate.setMonth(startDate.getMonth() - 12);
      dateFormat = "YYYY-MM";
      groupBy = "month";
      break;
    default:
      // Default to week
      startDate.setDate(startDate.getDate() - 7);
      dateFormat = "YYYY-MM-DD";
      groupBy = "day";
  }

  // Get engagement counts by platform and time period
  const engagementData = await prisma.$queryRaw`
    SELECT 
      to_char("timestamp", ${dateFormat}) as date,
      platform,
      COUNT(*) as count
    FROM "Engagement"
    WHERE "timestamp" >= ${startDate}
    GROUP BY date, platform
    ORDER BY date ASC
  `;

  // Get points by platform and time period
  const pointsData = await prisma.$queryRaw`
    SELECT 
      to_char("timestamp", ${dateFormat}) as date,
      platform,
      SUM(amount) as points
    FROM "PointTransaction"
    WHERE "timestamp" >= ${startDate}
    GROUP BY date, platform
    ORDER BY date ASC
  `;

  // Get new users by day
  const newUsersData = await prisma.$queryRaw`
    SELECT 
      to_char("createdAt", ${dateFormat}) as date,
      COUNT(*) as count
    FROM "User"
    WHERE "createdAt" >= ${startDate}
    GROUP BY date
    ORDER BY date ASC
  `;

  // Process and merge the data
  const timeSeriesMap = new Map<string, TimeSeriesStats>();

  // Process engagement data
  if (Array.isArray(engagementData)) {
    engagementData.forEach((item: any) => {
      const dateKey = item.date;
      if (!timeSeriesMap.has(dateKey)) {
        timeSeriesMap.set(dateKey, {
          date: dateKey,
          TELEGRAM: { engagements: 0, points: 0 },
          DISCORD: { engagements: 0, points: 0 },
          TWITTER: { engagements: 0, points: 0 },
          newUsers: 0,
          total: { engagements: 0, points: 0 },
        });
      }

      const statsObj = timeSeriesMap.get(dateKey)!;
      if (item.platform in statsObj) {
        statsObj[item.platform as keyof typeof Platform].engagements = Number(
          item.count
        );
        statsObj.total.engagements += Number(item.count);
      }
    });
  }

  // Process points data
  if (Array.isArray(pointsData)) {
    pointsData.forEach((item: any) => {
      const dateKey = item.date;
      if (!timeSeriesMap.has(dateKey)) {
        timeSeriesMap.set(dateKey, {
          date: dateKey,
          TELEGRAM: { engagements: 0, points: 0 },
          DISCORD: { engagements: 0, points: 0 },
          TWITTER: { engagements: 0, points: 0 },
          newUsers: 0,
          total: { engagements: 0, points: 0 },
        });
      }

      const statsObj = timeSeriesMap.get(dateKey)!;
      if (item.platform in statsObj) {
        statsObj[item.platform as keyof typeof Platform].points = Number(
          item.points
        );
        statsObj.total.points += Number(item.points);
      }
    });
  }

  // Process new users data
  if (Array.isArray(newUsersData)) {
    newUsersData.forEach((item: any) => {
      const dateKey = item.date;
      if (!timeSeriesMap.has(dateKey)) {
        timeSeriesMap.set(dateKey, {
          date: dateKey,
          TELEGRAM: { engagements: 0, points: 0 },
          DISCORD: { engagements: 0, points: 0 },
          TWITTER: { engagements: 0, points: 0 },
          newUsers: 0,
          total: { engagements: 0, points: 0 },
        });
      }

      const statsObj = timeSeriesMap.get(dateKey)!;
      statsObj.newUsers = Number(item.count);
    });
  }

  // Convert map to array and sort by date
  return Array.from(timeSeriesMap.values()).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}
