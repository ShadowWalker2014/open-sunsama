# Compact Workspace Design System

This system produces a quiet, dense, modern workspace: neutral layered surfaces, small precise controls, readable content, restrained color, and direct interactions. The interface makes room for the user's work. It does not use oversized typography, padded dashboard tiles, or decorative color to manufacture hierarchy.

This is the reusable specification distilled from Open Sunsama's September 2026 design iterations. **Preserve the measurements and relationships below when implementing it in another app.** Replace the domain vocabulary and content, not the visual grammar.

## 1. Reproduction contract

- All measurements are **CSS pixels**, at 100% browser zoom with a 16px root font size. Device pixel density changes rasterization, not layout dimensions.
- The reference font is **Geist**, with weights 400, 500, and 600. Load the actual font before judging screenshots. A system-font fallback is functional, but is not an identical rendering.
- Match the reference viewport, content, font, theme, and accent when comparing screenshots. Words alone cannot guarantee identical font rasterization across operating systems.
- Treat tokens, component dimensions, content alignment, and surface relationships as a single system. Copying the colors while doubling the spacing does not reproduce this design.
- Respect a user's font, accent, light/dark mode, text scaling, and reduced-motion preferences. Exact reference reproduction uses the reference settings; preference overrides retain the same hierarchy and usable layout.
- Native window title bars belong to the operating system. Do not recreate macOS traffic lights or title-bar height inside a web application.

## 2. The governing decisions

1. **Content carries the hierarchy.** Titles, grouping, alignment, and proximity do most of the work. Surfaces and separators support them.
2. **Compact means less chrome, not crushed text.** Small toolbars and metadata leave room for readable titles and useful content. Long text wraps at words.
3. **Neutral surfaces stay neutral.** The user's accent identifies actions, focus, selection, and meaningful state. It does not wash entire boards, columns, or navigation backgrounds in color.
4. **Each boundary has one job.** Use a surface change, a subtle edge, or a separator. Avoid stacking a thick border, shadow, and colored outline around the same resting element.
5. **Related controls remain physically related.** A panel and the rail controlling it touch. A metadata row aligns with its content. An action appears near its target.
6. **Secondary detail appears when needed.** Keep primary actions visible; put full descriptions, shortcut hints, sorting explanations, and advanced settings in tooltips, menus, or expanded editors.
7. **Interaction preserves intent.** Carry the selected object, destination, date, and duration through an action. Do not ask the user to supply information their gesture already supplied.

## 3. Semantic color tokens

Use semantic variables everywhere, including menus, dialogs, drag previews, loading states, charts, and third-party widgets. The following values are complete CSS colors; an implementation may store just their HSL channels if its utilities require that format.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `background` | `hsl(0 0% 100%)` | `hsl(240 5% 5%)` | Base page; the white Ideas-board canvas in light mode. |
| `foreground` | `hsl(220 13% 18%)` | `hsl(0 0% 95%)` | Main content and selected labels. |
| `chrome` | `hsl(220 13% 94%)` | `hsl(240 6% 2.5%)` | Global navigation and surrounding app frame. |
| `canvas` | `hsl(220 14% 97.5%)` | `hsl(240 5% 5%)` | Open planner workspace behind cards. |
| `surface` / `card` | `hsl(0 0% 100%)` | `hsl(240 4% 8%)` | Cards and raised content surfaces. |
| `surface-hover` | `hsl(220 14% 99%)` | `hsl(240 4% 9.5%)` | Quiet card hover. |
| `muted` / `secondary` | `hsl(220 14% 96%)` | `hsl(240 4% 12%)` | Subordinate surfaces and controls. |
| `tray` | Alias of `muted` | Alias of `muted` | Borderless board-column containers. |
| `muted-foreground` | `hsl(220 9% 46%)` | `hsl(240 5% 62%)` | Supporting text and inactive icons. |
| `accent` | `hsl(220 14% 96%)` | `hsl(240 4% 14.5%)` | **Neutral** hover/selected-control surface. |
| `popover` | `hsl(0 0% 100%)` | `hsl(240 4% 10%)` | Menus and floating editors. |
| `border` | `hsl(220 13% 91%)` | `hsl(240 4% 15%)` | Hairlines and dividers. |
| `input` | `hsl(220 13% 91%)` | `hsl(240 4% 14%)` | Input edge. |
| `destructive` | `hsl(0 72% 51%)` | `hsl(0 62% 50%)` | Destructive action and error. |
| `destructive-foreground` | `hsl(0 0% 100%)` | `hsl(0 0% 100%)` | Text on destructive fill. |

