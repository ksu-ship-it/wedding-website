# Research: Guest-Matched Early RSVP

**Date**: 2026-09-30
**Scope**: Existing application fit, guest-list/RSVP provider options, email integration, and privacy constraints.

## Decisions

### Selected: Neon managed PostgreSQL Free with a custom Next.js RSVP flow

**Decision**: Use a small Next.js Route Handler integration backed by Neon managed PostgreSQL Free. Neon operates the database; the hosts do not install, host, or maintain a database server. Keep the connection string in server-only Vercel environment settings and use Neon's open-source serverless driver over HTTPS. The provider choice is settled; implementation should validate expected roster size and monthly usage against the free limits before launch.

**Rationale**: The requirements depend on custom rules that matter more than a generic form: exact full-name matching, private household lookup, independently tracked household attendance, per-invitee plus-one permission, optional email, all-or-nothing party updates, and host roster import/export. PostgreSQL models these rules directly and supports transactional writes. Neon provides a managed, $0 free plan with no credit card requirement and automatic scale-to-zero/resume. Its documented TypeScript driver works from Next.js serverless routes over HTTP and exposes transaction support. This avoids self-hosting and keeps guest data in one database.

**Alternatives considered**:

- **Supabase managed Postgres**: Strong alternative with integrated database tooling and policies, but its current Free projects can pause after one week of inactivity; its Pro plan currently starts at $25/month. Neon Free's automatic short idle suspension resumes on access instead of requiring a project unpause. Supabase remains viable if its integrated dashboard is preferred and the couple accepts the cost or pause behavior.
- **Airtable with a custom Next.js flow**: Strongest host-operated spreadsheet experience and the simplest roster editing. It remains a third-party hosted service, requires custom code for secure name matching and plus-one rules, and adds API quota/rate handling. Its API is not a cross-record transactional database, so the implementation would need a single parent submission record or retry/reconciliation behavior.
- **RSVPify embedded RSVP**: Lowest host setup and best built-in guest-list/party/plus-one workflow. Its published personal-event tiers start free for up to 100 guests, with Gold and Platinum limits and prices listed on its current pricing page. Its Help Center says RSVP submissions require an email address even when matching by name, which conflicts with the email-optional requirement. It also stores roster and responses with a proprietary vendor and its exact behavior should be trial-tested before selection.
- **Google Forms/Sheets**: Familiar and inexpensive for a simple form, but does not safely enforce private household matching and plus-one entitlements without custom scripts and additional access-control work. Not recommended for this feature.

### Keep guest lookup server-side

**Decision**: Never ship the roster to browser code or static page data. A server handler performs exact matching and returns only the matched household. Responses use generic failures, request validation, short-lived invitation authorization, and durable lookup-attempt limits. Host roster management uses a separate, host-authenticated surface.

**Rationale**: Names are guessable and exact-name matching is not strong identity proof. Returning suggestions, match/no-match distinctions, or unrelated household data would make roster enumeration easier. A shared site password does not provide per-invitation authorization.

**Alternatives considered**: Email OTP or a unique invitation code/link would provide stronger assurance, but would add a requirement or change the requested name-only guest flow. Keep either as a future security upgrade if the hosts need more than low-assurance invitation gating.

### Use a staged roster import and one current party response

**Decision**: Use a documented CSV template and preview/validation step. Import to a draft roster version, reject ambiguous normalized full names and invalid household references, and publish the new version atomically. Save a household's current response as one logical submission with one attendance choice per invited person and an optional plus-one response.

**Rationale**: A preview prevents spreadsheet errors from silently changing invitation entitlements. Stable invitee identifiers and roster-version attribution make later imports auditable. One household submission avoids partial confirmations.

### Optional email is data, not identity

**Decision**: Do not require email for guest matching or submission. Store it only when entered. The initial release confirms on-screen and exposes the supplied address to hosts; automatic guest/host email delivery is an optional follow-up.

**Rationale**: The user requires email-free submission. Keeping delivery separate avoids adding a provider account, sender-domain setup, and secrets before the hosts decide they need notifications.

**Email alternatives considered**:

- **Existing mailbox SMTP**: Can use a host's current email provider if it supports authenticated transactional sending; may have deliverability and sending-limit constraints. Never place mailbox credentials in browser code.
- **Resend**: A simple transactional email API with a Supabase Edge Function integration documented by Supabase. Requires a separate account, verified sending domain, and server-only API key; pricing/free limits can change.
- **Airtable automations or RSVPify Email Suite**: Easier to configure inside those products, but tied to their plan limits and data platform. RSVPify's own lookup flow still requires an email for each submission according to its published Help Center.

## Existing Application Findings

- The application is Next.js App Router 16.3.4, React 19.2.8, TypeScript, and Tailwind CSS v4, with Vitest and Playwright already installed.
- `app/page.tsx` owns the canonical `#RSVP` section and currently renders a placeholder prompt from `content/rsvp.ts`.
- `components/access/access-gate.tsx` currently gates the whole site behind a shared client-side secret word. Per-guest RSVP matching should be independent and limited to RSVP data; the current site gate remains unchanged in this feature.
- The deployment guide describes a static Vercel deployment with no runtime services or environment secrets. A custom data-backed flow therefore needs a server-capable deployment configuration and protected environment variables.
- The existing wedding spec explicitly excludes RSVP persistence and guest authentication, so this feature is a separate scope.

