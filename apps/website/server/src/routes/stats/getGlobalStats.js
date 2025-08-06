"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalStats = getGlobalStats;
async function getGlobalStats(prisma) {
  // Get total users count
  const totalUsers = await prisma.user.count();
  // Get active users today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = await prisma.user.count({
    where: {
      lastActive: {
        gte: today,
      },
    },
  });
  // Get total points
  const pointsAggregation = await prisma.pointTransaction.aggregate({
    _sum: {
      amount: true,
    },
  });
  const totalPoints = pointsAggregation._sum.amount || 0;
  // Get platform-specific stats
  const telegramUsers = await prisma.user.count({
    where: {
      telegramAccount: {
        isNot: null,
      },
      lastActive: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // active in last 7 days
      },
    },
  });
  const discordUsers = await prisma.user.count({
    where: {
      discordAccount: {
        isNot: null,
      },
      lastActive: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // active in last 7 days
      },
    },
  });
  const twitterUsers = await prisma.user.count({
    where: {
      twitterAccount: {
        isNot: null,
      },
      lastActive: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // active in last 7 days
      },
    },
  });
  // Get platform points
  const telegramPoints = await prisma.pointTransaction.aggregate({
    where: {
      platform: "TELEGRAM",
    },
    _sum: {
      amount: true,
    },
  });
  const discordPoints = await prisma.pointTransaction.aggregate({
    where: {
      platform: "DISCORD",
    },
    _sum: {
      amount: true,
    },
  });
  const twitterPoints = await prisma.pointTransaction.aggregate({
    where: {
      platform: "TWITTER",
    },
    _sum: {
      amount: true,
    },
  });
  // Get current contest data
  const currentContest = await prisma.contest.findFirst({
    where: {
      status: "ACTIVE",
    },
    include: {
      entries: true,
    },
  });
  // Get total engagement count (all-time)
  const totalEngagements = await prisma.engagement.count();

  // Top actions - get most common engagement types
  const actionCounts = await prisma.$queryRaw`
    SELECT "type", COUNT(*) as count
    FROM "Engagement"
    WHERE "timestamp" >= NOW() - INTERVAL '7 days'
    GROUP BY "type"
    ORDER BY count DESC
    LIMIT 5
  `;
  const topActions = {};
  if (Array.isArray(actionCounts)) {
    actionCounts.forEach((action) => {
      topActions[action.type] = Number(action.count);
    });
  }
  return {
    totalUsers,
    activeToday,
    totalPoints,
    totalEngagements,
    platformStats: {
      TELEGRAM: {
        activeUsers: telegramUsers,
        totalPoints: telegramPoints._sum.amount || 0,
      },
      DISCORD: {
        activeUsers: discordUsers,
        totalPoints: discordPoints._sum.amount || 0,
      },
      TWITTER: {
        activeUsers: twitterUsers,
        totalPoints: twitterPoints._sum.amount || 0,
      },
    },
    topActions,
    contest: currentContest
      ? {
          currentRound: currentContest.name,
          timeLeft: currentContest.endTime.toISOString(),
          qualifiedUsers: currentContest.entries.filter(
            (entry) => entry.qualifiedAt !== null
          ).length,
        }
      : null,
  };
}
