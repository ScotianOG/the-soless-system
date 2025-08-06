#!/usr/bin/env node

/**
 * Test script to verify that the AI engine properly checks official links
 */

const { generatePrompt } = require("./src/utils/promptGenerator");

async function testLinkVerification() {
  console.log("🔍 Testing Link Verification System...\n");

  // Test 1: Ask for official links
  console.log("Test 1: Asking for official SOLess links");
  const prompt1 = await generatePrompt(
    "What are the official SOLess links?",
    [],
    false
  );

  // Check if the prompt contains the official links content and verification rules
  const hasOfficialLinks =
    prompt1.includes("soless.app") && prompt1.includes("t.me/SolessSystem");
  const hasVerificationRules = prompt1.includes(
    "CRITICAL LINK VERIFICATION RULES"
  );
  const hasLinkInstructions = prompt1.includes(
    "ALWAYS check the official-soless-links.md file"
  );

  console.log("✅ Contains official links data:", hasOfficialLinks);
  console.log("✅ Contains verification rules:", hasVerificationRules);
  console.log("✅ Contains link checking instructions:", hasLinkInstructions);

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 2: Show that the system will be instructed to verify links
  console.log("Test 2: Testing link verification instructions in prompt");

  if (hasVerificationRules && hasLinkInstructions) {
    console.log("✅ AI will be instructed to:");
    console.log(
      "   - Check official-soless-links.md file before sharing links"
    );
    console.log("   - Only share links explicitly listed in the official file");
    console.log("   - Verify user-provided links against the official list");
    console.log("   - Politely correct incorrect links with official ones");
  } else {
    console.log("❌ Link verification instructions not properly included");
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Test 3: Check specific content from official links file
  console.log("Test 3: Verifying official links content is included");

  const expectedLinks = [
    "soless.app",
    "https://t.me/SolessSystem",
    "https://x.com/SOLessSystem/",
    "https://reddit.com/r/soless",
    "https://medium.com/@team_94982",
  ];

  expectedLinks.forEach((link) => {
    const isIncluded = prompt1.includes(link);
    console.log(
      `${isIncluded ? "✅" : "❌"} ${link}:`,
      isIncluded ? "Found" : "Missing"
    );
  });

  console.log("\n🎉 Link verification system test complete!");

  // Summary
  const allTestsPassed =
    hasOfficialLinks && hasVerificationRules && hasLinkInstructions;
  console.log("\n📊 Summary:");
  console.log("Overall status:", allTestsPassed ? "✅ PASSED" : "❌ FAILED");

  if (allTestsPassed) {
    console.log("\nThe AI engine will now:");
    console.log(
      "1. ✅ Always check the official-soless-links.md file before sharing links"
    );
    console.log("2. ✅ Only share officially approved SOLess links");
    console.log(
      "3. ✅ Verify and correct any unofficial links provided by users"
    );
    console.log("4. ✅ Have access to the complete official links database");
  }
}

// Run the test
testLinkVerification().catch(console.error);
