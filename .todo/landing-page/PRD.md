# Landing Page

## Problem
Currently, the Open Sunsama web app redirects users directly to `/login` when accessing the root URL `/`. There's no public-facing landing page to explain what the product is, showcase its features, or convert visitors into users. This is a barrier for new users discovering the app.

## Solution
Create a modern, Linear-style landing page at the `/` route that serves as the public entry point. The page will showcase the app's key features (AI agent compatibility, time blocking, task management) and provide clear CTAs to sign up or log in. Authenticated users visiting `/` will still be redirected to `/app`.

## Technical Implementation

### Components

1. **Landing Page Component** (`apps/web/src/routes/landing.tsx`)
   - Main landing page with hero, features, and CTA sections
   - Uses existing UI components (Button, Card) from shadcn/ui
   - Responsive design with Tailwind CSS
   - Dark mode compatible using existing CSS variables

2. **Route Configuration Update** (`apps/web/src/routeTree.gen.tsx`)
   - Update the `indexRoute` to render the landing page component instead of redirecting
   - Keep redirect logic for authenticated users (redirect to `/app` if token exists)

### Page Sections

1. **Hero Section**
   - App logo (Calendar icon + "Open Sunsama" text, matching auth-layout)
   - Headline: emphasize AI-agent compatibility and open-source nature
   - Subheadline: brief value proposition
   - Primary CTA: "Get Started" → `/register`
   - Secondary CTA: "Sign In" → `/login`

2. **Features Section**
   - 3-column grid on desktop, stacked on mobile
   - Feature cards highlighting:
     - AI Agent Compatible (API access for Claude, etc.)
     - Time Blocking (visual calendar, drag-and-drop)
     - Task Management (priorities, subtasks, rich notes)
   - Use Lucide icons consistent with existing app

3. **CTA Section**
   - Final call-to-action before footer
   - "Start organizing your time" with sign-up button
   - Mention it's free and open source

4. **Footer**
   - Minimal footer with "Free and open source" (matching auth-layout)
   - Optional: link to GitHub repo

### Flow
1. User visits `/` → Landing page renders (no auth check blocks rendering)
2. User clicks "Get Started" → Navigates to `/register`
3. User clicks "Sign In" → Navigates to `/login`
4. Authenticated user visits `/` → Redirected to `/app`

### File Changes

| File | Change |
|------|--------|
| `apps/web/src/routes/landing.tsx` | New file - Landing page component |
| `apps/web/src/routeTree.gen.tsx` | Update indexRoute to use LandingPage component |

### Design Guidelines
- Follow existing Linear-style aesthetic (clean, minimal, lots of whitespace)
- Use existing color scheme from `index.css` (`--background`, `--foreground`, `--muted`, etc.)
- Typography: `font-semibold` for headings, `text-muted-foreground` for secondary text
- Consistent with `auth-layout.tsx` visual style
- Full responsive support (mobile-first approach)
- Support both light and dark modes automatically

### Component Structure
```tsx
// apps/web/src/routes/landing.tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />      {/* Logo + nav links */}
      <Hero />        {/* Main headline + CTAs */}
      <Features />    {/* 3-column feature grid */}
      <CTA />         {/* Final call-to-action */}
      <Footer />      {/* Minimal footer */}
    </div>
  );
}
```

## Edge Cases
- Authenticated users should be redirected to `/app` (preserve existing behavior)
- Handle dark/light mode transitions smoothly
- Ensure all links work correctly (`/login`, `/register`)
- Page should be fully functional without JavaScript (progressive enhancement)
- Mobile navigation should be touch-friendly with adequate tap targets