`card-foreground`, `popover-foreground`, `secondary-foreground`, and `accent-foreground` inherit `foreground` for their mode.

### Theme color is separate from the neutral `accent` token

`primary` means the user's selected theme color. `primary-foreground` is its contrast-tested text color. `ring` follows `primary`. The token named `accent` above is a neutral interaction surface; it is not the user's theme hue.

- The reference application's default primary is `hsl(24 95% 53%)` in light mode and `hsl(24 95% 60%)` in dark mode. These are fallback values, not mandatory orange styling.
- The supplied dark screenshot uses the Rose theme: `hsl(330 90% 66%)`. Its pink highlights must become the chosen theme color when the user changes appearance.
- Theme changes update primary buttons, focus rings, selected indicators, relevant progress marks, and derived tints together. Use one shared theme source.
- Keep status meaning independent of brand preference: errors stay errors, completion stays completion, and priority colors retain their meaning. Define these through shared semantic status tokens, not scattered literal colors.
- Calendar-source and user-assigned category colors represent actual data. They may differ from `primary`; they do not recolor the surrounding workspace.
- Never derive `tray`, `canvas`, or `chrome` from `primary`. Yellow, rose, or rainbow column fills are outside this system.

### Surface recipes are intentional

| Workspace | Layering |
| --- | --- |
| Open day planner | `chrome` frame → `canvas` workspace → unboxed day columns → `surface` cards. |
| Contained Ideas/Kanban board | `background` workspace → `tray` column → `surface` card. Light mode is **white → light gray → white**. |
| Dark contained board | Near-black `background` → neutral `tray` → slightly darker `surface` cards, separated by a faint card edge. |
| Floating editor | Existing workspace → restrained scrim when modal → `popover` or `surface` editor. |

Do not add trays to every layout. Day columns are open groupings; Ideas columns are contained trays. This distinction preserves the reference's visual lightness.

## 4. Typography

Use one UI font family throughout navigation, forms, content, menus, and dialogs:

`"Geist", "Geist Sans", system-ui, sans-serif`

Expose it through a shared `font-family` token. User font preferences replace that token globally. Do not mix a display font into workspace headings.

| Role | Size / line height | Weight | Treatment |
| --- | --- | --- | --- |
| Card title / primary row content | 14 / 20px | 400 | Sentence case; wrap naturally. |
| Navigation, controls, tray headings | 13 / 20px | 500; headings 600 | Compact, clear labels. |
| Card subtask preview | 13 / 16px | 400 | Muted; align with the parent title. |
| Small toolbar labels | 12 / 16px | 400–500 | Use for secondary controls, not main content. |
| Metadata / duration / counts | 11 / 16px | 400–600 | Tabular numerals for time and counts. |
| Tiny status badge | 10 / 16px | 500 | Short code only; never paragraphs. |
| Day/section heading | 18 / 28px | 600 | Tracking `-0.025em`. |
| Date below heading | 14 / 20px | 400 | `muted-foreground`. |
| Desktop detail-editor title | 24 / 32px | 500 | Tracking `-0.025em`; editable content. |
| Mobile detail-editor title | 20 / 27.5px | 500 | Full available width; natural wrapping. |

Use weights 400, 500, and 600 for normal workspace hierarchy. Reserve uppercase for very short metadata labels, with modest tracking. Avoid uppercase navigation, heavy bold body text, and oversized dashboard headings.

Truncate navigation labels only when necessary. Card previews may clamp to three lines; full editors must expose the entire content. Use `min-width: 0` on shrinking text containers and `overflow-wrap` for genuinely unbroken strings. Do not use `word-break: break-all` for ordinary titles.

