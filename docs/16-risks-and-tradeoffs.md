# 16 — Risks, Trade-offs & Decision Log

## 1. Key trade-offs

| # | Decision | Alternative | Why this way | Cost we accept |
|---|---|---|---|---|
| T1 | **Hybrid template engine** (code templates + JSON content/design) | Pure JSON page-builder | Premium bespoke choreography per template; one data model; fast to build | New templates need a deploy and a developer; no self-serve template builder |
| T2 | **Events inside content JSONB** with stable ids | `Event` table with FKs from guests | Published snapshots are self-contained; editor saves one document; simpler publish | No FK integrity between `Guest.eventIds` and events → service cleans dangling ids on publish; can't query events across invitations with SQL easily (not needed in MVP) |
| T3 | **Draft/published snapshot columns** on the invitation row | Separate `InvitationVersion` table | Simple, one row read for public pages | No version history/rollback (future: add `InvitationVersion` and point to it) |
| T4 | **Plaintext guest tokens** (128-bit) | Hashed tokens | Owner can re-copy links any time | DB leak exposes guest links (low-sensitivity pages; mitigated by revocation) |
| T5 | **Next.js full-stack (Node runtime)**, no separate Express API | Separate Node/Express backend | One deploy, shared types, less plumbing | Must keep services framework-agnostic to extract later |
| T6 | **PostgreSQL + Prisma** | MongoDB | Relational integrity for owners/guests/orders, JSONB for documents, Prisma migrations | JSON content validated by Zod, not DB constraints |
| T7 | **Auth.js** | Clerk | Free, user data in our DB (needed for orders/entitlements) | We build sign-in UI and handle email deliverability |
| T8 | **Cloudinary** | S3 + CloudFront | Transforms, video posters, focal crops out of the box | Higher cost at scale → `MediaStorage` abstraction to switch |
| T9 | **Iframe live preview + postMessage** | Render preview inline in the editor | True mobile viewport, CSS/font isolation, same renderer as production | Messaging protocol to maintain; slightly more memory |
| T10 | **Motion (Framer Motion)** | GSAP | React-idiomatic, smaller with LazyMotion | Complex timelines are more verbose; revisit if a template needs SVG morphing |
| T11 | **Open counted on "Open" tap** | Count page loads | Avoids WhatsApp preview crawler false positives | Guests who load but never tap aren't counted |
| T12 | **Invitations `noindex` by default** | Indexable | Privacy expectation for weddings | No organic SEO from invitations (badge links still drive referrals) |

## 2. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Animations janky on low-end Android / in-app webviews | High | High | Compositor-only rules; device-memory/`saveData` heuristics to reduce particles; test matrix (Redmi/Samsung A-series, WhatsApp webview); reduced intensity fallback |
| Autoplay music blocked / audio glitches on iOS | Medium | Medium | Start only on Open tap; `playsinline`; preload none; visible toggle; graceful no-music |
| Large photo uploads on slow networks | High | Medium | Direct-to-Cloudinary uploads with progress and retry; client-side downscale for > 4000px before upload (canvas) |
| Templates look "template-y", not premium | Medium | High | Design reviews per template before coding (Figma or rendered stills); dedicated illustration budget; doc 10 acceptance |
| Indic script rendering issues | Medium | Medium | Noto fallbacks per script; test names in Devanagari, Gurmukhi, Tamil, Urdu |
| Token leaks via forwarding | High | Low | Accepted; regenerate; pages reveal only intended info |
| Content schema evolves and breaks old invitations | Medium | High | `schemaVersion` + `migrateContent`; contract tests against fixtures of old versions |
| Template code changes alter already-published invitations | Medium | Medium | Manifest `version`; breaking visual changes ship as new template or behind option defaults that preserve old look |
| Cloudinary cost spike from video | Medium | Medium | Video size caps, `q_auto`, poster-first, monitor credits, YouTube option |
| Vercel function cold starts on guest pages | Low | Medium | Small route bundles; Neon pooled driver; region colocated with DB |
| Scope creep (RSVP, payments) | High | Medium | Strict out-of-scope list (doc 01 §4); seams exist (`Guest.rsvp`, `Entitlement`) |
| Copyright of fonts/music/imagery | Medium | High | Google Fonts (OFL) only; royalty-free music with license record; credits file per template |

