"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationManager = void 0;
const crypto = __importStar(require("crypto"));
class VerificationManager {
    static async linkPlatformAccount(tx, userId, platform, platformId) {
        return await this.getInstance().linkPlatformAccount(tx, userId, platform, platformId);
    }
    static async generateCode(userId, platform) {
        return await this.getInstance().generateCode(userId, platform);
    }
    static async verifyCode(code, platform, platformId) {
        return await this.getInstance().verifyCode(code, platform, platformId);
    }
    static async getUserVerificationStatus(userId) {
        return await this.getInstance().getUserVerificationStatus(userId);
    }
    constructor() {
        this.codeExpiration = 30 * 60 * 1000; // 30 minutes
        this.codes = new Map();
        // PrismaClient will be set via setPrismaClient
    }
    static setPrismaClient(client) {
        this.getInstance().prismaClient = client;
    }
    static getInstance() {
        if (!VerificationManager.instance) {
            VerificationManager.instance = new VerificationManager();
        }
        return VerificationManager.instance;
    }
    async generateCode(userId, platform) {
        // Check if user already has a valid code
        const existingCode = await this.prismaClient.verificationCode.findFirst({
            where: {
                userId,
                platform,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
        });
        if (existingCode) {
            return existingCode.code;
        }
        const code = crypto.randomBytes(3).toString("hex").toUpperCase();
        await this.prismaClient.verificationCode.create({
            data: {
                code,
                userId,
                platform,
                expiresAt: new Date(Date.now() + this.codeExpiration),
                isUsed: false,
            },
        });
        this.codes.set(code, {
            wallet: userId,
            timestamp: Date.now(),
            used: false,
            platform,
        });
        this.cleanupExpiredCodes();
        return code;
    }
    async verifyCode(code, platform, platformId) {
        // Check code validity
        const dbCode = await this.prismaClient.verificationCode.findFirst({
            where: {
                code: code,
                isUsed: false,
                expiresAt: {
                    gt: new Date(), // Ensure code hasn't expired
                },
            },
        });
        if (!dbCode) {
            return {
                success: false,
                message: "Invalid or expired verification code.",
            };
        }
        // Check if platform account already exists
        const existingAccount = await this.checkExistingAccount(platform, platformId);
        if (existingAccount) {
            return {
                success: false,
                message: "This platform account is already linked to another user.",
            };
        }
        try {
            await this.prismaClient.$transaction(async (tx) => {
                // Mark code as used
                await tx.verificationCode.update({
                    where: { id: dbCode.id },
                    data: { isUsed: true },
                });
                // Create platform account
                await this.linkPlatformAccount(tx, dbCode.userId, platform, platformId);
                // Update platform username in User model
                await this.updateUserPlatformInfo(tx, dbCode.userId, platform, platformId);
            });
            // Clear from memory cache
            this.codes.delete(code);
            return { success: true };
        }
        catch (error) {
            console.error("Error verifying code:", error);
            return { success: false, message: "Error processing verification." };
        }
    }
    async checkExistingAccount(platform, platformId) {
        switch (platform) {
            case "TELEGRAM":
                return this.prismaClient.telegramAccount.findUnique({
                    where: { platformId },
                });
            case "DISCORD":
                return this.prismaClient.discordAccount.findUnique({
                    where: { platformId },
                });
            case "TWITTER":
                return this.prismaClient.twitterAccount.findUnique({
                    where: { platformId },
                });
        }
    }
    async linkPlatformAccount(tx, userId, platform, platformId) {
        const accountData = {
            userId,
            platformId,
            createdAt: new Date(),
        };
        switch (platform) {
            case "TELEGRAM":
                return tx.telegramAccount.create({ data: accountData });
            case "DISCORD":
                return tx.discordAccount.create({ data: accountData });
            case "TWITTER":
                return tx.twitterAccount.create({ data: accountData });
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }
    async updateUserPlatformInfo(tx, userId, platform, platformId) {
        const updateData = {};
        switch (platform) {
            case "TELEGRAM":
                updateData.telegramUsername = platformId;
                break;
            case "DISCORD":
                updateData.discordUsername = platformId;
                break;
            case "TWITTER":
                updateData.twitterUsername = platformId;
                break;
        }
        await tx.user.update({
            where: { id: userId },
            data: updateData,
        });
    }
    async getUserVerificationStatus(userId) {
        const verifications = await this.prismaClient.verificationCode.findMany({
            where: {
                userId,
                isUsed: false,
                expiresAt: { gt: new Date() },
            },
        });
        const status = {
            TELEGRAM: { verified: false },
            DISCORD: { verified: false },
            TWITTER: { verified: false },
        };
        for (const verification of verifications) {
            status[verification.platform] = {
                verified: false,
                code: verification.code,
                expiresAt: verification.expiresAt,
            };
        }
        // Check existing platform links
        const user = await this.prismaClient.user.findUnique({
            where: { id: userId },
            include: {
                telegramAccount: true,
                discordAccount: true,
                twitterAccount: true,
            },
        });
        if (user) {
            if (user.telegramAccount)
                status.TELEGRAM.verified = true;
            if (user.discordAccount)
                status.DISCORD.verified = true;
            if (user.twitterAccount)
                status.TWITTER.verified = true;
        }
        return status;
    }
    cleanupExpiredCodes() {
        const now = Date.now();
        Array.from(this.codes.entries()).forEach(([code, data]) => {
            if (now - data.timestamp > this.codeExpiration) {
                this.codes.delete(code);
            }
        });
    }
}
exports.VerificationManager = VerificationManager;
// Export the class instead of the instance
exports.default = VerificationManager;
