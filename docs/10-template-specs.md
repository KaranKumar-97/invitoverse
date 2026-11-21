# 10 — Invitation Template Specifications

Five launch templates. Each has a distinct visual identity, envelope, opening choreography and
scroll motion, but all render the same `InvitationContent` (see [05-template-engine.md](05-template-engine.md)).

## 0. Requirements common to every template

- Implements `hero`, `events`, `footer` (required) and ideally all 10 section keys.
- Mobile layout designed first at 375×812; desktop (≥ 1024) is a **composed** layout, not a stretched phone — e.g. centered 560–720px column with decorative side art, or split layouts.
- Envelope screen: monogram/initials, "You're invited" line, guest name if personalized (`"For Sharma Family"`), **Open Invitation** button (min 48px tall, high contrast), subtle idle animation, "Tap to open" hint.
- Opening choreography ≤ 3.8 s at `DRAMATIC`, ≤ 2.6 s `STANDARD`, ≤ 1.4 s `SUBTLE`; skippable by tapping again.
- Music starts on the Open tap with 1.5 s fade-in; persistent round mute button (bottom-right, 44px).
- Countdown, events (map + calendar buttons), gallery with lightbox, footer with hashtag and "Made with Invitation Banao" badge.
- 3+ palettes, 2 font pairs, 2+ backgrounds, 1–3 template options.
- Demo content (`demo.ts`) with realistic Indian wedding data (below).
- Passes the template contract test (renders with demo data, with guest, with every option, under reduced motion).
- Lighthouse mobile perf ≥ 85 for `/templates/<slug>/preview` (with demo images from Cloudinary).

### Shared demo data (vary names/cities per template)

| Template | Couple | City | Events |
|---|---|---|---|
| Royal Heritage | Aarav & Meera | Udaipur | Mehndi, Sangeet, Wedding, Reception |
| Minimal Luxury | Kabir & Anaya | New Delhi | Cocktail, Wedding |
| Floral Romance | Tara & Ishaan | Pune | Haldi, Mehndi, Wedding |
| Cinematic Elegance | Vihaan & Kavya | Goa | Welcome dinner, Sangeet, Beach wedding |
| Modern Editorial | Rhea & Arjun | Mumbai | Engagement, Wedding, Reception |

Demo photos: commissioned or licensed stock (Unsplash/Pexels license) uploaded to the platform Cloudinary folder `invitoverse/demo/`. Record source + license in `src/templates/<slug>/CREDITS.md`.

---

## 1. Royal Heritage

**Identity:** Rajasthani palace grandeur — maroon/emerald grounds, gold leaf, jharokha arches, mandala borders, invocation at top.

| Aspect | Spec |
|---|---|
| Palettes | Maroon & Gold (default) · Emerald & Gold · Ivory & Ruby |
| Fonts | Cinzel Decorative / Cinzel / Cormorant Garamond / Great Vibes · Playfair SC / Playfair / Lora / Pinyon Script |
| Decor | SVG jharokha arch frame, mandala corners, gold foil texture (CSS gradient + noise), elephant/peacock motifs optional |
| Envelope | Rich maroon envelope with gold filigree border; **wax seal** stamped with monogram; options: gold wax / red wax / medallion |
| Opening | Seal cracks (scale + rotate pieces) → envelope flap opens (rotateX 0→180°) → **palace gates** (two arched doors) part outward (rotateY ±100°) revealing hero → gold dust particles drift |
| Scroll motion | "Gilded rise": sections rise 24px + fade with a thin gold rule drawing left→right (scaleX) |
| Hero | Invocation + optional lotus/diya ornament; "The wedding of"; names in display font with "&" in script; date in roman-numeral style ornament |
| Events | Arched cards (jharokha-shaped mask), icon, gold hairline separators; timeline vertical on mobile, 2-col on desktop |
| Gallery | Masonry with gold frames; lightbox |
| Options | `showMandalaBorder`, `sealStyle`, `showInvocationArt` |
| Desktop | Centered 640px scroll column framed by fixed decorative pillars on both sides |

## 2. Minimal Luxury

**Identity:** Quiet luxury — ivory linen, black ink, champagne accents, generous whitespace, letterpress feel.

| Aspect | Spec |
|---|---|
| Palettes | Ivory & Ink (default) · Champagne & Espresso · Sage & Stone |
| Fonts | Bodoni Moda / Cormorant / Inter (light) · Italiana / Libre Caslon Text / Manrope |
| Decor | Fine 0.5px rules, embossed monogram (inset shadow), deckled paper edge (SVG mask), no illustrations |
| Envelope | Textured ivory linen envelope with blind-embossed monogram and a thin champagne liner |
| Opening | Flap lifts softly → **card slides up** out of the envelope → envelope drops away and fades → card scales to fill screen → letters of names track in (letter-spacing 0.4em → 0.08em) |
| Scroll motion | Slow fades (600 ms), 12px rise, generous delays; text-only reveals; no particles (particles option hidden) |
| Hero | Monogram, names stacked large, date as "14 · 02 · 2027", city in small caps |
| Events | Clean list with hairline dividers, time on left column, venue + map link right |
| Gallery | Two-column editorial with captions; occasional full-bleed image |
| Options | `monogramStyle` (serif / script), `paperTexture` on/off |
| Desktop | Split: fixed left panel with names/monogram, right scrolling content |

## 3. Floral Romance

**Identity:** Watercolor garden — blush, sage, peach; botanical illustrations; soft and joyful.

