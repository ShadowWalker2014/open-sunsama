# Desktop Deep Links — Implementation Plan

**Status:** Future feature; planning only. Protocol confirmed: `opensunsama://` (2026-10-08).
**Goal:** Open and focus the installed desktop app from task links stored in Linear, Notion, or email.
**Architecture:** Tauri receives an OS protocol activation, brings the existing main window forward, and queues a validated navigation intent until the React router and authentication are ready.
**Stack:** Tauri v2, Rust, React, TanStack Router.

## Requested behavior

| Link                                     | Result                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `opensunsama://`                         | Bring the app to the front without changing the current view.                      |
| `opensunsama://today`                    | Open the planner on today in the signed-in user's timezone.                        |
| `opensunsama://action/details/<task id>` | Fetch the authorized task and open its details, even when outside the visible day. |

These are requested examples, not existing Open Sunsama behavior. Custom URL parsers treat `today` and `action` as hosts; do not parse only the pathname.

## Current context

- `apps/desktop/src-tauri/src/lib.rs` already initializes Tauri plugins and implements window activation with `show_main_window` / `bring_to_front`.
- `apps/web/src/hooks/useDesktop.ts` and `apps/web/src/lib/desktop.ts` bridge native navigation events into React.
- `apps/web/src/components/kanban/task-modal.tsx` uses the existing `useTask` hook and task detail UI.
- Desktop bundles the web app. A desktop release is required for protocol registration and frontend handling to reach installed users.

## Confirmed decision

**Protocol name:** use `opensunsama` exclusively for registration, parsing, generated links, and documentation. Do not register `sunsama` as an alias.

## Decisions before build

1. **Copy-link UX:** proposed separate “Copy desktop link” and “Copy web link” actions. Confirm wording and placement. Do not replace existing browser links globally.
2. **Missing installation:** a custom scheme has no automatic web fallback. Proposed docs provide a browser URL alongside desktop links; a smart HTTPS landing page is a separate scope decision.

## Implementation sequence

1. **Define the intent contract and parser.** Create `apps/web/src/lib/deep-links.ts` and `apps/web/src/lib/deep-links.test.ts`. Return `activate`, `today`, or `taskDetails` with a validated task ID. Accept only `opensunsama` and exact routes; reject unknown actions, malformed IDs, unexpected credentials, and extra path segments. Opening a link must never mutate a task.
2. **Register the native protocol.** Modify `apps/desktop/src-tauri/Cargo.toml`, `apps/desktop/package.json`, `apps/desktop/src-tauri/tauri.conf.json`, and the appropriate file in `apps/desktop/src-tauri/capabilities/`. Add the Tauri deep-link plugin, scoped permissions, and desktop scheme registration. Verify current plugin APIs before choosing dependency versions. Update lockfiles through normal package tooling.
3. **Handle both cold and warm activation.** Extend `apps/desktop/src-tauri/src/lib.rs`; add `apps/desktop/src-tauri/src/deep_links.rs` if separation helps. Integrate single-instance handling on platforms that need it, preserving existing setup and activation behavior. Forward activations to the existing process instead of spawning a second planner. A deliberate link overrides minimized startup.
4. **Make event delivery reliable.** Extend `apps/web/src/lib/desktop.ts` and `apps/web/src/hooks/useDesktop.ts`. Subscribe before draining the initial native URL queue; handle links received after startup. Deduplicate startup/event double delivery, clean up listeners, and serialize intents so a later link wins while navigation is loading.
5. **Connect routing and authentication.** Inspect `apps/web/src/routes/app.tsx` and planner routes under `apps/web/src/routes/app/` for the canonical selected-date and selected-task state. Map the intent onto that state, rather than duplicating the task modal. Resolve today at dispatch time using user timezone. Retain a bounded in-memory pending intent across login; discard it on an account switch unless the new account is authorized.
6. **Handle unavailable tasks.** Fetch by ID using `apps/web/src/hooks/useTasks.ts`. Missing/deleted/other-user tasks display a generic unavailable message and leave a usable planner. Repeated activation of the same task must not stack dialogs. Task authorization stays server-side.
7. **Expose and document links.** Add the approved copy action to `apps/web/src/components/kanban/task-modal.tsx`. Add `apps/web/src/content/docs/desktop-linking.mdx` and register it with the docs navigation after inspecting existing registration. Document URL construction, UUID examples, login behavior, supported installation formats, and external tools that strip custom schemes.

## Validation and acceptance

- Parser tests cover all three links, encoded input, malformed IDs, unknown routes, and host/path normalization.
- Browser integration tests cover pending intent after login, today in a timezone different from the machine, and opening a task absent from the current list.
- Installed-app checks on macOS, Windows, and supported Linux packages cover app closed, already running, minimized, hidden in tray, and logged out. Linux packaging/protocol associations must be tested per supported installer format.
- Prove activation reuses one process/window, preserves ongoing timers, and does not alter task data.
- Run `bun run typecheck`, `bun run lint`, targeted frontend tests, and `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml` on an appropriate build host.
- Ship through required PR checks and `bun run release` when implementation is approved. Validate signed/released installers, not only `tauri dev`.

## Delivery boundary

No universal links, mobile protocol registration, external app plugins, or task editing through URLs in this first slice. A desktop link can focus, select a day, or open authorized details only.
