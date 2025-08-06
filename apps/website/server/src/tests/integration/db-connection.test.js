"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple database connection test
const client_1 = require("@prisma/client");
describe("Database Connection Test", () => {
    let prisma;
    beforeAll(async () => {
        prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL ||
                        "postgresql://ScotianOG:Orson2024@localhost:5432/test_db",
                },
            },
        });
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("should connect to the database successfully", async () => {
        const result = await prisma.$queryRaw `SELECT 1 as test`;
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
    });
    it("should be able to query users table", async () => {
        const userCount = await prisma.user.count();
        expect(typeof userCount).toBe("number");
    });
});
