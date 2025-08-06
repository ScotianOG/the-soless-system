"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentContest = getCurrentContest;
async function getCurrentContest(prisma) {
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