## Provider Comparison

| Criterion | Neon managed Postgres Free + custom UI | Supabase Postgres + custom UI | Airtable + custom UI | RSVPify |
| --- | --- | --- | --- | --- |
| Guest experience | Fully matches the existing site's design and exact rules | Fully matches the existing site's design and exact rules | Custom guest UI still required | Purpose-built guest and party RSVP interface; embed support is plan-dependent |
| Household and plus-one rules | Explicit relational constraints and transactional server validation | Explicit relational constraints and server validation | Custom app logic must enforce them | Built-in invite list and per-invitee additional guests |
| Email optional | Yes; email can be an optional RSVP field | Yes; email can be an optional RSVP field | Yes in the custom UI | Published Help Center says each RSVP requires an email |
| Open source / hosting | Managed Neon-hosted PostgreSQL; no self-hosting | Postgres and Supabase core are open source; managed Supabase or self-hosting | Proprietary managed SaaS | Proprietary hosted SaaS |
| Host setup | Neon account plus custom host login/import/review screen | Supabase account; integrated dashboard, but custom host workflows still needed | Familiar editing/import interface; custom app still required | Lowest custom implementation; host config still needed |
| Privacy/data control | Server-only database connection; application owns host and guest authorization | Strong data control and transactions; server-side authorization required | Data lives in Airtable; API token must remain server-side | Data and retention are governed by RSVPify terms and settings |
| Email integration | Optional existing SMTP or Resend from the Next.js server; extra account only if enabled | Optional provider such as existing SMTP or Resend | Automations/API integrations; plan quotas apply | Built-in invitations, reminders, and email suite; plan limits apply |
| Cost notes | $0 with no card up to 100 CU-hours/project, 0.5 GB storage, and 5 GB egress; compute suspends after 5 idle minutes and wakes on access. | Supabase Free is $0 but pauses after a week of inactivity and has no automatic backups; Pro currently starts at $25/month with daily backups. | Airtable Free currently lists 1,000 records/base and 1,000 API calls/month; Team currently starts at $20/editor/month billed annually with 50,000 records/base and 25,000 automation runs. | Current personal-event page lists Free (100 guests), Gold ($10/month or $72/year, up to 300 guests), and Platinum ($15/month or $108/year, up to 500 guests). Verify plan details before purchase. |
| Main tradeoff | Custom application and admin login are still needed; free quotas and cold-start delay apply; Neon does not provide host auth | Integrated database tooling; Free inactivity pause or paid plan if continuously active | Easiest roster editing, weaker transaction/control fit and usage limits | Easiest ready-made RSVP, but email requirement conflicts and customization/data portability are limited |

## Security and Operational Constraints

- Exact first/last matching after case and outer-whitespace normalization is a low-assurance invite check; a name can be guessed or shared.
- Reject duplicate normalized full names at import rather than allowing an arbitrary household to be selected.
- Rate-limit failed and repeated attempts using a durable shared limiter appropriate to the chosen provider; an in-memory limiter is not reliable across serverless instances.
- Use a generic error for all failed lookups; reveal no match suggestions, household count, guest email, or neighboring roster entries.
- Enforce household membership, current roster version, attendance enum, and plus-one permission on the server, even if controls are hidden in the UI.
- Keep Neon's `DATABASE_URL` on the server only. Do not expose it through a `NEXT_PUBLIC_*` variable or browser bundle. Use a least-privilege Postgres role; all guest and host authorization is enforced in the Next.js server routes, not in client code.
- Use a dedicated host login. Do not treat the public site-wide secret word as admin authorization.
- Export the final response roster and delete guest data after the hosts no longer need it; exact retention duration remains host-controlled.

## Source Notes

All product limits and prices below were checked on 2026-09-30 and may change.

- [Supabase Database overview](https://supabase.com/docs/guides/database/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase email with Resend example](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Neon pricing and Free plan limits](https://neon.com/pricing)
- [Neon serverless driver and transaction support](https://neon.com/docs/serverless/serverless-driver)
- [Neon Next.js integration](https://neon.com/docs/guides/nextjs)
- [Neon security overview](https://neon.com/docs/security/security-overview)
- [Airtable import documentation](https://support.airtable.com/docs/importing-third-party-data-into-airtable)
- [Airtable API limits](https://support.airtable.com/docs/managing-api-call-limits-in-airtable)
- [Airtable pricing](https://airtable.com/pricing)
- [RSVPify invitee lookup](https://help.rsvpify.com/en/articles/8652575-how-does-the-invite-list-match-my-invitees)
- [RSVPify privacy settings and email requirement](https://help.rsvpify.com/en/articles/5517672-how-can-i-enhance-the-privacy-and-security-of-my-invite-only-event)
- [RSVPify personal-event pricing](https://rsvpify.com/pricing/personal-events/)
- [Resend pricing](https://resend.com/pricing)
