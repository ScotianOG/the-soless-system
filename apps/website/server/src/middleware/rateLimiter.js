"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    // Use Cloudflare's CF-Connecting-IP header for rate limiting
    keyGenerator: (req) => {
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
