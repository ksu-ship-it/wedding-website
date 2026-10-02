# Quickstart: Guest-Matched Early RSVP

## Prerequisites

- Node.js version supported by the repository's Next.js 16 release and npm.
- The repository dependencies installed with `npm.cmd ci`.
- A Neon account and a managed PostgreSQL project on the Free plan. No database server needs to be installed or operated by the hosts.
- The existing Vercel deployment configured for Next.js server routes, with the Neon connection string stored as a server-only environment variable.
- Use a separate Neon development branch for local development; no local database server or Docker setup is required.

## Configure a Test Environment

1. Set `DATABASE_URL` from the Neon development branch's pooled connection string in `.env.local` using the names-only placeholders in `.env.example`.
2. Configure `RSVP_ADMIN_PASSWORD_HASH` and `RSVP_SESSION_SECRET` for local host management, then set the production values in Vercel's server-side environment settings. Keep all secrets out of `NEXT_PUBLIC_*` variables and version control.
3. Add a mail-provider key only if the hosts choose to send confirmation or follow-up emails. Email is optional for guest response submission.
4. Apply the repository migrations to the development branch. Confirm the host account can access the protected RSVP management view.
5. Start the app with `npm.cmd run dev`.

For local migrations, set both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` from the development branch, then run `node scripts/apply-rsvp-migrations.mjs`. The script uses the direct URL, applies numbered files in transactions, and skips names already present in its migration ledger.

## Guest-List Fixture

Import a UTF-8 CSV with this header:

```csv
invitee_id,household_id,first_name,last_name,plus_one_allowed,household_label
avery-001,household-01,Avery,Nguyen,true,Nguyen household
jordan-001,household-01,Jordan,Nguyen,false,Nguyen household
sam-001,household-02,Sam,Patel,true,Patel household
```

The host preview should show all three valid rows and the grouped households. Verify the first invitee has one plus-one slot and the second has none. Then test a separate draft containing an unknown household ID, a duplicate normalized name, and an invalid boolean; each should be reported with a row number and the draft must not publish.

## End-to-End Validation

1. In the protected host area, import the valid fixture, review it, and publish it.
2. Open the public page at `#RSVP`; submit `Avery Nguyen` and confirm only the Nguyen household is displayed.
3. Set separate attendance states for Avery and Jordan, add an unnamed or named plus-one response for Avery, optionally enter a valid email, and submit once. Verify the confirmation summarizes each response.
4. Reopen the invitation by matching the name and verify the saved responses load. Change a response and submit again; verify there is still one current response per party member.
5. Match `Jordan Nguyen`; verify no plus-one control exists. Attempt to add a plus-one by tampering with the request and verify the server rejects the submission without saving it.
6. Submit an unknown name and make repeated attempts; verify the same generic failure, no roster suggestions, and a rate limit after the configured threshold.
7. Submit a party response with the email field blank. Verify success. Submit invalid email separately and verify other form values are retained.
8. Review and export responses from the host area. Verify guest data is absent from page source and public static assets.
9. Repeat primary lookup and response tasks at mobile and desktop widths with keyboard-only navigation and reduced motion enabled.

## Repository Checks

Run from the repository root:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

Expected result: all commands pass; component and end-to-end tests cover unique/unknown/ambiguous matching, household membership, plus-one permission enforcement, optional email, atomic resubmission, host-only import/export, rate limiting, and responsive keyboard use. Validate the production deployment with non-production sample data before importing the real guest list.

An opt-in live Neon smoke test uses only `tests/fixtures/rsvp-guests.csv` and runs the host import, guest submission, reopen, review, and export flow against the branch configured by `.env.local`. Set `RSVP_DATABASE_SMOKE=1`, a temporary `RSVP_ADMIN_PASSWORD_HASH`, and a temporary `RSVP_SESSION_SECRET`, then run `npm.cmd run test:e2e -- tests/e2e/rsvp-neon-development.spec.ts`. It runs desktop only; the regular RSVP browser tests cover both desktop and mobile. Never run this smoke test against production.

## Rollout and Retention

Use synthetic guest records in local and preview environments. Import real guest data only after the production provider, host authentication, secret handling, export path, and retention/deletion procedure are confirmed. Export the final response list for hosts and delete the roster and RSVP data after the planning/follow-up retention period ends.
