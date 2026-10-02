import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuestRsvpLookup } from "@/components/rsvp/guest-rsvp";

const household = {
  householdId: "h1",
  members: [
    { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
    { id: "a2", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
  ],
};

function mockLookup() {
  return {
    ok: true,
    json: async () => ({ household, responses: null }),
  } as Response;
}

function chooseResponses() {
  fireEvent.click(screen.getByRole("radio", { name: "Alicia Anderson: Attending" }));
  fireEvent.click(screen.getByRole("radio", { name: "Brandon Anderson: Undecided" }));
}

describe("GuestRsvpLookup household submission", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requires an attendance choice for every household member", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce(mockLookup());
    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));

    await screen.findByRole("group", { name: /attendance for alicia anderson/i });
    expect(screen.getByRole("button", { name: /submit rsvp/i })).toBeDisabled();
    chooseResponses();
    expect(screen.getByRole("button", { name: /submit rsvp/i })).toBeEnabled();
  });

  it("shows a durable-save confirmation summarizing the household", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce(mockLookup());
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        confirmation: {
          submissionId: "submission-1",
          submittedAt: "2026-09-30T12:00:00.000Z",
          responses: { a1: "attending", a2: "undecided" },
          plusOnes: [],
        },
      }),
    } as Response);
    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));
    await screen.findByRole("group", { name: /attendance for alicia anderson/i });
    chooseResponses();
    fireEvent.click(screen.getByRole("button", { name: /submit rsvp/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/your response is saved/i);
    expect(screen.getByText(/Alicia Anderson.*Attending/i)).toBeInTheDocument();
    expect(screen.getByText(/Brandon Anderson.*Undecided/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/rsvp/submission", expect.objectContaining({ method: "POST" }));
  });

  it("announces save progress and prevents a duplicate submission", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    let resolveSubmission: ((response: Response) => void) | undefined;
    fetchMock.mockResolvedValueOnce(mockLookup());
    fetchMock.mockReturnValueOnce(new Promise((resolve) => {
      resolveSubmission = resolve;
    }));
    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));
    await screen.findByRole("group", { name: /attendance for alicia anderson/i });
    chooseResponses();
    fireEvent.click(screen.getByRole("button", { name: /submit rsvp/i }));

    expect(await screen.findByRole("button", { name: /saving response/i })).toBeDisabled();
    resolveSubmission?.({
      ok: true,
      json: async () => ({
        confirmation: {
          submissionId: "submission-1",
          submittedAt: "2026-09-30T12:00:00.000Z",
          responses: { a1: "attending", a2: "undecided" },
          plusOnes: [],
        },
      }),
    } as Response);
    expect(await screen.findByRole("status")).toHaveTextContent(/your response is saved/i);
  });

  it("retains selected answers and reports an unconfirmed save after failure", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce(mockLookup());
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Your response could not be saved. Please try again." }),
    } as Response);
    render(<GuestRsvpLookup />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Alicia" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Anderson" } });
    fireEvent.click(screen.getByRole("button", { name: /find my invitation/i }));
    await screen.findByRole("group", { name: /attendance for alicia anderson/i });
    chooseResponses();
    fireEvent.click(screen.getByRole("button", { name: /submit rsvp/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be saved/i);
    expect(screen.getByRole("radio", { name: "Alicia Anderson: Attending" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Brandon Anderson: Undecided" })).toBeChecked();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });
});
