"use client";

import { useState } from "react";

interface ImportIssue {
  rowNumber: number;
  field: string;
  message: string;
}

interface ImportPreview {
  versionId: string;
  rowCount: number;
  validRows: number;
  invalidRows: number;
  rows: Array<{ rowNumber: number; inviteeId: string; firstName: string; lastName: string }>;
  issues: ImportIssue[];
}

export function GuestListImport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setWorking(true);
    setError(null);
    setMessage(null);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.set("action", "preview");
      formData.set("file", file);
      const response = await fetch("/api/admin/rsvp", { method: "POST", body: formData });
      const payload = (await response.json()) as { preview?: ImportPreview; message?: string };
      if (!response.ok || !payload.preview) {
        setError(payload.message ?? "The guest list could not be previewed.");
        return;
      }
      setPreview(payload.preview);
    } catch {
      setError("The guest list could not be previewed. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function handlePublish() {
    if (!preview || preview.issues.length > 0) return;
    setWorking(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", versionId: preview.versionId }),
      });
      const payload = (await response.json()) as { published?: boolean; message?: string };
      if (!response.ok || !payload.published) {
        setError(payload.message ?? "This guest list could not be published.");
        return;
      }
      setMessage("Guest list published.");
      setPreview(null);
      setFile(null);
    } catch {
      setError("This guest list could not be published. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="space-y-5 border-b border-dusty-blue/40 pb-8">
      <div>
        <h2 className="font-serif text-2xl text-deep-blue">Guest list</h2>
        <p className="mt-2 text-sm leading-6 text-deep-blue/70">Preview and publish a complete roster version.</p>
      </div>

      <form onSubmit={handlePreview} className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
        <label className="block w-full max-w-lg text-sm font-medium text-deep-blue">
          Guest list CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setMessage(null);
            }}
            className="mt-2 block min-h-11 w-full rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-sm file:mr-3 file:min-h-8 file:rounded file:border-0 file:bg-cream file:px-3 file:text-deep-blue"
          />
        </label>
        <button
          type="submit"
          disabled={!file || working}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-deep-blue px-5 py-3 text-sm font-medium text-white hover:bg-coral disabled:cursor-not-allowed disabled:opacity-60"
        >
          {working ? "Working..." : "Preview import"}
        </button>
      </form>

      {error ? <p role="alert" className="text-sm text-coral">{error}</p> : null}
      {message ? <p role="status" className="text-sm font-medium text-deep-blue">{message}</p> : null}

      {preview ? (
        <div className="space-y-4" aria-live="polite">
          <p className="text-sm text-deep-blue">
            {preview.validRows} valid {preview.validRows === 1 ? "row" : "rows"}; {preview.invalidRows} invalid; {preview.rowCount} total.
          </p>
          {preview.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-dusty-blue/40 text-xs uppercase text-copper">
                    <th className="py-2 pr-4">Invitee ID</th>
                    <th className="py-2 pr-4">First name</th>
                    <th className="py-2">Last name</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.inviteeId} className="border-b border-dusty-blue/20">
                      <td className="py-2 pr-4">{row.inviteeId}</td>
                      <td className="py-2 pr-4">{row.firstName}</td>
                      <td className="py-2">{row.lastName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {preview.issues.length > 0 ? (
            <ul className="space-y-2" aria-label="Import errors">
              {preview.issues.map((issue, index) => (
                <li key={`${issue.rowNumber}-${issue.field}-${index}`} className="text-sm text-coral">
                  Row {issue.rowNumber}, {issue.field}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            disabled={preview.issues.length > 0 || preview.validRows === 0 || working}
            onClick={handlePublish}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-coral px-5 py-3 text-sm font-medium text-deep-blue hover:bg-coral/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working ? "Publishing..." : "Publish guest list"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
