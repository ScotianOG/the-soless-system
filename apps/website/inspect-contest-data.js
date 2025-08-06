🔍 SOLess Complete Database Inspector
====================================

🔌 Connecting to database...
✅ Connected successfully

📊 Complete Database Summary:
   • Total Users: 0
   • Total Contests: 0
   • Total Engagements: 0
   • Total Point Transactions: 0
   • Total Current Points: 0
   • Total Lifetime Points: 0


🔌 Database connection closed.#!/usr/bin/env node

/**
 * SOLess Contest Data Inspector
 *
 * This script shows you what contest data currently exists in your database
 * without making any changes.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function inspectContestData() {
  try {
    console.log("🔍 SOLess Contest Data Inspector");
    console.log("=================================\n");

    // Connect to database
    console.log("🔌 Connecting to database...");
    await prisma.$connect();
    console.log("✅ Connected successfully\n");

    // Get detailed contest statistics
    const [
      contests,
      contestEntries,
      contestRewards,
      contestQualifications,
      contestPointTransactions,
    ] = await Promise.all([
      prisma.contest.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          _count: {
            select: {
              entries: true,
              rewards: true,
              qualifications: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.contestEntry.count(),
      prisma.contestReward.count(),
      prisma.contestQualification.count(),
      prisma.pointTransaction.count({ where: { contestId: { not: null } } }),
    ]);

    // Summary stats
    console.log("📊 Contest Data Summary:");
    console.log(`   • Total Contests: ${contests.length}`);
    console.log(`   • Total Contest Entries: ${contestEntries}`);
    console.log(`   • Total Contest Rewards: ${contestRewards}`);
    console.log(`   • Total Contest Qualifications: ${contestQualifications}`);
    console.log(`   • Contest Point Transactions: ${contestPointTransactions}`);

    const totalRecords =
      contests.length +
      contestEntries +
      contestRewards +
      contestQualifications +
      contestPointTransactions;
    console.log(`   • TOTAL CONTEST RECORDS: ${totalRecords}\n`);

    if (contests.length === 0) {
      console.log("🎉 No contests found in the database!");
      console.log("Your contest database is already clean.\n");
    } else {
      console.log("📋 Contest Details:");
      console.log("-------------------");

      contests.forEach((contest, index) => {
        const createdDate = new Date(contest.createdAt).toLocaleDateString();
        const startDate = new Date(contest.startTime).toLocaleDateString();
        const endDate = new Date(contest.endTime).toLocaleDateString();

        console.log(`${index + 1}. ${contest.name || "Unnamed Contest"}`);
        console.log(`   ID: ${contest.id}`);
        console.log(`   Status: ${contest.status}`);
        console.log(`   Created: ${createdDate}`);
        console.log(`   Duration: ${startDate} → ${endDate}`);
        console.log(`   Entries: ${contest._count.entries}`);
        console.log(`   Rewards: ${contest._count.rewards}`);
        console.log(`   Qualifications: ${contest._count.qualifications}`);
        console.log("");
      });
    }

    // Check for active contests
    const activeContests = contests.filter((c) => c.status === "ACTIVE");
    if (activeContests.length > 0) {
      console.log("⚠️  Active Contests Found:");
      activeContests.forEach((contest) => {
        console.log(`   • ${contest.name || "Unnamed"} (${contest.id})`);
      });
      console.log("");
    }

    // Show database health
    const [userCount, totalUserPoints] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({
        _sum: { points: true, lifetimePoints: true },
      }),
    ]);

    console.log("💾 Database Health:");
    console.log(`   • Total Users: ${userCount}`);
    console.log(
      `   • Total Current Points: ${totalUserPoints._sum.points || 0}`
    );
    console.log(
      `   • Total Lifetime Points: ${totalUserPoints._sum.lifetimePoints || 0}`
    );
  } catch (error) {
    console.error("❌ Error inspecting contest data:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed.");
  }
}

if (require.main === module) {
  inspectContestData();
}

module.exports = { inspectContestData };
