import { defaultOptions, type TemplateManifest } from "./manifest";
import type { DesignConfig, SectionKey } from "./schema";

/** The design a new invitation starts with for a given template. */
export function defaultDesign(manifest: TemplateManifest): DesignConfig {
  const visible = new Set<SectionKey>(manifest.defaultSections);
  const ordered: SectionKey[] = [
    ...manifest.defaultSections,
    ...manifest.supportedSections.filter((s) => !visible.has(s)),
  ];
  return {
    paletteId: manifest.palettes[0].id,
    paletteOverrides: {},
    fontPairId: manifest.fontPairs[0].id,
    background: manifest.backgrounds[0]
      ? { type: "PRESET", presetId: manifest.backgrounds[0].id }
      : { type: "NONE" },
    sections: ordered.map((key) => ({ key, visible: visible.has(key) })),
    animation: { intensity: "STANDARD", envelope: true, particles: true, autoplayMusic: true },
    templateOptions: defaultOptions(manifest.options),
  };
}
