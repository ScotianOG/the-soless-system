"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Correlation ID middleware (must be first)
app.use(errorHandler_1.correlationIdMiddleware);
// Basic middleware
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// Routes
app.use("/", routes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
    });
});
// 404 handler for unmatched routes
app.use(errorHandler_1.notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
