/**
 * Admin permission catalogue (docs/19-admin-panel.md §2.2). Plain module: shared by the server
 * checks and the Admins page toggles. Superadmins pass every check; Admins get `defaultForAdmin`
 * unless a Superadmin set an override (AdminPermission row).
 */
export type AdminRole = "ADMIN" | "SUPERADMIN";

export const PERMISSION_MODULES = [
  "Templates",
  "Users",
  "Sites",
  "Analytics",
  "Assets",
  "Audit log",
] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];

type Def = {
  key: string;
  module: PermissionModule;
  label: string;
  description: string;
  defaultForAdmin: boolean;
  /** A write permission needs this view permission too. */
  requires?: string;
};

export const PERMISSIONS = [
  {
    key: "templates.view",
    module: "Templates",
    label: "View templates",
    description: "See the catalogue, usage counts and prices.",
    defaultForAdmin: true,
  },
  {
    key: "templates.visibility",
    module: "Templates",
    label: "Show, hide and reorder",
    description: "Show or hide templates, change their order and the New badge.",
    defaultForAdmin: false,
    requires: "templates.view",
  },
  {
    key: "templates.price",
    module: "Templates",
    label: "Update prices",
    description: "Set Free / Premium and the price of each template.",
    defaultForAdmin: false,
    requires: "templates.view",
  },
  {
    key: "templates.retire",
    module: "Templates",
    label: "Retire templates",
    description: "Remove a template from the catalogue (existing invitations keep working).",
    defaultForAdmin: false,
    requires: "templates.view",
  },
  {
    key: "users.view",
    module: "Users",
    label: "View users and their data",
    description: "See users, their invitations, drafts, settings and media.",
    defaultForAdmin: true,
  },
  {
    key: "users.view_pii",
    module: "Users",
    label: "Reveal guest contact details",
    description: "Show unmasked guest phone numbers and emails. Every reveal is logged.",
    defaultForAdmin: false,
    requires: "users.view",
  },
  {
    key: "users.edit",
    module: "Users",
    label: "Edit and suspend users",
    description: "Edit a user's profile and suspend or restore their sign-in.",
    defaultForAdmin: false,
    requires: "users.view",
  },
  {
    key: "users.delete",
    module: "Users",
    label: "Delete users",
    description: "Delete a user account.",
    defaultForAdmin: false,
    requires: "users.view",
  },
  {
    key: "users.entitlements",
    module: "Users",
    label: "Grant access",
    description: "Grant or revoke template and feature access for a user.",
    defaultForAdmin: false,
    requires: "users.view",
  },
  {
    key: "invitations.edit",
    module: "Users",
    label: "Edit invitations",
    description: "Open any user's invitation in the editor and change its draft.",
    defaultForAdmin: false,
    requires: "users.view",
  },
  {
    key: "invitations.guests",
    module: "Users",
    label: "Manage guests",
    description: "Add, edit or delete a user's guests and regenerate their links.",
    defaultForAdmin: false,
    requires: "users.view",
  },
  {
    key: "sites.view",
    module: "Sites",
    label: "View deployed sites",
    description: "See published sites, their links and settings.",
    defaultForAdmin: true,
  },
  {
    key: "sites.publish",
    module: "Sites",
    label: "Publish and unpublish",
    description: "Publish, unpublish or republish a user's invitation.",
    defaultForAdmin: false,
    requires: "sites.view",
  },
  {
    key: "sites.settings",
    module: "Sites",
    label: "Edit site settings",
    description: "Change a site's link, title, music and template options.",
    defaultForAdmin: false,
    requires: "sites.view",
  },
  {
    key: "sites.takedown",
    module: "Sites",
    label: "Take sites down",
    description: "Disable a site with a reason, or restore it.",
    defaultForAdmin: false,
    requires: "sites.view",
  },
  {
    key: "sites.delete",
    module: "Sites",
    label: "Delete sites",
    description: "Permanently delete an invitation.",
    defaultForAdmin: false,
    requires: "sites.view",
  },
  {
    key: "analytics.view",
    module: "Analytics",
    label: "View analytics",
    description: "Platform-wide and per-user analytics.",
    defaultForAdmin: true,
  },
  {
    key: "assets.view",
    module: "Assets",
    label: "View assets",
    description: "See the music library and template art.",
    defaultForAdmin: true,
  },
  {
    key: "assets.music",
    module: "Assets",
    label: "Manage music",
    description: "Upload, edit, reorder, hide and retire songs for all templates.",
    defaultForAdmin: false,
    requires: "assets.view",
  },
  {
    key: "assets.template_art",
    module: "Assets",
    label: "Replace template art",
    description: "Replace a template's images and videos.",
    defaultForAdmin: false,
    requires: "assets.view",
  },
  {
    key: "audit.view",
    module: "Audit log",
    label: "View audit log",
    description: "Read the log of every admin change.",
    defaultForAdmin: true,
  },
] as const satisfies readonly Def[];

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as PermissionKey[];

export function isPermissionKey(key: string): key is PermissionKey {
  return (PERMISSION_KEYS as string[]).includes(key);
}

export function permissionDef(key: PermissionKey): Def {
  return PERMISSIONS.find((p) => p.key === key)!;
}

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "ADMIN" || role === "SUPERADMIN";
}

/**
 * The effective permission set. Superadmin: everything. Admin: defaults with overrides applied;
 * a write permission whose view permission is off is off too.
 */
export function effectivePermissions(
  role: string,
  overrides: ReadonlyArray<{ key: string; allowed: boolean }>,
): Set<PermissionKey> {
  if (role === "SUPERADMIN") return new Set(PERMISSION_KEYS);
  if (role !== "ADMIN") return new Set();
  const set = new Set<PermissionKey>();
  for (const p of PERMISSIONS) {
    const o = overrides.find((x) => x.key === p.key);
    if (o ? o.allowed : p.defaultForAdmin) set.add(p.key);
  }
  for (const p of PERMISSIONS as readonly Def[]) {
    if (p.requires && !set.has(p.requires as PermissionKey)) set.delete(p.key as PermissionKey);
  }
  return set;
}

/** One-click presets on the Admins page (keys that are on; everything else off). */
export const PERMISSION_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  keys: PermissionKey[];
}> = [
  {
    id: "view-only",
    label: "View only",
    keys: PERMISSIONS.filter((p) => p.defaultForAdmin).map((p) => p.key),
  },
  {
    id: "support",
    label: "Support",
    keys: [
      "users.view",
      "sites.view",
      "analytics.view",
      "audit.view",
      "invitations.edit",
      "invitations.guests",
      "sites.publish",
      "sites.settings",
    ],
  },
  {
    id: "catalogue",
    label: "Catalogue manager",
    keys: [
      "templates.view",
      "templates.visibility",
      "templates.price",
      "assets.view",
      "assets.music",
      "assets.template_art",
      "analytics.view",
    ],
  },
  {
    id: "content",
    label: "Content editor",
    keys: ["users.view", "sites.view", "invitations.edit", "sites.settings", "assets.view"],
  },
];
