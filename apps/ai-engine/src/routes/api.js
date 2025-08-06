// src/routes/api.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { botPersona } = require("../utils/solessKnowledge");
const { generatePrompt } = require("../utils/promptGenerator");
const {
  getKnowledgeMetrics,
  refreshKnowledgeCache,
  preloadDocuments,
} = require("../utils/solessKnowledge");
const {
  getLoadMetrics,
  clearDocumentCache,
} = require("../utils/documentLoader");
const {
  ModelManager,
  AnthropicProvider,
  OllamaProvider,
} = require("../utils/modelProviders");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const { DOCS_DIR } = require("../utils/documentLoader");
const {
  processGitHubRepo,
  getRepoStructure,
  processGitHubFiles,
} = require("../utils/githubProcessor");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

// Use our custom env loader (already loaded in server.js)
const env = require("../../load-env");

// Initialize model manager
const modelManager = new ModelManager();

// Initialize providers
async function initializeProviders() {
  // Get AI provider configuration from environment
  const aiProvider = env.AI_PROVIDER || "ollama";
  const ollamaBaseUrl = env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = env.OLLAMA_MODEL || "phi3:mini";
  const isDevelopment = process.env.NODE_ENV !== "production";

  console.log(`AI Engine - Configured provider: ${aiProvider}`);
  console.log(`AI Engine - Ollama URL: ${ollamaBaseUrl}`);
  console.log(`AI Engine - Ollama Model: ${ollamaModel}`);

  // Initialize providers based on configuration
  if (aiProvider === "ollama" || aiProvider === "local") {
    // Try to initialize Ollama first
    const ollamaProvider = new OllamaProvider(ollamaBaseUrl, ollamaModel);
    const ollamaAdded = await modelManager.addProvider(
      "ollama",
      ollamaProvider
    );

    if (ollamaAdded) {
      console.log("Successfully initialized Ollama provider");
      await modelManager.setActiveProvider("ollama");
      console.log(
        `Using Ollama with model ${ollamaModel} as primary LLM provider`
      );
    } else {
      console.warn(
        `Ollama provider not available. Make sure Ollama is running and ${ollamaModel} model is installed.`
      );
      console.log("You can install Ollama from https://ollama.ai");
      console.log(`After installation, run: ollama pull ${ollamaModel}`);
    }

    // Use configured model as primary provider
    console.log(`Attempting to initialize primary model: ${ollamaModel}`);

    // Add ultra-fast models as fallbacks if they exist - prioritize speed
    const fallbackModels = [
      { name: "qwen2:1.5b", alias: "qwen" },
      { name: "tinyllama", alias: "tinyllama" },
      { name: "gemma2:2b", alias: "gemma" },
    ];

    // Try to add fallback models (including the primary model for alias access)
    for (const model of fallbackModels) {
      const fallbackProvider = new OllamaProvider(ollamaBaseUrl, model.name);
      const added = await modelManager.addProvider(
        model.alias,
        fallbackProvider
      );
      if (added) {
        console.log(`${model.name} provider initialized as '${model.alias}'`);

        // If this is our primary model, make sure the alias works
        if (model.name === ollamaModel) {
          console.log(
            `Primary model ${ollamaModel} is available as both 'ollama' and '${model.alias}'`
          );
        }
      }
    }

    // Add Anthropic as fallback if available
    const apiKey = env.ANTHROPIC_API_KEY ? env.ANTHROPIC_API_KEY.trim() : "";
    if (
      apiKey &&
      apiKey !== "your-actual-anthropic-api-key" &&
      apiKey.startsWith("sk-")
    ) {
      const anthropicProvider = new AnthropicProvider(apiKey);
      const added = await modelManager.addProvider(
        "anthropic",
        anthropicProvider
      );
      if (added) {
        console.log("Anthropic provider initialized as fallback");
        // Only use Anthropic if the primary Ollama model failed
        if (!ollamaAdded) {
          await modelManager.setActiveProvider("anthropic");
          console.log("Using Anthropic Claude as fallback LLM provider");
        }
      }
    }
  } else if (aiProvider === "anthropic") {
    // Initialize Anthropic as primary
    const apiKey = env.ANTHROPIC_API_KEY ? env.ANTHROPIC_API_KEY.trim() : "";
    if (
      apiKey &&
      apiKey !== "your-actual-anthropic-api-key" &&
      apiKey.startsWith("sk-")
    ) {
      const anthropicProvider = new AnthropicProvider(apiKey);
      const added = await modelManager.addProvider(
        "anthropic",
        anthropicProvider
      );
      if (added) {
        console.log("Successfully initialized Anthropic provider");
        await modelManager.setActiveProvider("anthropic");
        console.log("Using Anthropic Claude as primary LLM provider");
      }
    } else {
      console.error("No valid Anthropic API key found for anthropic provider");
    }
  }
}

