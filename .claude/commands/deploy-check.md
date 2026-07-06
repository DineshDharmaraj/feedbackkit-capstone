---
description: Pre-deploy checklist for FeedbackKit — runs the same gates CI runs, plus a couple more.
---

You are running the pre-deploy checklist for FeedbackKit.

**Do the following, in order. STOP at the first failure and report it.**

1. `npm run typecheck` — must be clean.
2. `npm test` — must be green, coverage ≥ 80%.
3. `npm audit --omit=dev --audit-level=high` — must return no findings.
4. Boot the server locally (`PORT=3459 npm start` in the background). Wait 2 s. Hit `/health` — must return 200 with `status: "ok"`.
5. Confirm `JWT_SECRET` is set in the target env (the operator should have this staged). If unset, refuse to proceed.
6. Print the last 5 commits on the current branch with their diff shortstats — the operator should sanity-check what's about to ship.

**Output** (regardless of pass/fail):

```
✔/✖ typecheck
✔/✖ tests + coverage (N/M, X% coverage)
✔/✖ npm audit
✔/✖ /health probe
✔/✖ JWT_SECRET present in env
✔/✖ recent commits looked at

Verdict: READY / BLOCKED — <reason>
```

Do not run migrations, do not push, do not deploy. This is a check, not an action.
