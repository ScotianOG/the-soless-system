// src/telegramBot.js
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Check for required environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = process.env.API_URL || "http://localhost:3000/api"; // Use env var or fallback to localhost

if (!TELEGRAM_BOT_TOKEN) {
  console.error(
    "TELEGRAM_BOT_TOKEN is required. Please add it to your .env file."
  );
  process.exit(1);
}

console.log("Starting SOLess Project Bot...");

// Initialize bot with privacy mode disabled
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// Function to sanitize markdown to prevent parsing errors
function sanitizeMarkdown(text) {
  if (!text) return text;

  // Ensure all markdown elements are properly closed
  let sanitized = text;

  // Handle unclosed bold/italic formatting
  const boldStarCount = (sanitized.match(/\*/g) || []).length;
  if (boldStarCount % 2 !== 0) {
    // Odd number of stars, add one at the end
    sanitized += "*";
  }

  const underscoreCount = (sanitized.match(/_/g) || []).length;
  if (underscoreCount % 2 !== 0) {
    // Odd number of underscores, add one at the end
    sanitized += "_";
  }

  // Ensure there are no broken links
  // Find any [text]( without closing )
  sanitized = sanitized.replace(/\[([^\]]+)\]\([^\)]*$/g, "$1");

  // Find any [text without closing ]( pair
  sanitized = sanitized.replace(/\[([^\]]+)$/g, "$1");

  // Handle backticks (code blocks)
  const backtickCount = (sanitized.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    // Odd number of backticks, add one at the end
    sanitized += "`";
  }

  return sanitized;
}

// Function to completely strip markdown for fallback
function stripMarkdown(text) {
  if (!text) return text;

  // Remove bold/italic formatting
  let plainText = text.replace(/\*\*(.+?)\*\*/g, "$1"); // Bold
  plainText = plainText.replace(/\*(.+?)\*/g, "$1"); // Italic with *
  plainText = plainText.replace(/_(.+?)_/g, "$1"); // Italic with _

  // Remove links, preserving the text
  plainText = plainText.replace(/\[(.+?)\]\(.+?\)/g, "$1");

  // Remove code blocks, preserving the code
  plainText = plainText.replace(/`(.+?)`/g, "$1");

  return plainText;
}

// Log when the bot is added to or removed from a chat
bot.on("my_chat_member", (chatMember) => {
  console.log("Bot status changed in a chat:", JSON.stringify(chatMember));
  if (
    chatMember.new_chat_member &&
    chatMember.new_chat_member.status === "member"
  ) {
    console.log(
      `Bot was added to chat: ${chatMember.chat.title || chatMember.chat.id}`
    );
  }
});

// Store active conversations
const conversations = new Map();

// Welcome message
const WELCOME_MESSAGE = `
*Welcome to the SOLess Project Bot!*

I'm here to answer your questions about the SOLess project on Solana.

How can I help you today?
`;

// Start command handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Create a new conversation
    const response = await axios.post(`${API_URL}/conversations`);
    const conversationId = response.data.conversationId;

    // Store the conversation
    conversations.set(chatId, conversationId);

    // Send welcome message
    await bot.sendMessage(chatId, WELCOME_MESSAGE, { parse_mode: "Markdown" });

    console.log(`New conversation started: ${chatId} -> ${conversationId}`);
  } catch (error) {
    console.error("Error starting conversation:", error.message);
    await bot.sendMessage(
      chatId,
      "Sorry, I'm having trouble connecting. Please try again later.",
      { parse_mode: "Markdown" }
    );
  }
});

