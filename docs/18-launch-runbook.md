# 18 — Launch Runbook

Step-by-step for taking Vivah Studio from this repository to a live domain. Everything in the code is
ready; the steps below need **your accounts** and are done in each provider's dashboard. Budget about
half a day, plus DNS propagation time.

Tick the boxes as you go. Doc 14 §8 is the summary checklist; this is the detailed version.

---

## 0. Before you start

- [ ] Code is in a GitHub repository (private is fine). CI (`.github/workflows/ci.yml`) runs on every PR.
- [ ] You own the domain (e.g. `vivah.studio`) and can edit its DNS.
- [ ] Generate two secrets locally and keep them in a password manager:

```bash
openssl rand -base64 32
```

```bash
openssl rand -hex 32
```

The first is `AUTH_SECRET`, the second `CRON_SECRET`.

## 1. Database — Neon (Postgres)

1. Create a project in **AWS ap-southeast-1 (Singapore)**.
2. Copy both connection strings:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** → `DATABASE_URL_UNPOOLED` (used by migrations)
3. Settings → **Point-in-time restore**: confirm the retention window (≥ 7 days).
4. Optional: install the Vercel ↔ Neon integration so every PR preview gets its own database branch.

## 2. Media — Cloudinary

1. Create a product environment. Settings → **API Keys**: copy cloud name, API key, API secret.
2. Settings → Security: enable **"Strip image metadata"** (removes GPS EXIF).
3. Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
4. Replace the generated demo photos/music with licensed ones (see each template's `CREDITS.md`).

## 3. Email — Resend

1. Add your domain; create the **SPF, DKIM and DMARC** records it shows. Wait for "Verified".
2. Create an API key → `AUTH_RESEND_KEY`.
3. `EMAIL_FROM="Vivah Studio <hello@yourdomain>"`, `CONTACT_INBOX=` the address that receives contact-form messages.

## 4. Sign-in — Google OAuth

1. Google Cloud Console → APIs & Services → **OAuth consent screen**: External, app name, logo,
   support email, privacy/terms URLs (`https://yourdomain/privacy`, `/terms`). Submit for verification.
2. Credentials → **OAuth client ID** (Web):
   - Authorised origin: `https://yourdomain`
   - Redirect URI: `https://yourdomain/api/auth/callback/google`
3. Env: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.

Email magic links work without Google; Google is optional but recommended.

## 5. Rate limits — Upstash Redis

1. Create a Redis database (region: Singapore).
2. Copy the **REST** URL and token → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

Without these, limits still work but are per server instance.

## 6. Errors — Sentry

1. Create a **Next.js** project.
2. `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` = the project DSN.
3. For readable stack traces: `SENTRY_ORG`, `SENTRY_PROJECT`, and an auth token with
   `project:releases` scope → `SENTRY_AUTH_TOKEN` (build-time only).
4. Alerts → create rules for:
   - error-rate spike,
   - any issue on `/i/*` pages,
   - the log message `csp.violation` (after CSP enforcement).

Events are scrubbed before sending (guest tokens, emails, phone numbers) — `src/lib/observability/scrub.ts`.

## 7. Hosting — Vercel

1. Import the GitHub repo. Framework: Next.js. **Build command comes from `vercel.json`**
   (`pnpm vercel-build`: generate → migrate → seed templates → build). Region: `sin1`.
2. Add all env vars from `.env.example` to **Production** (and **Preview** with preview-specific values):
   - `NEXT_PUBLIC_APP_URL=https://yourdomain`
   - `LAUNCH_ALL_FREE=true`
   - everything from steps 1–6, plus `AUTH_SECRET`, `CRON_SECRET`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_INSTAGRAM_URL`
   - **Preview only:** `CSP_REPORT_ONLY=1`
3. Deploy. Then Settings → Domains → add `yourdomain` (and `www` → redirect). HTTPS is automatic.
4. Settings → **Cron Jobs**: confirm both jobs from `vercel.json` are listed
   (03:00 and 03:30 IST).
5. To make yourself an admin (for `/admin`), run once against production:

```bash
psql "$DATABASE_URL_UNPOOLED" -c "UPDATE \"User\" SET role='ADMIN' WHERE email='you@example.com'"
```

## 8. CSP rollout

1. Preview deployments run with `CSP_REPORT_ONLY=1` for about a week. Watch Vercel logs for
   `"event":"csp.violation"`.
2. When the logs are quiet, production stays enforcing (no `CSP_REPORT_ONLY`). Automated tests already
   assert zero violations on every page type.

## 9. HSTS preload

After a few days of the domain working on HTTPS (the header is already sent:
`max-age=63072000; includeSubDomains; preload`), submit the domain at hstspreload.org.
Only do this once **every** subdomain is HTTPS.

## 10. Monitoring

Create two monitors in UptimeRobot or Better Stack (1-minute interval, alert by email/WhatsApp):
- `https://yourdomain/api/health` — expects HTTP 200 and `"status":"ok"`.
- One published demo invitation, e.g. `https://yourdomain/i/<your-demo-slug>` — expects HTTP 200.

## 11. Restore drill (do once before launch)

1. Neon → Branches → **Create branch** from main at a timestamp ~10 minutes ago.
2. Point a local checkout at it:
   `DATABASE_URL=<branch pooled url> DATABASE_URL_UNPOOLED=<branch direct url> pnpm dev`.
3. Sign in and confirm your invitations and guests are there. Note how long it took.
4. Delete the branch. Record the date and duration in doc 16's decision log.

To actually roll production back: create the branch, then swap the env vars in Vercel and redeploy
(or use Neon "Restore" on main). Code rollbacks: Vercel → Deployments → **Instant rollback**.

## 12. Final smoke test (production)

- [ ] `/` loads, the hero phones play, the contact form sends to `CONTACT_INBOX`.
- [ ] Sign in with email and with Google.
- [ ] Create → upload a real photo (Cloudinary) → publish → open on a phone in WhatsApp.
- [ ] Add a guest → send their link → open it → status shows **Opened**.
- [ ] `/admin` shows numbers for you and 404 for a non-admin account.
- [ ] Sentry receives a test error (Sentry → project → "Send test event" or trigger one in preview).

## 13. Still open at launch (by decision)

- Three templates (Floral Romance, Cinematic Elegance, Modern Editorial) are "Coming soon".
- Lighthouse scores and real-device checks (Redmi/Samsung A-series, WhatsApp webview on iOS/Android) are
  manual — run them on the production URL.
- Terms and Privacy are a sound starting draft; have them reviewed by someone with legal expertise.
