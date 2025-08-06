// Quick bot test script
const axios = require("axios");

async function testBotAPI() {
  console.log("🤖 Testing Bot API Integration...\n");

  try {
    // Test 1: Create conversation
    console.log("Test 1: Creating AI conversation...");
    const convResponse = await axios.post(
      "http://localhost:3000/api/conversations"
    );
    console.log("✅ Conversation created:", convResponse.data.conversationId);

    // Test 2: Send message
    console.log("\nTest 2: Sending test message...");
    const msgResponse = await axios.post(
      `http://localhost:3000/api/conversations/${convResponse.data.conversationId}/messages`,
      { message: "What is SOLess?" }
    );
    console.log(
      "✅ AI Response received (first 100 chars):",
      msgResponse.data.message.substring(0, 100) + "..."
    );

    // Test 3: Test ELI5 mode
    console.log("\nTest 3: Setting ELI5 mode...");
    await axios.post(
      `http://localhost:3000/api/conversations/${convResponse.data.conversationId}/metadata`,
      { key: "eli5Mode", value: true }
    );
    console.log("✅ ELI5 mode set successfully");

    console.log(
      "\n🎉 All API tests passed! Bot integration is working correctly.\n"
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

testBotAPI();
