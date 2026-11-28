# Deepotsav — asset credits

> **Placeholder art — confirm rights before launch.** The temple scene, the lighting film and the
> front view in `public/templates/deepotsav/art/` came from the owner's design references
> (`design-references/Light mandir/`), which were saved from a third-party invitation site. Treat
> them as placeholders until their licence is confirmed or they are replaced with project-owned art
> (same file names and proportions: the unlit and lit frames must line up with the film, and the
> floating diya's position is `FLOATING_DIYA` in `art.ts`). Then re-capture the marketing media.

| Asset                                          | File(s) in `/public/templates/deepotsav/art/`                         | Status                             |
| ---------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| Temple on the river, unlit / lit (cover, hero) | `temple-unlit.webp`, `temple-lit.webp` (1080×1920)                    | Placeholder — rights unconfirmed   |
| Lighting film (cover)                          | `lighting.mp4` (720×1280, 9 s, silent)                                | Placeholder — rights unconfirmed   |
| Lit temple, front view (footer)                | `temple-front.webp` (1080×1920)                                       | Placeholder — rights unconfirmed   |
| Ganesha, event art                             | `ganesha.webp`, `mehendi.webp`, `event-*.webp` (copied from Kashi)    | Placeholder — see Kashi CREDITS.md |
| Scratch-tile foil (polished gold)              | `scratch-foil.webp` (copied from Kashi)                               | Generated in code, project-owned   |
| Fireworks, diyas, arch, frames, jaali          | Drawn in code (`Fireworks.tsx`, `styles.css`, `sections.tsx`)         | Project-owned                      |
| Demo photos                                    | `/templates/kashi/art/photo-*.jpg` (shared with Kashi)                | Placeholder — rights unconfirmed   |
| Demo music (`/public/music/krishna-flute.m4a`) | Supplied by the owner (film / artist recording)                       | Not licensed — see docs/16         |
| Fonts                                          | Google Fonts (Cormorant Garamond, Pinyon Script, Cinzel, EB Garamond) | SIL Open Font License              |

> Art is served through `/t-art/deepotsav/<file>`; an admin can replace any file from `/admin/assets/templates`
> (same shape) without changing this folder (docs/19 §4.6).
