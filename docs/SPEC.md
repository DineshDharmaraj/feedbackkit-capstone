# FeedbackKit — Specification (5-phase Spec Kit)

## Phase 1 — Requirements

**Users**
- **Reporter**: submits feedback via widget. Auth optional.
- **Triager**: reads inbox, tags, closes. Auth required.
- **Admin**: manages tag rules. Auth required + role `admin`.

**Functional requirements**
- FR-1: Anyone (auth or anon) can POST feedback (title + body).
- FR-2: Feedback is auto-tagged at ingest by a rules engine (regex + weight).
- FR-3: Triagers list open/closed feedback and can toggle status.
- FR-4: Triagers can manually add/remove tags on any feedback.
- FR-5: Admins can create/delete tag rules; invalid regex is rejected before insert.
- FR-6: Weekly digest returns tag totals + top-3 items per tag for the last 7 days.
- FR-7: `/health` returns 200 with uptime.

**Non-functional requirements**
- Passwords hashed with bcrypt cost 10. Tokens HS256 with 7-day TTL.
- Requests logged as `{req_id, method, url, status, duration_ms}` via pino.
- Body size limit 100kb; title max 200, body max 5000.
- Structured error envelope: `{ error, requestId }`. No stack traces to clients.
- Graceful shutdown on SIGTERM/SIGINT with 10s deadline; `prisma.$disconnect()` after HTTP close.

## Phase 2 — Design

**Data model (Prisma, SQLite)** — 4 tables, 3 relationships:
- `User (1) — (N) Feedback` (reporterId, nullable for anonymous).
- `Feedback (N) — (M) Tag` via implicit `FeedbackTags` join table.
- `Tag (1) — (N) TagRule` (a tag can be applied by many rules).

**Layers**
- `src/logger.ts` — pino with a redact list for `authorization`, `password`, `passwordHash`.
- `src/db.ts` — Prisma singleton (hot-reload safe).
- `src/auth.ts` — bcrypt + JWT helpers + `requireAuth({optional?, role?})` middleware.
- `src/tagger.ts` — pure `tag(text, rules, opts) → {tagIds, matches[]}`; unit-tested.
- `src/routes/*.ts` — thin HTTP handlers; validation inline; call Prisma directly for a codebase this size.
- `src/views/*.ts` — server-rendered HTML strings (5 pages). Client-side `fetch` uses the JWT from `localStorage`.
- `src/app.ts` — express wiring, request-id, request log, JSON body limit, mounts routes + views + error handler.
- `src/index.ts` — start server, wire signals, graceful shutdown.

**Auth flow**
- Register → 201 `{token, user}` on success, 409 on duplicate email.
- Login → 200 `{token, user}` on success, 401 otherwise. Always run bcrypt.compare (dummy hash when the email doesn't exist) to avoid a user-enumeration timing oracle.
- Middleware reads `Bearer <token>`, verifies, sets `req.user = {sub, email, role}`.

**Tag engine (M3-style TDD)**
- Pure function. FR-2 forbids external I/O in the engine.
- Invalid regex is silently skipped (never crashes ingest).
- Per-tag score aggregation with a configurable threshold; default 1.

## Phase 3 — Plan (step-by-step)

1. Schema + migration (User, Feedback, Tag, TagRule + relations).
2. Seed script: 2 users, 3 tags, 3 rules, 8 sample feedback.
3. `logger.ts` + `db.ts` + `auth.ts` (pure module).
4. `tagger.ts` + `tagger.test.ts` (RED first, then GREEN).
5. Route by route (`auth`, `feedback`, `tags`, `rules`, `digest`) with tests as each ships.
6. Views (`login`, `widget`, `dashboard`, `feedbackDetail`, `adminRules`). Server-rendered, no framework.
7. `app.ts` (request-id, JSON body limit, request log, global error handler).
8. `index.ts` with graceful shutdown.
9. `.mcp.json`, `.claude/commands/*`, `CLAUDE.md`, `README.md`, `docs/API.md`, `docs/SECURITY-AUDIT.md`.
10. CI: typecheck + audit + tests. Gate merges.

## Phase 4 — Scope Boundaries

**IN**
- Register + JWT login (single 7-day token).
- Anonymous + authenticated feedback submission.
- Auto-tag on ingest + manual tag/untag.
- Admin CRUD on tag rules.
- Weekly digest endpoint.

**OUT (explicit non-goals for this milestone)**
- OAuth / social login.
- Refresh tokens or session revocation.
- Password reset flow (out-of-band email required — parked).
- Comments/threads on feedback.
- Real-time push (websockets).
- Multi-tenant.
- File uploads / attachments.
- Analytics beyond the weekly digest.

## Phase 5 — Success Criteria (acceptance)

- **AC-1**: Fresh DB → seed → `npm test` all green, coverage ≥ 80%.
- **AC-2**: `POST /api/feedback` with `{title, body}` → 201, body includes matching auto-tags (verified by seed's "checkout is broken" example returning bug + billing).
- **AC-3**: `GET /api/feedback` without token → 401. With token → 200 array.
- **AC-4**: `PATCH /api/feedback/:id/status` toggles state and returns updated row.
- **AC-5**: Admin `POST /api/rules` with malformed regex → 400 `invalid regex`. Triager POST → 403.
- **AC-6**: Login with unknown email takes within 20 ms of login with wrong password (`time` × 5 runs) → timing-safe.
- **AC-7**: `/health` returns 200 in ≤ 50 ms, includes uptime.
- **AC-8**: CI green on the initial push.
