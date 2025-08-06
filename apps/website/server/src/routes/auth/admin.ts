import { Router } from "express";
import {
  authenticateAdminWallet,
  verifyAdminToken,
  getAdminWalletConfig,
  requireAdminAuth,
  AdminAuthCredentials,
} from "../../services/AdminWalletService";
import { asyncHandler } from "../../middleware/errorHandler";

const router = Router();

/**
 * POST /api/auth/verify-admin
 * Verify admin wallet signature and return JWT token
 */
router.post(
  "/verify-admin",
  asyncHandler(async (req, res) => {
    try {
      const { walletAddress, signature, message, timestamp, nonce, platform } =
        req.body;

      // Validate required fields
      if (!walletAddress || !signature || !message || !timestamp || !nonce) {
        return res.status(400).json({
          error:
            "Missing required fields: walletAddress, signature, message, timestamp, nonce",
        });
      }

      const credentials: AdminAuthCredentials = {
        walletAddress,
        signature,
        message,
        timestamp,
        nonce,
        platform: platform || "presale.soless.app",
      };

      const result = await authenticateAdminWallet(credentials);

      if (!result.success) {
        return res.status(401).json({
          error: result.error,
        });
      }

      // Log successful authentication
      console.log(
        `✅ Admin authenticated: ${walletAddress} on ${credentials.platform}`
      );

      res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("Admin verification error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  })
);

/**
 * POST /api/auth/verify-admin-token
 * Verify existing admin JWT token
 */
router.post(
  "/verify-admin-token",
  asyncHandler(async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: "Token required",
        });
      }

      const decoded = verifyAdminToken(token);

      if (!decoded || !decoded.isAdmin) {
        return res.status(401).json({
          error: "Invalid or expired token",
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: decoded.id || `admin-${decoded.walletAddress?.slice(0, 8)}`,
          wallet: decoded.walletAddress,
          isAdmin: decoded.isAdmin,
          platform: decoded.platform,
          authenticatedAt: decoded.iat * 1000,
        },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  })
);

/**
 * GET /api/auth/admin-config
 * Get admin wallet configuration (public endpoint)
 */
router.get(
  "/admin-config",
  asyncHandler(async (req, res) => {
    const config = getAdminWalletConfig();

    // Return sanitized config (don't expose actual wallet addresses in production)
    res.status(200).json({
      totalAdminWallets: config.totalAdminWallets,
      environmentConfigured: config.environmentConfigured,
      authEnabled: config.authEnabled,
      // Only expose wallet addresses in development
      ...(process.env.NODE_ENV === "development" && {
        adminWallets: config.adminWallets,
      }),
    });
  })
);

/**
 * GET /api/auth/admin-status
 * Check admin authentication status (protected endpoint)
 */
router.get("/admin-status", requireAdminAuth, (req: any, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted",
    user: req.user,
    timestamp: Date.now(),
  });
});

/**
 * POST /api/auth/admin-logout
 * Logout admin (client-side token cleanup)
 */
router.post(
  "/admin-logout",
  asyncHandler(async (req, res) => {
    // Since we're using stateless JWT tokens, logout is primarily client-side
    // In a production system, you might want to implement token blacklisting

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

export default router;
