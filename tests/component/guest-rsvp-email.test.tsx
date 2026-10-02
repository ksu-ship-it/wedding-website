import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuestRsvpLookup } from "@/components/rsvp/guest-rsvp";

const household = {
  householdId: "h1",
  members: [
    { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: false },
    { id: "a2", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
  ],
};

function openHousehold(fetchMock: ReturnType<typeof vi.mocked<typeof fetch>>) {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ household, responses: null, plusOnes: [] }),
  } as Response);
  render(<GuestRsvpLookup />);
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
  fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));
}

describe("GuestRsvpLookup optional email", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("labels email optional and submits an empty value as null", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    openHousehold(fetchMock);
    expect(await screen.findByLabelText(/email.*optional/i)).not.toBeRequired();
    fireEvent.click(screen.getByRole("radio", { name: "Alicia Anderson: Attending" }));
    fireEvent.click(screen.getByRole("radio", { name: "Brandon Anderson: Undecided" }));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ confirmation: { submissionId: "s1", submittedAt: "now", responses: { a1: "attending", a2: "undecided" }, plusOnes: [] } }),
    } as Response);
    fireEvent.click(screen.getByRole("button", { name: /submit rsvp/i }));
    await screen.findByRole("status");
    expect(fetchMock).toHaveBeenLastCalledWith("/api/rsvp/submission", expect.objectContaining({
      body: expect.stringContaining('"contactEmail":null'),
    }));
  });

  it("reports malformed email while preserving all attendance choices", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    openHousehold(fetchMock);
    await screen.findByRole("group", { name: /attendance for alicia anderson/i });
    fireEvent.click(screen.getByRole("radio", { name: "Alicia Anderson: Attending" }));
    fireEvent.click(screen.getByRole("radio", { name: "Brandon Anderson: Declining" }));
    fireEvent.change(screen.getByLabelText(/email.*optional/i), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: /submit rsvp/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/enter a valid email address/i);
    expect(screen.getByRole("radio", { name: "Alicia Anderson: Attending" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Brandon Anderson: Declining" })).toBeChecked();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
