"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCode = verifyCode;
async function verifyCode(prisma, data) {
    const verification = await prisma.verificationCode.findUnique({
        where: { code: data.code },
        include: { user: true },
    });
    if (!verification ||
        verification.isUsed ||
        new Date() > verification.expiresAt) {
        throw new Error("Invalid or expired verification code");
    }
    // Update platform-specific fields and account
    await prisma.$transaction(async (tx) => {
        // Mark verification code as used
        await tx.verificationCode.update({
            where: { id: verification.id },
            data: { isUsed: true },
        });
        // Update user's platform username
        const platformField = `${data.platform.toLowerCase()}Username`;
        await tx.user.update({
            where: { id: verification.userId },
            data: { [platformField]: data.username },
        });
        // Create or update platform account
        const accountData = {
            userId: verification.userId,
            platformId: data.platformId,
            username: data.username,
        };
        switch (data.platform) {
            case "TELEGRAM":
                await tx.telegramAccount.upsert({
                    where: { userId: verification.userId },
                    create: accountData,
                    update: accountData,
                });
                break;
            case "DISCORD":
                await tx.discordAccount.upsert({
                    where: { userId: verification.userId },
                    create: accountData,
                    update: accountData,
                });
                break;
            case "TWITTER":
                await tx.twitterAccount.upsert({
                    where: { userId: verification.userId },
                    create: accountData,
                    update: accountData,
                });
                break;
            default:
                throw new Error(`Unsupported platform: ${data.platform}`);
        }
    });
    return { success: true };
}
