# 19 — Admin panel (plan)

> **Status (2026-11-28): phases A0–A5 built.**
> - **A0** — `SUPERADMIN` role, permission catalogue (`src/lib/admin/permissions.ts`), server checks
>   (`src/server/services/admin-access.ts`, `src/server/auth/admin.ts`), `AdminAuditLog`, admin layout,
>   Admins page (per-feature toggles, presets), audit log page.
> - **A1** — `/admin/templates` (show/hide, order, New, Free/Premium price, retire/restore; marketing
>   pages and the picker follow it) and `/admin/sites` (search, filter, rename, change link,
>   publish/unpublish, take down, delete).
> - **A2** — `/admin/users` and user detail (rename, suspend, delete account, grant/revoke template
>   access, opens chart), invitation detail (draft, masked guests with audited reveal, media), and
>   acting as the owner (`src/server/services/admin-acting.ts`): admins with `invitations.edit` use the
>   normal editor, preview and media uploads; `invitations.guests` opens the guests page.
> - **A3** — music library in the database (`MusicTrack`), `/admin/assets/music` (upload, edit, licence,
>   show/hide, order, retire with replacement, default song per template).
> - **A4** — `/admin/analytics` (sign-ups, created, published, opens per day, funnel, templates, music)
>   with `InvitationDailyStat` counted by the open beacon; per-user opens on the user page.
> - **A5** — `/admin/assets/templates`: replace any art file of Kashi, Mandir, Meenakshi and Deepotsav
>   (same shape ±3%), reset to original. Templates load art from `/t-art/<slug>/<file>`, which
>   redirects to the replacement or the bundled file (cached 5 minutes).
> - Not built: marketing poster/loop replacement, admin-editable template code, email alerts.

**Read with:** [01-prd](01-prd.md) §6.7 · [03-database](03-database.md) · [13-security](13-security.md) ·
[17-future-payments](17-future-payments.md) · [05-template-engine](05-template-engine.md) §11.

---

## 1. Goals and non-goals

**Goals**

1. Manage the template catalogue: show, hide, retire (delete) and price templates.
2. See every user and everything they own: invitations (drafts, published, archived), guests, media,
   entitlements.
