# Deployment

## Target

The wedding site uses the Next.js App Router on Vercel. RSVP lookup, household submission, and host administration use dynamic server route handlers backed by Neon-managed PostgreSQL; this is not a static export. The database and application remain hosted services, with no locally operated database server.

**Production URL:** pending the first hosted deployment.

## Production verification

Run from the repository root:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run audit:images
npm.cmd run build
```

The release is ready only when all commands pass. Confirm the six canonical hashes (`#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, `#RSVP`) in the deployed URL and verify the hero/gallery image requests use the expected responsive sizes. Before using real guest data, run the host/guest journeys against a Neon development branch containing synthetic guests.

## Environment

Set these server-only variables in Vercel Project Settings for the matching environment; never prefix them with `NEXT_PUBLIC_`:

- `DATABASE_URL`: pooled Neon connection string for the environment's branch.
- `RSVP_ADMIN_PASSWORD_HASH`: hash of the separate host passphrase.
- `RSVP_SESSION_SECRET`: strong random signing secret shared by the guest and host session handlers.

Keep production values separate from Development and Preview. Never put real guest data in development or preview. `.env.example` contains blank names-only placeholders; do not commit `.env.local`, raw passphrases, connection strings, or exports.

## Release

1. Connect the repository to a Vercel project and retain the default Next.js install/build commands.
2. Create a Neon development branch, apply every numbered SQL migration in order, configure its pooled `DATABASE_URL`, and exercise the feature with the synthetic fixture.
3. Configure host and session secrets in Vercel. Verify host login, rejected invalid imports, publish, guest lookup, atomic submission/resubmission, optional email, and CSV export in Preview.
4. Create/choose the Neon production branch, apply the reviewed migrations in order, and set production-only Vercel variables before importing the real roster.
5. Preview on mobile and desktop, promote the deployment, record its URL, and verify canonical hashes and the host-only admin route.

## Rollback

Use Vercel deployment history to promote the previous known-good deployment. A code rollback does not roll back Neon data or schema. Keep migrations backward-compatible with the currently deployed app, and do not reverse/drop RSVP data as part of a Vercel rollback. After rollback, verify the home page, canonical hashes, RSVP lookup/submission, host access, and export. Keep the failed deployment available for diagnosis until the next release is confirmed.
