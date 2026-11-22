# 08 — Dashboard Screen Specifications

Dashboard look: calm, editorial, light. Ivory background (`#FAF7F2`), white cards, ink text, one
accent (deep maroon `#7A1F2B`) for primary actions, champagne hairlines. Inter for UI, a serif
display (Fraunces / Cormorant) for page titles only. Built with shadcn/ui primitives restyled.
See [11-design-system.md](11-design-system.md).

## 0. Route map & shell

| Route | Screen |
|---|---|
| `/login` | Sign in |
| `/dashboard` | Overview |
| `/dashboard/invitations` | All invitations |
| `/dashboard/invitations/new?template=` | Create flow |
| `/dashboard/invitations/[id]/edit?tab=` | Editor (tabs: details, events, media, design, settings) |
| `/dashboard/invitations/[id]/guests` | Guest manager |
| `/dashboard/invitations/[id]/share` | Publish & share |
| `/dashboard/account` | Account |
| `/preview/[id]` | Preview iframe target (no shell) |

**Shell (desktop ≥ 1024px):** left sidebar 240px (logo, Overview, Invitations, Templates ↗, Account,
"Create invitation" button), top bar with breadcrumb + avatar menu. **Mobile:** top bar with
hamburger → sheet; primary action as a floating button on list screens.

## 1. Sign in (`/login`)

