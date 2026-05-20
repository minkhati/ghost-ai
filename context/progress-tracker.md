# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Feature 18 — Starter Templates (feature-specs/18-starter-template.md) ✓ Complete

## Completed

- **Feature 18 — Starter Templates** (feature-specs/18-starter-template.md)
  - `components/editor/starter-templates.ts` — `CanvasTemplate` interface; helper functions `n()`/`e()` for concise node/edge creation; `CANVAS_TEMPLATES` array with three predefined templates: Microservices (API gateway → auth/user/order services, DBs, message broker), CI/CD Pipeline (source → build → test → staging → production with artifact store and monitoring), Event-Driven System (3 producers → event bus → 3 consumers); all nodes use `NODE_COLORS` palette and `SHAPE_SIZES`
  - `components/editor/starter-templates-modal.tsx` — `StarterTemplatesModal` dialog; SVG-based `TemplatePreview` per card (fits all nodes into a 220×128 viewport using scale/translate transform; draws edges as lines between node centers; renders all six node shapes as SVG primitives); 3-column scrollable grid of template cards each showing preview, name, description, and import button; `onImport` + `onOpenChange(false)` on click
  - `components/editor/editor-navbar.tsx` — added `onOpenTemplates?: () => void` prop; "Templates" button with `LayoutTemplate` icon rendered before Share in the right section
  - `components/editor/workspace-client.tsx` — added `isTemplatesOpen` state; wired `onOpenTemplates` to navbar; passed `isTemplatesOpen`/`onCloseTemplates` to `CanvasWrapper`
  - `components/editor/canvas-wrapper.tsx` — added `isTemplatesOpen`/`onCloseTemplates` props; forwarded to `Canvas`
  - `components/editor/canvas.tsx` — `Canvas`/`CanvasInner` accept `isTemplatesOpen`/`onCloseTemplates` props; `handleTemplateImport` removes all existing nodes/edges then adds template nodes/edges via Liveblocks `onNodesChange`/`onEdgesChange`, then fits view; `StarterTemplatesModal` rendered inside `CanvasContext.Provider`

- **Feature 17 — Canvas Ergonomics** (feature-specs/17-canvas-ergonomics.md)
  - `hooks/useKeyboardShortcuts.ts` — new hook; receives a flow instance (typed with `zoomIn`/`zoomOut`) and undo/redo handlers; listens on `window` for `keydown`; skips editable targets (`INPUT`, `TEXTAREA`, `contenteditable`); supports `+`/`=` zoom in, `-` zoom out, `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` and `Cmd/Ctrl+Y` redo
  - `components/editor/canvas.tsx` — removed `MiniMap`; imported `useUndo`, `useRedo`, `useCanUndo`, `useCanRedo` from `@liveblocks/react`; added `CanvasControlBar` component (pill-shaped, two groups: zoom out/fit/in and undo/redo, separated by thin divider, disabled buttons dim at 0.3 opacity); added `Panel position="bottom-left"` for the control bar; `CanvasInner` calls all Liveblocks history hooks and passes them to both the control bar and `useKeyboardShortcuts`; zoom methods use `{ duration: 300 }` for smooth animation
  - `app/globals.css` — added `.canvas-control-bar`, `.canvas-control-bar-divider`, `.canvas-control-btn` classes; hover and disabled states via CSS

- **Feature 16 — Edge Behavior** (feature-specs/16-edge-behavior.md)
  - `types/canvas.ts` — added `CanvasEdgeData` interface (`label?: string`); updated `CanvasEdge` to `Edge<CanvasEdgeData, "canvasEdge">`
  - `components/editor/canvas-context.tsx` — added `onEdgesChange: OnEdgesChange<CanvasEdge>` to `CanvasContextValue` and default no-op
  - `components/editor/canvas-edge.tsx` — new custom edge renderer: `getSmoothStepPath` for right-angle routing; SVG `<defs>` marker arrow with color driven by `selected` prop; wide transparent stroke (16px, `pointerEvents="stroke"`) for easy clicking; visible 1.5px path with `.canvas-edge-path` CSS for dimmed-at-rest / bright-on-hover-or-selected states; `EdgeLabelRenderer` positioned at `(labelX, labelY)` from `getSmoothStepPath`; double-click on interaction path or label area starts editing; auto-sizing `<input>` via `size` attr; blur/Enter/Escape all save; pill badge for saved labels, faint hint when selected+empty; `nodrag nopan` + `stopPropagation` to prevent canvas drag during editing; `EdgeReplaceChange` dispatched through `onEdgesChange`
  - `components/editor/canvas-node.tsx` — replaced two handles with four: `source` handles at Top/Right/Bottom/Left, each with a unique `id`
  - `components/editor/canvas.tsx` — added `edgeTypes = { canvasEdge: CanvasEdgeRenderer }`; `defaultEdgeOptions = { type: "canvasEdge" }`; passed `onEdgesChange` into `CanvasContext.Provider`
  - `app/globals.css` — `.react-flow__node-canvasNode .react-flow__handle` hidden (opacity 0) by default, fade in on node hover, accent color on handle hover; `.canvas-edge-path` dimmed stroke at rest, bright on `.react-flow__edge:hover` or `--selected` modifier; `.canvas-edge-label` pill badge; `.canvas-edge-label-hint` faint text; `.canvas-edge-input` pill input with accent border

