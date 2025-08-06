import { Router, Request, Response } from "express";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// Simple test route
router.get("/test-minimal", requireAuth, (req: Request, res: Response) => {
  res.json({ message: "Minimal test route working" });
});

export { router as testMinimalRouter };
