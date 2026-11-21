"use client";

import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Downloads a printable QR card (QR + names + link) as a PNG — handy for printed cards and signage. */
export function QrButton({
  url,
  title,
  fileName,
}: {
  url: string;
  title: string;
  fileName: string;
}) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const qr = document.createElement("canvas");
      await QRCode.toCanvas(qr, url, {
        width: 720,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#17130F", light: "#FFFFFF" },
      });
      const W = 900;
      const H = 1140;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#FBF8F3";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(60, 60, W - 120, H - 120);
      ctx.strokeStyle = "#B8915A";
      ctx.lineWidth = 2;
      ctx.strokeRect(76, 76, W - 152, H - 152);
      ctx.drawImage(qr, (W - 720) / 2, 130);
      ctx.fillStyle = "#17130F";
      ctx.textAlign = "center";
      ctx.font = "600 44px Georgia, 'Times New Roman', serif";
      ctx.fillText(title, W / 2, 940, W - 200);
      ctx.fillStyle = "#4A433B";
      ctx.font = "26px system-ui, sans-serif";
      ctx.fillText("Scan to open the invitation", W / 2, 995);
      ctx.fillStyle = "#8A8178";
      ctx.font = "22px system-ui, sans-serif";
      ctx.fillText(url.replace(/^https?:\/\//, ""), W / 2, 1040, W - 200);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${fileName}-qr.png`;
      a.click();
    } catch {
      toast.error("Couldn't create the QR code.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full"
      onClick={() => void download()}
      disabled={busy}
    >
      <QrCode /> QR code
    </Button>
  );
}
