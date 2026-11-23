import type { TemplateDemo } from "../registry";

export const starterDemo: TemplateDemo = {
  content: {
    schemaVersion: 1,
    couple: { order: "BRIDE_FIRST", bride: { firstName: "Asha" }, groom: { firstName: "Dev" } },
    weddingDate: "2027-12-12",
    messages: { welcome: "Please join us as we celebrate our wedding." },
    events: [
      {
        id: "evt_starter001",
        name: "Wedding",
        icon: "rings",
        date: "2027-12-12",
        startTime: "18:00",
        venue: { name: "Garden Hall", address: "Pune" },
      },
      {
        id: "evt_starter002",
        name: "Reception",
        icon: "reception",
        date: "2027-12-13",
        startTime: "19:30",
        venue: { name: "Terrace", address: "Pune" },
      },
    ],
    media: { music: { type: "LIBRARY", trackId: "jashn-e-bahara", startAtSec: 0 } },
  },
  design: {},
  guestEventIds: ["evt_starter002"],
};
