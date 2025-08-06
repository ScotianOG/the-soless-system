import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as ed25519 from "@noble/ed25519";
import { PublicKey } from "@solana/web3.js";

// Admin wallet configuration from environment variables
const ADMIN_WALLETS = [
  process.env.SOLESS_ADMIN_WALLET_1,
  process.env.SOLESS_ADMIN_WALLET_2,
  process.env.ADMIN_WALLET_1,
  process.env.ADMIN_WALLET_2,
  process.env.DEV_ADMIN_WALLET,
  // Hardcoded fallbacks
  "8rYNzisESAJZAJGZiyosNkVb1tbrWhsgQkLgavj6Ytyj",
  "EJPvo6CPGC8Pj9p25zdyXqipQac4Bt1RXn9X4fQ9XnC4",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
].filter(Boolean);

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "SOLess_Admin_2025_Secure_Key_MinimumLength32Chars";

export interface AdminAuthCredentials {
  walletAddress: string;
  signature: number[] | string;
  message: string;
  timestamp: number;
  nonce: string;
  platform?: string;
}

export interface AdminAuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    wallet: string;
    isAdmin: boolean;
    platform: string;
    authenticatedAt: number;
  };
  error?: string;
}

/**
 * Check if a wallet address is authorized as admin
 */
export function isAdminWallet(walletAddress: string): boolean {
  return ADMIN_WALLETS.includes(walletAddress);
}

/**
 * Verify wallet signature using ed25519
 */
export async function verifyWalletSignature(
  walletAddress: string,
  signature: number[] | string,
  message: string
): Promise<boolean> {
  try {
    // Convert wallet address to public key
    const publicKey = new PublicKey(walletAddress);

    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);

    // Convert signature to Uint8Array if it's an array
    const signatureBytes =
      typeof signature === "string"
        ? new Uint8Array(JSON.parse(signature))
        : new Uint8Array(signature);

    // Verify signature
    return await ed25519.verify(
      signatureBytes,
      messageBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Generate admin JWT token
 */
export function generateAdminToken(
  walletAddress: string,
  platform: string = "presale.soless.app"
): string {
  const payload = {
    walletAddress,
    platform,
    role: "admin",
    isAdmin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  return jwt.sign(payload, ADMIN_JWT_SECRET);
}

/**
 * Verify admin JWT token
 */
export function verifyAdminToken(token: string): any {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET);
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Authenticate admin user with wallet signature
 */
export async function authenticateAdminWallet(
  credentials: AdminAuthCredentials
): Promise<AdminAuthResult> {
  try {
    const {
      walletAddress,
      signature,
      message,
      timestamp,
      platform = "presale.soless.app",
    } = credentials;

    // Check if wallet is authorized admin
    if (!isAdminWallet(walletAddress)) {
      return {
        success: false,
        error: "Wallet not authorized for admin access",
      };
    }

    // Validate timestamp (prevent replay attacks)
    const now = Date.now();
    const timeDiff = Math.abs(now - timestamp);

    if (timeDiff > 5 * 60 * 1000) {
      // 5 minutes
      return {
        success: false,
        error: "Authentication expired - please reconnect",
      };
    }

    // Verify signature
    const isValidSignature = await verifyWalletSignature(
      walletAddress,
      signature,
      message
    );
    if (!isValidSignature) {
      return {
        success: false,
        error: "Invalid signature",
      };
    }

    // Generate token
    const token = generateAdminToken(walletAddress, platform);

    return {
      success: true,
      token,
      user: {
        id: `admin-${walletAddress.slice(0, 8)}`,
        wallet: walletAddress,
        isAdmin: true,
        platform,
        authenticatedAt: timestamp,
      },
    };
  } catch (error) {
    console.error("Admin authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Middleware to require admin authentication
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Unauthorized - Admin access required",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAdminToken(token);

    if (!decoded || !decoded.isAdmin) {
      res.status(403).json({
        error: "Forbidden - Admin privileges required",
      });
      return;
    }

    // Add user info to request
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(401).json({
      error: "Authentication failed",
    });
  }
}

/**
 * Get admin wallet configuration
 */
export function getAdminWalletConfig() {
  return {
    totalAdminWallets: ADMIN_WALLETS.length,
    adminWallets: ADMIN_WALLETS,
    environmentConfigured: !!(
      process.env.SOLESS_ADMIN_WALLET_1 || process.env.ADMIN_WALLET_1
    ),
    authEnabled: process.env.ADMIN_AUTH_ENABLED === "true",
  };
}

// Export commonly used admin wallets for easy access
export const ADMIN_WALLET_ADDRESSES = ADMIN_WALLETS;
