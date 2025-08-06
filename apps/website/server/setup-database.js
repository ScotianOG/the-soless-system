#!/usr/bin/env node

/**
 * Connect to default postgres database and create soless database if needed
 */

const { PrismaClient } = require("@prisma/client");

async function setupDatabase() {
  console.log("🔧 Database Setup and Connection");
  console.log("================================\n");

  // First try connecting to the default postgres database
  const postgresUrl =
    "postgresql://soless_admin:SolessAdmin2025!@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/postgres";

  console.log("📋 Step 1: Connecting to default postgres database...");

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: postgresUrl,
        },
      },
    });

    await prisma.$connect();
    console.log("✅ Connected to postgres database successfully!\n");

    // Check what databases exist
    console.log("📊 Checking existing databases...");
    const databases = await prisma.$queryRaw`
      SELECT datname as name 
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname
    `;

    console.log("Available databases:");
    databases.forEach((db) => {
      console.log(`   • ${db.name}`);
    });

    // Check if soless database exists
    const solessExists = databases.some((db) => db.name === "soless");

    if (solessExists) {
      console.log('\n✅ Database "soless" already exists!');
    } else {
      console.log('\n❌ Database "soless" does not exist');
      console.log('🔧 Creating "soless" database...');

      try {
        await prisma.$executeRawUnsafe("CREATE DATABASE soless");
        console.log('✅ Database "soless" created successfully!');
      } catch (createError) {
        console.log(`❌ Failed to create database: ${createError.message}`);
        console.log("You may need to create it manually in AWS Console");
      }
    }

    await prisma.$disconnect();

    // Now try connecting to the soless database
    console.log("\n📋 Step 2: Testing connection to soless database...");

    const solessUrl =
      "postgresql://soless_admin:SolessAdmin2025!@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless";

    const solessPrisma = new PrismaClient({
      datasources: {
        db: {
          url: solessUrl,
        },
      },
    });

    try {
      await solessPrisma.$connect();
      console.log("✅ Connected to soless database successfully!\n");

      // Check for tables
      const tables = await solessPrisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;

      console.log(`📊 Tables in soless database: ${tables.length}`);

      if (tables.length > 0) {
        console.log("Existing tables:");
        tables.forEach((table) => {
          console.log(`   • ${table.table_name}`);
        });

        // Check for your data
        if (tables.some((t) => t.table_name === "User")) {
          console.log("\n🎉 FOUND YOUR SOLESS TABLES WITH DATA!");

          const userCount = await solessPrisma.user.count();
          const contestCount = await solessPrisma.contest.count();

          console.log(`   Users: ${userCount}`);
          console.log(`   Contests: ${contestCount}`);

          if (userCount > 0) {
            const users = await solessPrisma.user.findMany({
              select: {
                username: true,
                totalPoints: true,
                telegramUserId: true,
              },
              take: 10,
            });

            console.log("\n👥 Your users:");
            users.forEach((user) => {
              console.log(`   • ${user.username}: ${user.totalPoints} points`);
            });
          }
        }
      } else {
        console.log("No tables found - this is an empty database");
        console.log(
          "You may need to run Prisma migrations to create the schema"
        );
      }

      await solessPrisma.$disconnect();

      console.log("\n✅ SUCCESS! Database setup complete.");
      console.log(`✅ WORKING DATABASE_URL: ${solessUrl}`);
    } catch (solessError) {
      console.log(
        `❌ Still cannot connect to soless database: ${solessError.message}`
      );

      if (solessError.message.includes("does not exist")) {
        console.log(
          "\n💡 The database creation may have failed or needs time to propagate"
        );
        console.log(
          "Try creating it manually in AWS Console or wait a few minutes"
        );
      }
    }
  } catch (error) {
    console.error("❌ Cannot connect to postgres database:", error.message);

    if (error.message.includes("password authentication failed")) {
      console.log("\n💡 Password authentication failed. Try:");
      console.log("1. Reset RDS master password in AWS Console");
      console.log(
        '2. Check if master username is correct (might be "postgres" not "soless_admin")'
      );
    }
  }
}

if (require.main === module) {
  setupDatabase();
}
