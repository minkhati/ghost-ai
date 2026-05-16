# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Feature 03 — Authentication (feature-specs/03-auth.md) ✓ Complete

## Completed

- **Feature 03 — Authentication** (feature-specs/03-auth.md)
  - `@clerk/ui` installed for dark theme support
  - `.env.local` — added `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `proxy.ts` — `clerkMiddleware` protected-first pattern; public routes derived from env vars; standard Next.js 16 matcher
  - `app/layout.tsx` — `ClerkProvider` wrapping `<body>` with `dark` theme from `@clerk/ui/themes`; appearance variables wired to CSS custom properties (`--bg-base`, `--accent-primary`, `--text-primary`, etc.)
  - `app/sign-in/[[...sign-in]]/page.tsx` — two-panel layout (left: logo/tagline/feature list hidden on small screens; right: Clerk `<SignIn />` form)
  - `app/sign-up/[[...sign-up]]/page.tsx` — same two-panel layout with Clerk `<SignUp />`
  - `app/page.tsx` — async server component: authenticated users redirect to `/editor`, unauthenticated to `/sign-in`
  - `app/editor/page.tsx` — minimal client page rendering `EditorNavbar` + `ProjectSidebar`; required by the `/` redirect target
  - `components/editor/editor-navbar.tsx` — `UserButton` added to right section

- **Feature 02 — Editor chrome** (feature-specs/02-editor.md)
  - `components/editor/editor-navbar.tsx` — fixed `h-12` top navbar (`z-40`), left sidebar toggle with `PanelLeftOpen`/`PanelLeftClose`, empty right section
  - `components/editor/project-sidebar.tsx` — fixed overlay (`z-30`), slides in from left, `isOpen` prop, Projects header + X close, shadcn Tabs (My Projects / Shared) with empty states, full-width New Project button
  - Dialog pattern: satisfied by existing `components/ui/dialog.tsx` (shadcn); no new dialog built
- **Feature 01 — Design system** (feature-specs/01-design-system.md)
  - `app/globals.css` — dark-only CSS custom properties, shadcn variables
    mapped to dark palette, project semantic tokens (`--bg-base`, `--text-primary`,
    `--accent-primary`, etc.), Tailwind v4 `@theme inline` mappings for all
    project utility names (`bg-base`, `text-copy-primary`, `text-brand`, etc.)
  - `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
  - `components/ui/button.tsx` — shadcn Button
  - `components/ui/card.tsx` — shadcn Card
  - `components/ui/dialog.tsx` — shadcn Dialog
  - `components/ui/input.tsx` — shadcn Input
  - `components/ui/tabs.tsx` — shadcn Tabs
  - `components/ui/textarea.tsx` — shadcn Textarea
  - `components/ui/scroll-area.tsx` — shadcn ScrollArea
  - `app/layout.tsx` — added `dark` class to `<html>` so shadcn `dark:` variants activate

## In Progress

- None.

## Next Up

- Feature 04 (check context/feature-specs/ for the next spec file)

## Open Questions

- None at this time.

## Architecture Decisions

- **Clerk proxy.ts**: Next.js 16 renamed middleware to `proxy.ts`. All Clerk route protection lives there. Protected-first pattern: everything blocked by default, public routes (`/sign-in`, `/sign-up`) explicitly allowed via env vars.
- **ClerkProvider placement**: Inside `<body>` (current SDK v7+ requirement). Wraps the full app.
- **Clerk appearance**: `dark` theme from `@clerk/ui/themes` as base; CSS custom property references (`var(--...)`) used for appearance variables so colors stay in sync with the design system without hardcoding.
- **Tailwind v4 CSS-based config**: no `tailwind.config.js`. All theme tokens
  defined in `globals.css` via `:root` CSS variables and `@theme inline` mappings.
- **shadcn base-nova style**: shadcn initialized with `--defaults` which selected
  the base-nova preset. Component files live in `components/ui/` and must not be
  edited after generation.
- **Dark-only**: `:root` and `.dark` both carry the dark palette. `<html>` has
  `class="dark"` so shadcn `dark:` utility variants are always active.
- **lucide-react**: was already installed as a peer dep when shadcn init ran.

## Session Notes

- Next.js 16.2.6, React 19, Tailwind v4 (`@tailwindcss/postcss`).
- `@import "shadcn/tailwind.css"` provides keyframes and custom variants for
  shadcn components — do not remove.
- All color tokens must be referenced through CSS variable names, not hardcoded
  hex values or raw Tailwind color classes.
- Clerk SDK: `@clerk/nextjs` v7+ (current SDK). Uses async `auth()`, `clerkMiddleware` from `@clerk/nextjs/server`.
