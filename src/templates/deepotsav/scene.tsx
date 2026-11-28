import type { CSSProperties } from "react";
import { orderedNames } from "@/lib/invitation/couple";
import type { RenderableInvitation } from "@/invitation-kit/types";

/** Letters as spans so the cover can write the names in one by one (`--i` = letter index). */
function Letters({ text, offset = 0 }: { text: string; offset?: number }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className="dp-letter" style={{ "--i": offset + i } as CSSProperties}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

/**
 * "Welcome to the wedding of / first & second / city" over the lit temple. The cover and the hero
 * render this in the same place so the hand-off between them is seamless; on the cover the
 * letters start hidden and write in when `data-on` is set on an ancestor.
 */
export function SceneNames({
  data,
  heading = false,
}: {
  data: RenderableInvitation;
  heading?: boolean;
}) {
  const [first, second] = orderedNames(data.content.couple);
  const city = data.content.city;
  const Title = heading ? "h1" : "p";
  return (
    <div className="dp-names flex flex-col items-center px-8 pt-[max(4.5rem,10dvh)] text-center">
      <p className="dp-fade dp-on-night text-[0.7rem] font-semibold tracking-[0.3em] uppercase">
        Welcome to the wedding of
      </p>
      <Title
        {...(heading ? { id: "invite-title", tabIndex: -1 } : {})}
        className="mt-3 outline-none"
      >
        <span className="f-display dp-on-night dp-name block text-[clamp(2.9rem,14cqw,4rem)] leading-[1.08]">
          <Letters text={first} />
        </span>
        <span
          className="dp-fade dp-on-night block text-[1.5rem] leading-none italic"
          style={{ fontFamily: "var(--f-heading)", "--d": first.length } as CSSProperties}
        >
          &amp;
        </span>
        <span className="f-display dp-on-night dp-name block text-[clamp(2.9rem,14cqw,4rem)] leading-[1.08]">
          <Letters text={second} offset={first.length + 3} />
        </span>
      </Title>
      {city && (
        <p
          className="dp-fade dp-on-night mt-3 text-[0.72rem] font-semibold tracking-[0.34em] uppercase"
          style={{ "--d": first.length + second.length + 6 } as CSSProperties}
        >
          {city}
        </p>
      )}
    </div>
  );
}
