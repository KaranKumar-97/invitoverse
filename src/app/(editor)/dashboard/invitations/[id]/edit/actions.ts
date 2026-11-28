"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
import {
  actingForInvitation,
  actingForMedia,
  auditAdminEdit,
} from "@/server/services/admin-acting";
import * as invitations from "@/server/services/invitations";
import * as media from "@/server/services/media";
import * as publishing from "@/server/services/publishing";

const Id = z.string().min(1).max(40);
// Content/design shapes are validated by the service (DraftContentSchema / DesignConfigSchema).
const SaveInput = z.object({
  id: Id,
  draftUpdatedAt: z.string().max(40),
  content: z.unknown().optional(),
  design: z.unknown().optional(),
});
const TitleInput = z.object({ id: Id, title: z.string().max(200) });
const SlugInput = z.object({ id: Id, slug: z.string().max(60) });
const TemplateInput = z.object({ id: Id, templateSlug: z.string().max(60) });

// Owners act as themselves; an admin with the needed permission acts with the owner's ctx and
// is audited (src/server/services/admin-acting.ts, docs/19 §4.2).

/** Autosave. */
export async function saveDraftAction(input: z.input<typeof SaveInput>) {
  return runAction(SaveInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id);
    const res = await invitations.saveDraft(a.ctx, data);
    if (a.asAdmin) await auditAdminEdit(ctx.userId, data.id, "invitation.edited");
    return res;
  });
}

export async function updateTitleAction(input: z.input<typeof TitleInput>) {
  return runAction(TitleInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id);
    const res = await invitations.updateTitle(a.ctx, data);
    if (a.asAdmin) await auditAdminEdit(ctx.userId, data.id, "invitation.title_changed", res);
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

export async function changeSlugAction(input: z.input<typeof SlugInput>) {
  return runAction(SlugInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id);
    const res = await invitations.changeSlug(a.ctx, data);
    if (a.asAdmin) await auditAdminEdit(ctx.userId, data.id, "invitation.link_changed", res);
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

export async function switchTemplateAction(input: z.input<typeof TemplateInput>) {
  return runAction(TemplateInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id);
    const res = await invitations.switchTemplate(a.ctx, data);
    if (a.asAdmin)
      await auditAdminEdit(ctx.userId, data.id, "invitation.template_changed", {
        templateSlug: res.templateSlug,
      });
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

// ───────────── Media ─────────────

const MediaRoleSchema = z.enum(["COUPLE", "FAMILY", "GALLERY", "BACKGROUND", "VIDEO", "MUSIC"]);
const ConfirmInput = z.object({
  invitationId: Id,
  role: MediaRoleSchema,
  key: z.string().min(1).max(200),
});
const MediaIdInput = z.object({ id: Id });

/** Records an upload after verifying the stored object server-side. */
export async function confirmMediaUploadAction(input: z.input<typeof ConfirmInput>) {
  return runAction(ConfirmInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.invitationId);
    const res = await media.confirmUpload(a.ctx, data);
    if (a.asAdmin) await auditAdminEdit(ctx.userId, data.invitationId, "invitation.media_added");
    return res;
  });
}

export async function deleteMediaAction(input: z.input<typeof MediaIdInput>) {
  return runAction(MediaIdInput, input, async (ctx, data) => {
    const a = await actingForMedia(ctx, data.id);
    return media.deleteMedia(a.ctx, data);
  });
}

export async function restoreMediaAction(input: z.input<typeof MediaIdInput>) {
  return runAction(MediaIdInput, input, async (ctx, data) => {
    const a = await actingForMedia(ctx, data.id);
    return media.restoreMedia(a.ctx, data);
  });
}

// ───────────── Publishing ─────────────

const PublishInput = z.object({ id: Id });

export async function getPublishStateAction(input: z.input<typeof PublishInput>) {
  return runAction(PublishInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id);
    return publishing.getPublishState(a.ctx, data.id);
  });
}

export async function publishInvitationAction(input: z.input<typeof PublishInput>) {
  return runAction(PublishInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id, "sites.publish");
    const res = await publishing.publishInvitation(a.ctx, data);
    if (a.asAdmin) await auditAdminEdit(ctx.userId, data.id, "site.published");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

export async function unpublishInvitationAction(input: z.input<typeof PublishInput>) {
  return runAction(PublishInput, input, async (ctx, data) => {
    const a = await actingForInvitation(ctx, data.id, "sites.publish");
    const res = await publishing.unpublishInvitation(a.ctx, data);
    if (a.asAdmin) await auditAdminEdit(ctx.userId, data.id, "site.unpublished");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invitations");
    return res;
  });
}
