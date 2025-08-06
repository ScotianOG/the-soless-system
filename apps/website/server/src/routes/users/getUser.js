"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
const prisma_1 = require("../../lib/prisma");
async function getUser(req, res) {
    const { walletAddress } = req.params;
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { wallet: walletAddress },
            include: {
                telegramAccount: true,
                discordAccount: true,
                twitterAccount: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const profile = {
            id: user.id,
            wallet: user.wallet,
            telegramUsername: user.telegramUsername || undefined,
            discordUsername: user.discordUsername || undefined,
            twitterUsername: user.twitterUsername || undefined,
            lastActive: user.lastActive || undefined,
            createdAt: user.createdAt,
            points: user.points,
            lifetimePoints: user.lifetimePoints,
            bestRank: user.bestRank || undefined,
        };
        res.json(profile);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