// Helper function to split long messages
async function sendSplitMessage(chatId, messageText, parseMode = "Markdown") {
  // Telegram message limit is 4096 characters
  const MAX_MESSAGE_LENGTH = 4000; // Slightly less than the limit for safety

  // First, attempt to sanitize any potentially problematic markdown
  // This helps prevent incomplete formatting tags that cause parsing errors
  messageText = sanitizeMarkdown(messageText);

  if (messageText.length <= MAX_MESSAGE_LENGTH) {
    // Message is within limits, send it normally
    try {
      return await bot.sendMessage(chatId, messageText, {
        parse_mode: parseMode,
      });
    } catch (err) {
      console.error(
        "Error sending message with markdown, retrying without formatting:",
        err.message
      );
      // If markdown parsing fails, send without markdown
      return await bot.sendMessage(chatId, stripMarkdown(messageText), {
        parse_mode: "",
      });
    }
  }

  // Split long message into chunks
  let messages = [];
  let position = 0;

  while (position < messageText.length) {
    let chunk = messageText.substring(position, position + MAX_MESSAGE_LENGTH);

    // Try to split at a paragraph or sentence if possible
    if (position + MAX_MESSAGE_LENGTH < messageText.length) {
      // Look for paragraph breaks first
      const paragraphBreak = chunk.lastIndexOf("\n\n");
      if (paragraphBreak > MAX_MESSAGE_LENGTH / 2) {
        chunk = chunk.substring(0, paragraphBreak);
        position += paragraphBreak + 2; // +2 for the newlines
      } else {
        // Try to split at sentence end
        const sentenceEnd = Math.max(
          chunk.lastIndexOf(". "),
          chunk.lastIndexOf("! "),
          chunk.lastIndexOf("? ")
        );

        if (sentenceEnd > MAX_MESSAGE_LENGTH / 2) {
          chunk = chunk.substring(0, sentenceEnd + 1); // Include the period
          position += sentenceEnd + 1;
        } else {
          // If no good break found, just use the chunk as is
          position += MAX_MESSAGE_LENGTH;
        }
      }
    } else {
      position += chunk.length;
    }

    // Add chunk indicator if sending multiple messages
    let messageWithHeader = chunk;
    if (messageText.length > MAX_MESSAGE_LENGTH) {
      const partNumber = messages.length + 1;
      messageWithHeader = chunk;
    }

    try {
      await bot.sendChatAction(chatId, "typing");
      await bot.sendMessage(chatId, messageWithHeader, {
        parse_mode: parseMode,
      });
      // Short delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      console.error("Error sending message chunk:", err);
      // If Markdown parsing fails, try sending without markdown
      if (
        err.message.includes("can't parse entities") ||
        err.message.includes("Bad Request")
      ) {
        console.log("Sending without markdown due to parsing error");
        await bot.sendMessage(chatId, stripMarkdown(messageWithHeader), {
          parse_mode: "",
        });
      }
    }

    messages.push(messageWithHeader);
  }

  return { messages };
}

// Add ELI5 command
bot.onText(/\/eli5/, async (msg) => {
  const chatId = msg.chat.id;
  const eli5Message = `
*Explain Like I'm 5 Mode Activated! 🧸*

I'll now explain things in super simple terms like you're 5 years old!

Just ask me your question after this message, and I'll respond with a child-friendly explanation.

You can turn off this mode by typing /normal
`;

  // Store the ELI5 mode in conversation metadata
  let conversationId = conversations.get(chatId);
  if (conversationId) {
    try {
      await axios.post(`${API_URL}/conversations/${conversationId}/metadata`, {
        key: "eli5Mode",
        value: true,
      });
    } catch (error) {
      console.error("Error setting ELI5 mode:", error.message);
    }
  }

  await bot.sendMessage(chatId, eli5Message, { parse_mode: "Markdown" });
});

// Add normal mode command
bot.onText(/\/normal/, async (msg) => {
  const chatId = msg.chat.id;
  const normalMessage = `
*Normal Mode Activated! 👨‍💻*

I'll now explain things normally again.
`;

  // Turn off ELI5 mode in conversation metadata
  let conversationId = conversations.get(chatId);
  if (conversationId) {
    try {
      await axios.post(`${API_URL}/conversations/${conversationId}/metadata`, {
        key: "eli5Mode",
        value: false,
      });
    } catch (error) {
      console.error("Error setting normal mode:", error.message);
    }
  }

  await bot.sendMessage(chatId, normalMessage, { parse_mode: "Markdown" });
});