// Initialize providers
initializeProviders().catch(console.error);

// Status endpoint to check AI Engine health and provider status
router.get("/status", (req, res) => {
  try {
    const activeProvider = modelManager.getActiveProvider();
    const providers = modelManager.getAvailableProviders();
    const isDevelopment = process.env.NODE_ENV !== "production";

    res.json({
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: isDevelopment ? "development" : "production",
      activeProvider,
      providers,
      ollamaAvailable: providers.includes("ollama"),
      anthropicAvailable: providers.includes("anthropic"),
    });
  } catch (error) {
    console.error("Error in status endpoint:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve status information",
      error: error.message,
    });
  }
});

// Speed monitoring store for performance analytics
const speedMetrics = {
  responseTimeHistory: [],
  providerPerformance: new Map(),
  averageResponseTime: 0,
  fastestProvider: null,
  slowestProvider: null,
  timeoutCount: 0,
  fallbackCount: 0,
};

// Update speed metrics after each response
function updateSpeedMetrics(
  responseTime,
  provider,
  attempts,
  hadTimeout = false
) {
  // Add to history (keep last 100 responses)
  speedMetrics.responseTimeHistory.push({
    time: responseTime,
    provider,
    attempts,
    timestamp: new Date().toISOString(),
    hadTimeout,
  });

  if (speedMetrics.responseTimeHistory.length > 100) {
    speedMetrics.responseTimeHistory.shift();
  }

  // Update provider performance
  if (!speedMetrics.providerPerformance.has(provider)) {
    speedMetrics.providerPerformance.set(provider, {
      totalResponses: 0,
      totalTime: 0,
      averageTime: 0,
      fastestTime: Infinity,
      slowestTime: 0,
      timeouts: 0,
    });
  }

  const providerStats = speedMetrics.providerPerformance.get(provider);
  providerStats.totalResponses++;
  providerStats.totalTime += responseTime;
  providerStats.averageTime =
    providerStats.totalTime / providerStats.totalResponses;
  providerStats.fastestTime = Math.min(providerStats.fastestTime, responseTime);
  providerStats.slowestTime = Math.max(providerStats.slowestTime, responseTime);

  if (hadTimeout) {
    providerStats.timeouts++;
    speedMetrics.timeoutCount++;
  }

  if (attempts > 1) {
    speedMetrics.fallbackCount++;
  }

  // Update global averages
  const totalTime = speedMetrics.responseTimeHistory.reduce(
    (sum, entry) => sum + entry.time,
    0
  );
  speedMetrics.averageResponseTime =
    totalTime / speedMetrics.responseTimeHistory.length;

  // Find fastest and slowest providers
  let fastestAvg = Infinity;
  let slowestAvg = 0;

  for (const [providerName, stats] of speedMetrics.providerPerformance) {
    if (stats.averageTime < fastestAvg) {
      fastestAvg = stats.averageTime;
      speedMetrics.fastestProvider = providerName;
    }
    if (stats.averageTime > slowestAvg) {
      slowestAvg = stats.averageTime;
      speedMetrics.slowestProvider = providerName;
    }
  }
}

// Generate speed recommendations based on metrics
function generateSpeedRecommendations(metrics) {
  const recommendations = [];

  if (metrics.averageResponseTime > 15000) {
    recommendations.push(
      "Average response time is high (>15s). Consider switching to a faster model."
    );
  }

  if (metrics.timeoutCount > metrics.responseTimeHistory.length * 0.1) {
    recommendations.push(
      "High timeout rate detected. Consider reducing model complexity or increasing timeouts."
    );
  }

  if (metrics.fallbackCount > metrics.responseTimeHistory.length * 0.2) {
    recommendations.push(
      "Frequent fallbacks detected. Primary model may be overloaded."
    );
  }

  if (
    metrics.fastestProvider &&
    metrics.fastestProvider !== modelManager.getActiveProvider()
  ) {
    recommendations.push(
      `Consider switching to ${metrics.fastestProvider} for better performance.`
    );
  }

  return recommendations;
}

