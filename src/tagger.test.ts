import { describe, it, expect } from "vitest";
import { tag, Rule } from "./tagger.js";

const RULES: Rule[] = [
  { id: 1, pattern: "(broken|crash|error)", tagId: 100, weight: 2 },
  { id: 2, pattern: "(feature|please add)", tagId: 200, weight: 1 },
  { id: 3, pattern: "(payment|checkout|billing)", tagId: 300, weight: 2 },
  { id: 4, pattern: "[invalid(regex", tagId: 999, weight: 5 }, // malformed
];

describe("tag()", () => {
  it("returns empty when no rules match", () => {
    expect(tag("all good here", RULES)).toEqual({ tagIds: [], matches: [] });
  });

  it("applies a tag when a single rule matches", () => {
    const r = tag("checkout is broken", RULES);
    expect(r.tagIds).toContain(100); // bug
    expect(r.tagIds).toContain(300); // billing
    expect(r.matches).toHaveLength(2);
  });

  it("skips malformed regex without crashing", () => {
    // rule 4 has a broken pattern — must not throw and must not tag anything
    const r = tag("anything", RULES);
    expect(r.tagIds).not.toContain(999);
  });

  it("case-insensitive by default", () => {
    const r = tag("BROKEN screen", RULES);
    expect(r.tagIds).toContain(100);
  });

  it("respects a custom threshold", () => {
    // With threshold 3, single-rule matches (weight 2) fall below
    const r = tag("checkout is broken", RULES, { threshold: 3 });
    // "broken" (w=2) + "checkout" (w=2) — separate tags, each below 3 individually
    expect(r.tagIds).toEqual([]);
  });

  it("aggregates weights for the same tag from multiple rules", () => {
    const extra: Rule[] = [
      ...RULES,
      { id: 5, pattern: "urgent", tagId: 100, weight: 1 }, // also maps to 'bug'
    ];
    const r = tag("urgent — the app is broken", extra, { threshold: 3 });
    expect(r.tagIds).toContain(100); // 2 (broken) + 1 (urgent) = 3 ≥ threshold
  });

  it("returns matchedOn substring in matches", () => {
    const r = tag("hey the CHECKOUT flow is broken", RULES);
    expect(r.matches.some((m) => m.matchedOn.toLowerCase() === "broken")).toBe(true);
    expect(r.matches.some((m) => m.matchedOn.toLowerCase() === "checkout")).toBe(true);
  });
});
