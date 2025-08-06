"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
// src/utils/retry.ts
async function retry(fn, maxRetries, delayMs) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}
