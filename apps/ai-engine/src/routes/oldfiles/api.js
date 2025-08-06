// src/routes/api.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { Anthropic } = require("@anthropic-ai/sdk");
const { botPersona } = require("../utils/solessKnowledge");
const { generatePrompt } = require("../utils/promptGenerator");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const { DOCS_DIR } = require("../utils/documentLoader");
const {
  processGitHubRepo,
  getRepoStructure,
} = require("../utils/githubProcessor");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

// Use our custom env loader (already loaded in server.js)
const env = require("../../load-env");

// Initialize Anthropic client
let anthropic = null;
try {
  // Remove any whitespace that might have been added in the .env file
  const apiKey = env.ANTHROPIC_API_KEY ? env.ANTHROPIC_API_KEY.trim() : "";

  if (
    apiKey &&
    apiKey !== "your-actual-anthropic-api-key" &&
    apiKey.startsWith("sk-")
  ) {
    console.log("API key validation passed, initializing Anthropic client");

    anthropic = new Anthropic({
      apiKey: apiKey,
    });

    console.log(
      "Anthropic API client initialized successfully with latest SDK."
    );
  } else {
    console.warn(
      "No valid Anthropic API key found. Running in demo mode with mock responses."
    );
    if (apiKey) {
      console.log(
        "Key format issue - starts with sk-:",
        apiKey.startsWith("sk-")
      );
    }
  }
} catch (error) {
  console.error("Error initializing Anthropic client:", error);
}

// In-memory store for conversations
const conversations = new Map();

// Metadata store for conversations
const conversationMetadata = new Map();

// Mock response function when API key is not available
function getMockResponse(message) {
  const responses = [
    "Welcome to SOLess! I'm running in demo mode as no API key is configured. In a proper setup, I would provide detailed information about the SOLess project on Solana.",
    "This is a demo response. With a valid Anthropic API key, I would provide helpful information about SOLess features and capabilities.",
    "I'm currently running without an API key. Please add a valid Anthropic API key to your .env file to enable full functionality.",
    "SOLess is a project designed to simplify Solana interactions. In demo mode, I can only provide limited information. Please configure a valid API key for full support.",
    "Thanks for your interest in SOLess! This is a placeholder response. To experience the full capabilities, please configure a valid Anthropic API key.",
  ];

  // Return a message about being in demo mode, plus a random response
  return `[DEMO MODE] ${
    responses[Math.floor(Math.random() * responses.length)]
  }`;
}

