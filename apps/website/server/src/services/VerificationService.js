"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
// src/server/services/VerificationService.ts
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const client_2 = require("@prisma/client");
class VerificationService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!VerificationService.instance) {
            VerificationService.instance = new VerificationService();
        }
        return VerificationService.instance;
    }
    async generateCode(userId, platform) {
        const code = crypto.randomBytes(3).toString("hex").toUpperCase();
        await this.prisma.verificationCode.create({
            data: {
                code,
                userId,
                platform,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            },
        });
        return code;
    }
    async verifyCode(code, platform, platformId) {
        // Validate platform first
        switch (platform) {
            case client_2.Platform.TELEGRAM:
            case client_2.Platform.DISCORD:
            case client_2.Platform.TWITTER:
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
        const verification = await this.prisma.verificationCode.findUnique({
            where: { code },
            include: { user: true },
        });
        if (!verification) {
            throw new Error("Invalid verification code");
        }
        if (verification.isUsed) {
            throw new Error("Verification code has already been used");
        }
        if (new Date() > verification.expiresAt) {
            throw new Error("Verification code has expired");
        }
        // Check if platform account already exists
        let existingAccount = null;
        switch (platform) {
            case client_2.Platform.TELEGRAM:
                existingAccount = await this.prisma.telegramAccount.findUnique({
                    where: { platformId }
                });
                break;
            case client_2.Platform.DISCORD:
                existingAccount = await this.prisma.discordAccount.findUnique({
                    where: { platformId }
                });
                break;
            case client_2.Platform.TWITTER:
                existingAccount = await this.prisma.twitterAccount.findUnique({
                    where: { platformId }
                });
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
        if (existingAccount) {
            throw new Error(`${platform} account already linked to another user`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.verificationCode.update({
                where: { id: verification.id },
                data: { isUsed: true },
            });
            const accountData = {
                userId: verification.userId,
                platformId,
                username: null, // Will be set by platform-specific logic
            };
            switch (platform) {
                case client_2.Platform.TELEGRAM:
                    await tx.telegramAccount.create({ data: accountData });
                    break;
                case client_2.Platform.DISCORD:
                    await tx.discordAccount.create({ data: accountData });
                    break;
                case client_2.Platform.TWITTER:
                    await tx.twitterAccount.create({ data: accountData });
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
        });
        return true;
    }
}
exports.VerificationService = VerificationService;
