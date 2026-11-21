# CLAUDE.md — Vivah Studio (working name)

A premium web app for creating animated, personalized wedding invitation websites from
professionally designed templates. Think "digital wedding invitation studio": a luxury
marketing site, an owner dashboard with a live-preview editor, and per-invitation animated
websites served from one centralized Next.js app.

> Product name: **Invitation Banao**, set in ONE place — `src/lib/brand.ts` (override with
> `NEXT_PUBLIC_BRAND_NAME`, read at build time). Never hard-code the name; import `BRAND`.
> Internal names (database, repo, Cloudinary folder, package name) stay neutral and never use it.

## Read these first (in order)

All planning lives in [`docs/`](docs/README.md). Before starting any phase, read:

1. [docs/README.md](docs/README.md) — index and how the docs fit together
2. [docs/15-development-phases.md](docs/15-development-phases.md) — find the current phase, its tasks and acceptance criteria
3. Only the docs that phase lists under **"Read before starting"**

Do not try to load every doc at once; each phase names what it needs.

## Ground rules

- **Build one phase at a time.** Finish the phase's acceptance criteria, then stop and summarize.
  Do not start the next phase unless the user asks.
- **MVP scope is strict.** No payments, RSVP, attendance tracking, planning tools, vendors,
  AI video, subscriptions or native apps. See [docs/01-prd.md §Out of scope](docs/01-prd.md).
  Payment _readiness_ is limited to what [docs/17-future-payments.md](docs/17-future-payments.md) describes.
- **Stack is fixed:** Next.js (App Router) + React + TypeScript (strict) + Tailwind CSS +
  Motion (Framer Motion) + **Node.js runtime** (Next.js route handlers / server actions) +
  **PostgreSQL + Prisma** + Auth.js + Cloudinary + Vercel.
  Do not add libraries outside [docs/02-architecture.md §Approved libraries](docs/02-architecture.md)
  without asking.
- **One data model for every template.** Templates never define their own data shape. Content
  is validated by the shared Zod schemas in `src/lib/invitation/schema.ts`.
- **Adding a template must not touch the editor, API or database.** Only `src/templates/<slug>/`
  plus registry lines in `src/templates/registry.ts` and `src/templates/components.ts`
  (checklist: docs/05-template-engine.md §11).
- **Authorization on every server mutation and read of private data.** Use `requireUser()` and
  `getOwnedInvitation()` helpers ([docs/13-security.md](docs/13-security.md)). Never trust an id from the client.
- **Guests are isolated.** A guest page may only receive that guest's data. Never serialize the
  guest list, other tokens, or owner data to the client.
- **Premium feel is a requirement, not polish.** Follow [docs/11-design-system.md](docs/11-design-system.md).
  Animate only `transform` and `opacity`; respect `prefers-reduced-motion`.
- **Mobile first.** Every screen is designed and tested at 375px first.

## Conventions

- Package manager: `pnpm`. Node 20+.
- Paths: `@/*` → `src/*`.
- Bundle size: keep `radix-ui` in `experimental.optimizePackageImports` (the umbrella import otherwise ships
  ~80 KB of unused Radix to every page with a `Button`). Toasts/tooltips live in `StudioProviders`
  (dashboard + editor layouts only) — never in the root layout.
- Modules that can run in the browser import `z` from `@/lib/zod` (jitless), never from "zod" — Zod's
  `new Function` probe is a CSP eval violation.
- CSP lives in `src/lib/security/csp.ts`: dynamic routes get a nonce via middleware (`NONCE_ROUTE_PATTERNS`),
  static routes get the policy from next.config. Adding a dynamic page outside those patterns? Add it there.
- Studio UI supports light/dark (`data-theme` on `<html>`, docs/11 §2). Use tokens (`bg-surface`, `text-ink`,
  `bg-primary text-primary-foreground` for selected states) — not `bg-white`/`text-white`/`bg-ink` pairs. A fixed
  colour that must stay fixed needs a `dark:` variant or a comment. Invitation pages are always light.
- `cn()` runs tailwind-merge, which treats custom `text-*` utilities (`text-eyebrow`, `text-display-l`) as colors
  and drops them when a color class follows. Combine those with a template string, not `cn()`.
- Server code in `src/server/**` is server-only (`import "server-only"`).
- Mutations from the dashboard use **Server Actions** that call services in `src/server/services/*`.
  Write each as `export async function x(input) { return runAction(Schema, input, handler); }`
  (`src/server/actions/define.ts`) — Next.js rejects non-function exports in `"use server"` files.
  Route handlers in `src/app/api/**` exist only where HTTP is required (uploads, beacons, auth).
- Constants shared by server pages and client components live in plain modules (no `"use client"`);
  a server component importing a value from a client module only gets a client reference.
- shadcn/ui: after `pnpm dlx shadcn@latest add …`, replace any `from "cn"` import with `from "@/lib/utils"`
  and run `pnpm remove cn` — the CLI keeps resolving our alias to an unrelated npm package.
- next/font: load variable families without `weight` (fixed weights can break `next build`).
- dnd-kit: always pass `id={useId()}` to `DndContext` (avoids hydration mismatches).
- OG images (`next/og`): every `div` with more than one child needs `display: "flex"`; build text with template strings.
- Public data comes only from `src/server/services/public-invitations.ts`; any change that affects a live page must call
  `invalidatePublic(slug)` (`src/server/cache-tags.ts`).
- Tests: `pnpm test` runs a `unit` (jsdom) and an `integration` (Postgres `vivah_test`, auto-migrated)
  project. E2E: `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e` against a running dev server. Against a local
  production build add `E2E_PROD=1` (skips the local-upload test; production needs Cloudinary).
- Validation: Zod at every boundary (form, action input, JSONB columns read from the DB).
- Money is stored as integer paise (`amountPaise`), currency `INR`.
- IDs: `cuid()` for internal ids (only ever used behind an ownership check). Never expose sequential ids.
  Public URLs use slugs and guest tokens only. Guest tokens: 22-char base64url (128-bit `crypto.randomBytes`).
- Database access only through the Prisma client in `src/server/db/prisma.ts`, imported only by services.
  JSONB columns are parsed with Zod before being handed to templates.
- Commits: small and per task. Use conventional commit prefixes (`feat:`, `fix:`, `chore:`).

## Commands (once scaffolded)

```bash
pnpm dev            # local dev
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest
pnpm test:e2e       # playwright
pnpm db:migrate     # prisma migrate dev
pnpm db:seed        # seed templates + demo invitation
```

## Definition of done (every task)

- `pnpm lint && pnpm typecheck && pnpm test` pass
- Works at 375px and 1440px
- No console errors; no hydration warnings
- Authorization checked for any new server entry point
- Docs updated if a decision changed (note it in [docs/16-risks-and-tradeoffs.md §Decision log](docs/16-risks-and-tradeoffs.md))
