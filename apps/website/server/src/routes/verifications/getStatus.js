"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerificationStatus = getVerificationStatus;
async function getVerificationStatus(prisma, wallet) {
    const user = await prisma.user.findUnique({
        where: { wallet },
        include: {
            telegramAccount: true,
            discordAccount: true,
            twitterAccount: true,
        },
    });
    if (!user) {
        throw new Error("User not found");
    }
    return {
        telegram: !!user.telegramAccount,
        discord: !!user.discordAccount,
        twitter: !!user.twitterAccount,
        accounts: {
            telegram: user.telegramAccount,
            discord: user.discordAccount,
            twitter: user.twitterAccount,
        },
    };
}
