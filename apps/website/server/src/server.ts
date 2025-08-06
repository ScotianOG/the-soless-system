import express, { Request, Response } from "express";
import morgan from "morgan";
import router from "./routes";
import { prisma } from "./lib/prisma";
import {
  errorHandler,
  correlationIdMiddleware,
  notFoundHandler,
} from "./middleware/errorHandler";

console.log("LOADING SERVER.TS");

const app = express();

// Correlation ID middleware (must be first)
app.use(correlationIdMiddleware);

// Basic middleware
app.use(express.json());
app.use(morgan("dev"));

console.log("MOUNTING MAIN ROUTER");
console.log("router type:", typeof router);
console.log("router is function?", typeof router === 'function');

// Routes
app.use("/", router);

console.log("MAIN ROUTER MOUNTED");

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId,
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
