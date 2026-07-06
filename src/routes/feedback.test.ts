import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";

const app = createApp();
let token = "";
let feedbackId = 0;

beforeAll(async () => {
  await prisma.feedback.deleteMany({});
  await prisma.tagRule.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});
  const reg = await request(app).post("/api/auth/register")
    .send({ email: "t@x.com", password: "hunter22", name: "T" });
  token = reg.body.token;
});

afterAll(async () => { await prisma.$disconnect(); });

describe("POST /api/feedback", () => {
  it("accepts anonymous submissions", async () => {
    const r = await request(app).post("/api/feedback").send({ title: "Hello", body: "world" });
    expect(r.status).toBe(201);
    expect(r.body.title).toBe("Hello");
    feedbackId = r.body.id;
  });

  it("rejects missing fields with 400", async () => {
    const r = await request(app).post("/api/feedback").send({ title: "only title" });
    expect(r.status).toBe(400);
  });

  it("rejects title over 200 chars", async () => {
    const r = await request(app).post("/api/feedback").send({ title: "a".repeat(201), body: "ok" });
    expect(r.status).toBe(400);
  });
});

describe("GET /api/feedback", () => {
  it("requires auth", async () => {
    const r = await request(app).get("/api/feedback");
    expect(r.status).toBe(401);
  });

  it("returns feedback list for authenticated triager", async () => {
    const r = await request(app).get("/api/feedback").set("authorization", `Bearer ${token}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/feedback/:id/status", () => {
  it("closes an open feedback", async () => {
    const r = await request(app).patch(`/api/feedback/${feedbackId}/status`)
      .set("authorization", `Bearer ${token}`)
      .send({ status: "closed" });
    expect(r.status).toBe(200);
    expect(r.body.status).toBe("closed");
  });

  it("rejects invalid status with 400", async () => {
    const r = await request(app).patch(`/api/feedback/${feedbackId}/status`)
      .set("authorization", `Bearer ${token}`)
      .send({ status: "garbage" });
    expect(r.status).toBe(400);
  });

  it("returns 404 for unknown id", async () => {
    const r = await request(app).patch("/api/feedback/999999/status")
      .set("authorization", `Bearer ${token}`)
      .send({ status: "closed" });
    expect(r.status).toBe(404);
  });
});
