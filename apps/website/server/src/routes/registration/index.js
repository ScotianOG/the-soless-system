"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationRouter = void 0;
// src/routes/registration/index.ts
const express_1 = require("express");
const register_1 = require("./register");
const getStatus_1 = require("./getStatus");
const router = (0, express_1.Router)();
// Registration endpoints
router.post('/register', register_1.register);
router.get('/status', async (req, res) => {
    const status = await (0, getStatus_1.getRegistrationStatus)(res.locals.prisma);
    res.json(status);
});
exports.registrationRouter = router;
