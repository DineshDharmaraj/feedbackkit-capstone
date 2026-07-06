---
description: Repo-wide code review for FeedbackKit — security, validation, perf, TS rigor, spec alignment.
argument-hint: "[optional: path or 'diff']"
---

You are performing a code review on FeedbackKit. Load `CLAUDE.md`, `docs/SPEC.md`, and `docs/SECURITY-AUDIT.md` first — they define the conventions and known-audited items.

**Scope**
- Empty `$ARGUMENTS`: review every file under `src/routes/`, `src/auth.ts`, `src/tagger.ts`, and `src/views/`.
- Path: review only that file/dir.
- `diff`: review only uncommitted changes (`git diff HEAD`).

**Check for, in order:**
1. **Security regressions** — is any audit finding from `SECURITY-AUDIT.md` reintroduced? New `passwordHash` leaks? New raw-HTML interpolation?
2. **Input validation** — routes accepting bodies without checking types and lengths.
3. **Performance** — N+1 patterns, missing `include`, sync bcrypt, unbounded loops over untrusted input.
4. **TypeScript hygiene** — `any`, missing return types, casts that suppress real errors.
5. **Spec alignment** — new endpoints must be in `docs/SPEC.md` and `docs/API.md`.

**Output format**
For each finding: `SEV | FILE:LINE | ISSUE | FIX` (one line each).
End with: `Reviewed N files · H high · M med · L low.` + one recommended next action.

Do not modify code.
