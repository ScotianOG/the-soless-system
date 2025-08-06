import { Router, Request, Response, RequestHandler } from "express";
import { getUser } from "./getUser";
import { validateRequest } from "../../middleware/validation";
import { CommonSchemas } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/errorHandler";
import { authenticateUser } from "../../middleware/auth";
import { z } from "zod";

const router = Router();

// Validation schemas
const getUserParamsSchema = z.object({
  walletAddress: CommonSchemas.walletAddress,
});

const getUserBodySchema = z.object({
  wallet: CommonSchemas.walletAddress,
});

// Get user profile by wallet address (GET method)
router.get(
  "/:walletAddress",
  validateRequest(getUserParamsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    return getUser(req, res);
  })
);

// Get user profile by wallet address (POST method)
router.post(
  "/get",
  validateRequest(getUserBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { wallet } = req.body;
    req.params.walletAddress = wallet;
    return getUser(req, res);
  })
);

// Protected user profile endpoint (requires authentication)
router.get(
  "/profile",
  authenticateUser,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: "User profile endpoint",
      user: req.user,
      correlationId: req.correlationId,
    });
  })
);

// Export as named export to match other routers
export const usersRouter = router;
