"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContestEntries = getContestEntries;
async function getContestEntries(prisma, wallet) {
    const user = await prisma.user.findUnique({
        where: { wallet },
    });
    if (!user)
        throw new Error("User not found");
    return prisma.contestEntry.findMany({
        where: { userId: user.id },
        include: {
            contest: true,
            user: {
                select: {
                    wallet: true,
                    points: true,
                    telegramUsername: true,
                    discordUsername: true,
                    twitterUsername: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