## 5. Spacing, geometry, and elevation

### Spacing vocabulary

Use `2, 4, 6, 8, 10, 12, 16, 20, 24, 32px` for normal component spacing. A measured reference recipe may use another value, such as the 14px Ideas-column gap. Do not round those recipe values away.

- **2–4px:** tightly related label/value elements, segmented-control inset, tiny optical corrections.
- **6–8px:** icon-to-label gaps, card-to-card gaps, tray padding, compact menu rows.
- **10–12px:** card horizontal padding, primary content alignment, compact workspace gutters.
- **16–20px:** sections, mobile sheet padding, related panes.
- **24–32px:** detail-editor breathing room; not the default padding of every card.

### Corner radii

| Radius | Usage |
| --- | --- |
| 4px | Tiny badges and compact highlight regions. |
| 6px | Inputs, toolbar controls, segmented controls, rail buttons. |
| 8px | Cards and standard buttons. |
| 12px | Board trays and desktop dialogs. |
| 16px | Larger surface exceptions; use sparingly. |
| Full circle | Completion controls and avatars; not ordinary buttons. |

Use 1px edges. Internal panel separators normally use `border` at 40–60% opacity; controls needing a clear edge may use the full token. Avoid dark outlines around every region.

### Exact card shadows

```css
/* Light */
--shadow-card: 0 0 0 1px rgb(16 24 40 / 0.05),
               0 1px 3px 0 rgb(16 24 40 / 0.10);
--shadow-card-hover: 0 2px 4px 0 rgb(16 24 40 / 0.08),
                     0 4px 10px -2px rgb(16 24 40 / 0.10);

/* Dark */
--shadow-card: 0 0 0 1px rgb(255 255 255 / 0.06),
               0 1px 2px 0 rgb(0 0 0 / 0.60);
--shadow-card-hover: 0 0 0 1px rgb(255 255 255 / 0.09),
                     0 2px 6px 0 rgb(0 0 0 / 0.60);
```

The first shadow supplies a faint edge. Do not automatically add another border. Ordinary task cards change surface color on hover; the stronger hover shadow is available for components that need it, not a requirement for every card.

Reserve stronger elevation for floating menus, dialogs, and a currently dragged object. Give scrollable lists enough inner padding for card edges and shadows. Clip the scroll viewport, not the rounded corners of its children.

## 6. Reference component measurements

### App shell and navigation

- The desktop global header is **44px high**, with 12–16px horizontal padding.
- The logo is 24px square. Product and navigation labels are 13px. Navigation icons are 14px.
- Compact header actions are 28px high, with 6px radii. Adjacent navigation items have a 2px gap.
- The planner toolbar is **48px high**, with 12–16px horizontal padding. Its controls are primarily 28px high.
- Today/Board-style view switches use a 28px neutral segmented container, 2px inset, and a quiet selected surface. They are not large primary buttons.
- Keep sorting compact: show the sort icon and a small active-state indicator. Put the full order, such as “Priority (P0 → P3),” in its tooltip and menu.
- The workspace fills the remaining window height. Use bounded scrolling regions and `min-height: 0` / `min-width: 0` through nested flex layouts. Avoid accidental whole-page scrolling.
- Do not apply a marketing-page maximum width to the entire workspace.

### Day columns and Today view

- Desktop day columns are **280px wide** and do not stretch into oversized cards on wide displays.
- A single focused day is at most **340px wide**. Center the content group, including any visible companion pane and its attached rail.
- The focused-day group uses a 20px gap between the day content and companion area. The **panel-to-rail gap is zero**.
- Day headers use 8px horizontal, 16px top, and 8px bottom padding. The day label and count form one line; the date sits immediately below.
- A workload/progress line is 6px high, fully rounded, with a 10px top gap. Its neutral track must remain quiet.
- The add-item row is **32px high**, radius 6px, with the same surface language as cards. Its optional duration chip is small and right-aligned.
- Card lists use 8px spacing. Keep the header, add row, card content, and card metadata aligned consistently.

### Compact content cards

