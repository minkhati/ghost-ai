# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Feature 07 — Wire Editor Home (feature-specs/07-wire-editor-home.md) ✓ Complete

## Completed

- **Feature 07 — Wire Editor Home** (feature-specs/07-wire-editor-home.md)
  - `lib/projects.ts` — `getOwnedProjects(userId)` and `getSharedProjects(email)` server-side Prisma helpers
  - `hooks/use-project-actions.ts` — replaces mock `use-project-dialogs.ts`; manages dialog state, generates `roomId` (slug + short random suffix), calls `POST /api/projects` with custom `id`, navigates to new workspace; `PATCH` rename with `router.refresh()`; `DELETE` with redirect-or-refresh based on `activeProjectId`
  - `components/editor/editor-home-client.tsx` — client shell containing navbar, sidebar, dialogs, and main CTA; receives `ownedProjects` and `sharedProjects` as serialized props
  - `app/editor/page.tsx` — converted to async server component; fetches owned + shared projects via Clerk `auth()`/`currentUser()` and passes serialized lists to `EditorHomeClient`
  - `app/api/projects/route.ts` — POST now accepts optional `id` field; validated as `[a-z0-9-]+` and passed to Prisma create to keep project ID and Liveblocks room ID aligned
  - `components/editor/create-project-dialog.tsx` — `slug` prop renamed to `roomId`; preview label updated
  - `components/editor/rename-project-dialog.tsx`, `delete-project-dialog.tsx`, `project-sidebar.tsx` — updated `Project` import to `hooks/use-project-actions`
  - `hooks/use-project-dialogs.ts` — deleted (fully replaced)

- **Feature 06 — Project APIs** (feature-specs/06-project-apis.md)
  - `app/api/projects/route.ts` — `GET` lists the authenticated user's projects (ordered by `createdAt` desc); `POST` creates a project (defaults name to `Untitled Project`); both return 401 if unauthenticated
  - `app/api/projects/[projectId]/route.ts` — `PATCH` renames a project; `DELETE` removes it; both return 401 if unauthenticated and 403 if the caller is not the owner; `params` awaited per Next.js 16 convention
  - `lib/prisma.ts` — added explicit `PrismaClient` return type annotation to `createClient()` (with `as unknown as PrismaClient` cast for the Accelerate branch) to resolve union-type signature conflict that surfaced when query methods were first called

- **Feature 05 — Prisma** (feature-specs/05-prisma.md)
  - `prisma/models/project.prisma` — `Project` model (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, timestamps, indexes on ownerId and createdAt) and `ProjectCollaborator` model (project relation w/ cascade delete, email, createdAt, unique on projectId/email, indexes on email and projectId/createdAt)
  - `lib/prisma.ts` — cached singleton; branches on `DATABASE_URL`: `prisma+postgres://` → Accelerate via `withAccelerate()`; otherwise direct `PrismaPg` adapter; cached on `global` in dev
  - `prisma/migrations/20260517211606_init/migration.sql` — initial migration applied to database
  - `app/generated/prisma/` — generated Prisma client output

- **Feature 04 — Project Dialogs** (feature-specs/04-project-dialogs.md)
  - `hooks/use-project-dialogs.ts` — manages dialog state, form state, mock project list; exposes `openCreate`, `openRename`, `openDelete`, `closeDialog`, `handleCreate`, `handleRename`, `handleDelete`
  - `components/editor/create-project-dialog.tsx` — name input, live slug preview
  - `components/editor/rename-project-dialog.tsx` — prefilled input, current name in description, Enter submits
  - `components/editor/delete-project-dialog.tsx` — destructive confirmation, no input
  - `components/editor/project-sidebar.tsx` — project items with rename/delete actions (owned only), mobile backdrop scrim, wired `onNewProject` footer button
  - `app/editor/page.tsx` — editor home content (heading, description, New Project button), all dialogs wired

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
  - `components/editor/editor-navbar.tsx` — fixed `h-12` top navbar (`z-40`), left sidebar toggle with `PanelLeftOpen`/`PanelLeftClose`, right section contains `UserButton` (added in Feature 03)
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

- Feature 08 (check context/feature-specs/ for the next spec file)

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
