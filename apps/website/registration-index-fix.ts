// Fixed src/routes/registration/index.ts
import { Router } from "express";
import { register } from "./register";
import { getRegistrationStatus } from "./getStatus";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/errorHandler";

const router = Router();

// Registration endpoints
router.post("/register", register);

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    try {
      const status = await getRegistrationStatus(prisma);
      res.json(status);
    } catch (error) {
      console.error("Registration status error:", error);
      res.status(500).json({
        error: "Failed to get registration status",
        correlationId: req.correlationId,
      });
    }
  })
);

export const registrationRouter = router;
