import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

// PLACEHOLDER demo photos (see art.ts / CREDITS.md).
const photo = (n: number, alt: string) => ({
  assetId: `demo-mk-${n}`,
  url: `/templates/meenakshi/art/photo-${n}.jpg`,
  width: 768,
  height: 1376,
  alt,
  focal: { x: 0.5, y: 0.3 },
});

const maps = (q: string) => `https://www.google.com/maps/search/?api=1&query=${q}`;

export const meenakshiDemo: {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  guestEventIds: string[];
} = {
  content: {
    schemaVersion: 1,
    couple: {
      order: "BRIDE_FIRST",
      bride: {
        firstName: "Meenakshi",
        lastName: "Raghavan",
        shortBio: "Bharatanatyam dancer, filter-coffee loyalist, planner of every family trip.",
      },
      groom: {
        firstName: "Sundar",
        lastName: "Venkatesh",
        shortBio: "Architect who sketches temple towers on napkins and still gets lost in them.",
      },
    },
    families: {
      bride: {
        label: "Daughter of",
        lines: ["Smt. Lakshmi & Shri Raghavan"],
        grandparents: [],
      },
      groom: {
        label: "Son of",
        lines: ["Smt. Kamala & Shri Venkatesh"],
        grandparents: [],
      },
    },
    invocation: "॥ ஸ்ரீ கணேசாய நம: ॥",
    weddingDate: "2027-02-14",
    timezone: "Asia/Kolkata",
    city: "Madurai",
    hashtag: "#MeenakshiWedsSundar",
    messages: {
      welcome:
        "request the pleasure of your company at the wedding of their children, with the blessings of the Almighty and our elders.",
      invitation:
        "As the nadaswaram plays and the temple bells ring,\nwe would be honoured to have you with us\nto bless the couple as they begin a new life together.",
      closing: "and your blessings as we begin our journey together",
    },
    events: [
      {
        id: "evt_haldi00001",
        name: "Haldi",
        icon: "haldi",
        date: "2027-02-12",
        startTime: "10:00",
        venue: {
          name: "Raghavan residence, Anna Nagar",
          address: "Anna Nagar, Madurai, Tamil Nadu 625020",
          mapsUrl: maps("Anna+Nagar+Madurai"),
        },
      },
      {
        id: "evt_mehndi0002",
        name: "Mehendi",
        icon: "mehndi",
        date: "2027-02-12",
        startTime: "17:00",
        venue: {
          name: "Lotus Lawns",
          address: "Bypass Road, Madurai, Tamil Nadu 625010",
          mapsUrl: maps("Bypass+Road+Madurai"),
        },
      },
      {
        id: "evt_matkor0003",
        name: "Matkor",
        icon: "puja",
        date: "2027-02-13",
        startTime: "11:00",
        venue: {
          name: "Venkatesh residence, K.K. Nagar",
          address: "K.K. Nagar, Madurai, Tamil Nadu 625020",
          mapsUrl: maps("KK+Nagar+Madurai"),
        },
      },
      {
        id: "evt_muhurt0004",
        name: "Muhurtham",
        icon: "mandap",
        date: "2027-02-14",
        startTime: "06:30",
        endTime: "08:00",
        venue: {
          name: "Sri Meenakshi Kalyana Mandapam",
          address: "West Masi Street, Madurai, Tamil Nadu 625001",
          mapsUrl: maps("West+Masi+Street+Madurai"),
        },
      },
      {
        id: "evt_recept0005",
        name: "Reception",
        icon: "reception",
        date: "2027-02-14",
        startTime: "19:00",
        venue: {
          name: "Heritage Grand",
          address: "Melakkal Main Road, Madurai, Tamil Nadu 625016",
          mapsUrl: maps("Melakkal+Main+Road+Madurai"),
        },
        description: "Dinner and music in the temple courtyard.",
        dressCode: "Festive silks",
      },
    ],
    media: {
      couplePhotos: [],
      familyPhotos: [],
      gallery: [
        photo(1, "Walking the beach at sunset, where it all began"),
        photo(2, "Through the lavender fields"),
        photo(3, "Beside the waterfall"),
        photo(4, "In the mountains, before the temple"),
      ],
      video: null,
      music: { type: "LIBRARY", trackId: "krishna-flute", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_muhurt0004", "evt_recept0005"],
};
