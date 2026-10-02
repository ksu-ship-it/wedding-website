import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuestRsvpLookup } from "@/components/rsvp/guest-rsvp";

describe("GuestRsvpLookup", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires both names before lookup", () => {
    render(<GuestRsvpLookup />);

    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/last name/i)).toBeRequired();
  });

  it("shows pending feedback and disables duplicate lookup while waiting", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    let resolveLookup: ((response: Response) => void) | undefined;
    fetchMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveLookup = resolve;
    }));
    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));

    expect(await screen.findByRole("button", { name: /checking invitation/i })).toBeDisabled();
    resolveLookup?.({
      ok: true,
      json: async () => ({ household: { householdId: "h1", members: [] } }),
    } as Response);
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /find my invitation/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    });
  });

  it("shows a matched household after a successful exact lookup", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        household: {
          householdId: "h1",
          members: [
            { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
            { id: "a2", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
          ],
        },
      }),
    } as Response);

    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));

    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Attendance for Alicia Anderson" })).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Attendance for Brandon Anderson" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /find my invitation/i })).not.toBeInTheDocument();
    });
  });

  it("shows the generic no-match message when the lookup fails", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "We couldn't find that invitation." }),
    } as Response);

    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Unknown" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Guest" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/we couldn't find that invitation/i)).toBeInTheDocument();
    });

    const instructions = screen.getByText(/enter the first and last name/i);
    const error = screen.getByRole("alert");
    const firstName = screen.getByLabelText(/first name/i);

    expect(instructions.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(error.compareDocumentPosition(firstName) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
