import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuestRsvpLookup } from "@/components/rsvp/guest-rsvp";

const household = {
  householdId: "h1",
  members: [
    { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
    { id: "a2", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
  ],
};

describe("GuestRsvpLookup plus-one controls", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("shows one optional-name guest slot only for an invitee with a grant", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ household, responses: null, plusOnes: [] }),
    } as Response);
    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));

    expect(await screen.findByRole("group", { name: "Guest of Alicia Anderson" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Guest of Brandon Anderson" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Bring a guest for Alicia Anderson" }));
    expect(screen.getByLabelText("Guest of Alicia Anderson name (optional)")).not.toBeRequired();
  });
});
