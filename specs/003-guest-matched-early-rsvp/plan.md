# Implementation Plan: Guest-Matched Early RSVP

**Branch**: `003-guest-matched-early-rsvp` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: [Feature specification](./spec.md)

## Summary

Replace the RSVP placeholder at the existing `#RSVP` anchor with a guest-specific early response flow. Guests match by exact first and last name, see only their household, submit each person's attendance and any granted plus-one in one save, and may omit email. Hosts import and validate the roster, review responses, and export them. Use Neon managed PostgreSQL Free with custom Next.js server handling; Airtable, Supabase, and RSVPify remain documented alternatives with tradeoffs.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.8, Next.js 16.3.4

**Primary Dependencies**: Existing Next.js App Router, React, Tailwind CSS v4, Vitest, and Playwright. Use Neon's managed PostgreSQL with the open-source `@neondatabase/serverless` driver over HTTPS from server routes. Add an open-source CSV parser only if the import implementation requires one. Do not add email delivery dependencies unless the hosts choose notifications.

**Storage**: Neon managed PostgreSQL Free plan, within its current 0.5 GB storage, 100 CU-hour/project, and 5 GB egress monthly limits. The database is hosted and operated by Neon; the hosts do not run MongoDB, PostgreSQL, or another database server. Guest-list and RSVP records remain server-only.

**Testing**: Existing Vitest unit/component suites, Playwright e2e, ESLint, TypeScript typecheck, and Next production build. Add focused matching/import validation and a full browser RSVP journey.

**Target Platform**: Current desktop and mobile browsers; Next.js server-capable deployment on the current Vercel target, connected to Neon over HTTPS using its serverless driver. This feature adds runtime data access and one server-held `DATABASE_URL` secret to the previously static site.

**Project Type**: Single-page Next.js web application with a protected host-management route and internal route handlers.

**Performance Goals**: Guests can reach their invitation and submit the complete party response in under two minutes in usability checks. Lookup and save present explicit progress and error states; successful confirmation follows durable persistence. No guest-list data is sent in the initial document or static client bundle.

**Constraints**: Exact full-name comparison after trim/case normalization only; reject duplicate normalized names; no public roster API; generic lookup failures; durable attempt limiting; host-only management; server-side entitlement checks; optional email; household writes are all-or-nothing; mobile-first Tailwind; minimum 44x44px controls; preserve `#RSVP` navigation; retain the current site-wide secret-word gate unchanged. Use a separate host passphrase stored as a server-only hash and a signed, secure, HTTP-only session cookie; never reuse the client-side site password. Neon Free automatically suspends compute after five idle minutes and resumes it on access; first access may be slower. Requests must handle transient connection errors, and usage must stay within free quotas to remain at $0.

**Scale/Scope**: One wedding, one current event, one host-managed roster, household-level submissions, CSV import preview/publish, response review/export, and optional email collection. No guest accounts, payments, meal choices, invitation campaigns, or automatic email delivery in the initial release.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Next.js and React Foundation**: PASS. Uses the existing Next.js 16 App Router and React 19; new server interactions belong in route handlers/server-only modules.
- **II. Tailwind-First Styling**: PASS. Guest and host interfaces use Tailwind v4 and existing site conventions; no global CSS is required.
- **III. Single-Page Navigation**: PASS. Public RSVP remains in the current page at `#RSVP`; guest interactions do not replace the hash or force a reload. A separate protected host route does not change the public canonical destinations.
- **IV. Open-Source Simplicity**: AUTHORIZED EXCEPTION. The user explicitly requested a free, hosted, managed service and selected Neon as the plan default. PostgreSQL and Neon's serverless driver are open-source technologies; Neon-hosted database operations are a scoped proprietary service required to avoid self-hosting. No paid plan or additional email vendor is selected.
- **V. Stable, Optimized Imagery**: PASS / NOT APPLICABLE. The RSVP feature adds no imagery; any reuse of site images must continue using the existing Next Image contracts.
- **VI. Mobile-First Design**: PASS. Base layout is single-column; larger layouts add at `md:`. All controls remain at least 44x44px.
- **Privacy and security**: PASS WITH DOCUMENTED LIMIT. Names are guessable and not proof of identity; the feature applies server-side matching, generic failures, durable rate limiting, scoped sessions, and minimal disclosure. A unique code or email verification remains the stronger optional alternative.

## Project Structure

### Documentation (this feature)

```text
specs/003-guest-matched-early-rsvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-interactions.md
├── checklists/
│   └── requirements.md
└── tasks.md                 # Phase 2 output; not generated by this plan
```

### Source Code (repository root)

