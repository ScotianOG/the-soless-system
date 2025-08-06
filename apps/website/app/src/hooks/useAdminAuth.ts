import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { validateAdminAccess } from "../utils/wallet";

export interface AdminUser {
  id: string;
  wallet: string;
  isAdmin: boolean;
  platform: string;
  authenticatedAt: number;
}

export interface AdminAuthResult {
  success: boolean;
  token?: string;
  user?: AdminUser;
  error?: string;
}

export interface AdminAuthHook {
  // State
  isAdminAuthenticated: boolean;
  isAdminAuthorized: boolean;
  adminUser: AdminUser | null;
  isAuthenticating: boolean;
  authError: string | null;

  // Actions
  authenticateAdmin: () => Promise<AdminAuthResult>;
  logoutAdmin: () => void;
  checkAdminToken: () => Promise<boolean>;
}

const ADMIN_TOKEN_KEY = "soless_admin_token";
const ADMIN_USER_KEY = "soless_admin_user";

export function useAdminAuth(): AdminAuthHook {
  const { publicKey, signMessage, connected } = useWallet();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if current wallet is authorized admin
  const isAdminAuthorized = publicKey
    ? validateAdminAccess(publicKey.toBase58())
    : false;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      const storedUser = localStorage.getItem(ADMIN_USER_KEY);

      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const isValid = await checkStoredToken(storedToken);

          if (isValid) {
            setIsAdminAuthenticated(true);
            setAdminUser(user);
          } else {
            // Clear invalid stored data
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
          }
        } catch (error) {
          console.error("Error initializing admin auth:", error);
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
        }
      }
    };

    initializeAuth();
  }, []);

  // Check stored token validity
  const checkStoredToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify-admin-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  };

  // Authenticate admin with wallet signature
  const authenticateAdmin = useCallback(async (): Promise<AdminAuthResult> => {
    if (!connected || !publicKey || !signMessage) {
      const error = "Wallet not connected or does not support message signing";
      setAuthError(error);
      return { success: false, error };
    }

    if (!isAdminAuthorized) {
      const error = "Wallet not authorized for admin access";
      setAuthError(error);
      return { success: false, error };
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const walletAddress = publicKey.toBase58();
      const timestamp = Date.now();
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Create authentication message
      const message = `Sign in to SOLess Ecosystem\nPlatform: presale.soless.app\nRole: Admin\nTimestamp: ${timestamp}\nNonce: ${nonce}`;

      // Sign message with wallet
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      // Send authentication request
      const response = await fetch("/api/auth/verify-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          signature: Array.from(signature),
          message,
          timestamp,
          nonce,
          platform: "presale.soless.app",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Authentication failed: ${response.statusText}`
        );
      }

      // Store authentication data
      localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(result.user));

      setIsAdminAuthenticated(true);
      setAdminUser(result.user);
      setAuthError(null);

      console.log("✅ Admin authenticated successfully:", result.user);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      console.error("Admin authentication error:", error);
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsAuthenticating(false);
    }
  }, [connected, publicKey, signMessage, isAdminAuthorized]);

  // Check admin token validity
  const checkAdminToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (!token) {
      return false;
    }

    return await checkStoredToken(token);
  }, []);

  // Logout admin
  const logoutAdmin = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    setAuthError(null);

    // Optional: Call logout endpoint
    fetch("/api/auth/admin-logout", { method: "POST" }).catch(console.error);
  }, []);

  // Clear auth state when wallet disconnects
  useEffect(() => {
    if (!connected && isAdminAuthenticated) {
      logoutAdmin();
    }
  }, [connected, isAdminAuthenticated, logoutAdmin]);

  return {
    isAdminAuthenticated,
    isAdminAuthorized,
    adminUser,
    isAuthenticating,
    authError,
    authenticateAdmin,
    logoutAdmin,
    checkAdminToken,
  };
}
