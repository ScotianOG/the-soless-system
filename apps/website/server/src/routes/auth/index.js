"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const twitter_1 = require("./twitter");
const discord_1 = require("./discord");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
// Verify wallet authentication
router.post("/verify", auth_1.authenticateUser, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({
        message: "Authenticated successfully",
        correlationId: req.correlationId,
    });
}));
// Mount platform-specific auth routes
router.use("/twitter", twitter_1.twitterAuthRouter);
router.use("/discord", discord_1.discordAuthRouter);
exports.authRouter = router;
