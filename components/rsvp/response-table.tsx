"use client";

import { useEffect, useState } from "react";

interface RsvpResponseRow {
  household: string;
  invitee: string;
  attendance: string | null;
  plusOneName: string | null;
  plusOneAttendance: string | null;
  contactEmail: string | null;
  songRequest: string | null;
  versionId: string;
  submittedAt: string | null;
}

export function RsvpResponseTable() {
  const [rows, setRows] = useState<RsvpResponseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/rsvp?action=responses")
      .then(async (response) => {
        const payload = (await response.json()) as { responses?: RsvpResponseRow[]; message?: string };
        if (!response.ok || !payload.responses) {
          throw new Error(payload.message ?? "Responses could not be loaded.");
        }
        if (active) setRows(payload.responses);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Responses could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-5 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-deep-blue">Guest responses</h2>
          <p className="mt-2 text-sm text-deep-blue/70">{rows.length} invitee rows</p>
        </div>
        <a
          href="/api/admin/rsvp?action=export"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-deep-blue/40 px-4 py-2 text-sm font-medium text-deep-blue hover:border-coral hover:text-coral"
        >
          Export CSV
        </a>
      </div>

      {loading ? <p role="status" className="text-sm text-deep-blue/70">Loading responses...</p> : null}
      {error ? <p role="alert" className="text-sm text-coral">{error}</p> : null}
      {!loading && !error ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-dusty-blue/40 text-xs uppercase text-copper">
                <th className="py-3 pr-4">Household</th>
                <th className="py-3 pr-4">Invitee</th>
                <th className="py-3 pr-4">Attendance</th>
                <th className="py-3 pr-4">Plus-one</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Song request</th>
                <th className="py-3 pr-4">Roster version</th>
                <th className="py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.versionId}-${row.invitee}-${index}`} className="border-b border-dusty-blue/20 align-top">
                  <td className="py-3 pr-4">{row.household}</td>
                  <td className="py-3 pr-4">{row.invitee}</td>
                  <td className="py-3 pr-4">{row.attendance ?? "No response"}</td>
                  <td className="py-3 pr-4">
                    {row.plusOneName || row.plusOneAttendance
                      ? [row.plusOneName ?? "Unnamed guest", row.plusOneAttendance].filter(Boolean).join(" · ")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">{row.contactEmail ?? "—"}</td>
                  <td className="py-3 pr-4">{row.songRequest ?? "—"}</td>
                  <td className="py-3 pr-4">{row.versionId}</td>
                  <td className="py-3">{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
