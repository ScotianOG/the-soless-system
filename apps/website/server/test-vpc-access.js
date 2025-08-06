#!/usr/bin/env node

/**
 * Test RDS with broader VPC access
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

async function testVPCAccess() {
  console.log("🔧 Testing RDS Access with VPC CIDR");
  console.log("====================================\n");

  const endpoint = "soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com";

  console.log("📋 Current Network Configuration:");
  try {
    // Get network info
    const { stdout: ip } = await execAsync("hostname -I");
    console.log(`   Private IP: ${ip.trim()}`);

    const { stdout: route } = await execAsync("ip route | grep default");
    console.log(`   Default Route: ${route.trim()}`);

    // Check if we're in AWS VPC
    const { stdout: vpc } = await execAsync("ip route | grep 172.27");
    if (vpc) {
      console.log(`   VPC Routes: ${vpc.trim()}`);
    }
  } catch (error) {
    console.log(`   Network info error: ${error.message}`);
  }

  console.log("\n🔍 Testing Different Security Group Configurations:");
  console.log(
    "\nIf port 5432 is still blocked, you need to add rules with these sources:"
  );
  console.log("\n📌 Option 1 - Specific IP (what we tried):");
  console.log("   Source: 172.27.206.70/32");

  console.log("\n📌 Option 2 - VPC CIDR Block (try this):");
  console.log("   Source: 172.27.0.0/16");

  console.log("\n📌 Option 3 - Broader subnet (if VPC fails):");
  console.log("   Source: 172.27.0.0/20");

  console.log("\n🧪 Testing connectivity...");

  try {
    const { stdout: ncTest } = await execAsync(
      `timeout 10 nc -z ${endpoint} 5432 && echo "SUCCESS" || echo "FAILED"`
    );

    if (ncTest.includes("SUCCESS")) {
      console.log("✅ SUCCESS! Port 5432 is now reachable!");
      console.log("\n🚀 Now run the credential test:");
      console.log("node test-rds-credentials.js");
    } else {
      console.log("❌ Still blocked. Try these steps:");
      console.log("\n1. Go to AWS Console → EC2 → Security Groups");
      console.log("2. Search for both security groups:");
      console.log("   - soless-sg (sg-0238d76dfeb454fa0)");
      console.log("   - rds-ec2-2 (sg-0cd1b58a77b8d6565)");
      console.log("\n3. For EACH security group, add this rule:");
      console.log("   Type: PostgreSQL");
      console.log("   Protocol: TCP");
      console.log("   Port: 5432");
      console.log("   Source: 172.27.0.0/16 (VPC CIDR)");
      console.log("\n4. Wait 2-3 minutes and test again");

      console.log("\n💡 Alternative: Try opening to anywhere temporarily:");
      console.log("   Source: 0.0.0.0/0 (TEMPORARILY for testing)");
      console.log("   ⚠️  Remove this rule once you connect!");
    }
  } catch (error) {
    console.log(`❌ Network test failed: ${error.message}`);
  }

  console.log("\n🔄 Testing again in 60 seconds...");
  setTimeout(async () => {
    try {
      const { stdout: retestResult } = await execAsync(
        `timeout 10 nc -z ${endpoint} 5432 && echo "SUCCESS" || echo "FAILED"`
      );
      if (retestResult.includes("SUCCESS")) {
        console.log("✅ RETEST SUCCESS! Port is now open!");
        console.log("Run: node test-rds-credentials.js");
      } else {
        console.log("❌ Still blocked after 60 seconds");
        console.log(
          "Security group configuration may need manual verification"
        );
      }
    } catch (error) {
      console.log(`Retest failed: ${error.message}`);
    }
  }, 60000);
}

if (require.main === module) {
  testVPCAccess();
}
