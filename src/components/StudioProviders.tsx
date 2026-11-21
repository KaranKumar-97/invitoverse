import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Toasts and tooltips for the signed-in studio (dashboard + editor) only. Kept out of the root
 * layout so marketing and guest invitation pages don't ship their JavaScript.
 */
export function StudioProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster position="top-center" />
    </TooltipProvider>
  );
}
