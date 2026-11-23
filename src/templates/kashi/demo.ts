import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

const photo = (n: number, alt: string, height = 1179) => ({
  assetId: `demo-ks-${n}`,
  url: `/templates/kashi/art/photo-${n}.jpg`,
  width: n === 6 ? 768 : 880,
  height: n === 6 ? 1376 : height,
  alt,
});

const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const kashiDemo: {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  guestEventIds: string[];
} = {
  content: {
    schemaVersion: 1,
    couple: {
      order: "BRIDE_FIRST",
      bride: {
        firstName: "Radha",
        lastName: "Mishra",
        shortBio: "Kathak dancer, sunrise-boat regular and keeper of every family recipe.",
      },
      groom: {
        firstName: "Krishna",
        lastName: "Tiwari",
        shortBio: "Flautist at heart, engineer by day, and forever late to the aarti.",
      },
    },
    families: {
      bride: {
        label: "Daughter of",
        lines: ["Smt. Sunita & Shri Alok Mishra"],
        grandparents: ["Smt. Kamla & Shri Ramnath Mishra"],
      },
      groom: {
        label: "Son of",
        lines: ["Smt. Rekha & Shri Manoj Tiwari"],
        grandparents: ["Smt. Savitri & Shri Gopal Tiwari"],
      },
    },
    invocation: "॥ ॐ श्री गणेशाय नमः ॥",
    weddingDate: "2027-02-21",
    timezone: "Asia/Kolkata",
    city: "Varanasi",
    hashtag: "#RadhaWedsKrishna",
    messages: {
      welcome:
        "With the blessings of the Almighty and our beloved elders, the Mishra & Tiwari families request the pleasure of your company at the wedding of their children.",
      invitation:
        "Some love stories are written by destiny. Ours began on the ghats of Kashi — two paths, one river, and a promise to walk every season of life together.",
      closing: "With love, the Mishra & Tiwari families",
    },
    events: [
      {
        id: "evt_mehndi0001",
        name: "Mehendi",
        icon: "mehndi",
        date: "2027-02-19",
        startTime: "16:00",
        venue: {
          name: "Assi Ghat Haveli",
          address: "Assi Ghat, Varanasi, Uttar Pradesh 221005",
          mapsUrl: maps("Assi Ghat Varanasi"),
        },
        description: "Henna, folk songs and kulhad chai.",
        dressCode: "Greens & pinks",
      },
      {
        id: "evt_haldi00002",
        name: "Haldi",
        icon: "haldi",
        date: "2027-02-20",
        startTime: "10:00",
        venue: {
          name: "Mishra Niwas",
          address: "Sigra, Varanasi, Uttar Pradesh 221010",
          mapsUrl: maps("Sigra Varanasi"),
        },
        dressCode: "Shades of yellow",
      },
      {
        id: "evt_sangeet003",
        name: "Sangeet",
        icon: "music",
        date: "2027-02-20",
        startTime: "19:00",
        venue: {
          name: "Riverside Lawns, Dashashwamedh",
          address: "Dashashwamedh Ghat Road, Varanasi, Uttar Pradesh 221001",
          mapsUrl: maps("Dashashwamedh Ghat Varanasi"),
        },
        description: "Dinner to follow, then Ganga aarti from the boats.",
      },
      {
        id: "evt_wedding004",
        name: "Wedding",
        icon: "mandap",
        date: "2027-02-21",
        startTime: "18:30",
        venue: {
          name: "Ganga Mahal Ghat",
          address: "Ganga Mahal Ghat, Varanasi, Uttar Pradesh 221001",
          mapsUrl: maps("Ganga Mahal Ghat Varanasi"),
        },
        description: "Pheras at 9:15 PM · Dinner follows.",
        dressCode: "Traditional",
      },
    ],
    media: {
      couplePhotos: [],
      familyPhotos: [],
      gallery: [
        photo(1, "The couple among diyas at the evening aarti"),
        photo(2, "Walking along the ghat at sunrise"),
        photo(3, "Sitting on the steps as the aarti lamps burn"),
        photo(4, "Laughing together beside the brass lamps"),
        photo(5, "Holding hands by the river at night"),
        photo(6, "A quiet moment on the steps of the ghat"),
      ],
      video: null,
      music: { type: "LIBRARY", trackId: "raag-dawn", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_sangeet003", "evt_wedding004"],
};