## 3. Decision log

Append a row whenever a decision changes during build.

| Date | Decision | Reason | Docs updated |
|---|---|---|---|
| 2026-11-19 | Stack: Node.js (via Next.js) + PostgreSQL/Prisma + React/Next.js | Product owner choice; Mongo considered and rejected in favour of Postgres + JSONB | 02, 03, 04, CLAUDE.md |
| 2026-11-19 | Hybrid template engine | See T1 | 05 |
| 2026-11-19 | Pinned Next.js 15.5 (not 16) and Prisma 6 | Match the planned architecture (`middleware.ts`, Auth.js v5 + Prisma adapter); upgrade later as its own task | 02 |
| 2026-11-19 | Standard `PrismaClient` (no Neon driver adapter) | Works with local Postgres and Neon's pooled URL; add `@prisma/adapter-neon` only if cold-start latency requires it | 03 §6 |
| 2026-11-19 | Dev magic links print to the server console when `AUTH_RESEND_KEY` is unset | Sign-in works locally without email or Google setup | README |
| 2026-11-19 | Brand maroon token is `--maroon` (not `--accent`) | shadcn/ui reserves `--accent` for hover surfaces | 11 §2 |
| 2026-11-19 | Middleware only checks for the session cookie; layouts/actions verify against the DB | Database sessions can't be validated on the edge without Prisma | 13 §2 |
| 2026-11-19 | Envelope API is `onOpenStart` / `onReveal` / `onOpened` (+ `reducedMotion`) | Music must start inside the tap gesture; content needs to reveal before the overlay is removed | 05 §6, 10 §6 |
| 2026-11-19 | Content gains optional `city`; Royal option `showGaneshaArt` → `showInvocationArt` (lotus/diya ornament) | Hero needs a location line; a respectful hand-drawn deity illustration needs commissioned art | 05 §4, 10 §1 |
| 2026-11-19 | Envelopes animate with `motion/react-mini` (WAAPI); `domAnimation` loads lazily | Guest-page JS: preview route 227 → 191 KB first load. Still above the 180 KB NFR (webpack keeps Motion's projection code) — revisit in Phase 7 bundle pass | 05 §10 |
| 2026-11-19 | Indic fallbacks use variable Noto fonts (no fixed weights) | Fixed-weight requests return dynamic-subset URLs that `next/font` can't self-host at build time | — |
| 2026-11-19 | Demo photos and music are generated originals (`scripts/generate-demo-*.mjs`) | No licensed assets yet; replace before launch (see each template's CREDITS.md) | 10 §0 |
| 2026-11-19 | Drafts use a lenient `DraftContentSchema` (shape enforced, values may be empty); publish uses the strict schema; previews go through `coerceForPreview` | Autosave on every keystroke must never reject half-typed input; invalid links never render | 05 §5 |
| 2026-11-19 | Content gains `sample: SampleKey[]`; new invitations start from the template's demo content marked as sample | Preview looks finished immediately; publish checklist (Phase 4) can flag leftover sample data | 05 §4, 06 §3 |
| 2026-11-19 | Server Actions are `async function`s calling `runAction(schema, input, handler)` | Next.js forbids `export const x = wrapper(...)` in "use server" files | CLAUDE.md |
| 2026-11-19 | Editor lives in its own route group `(editor)` (same URL, full-width layout, no dashboard sidebar) | Three-column editor needs the whole viewport | 08 §5, 12 |
| 2026-11-19 | Preview updates batched per microtask (not requestAnimationFrame) | rAF is throttled in background/hidden tabs; microtasks keep updates < 100 ms | 02 §4 |
| 2026-11-19 | Dashboard row menus use `DropdownMenu modal={false}` | Opening a modal AlertDialog from a modal menu can leave `pointer-events: none` on `<body>` | — |
| 2026-11-19 | Product is B2C self-serve from the start (couples sign up and build their own) | Clarified with owner; B2C additions (checkout, try-before-signup, internal admin) estimated at ~2–3 weeks on top of the plan | 01, 17 |
| 2026-11-19 | Media storage: Cloudinary when `CLOUDINARY_*` is set, otherwise a dev-only local provider (`.data/uploads`, HMAC-signed upload tokens, served by `/api/v1/media/local/*`); production refuses to start uploads without Cloudinary | Build and test uploads without an account; identical sign → upload → confirm flow | 04 §2.4, 13 §5 |
| 2026-11-19 | Cloudinary via plain `fetch` (signed upload, Admin API inspect, destroy) instead of the SDK | Three small calls; no extra dependency | 02 §1 |
| 2026-11-19 | `saveDraft` verifies every media reference (content + design background) belongs to this invitation's live uploads, or is a bundled demo asset | Stops embedding other users' uploads or arbitrary Cloudinary URLs | 13 §4–5 |
| 2026-11-19 | Media deletes are soft (undo restores); removal from content happens client-side and is enforced by the reference check | Undo without conflicts with the draft's optimistic lock | 03 §7 |
| 2026-11-19 | Load Google fonts as variable fonts (omit `weight`) whenever the family is variable (Lora, Noto) | Fixed-weight requests intermittently return dynamic URLs that break `next build` | — |
| 2026-11-19 | dnd-kit `DndContext` always gets `id={useId()}` | Auto ids differ between SSR and client → hydration mismatch | — |
| 2026-11-21 | Public cache is keyed and tagged by **slug** (`slug:{slug}`), not invitation id; publish/unpublish/archive/delete/slug-change purge the affected slug(s) | `unstable_cache` tags must be known before the lookup; the slug is what public routes have | 06 §5, 14 §4 |
| 2026-11-21 | Publish keeps `draftUpdatedAt` untouched and sets `publishedAt` ≥ it | The editor's optimistic lock keeps working; "unpublished changes" = any save after publish | 06 §4 |
| 2026-11-21 | Publish checklist lives in `src/lib/invitation/checklist.ts` (pure); server re-runs it with entitlements | Live checklist in the UI without a round trip; server stays authoritative | 06 §3 |
| 2026-11-21 | Open beacon counts on the Open tap (or on load when the envelope is off), once per browser session; in-memory per-IP rate limit until Upstash (Phase 5) | Link-preview crawlers never tap; limits are per instance until Redis | 04 §2.5, 07 §6 |
| 2026-11-21 | OG images use the default (Latin) font; Indic names fall back to the monogram, Indic city/invocation omitted | Satori renders missing glyphs as boxes; bundling Indic fonts for OG is a Phase 6/7 polish item | 06 §7 |
| 2026-11-21 | Live invitations link "Add to calendar" to `/api/v1/ics/{slug}/{eventId}`; previews keep the client-side file | Real file URLs work in WhatsApp/Instagram in-app browsers; blob downloads often don't | 05 §9 |
| 2026-11-21 | Every guest-link failure (unknown, revoked, other invitation's token, unpublished, rate-limited) returns the **same 404 page** | No oracle between cases; 404 is the honest status (doc 07 originally said 200) | 07 §4, §7 |
| 2026-11-21 | Per-guest event access is a *presentation* filter: the guest's page only receives their events, but the public `/i/{slug}` link still shows all events, so `.ics` files stay public | MVP has no "private event" concept; a future "hide from public link" option would gate `.ics` by token | 07 §5 |
| 2026-11-21 | Rate limiting via Upstash REST (`fetch`, no SDK) when configured, else per-instance memory; fails open; invalid guest tokens counted separately (10 per 10 min per IP → lockout) | Works today without an account; a limiter outage never takes invitations down | 04 §5, 13 §7 |
| 2026-11-21 | Regenerating a link resets status to "Not shared" (unless already Opened) and clears `sharedAt` | The new link hasn't been sent yet | 08 §6 |
| 2026-11-21 | Guests of archived invitations are read-only (list/export only) | Matches media; restore to edit | — |
| 2026-11-21 | Phase 6 split: landing site, catalogue, detail, contact, legal and SEO shipped first; Floral Romance, Cinematic Elegance and Modern Editorial deferred (shown as "Coming soon") | Product owner choice | 15 |
| 2026-11-21 | Catalogue cards play the captured envelope loop (MP4/WebM, poster first, only in view, never with Save-Data or reduced motion) instead of mounting a live mini preview per card | Same visual result at a fraction of the JS/CPU; live preview stays on the detail page | 09 §3.2 |
| 2026-11-21 | Marketing pages read the catalogue from the code registry (static), not the `Template` table | Fully static marketing pages; no DB needed at build. Hiding a design = removing it from the registry | 09 §4 |
| 2026-11-21 | Template detail live preview (iframe) mounts only at ≥ 1024px; phones get the poster + full-screen demo links | A scaled iframe on a phone is unusable and doubles the page cost | 09 §5 |
| 2026-11-21 | Contact form: shared plain field rules (`contact-rules.ts`, no Zod in the browser) + Zod on the server; bot submissions (honeypot / < 2.5 s) get the same 200 as real ones | Keeps Zod (~27 KB) off the home page; bots learn nothing | 04 §2, 13 §7 |
| 2026-11-21 | Default social card is `/og` (static, not under `/api/`); template pages use `public/templates/<slug>/og.jpg` | Crawlers that honour robots.txt still fetch it | 09 §7 |
| 2026-11-21 | Removed `interest-cohort` from Permissions-Policy | FLoC is retired; Chrome logs it as a console error on every page | 13 §6 |
| 2026-11-21 | Home JS 236 → 127 KB: `radix-ui` added to `optimizePackageImports`, toasts/tooltips moved out of the root layout, native `<dialog>` mobile menu | Meets the ≤ 150 KB home target; dashboard pages also dropped 20–80 KB. Guest pages unchanged (Motion — Phase 7) | 09 §7 |
| 2026-11-21 | CSP: dynamic routes (dashboard, editor, preview, login, admin, guest pages) get `script-src 'self' 'nonce-…'` from middleware; static SSG/ISR routes get `'self' 'unsafe-inline'` from next.config | A per-request nonce forces dynamic rendering, which would end caching of marketing and public invitations. No `'strict-dynamic'`: it disables `'self'` and blocks Next's un-nonced chunk preloads | 13 §6 |
| 2026-11-21 | Browser-side Zod is `jitless` (`@/lib/zod`, lint-enforced) | Zod's `new Function` probe is reported as a CSP eval violation | CLAUDE.md |
| 2026-11-21 | No axe / Vercel Analytics packages (owner declined unapproved deps); accessibility is a hand-written Playwright audit (`tests/e2e/a11y.ts`), analytics `track()` stays a no-op hook | Keeps the dependency list as approved | 09 §7, 14 §6 |
| 2026-11-21 | Studio muted text `#8A8178` → `#736B62`; Minimal Luxury Ivory & Ink / Sage & Stone muted and accent darkened | Were 3.6–4.2:1; AA needs 4.5:1 body (3:1 large) — doc 10 §7 | 10, 11 §2 |
| 2026-11-21 | Section reveals and the music button use CSS transitions (+ IntersectionObserver) instead of Motion's `m`/`LazyMotion`; envelopes keep `motion/react-mini` | Guest pages 191 → 145 KB first-load JS (budget 180) | 05 §10 |
| 2026-11-21 | Sentry client SDK loads lazily after `load` and only when a DSN is set; events tunnelled same-origin; `beforeSend` scrubs tokens/emails/phones | ~1 KB on every page instead of ~25 KB; CSP stays `connect-src 'self'` | 13 §10 |
| 2026-11-21 | Media cleanup keeps soft-deleted assets that a *published* snapshot still references; purge removes a user's stored files before deleting the account | Live invitations never lose images; no orphaned files after account deletion | 14 §5 |
| 2026-11-21 | Magic links rate limited (5/hour per email, 20/hour per IP) | Was specified in doc 13 §1 but not implemented | 13 §1 |
| 2026-11-21 | pnpm overrides for postcss, effect, deepmerge-ts | Transitive build-tool advisories (4 high); `pnpm audit` now clean | — |
| 2026-11-21 | Studio UI "Refined" direction (owner's pick of two): serif display type, gold-foil accent words, gold hairline labels, lux buttons, gold-rimmed phones, paper grain; light/dark theme for marketing, sign-in, dashboard and editor (invitations always light) | More premium without changing layout or brand; dark mode follows the device unless chosen | 11 §2 |
| 2026-11-21 | Theme chosen before paint by a blocking same-origin `/theme-init.js` (no inline script, no cookie) | Inline scripts would need the CSP nonce on static pages; reading a cookie in the root layout would make every page dynamic | 13 §6 |
| 2026-11-22 | Product renamed to **Invitation Banao**; name lives only in `src/lib/brand.ts` (`NEXT_PUBLIC_BRAND_NAME` override) | Owner choice; renames become a one-line change. Infra names (repo, DB, storage) stay neutral | CLAUDE.md, all docs |
| 2026-11-22 | Added **Mandir** template (temple doors → walk-in sunset temple). Cover splits the gate painting into two CSS leaves at the seam; hero pins and zooms with `ScrollMotion`. Art is placeholder until rights are confirmed (see `src/templates/mandir/CREDITS.md`) | Owner reference `design-references/temple.mov`; no new libraries, no editor/API/DB changes | 05 §11, 10 |
| 2026-11-22 | Added **Vercel Web Analytics** (`@vercel/analytics`) for site traffic, rendered only when `VERCEL=1`; URLs scrubbed client-side (`analyticsUrl`) | Owner wanted traffic stats; cookieless and same-origin on Vercel (fits the CSP, no consent banner). Guest tokens, internal ids and private query params never leave the browser | 02 §1, 13 §9 |
| 2026-11-22 | Editor preview keeps events with no date/time yet (shown with the wedding date and 6 PM as placeholders) instead of dropping them | Owners fill venue and address before the date; dropped events made those fields look broken in the live preview. Publishing still requires real values | 06, 05 §8 |
| 2026-11-22 | Create flow is two steps (design → couple); the invitation link is chosen last, in the publish dialog, before the first publish | Owner feedback: events and details should come before the link. The draft gets a generated link (`createInvitation` without `slug`); reuses `checkSlug`/`changeSlug`, no API or DB change | 08 §4, 15 |
| 2026-11-22 | Editor tabs became a guided, soft stepper (Details → Events → Photos & music → Design → Publish) with Back/Continue; Publish is an inline last step instead of a dialog; Settings sits outside the flow | Owner feedback: tabs needed manual navigation. Soft steps (never block Continue) keep autosaved drafts editable in any order; the publish checklist stays the one gate | 08 §5 |
| 2026-11-22 | Countdown targets the wedding date (time of that day's first visible event, else midnight) instead of the first event | Owner feedback: kept sample events a year out made a live countdown read 369 days; the wedding date is what couples set and expect | 01 FR-I5, 05, 07 §5 |
| 2026-11-23 | Added **Kashi** template (Varanasi ghats: stone-arch cover, paper-cut couple diorama, arched event carousel, mural countdown/gallery). Art is placeholder until rights are confirmed (see `src/templates/kashi/CREDITS.md`) | Owner reference `design-references/RADHA WEDS KRISHNA_files`; no new libraries, no editor/API/DB changes. RSVP and Instagram from the reference left out (MVP scope / no data field) | 05 §11, 10 §5c |
