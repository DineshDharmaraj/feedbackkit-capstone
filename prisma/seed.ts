import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Users
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "triager",
    },
  });
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
    },
  });

  // Tags
  const bugTag = await prisma.tag.upsert({
    where: { name: "bug" },
    update: {},
    create: { name: "bug", color: "#ef4444" },
  });
  const featureTag = await prisma.tag.upsert({
    where: { name: "feature" },
    update: {},
    create: { name: "feature", color: "#38bdf8" },
  });
  const billingTag = await prisma.tag.upsert({
    where: { name: "billing" },
    update: {},
    create: { name: "billing", color: "#a855f7" },
  });

  // Tag rules
  const existingRules = await prisma.tagRule.count();
  if (existingRules === 0) {
    await prisma.tagRule.createMany({
      data: [
        { pattern: "(broken|crash|error|bug)", tagId: bugTag.id, weight: 2 },
        { pattern: "(feature|would love|please add)", tagId: featureTag.id, weight: 1 },
        { pattern: "(payment|checkout|invoice|billing)", tagId: billingTag.id, weight: 2 },
      ],
    });
  }

  // Sample feedback
  const samples = [
    { title: "Login button doesn't work on Safari", body: "Clicking login just refreshes the page — nothing happens." },
    { title: "Would love dark mode", body: "Please add a dark theme, my eyes are dying." },
    { title: "Checkout is broken", body: "Payment fails at step 3 with a 500 error." },
    { title: "Great app!", body: "Just wanted to say thanks, the new dashboard is fast." },
    { title: "Feature request: keyboard shortcuts", body: "Would be great to navigate lists with j/k." },
    { title: "Crash when uploading large file", body: "Anything over 10 MB crashes the tab." },
    { title: "Billing invoice shows wrong total", body: "The total is off by two decimal places." },
    { title: "Slow dashboard loading", body: "Takes 4-5 seconds after login." },
  ];
  for (const s of samples) {
    const existing = await prisma.feedback.findFirst({ where: { title: s.title } });
    if (!existing) {
      await prisma.feedback.create({
        data: { ...s, reporterId: alice.id },
      });
    }
  }

  console.log("Seeded:", { users: 2, tags: 3, rules: 3, feedback: samples.length });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
