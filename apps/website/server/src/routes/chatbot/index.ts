import express, { Router, Request, Response } from "express";
import { logger } from "../../utils/logger";

const router = Router();

// Define configuration for the proxy
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:3000";

// Configure raw body parsing for the chatbot router to avoid JSON parsing issues
router.use(express.raw({ type: "application/json", limit: "10mb" }));

// Manual proxy implementation using native HTTP
const manualProxy = async (req: Request, res: Response) => {
  try {
    // Extract the path after "/chat" from the original URL
    // e.g., "/chat/status" -> "/api/status"
    // e.g., "/chat/conversations" -> "/api/conversations"
    const originalPath = req.originalUrl.split("?")[0]; // Remove query params
    const chatPath = originalPath.replace("/chat", ""); // Remove the /chat prefix
    const targetPath = `/api${chatPath || ""}`;
    const targetUrl = `${AI_ENGINE_URL}${targetPath}`;

    console.log(`[CHATBOT PROXY DEBUG] Original URL: ${req.originalUrl}`);
    console.log(`[CHATBOT PROXY DEBUG] Chat path: ${chatPath}`);
    console.log(`[CHATBOT PROXY DEBUG] Target path: ${targetPath}`);
    console.log(`[CHATBOT PROXY DEBUG] Target URL: ${targetUrl}`);

    logger.debug(`Proxying ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    logger.debug(`Chat path: ${chatPath}, Target path: ${targetPath}`);

    const fetch = (await import("node-fetch")).default;
    const options: any = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...req.headers,
      },
    };

    // Only include body for methods that support it (not GET/HEAD)
    const methodsWithBody = ["POST", "PUT", "PATCH", "DELETE"];
    if (methodsWithBody.includes(req.method.toUpperCase()) && req.body) {
      if (Buffer.isBuffer(req.body)) {
        // Raw buffer from express.raw middleware
        options.body = req.body.toString();
        console.log(`[CHATBOT PROXY DEBUG] Raw body: ${options.body}`);
      } else if (typeof req.body === "object") {
        // Already parsed JSON object
        options.body = JSON.stringify(req.body);
        console.log(`[CHATBOT PROXY DEBUG] JSON body: ${options.body}`);
      } else {
        // String or other format
        options.body = req.body;
        console.log(`[CHATBOT PROXY DEBUG] String body: ${options.body}`);
      }
    } else if (
      req.method.toUpperCase() === "GET" ||
      req.method.toUpperCase() === "HEAD"
    ) {
      console.log(
        `[CHATBOT PROXY DEBUG] ${req.method} request - no body included`
      );
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    res.status(response.status);

    // Set headers properly - convert arrays to strings
    const responseHeaders = response.headers.raw();
    for (const [key, value] of Object.entries(responseHeaders)) {
      if (Array.isArray(value)) {
        res.set(key, value.join(", "));
      } else {
        res.set(key, value as string);
      }
    }

    // Try to parse as JSON, fallback to text
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error: any) {
    logger.error("Chatbot proxy error:", error);
    res.status(500).json({
      error: "Failed to connect to AI engine",
      message:
        "The chatbot service is currently unavailable. Please try again later.",
      details: error.message,
    });
  }
};

// Apply the manual proxy to all routes - use "*" instead of "/*"
router.use("*", manualProxy);

export const chatbotRouter = router;
