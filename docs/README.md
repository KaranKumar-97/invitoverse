# Vivah Studio — Planning Docs

Planning and specification for the MVP of a premium animated wedding-invitation website builder.
These docs are written for two readers: the product owner reviewing the plan, and Claude Code
building it phase by phase.

## Index

| # | Doc | Covers (from the brief's required deliverables) |
|---|-----|-----|
| 01 | [PRD](01-prd.md) | 1. MVP PRD · 2. Functional & non-functional requirements · 3. User journeys |
| 02 | [Architecture & tech stack](02-architecture.md) | 4. System architecture diagram · stack evaluation |
| 03 | [Database](03-database.md) | 5. ER diagram · 6. Database schema (PostgreSQL / Prisma) |
| 04 | [API design](04-api-design.md) | 7. API endpoint design |
| 05 | [Template engine](05-template-engine.md) | 8. Template engine architecture · JSON structures |
| 06 | [Publishing workflow](06-publishing-workflow.md) | 9. Invitation publishing workflow |
| 07 | [Guest links & privacy](07-guest-links-and-privacy.md) | 10. Guest-specific link generation and privacy |
| 08 | [Dashboard specs](08-dashboard-specs.md) | 11. Dashboard screen specifications |
| 09 | [Landing page specs](09-landing-page-specs.md) | 12. Public landing page specifications |
| 10 | [Template specs](10-template-specs.md) | 13. Invitation template specifications (5 templates) |
| 11 | [Design system](11-design-system.md) | Visual language, motion principles, reference-site notes |
| 12 | [Folder structure](12-folder-structure.md) | 14. Recommended project folder structure |
| 13 | [Security](13-security.md) | 15. Security considerations |
| 14 | [Deployment](14-deployment.md) | 16. Deployment architecture |
| 15 | [Development phases](15-development-phases.md) | 17. Phases, milestones, acceptance criteria |
| 16 | [Risks & trade-offs](16-risks-and-tradeoffs.md) | 18. Risks, trade-offs, decision log |
| 17 | [Future payments](17-future-payments.md) | Payment-ready architecture (Razorpay / PayU) — not built in MVP |
| 18 | [Launch runbook](18-launch-runbook.md) | Accounts, env vars, deploy, CSP rollout, monitoring, restore drill |

## How to use these docs with Claude Code

1. Open this folder in VS Code; `CLAUDE.md` at the repo root is loaded automatically.
2. Start each phase with a prompt like:

   > Read CLAUDE.md and docs/15-development-phases.md. Implement **Phase 1** only.
   > Read the docs listed under "Read before starting" for that phase. Work task by task,
   > run lint/typecheck/tests after each, and stop when the acceptance criteria pass.

3. Review the result in the browser, then move to the next phase.
4. If a decision changes during build, update the relevant doc and add a line to the decision log
   in [16-risks-and-tradeoffs.md](16-risks-and-tradeoffs.md) so later phases stay consistent.

## Key decisions at a glance

| Area | Decision |
|---|---|
| App shape | One Next.js app: marketing site + dashboard + invitation renderer. No per-invitation deployments. |
| Template engine | **Hybrid**: templates are React code packages; invitations are JSON (content + design overrides) validated by one shared Zod schema. Template manifests declare sections, theme tokens, fonts and customization options. |
| Stack | **Node.js + PostgreSQL/Prisma + React/Next.js.** One Next.js app on the Node runtime (server actions + route handlers) — no separate Express server in MVP; the service layer is framework-agnostic so it can be extracted later. |
| Data | PostgreSQL + Prisma. Invitation content/design in JSONB (`draft*` and `published*` snapshots); guests, media, entitlements relational. |
| Auth | Auth.js v5 — Google OAuth + email magic link (Resend). Database sessions. |
| Media | Cloudinary signed direct uploads; transformations for responsive images and video. |
| Publishing | Publish copies `draft` → `published` snapshot. Public routes read only `published`. ISR with tag revalidation. |
| Guest links | `/i/{slug}/guest/{token}` with 128-bit random tokens; server filters events per guest; `noindex`. |
| Hosting | Vercel + Neon (PostgreSQL) + Cloudinary + Resend. |
| Payments | Not implemented. `Entitlement` table + `canUseTemplate()` seam exist; `Order`/`Payment` designed for later. |

## Reference sites (inspiration only)

- **aavjoo.in** — closest match for product and design: clean white marketing site, bold sans
  headlines, filterable template grid where each card is a *live animated mini cover*, "See a live
  invite" CTA, culturally rooted designs (invocations, regional scripts), WhatsApp-first sharing.
- **myinvitations.io/wedding/invitation-website** — idea inspiration for the invitation-website
  section set (events, venue maps, gallery, music, countdown).

Do not copy text, illustrations, or assets from either site. See [11-design-system.md](11-design-system.md).
