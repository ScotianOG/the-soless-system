"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const getUser_1 = require("./getUser");
const validation_1 = require("../../middleware/validation");
const validation_2 = require("../../middleware/validation");
const errorHandler_1 = require("../../middleware/errorHandler");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Validation schemas
const getUserParamsSchema = zod_1.z.object({
    walletAddress: validation_2.CommonSchemas.walletAddress,
});
const getUserBodySchema = zod_1.z.object({
    wallet: validation_2.CommonSchemas.walletAddress,
});
// Get user profile by wallet address (GET method)
router.get("/:walletAddress", (0, validation_1.validateRequest)(getUserParamsSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    return (0, getUser_1.getUser)(req, res);
}));
// Get user profile by wallet address (POST method)
router.post("/get", (0, validation_1.validateRequest)(getUserBodySchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { wallet } = req.body;
    req.params.walletAddress = wallet;
    return (0, getUser_1.getUser)(req, res);
}));
// Export as named export to match other routers
exports.usersRouter = router;
