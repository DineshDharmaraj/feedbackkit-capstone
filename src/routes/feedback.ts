import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { tag as runTagger, Rule } from "../tagger.js";

const router = Router();

// Public — submit feedback via widget (auth optional, anonymous is allowed)
router.post("/", requireAuth({ optional: true }), async (req, res) => {
  const { title, body } = req.body ?? {};
  if (typeof title !== "string" || typeof body !== "string") {
    return res.status(400).json({ error: "title and body are required strings" });
  }
  if (title.trim().length === 0) return res.status(400).json({ error: "title cannot be empty" });
  if (title.length > 200) return res.status(400).json({ error: "title too long (max 200)" });
  if (body.length > 5000) return res.status(400).json({ error: "body too long (max 5000)" });

  // Auto-tag on ingest
  const rules = (await prisma.tagRule.findMany()) as Rule[];
  const { tagIds } = runTagger(`${title}\n${body}`, rules);

  const created = await prisma.feedback.create({
    data: {
      title: title.trim(),
      body: body.trim(),
      reporterId: req.user?.sub ?? null,
      tags: tagIds.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: { tags: true },
  });
  return res.status(201).json(created);
});

// Triager — list with filters
router.get("/", requireAuth(), async (req, res) => {
  const status = (req.query.status as string) === "closed" ? "closed" : "open";
  const items = await prisma.feedback.findMany({
    where: { status },
    include: { tags: true, reporter: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ data: items });
});

router.get("/:id", requireAuth(), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid id" });
  const item = await prisma.feedback.findUnique({
    where: { id },
    include: { tags: true, reporter: { select: { id: true, name: true } } },
  });
  if (!item) return res.status(404).json({ error: "not found" });
  return res.json({ data: item });
});

// Toggle status
router.patch("/:id/status", requireAuth(), async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status;
  if (status !== "open" && status !== "closed") {
    return res.status(400).json({ error: "status must be 'open' or 'closed'" });
  }
  try {
    const updated = await prisma.feedback.update({ where: { id }, data: { status } });
    return res.json(updated);
  } catch {
    return res.status(404).json({ error: "not found" });
  }
});

// Manual tag / untag
router.post("/:id/tags", requireAuth(), async (req, res) => {
  const id = Number(req.params.id);
  const tagId = Number(req.body?.tagId);
  if (!Number.isInteger(id) || !Number.isInteger(tagId)) {
    return res.status(400).json({ error: "id and tagId must be integers" });
  }
  await prisma.feedback.update({ where: { id }, data: { tags: { connect: { id: tagId } } } });
  return res.json({ ok: true });
});

router.delete("/:id/tags/:tagId", requireAuth(), async (req, res) => {
  const id = Number(req.params.id);
  const tagId = Number(req.params.tagId);
  if (!Number.isInteger(id) || !Number.isInteger(tagId)) {
    return res.status(400).json({ error: "id and tagId must be integers" });
  }
  await prisma.feedback.update({ where: { id }, data: { tags: { disconnect: { id: tagId } } } });
  return res.json({ ok: true });
});

export default router;
