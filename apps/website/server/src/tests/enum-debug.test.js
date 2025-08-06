"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
describe("Enum Test", () => {
    test("should query contest using enum", async () => {
        console.log("🧪 Testing enum in Jest environment...");
        try {
            const contest = await prisma_1.prisma.contest.findFirst({
                where: { status: client_1.ContestStatus.ACTIVE },
            });
            console.log("✅ Enum query worked, found contest:", contest?.id);
            expect(true).toBe(true); // Just pass the test
        }
        catch (error) {
            console.error("❌ Enum query failed:", error);
            throw error;
        }
    });
});
