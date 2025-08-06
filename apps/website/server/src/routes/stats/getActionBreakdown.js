"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionBreakdown = getActionBreakdown;
async function getActionBreakdown(prisma, days = 7) {
    // Calculate start date based on days parameter
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Get counts by engagement type
    const actionCounts = await prisma.$queryRaw `
    SELECT "type", COUNT(*) as count
    FROM "Engagement"
    WHERE "timestamp" >= ${startDate}
    GROUP BY "type"
    ORDER BY count DESC
  `;
    let totalCount = 0;
    const results = [];
    if (Array.isArray(actionCounts)) {
        // First calculate total
        actionCounts.forEach((action) => {
            totalCount += Number(action.count);
        });
        // Then calculate percentages
        actionCounts.forEach((action) => {
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
