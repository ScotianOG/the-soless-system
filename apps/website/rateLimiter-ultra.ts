import rateLimit from "express-rate-limit";
import { Request } from "express";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // Ultra high limit: 50000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Use Cloudflare's CF-Connecting-IP header for rate limiting
  keyGenerator: (req: Request): string => {
    // Try Cloudflare IP first
    const cfIp = req.headers["cf-connecting-ip"];
    if (typeof cfIp === "string") {
      return cfIp;
    }

    // Then try forwarded IP from nginx
    const forwardedIp = req.headers["x-forwarded-for"];
    if (typeof forwardedIp === "string") {
      return forwardedIp.split(",")[0];
    }

    // Finally use direct IP, with fallback to prevent undefined
    return req.ip || "127.0.0.1";
  },
  // Skip rate limiting for health checks, status endpoints, and high-frequency routes
  skip: (req: Request): boolean => {
    const skipPaths = [
      "/health",
      "/status",
      "/registration/status",
      "/verifications/status",
      "/twitter/feed",
      "/twitter/status",
      "/twitter",
      "/stats/leaderboard",
      "/stats/summary",
      "/stats/", // Cover all stats endpoints including /stats/{wallet}
      "/users/get", // Cover the specific POST endpoint for user lookup
      "/users/", // Cover all user endpoints
      "/activity",
    ];
    return skipPaths.some((path) => req.path.includes(path));
  },
  // Custom message for rate limit exceeded
  message: {
    error: "Rate limit exceeded",
    message: "Too many requests, please try again in a few minutes",
    retryAfter: "15 minutes",
  },
});
