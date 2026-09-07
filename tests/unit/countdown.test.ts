import { describe, expect, it } from "vitest";

import { getCountdownParts } from "@/lib/countdown";

describe("getCountdownParts", () => {
  it("returns days, hours, minutes, and seconds for a future target", () => {
    const now = Date.UTC(2027, 0, 1, 0, 0, 0);
    const target = now + (((2 * 24 + 3) * 60 + 4) * 60 + 5) * 1000;

    expect(getCountdownParts(now, target)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      completed: false,
    });
  });

  it("clamps a passed target to the completed state", () => {
    expect(getCountdownParts(2_000, 1_000)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      completed: true,
    });
  });

  it("does not mark an exact target as negative or active", () => {
    expect(getCountdownParts(1_000, 1_000).completed).toBe(true);
  });
});
