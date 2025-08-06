"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationCode = generateVerificationCode;
const crypto_1 = __importDefault(require("crypto"));
async function generateVerificationCode(prisma, data) {
    // Find or create user
    const user = await prisma.user.upsert({
        where: { wallet: data.wallet },
        update: {}, // No updates needed
        create: {
            wallet: data.wallet
        }
    });
    // Generate a random 6-character code
    const code = crypto_1.default.randomBytes(3).toString("hex").toUpperCase();
    // Create verification code entry
    const verification = await prisma.verificationCode.create({
        data: {
            userId: user.id,
            code,
            platform: data.platform,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            isUsed: false,
        },
    });
    // Log successful code generation
    console.log(`Generated verification code for wallet ${data.wallet} on platform ${data.platform}`);
    return { code, expiresIn: "30m" };
}
