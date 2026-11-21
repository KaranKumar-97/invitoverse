import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { AppError } from "@/lib/action-result";
import { resolveRenderable } from "@/lib/invitation/resolve";
import { prisma } from "@/server/db/prisma";
import * as g from "@/server/services/guests";
import * as inv from "@/server/services/invitations";
import * as pub from "@/server/services/publishing";
import { getGuestView, recordGuestOpen } from "@/server/services/public-invitations";
import { templateManifests } from "@/templates/registry";
import { makeUser, resetDb } from "./helpers";

type Ctx = { userId: string };
let a: Ctx;
let b: Ctx;
let id: string;
let slug: string;
let events: Array<{ id: string; name: string; venue: { name: string } }>;

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

beforeEach(async () => {
  await resetDb();
  a = { userId: (await makeUser("Alice")).id };
  b = { userId: (await makeUser("Bob")).id };
  ({ id, slug } = await inv.createInvitation(a, {
    templateSlug: "royal-heritage",
    brideName: "Priya",
    groomName: "Rahul",
    order: "BRIDE_FIRST",
    weddingDate: "2027-02-14",
  }));
  events = (await inv.getInvitationForEditor(a, id)).content.events;
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

const sharma = () =>
  g.addGuest(a, {
    invitationId: id,
    displayName: "Sharma Family",
    greeting: "Dear Sharma ji and family,",
    notes: "Bride's side — SECRET-NOTE",
    phone: "+91 98765 43210",
    eventAccess: "SELECTED",
    eventIds: [events[1].id, events[2].id],
  });

describe("guest management", () => {
  it("adds guests with unguessable 22-char tokens", async () => {
    const s = await sharma();
    const all = await g.addGuest(a, { invitationId: id, displayName: "Amit Verma" });
    expect(s.token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(s.token).not.toBe(all.token);
    expect(s).toMatchObject({
      eventAccess: "SELECTED",
      status: "NOT_SHARED",
      phone: "+91 98765 43210",
    });
    expect(all).toMatchObject({ eventAccess: "ALL", eventIds: [] });
  });

  it("keeps only real event ids and requires one for SELECTED", async () => {
    const x = await g.addGuest(a, {
      invitationId: id,
      displayName: "X",
      eventAccess: "SELECTED",
      eventIds: [events[0].id, "evt_ghost00000"],
    });
    expect(x.eventIds).toEqual([events[0].id]);
    await expectCode(
      g.addGuest(a, {
        invitationId: id,
        displayName: "Y",
        eventAccess: "SELECTED",
        eventIds: ["evt_ghost00000"],
      }),
      "VALIDATION",
    );
    await expect(g.addGuest(a, { invitationId: id, displayName: "  " })).rejects.toBeTruthy();
  });

  it("bulk adds 'Name' and 'Name, Greeting' lines and reports skips", async () => {
    const res = await g.bulkAddGuests(a, {
      invitationId: id,
      lines: `Sharma Family, Dear Sharma ji, and family\n\nAmit Verma\n${"x".repeat(90)}`,
    });
    expect(res.created).toBe(2);
    expect(res.skipped).toHaveLength(1);
    const list = await g.listGuests(a, id);
    expect(list.map((r) => [r.displayName, r.greeting])).toEqual([
      ["Sharma Family", "Dear Sharma ji, and family"],
      ["Amit Verma", null],
    ]);
  });

  it("marks shared (never downgrading opened) and regenerates links", async () => {
    const s = await sharma();
    expect((await g.markGuestShared(a, { id: s.id })).status).toBe("SHARED");
    const fresh = await g.regenerateGuestToken(a, { id: s.id });
    expect(fresh.token).not.toBe(s.token);
    expect(fresh.status).toBe("NOT_SHARED");
    expect(await prisma.revokedGuestToken.count({ where: { token: s.token } })).toBe(1);
    await prisma.guest.update({ where: { id: s.id }, data: { status: "OPENED" } });
    expect((await g.markGuestShared(a, { id: s.id })).status).toBe("OPENED");
  });

  it("updates and deletes", async () => {
    const s = await sharma();
    const u = await g.updateGuest(a, {
      id: s.id,
      displayName: "The Sharmas",
      eventAccess: "ALL",
      eventIds: [events[0].id],
    });
    expect(u).toMatchObject({ displayName: "The Sharmas", eventAccess: "ALL", eventIds: [] });
    await g.deleteGuest(a, { id: s.id });
    expect(await g.listGuests(a, id)).toHaveLength(0);
  });

  it("exports CSV with personal links and neutralised formulas", async () => {
    await g.addGuest(a, {
      invitationId: id,
      displayName: '=HYPERLINK("http://evil")',
      notes: "+cmd",
    });
    const { csv, filename } = await g.exportGuestsCsv(a, id, "https://vivah.studio");
    expect(filename).toBe(`${slug}-guests.csv`);
    expect(csv).toContain(`https://vivah.studio/i/${slug}/guest/`);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csv).toContain("'+cmd");
  });
});

describe("privacy (docs/07 §9)", () => {
  it("#8 another owner can't list, add, edit, share, regenerate, delete or export", async () => {
    const s = await sharma();
    await expectCode(g.listGuests(b, id), "NOT_FOUND");
    await expectCode(g.addGuest(b, { invitationId: id, displayName: "Intruder" }), "NOT_FOUND");
    await expectCode(g.bulkAddGuests(b, { invitationId: id, lines: "Intruder" }), "NOT_FOUND");
    await expectCode(g.updateGuest(b, { id: s.id, displayName: "Hacked" }), "NOT_FOUND");
    await expectCode(g.markGuestShared(b, { id: s.id }), "NOT_FOUND");
    await expectCode(g.regenerateGuestToken(b, { id: s.id }), "NOT_FOUND");
    await expectCode(g.deleteGuest(b, { id: s.id }), "NOT_FOUND");
    await expectCode(g.exportGuestsCsv(b, id, "https://x"), "NOT_FOUND");
    expect((await g.listGuests(a, id))[0]).toMatchObject({
      displayName: "Sharma Family",
      token: s.token,
    });
  });

  it("#6 links don't work until published, and stop when unpublished", async () => {
    const s = await sharma();
    expect(await getGuestView(slug, s.token)).toBeNull();
    await pub.publishInvitation(a, { id });
    expect(await getGuestView(slug, s.token)).not.toBeNull();
    await pub.unpublishInvitation(a, { id });
    expect(await getGuestView(slug, s.token)).toBeNull();
  });

  it("#4/#5 tokens only work on their own invitation; revoked and unknown tokens look the same", async () => {
    const s = await sharma();
    await pub.publishInvitation(a, { id });
    const other = await inv.createInvitation(b, {
      templateSlug: "royal-heritage",
      brideName: "X",
      groomName: "Y",
      order: "BRIDE_FIRST",
      weddingDate: "2027-01-01",
    });
    await pub.publishInvitation(b, { id: other.id });
    expect(await getGuestView(other.slug, s.token)).toBeNull();
    const fresh = await g.regenerateGuestToken(a, { id: s.id });
    expect(await getGuestView(slug, s.token)).toBeNull();
    expect(await getGuestView(slug, "A".repeat(22))).toBeNull();
    expect(await getGuestView(slug, fresh.token)).not.toBeNull();
    expect(await getGuestView(slug, "../../etc")).toBeNull();
  });

  it("#1–#3 the renderable data has only this guest's display fields and invited events", async () => {
    const s = await sharma();
    await g.addGuest(a, { invitationId: id, displayName: "Amit Verma — OTHER-GUEST" });
    await pub.publishInvitation(a, { id });
    const view = (await getGuestView(slug, s.token))!;
    expect(Object.keys(view.guest).sort()).toEqual([
      "displayName",
      "eventAccess",
      "eventIds",
      "greeting",
      "personalNote",
    ]);
    const data = resolveRenderable({
      manifest: templateManifests["royal-heritage"],
      content: view.invitation.content,
      design: view.invitation.design,
      mode: "GUEST",
      key: "k",
      guest: view.guest,
      links: { beacon: { slug, token: s.token } },
    });
    const json = JSON.stringify(data);
    expect(data.content.events.map((e) => e.id)).toEqual([events[1].id, events[2].id]);
    for (const hidden of [events[0], events[3]]) expect(json).not.toContain(hidden.venue.name);
    for (const leak of ["OTHER-GUEST", "SECRET-NOTE", "98765", "eventAccess", a.userId])
      expect(json).not.toContain(leak);
    const tokens = await prisma.guest.findMany({
      where: { invitationId: id },
      select: { token: true },
    });
    for (const t of tokens.filter((t) => t.token !== s.token)) expect(json).not.toContain(t.token);
  });

  it("records opens only for valid, published links", async () => {
    const s = await sharma();
    await recordGuestOpen(slug, s.token);
    expect((await prisma.guest.findUniqueOrThrow({ where: { id: s.id } })).status).toBe(
      "NOT_SHARED",
    );
    await pub.publishInvitation(a, { id });
    await recordGuestOpen(slug, s.token);
    await recordGuestOpen(slug, s.token);
    await recordGuestOpen(slug, "B".repeat(22));
    const after = await prisma.guest.findUniqueOrThrow({ where: { id: s.id } });
    expect(after).toMatchObject({ status: "OPENED", openCount: 2 });
    expect(after.firstOpenedAt).not.toBeNull();
    expect((await prisma.invitation.findUniqueOrThrow({ where: { id } })).openCount).toBe(2);
  });
});
