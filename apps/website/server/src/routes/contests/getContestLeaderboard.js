"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContestLeaderboard = getContestLeaderboard;
async function getContestLeaderboard(prisma, contestId) {
    return prisma.contestEntry.findMany({
        where: { contestId },
        orderBy: { points: "desc" },
        take: 100,
        include: {
            user: {
                select: {
                    wallet: true,
                    telegramUsername: true,
                    discordUsername: true,
                    twitterUsername: true,
                },
            },
        },
    });
}
