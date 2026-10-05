"use client";

import { useState } from "react";

import { validateContactEmail } from "@/lib/rsvp/validation";

interface HouseholdMember {
  id: string;
  firstName: string;
  lastName: string;
  plusOneAllowed: boolean;
}

interface HouseholdResult {
  householdId: string;
  members: HouseholdMember[];
}

type AttendanceStatus = "attending" | "declining" | "undecided";

interface HouseholdConfirmation {
  submissionId: string;
  submittedAt: string;
  songRequest: string | null;
  responses: Record<string, AttendanceStatus>;
  plusOnes: Array<{
    grantedToInviteeId: string;
    guestName: string | null;
    status: AttendanceStatus;
  }>;
}

interface PlusOneFormResponse {
  guestName: string;
  status: AttendanceStatus;
}

export function GuestRsvpLookup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [household, setHousehold] = useState<HouseholdResult | null>(null);
  const [responses, setResponses] = useState<Record<string, AttendanceStatus>>({});
  const [plusOnes, setPlusOnes] = useState<Record<string, PlusOneFormResponse>>({});
  const [contactEmail, setContactEmail] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [confirmation, setConfirmation] = useState<HouseholdConfirmation | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rsvp/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      const payload = (await response.json()) as {
        message?: string;
        household?: HouseholdResult;
        responses?: Record<string, AttendanceStatus> | null;
        plusOnes?: HouseholdConfirmation["plusOnes"] | null;
        contactEmail?: string | null;
        songRequest?: string | null;
      };

      if (!response.ok || !payload.household) {
        setHousehold(null);
        setError(payload.message ?? "We couldn't find that invitation.");
        return;
      }

      setHousehold(payload.household);
      setResponses(payload.responses ?? {});
      setContactEmail(payload.contactEmail ?? "");
      setSongRequest(payload.songRequest ?? "");
      setPlusOnes(
        Object.fromEntries(
          (payload.plusOnes ?? []).map((plusOne) => [
            plusOne.grantedToInviteeId,
            { guestName: plusOne.guestName ?? "", status: plusOne.status },
          ]),
        ),
      );
  setConfirmation(null);
    } catch {
      setHousehold(null);
      setError("We couldn't find that invitation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResponseSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!household) return;

    let normalizedEmail: string | null;
    try {
      normalizedEmail = validateContactEmail(contactEmail);
    } catch {
      setError("Enter a valid email address, or leave this blank.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/rsvp/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail: normalizedEmail,
          songRequest: songRequest.trim() || null,
          responses,
          plusOnes: Object.entries(plusOnes).map(([grantedToInviteeId, plusOne]) => ({
            grantedToInviteeId,
            guestName: plusOne.guestName.trim() || null,
            status: plusOne.status,
          })),
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
        confirmation?: HouseholdConfirmation;
      };

      if (!response.ok || !payload.confirmation) {
        setError(payload.message ?? "Your response could not be saved. Please try again.");
        return;
      }

      setConfirmation(payload.confirmation);
      setSongRequest(payload.confirmation.songRequest ?? "");
      setResponses(payload.confirmation.responses);
      setPlusOnes(
        Object.fromEntries(
          payload.confirmation.plusOnes.map((plusOne) => [
            plusOne.grantedToInviteeId,
            { guestName: plusOne.guestName ?? "", status: plusOne.status },
          ]),
        ),
      );
    } catch {
      setError("Your response could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const completeResponse = household !== null &&
    household.members.every((member) => responses[member.id]) &&
    Object.values(plusOnes).every((plusOne) => plusOne.status);
  const statusLabels: Record<AttendanceStatus, string> = {
    attending: "Attending",
    declining: "Declining",
    undecided: "Undecided",
  };

  return (
    <div className="space-y-6 rounded-2xl border border-dusty-blue/40 bg-white/80 p-6 shadow-[0_10px_30px_rgba(39,52,74,0.06)]">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-copper">Early RSVP</p>
        {/* <h3 className="mt-3 font-serif text-3xl text-deep-blue">Find your invitation</h3> */}
        <p className="mt-3 text-base leading-7 text-deep-blue/75">
          Enter the name from your invitation. A last name is optional if it is not listed.
        </p>
      </div>

      {!household ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-deep-blue" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-deep-blue">
            First name
            <input
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-md border border-dusty-blue/40 bg-cream px-3 py-2 text-base text-deep-blue outline-none ring-0 placeholder:text-deep-blue/40 focus:border-coral"
              placeholder=""
            />
          </label>

          <label className="block text-sm font-medium text-deep-blue">
            Last name (optional)
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-md border border-dusty-blue/40 bg-cream px-3 py-2 text-base text-deep-blue outline-none ring-0 placeholder:text-deep-blue/40 focus:border-coral"
              placeholder=""
            />
          </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-deep-blue px-5 py-3 text-sm font-medium text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Checking invitation..." : "Find my invitation"}
          </button>
        </form>
      ) : null}

      {household ? (
        <div className="space-y-3 rounded-md border border-dusty-blue/30 bg-cream p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-copper">Your household</p>
          {error ? (
            <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-deep-blue" role="alert">
              {error}
            </p>
          ) : null}
          {confirmation ? (
            <div className="space-y-4" role="status">
              <p className="font-medium text-deep-blue">Your response is saved.</p>
              <ul className="space-y-2">
                {household.members.map((member) => (
                  <li key={member.id} className="text-sm text-deep-blue">
                    {member.firstName} {member.lastName}: {statusLabels[confirmation.responses[member.id]]}
                  </li>
                ))}
                {confirmation.plusOnes.map((plusOne) => {
                  const invitee = household.members.find((member) => member.id === plusOne.grantedToInviteeId);
                  if (!invitee) return null;

                  return (
                    <li key={plusOne.grantedToInviteeId} className="text-sm text-deep-blue">
                      Guest of {invitee.firstName} {invitee.lastName}
                      {plusOne.guestName ? ` (${plusOne.guestName})` : ""}: {statusLabels[plusOne.status]}
                    </li>
                  );
                })}
                {confirmation.songRequest ? (
                  <li className="text-sm text-deep-blue">Song request: {confirmation.songRequest}</li>
                ) : null}
              </ul>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="inline-flex min-h-11 items-center rounded-md border border-deep-blue/40 px-4 py-2 text-sm font-medium text-deep-blue hover:border-coral hover:text-coral"
              >
                Edit responses
              </button>
            </div>
          ) : (
            <form onSubmit={handleResponseSubmit} noValidate className="space-y-5">
              {household.members.map((member) => {
                const fullName = `${member.firstName} ${member.lastName}`;
                const options: AttendanceStatus[] = ["attending", "declining", "undecided"];

                return (
                  <fieldset key={member.id} className="border-t border-dusty-blue/30 pt-4">
                    <legend className="font-medium text-deep-blue">Attendance for {fullName}</legend>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {options.map((status) => (
                        <label
                          key={status}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-sm text-deep-blue has-[:checked]:border-coral has-[:checked]:bg-coral/10"
                        >
                          <input
                            type="radio"
                            name={`attendance-${member.id}`}
                            value={status}
                            aria-label={`${fullName}: ${statusLabels[status]}`}
                            required
                            checked={responses[member.id] === status}
                            onChange={() => setResponses((current) => ({ ...current, [member.id]: status }))}
                            className="accent-coral"
                          />
                          {statusLabels[status]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              {household.members.filter((member) => member.plusOneAllowed).map((member) => {
                const fullName = `${member.firstName} ${member.lastName}`;
                const guest = plusOnes[member.id];
                const guestLabel = `Guest of ${fullName}`;
                const options: AttendanceStatus[] = ["attending", "declining", "undecided"];

                return (
                  <fieldset key={`plus-one-${member.id}`} className="border-t border-dusty-blue/30 pt-4">
                    <legend className="font-medium text-deep-blue">{guestLabel}</legend>
                    <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-sm text-deep-blue">
                      <input
                        type="checkbox"
                        checked={Boolean(guest)}
                        aria-label={`Bring a guest for ${fullName}`}
                        onChange={(event) => {
                          setPlusOnes((current) => {
                            if (!event.target.checked) {
                              const next = { ...current };
                              delete next[member.id];
                              return next;
                            }
                            return { ...current, [member.id]: { guestName: "", status: "attending" } };
                          });
                        }}
                        className="accent-coral"
                      />
                      Bring a guest for {fullName}
                    </label>

                    {guest ? (
                      <div className="mt-3 space-y-3">
                        <label className="block text-sm font-medium text-deep-blue">
                          {guestLabel} name (optional)
                          <input
                            type="text"
                            value={guest.guestName}
                            onChange={(event) => setPlusOnes((current) => ({
                              ...current,
                              [member.id]: { ...guest, guestName: event.target.value },
                            }))}
                            maxLength={80}
                            className="mt-2 min-h-11 w-full rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-base text-deep-blue outline-none focus:border-coral"
                          />
                        </label>
                        <fieldset className="border-t border-dusty-blue/20 pt-3">
                          <legend className="text-sm font-medium text-deep-blue">Attendance for {guestLabel}</legend>
                          <div className="mt-2 flex flex-wrap justify-center gap-2">
                            {options.map((status) => (
                              <label
                                key={status}
                                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-sm text-deep-blue has-[:checked]:border-coral has-[:checked]:bg-coral/10"
                              >
                                <input
                                  type="radio"
                                  name={`plus-one-attendance-${member.id}`}
                                  value={status}
                                  aria-label={`${guestLabel}: ${statusLabels[status]}`}
                                  required
                                  checked={guest.status === status}
                                  onChange={() => setPlusOnes((current) => ({
                                    ...current,
                                    [member.id]: { ...guest, status },
                                  }))}
                                  className="accent-coral"
                                />
                                {statusLabels[status]}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    ) : null}
                  </fieldset>
                );
              })}

              <label className="block border-t border-dusty-blue/30 pt-4 text-sm font-medium text-deep-blue">
                Email (optional)
                <input
                  type="email"
                  autoComplete="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-base text-deep-blue outline-none focus:border-coral"
                />
                <span className="mt-1 block text-xs font-normal text-deep-blue/65">
                  Only for host follow-up. You can leave this blank.
                </span>
              </label>

              <label className="block border-t border-dusty-blue/30 pt-4 text-sm font-medium text-deep-blue">
                Song request (optional)
                <textarea
                  value={songRequest}
                  onChange={(event) => setSongRequest(event.target.value)}
                  maxLength={250}
                  rows={3}
                  className="mt-2 min-h-[88px] w-full rounded-md border border-dusty-blue/40 bg-white px-3 py-2 text-base text-deep-blue outline-none focus:border-coral"
                  placeholder=""
                />
                <span className="mt-1 block text-xs font-normal text-deep-blue/65">
                  Help us build our wedding playlist!
                </span>
              </label>

              <button
                type="submit"
                disabled={!completeResponse || saving}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-deep-blue px-5 py-3 text-sm font-medium text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving response..." : "Submit RSVP"}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
