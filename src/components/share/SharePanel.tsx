"use client";

import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { invitationShareText, publicInvitationUrl, whatsappShareUrl } from "@/lib/share";
import { QrButton } from "./QrButton";

export function SharePanel({
  appUrl,
  slug,
  coupleTitle,
  publishedVersion,
}: {
  appUrl: string;
  slug: string;
  coupleTitle: string;
  publishedVersion: number;
}) {
  const url = publicInvitationUrl(appUrl, slug);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/og/${slug}?v=${publishedVersion}`}
          alt="Link preview guests will see"
          className="aspect-[1200/630] w-full bg-muted object-cover"
        />
        <div className="flex items-center gap-2 border-t border-line p-2 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm" title={url}>
            {url.replace(/^https?:\/\//, "")}
          </span>
          <Button
            type="button"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => void copy()}
          >
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          asChild
          className="rounded-full bg-[#1f7a4d] bg-none text-white shadow-none hover:bg-[#1a6942]"
        >
          <a
            href={whatsappShareUrl(invitationShareText(coupleTitle, url))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle /> Share on WhatsApp
          </a>
        </Button>
        <QrButton url={url} title={coupleTitle} fileName={slug} />
        <Button asChild variant="outline" className="rounded-full">
          <a href={`/i/${slug}`} target="_blank" rel="noopener">
            <ExternalLink /> Open
          </a>
        </Button>
      </div>
    </div>
  );
}
