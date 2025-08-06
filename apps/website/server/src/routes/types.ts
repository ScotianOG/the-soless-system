// src/server/routes/types.ts
import { Request } from "express";
import { PrismaClient } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    wallet: string;
  };
}

export interface RouteContext {
  prisma: PrismaClient;
}
