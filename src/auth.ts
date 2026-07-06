import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    logger.fatal("JWT_SECRET is required in production");
    process.exit(1);
  }
  logger.warn("JWT_SECRET not set; using dev fallback. Do NOT deploy this way.");
}

const TTL = "7d";

export interface AuthPayload {
  sub: number;
  email: string;
  role: "triager" | "admin";
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: { id: number; email: string; role: string }) {
  const opts = { expiresIn: TTL } as jwt.SignOptions;
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, opts);
}

declare global {
  namespace Express {
    interface Request { user?: AuthPayload }
  }
}

export function requireAuth(opts: { optional?: boolean; role?: "admin" } = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      if (opts.optional) return next();
      return res.status(401).json({ error: "missing or malformed Authorization header" });
    }
    try {
      const payload = jwt.verify(token, SECRET) as AuthPayload;
      if (opts.role === "admin" && payload.role !== "admin") {
        return res.status(403).json({ error: "admin only" });
      }
      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ error: "invalid or expired token" });
    }
  };
}
