# 11 — Design System & Motion Principles

Two visual worlds share one brand:

1. **Studio** (landing + dashboard) — light, airy, editorial, confident. The templates are the color.
2. **Invitations** (templates) — each fully themed by its manifest tokens; the studio brand appears only in the footer badge.

## 1. Reference notes

| Site | What to take | What not to take |
|---|---|---|
| aavjoo.in | Clean off-white canvas; bold, tightly-leaded sans headline; small pill eyebrow ("Just ordered…" social proof); rounded pill buttons (black primary, light secondary); category chips with counts; cards that *play* the invite's cover animation; "See a live invite" as a first-class CTA; culturally specific designs (invocations, regional scripts); WhatsApp chat chip | Their copy, illustrations, template names, pricing presentation |
| myinvitations.io (invitation website page) | Section set of an invitation website (events, venue, gallery, music, countdown), sharing flow ideas | Visual style |

## 2. Studio tokens

```css
:root {
  /* color */
  --ink:        #17130F;   /* primary text, primary button */
  --ink-soft:   #4A433B;
  --muted:      #736B62;   /* AA: 4.95:1 on canvas */
  --canvas:     #FBF8F3;   /* page background (warm off-white) */
  --surface:    #FFFFFF;
  --line:       #ECE5DA;   /* hairlines, borders */
  --accent:     #7A1F2B;   /* deep maroon — brand accent, links, focus */
  --accent-soft:#F4E6E3;
  --gold:       #B8915A;   /* champagne details, badges */
  --success:    #2F7A4F;  --warning: #B7791F;  --danger: #B42318;

  /* type */
  --font-sans:    "Inter", system-ui, sans-serif;            /* UI + headlines */
  --font-display: "Fraunces", "Cormorant Garamond", serif;   /* occasional editorial accents */

  /* radius & elevation */
  --r-sm: 8px; --r-md: 14px; --r-lg: 22px; --r-pill: 999px;
  --shadow-card: 0 1px 2px rgba(23,19,15,.04), 0 8px 24px -8px rgba(23,19,15,.10);
  --shadow-float: 0 24px 60px -20px rgba(23,19,15,.25);
}
```

### Type scale (studio)

| Token | Size / line-height | Use |
|---|---|---|
| display-xl | clamp(40px, 6vw, 80px) / 1.02, weight 700, tracking -0.03em | Home hero |
| display-l | clamp(32px, 4vw, 52px) / 1.08, 700, -0.02em | Section titles |
| title | 24 / 1.25, 600 | Card/page titles |
| body-l | 18 / 1.6 | Lead paragraphs |
| body | 15–16 / 1.6 | Default |
| caption | 13 / 1.4, muted | Meta |
| eyebrow | 12 / 1, 600, uppercase, tracking 0.12em | Section labels |

### Components (studio)

- **Buttons**: pill; primary = ink bg / white text; secondary = white bg + line border; accent variant for dashboard publish. Height 44 (48 on mobile primary). Press: scale .98.
- **Chips**: pill, `surface` bg, count in muted; active = ink bg.
- **Cards**: `surface`, `r-lg`, `shadow-card`, hover lift 2px + shadow-float (desktop only).
- **Inputs**: 44px, `r-md`, line border, focus ring 2px accent with 2px offset.
- **Status pills**: Draft (neutral), Published (green), Archived (muted), Unpublished changes (amber dot).

### "Refined" finish and dark mode (2026-11-21)

Chosen direction: keep the layout and maroon/ivory brand; add editorial finish.

- **Display type**: `text-display-xl` / `text-display-l` are Fraunces 500 (serif), tight tracking.
- **Gold foil accent** (`.text-foil`): italic Fraunces with a slow gold shimmer, for 1–3 words per
  heading (`SectionHeading accent="…"`, hero "love letter."). Decorative only — never body text.
- **Section labels** (`.eyebrow-rule`): spaced caps with gold hairlines (`is-center` adds the right one).
- **Primary buttons** (`.btn-lux`, on the default Button variant): ink gradient + highlight + shine on
  hover; gold gradient in dark mode. Buttons with their own colour add `bg-none` to drop the gradient;
  `.btn-gold` is gold in both themes.
