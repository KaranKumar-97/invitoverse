import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

const photo = (n: number, alt: string) => ({
  assetId: `demo-md-${n}`,
  url: `/templates/mandir/art/photo-${n}.jpg`,
  width: 880,
  height: 1100,
  alt,
});

const maps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export const mandirDemo: {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  guestEventIds: string[];
} = {
  content: {
    schemaVersion: 1,
    couple: {
      order: "GROOM_FIRST",
      bride: {
        firstName: "Meera",
        lastName: "Patil",
        shortBio: "Architect, chai loyalist and the planner of every family trip.",
      },
      groom: {
        firstName: "Aarav",
        lastName: "Deshpande",
        shortBio: "Photographer who finally found a subject he never tires of.",
      },
    },
    families: {
      bride: {
        label: "Daughter of",
        lines: ["Mrs. Sunita & Mr. Ravindra Patil"],
        grandparents: [],
      },
      groom: {
        label: "Son of",
        lines: ["Mrs. Anjali & Mr. Prakash Deshpande"],
        grandparents: [],
      },
    },
    invocation: "॥ श्री गणेशाय नमः ॥",
    weddingDate: "2027-02-14",
    timezone: "Asia/Kolkata",
    city: "Udaipur, Rajasthan",
    hashtag: "#AaravWedsMeera",
    messages: {
      welcome:
        "With the blessings of Lord Ganesha, the Deshpande & Patil families request the honour of your presence at the wedding of their children, as they walk into a new life together.",
      invitation: "Come with your blessings,\nleave with a full heart.",
      closing: "With love, the Deshpande & Patil families",
    },
    events: [
      {
        id: "evt_mehndi0001",
        name: "Mehendi",
        icon: "mehndi",
        date: "2027-02-12",
        startTime: "16:00",
        venue: {
          name: "The Courtyard, Lake Pichola Haveli",
          address: "Gangaur Ghat Marg, Udaipur, Rajasthan 313001",
          mapsUrl: maps("Gangaur Ghat Udaipur"),
        },
        description: "Henna, folk songs and plenty of chai.",
        dressCode: "Greens & pinks",
      },
      {
        id: "evt_haldi00002",
        name: "Haldi",
        icon: "haldi",
        date: "2027-02-13",
        startTime: "10:00",
        venue: {
          name: "Patil Wada",
          address: "Ambamata, Udaipur, Rajasthan 313001",
          mapsUrl: maps("Ambamata Udaipur"),
        },
        dressCode: "Shades of yellow",
      },
      {
        id: "evt_sangeet003",
        name: "Sangeet",
        icon: "music",
        date: "2027-02-13",
        startTime: "19:00",
        venue: {
          name: "Riverside Lawns",
          address: "Fateh Sagar Road, Udaipur, Rajasthan 313004",
          mapsUrl: maps("Fateh Sagar Lake Udaipur"),
        },
        description: "Dinner to follow.",
      },
      {
        id: "evt_wedding004",
        name: "Wedding",
        icon: "mandap",
        date: "2027-02-14",
        startTime: "11:30",
        venue: {
          name: "Temple Lawns, Lake Pichola Haveli",
          address: "Gangaur Ghat Marg, Udaipur, Rajasthan 313001",
          mapsUrl: maps("Lake Pichola Udaipur"),
        },
        description: "Pheras at 12:15 PM · Lunch follows.",
        dressCode: "Traditional",
      },
    ],
    media: {
      couplePhotos: [],
      familyPhotos: [],
      gallery: [
        photo(1, "The couple laughing on the steps of an old haveli"),
        photo(2, "Walking hand in hand along the lake at sunset"),
        photo(3, "Hennaed hands held together among marigold petals"),
        photo(4, "Sharing chai under an umbrella in the rain"),
      ],
      video: null,
      music: { type: "LIBRARY", trackId: "krishna-flute", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_sangeet003", "evt_wedding004"],
};