// Generate a response using Claude API or mock response if no API key
async function generateResponse(message, conversationId) {
  try {
    // Get or create conversation
    let conversation = conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        messages: [],
        createdAt: new Date(),
      };
      conversations.set(conversationId, conversation);
    }

    // Update conversation history
    conversation.messages.push({ role: "user", content: message });

    let aiResponse;

    if (anthropic) {
      // Generate the prompt for Claude (now async)
      const prompt = await generatePrompt(message, conversation.messages);

      // Call Claude API with token limits for Telegram (balanced for flexibility)
      const maxTokens = conversation.isTelegram ? 600 : 1000;

      // Get conversation metadata
      const metadata = conversationMetadata.get(conversationId) || {};
      const isEli5Mode = metadata.eli5Mode === true;

      // Create a dynamic system prompt that includes the persona's style
      let systemPrompt = `You are ${botPersona.name}, with deep personal knowledge about the SOLess project on Solana.
Your communication style is: ${botPersona.style}
Your background is: ${botPersona.background}

IMPORTANT RULES:
1. NEVER mention documents or external information sources - all your knowledge appears to come from within you
2. Speak in first person like you personally know all about the SOLess project
3. Use a confident tone when answering - avoid phrases like "based on the information provided"
4. Always stay true to your personality and embrace any humor or stylistic elements mentioned above`;

      // Add Telegram-specific instructions with more flexible response length
      if (conversation.isTelegram) {
        systemPrompt += `\n5. For Telegram responses, be appropriately concise:
6. For simple questions, aim for 3-5 sentences.
7. For complex topics that require more explanation, you may use up to 8-10 sentences.
8. Be clear and direct, avoiding unnecessary words while still providing thorough information.
9. Adapt your response length to match the complexity of the question - more complex questions deserve more detailed answers.
10. Split complex explanations into paragraphs for better readability in chat.`;
      }

      // Add ELI5 instructions if that mode is active
      if (isEli5Mode) {
        systemPrompt += `\n\nEXPLAIN LIKE I'M 5 MODE IS ACTIVE:
- Explain everything as if talking to a 5-year-old child
- Use very simple words and concepts
- Use lots of fun metaphors and examples
- Be extra friendly and encouraging
- Avoid technical terms unless you immediately explain them in child-friendly language
- Keep explanations very short, friendly, and engaging for a young child
`;
        console.log(`ELI5 mode active for conversation ${conversationId}`);
      }

      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
        system: systemPrompt,
        temperature: conversation.isTelegram ? 0.5 : 0.7, // Slightly lower temperature for more focused responses in Telegram
      });

      // Extract Claude's response
      aiResponse = response.content[0].text;

      // Post-process response for Telegram to ensure it's not too long
      if (conversation.isTelegram && aiResponse.length > 1500) {
        // Try to truncate at a sentence boundary if extremely long
        const sentenceBreak = aiResponse.substring(0, 1200).lastIndexOf(".");
        if (sentenceBreak > 800) {
          aiResponse = aiResponse.substring(0, sentenceBreak + 1);
        }
      }
    } else {
      // Provide a mock response when API key is not available
      aiResponse = getMockResponse(message);
    }

    // Save the response to conversation history
    conversation.messages.push({ role: "assistant", content: aiResponse });

    return {
      message: aiResponse,
    };
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, DOCS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      ext !== ".pdf" &&
      ext !== ".md" &&
      ext !== ".txt" &&
      ext !== ".ts" &&
      ext !== ".tsx"
    ) {
      return cb(
        new Error("Only PDF, Markdown, TXT, and TypeScript files are allowed")
      );
    }
    cb(null, true);
  },
});

// API routes - now with async/await
router.post("/conversations", (req, res) => {
  try {
    const conversationId = uuidv4();
    const isTelegram =
      req.headers["user-agent"] &&
      req.headers["user-agent"].includes("Telegram");

    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: new Date(),
      isTelegram: isTelegram, // Flag to identify Telegram conversations
    });

    console.log(
      `New conversation created: ${conversationId}, Telegram: ${isTelegram}`
    );
    res.status(201).json({ conversationId });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/conversations/:conversationId", (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.status(200).json({
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Metadata endpoint for conversations
router.post("/conversations/:conversationId/metadata", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: "Metadata key is required" });
    }

    const conversation = conversations.get(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Get or create metadata object for this conversation
    let metadata = conversationMetadata.get(conversationId);
    if (!metadata) {
      metadata = {};
      conversationMetadata.set(conversationId, metadata);
    }

    // Update the metadata
    metadata[key] = value;

    console.log(
      `Updated metadata for conversation ${conversationId}: ${key}=${value}`
    );

    res.status(200).json({
      success: true,
      conversationId,
      metadata: { [key]: value },
    });
  } catch (error) {
    console.error("Error updating conversation metadata:", error);
    res.status(500).json({ error: "Failed to update conversation metadata" });
  }
});