- Use `surface`, an 8px radius, `shadow-card`, **12px horizontal / 8px vertical padding**, and a 4px gap between internal rows.
- The first row contains a 16px completion circle, a 10px gap, the flexible title, and an optional duration chip.
- The completion circle uses a 1.5px stroke and a 2px top offset against the title's first line.
- The title is 14px/20px, weight 400, and clamps to three lines in the preview. A title's length determines card height; do not impose a large minimum height.
- Metadata uses a 16px-high row with 8px gaps and a 24px left inset from the card's inner edge. Use 11px tabular text for times.
- Subtask previews use the same 24px inset, 13px/16px text, and 4px row gaps. Show a compact “+N more” disclosure when the preview is capped.
- Duration chips use 11px semibold tabular text and a very faint neutral fill. Priority chips show compact codes such as P0 or P1, with the full meaning in the menu or accessible label.
- Suppress redundant default-state badges. Preserve a readable label or icon wherever color alone would otherwise carry meaning.

### Contained board trays

- Use a **borderless neutral `tray` fill**, 12px radius, 8px outer padding, and 8px internal gaps.
- Desktop tray width is **272px**. Mobile width is `min(272px, calc(100vw - 48px))` so the board retains a visible horizontal-navigation affordance.
- Board columns have a **14px gap**. Board viewport padding is 12px on small screens and 16px from the small-desktop breakpoint.
- The header is at least 36px high, with 4px horizontal padding. Use a 13px semibold title, small count, and a 24px overflow control.
- The scrollable card list adds **4px inner padding** and 8px bottom padding inside the tray. Together with the outer padding, card edges sit 12px inside the tray.
- Cards have 8px gaps. The add-item footer uses a 16px plus icon, 13px label, and 8px horizontal / 6px vertical padding.
- Keep the column name, count, and menu in one header. Do not add a second dropdown, pager, or navigation row that repeats the columns already on screen.
- Never use tinted brand-color trays, transparent outlined trays, or conspicuous borders as the default. Separation comes from **white canvas / light gray tray / white card** in light mode and the neutral dark equivalents.

### Side panels and icon rails

- A desktop companion panel is **320px wide**. Its rail is **48px wide** and immediately adjacent.
- The rail uses 36px-square controls, 16px icons, 6px radii, 4px vertical gaps, and 8px vertical padding.
- The active rail item uses a neutral selected surface and foreground icon. Inactive icons use muted foreground.
- Collapse removes the panel while keeping the rail attached to the remaining content group. Do not strand the rail against a distant window edge in centered layouts.
- A narrow embedded board may use one board picker and compact column navigation because it displays one column at a time. This does not justify duplicate navigation on the full board.

### Controls, forms, and editors

| Control | Reference dimensions |
| --- | --- |
| Standard button | 36px high; 16px horizontal padding; 13px medium label; 14px icon; 6px gap; 8px radius. |
| Small button | 32px high; 12px horizontal padding; 12px label. |
| Large button | 40px high; 20px horizontal padding; 14px label. Use selectively. |
| Icon button | 36px square; compact 32px; dense secondary 24px. |
| Text input | 32px high; 10px horizontal padding; 13px text; 6px radius; subtle 1px edge. |
| Desktop task/detail dialog | Maximum width 768px; maximum height 84vh; top at 8vh; 12px radius; bounded inner scrolling. |

Use a 2px theme-derived focus ring for buttons and a clearly visible theme-derived input focus edge. Disabled controls use 50% opacity and cannot activate. Validation errors remain readable and explain how to recover.

Make editor titles look like editable content, not a large bordered form field. On mobile, move timing or other side metadata below the title instead of squeezing the title between fixed-width columns. Keep secondary fields behind “More options” when the primary flow needs only a title and context.

## 7. Interaction is part of the design system

### Preserve the user's object and gesture

