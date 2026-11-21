"use client";

import { useEffect, useMemo, useState } from "react";
import type { TemplateCategory } from "@/lib/invitation/manifest";
import { CATEGORIES, type CatalogueItem, type ComingSoonItem } from "@/lib/marketing/catalogue";
import { cn } from "@/lib/utils";
import { ComingSoonCard, TemplateCard } from "./TemplateCard";

type Sort = "featured" | "newest";

type Props = {
  items: CatalogueItem[];
  comingSoon: ComingSoonItem[];
  /** Catalogue page: sort control + `?category=` / `?sort=` kept in the URL. */
  withUrlState?: boolean;
  className?: string;
};

/** Category chips (with counts) + responsive grid. Filtering is client-side over static data. */
export function TemplateGrid({ items, comingSoon, withUrlState = false, className }: Props) {
  const [category, setCategory] = useState<TemplateCategory | "ALL">("ALL");
  const [sort, setSort] = useState<Sort>("featured");

  // Read initial state from the URL after hydration (keeps the page statically rendered).
  useEffect(() => {
    if (!withUrlState) return;
    const params = new URLSearchParams(window.location.search);
    const cat = CATEGORIES.find((c) => c.param === params.get("category"));
    if (cat) setCategory(cat.id);
    if (params.get("sort") === "newest") setSort("newest");
  }, [withUrlState]);

  const update = (next: { category?: TemplateCategory | "ALL"; sort?: Sort }) => {
    const c = next.category ?? category;
    const s = next.sort ?? sort;
    setCategory(c);
    setSort(s);
    if (!withUrlState) return;
    const params = new URLSearchParams(window.location.search);
    const param = CATEGORIES.find((x) => x.id === c)?.param;
    if (param) params.set("category", param);
    else params.delete("category");
    if (s === "newest") params.set("sort", "newest");
    else params.delete("sort");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };

  const counts = useMemo(() => {
    const m = new Map<TemplateCategory, number>();
    for (const t of items) m.set(t.category, (m.get(t.category) ?? 0) + 1);
    return m;
  }, [items]);

  const visible = useMemo(() => {
    const list = items.filter((t) => category === "ALL" || t.category === category);
    return sort === "newest" ? [...list].sort((a, b) => b.rank - a.rank) : list;
  }, [items, category, sort]);
  const soon = comingSoon.filter((t) => category === "ALL" || t.category === category);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Filter designs by style"
          className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          <Chip active={category === "ALL"} onClick={() => update({ category: "ALL" })}>
            All <Count>{items.length}</Count>
          </Chip>
          {CATEGORIES.map((c) => {
            const n = counts.get(c.id) ?? 0;
            return (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => update({ category: c.id })}
              >
                {c.label} {n ? <Count>{n}</Count> : <Count>soon</Count>}
              </Chip>
            );
          })}
        </div>
        {withUrlState && (
          <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value as Sort })}
              className="h-10 rounded-full border border-line bg-surface px-4 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        )}
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 min-[481px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((item, i) => (
          <li key={item.slug}>
            <TemplateCard item={item} priority={i < 2} />
          </li>
        ))}
        {soon.map((t) => (
          <li key={t.name}>
            <ComingSoonCard item={t} />
          </li>
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        {visible.length} designs shown
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-line bg-surface text-ink-soft hover:border-ink/30 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-xs opacity-60">{children}</span>;
}
