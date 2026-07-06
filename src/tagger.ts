// Pure tag engine — TDD-driven.
// tag(text, rules) → {tagIds, matches[]} — deterministic, no I/O.

export interface Rule {
  id: number;
  pattern: string;
  tagId: number;
  weight: number;
}

export interface TagMatch {
  tagId: number;
  ruleId: number;
  weight: number;
  matchedOn: string;
}

export function tag(
  text: string,
  rules: Rule[],
  opts: { threshold?: number } = {}
): { tagIds: number[]; matches: TagMatch[] } {
  const threshold = opts.threshold ?? 1;
  const matches: TagMatch[] = [];
  const scores = new Map<number, number>();

  for (const r of rules) {
    let re: RegExp;
    try {
      re = new RegExp(r.pattern, "i");
    } catch {
      continue; // invalid regex — skip, don't crash
    }
    const m = text.match(re);
    if (m) {
      matches.push({ tagId: r.tagId, ruleId: r.id, weight: r.weight, matchedOn: m[0] });
      scores.set(r.tagId, (scores.get(r.tagId) ?? 0) + r.weight);
    }
  }

  const tagIds = Array.from(scores.entries())
    .filter(([, score]) => score >= threshold)
    .map(([tagId]) => tagId);

  return { tagIds, matches };
}
