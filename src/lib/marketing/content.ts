/** Marketing copy shared by the home page, standalone pages and JSON-LD (plain module). */

export const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "How do guests open the invitation?",
    a: "You share a link — on WhatsApp, Instagram, SMS or email. Guests tap it, see a sealed envelope with their name, and tap “Open Invitation” to watch it unfold.",
  },
  {
    q: "Do guests need to install an app?",
    a: "No. It's a website that opens instantly in any phone browser, including WhatsApp's built-in browser. No sign-up, no download.",
  },
  {
    q: "Can I edit it after sharing?",
    a: "Yes. Make changes in the editor whenever you like and press Publish — everyone who has the link sees the update. Links never change.",
  },
  {
    q: "Can each guest get a personal link?",
    a: "Yes. Add your guest list and each family gets its own link that greets them by name and shows only the functions they're invited to. You can see who has opened theirs.",
  },
  {
    q: "Can I add multiple functions?",
    a: "Add as many as you like — Haldi, Mehndi, Sangeet, Wedding, Reception — each with its own date, venue, map link and add-to-calendar button.",
  },
  {
    q: "Is my information private?",
    a: "Invitations are hidden from search engines, a guest's page never contains other guests' names, and your phone numbers and notes stay in your dashboard.",
  },
  {
    q: "What does it cost?",
    a: "Every design is free while we're in beta. If we introduce paid designs later, invitations you've already published keep working.",
  },
];

export const ABOUT = {
  lead: "We're designers and engineers who believe your invitation is the first chapter of your wedding.",
  body: [
    "Printed cards are beautiful, but they don't travel the way families do today — across cities, countries and WhatsApp groups. We set out to make a digital invitation that feels just as considered as a letterpress card, with the moment of opening an envelope intact.",
    "Every design in the studio is drawn and choreographed by hand, then built to load fast on any phone. You bring the names, the functions and the photographs; we make sure they arrive beautifully.",
  ],
  values: [
    {
      title: "Crafted, not generated",
      text: "Each design has its own envelope, typography and opening moment.",
    },
    {
      title: "Respectful of tradition",
      text: "Invocations, regional scripts and every function from Haldi to Reception.",
    },
    {
      title: "Private by default",
      text: "Hidden from search, personal links per family, no ads, no tracking pixels.",
    },
  ],
} as const;
