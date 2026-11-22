# Meenakshi — asset credits

> **Placeholder art.** The painted scene art and demo photos in `public/templates/meenakshi/art/`
> are reference art taken from a third-party site, not project-owned. Replace every file below with
> project-owned art (same file names and roughly the same proportions), then re-run
> `node scripts/capture-template-media.mjs http://localhost:3000 meenakshi` to refresh the
> catalogue poster and loops.

| Asset                                      | File(s) in `/public/templates/meenakshi/art/`                                               | Status                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------- |
| Gopuram cut-out, tree line                 | `gopuram.webp`, `trees.webp`                                                                | Placeholder (needs alpha) |
| Ganesha medallion                          | `ganesha.webp`                                                                              | Placeholder (needs alpha) |
| Carved blessing arch, maroon couple arch   | `blessing-arch.webp`, `couple-arch.webp`                                                    | Placeholder               |
| Event boards (two arch designs)            | `event-arch-a.webp`, `event-arch-b.webp`                                                    | Placeholder               |
| Temple courtyard gate, hills card          | `courtyard.webp`, `hills.jpg`                                                               | Placeholder               |
| Garland-exchange couple, gilded frame      | `varmala.webp`, `gilded-frame.png`                                                          | Placeholder (needs alpha) |
| Demo photos                                | `photo-1.jpg` … `photo-4.jpg`                                                               | Placeholder               |
| Demo music (`/public/music/raag-dawn.m4a`) | Synthesized by `scripts/generate-demo-music.mjs`                                            | Project-owned placeholder |
| Fonts                                      | Google Fonts (Cinzel Decorative, Cormorant Garamond, Marcellus, Pinyon Script, EB Garamond) | SIL Open Font License     |

The gilded frame's transparent window is measured in `art.ts` (`FRAME_WINDOW`); update it if the
replacement frame differs.
