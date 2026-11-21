/** Curated (non-AI) message suggestions for the Details tab. */
export const MESSAGE_SUGGESTIONS = {
  welcome: [
    "Together with our families, we joyfully invite you to celebrate our wedding.",
    "With the blessings of our elders, we request the pleasure of your company as we begin our journey together.",
    "Two hearts, two families, one celebration — we would love for you to be part of it.",
    "Our families invite you to share in our happiness as we tie the knot.",
  ],
  invitation: [
    "Your presence and blessings will make our celebration complete.",
    "As we begin this beautiful journey, we would be honoured to have you beside us — to laugh, to dance, and to bless the beginning of forever.",
    "Some stories are written slowly. We would love for you to be there for the next chapter.",
    "Join us for days of music, colour and love as two families become one.",
  ],
  closing: [
    "With love and gratitude",
    "With warm regards from both families",
    "Awaiting your blessings",
    "See you on the dance floor!",
  ],
} as const;

export const INVOCATIONS = [
  { value: "", label: "None" },
  { value: "॥ श्री गणेशाय नमः ॥", label: "॥ श्री गणेशाय नमः ॥ (Shri Ganeshaya Namah)" },
  { value: "ੴ ਸਤਿਨਾਮ ਵਾਹਿਗੁਰੂ", label: "ੴ ਸਤਿਨਾਮ ਵਾਹਿਗੁਰੂ (Ik Onkar)" },
  { value: "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", label: "بِسْمِ ٱللَّٰهِ (Bismillah)" },
  { value: "சுப முகூர்த்தம்", label: "சுப முகூர்த்தம் (Subha Muhurtham)" },
] as const;

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Kathmandu", label: "Nepal" },
  { value: "Asia/Dubai", label: "UAE" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Europe/London", label: "United Kingdom" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Australia/Sydney", label: "Sydney" },
] as const;

export const EVENT_PRESETS = [
  { name: "Haldi", icon: "haldi" },
  { name: "Mehndi", icon: "mehndi" },
  { name: "Sangeet", icon: "music" },
  { name: "Wedding", icon: "mandap" },
  { name: "Reception", icon: "reception" },
  { name: "Cocktail", icon: "cocktail" },
  { name: "Puja", icon: "puja" },
  { name: "Baraat", icon: "baraat" },
] as const;

export const EVENT_ICON_LABELS = {
  rings: "Rings",
  haldi: "Haldi",
  mehndi: "Mehndi",
  music: "Music",
  mandap: "Mandap",
  cocktail: "Cocktail",
  reception: "Reception",
  puja: "Puja",
  baraat: "Baraat",
  generic: "Celebration",
} as const;
