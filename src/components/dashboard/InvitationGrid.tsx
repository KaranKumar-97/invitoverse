import Link from "next/link";
import { Eye, Users } from "lucide-react";
import { formatRelative, formatShortDate } from "@/lib/format-date";
import type { InvitationListItem } from "@/server/services/invitations";
import { InvitationActions } from "./InvitationActions";
import { InvitationCover } from "./InvitationCover";
import { StatusPill } from "./StatusPill";
import { templateSwatch } from "./swatch";

function editHref(item: InvitationListItem) {
  return item.status === "ARCHIVED" ? undefined : `/dashboard/invitations/${item.id}/edit`;
}

export function InvitationGrid({ items }: { items: InvitationListItem[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const href = editHref(item);
        const cover = (
          <InvitationCover
            title={item.title}
            coverImageUrl={item.coverImageUrl}
            swatch={templateSwatch(item.templateSlug)}
            className="aspect-[4/3]"
          />
        );
        return (
          <li
            key={item.id}
            className="group overflow-hidden rounded-lg bg-surface shadow-card transition-shadow hover:shadow-float"
          >
            {href ? (
              <Link href={href} aria-label={`Edit ${item.title}`} className="block">
                {cover}
              </Link>
            ) : (
              <div className="opacity-70 grayscale">{cover}</div>
            )}
            <div className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusPill
                    status={item.status}
                    unpublishedChanges={item.hasUnpublishedChanges}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {item.templateName}
                  </span>
                </div>
                <h2 className="mt-2 truncate font-medium">
                  {href ? (
                    <Link href={href} className="hover:underline">
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatShortDate(item.weddingDate)} · edited {formatRelative(item.updatedAt)}
                </p>
                <p className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden="true" /> {item.guestCount} guests
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" aria-hidden="true" /> {item.openCount} opens
                  </span>
                </p>
              </div>
              <InvitationActions item={item} className="-mr-1" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InvitationTable({ items }: { items: InvitationListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-surface shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Invitation</th>
            <th className="px-4 py-3 font-medium">Design</th>
            <th className="px-4 py-3 font-medium">Wedding date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Guests</th>
            <th className="px-4 py-3 text-right font-medium">Opens</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-2 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const href = editHref(item);
            return (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  {href ? (
                    <Link href={href} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{item.title}</span>
                  )}
                  <p className="text-xs text-muted-foreground">/i/{item.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{item.templateName}</td>
                <td className="px-4 py-3 text-ink-soft">{formatShortDate(item.weddingDate)}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    status={item.status}
                    unpublishedChanges={item.hasUnpublishedChanges}
                  />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{item.guestCount}</td>
                <td className="px-4 py-3 text-right tabular-nums">{item.openCount}</td>
                <td className="px-4 py-3 text-ink-soft">{formatRelative(item.updatedAt)}</td>
                <td className="px-2 py-3 text-right">
                  <InvitationActions item={item} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
