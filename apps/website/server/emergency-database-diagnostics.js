#!/usr/bin/env node

/**
 * EMERGENCY Database Connection Diagnostics
 *
 * This script helps diagnose database connection and data issues
 */

const { PrismaClient } = require("@prisma/client");

async function emergencyDiagnostics() {
  console.log("🚨 EMERGENCY DATABASE DIAGNOSTICS");
  console.log("==================================\n");

  try {
    // Check environment variables
    console.log("📋 Environment Check:");
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
    console.log(
      `   DATABASE_URL exists: ${process.env.DATABASE_URL ? "YES" : "NO"}`
    );
    if (process.env.DATABASE_URL) {
      // Mask password for security
      const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":***@");
      console.log(`   DATABASE_URL: ${maskedUrl}`);
    }
    console.log("");

    // Try to connect with different clients
    const prisma = new PrismaClient();

    console.log("🔌 Database Connection Test:");
    await prisma.$connect();
    console.log("✅ Prisma connected successfully\n");

    // Check database name and host
    console.log("🏢 Database Information:");
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        version() as postgres_version
    `;

    console.log(`   Database Name: ${dbInfo[0].database_name}`);
    console.log(`   Server IP: ${dbInfo[0].server_ip || "localhost"}`);
    console.log(`   Server Port: ${dbInfo[0].server_port}`);
    console.log(
      `   PostgreSQL Version: ${dbInfo[0].postgres_version.split(" ")[0]}`
    );
    console.log("");

    // Check if tables exist
    console.log("📊 Schema Check:");
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`   Tables found: ${tables.length}`);
    tables.forEach((table) => {
      console.log(`     • ${table.table_name}`);
    });
    console.log("");

    // Check for specific critical tables
    const criticalTables = [
      "User",
      "Contest",
      "Engagement",
      "PointTransaction",
    ];
    console.log("🔍 Critical Tables Check:");

    for (const tableName of criticalTables) {
      try {
        const count = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        `;
        const exists = count[0].count > 0;
        console.log(`   ${tableName}: ${exists ? "✅ EXISTS" : "❌ MISSING"}`);

        if (exists) {
          // Check row count
          const rowCount = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          console.log(`     └─ Rows: ${rowCount[0].count}`);
        }
      } catch (error) {
        console.log(`   ${tableName}: ❌ ERROR - ${error.message}`);
      }
    }
    console.log("");

    // Check for recent backups or migrations
    console.log("🔄 Migration History:");
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, started_at, finished_at 
        FROM "_prisma_migrations" 
        ORDER BY started_at DESC 
        LIMIT 5
      `;

      if (migrations.length > 0) {
        console.log("   Recent migrations:");
        migrations.forEach((migration) => {
          const startTime = new Date(migration.started_at).toLocaleString();
          const finishTime = migration.finished_at
            ? new Date(migration.finished_at).toLocaleString()
            : "INCOMPLETE";
          console.log(`     • ${migration.migration_name}`);
          console.log(`       Started: ${startTime}`);
          console.log(`       Finished: ${finishTime}`);
        });
      } else {
        console.log("   No migration history found");
      }
    } catch (error) {
      console.log(`   Migration table check failed: ${error.message}`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("❌ CRITICAL ERROR:", error);
    console.error(
      "\nThis indicates a serious database connection or configuration problem!"
    );
  }
}

if (require.main === module) {
  emergencyDiagnostics();
}

module.exports = { emergencyDiagnostics };
