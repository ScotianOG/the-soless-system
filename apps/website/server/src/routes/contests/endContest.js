"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endContest = endContest;
function getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
async function endContest(prisma, contestId) {
    const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
            status: "COMPLETED",
            metadata: {
                completedAt: new Date(),
            },
        },
    });
    const entries = await prisma.contestEntry.findMany({
        where: { contestId: contest.id },
        orderBy: { points: "desc" },
    });
    // Process rewards
    await Promise.all(entries.slice(0, 5).map(async (entry, index) => {
        const rank = index + 1;
        const amount = {
            1: "100",
            2: "75",
            3: "50",
            4: "25",
            5: "10"
        }[rank];
        if (amount) {
            await createReward(prisma, entry.userId, contest.id, "USDC", {
                rank,
                amount,
                description: `${rank}${getOrdinalSuffix(rank)} Place - ${amount} USDC`
            });
        }
    }));
    return contest;
}
async function createReward(prisma, userId, contestId, type, metadata) {
    return prisma.contestReward.create({
        data: {
            userId,
            contestId,
            type,
            status: "PENDING",
            metadata,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
    });
}
