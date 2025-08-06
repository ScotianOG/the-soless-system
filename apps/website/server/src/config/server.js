"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_CONFIG = void 0;
// src/config/server.ts
exports.SERVER_CONFIG = {
    PORT: process.env.PORT || 3001,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    CORS_OPTIONS: {
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    },
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },
};