| Aspect | Spec |
|---|---|
| Palettes | Blush & Sage (default) · Peach & Mint · Lavender & Cream |
| Fonts | Playfair Display / Lora / Parisienne · DM Serif Display / Nunito / Allura |
| Decor | Watercolor floral corner clusters (layered PNG/WebP with transparency, 2–3 layers for parallax), leaf dividers, petal sprites |
| Envelope | Pastel envelope tied with a ribbon bow and a pressed-flower seal |
| Opening | Ribbon unties (two ribbon halves slide/rotate away) → flap opens → florals **bloom** from corners (scale 0.6→1 + rotate) → card rises → **petals fall** across the screen (12–24 transform-only sprites) |
| Scroll motion | Sections fade up; floral corners parallax at different speeds; leaf dividers "grow" (clip-path reveal) |
| Hero | Floral wreath around names; "Together with their families"; date in a soft badge |
| Events | Rounded cards with floral headers, icon in circle; horizontal swipe carousel on mobile |
| Gallery | Polaroid-style tilted photos that straighten on view |
| Options | `petals` density (none/light/full), `wreathStyle` |
| Desktop | Wide canvas with florals at the page edges; content 720px |

## 4. Cinematic Elegance

**Identity:** A film premiere — dark, moody, golden light, letterbox frames, full-bleed photography, title-card typography.

| Aspect | Spec |
|---|---|
| Palettes | Noir & Gold (default) · Midnight Blue & Silver · Wine & Rose Gold |
| Fonts | Cormorant SC / Cormorant / Montserrat (light, tracked) · Marcellus / EB Garamond / Raleway |
| Decor | Film grain overlay (CSS noise animation, low opacity), light-leak gradients, letterbox bars |
| Envelope | Black envelope with gold-foil edge and a **ticket-style** "Admit One — For Sharma Family" card peeking out |
| Opening | Ticket slides out → screen goes black → letterbox bars close in → **curtain of light** wipes (clip-path) → couple photo fades in with slow Ken Burns zoom → title card "Vihaan & Kavya" fades with tracking → bars retract |
| Scroll motion | Scroll-linked: full-bleed photos with parallax and scale; "chapter" title cards (Chapter I — The Celebrations) fade on enter; crossfades between sections |
| Hero | Full-bleed couple photo/video, names as film title, date as release date ("In cinemas near you — 06.02.2027" option) |
| Events | "Scenes" — each event is a full-height panel with background image (venue photo optional), time and venue overlay |
| Video | First-class: autoplay muted inline after open with tap-to-unmute (pauses music) |
| Options | `filmGrain` on/off, `chapterTitles` on/off, `taglineStyle` |
| Desktop | Full-bleed sections, centered text overlays, 21:9 letterbox for hero |

## 5. Modern Editorial

**Identity:** Fashion-magazine layout — off-white, terracotta, oversized serif headlines, grid, marquee, bold photography.

| Aspect | Spec |
|---|---|
| Palettes | Ivory & Terracotta (default) · Bone & Cobalt · Sand & Olive |
| Fonts | Fraunces / Inter · Instrument Serif / Space Grotesk |
| Decor | Issue-number masthead ("Issue No. 01 — The Wedding"), running marquee of names/date, grid lines, sticker-like date stamp |
| Envelope | Magazine-cover style: kraft sleeve with a cover card showing names as masthead and a "Special Edition" sticker |
| Opening | Sleeve slides down → cover **flips** (rotateY 180°) → pages "turn" into split-screen reveal (two halves slide apart horizontally) → marquee starts |
| Scroll motion | Big type slides in from sides; images reveal via clip-path inset wipes; sticky section labels; marquee band between sections |
| Hero | Masthead, huge names (clamp 64–160px), date stamp sticker, cover photo |
| Events | Editorial table / "Contents" page: numbered (01 Engagement · 02 Wedding · 03 Reception) with page numbers → expand on tap |
| Gallery | Asymmetric grid with captions and pull quotes |
| Options | `marquee` on/off, `issueNumber` text, `layoutDensity` (airy/compact) |
| Desktop | 12-column grid, asymmetric compositions; mobile collapses to single column with big type |

---

## 6. Envelope component contract

```ts
type EnvelopeProps = {
  data: RenderableInvitation;           // names, monogram, guest, theme, animation settings
  reducedMotion: boolean;
  onOpenStart: () => void;              // call in the tap handler (music starts within the gesture)
  onReveal: () => void;                 // content starts animating in underneath the overlay
  onOpened: () => void;                 // sequence finished; renderer removes the overlay
};
```

- Must render meaningful content server-side (names visible before JS loads; button enabled after hydration).
- Must preload/decode the first hero image during idle so the transition is seamless.
- Must handle `animation.envelope = false` by not being rendered (renderer handles) and `reducedMotion` with a ≤ 300 ms crossfade.
- Must expose `aria-label="Open invitation"` on the button and move focus to the hero heading after opening.

## 7. Acceptance for each template

- [ ] Visual review at 375, 414, 768, 1280, 1440 widths
- [ ] Envelope/opening ≥ 55 fps on a mid-range Android (Chrome DevTools performance trace with 4× CPU throttle shows no long tasks > 50 ms during the sequence)
- [ ] Each palette meets 4.5:1 for body text on its background
- [ ] Devanagari and Gurmukhi names render with correct fallback fonts (Noto Serif Devanagari / Noto Sans Gurmukhi)
- [ ] Works in WhatsApp in-app browser on Android and iOS
- [ ] Demo preview route Lighthouse mobile perf ≥ 85, a11y ≥ 95
