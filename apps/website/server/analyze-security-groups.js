#!/usr/bin/env node

/**
 * Check EC2 Security Group and provide targeted fix
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

async function analyzeSecurityGroups() {
  console.log("🔍 Security Group Analysis");
  console.log("==========================\n");

  console.log("📋 Available Security Groups:");
  console.log(
    "1. rds-ec2-2 (sg-0cd1b58a77b8d6565) - RDS allows EC2 with specific SGs"
  );
  console.log(
    "2. soless-sg (sg-0238d76dfeb454fa0) - Main soless security group"
  );
  console.log(
    "3. ec2-rds-1 (sg-00abbe8dae2437acb) - EC2 to connect to soless-db"
  );
  console.log(
    "4. rds-ec2-1 (sg-09e1c9381049c8384) - RDS allows EC2 with specific SGs"
  );
  console.log(
    "5. ec2-rds-2 (sg-05c8133e7f2f74274) - EC2 to connect to soless-db"
  );
  console.log(
    "6. default (sg-026cc7bc757f1bf4a) - Default VPC security group\n"
  );

  console.log("🎯 CORRECT APPROACH:");
  console.log(
    "Based on the descriptions, AWS set up security group references."
  );
  console.log('Your EC2 should have an "ec2-rds-X" security group,');
  console.log("and RDS should allow access FROM that security group.\n");

  console.log("🔧 SOLUTION - Add Security Group References:");
  console.log("\nInstead of adding IP addresses, add these rules:\n");

  console.log("📌 TO rds-ec2-1 (sg-09e1c9381049c8384):");
  console.log("   Type: PostgreSQL");
  console.log("   Protocol: TCP");
  console.log("   Port: 5432");
  console.log("   Source: sg-00abbe8dae2437acb (ec2-rds-1)");
  console.log("   Source: sg-05c8133e7f2f74274 (ec2-rds-2)");
  console.log("   Description: Allow EC2 security groups\n");

  console.log("📌 TO rds-ec2-2 (sg-0cd1b58a77b8d6565):");
  console.log("   Type: PostgreSQL");
  console.log("   Protocol: TCP");
  console.log("   Port: 5432");
  console.log("   Source: sg-00abbe8dae2437acb (ec2-rds-1)");
  console.log("   Source: sg-05c8133e7f2f74274 (ec2-rds-2)");
  console.log("   Description: Allow EC2 security groups\n");

  console.log("💡 ALTERNATIVE - Quick Test with Broad Access:");
  console.log("Add this rule to BOTH rds-ec2-1 AND rds-ec2-2:");
  console.log("   Type: PostgreSQL");
  console.log("   Protocol: TCP");
  console.log("   Port: 5432");
  console.log("   Source: 172.27.192.0/20 (your subnet)");
  console.log("   Description: Subnet access to RDS\n");

  console.log("🚨 FASTEST TEST - Temporary Open Access:");
  console.log("Add this rule to rds-ec2-1 (REMOVE AFTER TESTING):");
  console.log("   Type: PostgreSQL");
  console.log("   Protocol: TCP");
  console.log("   Port: 5432");
  console.log("   Source: 0.0.0.0/0");
  console.log("   Description: TEMPORARY - DELETE AFTER TESTING\n");

  console.log("🧪 After adding ANY of the above rules, test with:");
  console.log("node test-rds-credentials.js\n");

  // Test current connectivity
  console.log("📡 Current connectivity test:");
  try {
    const { stdout: ncTest } = await execAsync(
      `timeout 10 nc -z soless-db.cvqy6w4yoyh9.us-east-2.rds.amazonaws.com 5432 && echo "SUCCESS" || echo "FAILED"`
    );

    if (ncTest.includes("SUCCESS")) {
      console.log("✅ Port 5432 is reachable!");
    } else {
      console.log("❌ Port 5432 still blocked");
      console.log("Try the security group reference approach above");
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

if (require.main === module) {
  analyzeSecurityGroups();
}