```text
app/
├── page.tsx                         # Replace RSVP placeholder; keep canonical page/hash
├── admin/rsvp/page.tsx              # Host-only import and response review
└── api/
    ├── rsvp/lookup/route.ts         # Exact-name match and scoped invitation session
    ├── rsvp/submission/route.ts     # Validated atomic household response
    └── admin/rsvp/route.ts          # Host-only roster import/publish/export boundary

components/rsvp/
├── guest-rsvp.tsx                   # Lookup, party response, confirmation states
├── guest-list-import.tsx            # Host CSV preview and publish controls
└── response-table.tsx               # Host response review

content/
└── rsvp.ts                          # Replace static placeholder copy/config as appropriate

lib/rsvp/
├── matching.ts                      # Canonical exact-name normalization and match rules
├── validation.ts                    # Roster, RSVP, and plus-one validation
├── repository.ts                    # Server-only provider persistence boundary
├── rate-limit.ts                    # Durable lookup attempt control in Neon
└── admin-auth.ts                    # Host passphrase verification and signed session

database/
└── migrations/                      # Versioned PostgreSQL schema and constraints

tests/
├── unit/                             # Name, CSV, household, permission invariants
├── component/                        # Guest and host form behavior
└── e2e/                              # Import-to-submit-to-export journey
```

**Structure Decision**: Keep the guest flow in the existing single-page composition and place host-only management under a distinct protected route. Route handlers own all provider access; client components receive only the matched household view model. Domain normalization and validation live in `lib/rsvp/`, while migrations enforce persisted constraints. Reuse current test folders and project tooling.

**Provider decision**: Neon managed PostgreSQL Free is selected. The user prioritized no self-hosting, $0 cost, and simple managed operation. Neon supplies managed relational storage; Vercel runs the existing Next.js app and server routes. Use a single host credential (`RSVP_ADMIN_PASSWORD_HASH`) and session-signing secret (`RSVP_SESSION_SECRET`) in Vercel's environment settings; this avoids an additional auth vendor while keeping the host route independent from the public site gate. The hosts still need to create Neon and Vercel accounts and set guest-data retention. Automatic email delivery remains out of scope; optional email is stored for host follow-up.

## Phase 0 Research

Completed in [research.md](./research.md). Existing code has a static RSVP prompt and no runtime storage. Research compares Neon, Supabase, Airtable, RSVPify, and a lightweight Google Forms/Sheets option, including open-source status, setup effort, privacy, import/export, email, and current plan limits. Recommendation is Neon Free plus the existing Vercel-hosted custom UI. RSVPify's published email requirement is a material conflict with optional email.

## Phase 1 Design and Contracts

- [data-model.md](./data-model.md) defines roster versions, households, invitees, short-lived invitation scope, current party submission, attendance, and granted plus-one data.
- [contracts/ui-interactions.md](./contracts/ui-interactions.md) defines lookup, submission, host import/review/export, privacy behavior, errors, and accessible mobile interaction.
- [quickstart.md](./quickstart.md) gives host import and guest journey validation scenarios plus repository checks.
- No externally consumed public API is introduced. Route handlers are internal application boundaries and are documented in the UI contract.

## Post-Design Constitution Check

- **Next.js and React**: PASS. Server-owned data access uses the App Router; interactive form islands remain focused.
- **Tailwind/mobile-first**: PASS. Responsive layout and minimum touch targets are explicit in the interaction contract.
- **Single-page navigation**: PASS. Public RSVP stays at `#RSVP`; host administration is separate and does not alter canonical navigation.
- **Open-source simplicity**: AUTHORIZED EXCEPTION. Neon is a proprietary managed hosting service selected in response to the user's explicit no-self-hosting/free requirement; PostgreSQL and the Neon serverless driver are open source. Scope is limited to this RSVP database. No additional service is required for email in the initial release.
- **Privacy**: PASS WITH RESIDUAL NAME-ONLY RISK. Guest data is server-only, lookup is exact and generic, host administration uses a separate signed session, and plus-one enforcement is validated server-side. A one-time guest code remains an optional security upgrade.
- **Storage consistency**: PASS. A household response is one logical transaction, and roster publication is versioned and atomic.
- **Validation**: PASS. Target checks are existing lint, typecheck, Vitest, Playwright, and production build, with RSVP-specific negative cases included.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Managed Neon hosting is a proprietary service | User explicitly requires a free, hosted, managed database and does not want to operate MongoDB or another database server. Scope is limited to RSVP storage and is authorized by this request. | Self-hosted Postgres violates the no-operations requirement. Supabase Free has a one-week inactivity pause; Airtable Free's API quotas and multi-record storage fit the atomic household response less directly; RSVPify requires guest email according to its published help documentation. |
