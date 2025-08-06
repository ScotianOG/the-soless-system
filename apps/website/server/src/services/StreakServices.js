"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakService = void 0;
const client_1 = require("@prisma/client");
const types_1 = require("../types");
class StreakService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!StreakService.instance) {
            StreakService.instance = new StreakService();
        }
        return StreakService.instance;
    }
    async updateStreak(wallet, platform) {
        const user = await this.prisma.user.findUnique({
            where: { wallet },
            include: { streaks: true },
        });
        if (!user)
            throw new Error("User not found");
        if (!user.streaks) {
            await this.prisma.userStreak.create({
                data: {
                    userId: user.id,
                    telegramStreak: 0,
                    discordStreak: 0,
                    twitterStreak: 0,
                },
            });
        }
        const platformName = types_1.Platform[platform].toLowerCase();
        const streakField = `${platformName}Streak`;
        const lastActivityField = `last${platformName.charAt(0).toUpperCase() + platformName.slice(1)}`;
        const now = new Date();
        const lastActivity = user.streaks?.[lastActivityField];
        let newStreak = Number(user.streaks?.[streakField] || 0);
        if (lastActivity) {
            const lastDate = new Date(lastActivity);
            const timeDiff = now.getTime() - lastDate.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            if (daysDiff > 1) {
                newStreak = 1;
            }
            else if (daysDiff === 1) {
                newStreak += 1;
                // Check for streak bonus (every 3 days)
                if (newStreak % 3 === 0) {
                    await this.prisma.$transaction([
                        // Add streak bonus points
                        this.prisma.user.update({
                            where: { id: user.id },
                            data: { points: { increment: 5 } },
                        }),
                        // Record point transaction
                        this.prisma.pointHistory.create({
                            data: {
                                userId: user.id,
                                points: 5,
                                reason: "STREAK_BONUS",
                                platform: platform.toUpperCase(),
                            },
                        }),
                    ]);
                }
            }
        }
        else {
            newStreak = 1;
        }
        const updatedStreak = await this.prisma.userStreak.update({
            where: { userId: user.id },
            data: {
                [streakField]: newStreak,
                [lastActivityField]: now,
            },
        });
        return updatedStreak;
    }
}
exports.StreakService = StreakService;
