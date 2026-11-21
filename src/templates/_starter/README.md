# `_starter` — copy me to make a new template

1. `cp -r src/templates/_starter src/templates/<your-slug>`
2. In `manifest.ts`: set `slug`, name, palettes, font pairs, supported sections, options.
3. In `fonts.ts`: load fonts with `next/font/google`, map each font pair id to CSS variables.
4. Build `Envelope.tsx` (call `onOpenStart` in the tap handler, `onReveal` when content should
   appear, `onOpened` when done) and the section components in `sections.tsx`.
5. Write realistic demo data in `demo.ts`.
6. Register it: one line in `templateManifests` + `templateDemos` (`src/templates/registry.ts`)
   and one line in `src/templates/components.ts`.
7. `pnpm db:seed` and `pnpm test` (the contract test renders every registered template).

No editor, API or database changes are needed. See docs/05-template-engine.md §11.
This folder is not registered, so it never appears in the catalogue; the contract test renders it
to prove the skeleton stays valid.
