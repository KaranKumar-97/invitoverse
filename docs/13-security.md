# 13 — Security Considerations

## 1. Authentication

- Auth.js v5 with Google OAuth and Resend email magic links; **no passwords** stored.
- Database sessions (Prisma adapter), `httpOnly`, `secure`, `sameSite=lax` cookies; 30-day rolling expiry.
- Magic links: single use, 10-minute expiry, rate limited per email and per IP.
- `AUTH_SECRET` rotated via Vercel env; trusted host set to the production domain.
- Soft-deleted users (`deletedAt`) are rejected in the `session` callback.

## 2. Authorization (ownership)

Every private read/write goes through services that scope by owner:

```ts
// src/server/auth/session.ts
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("UNAUTHENTICATED");
  return session.user as { id: string; role: "USER" | "ADMIN" };
}

// src/server/authz/invitations.ts
export async function getOwnedInvitation(userId: string, id: string, select?: Prisma.InvitationSelect) {
  const inv = await prisma.invitation.findFirst({ where: { id, ownerId: userId }, select });
  if (!inv) throw new AppError("NOT_FOUND");   // never reveal existence
  return inv;
}
```

Rules:
- Never accept `ownerId` from the client. Never query by `id` alone in an owner context.
- Guests, media and share actions check ownership via the parent invitation (`where: { id, invitation: { ownerId } }`).
- `/dashboard/**` and `/preview/**` gated in middleware (cheap redirect) **and** in layouts/pages/actions (real check — middleware is not a security boundary on its own).
- Admin-only operations check `role === "ADMIN"`.
- Authz tests for every service function: owner A cannot read/modify owner B's resources.

## 3. Public data exposure

- Public routes select only published columns needed to render; no owner fields.
- Drafts are reachable only through `/preview/[id]` with session + ownership.
- Guest privacy rules: see [07-guest-links-and-privacy.md](07-guest-links-and-privacy.md).
- Disabled or archived invitations 404 everywhere.
- `robots.txt` disallows `/i/`, `/dashboard`, `/preview`; invitation pages send `noindex`.

## 4. Input validation & output encoding

- Zod on every action/route input; strings length-capped; URLs restricted:
  - Maps: hosts `maps.app.goo.gl`, `goo.gl/maps`, `www.google.com/maps`, `maps.google.com` only.
  - Video URLs: `youtube.com`, `youtu.be` only (rendered via `youtube-nocookie.com` embed).
  - Media URLs in content must be on our Cloudinary cloud (`res.cloudinary.com/<cloud>/`) — prevents hotlinking arbitrary hosts and tracking pixels.
- All user text rendered as React text (auto-escaped). **No `dangerouslySetInnerHTML`** with user data (lint rule). Line breaks via CSS `white-space: pre-line`.
- Hex colors validated `^#[0-9a-fA-F]{6}$`; font ids and options must exist in the manifest (no arbitrary CSS injection through design config).
- JSON size limits: content ≤ 200 KB, design ≤ 20 KB; Server Action body limit set in `next.config` (`serverActions.bodySizeLimit: "1mb"`).

## 5. Uploads

- Direct-to-Cloudinary **signed** uploads; signature only after authz, quota and type checks.
- Signed params pin `folder=invitoverse/{userId}/{invitationId}`, `public_id`, `resource_type`, allowed formats, max bytes (via upload preset), and eager transforms.
- Server confirms each upload via Cloudinary Admin API before recording it (trust nothing from the client).
- Allowed: images `jpg, jpeg, png, webp, heic, avif` ≤ 15 MB; video `mp4, mov, webm` ≤ 100 MB; audio `mp3, m4a, aac` ≤ 10 MB.
- Images delivered with Cloudinary transformations, which strip metadata (EXIF GPS) — set `fl_strip_profile`/default strip on delivery and `exif: false` on upload.
- Cleanup cron removes orphaned/deleted assets.

## 6. HTTP security headers (middleware / `next.config` headers)

