/**
 * Bundled tracks owners can pick (docs/08-dashboard-specs.md §5.3). These film / artist clips were
 * added by the owner and are not yet licensed (docs/16 decision log).
 */
export type LibraryTrack = {
  id: string;
  title: string;
  mood: string;
  src: string;
  durationSec: number;
  /** Shown in the editor's picker (false = hidden or retired; existing invitations still play it). */
  active?: boolean;
  /** Retired: invitations that picked this track play the replacement instead. */
  replacedBy?: string | null;
};

export const MUSIC_LIBRARY: readonly LibraryTrack[] = [
  {
    id: "jashn-e-bahara",
    title: "Jashn-e-Bahara",
    mood: "Instrumental · flute",
    src: "/music/jashn-e-bahara.m4a",
    durationSec: 40,
  },
  {
    id: "krishna-flute",
    title: "Krishna Flute",
    mood: "Devotional · bansuri",
    src: "/music/krishna-flute.m4a",
    durationSec: 32,
  },
  {
    id: "madhanya",
    title: "Madhanya",
    mood: "Soulful · bidaai",
    src: "/music/madhanya.m4a",
    durationSec: 60,
  },
  {
    id: "vaaroon",
    title: "Vaaroon",
    mood: "Tender · love song",
    src: "/music/vaaroon.m4a",
    durationSec: 30,
  },
  {
    id: "piya-ghar-aavenge",
    title: "Piya Ghar Aavenge",
    mood: "Folk · celebration",
    src: "/music/piya-ghar-aavenge.mp3",
    durationSec: 56,
  },
  {
    id: "din-shagna-da",
    title: "Din Shagna Da",
    mood: "Bridal entry · Punjabi",
    src: "/music/din-shagna-da.mp3",
    durationSec: 25,
  },
  {
    id: "raataan-lambiyan",
    title: "Raataan Lambiyan",
    mood: "Romantic · Bollywood",
    src: "/music/raataan-lambiyan.mp3",
    durationSec: 25,
  },
  {
    id: "tere-vaaste",
    title: "Tere Vaaste",
    mood: "Romantic · Bollywood",
    src: "/music/tere-vaaste.mp3",
    durationSec: 20,
  },
];

/**
 * Tracks that were removed from the library, mapped to the one that replaces them, so invitations
 * that picked them keep playing music (and show the replacement as selected).
 */
const RETIRED_TRACKS: Readonly<Record<string, string>> = {
  "raag-dawn": "krishna-flute",
  "ivory-waltz": "jashn-e-bahara",
};

/**
 * The current id for a stored track id: follows a retired track to its replacement (admin
 * `replacedBy`, then the built-in map). `library` is the managed list from the database
 * (src/server/services/music.ts); the bundled list is the fallback.
 */
export function currentTrackId(
  id: string,
  library: readonly LibraryTrack[] = MUSIC_LIBRARY,
): string {
  let current = RETIRED_TRACKS[id] ?? id;
  for (let hops = 0; hops < 5; hops++) {
    const next = library.find((t) => t.id === current)?.replacedBy;
    if (!next) break;
    current = next;
  }
  return current;
}

export function findTrack(
  id: string,
  library: readonly LibraryTrack[] = MUSIC_LIBRARY,
): LibraryTrack | undefined {
  const current = currentTrackId(id, library);
  return library.find((t) => t.id === current) ?? MUSIC_LIBRARY.find((t) => t.id === current);
}

/** Tracks owners can pick, in library order. */
export function pickableTracks(library: readonly LibraryTrack[] = MUSIC_LIBRARY) {
  return library.filter((t) => t.active !== false && !t.replacedBy);
}