- Dropping an existing item onto a schedule uses that item's identity and title immediately. Create its scheduled block directly; do not open a blank “What are you working on?” form.
- Dragging across empty schedule space creates a new event draft with the selected start and end already populated. Focus the title and preselect the appropriate destination calendar.
- Offer advanced event settings through an expanded editor. Do not require the user to understand an internal distinction between “time block” and “linked task” before creating an event.
- Existing blocks expose resize affordances at their boundaries. Show the resulting interval during the gesture and preserve the object being resized.
- The reference calendar uses **64px per hour** and **15-minute snapping**. Treat these as scheduling-component defaults, not spacing rules for unrelated apps.
- Keep drag feedback local: one preview, one clear destination, and a stable surrounding layout. Persist the result, expose errors, and restore the prior state if saving fails.

### Keyboard behavior must agree across views

Use a shared action registry for handlers, menus, tooltips, and shortcut help. An action keeps the same shortcut wherever it appears. Every displayed shortcut must work in that context.

Reference task-app mappings:

| Action | Shortcut |
| --- | --- |
| Enter Today view | `Shift+T` |
| Enter Board view | `Shift+B` |
| Edit planned/estimated time | `E` |
| Edit actual time | `W` |
| Assign P0–P3 while creating/editing, including typing | `Alt+Shift+0` through `Alt+Shift+3` (`Option` on macOS). |
| Open **and close** shortcut help | `?` |
| Toggle companion panel | `>` |

These mappings are examples for a task app; other domains should retain the consistency rule. Unmodified global shortcuts must not consume normal typing in inputs or rich-text editors. Modal shortcuts belong to the active modal. Escape closes the top dismissible layer, and closing returns focus to the initiating control. A control advertised as a toggle must work in both directions.

## 8. Mobile keeps the same hierarchy with different mechanics

- Replace desktop navigation with the mobile navigation appropriate to the app. Do not compress every desktop toolbar into the same horizontal row.
- Let users pan a board naturally across cards. On the reference Ideas board, touch dragging requires a **350ms hold**, with **8px movement tolerance**, so an ordinary swipe scrolls.
- Use a dedicated handle when column reordering would conflict with scrolling. Do not apply `touch-action: none` to the entire board.
- Snap columns on small screens and retain a visible hint of adjacent content. Keep vertical scrolling within the active column and horizontal scrolling on the board.
- Reuse the actual column headers for orientation. Avoid extra selectors and repeated column lists that consume another toolbar row.
- Opening a new-item sheet immediately focuses its editable title and presents the keyboard. Keep that field visible above the keyboard and account for safe-area insets.
- Subtask titles receive the available line width. Timing controls may move to a secondary row. Ordinary words must not fracture into narrow vertical stacks.
- Desktop 24–36px controls are visual-density references. For coarse pointers, provide approximately 44px interaction targets through layout or non-overlapping hit areas. Preserve visual compactness without making taps unreliable.
- Respect text scaling. Mobile editable fields may use 16px text to avoid browser focus zoom; do not disable user zoom to maintain desktop density.

## 9. Motion, icons, scrolling, and accessibility

- Use a consistent outline icon family such as Lucide. Standard icon sizes are 14px in dense chrome, 16px in content/rails, and 12px for tiny secondary controls. Keep stroke weight consistent.
- Use **150ms** for hover/focus/color changes, **200ms** for ordinary transitions, and at most **300ms** for structural reveals. Default easing is `cubic-bezier(0.4, 0, 0.2, 1)`.
- Animate only properties that explain a state change. Avoid decorative bouncing, large rotations, glowing hover halos, or repeated entrance animation. Honor reduced motion.
- Custom desktop scrollbars may be 6px wide/high, with transparent tracks and 4px-radius neutral thumbs. The reference thumb uses muted foreground at 20%, increasing to 50% on hover. Preserve native touch behavior and discoverable overflow.
- Tooltips explain compact icons and show shortcuts after a short delay; the reference rail uses 300ms. Every icon-only action also has an accessible name.
- Provide visible keyboard focus, correct control semantics, selected/expanded state, and keyboard alternatives to dragging.
- Verify contrast in each theme: target 4.5:1 for normal essential text and 3:1 for meaningful graphical controls. The reference uses subdued metadata; do not blindly compound opacity until important information becomes unreadable.
- Loading, empty, error, disabled, selected, hover, and focus states use the same tokens. None should introduce a second visual style.

