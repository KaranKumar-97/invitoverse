import { whatsappChatUrl } from "@/lib/marketing/site";

/** Floating "Let's talk" chip (docs/09 §2). Hidden when no business number is configured. */
export function WhatsAppChip() {
  const href = whatsappChatUrl();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#1f8a4c] pr-5 pl-4 text-sm font-semibold text-white shadow-float transition-transform hover:scale-[1.03] active:scale-[0.98]"
    >
      <WhatsAppIcon className="size-5" />
      Let&apos;s talk
    </a>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.89.9-3-.2-.31a8.2 8.2 0 1 1 6.88 3.75Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.7 2.7 0 0 0-.85 2.02c0 1.19.87 2.34.99 2.5.12.16 1.7 2.6 4.13 3.65 1.53.66 2.13.72 2.9.6.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}
