/** Bundled royalty-free tracks owners can pick (docs/08-dashboard-specs.md §5.3). */
export type LibraryTrack = {
  id: string;
  title: string;
  mood: string;
  src: string;
  durationSec: number;
};

export const MUSIC_LIBRARY: readonly LibraryTrack[] = [
  {
    id: "raag-dawn",
    title: "Raag Dawn",
    mood: "Traditional · plucked strings & drone",
    src: "/music/raag-dawn.m4a",
    durationSec: 28,
  },
  {
    id: "ivory-waltz",
    title: "Ivory Waltz",
    mood: "Elegant · soft keys",
    src: "/music/ivory-waltz.m4a",
    durationSec: 26,
  },
];

export function findTrack(id: string): LibraryTrack | undefined {
  return MUSIC_LIBRARY.find((t) => t.id === id);
}