// Speed monitoring endpoint for performance analysis
router.get("/speed", (req, res) => {
  try {
    const recentResponses = speedMetrics.responseTimeHistory.slice(-20); // Last 20 responses
    const providerStats = {};

    // Convert Map to object for JSON response
    for (const [provider, stats] of speedMetrics.providerPerformance) {
      providerStats[provider] = {
        ...stats,
        successRate:
          (
            ((stats.totalResponses - stats.timeouts) / stats.totalResponses) *
            100
          ).toFixed(1) + "%",
      };
    }

    const currentTime = new Date().toISOString();
    const timeWindow =
      speedMetrics.responseTimeHistory.length > 0
        ? speedMetrics.responseTimeHistory[
            speedMetrics.responseTimeHistory.length - 1
          ].timestamp
        : currentTime;

    res.json({
      status: "ok",
      timestamp: currentTime,
      overview: {
        totalResponses: speedMetrics.responseTimeHistory.length,
        averageResponseTime: Math.round(speedMetrics.averageResponseTime),
        fastestProvider: speedMetrics.fastestProvider,
        slowestProvider: speedMetrics.slowestProvider,
        timeoutCount: speedMetrics.timeoutCount,
        fallbackCount: speedMetrics.fallbackCount,
        successRate:
          speedMetrics.responseTimeHistory.length > 0
            ? (
                ((speedMetrics.responseTimeHistory.length -
                  speedMetrics.timeoutCount) /
                  speedMetrics.responseTimeHistory.length) *
                100
              ).toFixed(1) + "%"
            : "100%",
      },
      recentResponses: recentResponses.map((r) => ({
        responseTime: r.time,
        provider: r.provider,
        attempts: r.attempts,
        timestamp: r.timestamp,
        status: r.hadTimeout ? "timeout" : "success",
      })),
      providerPerformance: providerStats,
      activeProvider: modelManager.getActiveProvider(),
      availableProviders: modelManager.getAvailableProviders(),
      recommendations: generateSpeedRecommendations(speedMetrics),
    });
  } catch (error) {
    console.error("Error in speed endpoint:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve speed metrics",
      error: error.message,
    });
  }
});

// Performance and cache monitoring endpoint
router.get("/performance", (req, res) => {
  try {
    const knowledgeMetrics = getKnowledgeMetrics();
    const loadMetrics = getLoadMetrics();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      performance: {
        knowledgeCache: knowledgeMetrics,
        documentLoading: loadMetrics,
        speedMetrics: {
          averageResponseTime: speedMetrics.averageResponseTime,
          totalResponses: speedMetrics.responseTimeHistory.length,
          timeoutRate:
            speedMetrics.responseTimeHistory.length > 0
              ? `${Math.round(
                  (speedMetrics.timeoutCount /
                    speedMetrics.responseTimeHistory.length) *
                    100
                )}%`
              : "0%",
          fastestProvider: speedMetrics.fastestProvider,
          slowestProvider: speedMetrics.slowestProvider,
        },
      },
      recommendations: generatePerformanceRecommendations(
        knowledgeMetrics,
        loadMetrics
      ),
    });
  } catch (error) {
    console.error("Error in performance endpoint:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve performance metrics",
      error: error.message,
    });
  }
});

// Cache management endpoints
router.post("/cache/refresh", async (req, res) => {
  try {
    console.log("🔄 Manual cache refresh requested");
    await refreshKnowledgeCache();
    res.json({
      success: true,
      message: "Knowledge cache refreshed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh cache",
      error: error.message,
    });
  }
});

router.post("/cache/clear", (req, res) => {
  try {
    clearDocumentCache();
    res.json({
      success: true,
      message: "Document cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message,
    });
  }
});

// Generate performance recommendations
function generatePerformanceRecommendations(knowledgeMetrics, loadMetrics) {
  const recommendations = [];

  if (loadMetrics.averageLoadTime > 5000) {
    recommendations.push(
      "Document loading is slow (>5s). Consider reducing document corpus size or optimizing file formats."
    );
  }

  if (!knowledgeMetrics.hasFallbackCache) {
    recommendations.push(
      "No fallback knowledge cache available. System may be slow on first requests."
    );
  }

  if (
    knowledgeMetrics.cacheStats &&
    knowledgeMetrics.cacheStats.documentCount < 10
  ) {
    recommendations.push(
      "Low document cache utilization. Consider preloading frequently accessed documents."
    );
  }

  const cacheHitRate = parseFloat(
    loadMetrics.cacheHitRate?.replace("%", "") || "0"
  );
  if (cacheHitRate < 70) {
    recommendations.push(
      "Low cache hit rate (<70%). Consider increasing cache TTL or preloading documents."
    );
  }

  return recommendations;
}

// In-memory store for conversations
const conversations = new Map();

// Metadata store for conversations
const conversationMetadata = new Map();

