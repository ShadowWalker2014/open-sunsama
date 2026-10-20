# Webhooks and n8n Task Automations — Implementation Plan

**Status:** Future feature; planning only. Event scope, hosting restrictions, and authentication policy require confirmation.
**Goal:** Let n8n react to Open Sunsama task changes and create or update tasks through the existing authenticated API.
**Architecture:** Publish committed task events through a transactional outbox; deliver signed HTTPS webhooks asynchronously with PG Boss. n8n uses API keys for inbound task actions. The initial integration is a documented workflow template, with a custom n8n node as a later option.
**Stack:** Hono, PostgreSQL/Drizzle, PG Boss, existing REST API/API keys, n8n Webhook and HTTP Request nodes.

## Current context

- `apps/api/src/routes/tasks.ts` owns task API behavior; task changes can also originate in timers, recurrence, rollover, provider refresh, or MCP calls. Inventory every task writer before choosing event publication points.
- `apps/api/src/lib/websocket/index.ts` publishes realtime updates; socket broadcasts alone are not a durable event source.
- `apps/api/src/workers/index.ts` registers workers. Existing PG Boss recovery/health infrastructure is available.
- API keys and `tasks:read` / `tasks:write` already support programmatic automation. Reuse these contracts for n8n task actions.

## Proposed initial contract

Events: `task.created`, `task.updated`, `task.completed`, `task.uncompleted`, `task.deleted`. Scheduling changes are `task.updated` in the first slice. Confirm whether an update that completes a task emits only the semantic completion event or both; proposed one semantic event per change, with changed-field names.

```json
{
  "id": "<stable event UUID>",
  "type": "task.updated",
  "version": 1,
  "occurredAt": "2026-10-08T12:00:00.000Z",
  "data": {
    "taskId": "<task UUID>",
    "changedFields": ["scheduledDate"],
    "scheduledDate": "2026-10-09"
  },
  "context": {
    "origin": "api",
    "correlationId": "<request/event UUID>"
  }
}
```

Final snapshot fields require confirmation. Proposed minimal payload excludes notes and reference content; workflows can fetch the current task with their own API key. Deleted-task events contain a tombstone ID, not a promise that the task can still be fetched.

Delivery is **at least once**, can arrive out of order, and uses a stable event ID for receiver deduplication. Never promise exactly-once webhook delivery.

## Implementation sequence

1. **Inventory mutation paths.** Read task routes, task-import services, timer/recurrence/rollover workers, and the MCP-to-API flow. Decide a shared transaction-aware event writer used by every supported mutation path. Explicitly include background mutations or document any excluded event source before launch.
2. **Define event schemas.** Create `packages/types/src/webhook.ts` and `apps/api/src/services/webhooks/events.ts`. Define schema version, actor/origin semantics, no-op suppression, and snapshot limits. Export shared types using the package's existing index pattern.
3. **Add durable storage.** Create `packages/database/src/schema/webhook-endpoints.ts`, `webhook-events.ts`, and `webhook-deliveries.ts`; export from `schema/index.ts`. Store user-owned destinations, subscriptions, encrypted signing secrets, enabled state, immutable event payloads, per-endpoint attempts, next retry, last error, and delivery status. Define unique `(endpointId, eventId)`, indexes, retention, and cascading behavior. Generate migrations with `bun run db:generate`.
4. **Write events atomically.** Insert an outbox event in the same transaction as each successful task mutation. A dispatcher reads committed rows and creates idempotent deliveries/jobs. Crashing between mutation and queue dispatch must not lose the event; rolling back a task mutation must leave no event. Preserve existing websocket broadcasts.
5. **Add delivery workers.** Create `apps/api/src/workers/webhooks/index.ts` and `apps/api/src/services/webhooks/delivery.ts`; register in `workers/index.ts`. Use bounded request timeouts, limited body size, exponential backoff with jitter, max attempts, and terminal failures. Proposed success is any 2xx; retry transient network failures, 408/429, and 5xx, respecting a bounded `Retry-After`. Expose exhausted deliveries for explicit retry using the same event ID.
6. **Sign the raw request bytes.** Proposed headers: `X-Open-Sunsama-Event-Id`, `X-Open-Sunsama-Timestamp`, and `X-Open-Sunsama-Signature: v1=<hex HMAC-SHA256>`. Sign `<timestamp>.<raw body>`; constant-time verification and receiver replay-window checks are documented. Generate strong per-endpoint secrets, show once, encrypt at rest, and define explicit rotation behavior.
7. **Add endpoint management.** Create `apps/api/src/routes/webhooks.ts` and `apps/api/src/validation/webhooks.ts`; mount in `apps/api/src/index.ts`. CRUD, test delivery, recent attempts, secret rotation, and retry must check ownership. Proposed v1 management is JWT-only; add API-key management scopes only if requested. Disabling stops new attempts; removal must not race with an already claimed job.
8. **Add settings and n8n examples.** Create `apps/web/src/components/settings/webhooks-settings.tsx` and register it with settings. Follow `DESIGN.md`: destination, events, status, last attempts, and test action. Add `apps/web/src/content/docs/n8n.mdx` and a sanitized sample workflow under `docs/examples/n8n/`. Document “Webhook → verify signature → deduplicate → filter → HTTP Request task action,” plus authentication, retries, schema versioning, and feedback-loop prevention.

## Security and reliability requirements

- Validate URLs at save and every delivery. Hosted service blocks loopback/private/link-local/metadata destinations, non-HTTPS schemes, embedded credentials, disallowed ports, DNS rebinding, and redirect bypasses. Resolve and pin a permitted address for connection; do not validate DNS and then fetch through an independent resolver.
- Self-hosted n8n on private networks may need an explicit operator allowlist; confirm that policy instead of weakening hosted validation.
- Never return signing secrets after creation, log API keys, or expose unbounded response bodies in delivery logs. Bound per-user endpoints, rates, fan-out, and retained history.
- Suppress no-op events. Include origin/correlation metadata and document filters to stop automation feedback loops.
- Idempotency for task-creation retries is a separate API requirement: confirm adding an `Idempotency-Key` contract and storage, or document workflow-managed deduplication before advertising retry-safe create actions.

## Validation and acceptance

- Transaction rollback emits nothing; a dispatcher crash after commit still delivers exactly one logical event, possibly in repeated attempts.
- Tests cover API/MCP/provider/background origins, signed raw-body verification, repeated delivery IDs, retry exhaustion, endpoint disabling, secret rotation, and cross-user ownership.
- Test destination validation against localhost, IPv6, DNS rebinding, redirects, and metadata endpoints; test bounded slow responses.
- End-to-end: completing a dev task triggers an n8n workflow; a workflow updates a second task using a scoped key; duplicate delivery does not duplicate the action or loop forever.
- Run `bun run typecheck`, `bun run lint`, targeted API/worker tests, and browser smoke checks. Required CI includes migrations; production validation checks worker health, API logs, and a disposable canary endpoint.

## Open decisions

Confirm event list/payload, management auth, retention and retry limits, private-network policy, and whether a community n8n node is needed beyond workflow templates. Estimates come after these choices and the mutation-writer inventory.