3. Two admin levels (RBAC): **Superadmin** and **Admin**.
4. Superadmins can edit any user's invitation, draft and data.
5. Admins can view everything by default but edit nothing.
6. Superadmins grant Admins extra abilities **one feature at a time with toggles** (e.g. "update
   prices"). Every feature in this plan has its own toggle.
7. Analytics: platform-wide and per user.
8. Manage deployed (published) sites: view, open the link, edit settings, take down, delete.
9. Manage assets from the portal: music for all templates, and each template's art.

**Non-goals (stay in code)**

- Creating a new template from the portal. A template is React code (`src/templates/<slug>/`); the
  portal manages its catalogue entry, price, visibility and replaceable art, not its layout or motion.
- Payments, refunds and invoices. Prices can be set now but are only charged once
  [17-future-payments](17-future-payments.md) is built (see §11).
- Editing other admins' roles from anywhere except the Admins page, and only by a Superadmin.

---

## 2. Roles and permissions (RBAC)

### 2.1 Roles

| Role | Who | Can do |
|---|---|---|
| `USER` | Couples (everyone who signs up) | Their own invitations only (unchanged) |
| `ADMIN` | Staff, support, partners | **View** every admin page and every user's data. Edit **nothing** until a Superadmin turns on specific permissions |
| `SUPERADMIN` | Owner(s) | Everything, including editing any user's data and managing admins and their permissions. Not limited by toggles |

### 2.2 Permission catalogue

Every write ability is a permission key. A Superadmin turns each one on or off per Admin with a
toggle (Admins page, §4.3). View permissions are on for every Admin by default and can be switched
off too, for example to hide user data from someone who only manages music.

| Key | Module | Allows | Admin default |
|---|---|---|---|
| `templates.view` | Templates | See the catalogue, usage counts, prices | On |
| `templates.visibility` | Templates | Show / hide a template, reorder, mark "New" | Off |
| `templates.price` | Templates | Set tier (Free / Premium) and price | Off |
| `templates.retire` | Templates | Retire (delete) a template from the catalogue | Off |
| `users.view` | Users | See users, their invitations, drafts, settings, media | On |
| `users.view_pii` | Users | Reveal unmasked guest phone numbers and emails (each reveal is logged) | Off |
| `users.edit` | Users | Edit a user's profile; suspend / restore sign-in | Off |
| `users.delete` | Users | Delete a user account (soft delete, purged later) | Off |
| `users.entitlements` | Users | Grant or revoke template / feature access (`ADMIN_GRANT`) | Off |
| `invitations.edit` | Users, Sites | Open any invitation in the editor and change its draft | Off |
| `invitations.guests` | Users, Sites | Add, edit, delete a user's guests; regenerate guest links | Off |
| `sites.view` | Sites | See published sites and their settings | On |
| `sites.publish` | Sites | Publish / unpublish / republish a user's invitation | Off |
| `sites.settings` | Sites | Change a site's link (slug), title, music, template options | Off |
| `sites.takedown` | Sites | Disable a site with a reason, re-enable it | Off |
| `sites.delete` | Sites | Permanently delete an invitation | Off |
| `analytics.view` | Analytics | Platform and per-user analytics | On |
| `assets.view` | Assets | See the music library and template art | On |
| `assets.music` | Assets | Upload, edit, reorder, hide and retire songs | Off |
| `assets.template_art` | Assets | Replace a template's art files | Off |
| `audit.view` | Audit log | Read the admin audit log | On |

Not grantable (Superadmin only): **manage admins and permissions**, change roles.

### 2.3 Rules

- Superadmin always passes every check; toggles never limit them.
- An Admin's ability = role default for the key, overridden by any toggle a Superadmin set.
- Write permissions imply the matching view (`templates.price` needs `templates.view`); the toggle UI
  turns the view on automatically.
- There must always be at least one Superadmin. The last one cannot be demoted or deleted.
- Nobody can change their own role or permissions.
- Admins and Superadmins keep a normal couple account too (they can still make their own invitations).

### 2.4 Data model

```prisma
enum Role {
  USER
  ADMIN
  SUPERADMIN
}

/// One row per permission a Superadmin has set for an Admin (overrides the default in §2.2).
model AdminPermission {
  userId    String
  key       String   // e.g. "templates.price"; validated against the catalogue in code
  allowed   Boolean
  grantedBy String
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, key])
}

/// Every admin write (and every PII reveal), append-only.
model AdminAuditLog {
  id         String   @id @default(cuid())
  actorId    String
  action     String   // e.g. "template.price_changed", "invitation.edited"
  targetType String   // "template" | "user" | "invitation" | "guest" | "track" | "asset" | "admin"
  targetId   String
  before     Json?    // changed fields only, never secrets or guest tokens
  after      Json?
  reason     String?
  createdAt  DateTime @default(now())

  @@index([targetType, targetId, createdAt(sort: Desc)])
  @@index([actorId, createdAt(sort: Desc)])
}
```

`User` also gains `suspendedAt DateTime?` (blocks sign-in and editing; published sites stay up unless
taken down separately).

**Bootstrap:** the first Superadmin is set once in the database (same as today's runbook step,
with `role='SUPERADMIN'`). From then on admins are managed in the portal.

### 2.5 Enforcement (server)

- The permission catalogue lives in one plain module, `src/lib/admin/permissions.ts` (keys, labels,
  defaults, module), shared by the server and the toggle UI.
- `requirePermission(key)` in `src/server/auth/` loads the user's role and overrides (cached per
  request) and throws `NOT_FOUND` (not "forbidden", so admin pages stay invisible) when not allowed.
- Every admin server action is written as
  `runAction(Schema, input, async (ctx) => { await requirePermission("templates.price"); … })` and
  calls a service in `src/server/services/admin/*`, which writes an `AdminAuditLog` row in the same
  transaction as the change.
- Pages hide buttons the user can't use, but the server check is the real guard (never trust the
  client, [13-security](13-security.md)).
- Database sessions already reload the role on each request, so a revoked permission applies at once.

---

## 3. Layout and navigation

`/admin` becomes its own area with a sidebar (separate from the couple dashboard), using the
studio design tokens and light/dark support. `noindex`, nonce CSP (already in `NONCE_ROUTE_PATTERNS`).

