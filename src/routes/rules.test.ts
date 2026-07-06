import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { hashPassword, signToken } from "../auth.js";

const app = createApp();
let adminToken = "";
let triagerToken = "";
let tagId = 0;

beforeAll(async () => {
  await prisma.tagRule.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({
    data: { email: "adm@x.com", name: "A", passwordHash: await hashPassword("password"), role: "admin" },
  });
  const triager = await prisma.user.create({
    data: { email: "tri@x.com", name: "T", passwordHash: await hashPassword("password"), role: "triager" },
  });
  adminToken = signToken(admin);
  triagerToken = signToken(triager);

  const t = await prisma.tag.create({ data: { name: "bug", color: "#ef4444" } });
  tagId = t.id;
});

afterAll(async () => { await prisma.$disconnect(); });

describe("POST /api/rules", () => {
  it("triager gets 403", async () => {
    const r = await request(app).post("/api/rules")
      .set("authorization", `Bearer ${triagerToken}`)
      .send({ pattern: "(broken)", tagId });
    expect(r.status).toBe(403);
  });

  it("admin can add a valid rule", async () => {
    const r = await request(app).post("/api/rules")
      .set("authorization", `Bearer ${adminToken}`)
      .send({ pattern: "(broken|crash)", tagId, weight: 2 });
    expect(r.status).toBe(201);
    expect(r.body.pattern).toBe("(broken|crash)");
  });

  it("rejects invalid regex with 400", async () => {
    const r = await request(app).post("/api/rules")
      .set("authorization", `Bearer ${adminToken}`)
      .send({ pattern: "[unclosed", tagId });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/invalid regex/);
  });
});
