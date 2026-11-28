import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

// Demo photos are shared with Kashi (same couple set, placeholders — see CREDITS.md).
const photo = (n: number, alt: string) => ({
  assetId: `demo-dp-${n}`,
  url: `/templates/kashi/art/photo-${n}.jpg`,
  width: n === 6 ? 768 : 880,
  height: n === 6 ? 1376 : 1179,
  alt,
});

const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const deepotsavDemo: {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  guestEventIds: string[];
} = {
  content: {
    schemaVersion: 1,
    couple: {
      order: "BRIDE_FIRST",
      bride: {
        firstName: "Ananya",
        lastName: "Sharma",
        shortBio: "Classical singer, chai purist and the first to light the diyas every Diwali.",
      },
      groom: {
        firstName: "Arjun",
        lastName: "Mehra",
        shortBio: "Architect of temples on paper, cricket on Sundays, and hopelessly punctual.",
      },
    },
    families: {
      bride: {
        label: "Daughter of",
        lines: ["Smt. Anjali & Shri Rajeev Sharma"],
        grandparents: ["Late Smt. Kamla Devi & Shri Ram Prasad Sharma"],
      },
      groom: {
        label: "Son of",
        lines: ["Smt. Kavita & Shri Sunil Mehra"],
        grandparents: ["Smt. Shanti & Shri Om Prakash Mehra"],
      },
    },
    invocation: "॥ श्री गणेशाय नमः ॥",
    weddingDate: "2027-02-14",
    timezone: "Asia/Kolkata",
    city: "Ayodhya",
    hashtag: "#AnanyaWedsArjun",
    messages: {
      welcome:
        "With the blessings of our elders, the Sharma and Mehra families invite you to the wedding of their children.",
      invitation:
        "We met at a friend's Diwali in Indore, both trying to stay out of the fireworks. Five years, one long-distance year and many plates of poha later, we are getting married — by the river, under a sky full of lamps.",
      closing: "With love, the Sharma and Mehra families",
    },
    events: [
      {
        id: "evt_haldi00001",
        name: "Haldi",
        icon: "haldi",
        date: "2027-02-12",
        startTime: "11:00",
        venue: {
          name: "The Haveli Courtyard",
          address: "Ram Ghat Road, Ayodhya, Uttar Pradesh 224123",
          mapsUrl: maps("Ram Ghat Ayodhya"),
        },
        description: "Turmeric, marigolds and a lot of laughter.",
        dressCode: "Shades of yellow",
      },
      {
        id: "evt_mehndi0002",
        name: "Mehendi",
        icon: "mehndi",
        date: "2027-02-12",
        startTime: "17:00",
        venue: {
          name: "The Garden Terrace",
          address: "Naya Ghat, Ayodhya, Uttar Pradesh 224123",
          mapsUrl: maps("Naya Ghat Ayodhya"),
        },
        description: "Henna, folk songs and kulhad chai.",
        dressCode: "Greens & pinks",
      },
      {
        id: "evt_sangeet003",
        name: "Sangeet",
        icon: "music",
        date: "2027-02-13",
        startTime: "19:30",
        venue: {
          name: "Riverside Lawns",
          address: "Guptar Ghat, Ayodhya, Uttar Pradesh 224001",
          mapsUrl: maps("Guptar Ghat Ayodhya"),
        },
        description: "Dances, dinner and lanterns over the Saryu.",
      },
      {
        id: "evt_wedding004",
        name: "Wedding",
        icon: "mandap",
        date: "2027-02-14",
        startTime: "19:00",
        venue: {
          name: "The Riverside Haveli",
          address: "By the Saryu, near Ram Ki Paidi, Ayodhya, Uttar Pradesh 224123",
          mapsUrl: maps("Ram Ki Paidi Ayodhya"),
        },
        description: "Pheras at 10:00 PM · Dinner follows.",
        dressCode: "Traditional Indian",
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
      music: { type: "LIBRARY", trackId: "krishna-flute", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_sangeet003", "evt_wedding004"],
};
