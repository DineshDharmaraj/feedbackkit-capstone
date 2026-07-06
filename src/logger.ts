import pino from "pino";

const REDACT = ["req.headers.authorization", "req.body.password", "*.password", "*.passwordHash"];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: { paths: REDACT, censor: "[REDACTED]" },
  transport: process.env.NODE_ENV === "production"
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
});
