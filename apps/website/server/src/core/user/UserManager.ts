// src/core/user/UserManager.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { Platform } from '../types/platform';
import { PointManager } from '../points/PointManager';
import VerificationManager from '../utils/VerificationManager';

export class UserManager {
    getUserPoints(id: string) {
      throw new Error("Method not implemented.");
    }
    private static instance: UserManager;
    private pointManager: PointManager;
    private verificationManager: typeof VerificationManager;
    private prismaClient: typeof prisma;

    constructor() {
        this.pointManager = PointManager.getInstance();
        this.verificationManager = VerificationManager;
        this.prismaClient = prisma;
    }

    static getInstance(): UserManager {
        if (!UserManager.instance) {
            UserManager.instance = new UserManager();
        }
        return UserManager.instance;
    }

    public setPrismaClient(client: typeof prisma) {
        this.prismaClient = client;
    }

    async getUserByPlatform(platform: Platform, platformId: string) {
        const account = await this.getPlatformAccount(platform, platformId);
        if (!account) return null;

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

    async getUserByWallet(wallet: string) {
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

    async createUser(data: {
        wallet: string;
        telegramUsername?: string;
        discordUsername?: string;
        twitterUsername?: string;
    }) {
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

    async linkPlatform(userId: string, platform: Platform, platformId: string) {
        // Generate verification code
        const code = await this.verificationManager.generateCode(userId, platform);
        return { code };
    }

    async verifyPlatform(code: string, platform: Platform, platformId: string) {
        return this.verificationManager.verifyCode(code, platform, platformId);
    }

    async getPlatformVerificationStatus(userId: string) {
        return this.verificationManager.getUserVerificationStatus(userId);
    }

    async updateActivity(userId: string, platform: Platform) {
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

    private async getPlatformAccount(platform: Platform, platformId: string) {
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

    async getPointManager(): Promise<PointManager> {
        return this.pointManager;
    }

    async getUserStats(userId: string) {
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

        if (!user) throw new Error('User not found');

        return {
            user,
            contestStats,
            platforms: await this.getPlatformVerificationStatus(userId)
        };
    }
}

// Export singleton instance separately
const instance = UserManager.getInstance();
export default instance;
