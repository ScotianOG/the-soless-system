// Test script for chatbot integration
const fetch = require("node-fetch");
const readline = require("readline");

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Read environment variable or use default
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:3000";

console.log(`Testing chatbot integration with AI Engine at: ${AI_ENGINE_URL}`);
console.log("This script will test the direct connection to the AI Engine\n");

// Test AI Engine connectivity
async function testAIEngine() {
  try {
    const response = await fetch(`${AI_ENGINE_URL}/api/status`);
    if (response.ok) {
      const data = await response.json();
      console.log("✅ AI Engine connection successful!");
      console.log("Status:", data);

      // Check available providers
      if (data.providers) {
        console.log("\nAvailable LLM providers:");
        data.providers.forEach((provider) => {
          console.log(
            `- ${provider}${
              provider === data.activeProvider ? " (active)" : ""
            }`
          );
        });
      }

      return true;
    } else {
      console.error(
        "❌ AI Engine connection failed with status:",
        response.status
      );
      return false;
    }
  } catch (error) {
    console.error("❌ AI Engine connection error:", error.message);
    console.log(
      "Make sure the AI Engine is running and accessible at",
      AI_ENGINE_URL
    );
    return false;
  }
}

// Test conversation creation
async function createConversation() {
  try {
    const response = await fetch(`${AI_ENGINE_URL}/api/conversations`, {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Conversation created successfully!");
      return data.conversationId;
    } else {
      console.error("❌ Failed to create conversation:", response.status);
      return null;
    }
  } catch (error) {
    console.error("❌ Error creating conversation:", error.message);
    return null;
  }
}

// Send a message to the AI
async function sendMessage(conversationId, message) {
  try {
    const response = await fetch(
      `${AI_ENGINE_URL}/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("\nSoulie:", data.message);
      return true;
    } else {
      console.error("❌ Failed to send message:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending message:", error.message);
    return false;
  }
}

// Interactive chat test
async function runChatTest() {
  console.log("\nStarting interactive chat test...");

  const connectionSuccess = await testAIEngine();
  if (!connectionSuccess) {
    console.log("Cannot continue with the test due to connection failure.");
    rl.close();
    return;
  }

  const conversationId = await createConversation();
  if (!conversationId) {
    console.log(
      "Cannot continue with the test due to conversation creation failure."
    );
    rl.close();
    return;
  }

  console.log(
    '\nConversation started! Type a message to talk to Soulie (or "exit" to quit)'
  );

  const askQuestion = () => {
    rl.question("\nYou: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log("Ending conversation. Goodbye!");
        rl.close();
        return;
      }

      const success = await sendMessage(conversationId, input);
      if (success) {
        askQuestion();
      } else {
        console.log("Failed to get a response. Ending test.");
        rl.close();
      }
    });
  };

  askQuestion();
}

// Run the test
runChatTest();