// Handle all text messages
bot.on("message", async (msg) => {
  // Skip if not text or is a command
  if (!msg.text || msg.text.startsWith("/")) return;

  // Log detailed message info for debugging
  console.log(
    "Received message:",
    JSON.stringify(
      {
        message_id: msg.message_id,
        from: msg.from
          ? { id: msg.from.id, username: msg.from.username }
          : null,
        chat: { id: msg.chat.id, type: msg.chat.type, title: msg.chat.title },
        text: msg.text.substring(0, 20) + (msg.text.length > 20 ? "..." : ""),
        reply_to_message: msg.reply_to_message
          ? {
              message_id: msg.reply_to_message.message_id,
              from: msg.reply_to_message.from
                ? {
                    id: msg.reply_to_message.from.id,
                    username: msg.reply_to_message.from.username,
                  }
                : null,
            }
          : null,
      },
      null,
      2
    )
  );

  const chatId = msg.chat.id;
  let userMessage = msg.text;

  // Check if this is a group chat and the message is mentioning the bot
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  const botInfo = await bot.getMe();
  const botUsername = botInfo.username;

  // Debug detailed bot info
  console.log("Bot Info:", JSON.stringify(botInfo, null, 2));

  // Check for bot mentions in multiple formats (including name "Soulie")
  const isMentionedWithAt = userMessage
    .toLowerCase()
    .includes(`@${botUsername.toLowerCase()}`);
  const isMentionedWithoutAt = userMessage
    .toLowerCase()
    .includes(botUsername.toLowerCase());
  const isMentionedBySoulie = userMessage.toLowerCase().includes("soulie");
  const botMentioned =
    isMentionedWithAt || isMentionedWithoutAt || isMentionedBySoulie;

  // Alternative check - exact username or name matching
  const exactUsername = `@${botUsername.toLowerCase()}`;
  const exactSoulie = "soulie";
  const messageWords = userMessage.toLowerCase().split(/\s+/);
  const hasExactUsername = messageWords.includes(exactUsername);
  const hasExactSoulie = messageWords.includes(exactSoulie);

  // Debug logging
  console.log(`Message received in ${isGroup ? "group" : "private"} chat`);
  console.log(`Bot username: ${botUsername}`);
  console.log(`Bot mentioned with @: ${isMentionedWithAt}`);
  console.log(`Bot mentioned without @: ${isMentionedWithoutAt}`);
  console.log(`Bot mentioned as Soulie: ${isMentionedBySoulie}`);
  console.log(`Has exact username: ${hasExactUsername}`);
  console.log(`Has exact Soulie: ${hasExactSoulie}`);

  // In groups, only respond if the bot is mentioned or message is a reply to the bot
  if (isGroup) {
    // Check if it's a reply to a bot message
    let isReplyToBot = false;

    if (msg.reply_to_message && msg.reply_to_message.from) {
      isReplyToBot = msg.reply_to_message.from.id === botInfo.id;
      console.log(
        `Reply to message from user ID: ${msg.reply_to_message.from.id}`
      );
      console.log(`Bot ID: ${botInfo.id}`);
    }

    console.log(`Is reply to bot: ${isReplyToBot}`);

    // Only process if mentioned (by username or "Soulie") or it's a reply to the bot
    if (
      !botMentioned &&
      !isReplyToBot &&
      !hasExactUsername &&
      !hasExactSoulie
    ) {
      console.log("Skipping group message - not mentioned or replied to");
      return;
    }

    // Remove the bot mention from the message if present
    if (isMentionedWithAt) {
      userMessage = userMessage
        .replace(new RegExp(`@${botUsername}`, "i"), "")
        .trim();
    } else if (isMentionedWithoutAt && !isMentionedWithAt) {
      // Only replace without @ if there's no @username (to avoid double replacement)
      userMessage = userMessage
        .replace(new RegExp(botUsername, "i"), "")
        .trim();
    }

    // Remove "Soulie" from the message if it was used to mention the bot
    if (isMentionedBySoulie) {
      userMessage = userMessage.replace(/soulie/i, "").trim();
    }

    console.log(
      `Group message being processed from ${
        msg.from.username || msg.from.id
      }: "${userMessage}"`
    );
  }

  // Check for ELI5 keywords in message
  const hasEli5Keyword =
    /explain\s+like\s+(i['']?m|i\s+am|to)\s+(a\s+)?5(\s+year\s+old)?/i.test(
      userMessage
    ) || /eli5/i.test(userMessage);

  if (hasEli5Keyword) {
    // Remove the ELI5 trigger from the message
    userMessage = userMessage
      .replace(
        /explain\s+like\s+(i['']?m|i\s+am|to)\s+(a\s+)?5(\s+year\s+old)?/i,
        ""
      )
      .replace(/eli5/i, "")
      .trim();

    // If the message is empty after removing the trigger, ask for a question
    if (!userMessage) {
      await bot.sendMessage(
        chatId,
        "What would you like me to explain in simple terms?",
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Set ELI5 mode for this message
    let conversationId = conversations.get(chatId);
    if (conversationId) {
      try {
        await axios.post(
          `${API_URL}/conversations/${conversationId}/metadata`,
          {
            key: "eli5Mode",
            value: true,
          }
        );

        // Reset to normal mode after this message (for a one-time ELI5)
        setTimeout(async () => {
          try {
            await axios.post(
              `${API_URL}/conversations/${conversationId}/metadata`,
              {
                key: "eli5Mode",
                value: false,
              }
            );
          } catch (error) {
            console.error("Error resetting ELI5 mode:", error.message);
          }
        }, 1000);
      } catch (error) {
        console.error("Error setting one-time ELI5 mode:", error.message);
      }
    }
  }

  // Get conversation ID or create new one
  let conversationId = conversations.get(chatId);
  if (!conversationId) {
    try {
      const response = await axios.post(`${API_URL}/conversations`);
      conversationId = response.data.conversationId;
      conversations.set(chatId, conversationId);
    } catch (error) {
      console.error("Error creating conversation:", error.message);
      await sendSplitMessage(
        chatId,
        "Sorry, I'm having trouble connecting. Please try again later."
      );
      return;
    }
  }

  try {
    // Show typing indicator
    bot.sendChatAction(chatId, "typing");

    // Send message to API
    const response = await axios.post(
      `${API_URL}/conversations/${conversationId}/messages`,
      { message: userMessage }
    );

    // Get response
    const { message } = response.data;

    // Send message using the split function
    await sendSplitMessage(chatId, message);

    console.log(`Message processed for ${chatId}`);
  } catch (error) {
    console.error("Error processing message:", error.message);
    await sendSplitMessage(
      chatId,
      "Sorry, I couldn't process your message. Please try again later."
    );
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const botInfo = await bot.getMe();
  const botUsername = botInfo.username;

  const helpMessage = `
*SOLess Project Bot Help*

I can answer your questions about the SOLess project on Solana.

Commands:
/start - Start or restart our conversation
/help - Show this help message
/about - Learn about the SOLess project
/eli5 - Switch to "Explain Like I'm 5" mode (simple explanations for kids)
/normal - Switch back to normal explanation mode

Ways to address me in group chats:
- @${botUsername} (my username)
- Soulie (my name)
- Reply to one of my messages

Special phrases:
"eli5" or "explain like I'm 5 [question]" - One-time simple explanation

Just ask me anything about SOLess!
`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
});

// About command
bot.onText(/\/about/, async (msg) => {
  const chatId = msg.chat.id;
  const aboutMessage = `
*About SOLess Project*

SOLess is [brief description of your project].

[Include a short paragraph about your project's main features]

For more information, visit [your website or resources].
`;

  await bot.sendMessage(chatId, aboutMessage, { parse_mode: "Markdown" });
});

console.log("SOLess Project Bot is running...");

// Export the bot for standalone or integrated usage
module.exports = bot;
