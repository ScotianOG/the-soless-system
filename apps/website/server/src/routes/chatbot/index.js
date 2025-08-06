"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotRouter = void 0;
const express_1 = require("express");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
// Define configuration for the proxy
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:3000";

// Manual proxy implementation using native HTTP
const manualProxy = async (req, res) => {
  try {
    const targetPath = req.path.replace(/^\//, "/api/"); // Convert /conversations to /api/conversations
    const targetUrl = `${AI_ENGINE_URL}${targetPath}`;

    logger_1.logger.debug(`Proxying ${req.method} ${req.path} to ${targetUrl}`);

    const fetch = (await import("node-fetch")).default;
    const options = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...req.headers,
      },
    };

    if (req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    res.status(response.status);
    res.set(response.headers.raw());

    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error) {
    logger_1.logger.error("Chatbot proxy error:", error);
    res.status(500).json({
      error: "Failed to connect to AI engine",
      message:
        "The chatbot service is currently unavailable. Please try again later.",
      details: error.message,
    });
  }
};

// Apply the manual proxy to all routes
router.use("/*", manualProxy);
exports.chatbotRouter = router;
