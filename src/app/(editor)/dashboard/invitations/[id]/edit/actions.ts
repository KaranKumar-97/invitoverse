"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/server/actions/define";
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

/** Autosave. */
export async function saveDraftAction(input: z.input<typeof SaveInput>) {
  return runAction(SaveInput, input, (ctx, data) => invitations.saveDraft(ctx, data));
}

export async function updateTitleAction(input: z.input<typeof TitleInput>) {
  return runAction(TitleInput, input, async (ctx, data) => {
    const res = await invitations.updateTitle(ctx, data);
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

export async function changeSlugAction(input: z.input<typeof SlugInput>) {
  return runAction(SlugInput, input, async (ctx, data) => {
    const res = await invitations.changeSlug(ctx, data);
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

export async function switchTemplateAction(input: z.input<typeof TemplateInput>) {
  return runAction(TemplateInput, input, async (ctx, data) => {
    const res = await invitations.switchTemplate(ctx, data);
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
  return runAction(ConfirmInput, input, (ctx, data) => media.confirmUpload(ctx, data));
}

export async function deleteMediaAction(input: z.input<typeof MediaIdInput>) {
  return runAction(MediaIdInput, input, (ctx, data) => media.deleteMedia(ctx, data));
}

export async function restoreMediaAction(input: z.input<typeof MediaIdInput>) {
  return runAction(MediaIdInput, input, (ctx, data) => media.restoreMedia(ctx, data));
}

// ───────────── Publishing ─────────────

const PublishInput = z.object({ id: Id });

export async function getPublishStateAction(input: z.input<typeof PublishInput>) {
  return runAction(PublishInput, input, (ctx, data) => publishing.getPublishState(ctx, data.id));
}

export async function publishInvitationAction(input: z.input<typeof PublishInput>) {
  return runAction(PublishInput, input, async (ctx, data) => {
    const res = await publishing.publishInvitation(ctx, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invitations");
    return res;
  });
}

export async function unpublishInvitationAction(input: z.input<typeof PublishInput>) {
  return runAction(PublishInput, input, async (ctx, data) => {
    const res = await publishing.unpublishInvitation(ctx, data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/invitations");
    return res;
  });
}
