import { Router, Request, Response } from "express";

console.log("LOADING MINIMAL ADMIN ROUTER");

const router = Router();

// Extremely simple test route
router.get("/minimal-test", (req: Request, res: Response) => {
  console.log("MINIMAL TEST ROUTE HIT");
  res.json({ message: "Minimal test route works" });
});

console.log("MINIMAL ADMIN ROUTER CONFIGURED");

export { router as minimalAdminRouter };
