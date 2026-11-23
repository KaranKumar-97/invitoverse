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

/** The current id for a stored track id (follows retired ids to their replacement). */
export function currentTrackId(id: string): string {
  return RETIRED_TRACKS[id] ?? id;
}

export function findTrack(id: string): LibraryTrack | undefined {
  const current = currentTrackId(id);
  return MUSIC_LIBRARY.find((t) => t.id === current);
}
