"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformStats = getPlatformStats;
async function getPlatformStats(prisma, platform, userId) {
    const [points, engagements] = await Promise.all([
        prisma.pointTransaction.aggregate({
            where: {
                userId,
                platform
            },
            _sum: {
                amount: true
            }
        }),
        prisma.engagement.count({
            where: {
                userId,
                platform,
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        })
    ]);
    return {
        points: points._sum.amount || 0,
        engagements,
    };
}
