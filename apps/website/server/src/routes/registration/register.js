"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
const prisma_1 = require("../../lib/prisma");
const types_1 = require("../../types");
async function register(req, res) {
    const { wallet, platforms } = req.body;
    try {
        // Create or update user
        const user = await prisma_1.prisma.user.upsert({
            where: { wallet },
            update: {},
            create: {
                wallet,
                points: 0,
                lifetimePoints: 0
            }
        });
        // Process each linked platform
        const createPlatformAccounts = Object.entries(platforms)
            .filter(([_, data]) => data.linked)
            .map(async ([platform, data]) => {
            switch (platform.toUpperCase()) {
                case types_1.Platform.TELEGRAM:
                    if (data.platformId) {
                        await prisma_1.prisma.telegramAccount.upsert({
                            where: { userId: user.id },
                            create: {
                                platformId: data.platformId,
                                username: data.username || 'unknown',
                                userId: user.id
                            },
                            update: {
                                platformId: data.platformId,
                                username: data.username || 'unknown'
                            }
                        });
                    }
                    break;
                case types_1.Platform.DISCORD:
                    if (data.platformId) {
                        await prisma_1.prisma.discordAccount.upsert({
                            where: { userId: user.id },
                            create: {
                                platformId: data.platformId,
                                username: data.username || 'unknown',
                                userId: user.id
                            },
                            update: {
                                platformId: data.platformId,
                                username: data.username || 'unknown'
                            }
                        });
                    }
                    break;
                case types_1.Platform.TWITTER:
                    if (data.platformId) {
                        await prisma_1.prisma.twitterAccount.upsert({
                            where: { userId: user.id },
                            create: {
                                platformId: data.platformId,
                                username: data.username || 'unknown',
                                userId: user.id
                            },
                            update: {
                                platformId: data.platformId,
                                username: data.username || 'unknown'
                            }
                        });
                    }
                    break;
            }
        });
        await Promise.all(createPlatformAccounts);
        res.status(201).json({
            message: 'Registration successful',
            userId: user.id
        });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
