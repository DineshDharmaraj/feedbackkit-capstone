import { Router } from "express";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword, signToken } from "../auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
    return res.status(400).json({ error: "email, password, name are required strings" });
  }
  if (password.length < 8) return res.status(400).json({ error: "password must be at least 8 characters" });
  if (name.trim().length === 0) return res.status(400).json({ error: "name cannot be empty" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "email already registered" });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name: name.trim(), passwordHash, role: "triager" },
  });
  const token = signToken(user);
  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

// POST /api/auth/login  (timing-safe against user enumeration)
const DUMMY_HASH = "$2a$10$" + "x".repeat(53);
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password required" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: "invalid credentials" });
  const token = signToken(user);
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default router;
