# Invitation Banao

Premium animated wedding-invitation websites. Planning docs live in [`docs/`](docs/README.md);
Claude Code conventions are in [`CLAUDE.md`](CLAUDE.md).

**Status:** Phase 5 (guests & personal links) complete — see [docs/15-development-phases.md](docs/15-development-phases.md).

## Stack

Next.js 15 (App Router, Node runtime) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui ·
PostgreSQL + Prisma 6 · Auth.js v5 · Vitest · Playwright

## Local setup

Requirements: Node 20+, pnpm 9, PostgreSQL 15+ running locally (or a Neon database).

```bash
pnpm install
cp .env.example .env        # then fill in DATABASE_URL and AUTH_SECRET
createdb vivah_dev
createdb vivah_test          # used by integration tests
pnpm db:migrate             # applies prisma/migrations
pnpm db:seed                # upserts the 5 launch templates
pnpm dev                    # http://localhost:3000
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`.

### Signing in locally

- **Email link (no setup):** without `AUTH_RESEND_KEY`, the magic link is printed in the terminal running
  `pnpm dev`. Open it in the same browser.
- **Google:** set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (OAuth client with redirect URI
  `http://localhost:3000/api/auth/callback/google`). The Google button only appears when these are set.
- **Real email:** set `AUTH_RESEND_KEY` and `EMAIL_FROM` (verified Resend domain).

## Media uploads

- **Local development (default):** uploads are stored in `.data/uploads/` (git-ignored) and served by
  `/api/v1/media/local/…`. HEIC/AVIF need Cloudinary.
- **Cloudinary:** set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (and
  `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`). Uploads then go directly from the browser to Cloudinary with signed
  parameters, and images are served with `f_auto,q_auto` responsive transforms. Required in production.

## Rate limiting

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis) so limits hold across
server instances. Without them, limits are kept in memory per instance (fine for development).

## Template demos

With `pnpm dev` running:

- http://localhost:3000/templates/royal-heritage/preview
- http://localhost:3000/templates/minimal-luxury/preview

Query params: `?palette=<id>`, `?font=<id>`, `?intensity=SUBTLE|STANDARD|DRAMATIC`, `?guest=1`
(personalised view), `?envelope=0` (skip the envelope), `?embed=1` (hide the demo bar).

Regenerate placeholder demo art: `node scripts/generate-demo-art.mjs`.

## Scripts

| Command                                                   | What it does                                                                                                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                                | Dev server                                                                                                                                                     |
| `pnpm lint` / `pnpm typecheck`                            | ESLint (incl. folder-boundary rules) / `tsc --noEmit`                                                                                                          |
| `pnpm test`                                               | Vitest: `unit` (jsdom) + `integration` (Postgres `vivah_test` on the same server as `DATABASE_URL`; override with `TEST_DATABASE_URL`)                         |
| `pnpm test:e2e`                                           | Playwright (mobile + desktop). Once: `pnpm exec playwright install chromium`. Against a running dev server: `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e` |
| `pnpm db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma                                                                                                                                                         |
| `pnpm format`                                             | Prettier                                                                                                                                                       |
