# Mobile Task Editing — Implementation Plan

**Status:** Future feature; planning only. Confirm which mobile distribution ships first and the initial editing field set.
**Goal:** Open an existing task on mobile, edit its core fields, save reliably, and see the changes in the planner and web app.
**Architecture:** Reuse the existing task API and shared `UpdateTaskInput`. Expo receives a task-details route/editor; Tauri mobile receives the shared web task modal improvements only where a verified gap exists.
**Stack:** Expo/React Native/Expo Router, React Query, shared API client; Tauri mobile and React web UI.

## Current context verified from source

- `apps/mobile` is currently a Tauri wrapper, not the Expo app described in the old `.todo/mobile-app/PRD.md` and parts of `AGENTS.md`.
- Expo lives in `apps/expo-mobile`. Its `app/(app)/index.tsx` renders `TaskCard` and `CreateTaskModal` but does not wire a task editor from that screen.
- `apps/expo-mobile/src/hooks/useTasks.ts` already implements `useTask`, `useUpdateTask`, completion, creation, and deletion. Update success sets the detail cache and invalidates task lists.
- `apps/web/src/components/kanban/task-modal.tsx` already supports editing and uses `BottomSheetContent` for mobile. Treat Tauri mobile as a parity/verification track rather than rebuilding its editor.
- Reuse `apps/expo-mobile/src/components/CreateTaskModal.tsx`, `PrioritySelector.tsx`, `FormInput.tsx`, and `src/lib/theme.ts` conventions.

## Proposed first release

Editable fields: title, notes, priority P0–P3, scheduled day/backlog, and estimated minutes. Preserve all omitted fields, especially timers, actual tracked time, external-source metadata, and recurrence state. Confirm this set before implementing; subtask management and recurrence editing can follow separately.

Tap the card body to open details. Completion remains a separate control and must not also open the editor. Use an explicit **Save** action for the Expo draft; confirm this interaction rather than copying web autosave inconsistently.

## Implementation sequence

1. **Confirm the target and inspect current gaps.** Decide Expo first, Tauri first, or both. Inspect `apps/expo-mobile/src/components/TaskCard.tsx` and `CreateTaskModal.tsx`; test the current Tauri/mobile-web detail sheet. Record only observed missing behavior. Read `DESIGN.md` for hierarchy, themes, and interaction principles; adapt dimensions to native touch accessibility rather than copying desktop hit areas.
2. **Add detail navigation.** Create `apps/expo-mobile/app/(app)/tasks/[taskId].tsx`; register the screen in `app/(app)/_layout.tsx`. Modify `TaskCard.tsx` to accept an open-details action and wire it from `app/(app)/index.tsx`. Ensure checkbox/menu interactions do not bubble into navigation and that detail screens are not unintentionally added as bottom tabs.
3. **Load authorized task details.** Reuse `useTask(taskId)`. Provide loading, missing/deleted-task, unauthorized/session-expired, and retry states. Validate IDs before query dispatch. Editing opens the full current task, not a stale list snapshot.
4. **Build a draft editor.** Create `apps/expo-mobile/src/components/TaskEditForm.tsx`. Initialize once per task/version; do not overwrite an in-progress draft on refetch. Use existing field controls, validation limits from shared/API types, timezone-correct day values, explicit backlog `null`, and nonnegative bounded estimated minutes. Save only dirty fields using `UpdateTaskInput`; omitted fields differ from explicit clearing.
5. **Make saving resilient.** Reuse `useUpdateTask`; disable duplicate saves while pending, retain the draft after failure, show inline errors, and return to the previous screen only after success. Verify detail and old/new day list caches refresh after rescheduling. Refetch authoritative data on app foreground if realtime subscription is absent.
6. **Protect drafts and conflicts.** Warn on unsaved navigation/back/gesture dismissal. An unrelated refetch must not erase edits. Use an existing API revision guard if present; otherwise do not claim conflict-safe persistence. Proposed first slice detects refresh differences and asks the user to reload or keep the draft, with documented server last-write behavior. A true `updatedAt`/version precondition API is a separate decision requiring server/client changes.
7. **Handle platform ergonomics.** Add keyboard-aware scrolling, safe-area insets, multiline notes/title handling, Android hardware-back behavior, and accessible input labels and error announcements. Check large text, light/dark themes, and portrait/landscape. Avoid success feedback until the server confirms save.
8. **Verify Tauri/shared web parity.** Test `apps/web/src/components/mobile/mobile-task-card.tsx` and `apps/web/src/components/kanban/task-modal.tsx` on the wrapper. Make narrowly scoped fixes only for verified editing gaps. If both clients ship, align field semantics/error behavior but keep platform-native form components. Add editing documentation after choosing the release target.

## Validation and acceptance

- Edit each approved field, save, reopen, and verify API persistence and the same values on web.
- Change scheduled day or clear it to backlog: the task disappears from the old list and appears in the correct destination without stale duplicates.
- Empty/overlong title, invalid duration, failed request, double tap Save, expired auth, and deleted task produce recoverable states without losing the draft.
- Completion-control taps do not open details. Android back, swipe dismissal, and app backgrounding handle dirty/pending states predictably.
- Test notes round-trip. Plain text editing must not strip existing rich/Markdown content; confirm the stored notes format before selecting the control. Show source-owned fields consistently with existing import refresh semantics.
- Proposed tests: `apps/expo-mobile/src/components/TaskEditForm.test.tsx` and hook mutation/cache tests, using the current test setup if available. If React Native component tooling is absent, confirm dependencies before adding it; supplement with emulator/device validation.
- Run `bun run typecheck` and `bun run lint`; test Expo on iOS and Android, Tauri wrappers where included, and browser mobile sheets with the repository's required browser tooling.
- Development uses `bun run dev:local` and shared disposable dev accounts, never Docker or production DB mutation. Native devices need a reachable dev API host rather than their own `localhost`; keep that configuration explicit and non-production.

## Follow-up boundaries and release

Offline write queues, attachment uploads, reference search, subtasks, recurrence changes, and new gestures are separate feature slices. For offline v1, keep the draft and report that saving requires connectivity; never display an unsent change as persisted.

Complete normal PR/CI checks when implementation is approved. Expo requires its app distribution path; Tauri mobile requires its own build/distribution path. A website deploy does not automatically ship a bundled native editor. Validate the installed release against a disposable canary task before calling the feature done.
