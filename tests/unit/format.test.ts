import { describe, expect, it } from "vitest";
import { initials } from "@/lib/format";

describe("initials", () => {
  it("uses first letters of first two words", () =>
    expect(initials("Priya Malhotra", null)).toBe("PM"));
  it("uses first two letters of a single name", () => expect(initials("Priya", null)).toBe("PR"));
  it("falls back to the email local part", () =>
    expect(initials(null, "rahul@example.com")).toBe("RA"));
  it("handles nothing", () => expect(initials(null, null)).toBe("?"));
});
