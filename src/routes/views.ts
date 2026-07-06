// Server-rendered HTML pages ("components" in the traditional web sense).
// Each function returns a string; the wrapper adds shared header/footer.
import { Router } from "express";
import { prisma } from "../db.js";
import { renderDashboard } from "../views/dashboard.js";
import { renderFeedbackDetail } from "../views/feedbackDetail.js";
import { renderAdminRules } from "../views/adminRules.js";
import { renderWidget } from "../views/widget.js";
import { renderLogin } from "../views/login.js";

const router = Router();

// 1. Public embeddable widget
router.get("/widget", (_req, res) => res.type("html").send(renderWidget()));

// 2. Login page
router.get("/login", (_req, res) => res.type("html").send(renderLogin()));

// 3. Triage dashboard (renders empty shell; client fetches /api/feedback with the token)
router.get("/", async (_req, res) => {
  // For simplicity render the dashboard shell + a small inline script to fetch items with a token from localStorage.
  res.type("html").send(renderDashboard());
});

// 4. Feedback detail — server renders a shell; client fetches /api/feedback/:id
router.get("/feedback/:id", async (_req, res) => {
  res.type("html").send(renderFeedbackDetail());
});

// 5. Admin rules manager
router.get("/admin/rules", async (_req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  res.type("html").send(renderAdminRules({ tags }));
});

export default router;
