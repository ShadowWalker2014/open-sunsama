# Notion and Gmail References — Implementation Plan

**Status:** Future feature; planning only. OAuth/picker scope and reference cardinality require confirmation.
**Goal:** Attach Notion pages and Gmail messages or threads to an existing task as references, without importing or synchronizing task fields.
**Architecture:** Extend the existing external-link model with reference-only provider capabilities. Add paste-link attachment first, then authorized lookup/search and metadata refresh as a separate milestone.
**Stack:** Hono, Drizzle/PostgreSQL, React, TanStack Query, provider OAuth APIs.

## Current context

- `packages/database/src/schema/task-external-links.ts` already supports `role: 'reference'`, remote metadata, and orphaned links. Its documented reference behavior never writes task fields.
- `apps/api/src/routes/integrations.ts` already manages accounts and manual reference attachment.
- `apps/api/src/services/task-import.ts` also owns source import/refresh. Reference providers must not accidentally enter that task-writing path.
- `apps/web/src/components/kanban/task-source-chip.tsx` and `task-modal.tsx` display external links; integration settings and provider icons already have components.
- The current unique index on `(accountId, provider, externalId)` prevents one connected remote object being attached to several tasks. This matters for pages and email threads used by multiple tasks.
- Several integration files currently have uncommitted changes. Re-inspect the final baseline before building this plan.

## Product contract

1. Attach a reference to an existing task; show provider icon, human label, and an “Open in Notion/Gmail” action.
2. Attaching, refreshing, opening, and removing a reference never changes title, notes, priority, completion, schedule, subtasks, or tracked time.
3. Task completion does not archive emails, mark them read, or update Notion properties.
4. Several references can belong to a task. Proposed behavior allows one page/thread on several tasks and deduplicates within each task; confirm before the schema change.
5. Disconnect keeps a display-only link snapshot with `accountId: null`; authorized lookup stops until reconnection. Unlinking removes the local attachment only.

## Milestones and implementation sequence

### Milestone A: pasted references

1. **Separate provider capabilities.** Modify `packages/types/src/integration.ts`; add a reference-provider interface under `apps/api/src/services/reference-providers/`. Expose explicit capabilities such as `attachReference`, `searchReferences`, and `refreshReference`. Preserve existing task-provider APIs. Notion/Gmail must not advertise task import or task-field refresh.
2. **Define URL normalization.** Create `apps/api/src/services/reference-providers/notion.ts` and `gmail.ts` plus corresponding `.test.ts` files. Recognize approved Notion page URLs and supported Gmail message/thread URLs. Store stable provider IDs where available. Gmail `/u/0` is a local browser account selector, not an account identity; URL hashes must not be assumed to be Gmail API IDs. Manual attachment can keep an opaque canonical link when identity cannot be resolved.
3. **Fix reference cardinality.** Modify `packages/database/src/schema/task-external-links.ts`. Preserve the existing account/object uniqueness for `role = 'source'`; add task-level deduplication for references, including an explicit strategy for null account IDs. Account for account disconnection introducing nulls. Generate and inspect the migration with `bun run db:generate`; test duplicate legacy rows before applying new constraints.
4. **Add reference metadata.** Extend `ExternalLinkMeta` and matching shared types with a display title, provider object kind, and optional minimal sender/workspace information. Store no email body, attachment contents, or Notion page content in this slice. Define length bounds and HTML-free labels.
5. **Extend attachment endpoints.** Modify `apps/api/src/routes/integrations.ts` and `apps/api/src/validation/integrations.ts`. Reuse existing link routes where contracts fit; add reference-specific resolution only where needed. Check task/account ownership and applicable existing scopes on every attach, refresh, and remove. Publish link changes using existing websocket conventions and invalidate client queries.
6. **Add the task attachment UI.** Create `apps/web/src/components/kanban/task-reference-picker.tsx`; extend `task-source-chip.tsx`, `task-modal.tsx`, and hooks/client APIs as required. “Add reference” accepts a link and optional manual label, renders loading/error state, and prevents duplicate submission. Persist reference links separately from user notes.
7. **Add the requested SVG assets.** Sources: [Notion](https://dashboardicons.com/icons/external/notion), [Gmail](https://dashboardicons.com/icons/external/gmail). During implementation, obtain the actual SVG download from each page, check reuse terms, sanitize scripts/external references, and store assets under `apps/web/public/integrations/`. Register them in `apps/web/src/components/settings/integration-provider-icons.tsx`. Keep Gmail brand colors; provide a theme-appropriate Notion variant and accessible text labels. Do not hotlink the source pages as images.

### Milestone B: connected lookup and refresh

1. Confirm whether a connected search picker is needed at initial release. Add Notion OAuth and a Gmail read-only OAuth connection only after this scope decision.
2. Reuse encrypted credential storage and the OAuth-state pattern in `packages/database/src/schema/oauth-states.ts`; inspect calendar OAuth implementations for the existing refresh-token lifecycle. Provider OAuth credentials are distinct from Open Sunsama's MCP authorization server.
3. Restrict Notion discovery to pages shared with the integration. Select the least Gmail scope that supports the approved picker; decide metadata-only search versus full read access based on actual API limitations. Gmail scope verification and token-storage requirements are a delivery dependency.
4. Add paginated, account-scoped search and explicit metadata refresh; handle expired authorization, revoked access, rate limits, and deleted remote items. Missing items become unavailable/orphaned without deleting the task. Do not poll bodies or implement task-source sync.
5. Reconcile resolved API identity with pasted links without merging distinct objects accidentally. Test users with multiple Google accounts and Notion workspaces.

## Validation and acceptance

- API tests prove every reference action leaves all task fields and subtasks unchanged, including completion.
- Ownership tests prevent attaching another user's account or task and prevent cross-user lookup/metadata leakage.
- Migration tests prove one remote source retains source semantics, one reference can be reused across tasks, and duplicates within a task are handled idempotently.
- Browser checks: attach both providers, open each link, refresh a title, remove a link, disconnect/reconnect, and try a private/deleted object. Test compact layout and mobile sheet under `DESIGN.md`.
- Use mocked provider responses for automated tests; live OAuth checks use disposable accounts on the shared dev database, never real-user task mutation.
- Run `bun run typecheck`, `bun run lint`, targeted API/web tests, and required CI migration checks. Validate the released feature in the browser and confirm API logs contain no credentials or email content.

## Open decisions

- Paste-only launch or OAuth search picker at launch?
- Gmail thread, message, or both as the attachment unit?
- Multiple-task reuse and optional sender/workspace metadata?
- Account-less links retain a manual title until explicit authorized resolution; confirm whether this satisfies the initial UX.
