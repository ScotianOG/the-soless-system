"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const prisma_1 = require("../../lib/prisma");
const PointManager_1 = require("../points/PointManager");
const VerificationManager_1 = __importDefault(require("../utils/VerificationManager"));
class UserManager {
    getUserPoints(id) {
        throw new Error("Method not implemented.");
    }
    constructor() {
        this.pointManager = PointManager_1.PointManager.getInstance();
        this.verificationManager = VerificationManager_1.default;
        this.prismaClient = prisma_1.prisma;
    }
    static getInstance() {
        if (!UserManager.instance) {
            UserManager.instance = new UserManager();
        }
        return UserManager.instance;
    }
    setPrismaClient(client) {
        this.prismaClient = client;
    }
    async getUserByPlatform(platform, platformId) {
        const account = await this.getPlatformAccount(platform, platformId);
        if (!account)
            return null;
        return this.prismaClient.user.findUnique({
            where: { id: account.userId },
            include: {
                streaks: true,
                telegramAccount: true,
                discordAccount: true,
                twitterAccount: true,
                contestEntries: {
                    where: {
                        contest: { status: 'ACTIVE' }
                    }
                }
            }
        });
    }
    async getUserByWallet(wallet) {
        return this.prismaClient.user.findUnique({
            where: { wallet },
            include: {
                streaks: true,
                telegramAccount: true,
                discordAccount: true,
                twitterAccount: true,
                contestEntries: {
                    where: {
                        contest: { status: 'ACTIVE' }
                    }
                }
            }
        });
    }
    async createUser(data) {
        return this.prismaClient.user.create({
            data: {
                wallet: data.wallet,
                telegramUsername: data.telegramUsername,
                discordUsername: data.discordUsername,
                twitterUsername: data.twitterUsername,
                streaks: {
                    create: {}
                }
            }
        });
    }
    async linkPlatform(userId, platform, platformId) {
        // Generate verification code
        const code = await this.verificationManager.generateCode(userId, platform);
        return { code };
    }
    async verifyPlatform(code, platform, platformId) {
        return this.verificationManager.verifyCode(code, platform, platformId);
    }
    async getPlatformVerificationStatus(userId) {
        return this.verificationManager.getUserVerificationStatus(userId);
    }
    async updateActivity(userId, platform) {
        const now = new Date();
        await this.prismaClient.user.update({
            where: { id: userId },
            data: {
                lastActive: now,
                streaks: {
                    upsert: {
                        create: {
                            [`${platform.toLowerCase()}Streak`]: 1,
                            [`last${platform}`]: now
                        },
                        update: {
                            [`${platform.toLowerCase()}Streak`]: {
                                increment: 1
                            },
                            [`last${platform}`]: now
                        }
                    }
                }
            }
        });
    }
    async getPlatformAccount(platform, platformId) {
        switch (platform) {
            case 'TELEGRAM':
                return this.prismaClient.telegramAccount.findUnique({
                    where: { platformId }
                });
            case 'DISCORD':
                return this.prismaClient.discordAccount.findUnique({
                    where: { platformId }
                });
            case 'TWITTER':
                return this.prismaClient.twitterAccount.findUnique({
                    where: { platformId }
                });
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }
    async getPointManager() {
        return this.pointManager;
    }
    async getUserStats(userId) {
        const [user, contestStats] = await Promise.all([
            this.prismaClient.user.findUnique({
                where: { id: userId },
                include: {
                    streaks: true,
                    pointTransactions: {
                        orderBy: { timestamp: 'desc' },
                        take: 10
                    },
                    contestEntries: {
                        where: {
                            contest: { status: 'ACTIVE' }
                        },
                        include: {
                            contest: true
                        }
                    }
                }
            }),
            this.pointManager.getUserContestStats(userId)
        ]);
        if (!user)
            throw new Error('User not found');
        return {
            user,
            contestStats,
            platforms: await this.getPlatformVerificationStatus(userId)
        };
    }
}
exports.UserManager = UserManager;
// Export singleton instance separately
const instance = UserManager.getInstance();
exports.default = instance;
