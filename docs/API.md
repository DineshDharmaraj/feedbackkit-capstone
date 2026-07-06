# FeedbackKit API

Base URL: `http://localhost:3459`. All bodies are `application/json`. Auth via `Authorization: Bearer <jwt>` where required.

## Errors

```json
{ "error": "human-readable message", "requestId": "..." }
```

Never includes stack traces. `requestId` matches the `x-request-id` header echoed on the response.

## Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness — `{ status: "ok", uptime_s, timestamp }`. |
| POST | `/api/auth/register` | Body: `{ email, password ≥ 8, name }`. 201 `{ token, user }`. 409 duplicate. |
| POST | `/api/auth/login` | Body: `{ email, password }`. 200 `{ token, user }` or 401. Timing-safe. |
| POST | `/api/feedback` | Anonymous or auth. Body: `{ title (≤200), body (≤5000) }`. 201 with auto-applied tags. |

### Triager (auth required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/feedback?status=open\|closed` | Envelope: `{ data: Feedback[] }`. |
| GET | `/api/feedback/:id` | `{ data: Feedback }` or 404. |
| PATCH | `/api/feedback/:id/status` | Body: `{ status: "open" \| "closed" }`. |
| POST | `/api/feedback/:id/tags` | Body: `{ tagId }`. |
| DELETE | `/api/feedback/:id/tags/:tagId` | Untag. |
| GET | `/api/tags` | `{ data: Tag[] }`. |
| GET | `/api/digest/weekly` | Tag totals + top-3 items per tag for last 7 days. |

### Admin (auth + role=admin)

| Method | Path | Description |
|---|---|---|
| POST | `/api/tags` | Body: `{ name, color: "#rrggbb" }`. 201 or 409. |
| GET | `/api/rules` | List rules with joined tag. |
| POST | `/api/rules` | Body: `{ pattern, tagId, weight? }`. Validates regex before insert; 400 on invalid. |
| DELETE | `/api/rules/:id` | Remove a rule. |

## Types

```ts
type User = { id: number; email: string; name: string; role: "triager" | "admin" };
type Feedback = { id: number; title: string; body: string; status: "open" | "closed";
                  reporterId: number | null; createdAt: string; tags: Tag[] };
type Tag = { id: number; name: string; color: string };
type TagRule = { id: number; pattern: string; tagId: number; weight: number };
```

## Curl examples

```bash
# Register + capture token
TOK=$(curl -sX POST localhost:3459/api/auth/register -H 'content-type: application/json' \
  -d '{"email":"a@x.com","password":"hunter22","name":"Alice"}' | jq -r .token)

# Anonymous feedback (auto-tagged as "bug" + "billing")
curl -sX POST localhost:3459/api/feedback -H 'content-type: application/json' \
  -d '{"title":"Checkout is broken","body":"payment fails at step 3"}'

# List open feedback (auth)
curl -s localhost:3459/api/feedback?status=open -H "authorization: Bearer $TOK" | jq

# Weekly digest
curl -s localhost:3459/api/digest/weekly -H "authorization: Bearer $TOK" | jq
```
