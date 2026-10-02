import { describe, expect, it } from "vitest";

import { isSameOriginRequest } from "@/lib/rsvp/request-security";

describe("same-origin request validation", () => {
  it("accepts a browser origin matching the host despite a rewritten internal URL", () => {
    const request = new Request("http://next-internal/api/rsvp/submission", {
      headers: {
        origin: "http://127.0.0.1:3001",
        host: "127.0.0.1:3001",
        "x-forwarded-proto": "http",
      },
    });

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects a different origin or a missing origin", () => {
    const crossOrigin = new Request("https://app.example/api", {
      headers: { origin: "https://attacker.example", host: "app.example" },
    });
    const missingOrigin = new Request("https://app.example/api", {
      headers: { host: "app.example" },
    });

    expect(isSameOriginRequest(crossOrigin)).toBe(false);
    expect(isSameOriginRequest(missingOrigin)).toBe(false);
  });
});