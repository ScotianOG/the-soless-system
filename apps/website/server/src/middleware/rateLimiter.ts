import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Use Cloudflare's CF-Connecting-IP header for rate limiting
  keyGenerator: (req: Request): string => {
    // Try Cloudflare IP first
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string') {
      return cfIp;
    }

    // Then try forwarded IP from nginx
    const forwardedIp = req.headers['x-forwarded-for'];
    if (typeof forwardedIp === 'string') {
      return forwardedIp.split(',')[0];
    }

    // Finally use direct IP, with fallback to prevent undefined
    return req.ip || '127.0.0.1';
  }
});
