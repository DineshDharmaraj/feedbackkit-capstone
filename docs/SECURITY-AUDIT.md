# Security Audit — FeedbackKit

Scope: all files under `src/`, `prisma/`, `docs/`, plus `package.json` and CI config. Approach: static review + `npm audit` + smoke tests against a running instance.

## Findings & fixes

| # | SEV | Finding | Fix (implemented) |
|---|---|---|---|
| 1 | HIGH | JWT_SECRET dev fallback would silently ship if the env is unset in production. | `src/auth.ts` calls `process.exit(1)` when `NODE_ENV=production && !JWT_SECRET`. Dev still warns loudly. |
| 2 | HIGH | Login could leak whether an email exists via response time (`bcrypt.compare` skipped when user is null). | Login now always runs `bcrypt.compare` against a dummy hash when the user isn't found. |
| 3 | HIGH | Server-rendered pages could execute user-injected HTML if titles/bodies were interpolated raw. | Every value rendered client-side goes through an `escapeHtml`/`esc` helper; server-side helper `escape()` in `_shared.ts`. |
| 4 | MED | Unbounded request bodies could OOM the server. | `express.json({ limit: "100kb" })` and `express.urlencoded({ limit: "100kb" })` in `src/app.ts`. |
| 5 | MED | 500 responses could leak stack traces / library paths. | Global error handler returns `{ error: "internal server error", requestId }`; details go to server logs only. |
| 6 | MED | Admin regex rules could allow ReDoS or crash ingest with a bad pattern. | `POST /api/rules` compiles the regex in `try/catch` and returns 400 before insert. Tagger also skips uncompilable rules at runtime. |
| 7 | LOW | Log lines could contain auth headers or passwords. | pino `redact` config drops `req.headers.authorization`, `req.body.password`, `*.password`, `*.passwordHash` at serialization. |
| 8 | LOW | `passwordHash` could leak in user responses. | Route handlers always project user to `{id, email, name, role}` before `res.json`. Verified in tests. |
| 9 | LOW | `x-powered-by` header advertises Express version. | (Follow-up) — add `app.disable("x-powered-by")` in `src/app.ts`. Not shipped yet. |
| 10 | LOW | No rate limiting on `POST /api/feedback` — spam vector. | (Follow-up) — add `express-rate-limit` with a per-IP token bucket. Documented, not yet implemented. |

## `npm audit`

Run in CI on every PR (`.github/workflows/ci.yml → check → npm audit --omit=dev --audit-level=high`). At tag time this passed with 0 high-severity advisories.

## Threat model summary

- **STRIDE**: primary concerns are Information Disclosure (passwordHash, stack traces) and Denial of Service (unbounded body, no rate limit). Both are addressed above except rate limiting (follow-up).
- **AuthN/AuthZ**: bcrypt(10) + HS256 7-day JWT. Role check via `requireAuth({ role: "admin" })`. Timing-safe login.
- **Data at rest**: SQLite file, no encryption — acceptable for demo. Production deployment should switch to Postgres with disk encryption.
- **Data in transit**: not addressed here; TLS is a deployment concern (reverse proxy).

## What was NOT audited

- Third-party dependency source (only `npm audit` advisories).
- Deployment surface (nginx, docker, cloud).
- Front-end supply chain (no CDN dependencies).
