import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest, User } from "../types";
import { verifyToken } from "../utils/auth";

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip authentication for OPTIONS requests
  if (req.method === "OPTIONS") {
    return next();
  }

  // Skip authentication for verification endpoints
  if (req.path.startsWith("/verifications/")) {
    return next();
  }

  // Try JWT token first (proper authentication)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          include: {
            telegramAccount: true,
            discordAccount: true,
            twitterAccount: true,
            streaks: true,
          },
        });

        if (user) {
          (req as AuthenticatedRequest).user = user as User;
          return next();
        }
      }
    } catch (error) {
      console.error("JWT verification error:", error);
    }
  }

  // Fallback to wallet address authentication (for backward compatibility)
  const walletAddress =
    (req.query.wallet as string) || (req.headers["x-wallet-address"] as string);

  if (!walletAddress) {
    res
      .status(401)
      .json({
        error: "Authentication required: provide JWT token or wallet address",
      });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { wallet: walletAddress },
      include: {
        telegramAccount: true,
        discordAccount: true,
        twitterAccount: true,
        streaks: true,
      },
    });

    // For new users, allow access to certain endpoints
    const allowedPaths = ["/users/get", "/stats"];
    if (!user && allowedPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    (req as AuthenticatedRequest).user = user as User;
    next();
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
}

// Optional auth middleware that doesn't require authentication
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.method === "OPTIONS") {
    return next();
  }

  const walletAddress =
    (req.query.wallet as string) || (req.headers["x-wallet-address"] as string);

  if (!walletAddress) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { wallet: walletAddress },
      include: {
        telegramAccount: true,
        discordAccount: true,
        twitterAccount: true,
        streaks: true,
      },
    });

    // If user exists, attach to request
    if (user) {
      (req as AuthenticatedRequest).user = user as User;
    }

    // Always continue for optional auth, even if user doesn't exist
    next();
  } catch (error) {
    console.error("Error in optional auth:", error);
    // Continue anyway for optional auth
    next();
  }
}

// Alias for authenticateUser for better semantic meaning in protected routes
export const requireAuth = authenticateUser;
