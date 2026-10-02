import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GuestListImport } from "@/components/rsvp/guest-list-import";
import { RsvpResponseTable } from "@/components/rsvp/response-table";

const validCsv = "invitee_id,household_id,first_name,last_name,plus_one_allowed\ng1,h1,Ada,Love,true";
const file = (contents: string) => new File([contents], "guests.csv", { type: "text/csv" });

beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe("host RSVP administration", () => {
  it("shows row errors and blocks publication for an invalid draft", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preview: {
          versionId: "draft-1",
          rowCount: 1,
          validRows: 0,
          invalidRows: 1,
          rows: [],
          issues: [{ rowNumber: 2, field: "household_id", message: "Household is required." }],
        },
      }),
    } as Response);
    render(<GuestListImport />);

    fireEvent.change(screen.getByLabelText(/guest list csv/i), {
      target: { files: [file("bad csv")] },
    });
    fireEvent.click(screen.getByRole("button", { name: /preview import/i }));

    expect(await screen.findByText(/row 2.*household_id/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publish guest list/i })).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/rsvp", expect.objectContaining({ method: "POST" }));
  });

  it("enables publishing only after a valid preview and reports completion", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preview: {
          versionId: "draft-2",
          rowCount: 1,
          validRows: 1,
          invalidRows: 0,
          rows: [{ rowNumber: 2, inviteeId: "g1", firstName: "Ada", lastName: "Love" }],
          issues: [],
        },
      }),
    } as Response);
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ published: true }) } as Response);
    render(<GuestListImport />);

    fireEvent.change(screen.getByLabelText(/guest list csv/i), { target: { files: [file(validCsv)] } });
    fireEvent.click(screen.getByRole("button", { name: /preview import/i }));
    expect(await screen.findByText(/1 valid row/i)).toBeInTheDocument();
    const publishButton = screen.getByRole("button", { name: /publish guest list/i });
    expect(publishButton).toBeEnabled();
    fireEvent.click(publishButton);

    expect(await screen.findByRole("status")).toHaveTextContent(/guest list published/i);
  });

  it("shows response values and exposes a CSV export action", async () => {
    const fetchMock = vi.mocked(globalThis.fetch as typeof fetch);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responses: [{
          household: "Love party",
          invitee: "Ada Love",
          attendance: "attending",
          plusOneName: null,
          plusOneAttendance: null,
          contactEmail: null,
          versionId: "v1",
          submittedAt: "2026-09-30T12:00:00.000Z",
        }],
      }),
    } as Response);
    render(<RsvpResponseTable />);

    expect(await screen.findByText("Ada Love")).toBeInTheDocument();
    expect(screen.getByText("attending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /export csv/i })).toHaveAttribute("href", "/api/admin/rsvp?action=export");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/rsvp?action=responses"));
  });
});
