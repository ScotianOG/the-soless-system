import { prisma } from "../lib/prisma";
import { ContestStatus } from "@prisma/client";

describe("Enum Test", () => {
  test("should query contest using enum", async () => {
    console.log("🧪 Testing enum in Jest environment...");

    try {
      const contest = await prisma.contest.findFirst({
        where: { status: ContestStatus.ACTIVE },
      });
      console.log("✅ Enum query worked, found contest:", contest?.id);
      expect(true).toBe(true); // Just pass the test
    } catch (error) {
      console.error("❌ Enum query failed:", error);
      throw error;
    }
  });
});
