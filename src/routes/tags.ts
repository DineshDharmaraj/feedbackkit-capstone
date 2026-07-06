import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth(), async (_req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  res.json({ data: tags });
});

router.post("/", requireAuth({ role: "admin" }), async (req, res) => {
  const { name, color } = req.body ?? {};
  if (typeof name !== "string" || typeof color !== "string") {
    return res.status(400).json({ error: "name and color required" });
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return res.status(400).json({ error: "color must be #rrggbb hex" });
  }
  try {
    const created = await prisma.tag.create({ data: { name: name.trim(), color } });
    return res.status(201).json(created);
  } catch {
    return res.status(409).json({ error: "tag name must be unique" });
  }
});

export default router;
