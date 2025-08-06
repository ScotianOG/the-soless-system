"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimReward = claimReward;
async function claimReward(prisma, rewardId) {
    const reward = await prisma.contestReward.findUnique({
        where: { id: rewardId },
        include: { user: true },
    });
    if (!reward) {
        throw new Error("Reward not found");
    }
    if (reward.status !== "PENDING") {
        throw new Error("Reward already claimed or expired");
    }
    if (reward.expiresAt && reward.expiresAt < new Date()) {
        throw new Error("Reward expired");
    }
    const updatedReward = await prisma.contestReward.update({
        where: { id: rewardId },
        data: {
            status: "CLAIMED",
            claimedAt: new Date(),
        },
    });
    return { success: true, reward: updatedReward };
}