- **Feature 15 — Node Color Toolbar** (feature-specs/15-nodes-color-toolbar.md)
  - `types/canvas.ts` — added `NodeColorPair` interface (`bg`, `text`, `name`); added `NODE_COLORS` array with 8 predefined pairs (neutral/blue/purple/orange/red/pink/green/teal); added `DEFAULT_NODE_TEXT_COLOR`; added `textColor` field to `CanvasNodeData`
  - `app/globals.css` — added `node-color-{0–7}` classes setting `--node-bg`/`--node-text` per pair; `node-shape`/`node-shape-text` classes consuming those vars; `node-color-toolbar` class for above-node positioning; `node-color-swatch`/`node-color-swatch--active` classes for swatch states; `node-swatch-{0–7}` classes setting `--swatch-bg`/`--swatch-ring`/`--swatch-glow`/`--swatch-hover-glow` per pair (8-digit hex alpha); hover glow via CSS `:hover:not(.active)` — no JS state
  - `components/editor/canvas-node.tsx` — shapes now consume `var(--node-bg)`/`var(--node-text)` via CSS classes (no inline styles); root div carries `node-color-{i}` class derived from `colorIndex()` lookup; added `ColorSwatch` (class-driven, `aria-label` from pair name) and `ColorToolbar` (floats above node via `node-color-toolbar` class, stops propagation on mouseDown/pointerDown); `handleColorSelect` commits `NodeReplaceChange` with new `color`/`textColor` through Liveblocks `onNodesChange`; editing textarea uses `node-shape-text` class for text color
  - `components/editor/canvas.tsx` — node creation now includes `textColor: DEFAULT_NODE_TEXT_COLOR`

- **Feature 14 — Node Editing** (feature-specs/14-node-editing.md)
  - `components/editor/canvas-context.tsx` — new `CanvasContext` providing `onNodesChange: OnNodesChange<CanvasNode>` to node components; consumed via `useCanvasActions()`
  - `components/editor/canvas.tsx` — wraps `ReactFlow` subtree with `CanvasContext.Provider` supplying the Liveblocks `onNodesChange` from `useLiveblocksFlow`
  - `components/editor/canvas-node.tsx` — added `NodeResizer` (visible when selected and not editing; 7×7px handles styled with `--bg-elevated` fill and `--accent-primary` border; dashed lines at 50% opacity; minWidth 60, minHeight 40); added inline label editing: double-click sets `isEditing`, focuses textarea via `useEffect`; textarea overlaid `absolute inset-0` centered via flex; blur commits via `NodeReplaceChange` through `onNodesChange` → Liveblocks; Escape sets `cancelledRef` before blur to skip commit; `stopPropagation` on `mouseDown`/`pointerDown` prevents canvas drag/pan during editing; empty label shows `text-copy-faint` placeholder when not editing

- **Feature 13 — Node Shape** (feature-specs/13-node-shape.md)
  - `components/editor/canvas-node.tsx` — replaced placeholder with proper shape renderers: `RectangleShape`/`PillShape`/`CircleShape` via CSS (`rounded-xl`/`rounded-full`/`rounded-full` with `bg-surface` fill and `border-surface-border`/`border-accent-primary`); `DiamondShape`/`HexagonShape`/`CylinderShape` via absolute SVG (`viewBox="0 0 100 100" preserveAspectRatio="none"`, `vectorEffect="non-scaling-stroke"` for uniform stroke); shapes dispatched via `SHAPE_COMPONENTS` record; handles at top/bottom preserved
  - `components/editor/shape-panel.tsx` — added drag preview: suppresses native drag image via `setDragImage` with off-screen element; tracks cursor via `onDrag`; renders `ShapePreview` portal into `document.body` when dragging; clears on `dragEnd`; added `type="button"` on shape buttons
  - `app/globals.css` — added `.drag-preview` (fixed position overlay driven by CSS custom props `--preview-x/y`) and `.drag-preview-shape` (size driven by `--preview-w/h`) to avoid inline styles for static properties

