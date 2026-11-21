/**
 * Decorative, CSS-only envelope used on auth screens. Idle float animation only;
 * disabled automatically under prefers-reduced-motion (globals.css).
 */
export function EnvelopeArt() {
  return (
    <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(201,162,39,0.18),transparent_70%)]" />
      <div className="relative w-[min(420px,70%)] animate-[float_6s_ease-in-out_infinite]">
        <div className="relative aspect-[1.45/1] rounded-[6px] bg-[#3b1418] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-[#c9a227]/40">
          {/* inner border */}
          <div className="absolute inset-3 rounded-[3px] border border-[#c9a227]/35" />
          {/* flap */}
          <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#4a1a1f] to-[#3b1418] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[58%] border-t border-[#c9a227]/40 [clip-path:polygon(0_0,100%_0,50%_100%)]" />
          {/* wax seal */}
          <div className="absolute top-[58%] left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#e2c15a,#a8841c_60%,#7d6113)] shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
            <span className="font-display text-lg font-semibold tracking-wide text-[#3b1418]">
              V
            </span>
          </div>
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-10px) rotate(1deg)}}`}</style>
    </div>
  );
}
