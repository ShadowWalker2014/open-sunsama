# Legal Pages (Privacy & Terms)

## Problem
The Open Sunsama web app lacks /privacy and /terms pages, which are essential for any SaaS application. Users need to be able to review the privacy policy and terms of service before signing up. These pages should also be linked from the landing page footer.

## Solution
Add MDX support to the Vite build and create /privacy and /terms routes that render MDX content within a shared legal layout. The layout will reuse the header/footer pattern from the landing page for visual consistency.

## Technical Implementation

### 1. MDX Vite Plugin Setup

**Install dependency** (`apps/web/package.json`)
- Add `@mdx-js/rollup` as a dev dependency

**Configure Vite** (`apps/web/vite.config.ts`)
- Import and add MDX plugin before the React plugin
- Configure MDX to use JSX runtime

```ts
import mdx from "@mdx-js/rollup";

export default defineConfig({
  plugins: [
    mdx({ jsxRuntime: "automatic" }),
    react(),
  ],
  // ...existing config
});
```

**TypeScript declaration** (`apps/web/src/mdx.d.ts`)
- Declare module for `.mdx` files so TypeScript understands MDX imports

### 2. MDX Content Files

**Content directory** (`apps/web/src/content/legal/`)
- `privacy.mdx` - Privacy policy content
- `terms.mdx` - Terms of service content

Content structure for each file:
- H1 title (Privacy Policy / Terms of Service)
- Last updated date
- Sectioned content with H2 headings
- Standard legal sections (data collection, user rights, etc.)

### 3. Shared Legal Layout Component

**Layout component** (`apps/web/src/components/layout/legal-layout.tsx`)
- Extracts header/footer pattern from `landing.tsx`
- Accepts `children` prop for MDX content
- Provides prose styling container for MDX

```tsx
interface LegalLayoutProps {
  children: React.ReactNode;
}

export function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LegalHeader />
      <main className="flex-1 container px-4 mx-auto max-w-3xl py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
```

**Typography plugin** (`apps/web/tailwind.config.ts`)
- Add `@tailwindcss/typography` plugin for prose styling
- Configure prose colors to match existing theme

### 4. Route Components

**Privacy route** (`apps/web/src/routes/privacy.tsx`)
```tsx
import { LegalLayout } from "@/components/layout/legal-layout";
import PrivacyContent from "@/content/legal/privacy.mdx";

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <PrivacyContent />
    </LegalLayout>
  );
}
```

**Terms route** (`apps/web/src/routes/terms.tsx`)
- Same pattern as privacy route, importing `terms.mdx`

### 5. Route Tree Update

**Add routes** (`apps/web/src/routeTree.gen.tsx`)
```tsx
import PrivacyPage from "./routes/privacy";
import TermsPage from "./routes/terms";

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

// Add to routeTree children
const routeTree = rootRoute.addChildren([
  indexRoute,
  privacyRoute,
  termsRoute,
  loginRoute,
  // ...rest
]);
```

### 6. Landing Page Footer Update

**Update footer** (`apps/web/src/routes/landing.tsx`)
- Add links to /privacy and /terms in footer
- Use TanStack Router `<Link>` component

```tsx
<footer className="border-t py-8">
  <div className="container px-4 mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="h-4 w-4" />
      <span>Open Sunsama</span>
    </div>
    <nav className="flex items-center gap-4 text-sm text-muted-foreground">
      <Link to="/privacy" className="hover:text-foreground transition-colors">
        Privacy
      </Link>
      <Link to="/terms" className="hover:text-foreground transition-colors">
        Terms
      </Link>
      <a href="https://github.com/..." className="flex items-center gap-2 hover:text-foreground transition-colors">
        <Github className="h-4 w-4" />
        GitHub
      </a>
    </nav>
  </div>
</footer>
```

### Flow
1. User clicks "Privacy" or "Terms" in footer → Navigates to /privacy or /terms
2. Route renders LegalLayout with MDX content
3. MDX content styled with Tailwind typography prose classes

### File Changes Summary

| File | Change |
|------|--------|
| `apps/web/package.json` | Add `@mdx-js/rollup`, `@tailwindcss/typography` |
| `apps/web/vite.config.ts` | Add MDX plugin configuration |
| `apps/web/src/mdx.d.ts` | New file - MDX type declarations |
| `apps/web/tailwind.config.ts` | Add typography plugin |
| `apps/web/src/content/legal/privacy.mdx` | New file - Privacy policy content |
| `apps/web/src/content/legal/terms.mdx` | New file - Terms of service content |
| `apps/web/src/components/layout/legal-layout.tsx` | New file - Shared layout component |
| `apps/web/src/components/layout/index.ts` | Export LegalLayout |
| `apps/web/src/routes/privacy.tsx` | New file - Privacy page route |
| `apps/web/src/routes/terms.tsx` | New file - Terms page route |
| `apps/web/src/routeTree.gen.tsx` | Add privacy and terms routes |
| `apps/web/src/routes/landing.tsx` | Add footer links to legal pages |

## Edge Cases
- MDX compilation errors should show clear error messages in dev mode
- Legal pages should be accessible without authentication
- Prose styling should respect dark/light mode theme
- Mobile layout should have adequate padding and readable line length
- Page scroll should start at top when navigating between legal pages
- SEO: Pages should have appropriate meta titles (can add later via head management)