- **Feature 12 — Shape Panel** (feature-specs/12-shape-panel.md)
  - `types/canvas.ts` — added `ShapeType` union, `ShapeDragPayload` interface, `SHAPE_SIZES` map (sensible defaults per spec), `DEFAULT_NODE_COLOR`
  - `components/editor/shape-panel.tsx` — floating pill toolbar with draggable icon buttons for rectangle, diamond, circle, pill, cylinder, hexagon; sets `application/ghost-shape` drag payload with shape name and size
  - `components/editor/canvas-node.tsx` — basic renderer for `canvasNode` type; bordered rectangle with centered label, target/source handles; selected state uses `border-accent-primary`
  - `components/editor/canvas.tsx` — wrapped in `ReactFlowProvider` so `useReactFlow` is available; `CanvasInner` handles `onDragOver`/`onDrop`, converts screen coords via `screenToFlowPosition`, creates node via `onNodesChange([{ type: "add", item }])`; `useLiveblocksFlow<CanvasNode, CanvasEdge>` typed; `nodeTypes` constant registered; `ShapePanel` rendered inside `<Panel position="bottom-center">`; node ID format: `{shape}-{timestamp}-{counter}`

- **Feature 11 — Base Canvas** (feature-specs/11-base-canvas.md)
  - `types/canvas.ts` — `CanvasNodeData` interface (`label`, `color`, `shape`); `CanvasNode` and `CanvasEdge` typed aliases via `@xyflow/react` `Node`/`Edge`
  - `components/editor/canvas.tsx` — client component; `useLiveblocksFlow({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })`; `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, dot-pattern `Background`, and `Cursors`
  - `components/editor/canvas-wrapper.tsx` — client component; `LiveblocksProvider` (`authEndpoint="/api/liveblocks-auth"`), `RoomProvider` (room ID + `initialPresence: { cursor: null, isThinking: false }`), `CanvasErrorBoundary` (class-based), `ClientSideSuspense` loading fallback
  - `components/editor/workspace-client.tsx` — canvas placeholder replaced with `<CanvasWrapper roomId={project.id} />`

- **Feature 10 — Liveblocks Setup** (feature-specs/10-liveblocks-setup.md)
  - `liveblocks.config.ts` — typed `Presence` (`cursor: { x; y } | null`, `isThinking: boolean`) and `UserMeta` (`id`, `info.name`, `info.avatar`, `info.color`)
  - `lib/liveblocks.ts` — lazy `getLiveblocks()` singleton (global-cached, deferred past build time); `getCursorColor(userId)` maps any user ID deterministically to one of 8 fixed colors via djb2-style hash
  - `app/api/liveblocks-auth/route.ts` — `POST`; requires Clerk auth; verifies project access via `getProjectWithAccess`; calls `getOrCreateRoom` (private by default); issues ID token with `name`, `avatar`, `color`; returns `403` for unauthorized access
  - `@liveblocks/node` — installed (was missing from dependencies)
  - `.env.local` — added `LIVEBLOCKS_SECRET_KEY` placeholder (populate from Liveblocks dashboard)

- **Feature 08 — Editor Workspace Shell** (feature-specs/08-editor-workspace-shell.md)
  - `lib/project-access.ts` — `getCurrentIdentity()` returns `{ userId, email }` via Clerk; `getProjectWithAccess(roomId, userId, email)` checks owner or collaborator before returning the project
  - `components/editor/access-denied.tsx` — centered layout with lock icon, short message, and link back to `/editor`
  - `components/editor/editor-navbar.tsx` — extended with optional `title`, `onShare`, `isAiOpen`, `onAiToggle` props; workspace uses share button and `PanelRightOpen`/`PanelRightClose` AI toggle
  - `components/editor/project-sidebar.tsx` — added optional `activeProjectId` prop; active item rendered with persistent `bg-elevated` highlight
  - `components/editor/workspace-client.tsx` — client shell: sidebar + AI panel state, `EditorNavbar` with project name, `ProjectSidebar` with `activeProjectId`, canvas placeholder, collapsible AI sidebar placeholder; all project dialogs wired
  - `app/editor/[roomId]/page.tsx` — async server component; unauthenticated → redirect `/sign-in`; missing or unauthorized project → `<AccessDenied />`; fetches owned + shared projects for sidebar; renders `WorkspaceClient`

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

- Feature 19 (check context/feature-specs/ for the next spec file)

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