| Route | Page | Needs |
|---|---|---|
| `/admin` | Overview (today's stats + shortcuts) | any admin |
| `/admin/templates` | Template management | `templates.view` |
| `/admin/users`, `/admin/users/[id]` | Users and user detail | `users.view` |
| `/admin/users/[id]/invitations/[invId]` | One invitation: draft, published, guests, media | `users.view` |
| `/admin/sites` | Deployed sites | `sites.view` |
| `/admin/analytics` | Analytics | `analytics.view` |
| `/admin/assets/music`, `/admin/assets/templates` | Asset management | `assets.view` |
| `/admin/admins` | Admins and permission toggles | Superadmin |
| `/admin/audit` | Audit log | `audit.view` |

Every list: search, filters, sort, pagination (server-side, 25 per page), works at 375px (cards) and
1440px (tables).

---

## 4. Modules

### 4.1 Template management (feature 1)

**List:** poster, name, slug, category, tier, price, status (Live / Hidden / Retired), "New" badge,
sort order, number of invitations using it (draft / published), last updated.

| Action | What happens | Permission |
|---|---|---|
| Show / Hide | `Template.isActive`. Hidden templates disappear from the marketing catalogue and the "choose a design" picker; existing invitations keep working | `templates.visibility` |
| Reorder, mark New | `sortOrder` (drag to reorder), `isNew` | `templates.visibility` |
| Set price | `tier` (Free / Premium) + `pricePaise` (entered in rupees, stored as paise). Shown on the catalogue only once payments are live; until then it is stored, audited and previewed | `templates.price` |
| Retire ("delete") | Sets `retiredAt`: hidden everywhere, can't be chosen for new invitations, existing invitations keep rendering. Shows how many invitations use it before confirming | `templates.retire` |
| Open demo | Opens `/templates/<slug>/preview` | view |

**Why "retire" instead of a hard delete:** the template's code still ships with the app and published
invitations depend on it. Removing it for real is a code change, allowed only when no invitation
uses it. The portal shows "safe to remove from code" when the count is zero.

**Built as:** `getVisibleCatalogue()` (`src/server/services/catalogue.ts`) merges the code registry
with the `Template` rows (cached, tag `templates`); the designs page, home showcase and template
detail pages use it, and `invalidateCatalogue()` purges them after each admin change. The picker
(`listAvailableTemplates`) and `canUseTemplate` skip hidden and retired templates. One order
everywhere (`sortOrder` ascending). `Template` gained `retiredAt`. The deploy seed no longer resets
visibility, order, New, tier or price on existing templates.

### 4.2 Users and their data (features 2, 4, 5)

**Users list:** name, email, sign-up date, last sign-in, provider (Google / email), counts of
draft / published / archived invitations, status (Active / Suspended / Deleted), role badge.
Search by email or name; filter by status, has-published, template used, signed up between.

**User detail:**

- Profile, sign-in methods, sessions (sign out everywhere), entitlements.
- Invitations table: title, template, status, link, wedding date, last edited, opens, guests.
- Media usage (count, MB) and recent uploads.

**Invitation detail (read-only for Admins):**

- Tabs: **Draft** (rendered preview + the raw fields as a readable form), **Published** (rendered
  snapshot, version, published at), **Guests** (names, invited events, opened yes/no; phone numbers
  masked as `+91 98•••••210` unless `users.view_pii`), **Media**, **History** (publish history and
  admin audit entries).
- Admins see no edit buttons. A banner says "View only".

**Editing (Superadmin, or an Admin with `invitations.edit` / `invitations.guests`):**

- "Edit in editor" opens the normal editor (`/dashboard/invitations/[id]/edit`) in **admin mode**:
  a coloured bar shows "Editing Priya's invitation as Karan (admin)" with an exit button.
  Authorization: `getOwnedInvitation()` gets an admin branch that allows the owner **or** a caller
  with `invitations.edit`; every save writes an audit row with the admin as actor.
- Edits change the **draft** only. Publishing is a separate permission (`sites.publish`), so a draft
  edit never surprises guests on the live site.
- Profile edits, suspend / restore, delete account and entitlement grants each have their own
  permission (§2.2) and a confirmation dialog with a required reason.

### 4.3 Admins and permission toggles (features 3, 6)

- List of admins: name, email, role, permissions on, last active.
- **Add admin:** enter the email of an existing account (they must have signed in once), pick Admin
  or Superadmin.
- **Permission grid:** one row per permission from §2.2, grouped by module, each a toggle with a
  one-line description. Changes save immediately with an undo toast and an audit row. Presets
  ("View only", "Support", "Catalogue manager", "Content editor") fill the toggles in one click.
- **Remove admin:** back to `USER`; their overrides are deleted.
- Superadmin only. The last Superadmin is protected (§2.3).

### 4.4 Analytics (feature 7)

**Overall (date range, compare to previous period):**

- Users: sign-ups per day, active users (edited or published in the range), sign-in method split.
- Funnel: signed up → created an invitation → published → shared (≥1 guest link) → opened by a guest.
- Invitations: created, published, archived, taken down; median time from sign-up to publish.
- Templates: invitations and publishes per template, preview-to-pick conversion.
- Guests: links created, opened, open rate; opens per day.
- Music: most chosen tracks.
- Marketing: page views and top referrers from Vercel Analytics (link out; no extra tracking).

**Per user:** their invitations with opens over time, guest open rate per invitation, last activity.

**Data source:** today only totals exist (`openCount`, guest `OPENED`). Add an `InvitationDailyStat`
table (`invitationId`, `date`, `opens`, `uniqueGuests`) fed by the existing beacon
(`/api/v1/beacon`) and a nightly rollup cron, so charts stay fast and no personal data is stored.
Charts: small hand-built SVG components (no new chart library unless approved in
[02 §Approved libraries](02-architecture.md)).

### 4.5 Deployed sites (feature 8)

**List of published invitations:** title, live link (`/i/<slug>`, copy + open), owner, template,
published version and date, last opened, total opens, guests, status (Live / Taken down / Unpublished).
Filters: template, status, published between, most opened.

| Action | What happens | Permission |
|---|---|---|
| Open / copy link | — | `sites.view` |
| Edit settings | Built: title and link (slug, with "old links will stop working" warning). Music, template options and intensity come with the admin-mode editor (A2) | `sites.settings` |
| Unpublish / republish | Existing publishing service | `sites.publish` |
| Take down / restore | `disabledAt` + `disabledReason` (already in the schema); guest and public pages show a neutral "unavailable" page | `sites.takedown` |
| Delete | Existing delete flow (type the link to confirm) | `sites.delete` |

### 4.6 Assets: music and template art (feature 9)

**Music library (all templates):**

- Move the library from code (`src/lib/invitation/music-library.ts`) to a `MusicTrack` table:
  `id`, `slug`, `title`, `artist`, `mood`, `durationSec`, `url`, `provider` (local / Cloudinary),
  `licence` (Owned / Licensed / Royalty-free / **Unlicensed**), `licenceNote`, `isActive`,
  `sortOrder`, `createdBy`, timestamps.
- Upload an MP3/M4A/AAC up to 8 MB straight to Cloudinary (signed upload, existing pattern), optional
  trim (start/end) and fade, preview player, then save. The server checks the file with the
  Cloudinary Admin API before recording it.
- Edit title / mood / licence, reorder, hide (owners can't pick it any more; invitations already
  using it keep playing), retire with a replacement track (generalises today's `RETIRED_TRACKS`).
- Set each template's default track from here (overrides `defaultMusicTrackId` in the manifest).
- The editor's music picker and the renderer read the active tracks from a cached service with a
  `music` tag.
- Seed: today's 8 tracks are imported once, keeping their ids, marked **Unlicensed** (matches the
  decision log).

**Template art:**

- Per template, a gallery of its art slots read from the template's `art.ts` (key, file, size, where
  it's used), plus the marketing poster / loop / OG image.
- **Replace** a slot: upload an image (or the video for slots like Deepotsav's lighting film). The
  portal requires the **same aspect ratio** (and warns on size differences), because layouts measure
  the art (arch slices, the floating diya position). Stored as a `TemplateAssetOverride`
  (`templateSlug`, `key`, `url`, `width`, `height`, `licence`, `updatedBy`).
- Templates read art through a small resolver (`resolveArt(slug, ART)`) that applies overrides, so
  replacing art never touches template code. "Reset to original" deletes the override.
- Each slot shows its licence status, so placeholder art (see each template's `CREDITS.md`) is easy
  to find and replace before launch.

### 4.7 Audit log

Filterable by admin, action, target and date; each row links to its target and shows before → after.
Append-only (no edit or delete, even for Superadmins). Kept 2 years.

---

## 5. Security requirements

- `requirePermission` on every admin server action and every admin data read ([13-security](13-security.md)).
- Admin and user IDs come from the session and the route, never from hidden form fields.
- **Re-check before destructive actions** (delete user, delete site, take down, retire template,
  change roles): the admin must have signed in within the last 15 minutes, otherwise they are sent
  through sign-in again.
- Typed confirmation for permanent deletes (as today), a reason for take-downs and role changes.
- PII: guest phones and emails masked by default; each reveal logged.
- Admin pages never cached publicly; `noindex`; rate-limited (60 writes / minute per admin).
- Guest isolation is unchanged: admin views are server-rendered and never expose guest tokens; the
  "open as guest" button generates a short-lived preview, not the real token.
- New audit events in `src/server/log.ts` mirror `AdminAuditLog` actions for log drains.

---

## 6. Database changes (summary)

| Change | Notes |
|---|---|
| `Role` += `SUPERADMIN` | Migration; existing `ADMIN` rows stay Admin |
| `AdminPermission`, `AdminAuditLog` | New tables (§2.4) |
| `User.suspendedAt` | Checked at sign-in and in `requireUser()` |
| `Template.retiredAt` | Plus catalogue / picker reading `Template` rows |
| `MusicTrack`, `TemplateDefaultTrack` (or `Template.defaultTrackId`) | Music library moves to the DB |
| `TemplateAssetOverride` | Template art replacement |
| `InvitationDailyStat` | Analytics rollups |

All new JSON columns are parsed with Zod on read; money stays integer paise.

---

## 7. Build phases

| Phase | Scope | Acceptance |
|---|---|---|
| **A0 Foundation** ✅ built | Roles + `SUPERADMIN`, permission catalogue, `requirePermission`, `AdminAuditLog`, admin layout + sidebar, Admins page with toggles | A test per permission: allowed and denied paths; last Superadmin protected; every write leaves an audit row |
| **A1 Templates + Sites** ✅ built | §4.1, §4.5; catalogue and picker respect DB visibility / order | Hiding a template removes it from `/templates` and the picker within one revalidation; take-down shows the unavailable page |
| **A2 Users** ✅ built | §4.2 view; admin-mode editor; suspend; entitlements | Admin sees but cannot change anything (UI and server); Superadmin edit is audited with actor |
| **A3 Music** ✅ built | §4.6 music: `MusicTrack`, upload, seed, editor + renderer from DB | Upload a track, pick it in the editor, it plays on a published page; hiding it removes it from the picker only |
| **A4 Analytics** ✅ built | §4.4 with daily rollups | Numbers match direct DB counts in tests; page loads under 1 s with 10k invitations |
| **A5 Template art** ✅ built | §4.6 art overrides + resolver | Replacing an image updates the live demo; wrong aspect ratio is rejected; reset restores the original |

Each phase: `pnpm lint && pnpm typecheck && pnpm test` pass, works at 375px and 1440px, e2e for the
main flows, docs 03 / 04 / 13 / 16 updated.

Rough effort: A0 4–5 days · A1 3–4 · A2 5–6 · A3 4 · A4 4–5 · A5 3–4 (about 4–5 weeks in total).

---

## 8. Open questions for the owner

1. Should Admins with `users.view` see guest **names** (they're personal data too), or only counts?
2. Is a template price per template enough, or will there be bundles / per-feature prices
   (affects [17-future-payments](17-future-payments.md))?
3. Should suspended users' published sites stay live (current plan) or go down with the account?
4. Do you want email alerts to Superadmins for take-downs, role changes and new admins?

---

## 9. Later: other platform features (deferred)

Suggested with this plan but **not needed now** and not part of phases A0–A5. They are listed, in
priority order, under **Next phase — platform readiness** in
[15-development-phases.md §Post-MVP backlog](15-development-phases.md): licences for art and music,
payments, privacy compliance (DPDP Act), abuse reports, support tools, backups and a maintenance
banner, emails to couples, feature flags, marketing-site content editing, sign-up abuse protection
and RSVP.
