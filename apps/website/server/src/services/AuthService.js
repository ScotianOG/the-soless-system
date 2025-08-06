"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// src/services/AuthService.ts
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const logger_1 = require("../utils/logger");
class AuthService {
    constructor() {
        // private constructor to enforce singleton pattern
        this.prisma = new client_1.PrismaClient();
        this.nonceStore = new Map();
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async generateVerificationCode(wallet, platform) {
        try {
            // Validate inputs
            if (!wallet || !platform) {
                throw new Error("Wallet and platform are required");
            }
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const expiresIn = "30m";
            // First, ensure the user exists
            await this.prisma.user.upsert({
                where: { wallet },
                create: { wallet, points: 0, lifetimePoints: 0 },
                update: {},
            });
            // Then create the verification code
            await this.prisma.verificationCode.create({
                data: {
                    code,
                    platform,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                    isUsed: false,
                    user: {
                        connect: { wallet },
                    },
                },
            });
            return { code, expiresIn };
        }
        catch (error) {
            logger_1.logger.error("Error generating verification code:", error);
            throw new Error("Failed to generate verification code");
        }
    }
    async verifyWalletSignature(wallet, signature, message) {
        try {
            const isValid = await (0, auth_1.verifyWalletSignature)(wallet, signature, message);
            if (!isValid) {
                return {
                    success: false,
                    error: "Invalid signature",
                };
            }
            const user = await this.prisma.user.upsert({
                where: { wallet },
                update: {
                    lastActive: new Date(),
                },
                create: {
                    wallet,
                    points: 0,
                    lifetimePoints: 0,
                    createdAt: new Date(),
                },
                include: {
                    telegramAccount: true,
                    discordAccount: true,
                    twitterAccount: true,
                    streaks: true,
                },
            });
            const token = (0, auth_1.generateToken)({
                id: user.id,
                wallet: user.wallet,
            });
            // Convert null to undefined for User type compatibility
            const userResponse = {
                id: user.id,
                wallet: user.wallet,
                telegramUsername: user.telegramUsername || undefined,
                discordUsername: user.discordUsername || undefined,
                twitterUsername: user.twitterUsername || undefined,
                points: user.points,
                lastActive: user.lastActive || undefined,
                createdAt: user.createdAt,
                lifetimePoints: user.lifetimePoints,
                bestRank: user.bestRank || undefined,
                telegramAccount: user.telegramAccount
                    ? {
                        ...user.telegramAccount,
                        username: user.telegramAccount.username || undefined,
                    }
                    : undefined,
                discordAccount: user.discordAccount
                    ? {
                        ...user.discordAccount,
                        username: user.discordAccount.username || undefined,
                    }
                    : undefined,
                twitterAccount: user.twitterAccount
                    ? {
                        ...user.twitterAccount,
                        username: user.twitterAccount.username || undefined,
                    }
                    : undefined,
                streaks: user.streaks
                    ? {
                        ...user.streaks,
                        lastTelegram: user.streaks.lastTelegram || undefined,
                        lastDiscord: user.streaks.lastDiscord || undefined,
                        lastTwitter: user.streaks.lastTwitter || undefined,
                    }
                    : undefined,
            };
            return {
                success: true,
                token,
                user: userResponse,
            };
        }
        catch (error) {
            logger_1.logger.error("Error verifying signature:", error);
            return {
                success: false,
                error: "Authentication failed",
            };
        }
    }
    async getCurrentUser(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    telegramAccount: true,
                    discordAccount: true,
                    twitterAccount: true,
                    streaks: true,
                },
            });
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        }
        catch (error) {
            logger_1.logger.error("Error fetching user:", error);
            throw error;
        }
    }
    cleanupNonces() {
        const now = Date.now();
        for (const [wallet, data] of this.nonceStore.entries()) {
            if (now > data.expires) {
                this.nonceStore.delete(wallet);
            }
        }
    }
    startCleanup() {
        setInterval(() => this.cleanupNonces(), 5 * 60 * 1000);
    }
    async getTwitterAuthUrl(state) {
        const clientId = process.env.TWITTER_CLIENT_ID;
        const redirectUri = process.env.TWITTER_REDIRECT_URI;
        if (!clientId || !redirectUri) {
            throw new Error('Twitter OAuth configuration missing');
        }
        const scope = 'tweet.read users.read';
        return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    }
    async handleTwitterCallback(code, wallet) {
        try {
            const clientId = process.env.TWITTER_CLIENT_ID;
            const clientSecret = process.env.TWITTER_CLIENT_SECRET;
            const redirectUri = process.env.TWITTER_REDIRECT_URI;
            if (!clientId || !clientSecret || !redirectUri) {
                throw new Error('Twitter OAuth configuration missing');
            }
            // Exchange code for access token
            const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                },
                body: new URLSearchParams({
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                    code_verifier: 'challenge',
                }),
            });
            if (!tokenResponse.ok) {
                throw new Error('Failed to get access token');
            }
            const tokenData = await tokenResponse.json();
            const { access_token } = tokenData;
            // Get user info
            const userResponse = await fetch('https://api.twitter.com/2/users/me', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            if (!userResponse.ok) {
                throw new Error('Failed to get user info');
            }
            const userData = await userResponse.json();
            const { username, id: platformId } = userData.data;
            // Update user in database
            await this.prisma.user.update({
                where: { wallet },
                data: {
                    twitterUsername: username,
                    twitterAccount: {
                        upsert: {
                            create: {
                                username,
                                platformId
                            },
                            update: {
                                username,
                                platformId
                            },
                        },
                    },
                },
            });
            return { username };
        }
        catch (error) {
            logger_1.logger.error('Error handling Twitter callback:', error);
            throw error;
        }
    }
    async getDiscordAuthUrl(state) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri = process.env.DISCORD_REDIRECT_URI;
        if (!clientId || !redirectUri) {
            throw new Error('Discord OAuth configuration missing');
        }
        const scope = 'identify';
        return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
    }
    async handleDiscordCallback(code, wallet) {
        try {
            const clientId = process.env.DISCORD_CLIENT_ID;
            const clientSecret = process.env.DISCORD_CLIENT_SECRET;
            const redirectUri = process.env.DISCORD_REDIRECT_URI;
            if (!clientId || !clientSecret || !redirectUri) {
                throw new Error('Discord OAuth configuration missing');
            }
            // Exchange code for access token
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri
                })
            });
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                throw new Error(`Failed to get access token: ${errorData}`);
            }
            const tokenData = await tokenResponse.json();
            const { access_token, token_type } = tokenData;
            // Get user info
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `${token_type} ${access_token}`
                }
            });
            if (!userResponse.ok) {
                throw new Error('Failed to get user info');
            }
            const userData = await userResponse.json();
            const { username, id: platformId } = userData;
            // Update user in database
            await this.prisma.user.update({
                where: { wallet },
                data: {
                    discordUsername: username,
                    discordAccount: {
                        upsert: {
                            create: {
                                username,
                                platformId
                            },
                            update: {
                                username,
                                platformId
                            }
                        }
                    }
                }
            });
            return { username };
        }
        catch (error) {
            logger_1.logger.error('Error handling Discord callback:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
exports.authService = AuthService.getInstance();
