"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminNav } from "./AdminNav";

export function AdminMobileNav({ visible }: { visible: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col bg-canvas p-4">
        <SheetHeader className="px-1">
          <SheetTitle className="font-display text-xl">Admin</SheetTitle>
        </SheetHeader>
        <AdminNav visible={visible} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
