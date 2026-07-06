import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth({ role: "admin" }), async (_req, res) => {
  const rules = await prisma.tagRule.findMany({ include: { tag: true }, orderBy: { id: "asc" } });
  res.json({ data: rules });
});

router.post("/", requireAuth({ role: "admin" }), async (req, res) => {
  const { pattern, tagId, weight } = req.body ?? {};
  if (typeof pattern !== "string" || typeof tagId !== "number") {
    return res.status(400).json({ error: "pattern (string) and tagId (number) required" });
  }
  try {
    new RegExp(pattern, "i"); // validate before insert — never store an uncompilable regex
  } catch (e: any) {
    return res.status(400).json({ error: `invalid regex: ${e.message}` });
  }
  const w = typeof weight === "number" && weight >= 1 ? weight : 1;
  const created = await prisma.tagRule.create({ data: { pattern, tagId, weight: w } });
  return res.status(201).json(created);
});

router.delete("/:id", requireAuth({ role: "admin" }), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  try {
    await prisma.tagRule.delete({ where: { id } });
    return res.json({ ok: true });
  } catch {
    return res.status(404).json({ error: "not found" });
  }
});

export default router;
