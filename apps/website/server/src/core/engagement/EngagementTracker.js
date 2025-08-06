"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngagementTracker = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const ConfigManager_1 = require("../../config/ConfigManager");
const EngagementErrors_1 = require("../errors/EngagementErrors");
const Logger_1 = require("../utils/Logger");
class EngagementTracker {
    constructor(platform) {
        this.platform = platform;
    }
    /**
     * Get the platform this tracker is configured for
     */
    getPlatform() {
        return this.platform;
    }
    async getCooldownInfo(userId, type) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get the last engagement of this type
        const lastEngagement = await prisma_1.prisma.engagement.findFirst({
            where: {
                userId,
                platform: this.platform,
                type,
            },
            orderBy: {
                timestamp: "desc",
            },
        });
        // Get count of engagements today
        const dailyCount = await prisma_1.prisma.engagement.count({
            where: {
                userId,
                platform: this.platform,
                type,
                timestamp: {
                    gte: today,
                },
            },
        });
        return lastEngagement
            ? {
                lastEngagement: lastEngagement.timestamp,
                dailyCount,
            }
            : null;
    }
    calculatePoints(type) {
        const config = ConfigManager_1.configManager.getPointsConfig()[this.platform];
        if (!config)
            return 0;
        switch (type) {
            case "MESSAGE":
                return config.MESSAGE?.points ?? 0;
            case "QUALITY_POST":
                return config.QUALITY_POST?.points ?? 0;
            case "CONVERSATION":
                return config.CONVERSATION?.points ?? 0;
            case "MENTION":
                return config.MENTION?.points ?? 0;
            case "MUSIC_SHARE":
                return config.MUSIC_SHARE?.points ?? 0;
            case "TEACHING_POST":
                return config.TEACHING_POST?.points ?? 0;
            case "DAILY_ACTIVE":
                return config.DAILY_ACTIVE?.points ?? 0;
            case "STREAK_BONUS":
                return config.STREAK_BONUS?.points ?? 0;
            case "FACT_SHARE":
                return config.FACT_SHARE?.points ?? 0;
            case "INVITE":
                return config.INVITE?.points ?? 0;
            case "VOICE_CHAT":
                return config.VOICE_CHAT?.points ?? 0;
            case "REACTION":
                return config.REACTION?.points ?? 0;
            case "TWEET":
                return config.TWEET?.points ?? 0;
            case "RETWEET":
                return config.RETWEET?.points ?? 0;
            default:
                return 0;
        }
    }
    async canEngage(userId, type, correlationId) {
        const config = ConfigManager_1.configManager.getPointsConfig()[this.platform]?.[type];
        if (!config) {
            throw new EngagementErrors_1.ValidationError(`Engagement type "${type}" is not supported on platform "${this.platform}"`, { userId, type, platform: this.platform }, correlationId);
        }
        const cooldownInfo = await this.getCooldownInfo(userId, type);
        if (!cooldownInfo)
            return; // First engagement is always allowed
        const { lastEngagement, dailyCount } = cooldownInfo;
        const now = new Date();
        // Check cooldown period
        if (config.cooldown) {
            const cooldownTime = lastEngagement.getTime() + config.cooldown * 1000;
            if (now.getTime() < cooldownTime) {
                const remainingTime = Math.ceil((cooldownTime - now.getTime()) / 1000);
                throw new EngagementErrors_1.CooldownError(this.platform, type, remainingTime, correlationId);
            }
        }
        // Check daily limit
        if (config.dailyLimit && dailyCount >= config.dailyLimit) {
            throw new EngagementErrors_1.DailyLimitError(this.platform, type, config.dailyLimit, correlationId);
        }
        // Check global daily point limit
        const todayPoints = await this.getUserDailyPoints(userId);
        const rateLimits = ConfigManager_1.configManager.getRateLimitConfig();
        if (todayPoints >= rateLimits.maxPointsPerDay) {
            throw new EngagementErrors_1.RateLimitError(userId, todayPoints, rateLimits.maxPointsPerDay, correlationId);
        }
    }
    async getUserDailyPoints(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const engagements = await prisma_1.prisma.engagement.findMany({
            where: {
                userId,
                timestamp: {
                    gte: today,
                },
            },
        });
        return engagements.reduce((total, engagement) => {
            const metadata = engagement.metadata;
            return total + (metadata?.points || 0);
        }, 0);
    }
    async trackEngagement(event, correlationId) {
        const log = Logger_1.logger.child({
            correlationId,
            operation: "trackEngagement",
            userId: event.userId,
            platform: event.platform,
            metadata: { type: event.type },
        });
        try {
            log.debug("Starting engagement tracking", { metadata: { event } });
            // Check if this type of engagement is allowed - this will throw specific errors
            await this.canEngage(event.userId, event.type, correlationId);
            const points = this.calculatePoints(event.type);
            const metadata = {
                ...event.metadata,
                points,
            };
            // Use database transaction for atomicity
            const result = await prisma_1.prisma.$transaction(async (tx) => {
                // Create engagement record
                const engagement = await tx.engagement.create({
                    data: {
                        userId: event.userId,
                        platform: event.platform,
                        type: event.type,
                        metadata,
                        timestamp: event.timestamp || new Date(),
                    },
                });
                // Update user's points and last active timestamp
                await tx.user.update({
                    where: { id: event.userId },
                    data: {
                        points: { increment: points },
                        lifetimePoints: { increment: points },
                        lastActive: new Date(),
                    },
                });
                // Create point history record
                await tx.pointHistory.create({
                    data: {
                        userId: event.userId,
                        points,
                        reason: event.type,
                        platform: this.platform,
                    },
                });
                // Create or update contest entry if there's an active contest
                const activeContest = await tx.contest.findFirst({
                    where: { status: client_1.ContestStatus.ACTIVE },
                });
                if (activeContest) {
                    await tx.contestEntry.upsert({
                        where: {
                            contestId_userId: {
                                contestId: activeContest.id,
                                userId: event.userId,
                            },
                        },
                        create: {
                            contestId: activeContest.id,
                            userId: event.userId,
                            points: points,
                            rank: null,
                        },
                        update: {
                            points: {
                                increment: points,
                            },
                        },
                    });
                }
                return engagement;
            });
            // Update streak if it's a new day (outside transaction for performance)
            await this.updateStreak(event.userId);
            log.info("Engagement tracked successfully", {
                metadata: {
                    engagementId: result.id,
                    pointsAwarded: points,
                },
            });
            return true;
        }
        catch (error) {
            if (error instanceof EngagementErrors_1.ValidationError ||
                error instanceof EngagementErrors_1.CooldownError ||
                error instanceof EngagementErrors_1.DailyLimitError ||
                error instanceof EngagementErrors_1.RateLimitError) {
                // These are expected validation errors, log as debug
                log.debug("Engagement validation failed", {
                    metadata: { error: error.message },
                });
                throw error; // Re-throw to let caller handle
            }
            else {
                // Unexpected errors
                log.error("Failed to track engagement", {
                    metadata: {
                        error: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                    },
                });
                throw new EngagementErrors_1.DatabaseTransactionError("track engagement", error instanceof Error ? error : new Error(String(error)), correlationId);
            }
        }
    }
    async getGlobalStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalUsers, activeToday, engagements, contestStats] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.count({
                where: {
                    lastActive: {
                        gte: today,
                    },
                },
            }),
            prisma_1.prisma.engagement.findMany({
                include: {
                    user: true,
                },
            }),
            prisma_1.prisma.contest.findFirst({
                where: {
                    status: "ACTIVE",
                },
                include: {
                    entries: true,
                },
            }),
        ]);
        const platformStats = {
            TELEGRAM: { activeUsers: 0, totalPoints: 0 },
            DISCORD: { activeUsers: 0, totalPoints: 0 },
            TWITTER: { activeUsers: 0, totalPoints: 0 },
        };
        const topActions = {};
        let totalPoints = 0;
        engagements.forEach((engagement) => {
            const platform = engagement.platform;
            const metadata = engagement.metadata;
            const points = metadata?.points || 0;
            platformStats[platform].totalPoints += points;
            totalPoints += points;
            if (engagement.type) {
                topActions[engagement.type] = (topActions[engagement.type] || 0) + 1;
            }
        });
        // Count unique active users per platform
        const activePlatformUsers = await prisma_1.prisma.engagement.groupBy({
            by: ["platform"],
            where: {
                timestamp: {
                    gte: today,
                },
            },
            _count: {
                _all: true,
            },
        });
        activePlatformUsers.forEach((stat) => {
            if (stat.platform in platformStats && stat._count) {
                platformStats[stat.platform].activeUsers = stat._count._all;
            }
        });
        return {
            totalUsers,
            activeToday,
            totalPoints,
            platformStats,
            topActions,
            contest: {
                currentRound: contestStats?.id || "",
                timeLeft: contestStats
                    ? this.calculateTimeLeft(contestStats.startTime)
                    : "",
                qualifiedUsers: contestStats?.entries.length || 0,
            },
        };
    }
    async getUserStats(userId) {
        const [user, engagements, streaks] = await Promise.all([
            prisma_1.prisma.user.findUnique({
                where: { id: userId },
            }),
            prisma_1.prisma.engagement.findMany({
                where: { userId },
                orderBy: { timestamp: "desc" },
                take: 50,
            }),
            prisma_1.prisma.userStreak.findUnique({
                where: { userId },
            }),
        ]);
        if (!user) {
            throw new Error("User not found");
        }
        const platformStats = {
            TELEGRAM: { points: 0, rank: 0, streak: 0 },
            DISCORD: { points: 0, rank: 0, streak: 0 },
            TWITTER: { points: 0, rank: 0, streak: 0 },
        };
        let totalPoints = 0;
        engagements.forEach((engagement) => {
            const platform = engagement.platform;
            const metadata = engagement.metadata;
            const points = metadata?.points || 0;
            platformStats[platform].points += points;
            totalPoints += points;
        });
        // Calculate ranks for each platform
        // Get overall rank
        const rank = await prisma_1.prisma.user.count({
            where: {
                engagements: {
                    some: {
                        metadata: {
                            path: ["points"],
                            gt: totalPoints,
                        },
                    },
                },
            },
        });
        return {
            userId,
            totalPoints,
            rank: rank + 1,
            platformStats,
            streaks: {
                TELEGRAM: streaks?.telegramStreak || 0,
                DISCORD: streaks?.discordStreak || 0,
                TWITTER: streaks?.twitterStreak || 0,
            },
            recentActivity: engagements.map((e) => {
                const metadata = e.metadata;
                return {
                    timestamp: e.timestamp,
                    points: metadata?.points || 0,
                    type: e.type,
                    platform: e.platform,
                    description: metadata?.description || "",
                };
            }),
        };
    }
    calculateTimeLeft(startTime) {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    async startContestRound() {
        await prisma_1.prisma.contest.create({
            data: {
                name: `Contest Round ${new Date().toISOString()}`,
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                status: "ACTIVE",
                entries: {
                    create: [],
                },
            },
        });
    }
    async endContestRound() {
        const currentRound = await prisma_1.prisma.contest.findFirst({
            where: {
                status: "ACTIVE",
            },
        });
        if (currentRound) {
            await prisma_1.prisma.contest.update({
                where: { id: currentRound.id },
                data: {
                    status: "COMPLETED",
                    endTime: new Date(),
                },
            });
        }
    }
    async trackMessage(userId, messageId, text) {
        await this.trackEngagement({
            userId,
            platform: this.platform,
            type: "MESSAGE",
            timestamp: new Date(),
            metadata: {
                messageId,
                text,
            },
        });
    }
    async trackCommand(userId, command) {
        await this.trackEngagement({
            userId,
            platform: this.platform,
            type: "COMMAND",
            timestamp: new Date(),
            metadata: {
                command,
            },
        });
    }
    async trackReaction(userId, messageId, reaction) {
        await this.trackEngagement({
            userId,
            platform: this.platform,
            type: "REACTION",
            timestamp: new Date(),
            metadata: {
                messageId,
                reaction,
            },
        });
    }
    async updateStreak(userId) {
        try {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                include: { streaks: true },
            });
            if (!user?.streaks) {
                // Create initial streak record if it doesn't exist
                await prisma_1.prisma.userStreak.create({
                    data: {
                        userId,
                        telegramStreak: 0,
                        discordStreak: 0,
                        twitterStreak: 0,
                        lastTelegram: new Date(),
                        lastDiscord: new Date(),
                        lastTwitter: new Date(),
                    },
                });
                return;
            }
            const now = new Date();
            const lastActivity = this.getLastActivityDate(user.streaks, this.platform);
            const streak = this.getCurrentStreak(user.streaks, this.platform);
            // If last activity was more than 48 hours ago, reset streak
            if (lastActivity &&
                now.getTime() - lastActivity.getTime() > 48 * 60 * 60 * 1000) {
                await this.resetStreak(userId);
                return;
            }
            // If last activity was yesterday or earlier today, increment streak
            if (!lastActivity || this.isYesterdayOrEarlierToday(lastActivity)) {
                await this.incrementStreak(userId, streak + 1);
            }
        }
        catch (error) {
            console.error(`Error updating ${this.platform} streak:`, error);
        }
    }
    getLastActivityDate(streaks, platform) {
        switch (platform) {
            case "TELEGRAM":
                return streaks.lastTelegram;
            case "DISCORD":
                return streaks.lastDiscord;
            case "TWITTER":
                return streaks.lastTwitter;
            default:
                return null;
        }
    }
    getCurrentStreak(streaks, platform) {
        switch (platform) {
            case "TELEGRAM":
                return streaks.telegramStreak;
            case "DISCORD":
                return streaks.discordStreak;
            case "TWITTER":
                return streaks.twitterStreak;
            default:
                return 0;
        }
    }
    async resetStreak(userId) {
        const updateData = {
            [`${this.platform.toLowerCase()}Streak`]: 0,
            [`last${this.platform.charAt(0)}${this.platform.slice(1).toLowerCase()}`]: new Date(),
        };
        await prisma_1.prisma.userStreak.update({
            where: { userId },
            data: updateData,
        });
    }
    async incrementStreak(userId, newStreak) {
        const updateData = {
            [`${this.platform.toLowerCase()}Streak`]: newStreak,
            [`last${this.platform.charAt(0)}${this.platform.slice(1).toLowerCase()}`]: new Date(),
        };
        await prisma_1.prisma.userStreak.update({
            where: { userId },
            data: updateData,
        });
    }
    isYesterdayOrEarlierToday(date) {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        // Set times to midnight for date comparison
        const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const yesterdayAtMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return (dateAtMidnight.getTime() === yesterdayAtMidnight.getTime() ||
            (dateAtMidnight.getTime() === todayAtMidnight.getTime() &&
                date.getTime() < now.getTime()));
    }
}
exports.EngagementTracker = EngagementTracker;
exports.default = EngagementTracker;
