import express, { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { logger } from "./logger.js";
import authRoutes from "./routes/auth.js";
import feedbackRoutes from "./routes/feedback.js";
import tagRoutes from "./routes/tags.js";
import ruleRoutes from "./routes/rules.js";
import digestRoutes from "./routes/digest.js";
import viewRoutes from "./routes/views.js";

export function createApp() {
  const app = express();

  // Body size cap — mitigates unbounded-payload DoS
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  // Request-id + structured request log
  app.use((req, res, next) => {
    const rid = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    res.setHeader("x-request-id", rid);
    (req as any).id = rid;
    const start = Date.now();
    res.on("finish", () => {
      logger.info(
        { req_id: rid, method: req.method, url: req.url, status: res.statusCode, duration_ms: Date.now() - start },
        "req"
      );
    });
    next();
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime_s: process.uptime(), timestamp: new Date().toISOString() });
  });

  // API
  app.use("/api/auth", authRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/rules", ruleRoutes);
  app.use("/api/digest", digestRoutes);

  // Views (server-rendered HTML pages/components)
  app.use("/", viewRoutes);

  // 404 for unmatched API paths
  app.use("/api", (_req, res) => res.status(404).json({ error: "not found" }));

  // Global error handler — never leak stack traces
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const rid = (req as any).id;
    logger.error({ err, req_id: rid, method: req.method, url: req.url }, "unhandled");
    const status = typeof err?.status === "number" ? err.status : 500;
    res.status(status).json({
      error: err?.expose ? err.message : "internal server error",
      requestId: rid,
    });
  });

  return app;
}
