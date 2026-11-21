import { CalendarHeart, Images, MapPin, Music2, Smartphone, Timer } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const FEATURES = [
  {
    icon: CalendarHeart,
    title: "Multiple events",
    text: "Haldi to Reception, each with its own date, venue and dress code.",
  },
  {
    icon: Images,
    title: "Photo gallery",
    text: "Your favourite pictures in a gallery made for each design.",
  },
  {
    icon: Music2,
    title: "Background music",
    text: "Starts softly when the envelope opens. Guests can mute any time.",
  },
  { icon: Timer, title: "Live countdown", text: "Days, hours and minutes to the big day." },
  {
    icon: MapPin,
    title: "Maps & add to calendar",
    text: "One tap to directions and a reminder in their calendar.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first & fast",
    text: "Built for phones and WhatsApp's browser. Loads in a blink.",
  },
];

export function Features() {
  return (
    <section className="mk-auto-hide border-y border-line bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Everything included"
          title="All your functions, one beautiful link"
          accent="one beautiful link"
          center
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="bg-surface p-7">
              <Icon className="size-6 text-maroon" />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-ink-soft">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
