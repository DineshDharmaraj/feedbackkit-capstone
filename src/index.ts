import { createApp } from "./app.js";
import { logger } from "./logger.js";

const PORT = Number(process.env.PORT) || 3459;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "FeedbackKit listening");
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => { logger.fatal({ err }, "uncaught"); process.exit(1); });
process.on("unhandledRejection", (err) => { logger.fatal({ err }, "unhandled rejection"); process.exit(1); });
