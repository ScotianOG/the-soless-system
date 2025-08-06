"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contestRouter = void 0;
// src/routes/contests/index.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const errorHandler_1 = require("../../middleware/errorHandler");
const validation_1 = require("../../middleware/validation");
const getCurrentContest_1 = require("./getCurrentContest");
const getContestEntries_1 = require("./getContestEntries");
const getContestLeaderboard_1 = require("./getContestLeaderboard");
const getContestRewards_1 = require("./getContestRewards");
const claimReward_1 = require("./claimReward");
const startContest_1 = require("./startContest");
const endContest_1 = require("./endContest");
const getAllContests_1 = require("./getAllContests");
const distributeRewards_1 = require("./distributeRewards");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.contestRouter = router;
const prisma = new client_1.PrismaClient();
// Validation schemas
const walletSchema = zod_1.z.object({
    wallet: zod_1.z
        .string()
        .min(32)
        .max(44)
        .regex(/^[A-Za-z0-9]+$/),
});
const contestIdSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
const claimRewardSchema = zod_1.z.object({
    rewardId: zod_1.z.string().uuid(),
});
const startContestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    endTime: zod_1.z.string().datetime(),
    rules: zod_1.z.object({}).optional(),
});
// Get all contests (admin only)
router.get("/", auth_1.requireAuth, async (req, res, next) => {
    try {
        const contests = await (0, getAllContests_1.getAllContests)(prisma);
        res.json({ contests });
    }
    catch (error) {
        next(error);
    }
});
// Get current contest status
router.get("/current", async (req, res, next) => {
    try {
        const contest = await (0, getCurrentContest_1.getCurrentContest)(prisma);
        res.json({ contest });
    }
    catch (error) {
        next(error);
    }
});
// Get user's contest entries
router.get("/entries/:wallet", auth_1.requireAuth, (0, validation_1.validateRequest)(walletSchema), async (req, res, next) => {
    try {
        const entries = await (0, getContestEntries_1.getContestEntries)(prisma, req.params.wallet);
        res.json({ entries });
    }
    catch (error) {
        next(error);
    }
});
// Get contest leaderboard
router.get("/:id/leaderboard", (0, validation_1.validateRequest)(contestIdSchema), async (req, res, next) => {
    try {
        const leaderboard = await (0, getContestLeaderboard_1.getContestLeaderboard)(prisma, req.params.id);
        res.json({ leaderboard });
    }
    catch (error) {
        next(error);
    }
});
// Get contest rewards
router.get("/rewards/:wallet", auth_1.requireAuth, (0, validation_1.validateRequest)(walletSchema), async (req, res, next) => {
    try {
        const rewards = await (0, getContestRewards_1.getContestRewards)(prisma, req.params.wallet);
        res.json({ rewards });
    }
    catch (error) {
        next(error);
    }
});
// Claim reward
router.post("/rewards/claim", auth_1.requireAuth, (0, validation_1.validateRequest)(claimRewardSchema), async (req, res, next) => {
    try {
        const { rewardId } = req.body;
        const result = await (0, claimReward_1.claimReward)(prisma, rewardId);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
// Admin routes
router.post("/start", auth_1.requireAuth, (0, validation_1.validateRequest)(startContestSchema), async (req, res, next) => {
    try {
        const { name, endTime, rules } = req.body;
        const contest = await (0, startContest_1.startContest)(prisma, { name, endTime, rules });
        res.json({ contest });
    }
    catch (error) {
        next(error);
    }
});
router.post("/:id/end", auth_1.requireAuth, (0, validation_1.validateRequest)(contestIdSchema), async (req, res, next) => {
    try {
        const contest = await (0, endContest_1.endContest)(prisma, req.params.id);
        res.json({ contest });
    }
    catch (error) {
        next(error);
    }
});
// Distribute rewards for a contest (admin only)
router.post("/:id/distribute-rewards", auth_1.requireAuth, (0, validation_1.validateRequest)(contestIdSchema), async (req, res, next) => {
    try {
        const result = await (0, distributeRewards_1.distributeRewards)(prisma, req.params.id);
        res.json({ result });
    }
    catch (error) {
        next(error);
    }
});
// Apply error handler middleware
router.use(errorHandler_1.errorHandler);
exports.default = router;
