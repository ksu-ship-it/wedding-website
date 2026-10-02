"use client";

import { useEffect, useState } from "react";

import { GuestListImport } from "@/components/rsvp/guest-list-import";
import { RsvpResponseTable } from "@/components/rsvp/response-table";

export default function RsvpAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/rsvp?action=session")
      .then((response) => response.json())
      .then((payload: { authenticated?: boolean }) => {
        if (active && payload.authenticated) setAuthenticated(true);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });
      const payload = (await response.json()) as { authenticated?: boolean; message?: string };
      if (!response.ok || !payload.authenticated) {
        setError(payload.message ?? "The host passphrase was not accepted.");
        return;
      }
      setAuthenticated(true);
      setPassword("");
    } catch {
      setError("Host sign-in could not be completed. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAuthenticated(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 text-deep-blue md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-dusty-blue/40 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-copper">Wedding RSVP</p>
          <h1 className="mt-2 font-serif text-3xl">Host administration</h1>
        </div>
        {authenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-deep-blue/40 px-4 py-2 text-sm font-medium hover:border-coral hover:text-coral"
          >
            Sign out
          </button>
        ) : null}
      </header>

      {authenticated ? (
        <div>
          <GuestListImport />
          <RsvpResponseTable />
        </div>
      ) : (
        <section className="max-w-md space-y-5">
          <h2 className="font-serif text-2xl">Host sign in</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-medium">
              Host passphrase
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 min-h-11 w-full rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-base outline-none focus:border-coral"
              />
            </label>
            <button
              type="submit"
              disabled={working}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-deep-blue px-5 py-3 text-sm font-medium text-white hover:bg-coral disabled:opacity-60"
            >
              {working ? "Signing in..." : "Sign in"}
            </button>
          </form>
          {error ? <p role="alert" className="text-sm text-coral">{error}</p> : null}
        </section>
      )}
    </main>
  );
}
