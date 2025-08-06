"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// src/utils/logger.ts
const winston_1 = __importDefault(require("winston"));
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}]: ${message}`;
}));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: logFormat,
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
        }),
        new winston_1.default.transports.File({
            filename: "error.log",
            level: "error",
            dirname: "logs",
        }),
        new winston_1.default.transports.File({
            filename: "combined.log",
            dirname: "logs",
        }),
    ],
});
