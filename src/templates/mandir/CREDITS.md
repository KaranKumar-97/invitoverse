# Mandir — asset credits

> **Placeholder art — confirm rights before launch.** The painted art and demo photos in
> `public/templates/mandir/art/` came from the owner's design references (`design-references/temple assets/`).
> They match a third-party invitation recorded in `design-references/temple.mov`, so treat them as
> placeholders until their licence is confirmed or they are replaced with project-owned art
> (same file names and proportions). If `gate.webp` changes, re-measure `DOORWAY` and the arch points in `art.ts`.
> Then re-run `node scripts/capture-template-media.mjs http://localhost:3000 mandir`.

| Asset                                          | File(s) in `/public/templates/mandir/art/`                                            | Status                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------- |
| Carved temple doors (opening cover)            | `gate.webp` (750×1333)                                                                | Placeholder — rights unconfirmed |
| Sunset temple with couple (hero, doorway)      | `temple.webp` (864×1536)                                                              | Placeholder — rights unconfirmed |
| Floral arch & pavilions page                   | `page.webp` (864×1536)                                                                | Placeholder — rights unconfirmed |
| Demo photos                                    | `photo-1.jpg` … `photo-4.jpg`                                                         | Placeholder — rights unconfirmed |
| Sun divider, arch card cap (`decor.tsx`)       | Original, hand-coded SVG                                                              | Project-owned                    |
| Demo music (`/public/music/krishna-flute.m4a`) | Supplied by the owner (film / artist recording)                                       | Not licensed — see docs/16       |
| Fonts                                          | Google Fonts (Bodoni Moda, Cormorant Garamond, Pinyon Script, Marcellus, EB Garamond) | SIL Open Font License            |

> Art is served through `/t-art/mandir/<file>`; an admin can replace any file from `/admin/assets/templates`
> (same shape) without changing this folder (docs/19 §4.6).
