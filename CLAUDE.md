# CLAUDE.md — FeedbackKit

Project-level conventions for Claude Code. This file is auto-loaded at the start of every session.

## Tech stack

- Node 18+, TypeScript 5.7 (strict), ES modules (`"type": "module"`).
- Express 4.21 + Prisma 5.22 + SQLite (Postgres in prod is a follow-up).
- Pino 9 for structured logs (redact list for auth headers + password fields).
- Vitest 2.1 + supertest 7 + `@vitest/coverage-v8` for coverage.
- JWT auth (jsonwebtoken 9) + bcrypt (bcryptjs 2.4).

## Layout

```
feedbackkit/
├── .claude/commands/       # /review, /add-endpoint, /deploy-check
├── .github/workflows/ci.yml
├── docs/                   # SPEC.md, API.md, SECURITY-AUDIT.md
├── prisma/schema.prisma
├── prisma/seed.ts
├── src/
│   ├── app.ts              # express app factory (used by tests + index)
│   ├── auth.ts             # hashPassword, verifyPassword, signToken, requireAuth
│   ├── db.ts               # Prisma singleton
│   ├── logger.ts           # pino with redact list
│   ├── tagger.ts           # pure regex tag engine (TDD)
│   ├── tagger.test.ts
│   ├── index.ts            # server startup + graceful shutdown
│   ├── routes/             # thin HTTP handlers, one file per resource
│   └── views/              # server-rendered HTML strings
├── CLAUDE.md               # this file
├── README.md
├── package.json
└── tsconfig.json
```

## Code style

- **TypeScript strict.** No `any`. Use `unknown` and narrow.
- **camelCase** functions & vars; **PascalCase** types & classes; **SCREAMING_SNAKE_CASE** module-level constants.
- **snake_case** in JSON response bodies (`created_at`… actually we use `createdAt`/`camelCase` on the wire here — see below).
- **Wire naming exception:** we use `camelCase` on the wire because Prisma default field names are camelCase and rewriting them adds friction without value. Document this.
- **Response envelope:** `{ data: ... }` for success on list endpoints; single-resource responses may return the row directly. Errors always `{ error: "...", requestId }`.
- **Named exports** over default (except Express routers, which are default-exported by convention).
- **2-space indent**, double quotes, trailing commas where valid.
- **No `console.log`** in request paths. Use `logger.debug`.

## Architecture rules

- Handlers stay thin: parse → validate → call a pure helper or Prisma → respond.
- The tagger and any other domain logic goes in a pure `src/*.ts` module with a sibling `*.test.ts`.
- Views are pure functions returning HTML strings; no template engine.
- Every dangerous env var (`JWT_SECRET`, `DATABASE_URL`) is checked at startup — fail hard in prod, warn in dev.

## Testing

- Sibling `<file>.test.ts` next to the file under test.
- Vitest + supertest for HTTP.
- `beforeAll` clears the affected tables; tests should be idempotent.
- Coverage gate: 80% lines. See `docs/SPEC.md → AC-1`.

## When adding a feature

Use CRISP. Load `docs/SPEC.md` first. Prefer:
1. Extend the Prisma schema + migration.
2. Add a pure helper if there's non-trivial logic.
3. Add the route + test in the same commit.
4. Update `docs/API.md` in the same commit.
5. If it's user-visible, add a view.

Run `/review` before pushing. Run `/deploy-check` before merging to `main`.

## Do not

- Add a frontend framework — server-rendered HTML is the deliberate choice.
- Introduce a new ORM or drop Prisma.
- Log request bodies verbatim (redact rules cover the obvious fields; be careful adding new sensitive fields).
- Return `passwordHash` in any response.
- Accept unbounded strings — check length in the handler.