// Generate a response using the active model provider with speed monitoring (optimized for qwen only)
async function generateResponse(message, conversationId) {
  const startTime = Date.now();
  let conversation = null; // Initialize conversation variable

  try {
    // Get or create conversation
    conversation = conversations.get(conversationId);
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

    // Get conversation metadata
    const metadata = conversationMetadata.get(conversationId) || {};
    const isEli5Mode = metadata.eli5Mode === true;
    const isTelegram = conversation.isTelegram || false;

    // Use the optimized prompt generator with quick knowledge for speed
    const useQuickKnowledge = isTelegram || Date.now() - startTime > 2000; // Use quick knowledge for Telegram or if already taking too long
    const systemPrompt = await generatePrompt(
      message,
      conversation.messages.slice(0, -1),
      useQuickKnowledge
    );

    // Add Telegram-specific instructions for ultra-fast responses
    let finalPrompt = systemPrompt;
    if (isTelegram) {
      finalPrompt += `\n\nTELEGRAM SPEED MODE - ULTRA CONCISE RESPONSES:
- For simple questions, use 3-4 sentences maximum.
- For complex topics, use 6-8 sentences maximum.
- Be direct and avoid fluff - every word counts.
- Use short, punchy sentences for maximum impact.`;
    }

    // Add ELI5 instructions if that mode is active
    if (isEli5Mode) {
      finalPrompt += `\n\nEXPLAIN LIKE I'M 5 MODE IS ACTIVE:
- Explain everything as if talking to a 5-year-old child
- Use very simple words and concepts
- Use fun metaphors and examples
- Be extra friendly and encouraging
- Avoid technical terms unless you immediately explain them
- Keep explanations short, friendly, and engaging`;
    }

    let aiResponse;
    let responseProvider;

    // Use the configured provider for responses
    const configuredProvider = env.AI_PROVIDER || "ollama";
    console.log(`🚀 Using configured provider: ${configuredProvider}`);

    // Ensure we're using the correct provider
    if (modelManager.getActiveProvider() !== configuredProvider) {
      await modelManager.setActiveProvider(configuredProvider);
    }

    // Set timeout based on provider - Anthropic needs more time for large knowledge base
    const timeoutMs = configuredProvider === "anthropic" ? 30000 : 120000; // 30s for Anthropic, 120s for local
    const responsePromise = modelManager.generateResponse(
      message,
      conversation,
      finalPrompt
    );

    // Race against timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Ultra-fast timeout exceeded")),
        timeoutMs
      );
    });

    try {
      aiResponse = await Promise.race([responsePromise, timeoutPromise]);
      responseProvider = modelManager.getActiveProvider();

      const responseTime = Date.now() - startTime;
      console.log(
        `✅ Ultra-fast response generated in ${responseTime}ms using ${responseProvider}`
      );

      // Log performance metrics
      if (responseTime > 8000) {
        console.warn(
          `⚠️ Response slower than target: ${responseTime}ms with provider ${responseProvider}`
        );
      }
    } catch (error) {
      console.error(`❌ Ultra-fast generation failed:`, error.message);

      // Immediate fallback response
      aiResponse = isTelegram
        ? "Processing... Please try again! 🚀"
        : "I'm optimizing for speed. Please try your question again.";
      responseProvider = "ultra-fast-fallback";
    }

    // Post-process response for Telegram to ensure optimal length
    if (isTelegram && aiResponse && aiResponse.length > 500) {
      // Aggressive truncation for Telegram ultra-speed
      const sentenceBreak = aiResponse.substring(0, 400).lastIndexOf(".");
      if (sentenceBreak > 200) {
        aiResponse = aiResponse.substring(0, sentenceBreak + 1);
      } else {
        // If no good sentence break, just truncate cleanly
        aiResponse = aiResponse.substring(0, 400) + "...";
      }
    }

    // Save the response to conversation history
    conversation.messages.push({ role: "assistant", content: aiResponse });

    const totalTime = Date.now() - startTime;
    console.log(`📊 Ultra-fast total response time: ${totalTime}ms`);

    // Update speed metrics for monitoring
    updateSpeedMetrics(
      totalTime,
      responseProvider || modelManager.getActiveProvider(),
      1, // Only one attempt in ultra-fast mode
      totalTime > timeoutMs
    );

    return {
      message: aiResponse,
      provider: responseProvider || modelManager.getActiveProvider(),
      responseTime: totalTime,
      attempts: 1,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(
      `💥 Ultra-fast generateResponse failed after ${totalTime}ms:`,
      error
    );

    // Update speed metrics for failed response
    updateSpeedMetrics(totalTime, "ultra-fast-error", 1, true);

    // Return immediate fallback response
    const fallbackMessage =
      conversation && conversation.isTelegram
        ? "Quick response loading... Try again! 🚀"
        : "I'm optimizing for ultra-fast responses. Please try your question again.";

    return {
      message: fallbackMessage,
      provider: "ultra-fast-fallback",
      responseTime: totalTime,
      attempts: 1,
      error: true,
    };
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

// Document upload endpoint
router.post(
  "/documents/upload",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`Document uploaded: ${req.file.originalname}`);
      res.status(200).json({
        success: true,
        message: `Document '${req.file.originalname}' uploaded successfully`,
        filename: req.file.originalname,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload document",
        message: error.message,
      });
    }
  }
);

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
      provider: response.provider,
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

