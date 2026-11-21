"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./SidebarNav";
import { BRAND } from "@/lib/brand";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col bg-canvas p-4">
        <SheetHeader className="px-1">
          <SheetTitle className="font-display text-xl">{BRAND.name}</SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <Button asChild className="mt-auto h-11 w-full rounded-full">
          <Link href="/dashboard/invitations/new" onClick={() => setOpen(false)}>
            <Plus /> Create invitation
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
