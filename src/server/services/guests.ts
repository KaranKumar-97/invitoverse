import "server-only";
import type { Guest, Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError } from "@/lib/action-result";
import { DraftContentSchema } from "@/lib/invitation/schema";
import { prisma } from "@/server/db/prisma";
import { logEvent } from "@/server/log";
import type { Ctx } from "./context";
import { createUniqueToken, generateGuestToken } from "./guest-tokens";

export const MAX_GUESTS = 1000;
export const MAX_BULK_LINES = 500;

export type GuestRow = {
  id: string;
  displayName: string;
  greeting: string | null;
  personalNote: string | null;
  notes: string | null;
  phone: string | null;
  eventAccess: "ALL" | "SELECTED";
  eventIds: string[];
  token: string;
  status: "NOT_SHARED" | "SHARED" | "OPENED";
  openCount: number;
  sharedAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  createdAt: string;
};

const toRow = (g: Guest): GuestRow => ({
  id: g.id,
  displayName: g.displayName,
  greeting: g.greeting,
  personalNote: g.personalNote,
  notes: g.notes,
  phone: g.phone,
  eventAccess: g.eventAccess,
  eventIds: g.eventIds,
  token: g.token,
  status: g.status,
  openCount: g.openCount,
  sharedAt: g.sharedAt?.toISOString() ?? null,
  firstOpenedAt: g.firstOpenedAt?.toISOString() ?? null,
  lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null,
  createdAt: g.createdAt.toISOString(),
});

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const GuestFieldsSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a name").max(80),
  greeting: opt(120),
  personalNote: opt(500),
  notes: opt(500),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d\s()-]*$/, "Digits, spaces, + and - only")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  eventAccess: z.enum(["ALL", "SELECTED"]).default("ALL"),
  eventIds: z.array(z.string().max(20)).max(15).default([]),
});
export type GuestFields = z.input<typeof GuestFieldsSchema>;

async function ownedInvitation(ctx: Ctx, invitationId: string, opts: { forWrite?: boolean } = {}) {
  const inv = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      ownerId: ctx.userId,
      ...(opts.forWrite ? { status: { not: "ARCHIVED" } } : {}),
    },
    select: { id: true, draftContent: true },
  });
  if (!inv) throw new AppError("NOT_FOUND");
  const eventIds = new Set(DraftContentSchema.parse(inv.draftContent).events.map((e) => e.id));
  return { id: inv.id, eventIds };
}

async function ownedGuest(ctx: Ctx, id: string) {
  const g = await prisma.guest.findFirst({
    where: { id, invitation: { ownerId: ctx.userId, status: { not: "ARCHIVED" } } },
  });
  if (!g) throw new AppError("NOT_FOUND");
  return g;
}

/** SELECTED guests must name at least one real event of this invitation. */
function normaliseAccess(fields: z.output<typeof GuestFieldsSchema>, validEvents: Set<string>) {
  const ids = [...new Set(fields.eventIds.filter((e) => validEvents.has(e)))];
  if (fields.eventAccess === "SELECTED" && ids.length === 0) {
    throw new AppError("VALIDATION", "Choose at least one event, or invite them to all events.", {
      eventIds: ["Choose at least one event"],
    });
  }
  return {
    eventAccess: fields.eventAccess,
    eventIds: fields.eventAccess === "SELECTED" ? ids : [],
  };
}

async function assertCapacity(invitationId: string, adding: number) {
  const count = await prisma.guest.count({ where: { invitationId } });
  if (count + adding > MAX_GUESTS)
    throw new AppError("LIMIT_EXCEEDED", `An invitation can have up to ${MAX_GUESTS} guests.`);
}