/**
 * Get repository structure
 * GET /api/github/repository?repo=owner/repo
 */
router.get("/github/repository", async (req, res) => {
  try {
    const repository = req.query.repo;

    if (!repository) {
      return res.status(400).json({
        success: false,
        message: "Repository parameter is required (format: owner/repo)",
      });
    }

    const result = await getRepoStructure(repository);

    return res.json(result);
  } catch (error) {
    console.error("Error getting repository structure:", error);

    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
});

/**
 * Import selected files from GitHub repository
 * POST /api/github/import
 * Body: {
 *   owner: string,
 *   repo: string,
 *   files: string[]
 * }
 */
router.post("/github/import", async (req, res) => {
  try {
    const { owner, repo, files } = req.body;

    if (!owner || !repo || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Owner, repo, and files array are required",
      });
    }

    // Convert file paths to file objects for processing
    const selectedFiles = files.map((path) => ({
      path,
      type: "file",
      processed: false,
    }));

    // Process the selected files
    const result = await processGitHubFiles(owner, repo, selectedFiles);

    return res.json(result);
  } catch (error) {
    console.error("Error importing GitHub files:", error);

    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      processedFiles: 0,
    });
  }
});

/**
 * Import repository using git clone method
 * POST /api/github/clone
 * Body: {
 *   owner: string,
 *   repo: string,
 *   files: string[]
 * }
 */
router.post("/github/clone", async (req, res) => {
  try {
    const { owner, repo, files } = req.body;

    if (!owner || !repo || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Owner, repo, and files array are required",
      });
    }

    // Process the repository
    const result = await processGitHubRepo(owner, repo, files);

    return res.json(result);
  } catch (error) {
    console.error("Error processing GitHub repository:", error);

    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
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
    const { owner, repo, files } = req.body;
    if (!owner || !repo || !Array.isArray(files)) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Convert file paths to file objects for processing
    const selectedFiles = files.map((path) => ({
      path,
      type: "file",
      processed: false,
    }));

    // Process the selected files
    const result = await processGitHubFiles(owner, repo, selectedFiles);

    return res.json(result);
  } catch (error) {
    console.error("Error processing GitHub files:", error);
    res.status(500).json({
      error: "Failed to process files",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get list of uploaded documents
router.get("/documents", async (req, res) => {
  try {
    const files = await fs.readdir(DOCS_DIR);
    const documents = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return (
        ext === ".pdf" ||
        ext === ".md" ||
        ext === ".txt" ||
        ext === ".ts" ||
        ext === ".tsx"
      );
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

// Model settings endpoints
router.get("/settings/model", async (req, res) => {
  try {
    res.json({
      activeProvider: modelManager.getActiveProvider(),
      availableProviders: modelManager.getAvailableProviders(),
    });
  } catch (error) {
    console.error("Error getting model settings:", error);
    res.status(500).json({ error: "Failed to get model settings" });
  }
});

router.post("/settings/model", async (req, res) => {
  try {
    const { provider } = req.body;
    if (!provider) {
      return res.status(400).json({ error: "Provider name is required" });
    }

    await modelManager.setActiveProvider(provider);
    res.json({
      success: true,
      activeProvider: modelManager.getActiveProvider(),
    });
  } catch (error) {
    console.error("Error updating model settings:", error);
    res.status(500).json({ error: "Failed to update model settings" });
  }
});

// Simple chat endpoint for direct testing (creates conversation automatically)
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Create a temporary conversation for this request
    const conversationId = uuidv4();
    const isTelegram =
      req.headers["user-agent"] &&
      req.headers["user-agent"].includes("Telegram");

    conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: new Date(),
      isTelegram: isTelegram,
    });

    console.log(
      `Simple chat request - created temp conversation: ${conversationId}`
    );

    const response = await generateResponse(message, conversationId);

    res.status(200).json({
      message: response.message,
      provider: response.provider,
      conversationId: conversationId, // Return for reference
    });
  } catch (error) {
    console.error("Error in simple chat endpoint:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

module.exports = router;
