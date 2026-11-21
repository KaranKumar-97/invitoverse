import { describe, expect, it } from "vitest";
import { scrubDeep, scrubString } from "@/lib/observability/scrub";

describe("scrub", () => {
  it("removes guest tokens from invitation URLs", () => {
    expect(
      scrubString("https://invitationbanao.com/i/priya-rahul/guest/RWfLjvLgNqyS2r1sMgjung?x=1"),
    ).toBe("https://invitationbanao.com/i/priya-rahul/guest/[token]?x=1");
  });

  it("removes emails, phone numbers and secret query params", () => {
    expect(scrubString("mail priya@example.com or +91 98765 43210")).toBe(
      "mail [email] or [phone]",
    );
    expect(scrubString("/api/auth/callback/resend?token=abc123&email=x%40y.z")).toBe(
      "/api/auth/callback/resend?token=[redacted]&email=[redacted]",
    );
  });

  it("leaves ordinary text, dates and ids alone", () => {
    const s = "Invitation cmwmzlq7n00039hyhi01x9y30 published on 2027-02-14";
    expect(scrubString(s)).toBe(s);
  });

  it("deep-scrubs objects and drops cookies/authorization headers", () => {
    const out = scrubDeep({
      request: {
        url: "/i/a/guest/abcdefghijklmnopqrstuv",
        headers: {
          cookie: "authjs.session-token=secret",
          authorization: "Bearer x",
          "user-agent": "UA",
        },
      },
      extra: ["call 9876543210"],
    });
    expect(out).toEqual({
      request: { url: "/i/a/guest/[token]", headers: { "user-agent": "UA" } },
      extra: ["call [phone]"],
    });
  });
});