- Split layout: left = animated invitation cover loop (a template's envelope idle animation); right = card.
- "Continue with Google" (primary), divider, email field + "Email me a sign-in link".
- After email submit: "Check your inbox" state with resend (cooldown 60 s).
- Preserves `callbackUrl` (e.g. create flow with selected template).
- Legal microcopy with Terms/Privacy links.

## 2. Overview (`/dashboard`)

| Area | Content |
|---|---|
| Greeting | "Good evening, Priya" + date |
| Stat cards (4) | Invitations · Published · Guests · Opens (last 7 days sparkline optional) |
| Continue editing | Most recently edited invitation: cover thumbnail, title, status pill, "Unpublished changes" badge, buttons **Edit**, **Share** |
| Recent invitations | Up to 5 rows → "View all" |
| Start new | Horizontal carousel of template posters → create flow |
| Empty state (first visit) | Large illustration + "Create your first invitation" + 3 featured templates |

## 3. Invitations list (`/dashboard/invitations`)

- Header: title, "Create invitation" button.
- Toolbar: status tabs (All · Drafts · Published · Archived with counts), search by title/slug, view toggle (grid/table).
- **Grid card**: 4:5 cover (template poster tinted with chosen palette or couple photo), title, wedding date, template name, status pill, guest/opens counts, kebab menu.
- **Table**: Title · Template · Wedding date · Status · Guests · Opens · Updated · actions.
- **Kebab actions**: Edit · Guests · Share (if published) · Copy link (if published) · Duplicate · Publish/Unpublish · Archive / Restore · Delete permanently (archived only).
- Confirmations:
  - Archive: "Guests will no longer be able to open this invitation."
  - Delete permanently: type the slug to confirm.
- Empty states per tab.

## 4. Create flow (`/dashboard/invitations/new`)

Two short steps in a centered card (progress dots), each one screen on mobile:

1. **Choose design** — template grid with category chips; hover/tap shows mini live preview; preselected if `?template=`.
2. **The couple** — Bride first name, Groom first name, order toggle (Bride & Groom / Groom & Bride), wedding date (date picker).

→ "Create invitation" → the draft gets a free link generated from the names (`priya-rahul`, `priya-rahul-2`…) and the editor opens with demo content prefilled for the rest (events, messages) and a dismissible banner: "We've added sample events and text — replace them with yours."

**Your link is the last step.** The publish dialog (and `/share` page) shows a "Your link" field before the first publish: prefilled with the generated link, live availability check (✓ / suggestions), preview of the full URL. Publishing saves a changed link (`changeSlug`) and then publishes. After publishing, the link can still be changed in Settings (with a warning).

## 5. Editor (`/dashboard/invitations/[id]/edit`)

### Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Invitations   Rahul & Priya Wedding ✎    ● Saved 2s ago   [Preview ▢▭] [Publish ▸]│
├───────────────┬───────────────────────────────┬──────────────────────────────┤
│ Tabs          │  Form panel (scroll)          │  Live preview (sticky)        │
│ • Details     │                               │  ┌──────────┐  device toggle  │
│ • Events      │                               │  │ iframe   │  Replay intro   │
│ • Media       │                               │  │ 390×844  │  Open in new tab│
│ • Design      │                               │  └──────────┘                 │
│ • Guests ↗    │                               │                              │
│ • Settings    │                               │                              │
└───────────────┴───────────────────────────────┴──────────────────────────────┘
```

- **Desktop ≥ 1280**: three columns (nav 200 / form 480–560 / preview fluid, phone frame scaled to fit).
- **Tablet 768–1279**: tabs become a top segmented control; preview in a right drawer toggled by "Preview".
- **Mobile**: full-width form; sticky bottom bar with **Preview** (opens full-screen preview sheet) and **Publish**.
- **Save state** indicator: `Saving…` / `Saved` / `Offline — changes will retry` / `Conflict — reload`.
- **Publish button** states: "Publish" (draft) · "Publish changes" (published + dirty) · "Published ✓" (clean, opens share sheet).
- Focusing a field sends `preview:scrollTo` for its section.

### 5.1 Details tab

| Group | Fields |
|---|---|
| Couple | Bride first/last name, short bio; Groom first/last name, short bio; display order; monogram (auto from initials, editable 1–4 chars) |
| Families | Per side: label ("Daughter of" / "Son of" / custom), parent lines (repeatable), grandparents lines (repeatable) |
| Wedding | Wedding date, timezone (default Asia/Kolkata), invocation line (preset dropdown: Shri Ganeshaya Namah / Ik Onkar / Bismillah / None / Custom), hashtag |
| Messages | Welcome message (400), Invitation message (1500, multiline), Closing line (200). Each with "Suggestions" popover of 5 curated texts (static, not AI). |

### 5.2 Events tab

- Sortable list of event cards (dnd-kit; keyboard reorder supported). Each collapsed card: icon, name, date · time, venue.
- Expanded editor: name (with quick presets: Haldi, Mehndi, Sangeet, Wedding, Reception, Cocktail, Puja), icon picker, date, start/end time, venue name, address, Google Maps link (with "Open" to verify + helper "How to get this link"), description, dress code.
- "Add event" button; delete with undo toast.
- Warning badge on events referenced by guests with SELECTED access when deleting ("3 guests are invited to this event").

### 5.3 Media tab

- Sections: **Couple photos** (max 3), **Family photos** (max 10), **Gallery** (max 30), **Video** (1 upload or YouTube URL), **Music**.
- Dropzone + "Choose files" (multi); per-file progress; client-side checks (type/size) before signing; HEIC → shows "converting" (Cloudinary handles).
- Thumbnails grid with drag reorder; click → side panel: alt text, focal point picker (click on image), replace, remove.
- Music: library list (8–12 royalty-free tracks with play preview: shehnai, sitar, piano, strings, instrumental Bollywood-style) or upload MP3/M4A ≤ 10 MB; start offset slider.
- Quota meter: "142 MB of 300 MB used".

### 5.4 Design tab

| Control | Behaviour |
|---|---|
| Template | Current template card + "Change design" → modal grid; warns that design overrides reset |
| Color palette | Template palette swatches (3–5); "Customize" reveals color pickers for `customizablePaletteKeys`; contrast warning if text/bg < 4.5:1 |
| Typography | Font pair cards rendered in their fonts ("Priya & Rahul" sample) |
| Background | Template presets + "Upload your own" (uses media pipeline) |
| Sections | Sortable list of supported sections with eye toggle; `hero` and `footer` locked on, `hero` fixed first |
| Animation | Intensity segmented (Subtle / Standard / Dramatic); Envelope intro on/off; Particles on/off; Autoplay music after opening on/off |
| Template options | Auto-generated from manifest `options` (boolean → switch, select → segmented/dropdown, color → picker) |

"Reset design to template defaults" link at the bottom.

### 5.5 Settings tab

- Title (internal), slug (with availability check and warning if published), template version info.
- Danger zone: Unpublish, Archive, Delete (if archived).

## 6. Guests (`/dashboard/invitations/[id]/guests`)

- Header: invitation title, status; banner if not published ("Guest links will work once you publish").
- Summary chips: Total · Not shared · Shared · Opened.
- Toolbar: search, status filter, "Add guest", "Bulk add", "Export CSV".
- **Table / mobile cards** columns: Name (+ greeting preview), Events (All / "Sangeet, Wedding"), Status pill (Not shared grey, Shared blue, Opened green with "3× · last 2h ago"), Actions: **Copy link**, **WhatsApp**, kebab (Edit, Regenerate link, Delete).
- **Add/Edit guest sheet**: Display name*, Greeting (placeholder "Dear {name}"), Personal note, Phone (optional, for WhatsApp direct), Event access (radio All / Selected → checkbox list of events), Private notes.
- **Bulk add dialog**: textarea "One guest per line. Optional: Name, Greeting"; parsed preview table with errors; default event access selector for all; "Add 42 guests".
- **WhatsApp message**: MVP uses a fixed template — "Dear {greeting or name}, {couple} would love for you to join their wedding celebrations. Open your invitation: {link}". An editable per-invitation message is a future extension.
- Regenerate confirmation: "The old link will stop working."

## 7. Publish & share (`/dashboard/invitations/[id]/share`, also as a sheet after publishing)

- Big preview card (OG image), public URL with Copy, Open, WhatsApp, QR download.
- Publish checklist (required ✗ blocks, recommended ⚠ informs) with "Fix" deep links to editor fields.
- Status block: Published v3 · 18 Nov 2026, 10:20 · "Unpublished changes" + "Publish changes".
- Unpublish button (secondary, confirm).
- Link to guest manager with "Send personal invites".

## 8. Account (`/dashboard/account`)

- Name, email (read-only), avatar from provider.
- Sign out; "Delete my account" (confirm by typing email) → soft delete flow.
- Placeholder "Purchases" section hidden until payments exist.

## 9. Cross-cutting UX

- Toasts (sonner) for success/failure; undo for deletes of events/media/guests.
- All destructive actions confirm; all forms keyboard accessible; visible focus rings.
- Skeleton loaders for lists; optimistic updates for reorder and toggles.
- Unsaved-changes guard is not needed (autosave), but block navigation while a save is in flight.
- Every dashboard page title follows `"{Page} · Invitation Banao"`.
