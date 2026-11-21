import {
  Flame,
  Flower2,
  Gem,
  GlassWater,
  Music,
  PartyPopper,
  Sparkles,
  Sun,
  Crown,
  CalendarHeart,
  type LucideProps,
} from "lucide-react";
import type { EventIcon as EventIconKey } from "@/lib/invitation/schema";

const ICONS: Record<EventIconKey, React.ComponentType<LucideProps>> = {
  rings: Gem,
  haldi: Sun,
  mehndi: Flower2,
  music: Music,
  mandap: Flame,
  cocktail: GlassWater,
  reception: Sparkles,
  puja: Flame,
  baraat: Crown,
  generic: CalendarHeart,
};

export function EventIcon({ icon, ...props }: { icon: EventIconKey } & LucideProps) {
  const Icon = ICONS[icon] ?? PartyPopper;
  return <Icon aria-hidden="true" {...props} />;
}