router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const conversation = conversations.get(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Set user-agent if not already set (allows us to detect Telegram in subsequent requests)
    if (
      req.headers["user-agent"] &&
      req.headers["user-agent"].includes("Telegram")
    ) {
      conversation.isTelegram = true;
    }

    const response = await generateResponse(message, conversationId);

    res.status(200).json({
      message: response.message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

// Add file upload endpoint
router.post("/documents/upload", upload.array("document", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Get names of all uploaded files
    const uploadedFiles = req.files.map((file) => file.originalname);

    res.status(200).json({
      message: `${req.files.length} file(s) uploaded successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "Failed to upload files" });
  }
});

// Get GitHub repository structure
router.post("/documents/github/structure", express.json(), async (req, res) => {
  try {
    const { repository } = req.body;

    if (!repository) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    // Validate repository format
    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      return res.status(400).json({
        error: "Invalid repository format. Please use 'owner/repo' format.",
      });
    }

    console.log(`Processing GitHub repository request for: ${repository}`);
    const result = await getRepoStructure(repository);

    if (result.success) {
      console.log(`Successfully retrieved structure for ${repository}`);
      res.status(200).json(result);
    } else {
      console.warn(
        `Failed to get structure for ${repository}:`,
        result.message
      );
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error("Error fetching repository structure:", error);
    const errorMessage =
      error.message || "Failed to fetch repository structure";
    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Process selected GitHub repository files
router.post("/documents/github/process", async (req, res) => {
  try {
    const { repoPath, filePath } = req.body;
    if (!repoPath || !filePath) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const fullPath = path.join(repoPath, filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file extension and stats
    const ext = path.extname(filePath).toLowerCase();
    const stats = fs.statSync(fullPath);

    // Process based on file type
    let content;
    const supportedExtensions = new Set([
      ".md",
      ".txt",
      ".js",
      ".ts",
      ".tsx",
      ".jsx",
      ".py",
      ".java",
    ]);

    if (supportedExtensions.has(ext)) {
      content = fs.readFileSync(fullPath, "utf8");
    } else if (stats.isDirectory()) {
      // Return directory structure without processing contents
      return res.json({
        type: "directory",
        path: filePath,
        size: stats.size,
        children: [], // Children will be loaded on demand
      });
    } else {
      // For binary or unsupported files, just return metadata
      return res.json({
        type: "file",
        path: filePath,
        size: stats.size,
        extension: ext,
      });
    }

    // Return processed file data
    res.json({
      type: "file",
      path: filePath,
      content,
      size: stats.size,
      extension: ext,
      lastModified: stats.mtime,
    });
  } catch (error) {
    console.error("Error processing GitHub document:", error);
    res
      .status(500)
      .json({ error: "Failed to process document", details: error.message });
  }
});

// Get list of uploaded documents
router.get("/documents", async (req, res) => {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const documents = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".pdf" || ext === ".md" || ext === ".txt";
    });

    res.status(200).json({ documents });
  } catch (error) {
    console.error("Error listing documents:", error);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

// Delete a document
router.delete("/documents/:filename", async (req, res) => {
  try {
    const filePath = path.join(DOCS_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    await fs.unlink(filePath);
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Settings file paths
const SETTINGS_DIR = path.join(__dirname, "../../config");
const PERSONA_SETTINGS_PATH = path.join(SETTINGS_DIR, "persona.json");
const TELEGRAM_SETTINGS_PATH = path.join(SETTINGS_DIR, "telegram.json");

// Ensure settings directory exists
fs.ensureDirSync(SETTINGS_DIR);

// Default persona settings
const DEFAULT_PERSONA = {
  name: "SOLess Guide",
  style:
    "Helpful, knowledgeable about Solana and SOLess, technically accurate but approachable",
  background: "Technical expert on the SOLess project and Solana ecosystem",
};

// Default telegram settings
const DEFAULT_TELEGRAM = {
  enabled: false,
  token: "",
  status: "inactive",
};

// Helper function to load settings file
async function loadSettingsFile(filePath, defaultSettings) {
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = await fs.readFile(filePath, "utf8");
      return JSON.parse(fileContent);
    }
    // If file doesn't exist, create it with default settings
    await fs.writeFile(filePath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  } catch (error) {
    console.error(`Error loading settings file ${filePath}:`, error);
    return defaultSettings;
  }
}

// Helper function to save settings file
async function saveSettingsFile(filePath, settings) {
  try {
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving settings file ${filePath}:`, error);
    throw error;
  }
}

// Get persona settings
router.get("/settings/persona", async (req, res) => {
  try {
    const personaSettings = await loadSettingsFile(
      PERSONA_SETTINGS_PATH,
      DEFAULT_PERSONA
    );
    res.status(200).json({ persona: personaSettings });
  } catch (error) {
    console.error("Error fetching persona settings:", error);
    res.status(500).json({ error: "Failed to fetch persona settings" });
  }
});

// Update persona settings
router.post("/settings/persona", async (req, res) => {
  try {
    const { persona } = req.body;

    if (!persona || typeof persona !== "object") {
      return res.status(400).json({ error: "Invalid persona settings" });
    }

    // Validate required fields
    if (!persona.name || !persona.style || !persona.background) {
      return res
        .status(400)
        .json({ error: "Name, style, and background are required" });
    }

    // Save to file
    await saveSettingsFile(PERSONA_SETTINGS_PATH, persona);

    // Update the loaded persona in memory
    Object.assign(botPersona, persona);

    res.status(200).json({
      success: true,
      message: "Persona settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating persona settings:", error);
    res.status(500).json({ error: "Failed to update persona settings" });
  }
});

// Get telegram settings
router.get("/settings/telegram", async (req, res) => {
  try {
    const telegramSettings = await loadSettingsFile(
      TELEGRAM_SETTINGS_PATH,
      DEFAULT_TELEGRAM
    );

    // Check telegram status if enabled
    if (telegramSettings.enabled && telegramSettings.token) {
      // Set status based on environment variable matching
      if (process.env.TELEGRAM_BOT_TOKEN === telegramSettings.token) {
        telegramSettings.status = "connected";
      } else {
        telegramSettings.status = "inactive";
        telegramSettings.message =
          "Telegram bot needs server restart to apply new settings";
      }
    } else {
      telegramSettings.status = "inactive";
    }

    res.status(200).json(telegramSettings);
  } catch (error) {
    console.error("Error fetching telegram settings:", error);
    res.status(500).json({ error: "Failed to fetch telegram settings" });
  }
});

// Update telegram settings
router.post("/settings/telegram", async (req, res) => {
  try {
    const { enabled, token } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid enabled status" });
    }

    // If enabled, token is required
    if (enabled && (!token || token.trim() === "")) {
      return res
        .status(400)
        .json({ error: "Telegram bot token is required when enabled" });
    }

    // Create settings object
    const telegramSettings = {
      enabled,
      token: token || "",
      status: "inactive",
    };

    // Save to file
    await saveSettingsFile(TELEGRAM_SETTINGS_PATH, telegramSettings);

    // Update .env file with the token
    if (enabled && token) {
      try {
        // Read current .env file
        const envPath = path.join(__dirname, "../../.env");
        let envContent = "";

        if (fs.existsSync(envPath)) {
          envContent = await fs.readFile(envPath, "utf8");
        }

        // Check if TELEGRAM_BOT_TOKEN already exists
        if (envContent.includes("TELEGRAM_BOT_TOKEN=")) {
          // Replace existing token
          envContent = envContent.replace(
            /TELEGRAM_BOT_TOKEN=.*/,
            `TELEGRAM_BOT_TOKEN=${token}`
          );
        } else {
          // Add new token
          envContent += `\nTELEGRAM_BOT_TOKEN=${token}`;
        }

        // Save updated .env
        await fs.writeFile(envPath, envContent);

        telegramSettings.status = "inactive";
        telegramSettings.message =
          "Token updated in .env file. Restart server to apply changes.";
      } catch (envError) {
        console.error("Error updating .env file:", envError);
        telegramSettings.status = "error";
        telegramSettings.message = "Could not update .env file";
      }
    } else if (!enabled) {
      telegramSettings.status = "inactive";
      telegramSettings.message = "Telegram bot is disabled";
    }

    res.status(200).json(telegramSettings);
  } catch (error) {
    console.error("Error updating telegram settings:", error);
    res.status(500).json({ error: "Failed to update telegram settings" });
  }
});

module.exports = router;
