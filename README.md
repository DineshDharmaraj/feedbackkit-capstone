# FeedbackKit

A small self-hosted feedback capture + triage tool. Users of your product submit feedback via a widget; your team triages it in a browser inbox, tags it, and closes it.

Built for the Certified AI-Driven Developer capstone. Exercises every core skill from the certification: CRISP prompting, TDD, Plan Mode, JWT auth + ownership, MCP integration, CI/CD, security audit.

## Quick Start

```bash
npm install
cp .env.example .env                # then edit JWT_SECRET
npx prisma migrate dev              # creates SQLite dev.db
npx prisma db seed                  # seeds 2 users + 20 sample feedback + tag rules
npm run dev                         # → http://localhost:3459
```

Log in as `alice@example.com` / `password123` (triager) or `admin@example.com` / `admin123` (admin).

## What's in the box

| Concern | Where |
|---|---|
| API — 6 endpoints | `src/routes/{auth,feedback,tags,rules,digest}.ts` |
| Data model — 4 related tables | `prisma/schema.prisma` (User, Feedback, Tag, TagRule; Feedback↔Tag M2M) |
| Frontend — 5 server-rendered pages | `src/views/{dashboard,feedbackDetail,adminRules,widget,login}.ts` |
| Auth + ownership | `src/auth.ts`, JWT HS256 7-day, bcrypt cost 10, timing-safe login |
| Tests — 80%+ coverage | `src/**/*.test.ts` (Vitest + supertest), `npm test` |
| CI | `.github/workflows/ci.yml` — typecheck, audit, tests |
| Security audit | `docs/SECURITY-AUDIT.md` |
| MCP | `.mcp.json` (filesystem server) + used by the tag-rules editor |
| Spec | `docs/SPEC.md` (5-phase Spec Kit) |
| API docs | `docs/API.md` |
| Team conventions | `CLAUDE.md` + `.claude/commands/*` (3 custom commands) |

## Architecture

```
┌─────────────────┐   POST /api/feedback   ┌───────────────┐
│  Public Widget  │ ──────────────────────►│               │
│  (embeddable)   │                        │   Express     │
└─────────────────┘                        │   +           │
                                           │   Prisma      │◄──── MCP filesystem
┌─────────────────┐   GET /dashboard       │   +           │       (for /rules editor)
│  Triager UI     │◄──────────────────────►│   Pino        │
│  (server-       │                        │               │
│   rendered)     │   POST /login          │               │
└─────────────────┘                        └───────┬───────┘
                                                   │
                                                   ▼
                                             ┌───────────┐
                                             │  SQLite   │
                                             │ (Prisma)  │
                                             └───────────┘
```

See `docs/SPEC.md` for design rationale, `docs/API.md` for the full endpoint reference, and `docs/SECURITY-AUDIT.md` for the audit report.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | tsx watch — hot reload |
| `npm start` | tsx (no watch) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest run + coverage |
| `npm run test:watch` | Vitest in watch mode |
| `npm run seed` | `prisma db seed` |

## License

MIT.
