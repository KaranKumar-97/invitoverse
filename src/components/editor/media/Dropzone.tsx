"use client";

import { UploadCloud } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function Dropzone({
  accept,
  multiple,
  disabled,
  hint,
  label,
  onFiles,
  compact,
}: {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  hint: string;
  label: string;
  onFiles: (files: File[]) => void;
  compact?: boolean;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled && e.dataTransfer.files.length) onFiles([...e.dataTransfer.files]);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-line text-center transition-colors",
        compact ? "aspect-square p-3" : "px-4 py-8",
        over ? "border-maroon bg-maroon-soft/50" : "hover:border-ink-soft hover:bg-muted/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <UploadCloud className="size-6 text-maroon" aria-hidden="true" />
      <span className={cn("mt-2 font-medium", compact ? "text-xs" : "text-sm")}>{label}</span>
      {!compact && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles([...e.target.files]);
          e.target.value = "";
        }}
      />
    </label>
  );
}
