import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-eyebrow text-maroon">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          This page isn&apos;t here
        </h1>
        <p className="mt-3 text-ink-soft">The link may be mistyped or no longer available.</p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-medium text-maroon underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
