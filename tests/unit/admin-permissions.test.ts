import { describe, expect, it } from "vitest";
import {
  effectivePermissions,
  PERMISSION_KEYS,
  PERMISSION_PRESETS,
  PERMISSIONS,
} from "@/lib/admin/permissions";

describe("admin permissions", () => {
  it("gives Superadmins everything regardless of overrides", () => {
    const set = effectivePermissions("SUPERADMIN", [{ key: "users.view", allowed: false }]);
    expect(set.size).toBe(PERMISSION_KEYS.length);
  });

  it("gives users nothing", () => {
    expect(effectivePermissions("USER", []).size).toBe(0);
  });

  it("gives Admins only view permissions by default", () => {
    const set = effectivePermissions("ADMIN", []);
    for (const p of PERMISSIONS) expect(set.has(p.key)).toBe(p.defaultForAdmin);
    expect([...set].every((k) => k.endsWith(".view"))).toBe(true);
  });

  it("applies overrides and drops writes whose view is off", () => {
    const set = effectivePermissions("ADMIN", [
      { key: "templates.price", allowed: true },
      { key: "users.edit", allowed: true },
      { key: "users.view", allowed: false },
    ]);
    expect(set.has("templates.price")).toBe(true);
    expect(set.has("users.view")).toBe(false);
    expect(set.has("users.edit")).toBe(false);
  });

  it("has unique keys, valid requirements and presets", () => {
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
    for (const p of PERMISSIONS) if ("requires" in p) expect(PERMISSION_KEYS).toContain(p.requires);
    for (const preset of PERMISSION_PRESETS)
      for (const k of preset.keys) expect(PERMISSION_KEYS).toContain(k);
  });
});
