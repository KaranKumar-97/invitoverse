# 12 — Recommended Project Folder Structure

Single Next.js app (Node runtime) — no monorepo for the MVP. Boundaries are enforced by folders and
lint rules instead of packages.

```
vivah-studio/
├── CLAUDE.md
├── docs/                                  # these planning docs
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── templates/<slug>/                  # template textures, posters, envelope art
│   ├── music/                             # bundled royalty-free tracks (or hosted on Cloudinary)
│   └── brand/                             # logo, favicons
├── scripts/                               # one-off scripts (media cleanup dry-run, etc.)
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx                 # header/footer
│   │   │   ├── page.tsx                   # home
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx               # catalogue
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx           # template detail
│   │   │   │       └── preview/page.tsx   # full-screen demo (no marketing chrome → own layout)
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── (legal)/terms|privacy/page.tsx
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                 # requireUser + shell
│   │   │   └── dashboard/
│   │   │       ├── page.tsx               # overview
│   │   │       ├── account/page.tsx
│   │   │       └── invitations/
│   │   │           ├── page.tsx           # list
│   │   │           ├── actions.ts         # create/duplicate/archive/... server actions
│   │   │           ├── new/page.tsx
│   │   │           └── [id]/
│   │   │               ├── edit/
│   │   │               │   ├── page.tsx
│   │   │               │   ├── actions.ts # saveDraft, publish, slug...
│   │   │               │   └── _components/ (EditorShell, DetailsForm, EventsForm, MediaManager, DesignPanel, PreviewPane)
│   │   │               ├── guests/
│   │   │               │   ├── page.tsx
│   │   │               │   ├── actions.ts
│   │   │               │   └── _components/
│   │   │               └── share/page.tsx
│   │   ├── preview/[id]/page.tsx          # owner-only draft render for the editor iframe
│   │   ├── i/[slug]/
│   │   │   ├── page.tsx                   # public invitation
│   │   │   ├── not-found.tsx
│   │   │   └── guest/[token]/page.tsx     # personalized invitation
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── og/[slug]/route.tsx
│   │   │   ├── health/route.ts
│   │   │   ├── cron/media-cleanup/route.ts
│   │   │   └── v1/
│   │   │       ├── media/sign/route.ts
│   │   │       ├── beacon/open/route.ts
│   │   │       ├── ics/[slug]/[eventId]/route.ts
│   │   │       ├── contact/route.ts
│   │   │       ├── templates/route.ts
│   │   │       └── invitations/[id]/guests.csv/route.ts
│   │   ├── layout.tsx                     # root: fonts (studio), providers, analytics
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   │
│   ├── components/                        # studio UI (landing + dashboard)
│   │   ├── ui/                            # shadcn/ui generated primitives
│   │   ├── marketing/                     # Hero, TemplateCard, HowItWorks, FAQ...
│   │   └── dashboard/                     # Sidebar, StatCard, StatusPill...
│   │
│   ├── templates/                         # ★ template packages (see doc 05)
│   │   ├── registry.ts
│   │   ├── _starter/                      # copy-me skeleton
│   │   ├── royal-heritage/
│   │   ├── minimal-luxury/
│   │   ├── floral-romance/
│   │   ├── cinematic-elegance/
│   │   └── modern-editorial/
│   │
│   ├── invitation-kit/                    # ★ shared renderer + behaviours for templates
│   │   ├── InvitationRenderer.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── SectionBoundary.tsx
│   │   ├── motion/ (Reveal.tsx, Stagger.tsx, presets.ts)
│   │   ├── music/ (useMusicController.ts, MusicToggle.tsx)
│   │   ├── countdown/useCountdown.ts
│   │   ├── media/ (CloudImage.tsx, Lightbox.tsx, VideoPlayer.tsx)
│   │   ├── events/ (MapLink.tsx, AddToCalendar.tsx, formatEventDate.ts)
│   │   ├── particles/Particles.tsx
│   │   ├── preview-bridge.ts              # postMessage listener in preview mode
│   │   └── types.ts                       # TemplateModule, SectionComponent, RenderableInvitation
│   │
│   ├── lib/                               # isomorphic (client + server safe)
│   │   ├── invitation/
│   │   │   ├── schema.ts                  # ★ Zod: InvitationContent, DesignConfig, Event...
│   │   │   ├── manifest.ts                # TemplateManifest type + optionsToZod
│   │   │   ├── resolve.ts                 # resolveRenderable
│   │   │   ├── checklist.ts               # publish checklist rules
│   │   │   ├── migrate.ts                 # content schema migrations
│   │   │   └── defaults.ts
│   │   ├── preview/messages.ts            # typed postMessage protocol
│   │   ├── slug.ts                        # slugify, RESERVED_SLUGS, validation
│   │   ├── urls.ts                        # publicUrl(), guestUrl(), whatsappUrl()
│   │   ├── action-result.ts
│   │   └── utils.ts                       # cn(), formatters
│   │
│   ├── server/                            # server-only ("server-only" import)
│   │   ├── auth/
│   │   │   ├── config.ts                  # Auth.js config
│   │   │   └── session.ts                 # requireUser(), getOptionalUser()
│   │   ├── db/prisma.ts
│   │   ├── authz/                         # getOwnedInvitation(), assertOwner...
│   │   ├── services/
│   │   │   ├── invitations.ts
│   │   │   ├── publishing.ts
│   │   │   ├── public-invitations.ts      # getPublishedInvitationBySlug, getGuestView
│   │   │   ├── guests.ts
│   │   │   ├── guest-tokens.ts
│   │   │   ├── media.ts
│   │   │   ├── templates.ts
│   │   │   └── entitlements.ts            # canUseTemplate() — payment seam
│   │   ├── integrations/
│   │   │   ├── storage/ (MediaStorage.ts, cloudinary.ts)
│   │   │   ├── email/resend.ts
│   │   │   └── ratelimit.ts
│   │   └── cache-tags.ts
│   │
│   ├── styles/globals.css                 # Tailwind + studio tokens
│   └── middleware.ts                      # auth gate, security headers, coarse rate limit
│
├── tests/
│   ├── unit/                              # schema, resolve, checklist, slug, tokens
│   ├── integration/                       # services against a test Postgres (Neon branch / docker)
│   ├── templates/contract.test.tsx        # renders every registered template
│   └── e2e/                               # Playwright: create→publish→guest flows, privacy checks
├── .env.example
├── next.config.ts
├── tailwind.config.ts (if needed with v4) / postcss.config.mjs
├── eslint.config.mjs
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

## Boundary rules (enforce with `eslint-plugin-boundaries` or `no-restricted-imports`)

| Folder | May import | Must not import |
|---|---|---|
| `src/templates/**` | `src/invitation-kit/**`, `src/lib/invitation/**` types, `motion`, React | `src/server/**`, Prisma, `src/components/dashboard/**` |
| `src/invitation-kit/**` | `src/lib/**`, `motion`, React | `src/server/**`, `src/components/**` |
| `src/lib/**` | zod, date-fns | `src/server/**`, React-only code in non-tsx files |
| `src/server/services/**` | Prisma, integrations, `src/lib/**` | `next/*` (except `next/cache` in a thin `cache-tags.ts`), React |
| `src/app/**` | everything | Prisma directly (go through services) |

## Environment variables (`.env.example`)

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
LAUNCH_ALL_FREE=true

# Database (Neon)
DATABASE_URL=postgresql://...-pooler.../vivah?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://.../vivah?sslmode=require

# Auth.js
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_RESEND_KEY=
EMAIL_FROM="Vivah Studio <hello@vivah.studio>"

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Upstash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Ops
SENTRY_DSN=
CRON_SECRET=
CONTACT_INBOX=
```
