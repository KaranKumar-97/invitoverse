# 09 — Public Landing Page Specifications

Feel: a premium digital wedding-invitation **studio** — confident, airy, editorial, with the
templates themselves as the hero imagery. Closest reference for product and layout: aavjoo.in
(clean light canvas, bold modern headline, filterable grid of *live animated* invite cards,
"See a live invite" CTA, WhatsApp-first). Do not copy its text or artwork.

## 1. Routes

| Route | Purpose |
|---|---|
| `/` | Home |
| `/templates` | Full catalogue with filters |
| `/templates/[slug]` | Template detail |
| `/templates/[slug]/preview` | Full-screen live demo (guest experience with demo data) |
| `/about` | Story / studio (can be a section on home in MVP; route optional) |
| `/contact` | Contact (section on home + standalone page) |
| `/terms`, `/privacy` | Legal (simple static pages) |

## 2. Global elements

- **Announcement bar** (dismissible): "Launch offer — every design free while in beta" (copy configurable).
- **Header** (sticky, blurs on scroll): logo wordmark, nav (Designs · How it works · FAQ · Contact), right: "Sign in" (text) + "Create invitation" (pill, primary). Mobile: logo + "Create" + menu sheet.
- **Floating WhatsApp/"Let's talk"** chip bottom-right (link to `wa.me/<business number>`), hidden on template preview routes.
- **Footer**: wordmark + one-line mission, columns (Product: Designs, How it works, Pricing (soon); Company: About, Contact; Legal: Terms, Privacy), social icons, "Made in India ♥", © year.

## 3. Home (`/`) sections

### 3.1 Hero
- Layout desktop: left text column, right "phone stack" — 3 tilted phone frames each playing a different template's envelope-open loop (lightweight MP4/WebM loops, 4–6 s, muted, `playsinline`, with poster). Mobile: text then a single swipeable phone.
- Eyebrow pill: "Digital wedding invitation studio".
- Headline (display, 56–80px desktop / 40px mobile, tight leading): e.g. **"Invitations that open like a love letter."**
- Sub (18px): "Designer, animated invitation websites for every function — personalized for every guest, shared in one tap on WhatsApp."
- CTAs: **Choose a design** (primary) · **See a live invite** (secondary → opens a featured `/templates/[slug]/preview`).
- Trust line: "Loved by 1,200+ couples" (only when true; placeholder hidden for launch) or "Free during beta · No app needed".
- Motion: headline words rise + fade (stagger 60 ms); phones float in with slight parallax on pointer (desktop only).

### 3.2 Template showcase
- Title "Choose your design" + category chips (All · Royal · Minimal · Floral · Cinematic · Modern) with counts.
- Grid: 1 col (≤ 480), 2 col (≤ 1024), 3–4 col desktop. Card = 9:16 **live mini preview** (the template's real hero/cover rendered at small scale with demo data, idle animation only, `content-visibility:auto`, paused off-screen) + name, one-line style descriptor ("Royal · Maroon & Gold"), badges (New / Premium), "View design →".
- For performance, cards render the template **poster** first, then mount the live mini preview when in viewport on capable devices (no live previews if `saveData` or reduced motion).

### 3.3 How it works (3 steps)
1. **Pick a design** — "Five signature designs, each with its own opening moment."
2. **Make it yours** — "Names, events, photos, music. See every change live."
3. **Share with everyone** — "One link for all, or a personal link for each family."
Each step has a small looping illustration/screen recording.

### 3.4 The opening moment (feature spotlight)
- Full-bleed dark section; centered phone playing the envelope → reveal sequence; copy: "Every invitation begins with a moment" + bullet chips (Envelope reveal · Music on open · Countdown · Maps & calendar).

### 3.5 Personal invites spotlight
- Split: left mock of guest page "Dear Sharma Family…" with only their events; right copy about personalized links, privacy, open status ("Know who has opened their invite").

### 3.6 Features grid
6 tiles: Multiple events · Photo gallery · Background music · Live countdown · Google Maps & add-to-calendar · Mobile-first & lightning fast.

### 3.7 Testimonials (hidden until real ones exist) / Showcase of sample couples (demo content)

### 3.8 FAQ (accordion, 6–8 items)
How do guests open it? Do guests need an app? Can I edit after sharing? Can each guest get a personal link? Can I add multiple functions? Is my information private? What does it cost? (Free during beta.)

### 3.9 About
Short studio story: "We're designers and engineers who believe your invitation is the first chapter of your wedding." + values.

### 3.10 Contact
Form (name, email/phone, message) → `/api/v1/contact`; plus WhatsApp and email links. Honeypot + rate limit. Success state inline.

### 3.11 Final CTA band
"Your love story deserves a beautiful beginning." + Choose a design.

## 4. Catalogue (`/templates`)
- Same chips as home + sort (Featured / Newest). URL state `?category=floral`.
- Grid of cards as in 3.2; SSG with all categories; filtering client-side.

## 5. Template detail (`/templates/[slug]`)
- Breadcrumb; H1 template name; tagline; category + tags.
- **Live preview**: desktop shows phone frame (390×844 iframe of `/templates/[slug]/preview?embed=1`) + "View full screen"; toggle Mobile/Desktop preview.
- "What's inside": supported sections list, envelope style, animation style, palettes (swatches clickable → preview updates via query param), font pairs.
- Primary CTA **Use this design** → `/dashboard/invitations/new?template=slug` (auth redirect preserves it). Secondary: **Open live demo**.
- "You may also like" — 3 other templates.
- Metadata: title "Royal Heritage — Animated Wedding Invitation | Invitation Banao", OG = template poster.

## 6. Live demo (`/templates/[slug]/preview`)
- Exactly the guest experience with `demo.ts` data, including envelope and music (demo track).
- Thin floating top bar (dismissible): "This is a demo · Use this design" — hidden when `?embed=1`.
- Supports `?palette=` and `?font=` to preview variants.

## 7. SEO & performance
- SSG everything; `next/font` with `display: swap`, preload only the hero display font.
- Hero media: poster images (AVIF/WebP) above the fold; loops lazy-loaded after LCP.
- Metadata API: canonical URLs, OG/Twitter cards, `sitemap.xml` (home, templates, details), `robots.txt` (disallow `/dashboard`, `/preview`, `/i/`).
- JSON-LD: `Organization` + `Product` per template (no price in MVP).
- Targets: LCP ≤ 2.0 s, CLS ≤ 0.05, total JS on `/` ≤ 150 KB gz.
- Analytics events: `cta_choose_design`, `cta_live_invite`, `template_card_click`, `template_use_click`, `contact_submit`.
