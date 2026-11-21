import { CATALOGUE } from "@/lib/marketing/catalogue";
import { LoopVideo } from "../LoopVideo";
import { PhoneFrame } from "../PhoneFrame";
import { SectionHeading } from "./SectionHeading";

const CHIPS = ["Envelope reveal", "Music on open", "Live countdown", "Maps & calendar"];

export function OpeningMoment() {
  const t = CATALOGUE[0];
  if (!t) return null;
  return (
    <section className="mk-auto-hide bg-[#17130f] py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="text-center lg:text-left">
          <SectionHeading
            eyebrow="The opening moment"
            title="Every invitation begins with a moment"
            accent="a moment"
            lead="Guests see their name on a sealed envelope. One tap breaks the seal, the music swells, and your celebration unfolds."
            invert
          />
          <ul className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
            {CHIPS.map((c) => (
              <li
                key={c}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
        <PhoneFrame className="mx-auto w-[min(300px,72vw)] ring-white/10">
          <LoopVideo
            poster={t.media.poster}
            mp4={t.media.mp4}
            webm={t.media.webm}
            label={`${t.name} invitation opening`}
          />
        </PhoneFrame>
      </div>
    </section>
  );
}
