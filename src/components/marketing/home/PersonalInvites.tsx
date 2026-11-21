import { Check, Eye, Lock, Users } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const POINTS = [
  {
    icon: Users,
    title: "A link for every family",
    text: "Greets them by name and shows only the functions they're invited to.",
  },
  {
    icon: Lock,
    title: "Private by design",
    text: "Nobody sees your guest list, phone numbers or other families' invitations.",
  },
  {
    icon: Eye,
    title: "Know who has opened it",
    text: "Not shared, shared, opened — at a glance, with one-tap WhatsApp sharing.",
  },
];

export function PersonalInvites() {
  return (
    <section className="mk-auto-hide py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <GuestMock />
        <div>
          <SectionHeading
            eyebrow="Personal invites"
            title="Dear Sharma Family — this one is just for you"
            accent="just for you"
          />
          <ul className="mt-10 space-y-6">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-maroon-soft text-maroon">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function GuestMock() {
  const events = [
    { name: "Sangeet", date: "Fri, 12 Feb · 7:00 pm", invited: true },
    { name: "Wedding Ceremony", date: "Sat, 13 Feb · 6:30 pm", invited: true },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="rounded-2xl bg-[#2A0E12] p-8 text-center text-[#F3E3C3] shadow-float">
        <p className="text-[11px] tracking-[0.3em] text-[#CDB78F] uppercase">With love, for</p>
        <p className="mt-3 font-display text-3xl">Sharma Family</p>
        <p className="mx-auto mt-3 max-w-xs text-sm text-[#F3E3C3]/80">
          Dear Sharma ji and family, it would mean the world to have you with us.
        </p>
        <div className="mt-6 space-y-2 text-left">
          {events.map((e) => (
            <div
              key={e.name}
              className="flex items-center justify-between rounded-lg border border-[#B8915A]/30 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="font-display text-lg text-[#E7C77B]">{e.name}</p>
                <p className="text-xs text-[#F3E3C3]/70">{e.date}</p>
              </div>
              <Check className="size-4 text-[#E7C77B]" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -right-2 -bottom-6 rounded-xl bg-surface px-4 py-3 shadow-float sm:-right-8">
        <p className="text-xs text-muted-foreground">Guest list</p>
        <p className="mt-0.5 flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-[#2f7a4f]" /> Sharma Family · Opened 3×
        </p>
      </div>
    </div>
  );
}
