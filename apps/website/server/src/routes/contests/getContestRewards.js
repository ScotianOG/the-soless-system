"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContestRewards = getContestRewards;
async function getContestRewards(prisma, wallet) {
    const user = await prisma.user.findUnique({
        where: { wallet },
    });
    if (!user)
        throw new Error("User not found");
    return prisma.contestReward.findMany({
        where: { userId: user.id },
        include: {
            contest: {
                select: {
                    name: true,
                    endTime: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
