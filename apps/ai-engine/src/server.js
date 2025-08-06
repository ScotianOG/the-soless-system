// src/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs-extra");
const { cleanupTempDirectories } = require("./utils/storageManager");

// Load environment variables with our custom loader
const env = require("../load-env");

// Load telegram settings to see if we should start the bot
const SETTINGS_DIR = path.join(__dirname, "../config");
const TELEGRAM_SETTINGS_PATH = path.join(SETTINGS_DIR, "telegram.json");
let telegramBot = null;

// Check if Telegram integration is enabled
let telegramEnabled = false;
try {
  const telegramConfig = require(TELEGRAM_SETTINGS_PATH);
  telegramEnabled = telegramConfig.enabled && telegramConfig.token;
} catch (error) {
  console.log("Telegram integration disabled: No valid configuration found");
}

// Debug environment variables
console.log("ENV DEBUG - AI_PROVIDER:", env.AI_PROVIDER || "not set");
console.log("ENV DEBUG - OLLAMA_MODEL:", env.OLLAMA_MODEL || "not set");
console.log("ENV DEBUG - OLLAMA_BASE_URL:", env.OLLAMA_BASE_URL || "not set");
console.log(
  "ENV DEBUG - ANTHROPIC_API_KEY exists:",
  env.ANTHROPIC_API_KEY ? "Yes" : "No"
);
console.log(
  "ENV DEBUG - GITHUB_TOKEN exists:",
  env.GITHUB_TOKEN ? "Yes" : "No"
);

// Check for Ollama availability (for local LLM)
console.log("ENV DEBUG - Checking for local Ollama availability...");
const ollamaBaseUrl = env.OLLAMA_BASE_URL || "http://localhost:11434";
const ollamaModel = env.OLLAMA_MODEL || "phi3:mini";

fetch(`${ollamaBaseUrl}/api/tags`)
  .then((response) => {
    if (response.ok) {
      console.log("ENV DEBUG - Ollama detected! Local LLM is available.");
      response.json().then((data) => {
        const models = data.models || [];
        console.log(
          `ENV DEBUG - Available Ollama models: ${models
            .map((m) => m.name)
            .join(", ")}`
        );
        if (!models.some((m) => m.name === ollamaModel)) {
          console.log(
            `ENV DEBUG - ${ollamaModel} model not found. You may need to run: ollama pull ${ollamaModel}`
          );
        } else {
          console.log(
            `ENV DEBUG - Required model ${ollamaModel} is available!`
          );
        }
      });
    } else {
      console.log(
        "ENV DEBUG - Ollama not detected. To use local LLM, please install Ollama from https://ollama.ai"
      );
    }
  })
  .catch((error) => {
    console.log("ENV DEBUG - Ollama not available:", error.message);
    console.log(
      "ENV DEBUG - To use local LLM, please install Ollama from https://ollama.ai"
    );
  });

const apiRoutes = require("./routes/api");

// Run cleanup every 6 hours
setInterval(() => {
  try {
    cleanupTempDirectories(24);
  } catch (error) {
    console.error("Error in scheduled temp directory cleanup:", error);
  }
}, 6 * 60 * 60 * 1000);

// Run initial cleanup on startup
cleanupTempDirectories(24).catch((error) => {
  console.error("Error in initial temp directory cleanup:", error);
});

// Initialize Express app
const app = express();

// Import AI Engine routes and knowledge preloading
const { preloadDocuments } = require("./utils/documentLoader");

// Preload document cache on server startup
console.log("🔄 Preloading document cache on startup...");
preloadDocuments()
  .then(() => console.log("✅ Document cache preloaded successfully"))
  .catch((err) => console.warn("⚠️ Document preloading failed:", err.message));

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173", // Frontend dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173", // Frontend dev server alt
    "https://soless.app",
    "https://www.soless.app",
    "https://api.soless.app",
    "https://ai.soless.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 600,
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "10mb" }));

// Configure request timeout for AI responses
app.use((req, res, next) => {
  // Set timeout to 120 seconds for AI generation requests (demonstration mode)
  if (req.path.includes("/messages") || req.path.includes("/conversations")) {
    req.setTimeout(120000); // 120 seconds
    res.setTimeout(120000); // 120 seconds
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api", apiRoutes);

// Admin panel route
app.get("/admin", (req, res) => {
  res.redirect("/admin/index.html");
});

// Root path redirect to admin dashboard
app.get("/", (req, res) => {
  res.redirect("/admin");
});

// Basic health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Initialize Telegram bot if enabled
async function initializeTelegramBot() {
  try {
    // Create config directory if it doesn't exist
    fs.ensureDirSync(SETTINGS_DIR);

    // Check if Telegram is enabled in settings
    let telegramSettings = { enabled: false };
    if (fs.existsSync(TELEGRAM_SETTINGS_PATH)) {
      try {
        const settingsContent = await fs.readFile(
          TELEGRAM_SETTINGS_PATH,
          "utf8"
        );
        telegramSettings = JSON.parse(settingsContent);
      } catch (err) {
        console.error("Error parsing Telegram settings:", err);
      }
    }

    // Initialize Telegram bot only if explicitly enabled
    if (telegramEnabled) {
      console.log("Initializing Telegram bot integration...");
      try {
        telegramBot = require("./telegramBot");
        console.log("Telegram bot started successfully");
      } catch (error) {
        console.log("Failed to start Telegram bot:", error.message);
        console.log("Continuing without Telegram integration");
      }
    } else {
      console.log("Telegram bot integration is disabled");
    }
  } catch (error) {
    console.log("Telegram integration disabled: Configuration error");
  }
}

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  console.log(`SOLess AI Engine running on port ${PORT}`);
  console.log(`Admin dashboard available at http://localhost:${PORT}/admin`);

  // Configure server timeouts for AI responses (30 seconds optimized)
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 35000; // Slightly longer than server timeout
  server.headersTimeout = 40000; // Slightly longer than keepAliveTimeout

  // Initialize Telegram bot after server starts
  await initializeTelegramBot();
});
