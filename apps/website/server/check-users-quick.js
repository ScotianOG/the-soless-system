const { PrismaClient } = require("@prisma/client");

async function checkUsers() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://soless_admin:SolessAdmin2025!@soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com:5432/soless-db",
      },
    },
  });

  try {
    const users = await prisma.user.findMany();
    console.log("\n=== USERS IN DATABASE ===");
    users.forEach((user) => {
      console.log(`Wallet: ${user.wallet}`);
      console.log(`Telegram: ${user.telegramUsername || "None"}`);
      console.log(`Points: ${user.points} | Lifetime: ${user.lifetimePoints}`);
      console.log("---");
    });
    console.log(`Total users: ${users.length}\n`);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
