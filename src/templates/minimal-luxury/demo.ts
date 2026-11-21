import type { DesignConfigInput, InvitationContentInput } from "@/lib/invitation/schema";

const img = (n: number, w: number, h: number, alt: string) => ({
  assetId: `demo-ml-${n}`,
  url: `/templates/minimal-luxury/demo/gallery-${n}.svg`,
  width: w,
  height: h,
  alt,
});

export const minimalLuxuryDemo: {
  content: InvitationContentInput;
  design: Partial<DesignConfigInput>;
  guestEventIds: string[];
} = {
  content: {
    schemaVersion: 1,
    couple: {
      order: "GROOM_FIRST",
      bride: {
        firstName: "Anaya",
        lastName: "Kapoor",
        shortBio: "Writes novels by night, edits everyone's texts by day.",
      },
      groom: {
        firstName: "Kabir",
        lastName: "Mehra",
        shortBio: "Cellist, cook, and owner of far too many fountain pens.",
      },
    },
    families: {
      bride: { label: "Daughter of", lines: ["Ritu & Sanjay Kapoor"], grandparents: [] },
      groom: { label: "Son of", lines: ["Meenakshi & Arjun Mehra"], grandparents: [] },
    },
    weddingDate: "2027-11-27",
    timezone: "Asia/Kolkata",
    city: "New Delhi",
    hashtag: "#KabirAndAnaya",
    messages: {
      welcome:
        "Together with their families, Kabir and Anaya invite you to celebrate their marriage.",
      invitation:
        "Some stories are written slowly.\nOurs took eleven years, two cities and one very long letter.\nWe would love for you to be there for the next chapter.",
      closing: "Kabir & Anaya",
    },
    events: [
      {
        id: "evt_cocktail01",
        name: "Cocktail Evening",
        icon: "cocktail",
        date: "2027-11-26",
        startTime: "19:30",
        endTime: "23:30",
        venue: {
          name: "The Library Bar, The Imperial",
          address: "Janpath, Connaught Place, New Delhi 110001",
          mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Imperial+New+Delhi",
        },
        description: "Jazz, conversation and a few toasts.",
        dressCode: "Black tie",
      },
      {
        id: "evt_wedding002",
        name: "Wedding",
        icon: "rings",
        date: "2027-11-27",
        startTime: "17:00",
        venue: {
          name: "The Lawns, Lodhi Gardens Estate",
          address: "Lodhi Road, New Delhi 110003",
          mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lodhi+Gardens+New+Delhi",
        },
        description: "Ceremony at sunset, followed by dinner.",
        dressCode: "Ivory, champagne & pastels",
      },
    ],
    media: {
      couplePhotos: [
        {
          assetId: "demo-ml-couple",
          url: "/templates/minimal-luxury/demo/couple.svg",
          width: 1200,
          height: 1600,
          alt: "Kabir and Anaya",
        },
      ],
      familyPhotos: [],
      gallery: [
        img(1, 1067, 1600, "Soft light"),
        img(2, 1600, 1067, "Candles at dinner"),
        img(3, 1600, 1067, "Garden in bloom"),
        img(4, 1067, 1600, "The venue"),
      ],
      video: null,
      music: { type: "LIBRARY", trackId: "ivory-waltz", startAtSec: 0 },
    },
  },
  design: {},
  guestEventIds: ["evt_wedding002"],
};
