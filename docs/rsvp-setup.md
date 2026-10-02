# RSVP Service Setup

## Services and Dependencies

The RSVP feature uses the existing Next.js application on Vercel and Neon-managed PostgreSQL. The hosts do not install or operate a database server. Use the Neon Free plan for development and the initial RSVP period; there is no charge while usage remains within its published Free limits.

- `@neondatabase/serverless` (MIT) connects Next.js server routes to Neon PostgreSQL over HTTPS.
- `csv-parse` (MIT) parses the host-uploaded UTF-8 guest-list CSV.
- The initial RSVP flow does not require an email-sending service. Guest email is optional contact data and successful submissions receive an on-page confirmation.

## Neon Projects and Branches

1. Create a Neon account and a PostgreSQL project on the Free plan. Select a region close to the Vercel deployment when practical.
2. Keep a development branch for synthetic guest data and a production branch for the real guest list. Do not put real guest names or addresses in development or preview environments.
3. Copy the pooled connection string for the intended branch from Neon Console's **Connect** dialog for the app's `DATABASE_URL`. Use a direct (non-pooled) connection for external migration tools; the documented SQL Editor workflow is also supported.
4. Keep the database connection string private to the Next.js server. Never place it in a `NEXT_PUBLIC_*` variable, static content, browser code, or source control.

Neon's Free plan currently includes 100 compute-hours per project per month, 0.5 GB storage per project, and 5 GB network transfer. Compute automatically suspends after five idle minutes and resumes when queried; the first request after a quiet period may take a few seconds. Reaching a Free limit can suspend service until the next period or a plan change. Check the [current Neon pricing and limits](https://neon.com/pricing) before launch because plan details can change.

## Environment Configuration

The repository's `.env.example` lists variable names only. Copy it to `.env.local` for development and set the values there. Configure separate values in Vercel **Project Settings > Environment Variables** for Development, Preview, and Production.

- `DATABASE_URL`: Neon connection string for the selected environment's branch.
- `DATABASE_URL_UNPOOLED`: direct connection string for migration tooling; keep it server-only and use `DATABASE_URL` for pooled app queries.
- `RSVP_ADMIN_PASSWORD_HASH`: host passphrase hash in the format implemented by `lib/rsvp/admin-auth.ts`. Do not use the public site's client-side secret word as the admin credential.
- `RSVP_SESSION_SECRET`: a strong, randomly generated server-only signing secret. Rotate it to invalidate existing host and guest sessions.

Rotate the host passphrase by replacing `RSVP_ADMIN_PASSWORD_HASH` in Vercel and redeploying. Rotate `RSVP_SESSION_SECRET` as well when you need to invalidate all active host and guest cookies.

Do not commit `.env.local`, real guest lists, credentials, connection strings, passphrases, or database exports. `.env.example` is the only environment file intended for source control, and its values must remain blank placeholders.

## Apply Database Migrations

Database schema files are maintained in `database/migrations/` and are applied to Neon; there is no local database server or Docker service to run.

1. Review the numbered migration files and confirm `.neon` is pinned to the intended development branch.
2. Set both Neon URLs in `.env.local` and run `node scripts/apply-rsvp-migrations.mjs`. The runner uses the direct URL, applies each file in a transaction, and records completed migration names so reruns skip them.
3. Verify the created schema and constraints before using that branch's pooled `DATABASE_URL` for app requests.
4. Test the migration and RSVP journey with synthetic data on the development branch.
5. Before launch, apply the reviewed migrations to the production branch and configure Vercel's Production environment with that branch's connection string and separate secrets.

Never use a production guest list for development or preview. If a migration fails, stop and resolve it on the development branch before applying anything to production. Neon's SQL Editor remains an alternative for reviewing or manually applying a migration when needed.

## CSV Guest List and Host Workflow

The host uploads a UTF-8 CSV through `/admin/rsvp`. The required header is `invitee_id,household_id,first_name,last_name,plus_one_allowed`; optional `household_label` is also supported. Permission values must be `true` or `false`. The application previews row-level validation results and only publishes a complete valid roster. Keep the original spreadsheet in the hosts' private storage, not in the repository. Upload the real guest list only after the production database, host authentication, environment variables, and response export have been verified with synthetic records.

## Email

Email is optional and is not part of guest identity. No mail-provider account or API key is needed for the initial release. Guests who omit email still submit and receive an on-page confirmation. Add a transactional email service only if the hosts later choose to send confirmations or reminders; keep any mail API key server-only.

## Post-Event Export, Backups, and Retention

1. Use the host-only response export to save a final CSV in private host storage before cleanup.
2. Retain guest names, RSVP choices, and optional email only for the period the hosts need for planning and follow-up.
3. After that period, confirm the export is readable, then remove RSVP data in the Neon SQL Editor on the intended branch by deleting submissions and guest-list versions (foreign keys cascade attendance, plus-one, invitee, household, and invitation-session rows). Also delete lookup-attempt windows. Verify the target branch before running destructive SQL.
4. Remove production credentials that are no longer needed and review Neon's current recovery/history behavior; deleting active rows may not immediately remove provider history.

Neon Free has limited recovery/history features and does not include scheduled backups. Keep the final host export separately and verify it before deleting active records.

## Local Checks

From the repository root, install the locked dependencies and run the site against the Neon development branch:

```powershell
npm.cmd ci
npm.cmd run dev
```

Run the verification suite before deploying:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```
