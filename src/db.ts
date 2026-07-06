import { PrismaClient } from "@prisma/client";

// Singleton — safe for hot-reload in dev
declare global { var __prisma__: PrismaClient | undefined }
export const prisma = globalThis.__prisma__ ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.__prisma__ = prisma;
