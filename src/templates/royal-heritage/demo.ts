import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

const img = (n: number, w: number, h: number, alt: string) => ({
  assetId: `demo-rh-${n}`,
  url: `/templates/royal-heritage/demo/gallery-${n}.svg`,
  width: w,
  height: h,
  alt,
});

export const royalHeritageDemo: {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  guestEventIds: string[];
} = {
  content: {
    schemaVersion: 1,
    couple: {
      order: "BRIDE_FIRST",
      bride: {
        firstName: "Meera",
        lastName: "Rathore",
        shortBio: "A classical dancer who has never once been late to a party.",
      },
      groom: {
        firstName: "Aarav",
        lastName: "Singhania",
        shortBio: "Architect, polo enthusiast and the family's designated chai-maker.",
      },
    },
    families: {
      bride: {
        label: "Daughter of",
        lines: ["Smt. Kavita & Shri Mahendra Singh Rathore"],
        grandparents: ["Late Smt. Gayatri Devi & Shri Bhawani Singh Rathore"],
      },
      groom: {
        label: "Son of",
        lines: ["Smt. Nandini & Shri Vikram Singhania"],
        grandparents: ["Smt. Sushila & Late Shri Raghunath Singhania"],
      },
    },
    invocation: "॥ श्री गणेशाय नमः ॥",
    weddingDate: "2027-02-13",
    timezone: "Asia/Kolkata",
    city: "Udaipur, Rajasthan",
    hashtag: "#MeeraWedsAarav",
    messages: {
      welcome:
        "With the blessings of our elders, the Rathore and Singhania families request the pleasure of your company as Meera and Aarav begin their journey together.",
      invitation:
        "As the sun sets over Lake Pichola and the palace lamps are lit,\nwe would be honoured to have you beside us —\nto laugh, to dance, and to bless the beginning of forever.",
      closing: "With love and gratitude, the Rathore & Singhania families",
    },
    events: [
      {
        id: "evt_mehndi0001",
        name: "Mehndi",
        icon: "mehndi",
        date: "2027-02-11",
        startTime: "16:00",
        endTime: "20:00",
        venue: {
          name: "Zenana Courtyard, Jagmandir Island Palace",
          address: "Lake Pichola, Udaipur, Rajasthan 313001",
          mapsUrl:
            "https://www.google.com/maps/search/?api=1&query=Jagmandir+Island+Palace+Udaipur",
        },
        description: "Henna, marigolds and folk music by the lake.",
        dressCode: "Greens & pinks",
      },
      {
        id: "evt_sangeet002",
        name: "Sangeet",
        icon: "music",
        date: "2027-02-12",
        startTime: "19:30",
        venue: {
          name: "Durbar Hall, Fateh Prakash Palace",
          address: "City Palace Complex, Udaipur, Rajasthan 313001",
          mapsUrl: "https://www.google.com/maps/search/?api=1&query=Fateh+Prakash+Palace+Udaipur",
        },
        description:
          "An evening of music, dance and family performances. Bring your dancing shoes.",
        dressCode: "Indo-western glam",
      },
      {
        id: "evt_wedding003",
        name: "Wedding Ceremony",
        icon: "mandap",
        date: "2027-02-13",
        startTime: "18:30",
        venue: {
          name: "Manek Chowk, City Palace",
          address: "City Palace Complex, Udaipur, Rajasthan 313001",
          mapsUrl:
            "https://www.google.com/maps/search/?api=1&query=Manek+Chowk+City+Palace+Udaipur",
        },
        description: "Baraat at 6:30 PM · Pheras at 8:15 PM · Dinner follows.",
        dressCode: "Traditional royal",
      },
      {
        id: "evt_reception4",
        name: "Reception",
        icon: "reception",
        date: "2027-02-14",
        startTime: "20:00",
        venue: {
          name: "The Lake Terrace, Taj Lake Palace",
          address: "Lake Pichola, Udaipur, Rajasthan 313001",
          mapsUrl: "https://www.google.com/maps/search/?api=1&query=Taj+Lake+Palace+Udaipur",
        },
        description: "Dinner under the stars.",
      },
    ],
    media: {
      couplePhotos: [
        {
          assetId: "demo-rh-couple",
          url: "/templates/royal-heritage/demo/couple.svg",
          width: 1200,
          height: 1600,
          alt: "Meera and Aarav under a palace arch at sunset",
        },
      ],
      familyPhotos: [],
      gallery: [
        img(1, 1600, 1067, "Palace lit up at dusk"),
        img(2, 1067, 1600, "Marigold garlands"),
        img(3, 1600, 1067, "Fairy lights in the courtyard"),
        img(4, 1067, 1600, "Golden bokeh"),
        img(5, 1600, 1067, "Lake palace at night"),
        img(6, 1600, 1067, "Flowers for the mandap"),
      ],
      video: null,
      music: { type: "LIBRARY", trackId: "raag-dawn", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_sangeet002", "evt_wedding003"],
};
