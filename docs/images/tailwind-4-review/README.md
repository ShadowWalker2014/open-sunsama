# Tailwind 3 → 4 visual comparison

Captured at 1440 × 900 in Chromium with reduced motion from upstream `main` at `02b72e2` (Tailwind 3) and this branch (Tailwind 4). Both runs used the same mocked user, three dated tasks, one backlog task, and empty calendar events; no live account or database was used. Each column uses the same route, viewport, theme, and data.

| View | Tailwind 3 | Tailwind 4 |
| --- | --- | --- |
| Board · light | ![Board before, light](before-board-light.png) | ![Board after, light](after-board-light.png) |
| Board · dark | ![Board before, dark](before-board-dark.png) | ![Board after, dark](after-board-dark.png) |
| Calendar · light | ![Calendar before, light](before-calendar-light.png) | ![Calendar after, light](after-calendar-light.png) |
| Calendar · dark | ![Calendar before, dark](before-calendar-dark.png) | ![Calendar after, dark](after-calendar-dark.png) |
| Settings · light | ![Settings before, light](before-settings-light.png) | ![Settings after, light](after-settings-light.png) |
| Settings · dark | ![Settings before, dark](before-settings-dark.png) | ![Settings after, dark](after-settings-dark.png) |
| Landing · light | ![Landing before, light](before-landing-light.png) | ![Landing after, light](after-landing-light.png) |
| Landing · dark | ![Landing before, dark](before-landing-dark.png) | ![Landing after, dark](after-landing-dark.png) |

The landing product image animates independently of Tailwind; the still frame may differ slightly between captures. These Chromium comparisons do not replace testing on a macOS 11 machine with Safari 16.4+.
