---
description: Scaffold a new REST endpoint following FeedbackKit conventions.
argument-hint: "<verb> <path>  (e.g. 'GET /api/feedback/:id/history')"
---

You are adding a new endpoint to FeedbackKit. Load `CLAUDE.md` and `docs/SPEC.md` first.

**Steps**
1. If this endpoint is not in `docs/SPEC.md` under Requirements, STOP and ask the user to update the spec first. Do not silently invent scope.
2. Identify which resource file it belongs in: `src/routes/{auth,feedback,tags,rules,digest}.ts`. If none fit, create a new file following the existing pattern.
3. Add the handler:
   - `requireAuth()` or `requireAuth({ role: "admin" })` unless the SPEC marks it public.
   - Inline input validation (types, length caps).
   - Prisma call.
   - `{ data }` envelope on success, `{ error }` on failure.
4. Add sibling test cases: auth boundary (401/403), validation boundary (400), success (200/201), not-found (404 when applicable).
5. Update `docs/API.md` with the new row in the endpoint table.

**Constraints**
- Do not modify unrelated routes.
- Do not add a new dependency without justifying in the PR description.
- Do not skip the test file.

**Output**
- `NEW files:` list
- `MODIFIED files:` list (must include `docs/API.md`)
- `npm test` result
