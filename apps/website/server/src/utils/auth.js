"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateNonce = exports.createSignMessage = exports.verifyWalletSignature = exports.generateToken = void 0;
// src/utils/auth.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const web3_js_1 = require("@solana/web3.js");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bs58_1 = __importDefault(require("bs58"));
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};
exports.generateToken = generateToken;
const verifyWalletSignature = async (wallet, signature, message) => {
    try {
        // Convert the message to Uint8Array
        const messageBytes = new TextEncoder().encode(message);
        // Convert the signature from base58 to Uint8Array
        const signatureBytes = bs58_1.default.decode(signature);
        // Convert the wallet address to a PublicKey
        const publicKey = new web3_js_1.PublicKey(wallet);
        // Verify the signature
        const isValid = tweetnacl_1.default.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());
        return isValid;
    }
    catch (error) {
        console.error("Error verifying wallet signature:", error);
        return false;
    }
};
exports.verifyWalletSignature = verifyWalletSignature;
// Helper function to create the message for signing
const createSignMessage = (nonce) => {
    return `Sign this message for authenticating with SOLess\nNonce: ${nonce}`;
};
exports.createSignMessage = createSignMessage;
// Helper function to generate a nonce
const generateNonce = () => {
    return (Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15));
};
exports.generateNonce = generateNonce;
// Function to verify JWT token
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
