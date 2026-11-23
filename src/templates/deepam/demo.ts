import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

const img = (n: number, w: number, h: number, alt: string) => ({
  assetId: `demo-dp-${n}`,
  url: `/templates/deepam/demo/gallery-${n}.svg`,
  width: w,
  height: h,
  alt,
});

export const deepamDemo: {
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
        lastName: "Iyer",
        shortBio: "Carnatic vocalist, filter-coffee purist and keeper of every family recipe.",
      },
      groom: {
        firstName: "Karthik",
        lastName: "Raghavan",
        shortBio: "Marine biologist who still can't believe he got her to say yes.",
      },
    },
    families: {
      bride: {
        label: "Daughter of",
        lines: ["Smt. Lakshmi & Shri Venkatesh Iyer"],
        grandparents: ["Late Smt. Kamala & Shri Narayanan Iyer"],
      },
      groom: {
        label: "Son of",
        lines: ["Smt. Revathi & Shri Srinivasan Raghavan"],
        grandparents: ["Smt. Saraswathi & Late Shri Gopalan Raghavan"],
      },
    },
    invocation: "॥ श्री गणेशाय नमः ॥",
    weddingDate: "2027-01-24",
    timezone: "Asia/Kolkata",
    city: "Madurai, Tamil Nadu",
    hashtag: "#AnanyaKarthikDeepam",
    messages: {
      welcome:
        "With the blessings of the Almighty and our elders, the Iyer and Raghavan families invite you to celebrate the wedding of Ananya and Karthik.",
      invitation:
        "As the temple lamps are lit and the nadaswaram begins,\nwe would be honoured to have you with us —\nto bless the couple as they walk into a new life together.",
      closing: "With love and gratitude, the Iyer & Raghavan families",
    },
    events: [
      {
        id: "evt_nichay0001",
        name: "Nichayathartham",
        icon: "rings",
        date: "2027-01-22",
        startTime: "17:00",
        endTime: "20:00",
        venue: {
          name: "Lakshmi Sundaram Hall",
          address: "Tallakulam, Madurai, Tamil Nadu 625002",
          mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lakshmi+Sundaram+Hall+Madurai",
        },
        description: "The formal engagement — exchange of thamboolam and blessings.",
        dressCode: "Silks & jasmine",
      },
      {
        id: "evt_nalang0002",
        name: "Sangeet & Nalangu",
        icon: "music",
        date: "2027-01-23",
        startTime: "18:30",
        venue: {
          name: "Courtyard, The Gateway Hotel Pasumalai",
          address: "40 TPK Road, Pasumalai, Madurai, Tamil Nadu 625004",
          mapsUrl:
            "https://www.google.com/maps/search/?api=1&query=Gateway+Hotel+Pasumalai+Madurai",
        },
        description: "Games, songs and dance with both families. Come ready to be teased.",
        dressCode: "Festive colours",
      },
      {
        id: "evt_muhurt0003",
        name: "Muhurtham",
        icon: "mandap",
        date: "2027-01-24",
        startTime: "07:30",
        endTime: "10:30",
        venue: {
          name: "Sri Meenakshi Kalyana Mandapam",
          address: "West Masi Street, Madurai, Tamil Nadu 625001",
          mapsUrl:
            "https://www.google.com/maps/search/?api=1&query=Kalyana+Mandapam+West+Masi+Street+Madurai",
        },
        description: "Kashi Yatra at 7:30 AM · Muhurtham at 9:00 AM · Wedding lunch follows.",
        dressCode: "Traditional",
      },
      {
        id: "evt_recept0004",
        name: "Reception",
        icon: "reception",
        date: "2027-01-24",
        startTime: "19:00",
        venue: {
          name: "Lawn, Heritage Madurai",
          address: "11 Melakkal Main Road, Madurai, Tamil Nadu 625016",
          mapsUrl: "https://www.google.com/maps/search/?api=1&query=Heritage+Madurai",
        },
        description: "Dinner and music under the stars.",
      },
    ],
    media: {
      couplePhotos: [
        {
          assetId: "demo-dp-couple",
          url: "/templates/deepam/demo/couple.svg",
          width: 1200,
          height: 1600,
          alt: "Ananya and Karthik before a temple tower at dusk",
        },
      ],
      familyPhotos: [],
      gallery: [
        img(1, 1600, 1067, "Temple tower lit with lamps at dusk"),
        img(2, 1067, 1600, "Strings of jasmine and marigold"),
        img(3, 1600, 1067, "Rows of oil lamps"),
        img(4, 1067, 1600, "Warm golden bokeh"),
        img(5, 1600, 1067, "Temple courtyard at night"),
        img(6, 1600, 1067, "Flowers for the mandapam"),
      ],
      video: null,
      music: { type: "LIBRARY", trackId: "krishna-flute", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_nalang0002", "evt_muhurt0003"],
};
