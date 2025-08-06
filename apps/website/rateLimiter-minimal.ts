import rateLimit from "express-rate-limit";
import { Request } from "express";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // Extremely high limit: 100,000 requests per windowMs
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
  // Skip rate limiting for almost everything except obvious abuse
  skip: (req: Request): boolean => {
    // Only rate limit obvious high-abuse endpoints
    const limitPaths = [
      "/auth/register",
      "/registration/register",
      "/webhooks",
    ];

    // If it's not an abuse-prone endpoint, skip rate limiting
    return !limitPaths.some((path) => req.path.includes(path));
  },
  // Custom message for rate limit exceeded
  message: {
    error: "Rate limit exceeded",
    message: "Too many requests, please try again in a few minutes",
    retryAfter: "15 minutes",
  },
});