## 10. Guardrails for future apps

The following choices would change this design rather than reproduce it:

- Large dashboard tiles, 24–32px padding on every list card, 48–56px desktop inputs, or 24px body text.
- Colored column backgrounds, rainbow sections, fixed pink/orange accents, gradients, glass blur, glow, or decorative textures in the workspace.
- Heavy borders around every panel, nested outlined boxes, excessive shadows, and pill-shaped controls everywhere.
- Full explanatory labels occupying permanent toolbar space when a compact icon and accessible tooltip suffice.
- Repeated navigation for the same visible content, empty space between a rail and its panel, and globally stretched card widths.
- Tiny fixed-width title columns, broken word wrapping, clipped card corners, or hidden content caused by nested overflow.
- Hover-only essential actions on touch devices, shortcut hints that disagree with handlers, and forms that ask users to repeat the context of their gesture.

## 11. Acceptance checklist

Use the same populated fixture at a wide desktop viewport, a narrow desktop viewport, and a 390px-wide mobile viewport. Include long titles, many columns, nested rows, empty groups, and real overflow.

- [ ] Computed font family, sizes, line heights, widths, padding, gaps, radii, and control heights match the reference recipes.
- [ ] Light mode has the specified white/gray surface separation. Dark mode has neutral near-black layers, quiet card edges, and readable text.
- [ ] At least two substantially different user accents update every accent-dependent state while leaving base surfaces neutral.
- [ ] Font preference changes reach menus, forms, dialogs, and embedded views as well as the main page.
- [ ] Cards wrap naturally and their corners/shadows remain intact at scroll boundaries.
- [ ] Side panels and their rails stay adjacent; centered layouts center the whole working group.
- [ ] Toolbars remain compact and each action has one clear place. Full descriptions remain accessible.
- [ ] Keyboard focus, shortcuts, modal dismissal, and focus restoration work consistently.
- [ ] Mobile horizontal panning, vertical scrolling, deliberate dragging, title autofocus, and keyboard avoidance all work on a real touch device.
- [ ] Zoom/text scaling and reduced motion preserve usability. Theme contrast has been measured rather than assumed.
- [ ] Screenshots at matching viewport, font, content, and theme confirm the proportions. Review behavior as well as still images.

## 12. Implementation references

This document contains the portable specification; the links below identify its source implementation and can be omitted when copying it to another project.

- [Theme, surface, font, shadow, and motion tokens](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/index.css).
- [Tailwind semantic token mapping](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/tailwind.config.ts).
- [Global header](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/layout/header.tsx), [planner toolbar](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/kanban/kanban-board-toolbar.tsx), and [companion panel and rail](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/app/right-panel.tsx).
- [Day column](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/kanban/day-column.tsx) and [compact task card](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/kanban/task-card-content.tsx).
- [Ideas tray](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/ideas/idea-column.tsx) and [board scrolling and touch gestures](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/ideas/ideas-board-view.tsx).
- [Buttons](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/ui/button.tsx), [inputs](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/ui/input.tsx), and [detail editor](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/components/kanban/task-modal.tsx).
- [Shared keyboard actions](https://github.com/ShadowWalker2014/open-sunsama/blob/320307f4ac7c203a42822de9262ed1747650a4ee/apps/web/src/hooks/useKeyboardShortcuts.tsx).

## Reusable implementation brief

Build a compact neutral workspace using this document's exact tokens and component measurements. Use Geist, 14px/20px content text, 13px controls, 11px metadata, and restrained 18px section headings. Use a 44px global header, 28–36px desktop controls, 8px-radius cards with 12px horizontal and 8px vertical padding, and 8px card gaps. Use white/light-gray/white layering for contained boards, neutral near-black equivalents in dark mode, and faint card edges. Keep brand color in meaningful actions and states; apply user appearance preferences globally. Keep panels attached to their rails, titles flexible, and mobile boards naturally swipeable. Reveal secondary detail progressively, preserve gesture context, and make keyboard and touch behavior as deliberate as the visual layout. Validate the measured result against this specification instead of interpreting “clean and modern” as permission to invent new styling.
