// src/utils/auth.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export const generateToken = (payload: { id: string; wallet: string }) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyWalletSignature = async (
  wallet: string,
  signature: string,
  message: string
): Promise<boolean> => {
  try {
    // Convert the message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);

    // Convert the signature from base58 to Uint8Array
    const signatureBytes = bs58.decode(signature);

    // Convert the wallet address to a PublicKey
    const publicKey = new PublicKey(wallet);

    // Verify the signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );

    return isValid;
  } catch (error) {
    console.error("Error verifying wallet signature:", error);
    return false;
  }
};

// Helper function to create the message for signing
export const createSignMessage = (nonce: string): string => {
  return `Sign this message for authenticating with SOLess\nNonce: ${nonce}`;
};

// Helper function to generate a nonce
export const generateNonce = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Interface for decoded JWT token
export interface JWTPayload {
  id: string;
  wallet: string;
  iat: number;
  exp: number;
}

// Function to verify JWT token
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};
