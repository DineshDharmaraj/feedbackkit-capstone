import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";

const app = createApp();

beforeAll(async () => {
  await prisma.feedback.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => { await prisma.$disconnect(); });

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const r = await request(app).post("/api/auth/register")
      .send({ email: "a@x.com", password: "hunter22", name: "Alice" });
    expect(r.status).toBe(201);
    expect(r.body.token).toBeDefined();
    expect(r.body.user).toMatchObject({ email: "a@x.com", name: "Alice", role: "triager" });
    expect(r.body.user.passwordHash).toBeUndefined();
  });

  it("rejects short passwords with 400", async () => {
    const r = await request(app).post("/api/auth/register")
      .send({ email: "b@x.com", password: "short", name: "B" });
    expect(r.status).toBe(400);
  });

  it("rejects duplicate emails with 409", async () => {
    const r = await request(app).post("/api/auth/register")
      .send({ email: "a@x.com", password: "hunter22", name: "Alice2" });
    expect(r.status).toBe(409);
  });

  it("rejects non-string body with 400", async () => {
    const r = await request(app).post("/api/auth/register").send({ email: 1, password: 2, name: 3 });
    expect(r.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token on valid credentials", async () => {
    const r = await request(app).post("/api/auth/login").send({ email: "a@x.com", password: "hunter22" });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
  });

  it("returns 401 on wrong password", async () => {
    const r = await request(app).post("/api/auth/login").send({ email: "a@x.com", password: "wrong" });
    expect(r.status).toBe(401);
  });

  it("returns 401 on unknown email (timing-safe)", async () => {
    const r = await request(app).post("/api/auth/login").send({ email: "nobody@x.com", password: "any" });
    expect(r.status).toBe(401);
  });
});
