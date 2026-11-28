import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  currentTrackId,
  findTrack,
  MUSIC_LIBRARY,
  pickableTracks,
} from "@/lib/invitation/music-library";
import { templateManifests } from "@/templates/registry";

describe("music library", () => {
  it("has unique ids and a bundled file for every track", () => {
    expect(new Set(MUSIC_LIBRARY.map((t) => t.id)).size).toBe(MUSIC_LIBRARY.length);
    for (const t of MUSIC_LIBRARY)
      expect(existsSync(path.join(process.cwd(), "public", t.src)), t.src).toBe(true);
  });

  it("keeps invitations on removed tracks playing their replacement", () => {
    expect(findTrack("raag-dawn")?.id).toBe("krishna-flute");
    expect(findTrack("ivory-waltz")?.id).toBe("jashn-e-bahara");
    expect(currentTrackId("tere-vaaste")).toBe("tere-vaaste");
  });

  it("gives every template a default track that exists", () => {
    for (const m of Object.values(templateManifests))
      expect(
        MUSIC_LIBRARY.some((t) => t.id === m.defaultMusicTrackId),
        m.slug,
      ).toBe(true);
  });
});

describe("managed library", () => {
  const lib = [
    { id: "a", title: "A", mood: "", src: "/a.mp3", durationSec: 10, active: true },
    {
      id: "b",
      title: "B",
      mood: "",
      src: "/b.mp3",
      durationSec: 10,
      active: false,
      replacedBy: "c",
    },
    { id: "c", title: "C", mood: "", src: "/c.mp3", durationSec: 10, active: true },
    { id: "h", title: "H", mood: "", src: "/h.mp3", durationSec: 10, active: false },
  ];

  it("follows an admin retirement to its replacement", () => {
    expect(findTrack("b", lib)?.id).toBe("c");
  });

  it("keeps hidden tracks playable but out of the picker", () => {
    expect(findTrack("h", lib)?.id).toBe("h");
    expect(pickableTracks(lib).map((t) => t.id)).toEqual(["a", "c"]);
  });
});
