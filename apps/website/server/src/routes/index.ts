import { Router } from "express";
import { activityRouter } from "./activity";
import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { verificationRouter } from "./verifications";
import { webhookRouter } from "./webhooks";
import { contestRouter } from "./contests";
import { inviteRouter } from "./invites";
import { statsRouter } from "./stats";
import { registrationRouter } from "./registration";
import { chatbotRouter } from "./chatbot";
import { betaRouter } from "./beta";
import { adminRouter } from "./admin";

console.log("LOADING MAIN ROUTES");
console.log("adminRouter type:", typeof adminRouter);
console.log("adminRouter is Router?", adminRouter && typeof adminRouter === 'function');

const router = Router();

// Activity routes
router.use("/activity", activityRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/verifications", verificationRouter);
router.use("/webhooks", webhookRouter);
router.use("/contests", contestRouter);
router.use("/invites", inviteRouter);
router.use("/stats", statsRouter);
router.use("/registration", registrationRouter);
router.use("/chatbot", chatbotRouter);
router.use("/beta", betaRouter);

console.log("MOUNTING ADMIN ROUTER AT /admin");
router.use("/admin", adminRouter);
console.log("ADMIN ROUTER MOUNTED");

export default router;
