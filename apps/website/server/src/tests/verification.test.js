"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const VerificationService_1 = require("../services/VerificationService");
const prisma = new client_1.PrismaClient();
describe("Verification System Tests", () => {
    let verificationService;
    const TEST_USER_ID = "test-user-id";
    const TEST_PLATFORM_ID = "test-platform-id";
    beforeAll(async () => {
        verificationService = VerificationService_1.VerificationService.getInstance();
        // Create or update test user
        await prisma.user.upsert({
            where: { id: TEST_USER_ID },
            create: {
                id: TEST_USER_ID,
                wallet: "test-wallet",
                points: 0,
            },
            update: {
                wallet: "test-wallet",
                points: 0,
            },
        });
    });
    beforeEach(async () => {
        // Clean up any existing test data
        await prisma.verificationCode.deleteMany({});
        await prisma.telegramAccount.deleteMany({});
        await prisma.discordAccount.deleteMany({});
        await prisma.twitterAccount.deleteMany({});
    });
    afterAll(async () => {
        // Clean up test data
        await prisma.verificationCode.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        // Clean up test data in correct order to avoid foreign key constraints
        await prisma.userStreak.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.verificationCode.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.telegramAccount.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.discordAccount.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.twitterAccount.deleteMany({
            where: { userId: TEST_USER_ID },
        });
        await prisma.user.deleteMany({
            where: { id: TEST_USER_ID },
        });
        await prisma.$disconnect();
    });
    describe("Code Generation", () => {
        it("should generate valid verification codes", async () => {
            const code = await verificationService.generateCode(TEST_USER_ID, client_1.Platform.TELEGRAM);
            expect(code).toBeDefined();
            expect(code.length).toBe(6);
            expect(/^[0-9A-F]{6}$/.test(code)).toBeTruthy();
        });
        it("should store verification code in database", async () => {
            const code = await verificationService.generateCode(TEST_USER_ID, client_1.Platform.TELEGRAM);
            const storedCode = await prisma.verificationCode.findUnique({
                where: { code },
            });
            expect(storedCode).toBeDefined();
            expect(storedCode?.userId).toBe(TEST_USER_ID);
            expect(storedCode?.platform).toBe(client_1.Platform.TELEGRAM);
        });
        it("should set proper expiration time", async () => {
            const code = await verificationService.generateCode(TEST_USER_ID, client_1.Platform.TELEGRAM);
            const storedCode = await prisma.verificationCode.findUnique({
                where: { code },
            });
            expect(storedCode?.expiresAt).toBeDefined();
            const expirationTime = new Date(storedCode.expiresAt);
            const now = new Date();
            const diffInMinutes = (expirationTime.getTime() - now.getTime()) / (1000 * 60);
            expect(diffInMinutes).toBeGreaterThan(25); // Should be close to 30 minutes
            expect(diffInMinutes).toBeLessThan(35);
        });
    });
    describe("Code Verification", () => {
        let testCode;
        beforeEach(async () => {
            testCode = await verificationService.generateCode(TEST_USER_ID, client_1.Platform.TELEGRAM);
        });
        it("should verify valid codes", async () => {
            const result = await verificationService.verifyCode(testCode, client_1.Platform.TELEGRAM, TEST_PLATFORM_ID);
            expect(result).toBeTruthy();
        });
        it("should reject used codes", async () => {
            // Mark code as used without creating platform account
            await prisma.verificationCode.update({
                where: { code: testCode },
                data: { isUsed: true },
            });
            await expect(verificationService.verifyCode(testCode, client_1.Platform.TELEGRAM, TEST_PLATFORM_ID)).rejects.toThrow("Verification code has already been used");
        });
        it("should reject expired codes", async () => {
            // Force code to expire
            await prisma.verificationCode.update({
                where: { code: testCode },
                data: { expiresAt: new Date(Date.now() - 1000) },
            });
            await expect(verificationService.verifyCode(testCode, client_1.Platform.TELEGRAM, TEST_PLATFORM_ID)).rejects.toThrow("Verification code has expired");
        });
        it("should prevent duplicate platform accounts", async () => {
            // First user verifies their code
            await verificationService.verifyCode(testCode, client_1.Platform.TELEGRAM, TEST_PLATFORM_ID);
            // Second user tries to use same platform ID
            const secondCode = await verificationService.generateCode(TEST_USER_ID, client_1.Platform.TELEGRAM);
            await expect(verificationService.verifyCode(secondCode, client_1.Platform.TELEGRAM, TEST_PLATFORM_ID)).rejects.toThrow("TELEGRAM account already linked to another user");
        });
    });
    describe("Error Handling", () => {
        it("should handle invalid codes", async () => {
            await expect(verificationService.verifyCode("INVALID", client_1.Platform.TELEGRAM, TEST_PLATFORM_ID)).rejects.toThrow("Invalid verification code");
        });
        it("should handle invalid platforms", async () => {
            await expect(verificationService.verifyCode("123456", "INVALID", TEST_PLATFORM_ID)).rejects.toThrow("Unsupported platform");
        });
    });
});