export async function listGuests(ctx: Ctx, invitationId: string): Promise<GuestRow[]> {
  await ownedInvitation(ctx, invitationId);
  const rows = await prisma.guest.findMany({
    where: { invitationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return rows.map(toRow);
}

export async function addGuest(
  ctx: Ctx,
  input: { invitationId: string } & GuestFields,
): Promise<GuestRow> {
  const inv = await ownedInvitation(ctx, input.invitationId, { forWrite: true });
  const fields = GuestFieldsSchema.parse(input);
  await assertCapacity(inv.id, 1);
  const access = normaliseAccess(fields, inv.eventIds);
  const guest = await prisma.guest.create({
    data: { invitationId: inv.id, ...fields, ...access, token: await createUniqueToken(prisma) },
  });
  return toRow(guest);
}

/** "Name" or "Name, Greeting" per line. Returns what was created and which lines were skipped. */
export function parseBulkLines(text: string) {
  const ok: Array<{ displayName: string; greeting: string | null }> = [];
  const skipped: Array<{ line: number; text: string; reason: string }> = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const [name, ...rest] = line.split(",");
    const displayName = name.trim();
    const greeting = rest.join(",").trim() || null;
    if (!displayName) return void skipped.push({ line: i + 1, text: line, reason: "Missing name" });
    if (displayName.length > 80)
      return void skipped.push({ line: i + 1, text: line, reason: "Name is too long (80 max)" });
    if (greeting && greeting.length > 120)
      return void skipped.push({
        line: i + 1,
        text: line,
        reason: "Greeting is too long (120 max)",
      });
    ok.push({ displayName, greeting });
  });
  return { ok, skipped };
}

export async function bulkAddGuests(
  ctx: Ctx,
  input: {
    invitationId: string;
    lines: string;
    eventAccess?: "ALL" | "SELECTED";
    eventIds?: string[];
  },
) {
  const inv = await ownedInvitation(ctx, input.invitationId, { forWrite: true });
  const { ok, skipped } = parseBulkLines(input.lines);
  if (ok.length > MAX_BULK_LINES)
    throw new AppError("VALIDATION", `Add at most ${MAX_BULK_LINES} guests at a time.`);
  if (!ok.length) throw new AppError("VALIDATION", "Add at least one name.");
  await assertCapacity(inv.id, ok.length);
  const access = normaliseAccess(
    GuestFieldsSchema.parse({
      displayName: "x",
      eventAccess: input.eventAccess,
      eventIds: input.eventIds,
    }),
    inv.eventIds,
  );
  const data: Prisma.GuestCreateManyInput[] = ok.map((g) => ({
    invitationId: inv.id,
    ...g,
    ...access,
    token: generateGuestToken(),
  }));
  const res = await prisma.guest.createMany({ data, skipDuplicates: true });
  return { created: res.count, skipped };
}

export async function updateGuest(
  ctx: Ctx,
  input: { id: string } & GuestFields,
): Promise<GuestRow> {
  const g = await ownedGuest(ctx, input.id);
  const inv = await ownedInvitation(ctx, g.invitationId, { forWrite: true });
  const fields = GuestFieldsSchema.parse(input);
  const updated = await prisma.guest.update({
    where: { id: g.id },
    data: { ...fields, ...normaliseAccess(fields, inv.eventIds) },
  });
  return toRow(updated);
}

export async function deleteGuest(ctx: Ctx, input: { id: string }) {
  const g = await ownedGuest(ctx, input.id);
  await prisma.guest.delete({ where: { id: g.id } });
  logEvent("guest.deleted", { userId: ctx.userId, guestId: g.id });
  return { ok: true };
}

/** New link; the old token is remembered (revoked) and stops working immediately. */
export async function regenerateGuestToken(ctx: Ctx, input: { id: string }): Promise<GuestRow> {
  const g = await ownedGuest(ctx, input.id);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.revokedGuestToken.create({ data: { token: g.token, guestId: g.id } });
    return tx.guest.update({
      where: { id: g.id },
      data: {
        token: await createUniqueToken(tx),
        tokenCreatedAt: new Date(),
        status: g.status === "OPENED" ? "OPENED" : "NOT_SHARED",
        sharedAt: null,
      },
    });
  });
  logEvent("guest.token_regenerated", { userId: ctx.userId, guestId: g.id });
  return toRow(updated);
}

/** Called when the owner copies or WhatsApps a link. Never downgrades OPENED. */
export async function markGuestShared(ctx: Ctx, input: { id: string }): Promise<GuestRow> {
  const g = await ownedGuest(ctx, input.id);
  if (g.status !== "NOT_SHARED") return toRow(g);
  return toRow(
    await prisma.guest.update({
      where: { id: g.id },
      data: { status: "SHARED", sharedAt: new Date() },
    }),
  );
}

// ───────────── CSV export ─────────────

/** Neutralises spreadsheet formula injection and quotes per RFC 4180. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportGuestsCsv(
  ctx: Ctx,
  invitationId: string,
  appUrl: string,
): Promise<{ filename: string; csv: string }> {
  const inv = await prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: ctx.userId },
    select: { id: true, slug: true, draftContent: true },
  });
  if (!inv) throw new AppError("NOT_FOUND");
  const events = new Map(
    DraftContentSchema.parse(inv.draftContent).events.map((e) => [
      e.id,
      e.name || "Untitled event",
    ]),
  );
  const guests = await prisma.guest.findMany({
    where: { invitationId: inv.id },
    orderBy: { createdAt: "asc" },
  });
  const header = [
    "Name",
    "Greeting",
    "Events",
    "Status",
    "Opens",
    "First opened",
    "Last opened",
    "Personal link",
    "Phone",
    "Private notes",
  ];
  const lines = guests.map((g) =>
    [
      g.displayName,
      g.greeting,
      g.eventAccess === "ALL"
        ? "All events"
        : g.eventIds
            .map((id) => events.get(id) ?? "")
            .filter(Boolean)
            .join("; "),
      { NOT_SHARED: "Not shared", SHARED: "Shared", OPENED: "Opened" }[g.status],
      g.openCount,
      g.firstOpenedAt?.toISOString() ?? "",
      g.lastOpenedAt?.toISOString() ?? "",
      `${appUrl.replace(/\/$/, "")}/i/${inv.slug}/guest/${g.token}`,
      g.phone,
      g.notes,
    ]
      .map(csvCell)
      .join(","),
  );
  return {
    filename: `${inv.slug}-guests.csv`,
    csv: "﻿" + [header.join(","), ...lines].join("\r\n") + "\r\n",
  };
}