- **Gold tokens**: `--gold-1/2/3` (foil), `--gold-ink` (gold text that passes AA), `--glow`.
- **Paper grain** (`.studio-grain` element) on marketing and sign-in pages.
- **Dark mode — "velvet night"**: `:root[data-theme="dark"]` overrides the studio tokens
  (canvas `#120F0D`, surface `#1B1714`, ink `#F5ECE0`, muted `#AB9D8C`, maroon text `#E7A3AC`,
  primary = ivory `#F1E4CF`) plus maroon/gold background glows.
  - `public/theme-init.js` sets `data-theme` before first paint: saved choice → device setting.
  - `ThemeToggle` (site header, dashboard header, editor, sign-in) saves the choice (`localStorage`).
  - Tailwind `dark:` is bound to `data-theme` (`@custom-variant dark`).
  - **Invitation pages are always light** (`/i/**`, `/preview/**`, template demos): templates own their
    palettes (`ForceLightTheme` + theme-init).
  - Selected states use `bg-primary text-primary-foreground` (flips with the theme), never `bg-ink text-white`.
  - Every studio and dashboard page passes the contrast audit in both themes (`tests/e2e/accessibility.spec.ts`).

## 3. Invitation tokens (contract every template theme provides)

| CSS variable | Meaning |
|---|---|
| `--c-bg`, `--c-surface` | Page and card backgrounds |
| `--c-text`, `--c-muted` | Body and secondary text |
| `--c-accent`, `--c-accent-contrast` | Ornaments, buttons, and text on accent |
| `--f-display`, `--f-heading`, `--f-body`, `--f-script` | Font families |
| `--inv-radius`, `--inv-shadow` | Shape language |
| `--motion-scale` | 0.6 / 1 / 1.4 from intensity |

Kit components (countdown, buttons, mute toggle, lightbox chrome) read only these variables, so they
look native in every template.

## 4. Motion principles

1. **Choreograph, don't decorate.** Every movement tells the "opening a letter" story: anticipation → reveal → settle.
2. **Easing**: entrances `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint); exits `cubic-bezier(0.64, 0, 0.78, 0)`; physical objects (flap, doors) use springs (`stiffness 120, damping 20`).
3. **Durations**: micro 150–250 ms; UI 300–450 ms; section reveal 600–900 ms; opening sequence 1.4–3.8 s.
4. **Compositor only**: animate `transform` and `opacity`; `clip-path` allowed for wipes on small elements; avoid animating `filter`, `box-shadow`, `width/height/top/left`.
5. **Stagger** lists at 60–90 ms; cap total stagger at 600 ms.
6. **Once**: scroll reveals play once; nothing re-animates on scroll-up.
7. **Reduced motion**: replace movement with opacity crossfades ≤ 300 ms; disable parallax, particles, Ken Burns, marquee.
8. **Dashboard motion** is minimal: 150–200 ms fades/slides, no decorative motion.

## 5. Imagery

- Cloudinary delivery: `f_auto,q_auto`, `c_fill,g_auto` (or focal point), widths `[360, 540, 720, 1080, 1440, 2048]`, `dpr` via srcset.
- Blur-up placeholder: `e_blur:1000,q_1,w_32` data URL generated at upload confirm and stored on the media ref (optional field `blurDataUrl`).
- Template decor art: SVG where possible; raster textures in AVIF/WebP ≤ 120 KB each.

## 6. Accessibility

- Studio: WCAG 2.2 AA, visible focus, 44px targets, labelled inputs, error text linked via `aria-describedby`.
- Invitations: body text ≥ 16px on mobile, contrast ≥ 4.5:1 (editor warns on custom palettes), semantic headings (one `h1` = couple names), event dates in `<time datetime>`, buttons not divs, music toggle with `aria-pressed`.
- Script fonts only for short display text (names, "&"), never for paragraphs or event details.

## 7. Voice & copy

Warm, graceful, concise. Prefer "invitation" over "invite" in UI headings. Avoid exclamation marks in
the studio UI. Invitation demo copy should sound like real Indian families wrote it (respectful,
blessings-oriented), in English with optional Hindi/Punjabi lines.
