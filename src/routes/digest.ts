import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

// GET /api/digest/weekly — tag totals + top-3 items per tag for the last 7 days
router.get("/weekly", requireAuth(), async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const feedback = await prisma.feedback.findMany({
    where: { createdAt: { gte: since } },
    include: { tags: true },
  });

  const byTag: Record<string, { count: number; top: { id: number; title: string }[] }> = {};
  for (const f of feedback) {
    for (const t of f.tags) {
      byTag[t.name] ??= { count: 0, top: [] };
      byTag[t.name].count += 1;
      if (byTag[t.name].top.length < 3) byTag[t.name].top.push({ id: f.id, title: f.title });
    }
  }

  res.json({ since: since.toISOString(), tagTotals: byTag, totalItems: feedback.length });
});

export default router;