| Header | Value |
|---|---|
| Content-Security-Policy | Built by `src/lib/security/csp.ts`. Dynamic routes (dashboard, editor, preview, login, guest pages; middleware): `script-src 'self' 'nonce-{n}'`. Static routes (marketing, `/i/{slug}`; next.config): `script-src 'self' 'unsafe-inline'`. Both: `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com; media-src 'self' blob: https://res.cloudinary.com; font-src 'self' data:; frame-src 'self' https://www.youtube-nocookie.com; connect-src 'self' https://api.cloudinary.com; object-src 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com; frame-ancestors 'self'; upgrade-insecure-requests; report-uri /api/csp-report`. `CSP_REPORT_ONLY=1` switches to report-only. Sentry is tunnelled same-origin. |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` (studio); **`no-referrer`** on `/i/**` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| X-Frame-Options | `SAMEORIGIN` (preview iframe is same-origin) |
| Cache-Control | `private, no-store` on `/dashboard/**`, `/preview/**`, `/i/*/guest/*` |

## 7. CSRF, rate limiting, abuse

- Server Actions: Next.js checks `Origin` vs `Host`; configure `serverActions.allowedOrigins` to the production domain only.
- Route handlers that mutate (`beacon`, `contact`, `media/sign`) check `Origin` and are rate limited (see [04-api-design.md §5](04-api-design.md)).
- Contact form: honeypot field + time-to-submit check + rate limit.
- Abuse: platform admin can set `Invitation.disabledAt` (takes everything down); report-abuse link in invite footer (`mailto:` in MVP).
- Limits: invitations per user (20), guests per invitation (1,000), media quota per invitation (300 MB).

## 8. Secrets & config

- Secrets only in Vercel env (Production / Preview / Development scopes); never `NEXT_PUBLIC_` for secrets.
- Cloudinary API secret and DB URLs used only in `src/server/**` (guarded by `server-only`).
- `.env*` in `.gitignore`; `.env.example` documents names only.
- Dependabot/Renovate + `pnpm audit` in CI.

## 9. Privacy & compliance (India DPDP Act 2023 awareness)

- Collect minimum data: owner email/name; guest names and optional phone entered by the owner (owner is data fiduciary for their guest list; we are processor).
- Privacy policy explains what's stored, retention (deleted invitations purged after 30 days), and how to request deletion.
- No third-party ad trackers. Page views go to cookieless Vercel Web Analytics, on Vercel deployments only (`SiteAnalytics` in the root layout). Every URL passes `analyticsUrl()` (`src/lib/analytics.ts`) first: guest tokens and invitation ids become `[token]`/`[id]`, `/preview/*` is dropped, and only `ref`/`utm_*` query params are kept. Invitation pages send `Referrer-Policy: no-referrer`, so tokens never reach a later page's referrer either.
- Guest phone numbers and private notes never leave the dashboard.
- Data export of guest list (CSV) available to the owner.

## 10. Logging & monitoring

- Sentry for server + client errors; `beforeSend` scrubs guest tokens, emails, phone numbers.
- Structured logs for security-relevant events: sign-in, publish/unpublish, guest token regenerate, delete, admin disable.
- Alerts: error-rate spike, 5xx on `/i/**`, beacon 429 spikes (possible token scanning).

## 11. Security test checklist (Phase 7)

- [ ] Authz tests: cross-tenant read/update/delete for invitations, guests, media → NOT_FOUND
- [ ] Draft not reachable via any public route (including OG and ICS endpoints)
- [ ] Guest payload privacy tests (doc 07 §9)
- [ ] XSS attempts in every text field render inert (`<script>`, `javascript:` URLs in maps field rejected)
- [ ] Upload signature cannot be reused for another folder; oversized/unsupported types rejected
- [ ] CSP has no violations on all templates (report-only first, then enforce)
- [ ] Rate limits verified on beacon, contact, magic link, guest routes
- [ ] `pnpm audit` clean (no high/critical)
