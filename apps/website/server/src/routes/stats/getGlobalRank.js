"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalRank = getGlobalRank;
async function getGlobalRank(prisma, userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
    });
    if (!user)
        return 0;
    const higherRanked = await prisma.user.count({
        where: {
            points: {
                gt: user.points,
            },
        },
    });
    return higherRanked + 1;
}
