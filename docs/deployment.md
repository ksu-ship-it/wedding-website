# Deployment

## Target

The wedding site is a static Next.js App Router deployment. Vercel is the recommended first target because it supports the existing Next.js build without an adapter.

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

The release is ready only when all commands pass. Confirm the six canonical hashes (`#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, `#RSVP`) in the deployed URL and verify the hero/gallery image requests use the expected responsive sizes.

## Environment

No runtime secrets or external services are required for the current static release. Keep production configuration in the hosting provider, and do not commit `.env` files. `.env.example` is intentionally empty until a future RSVP provider is selected.

## Release

1. Connect the repository to a Vercel project.
2. Use the default Next.js build settings: install `npm install`, build `npm run build`, and output managed by Vercel.
3. Preview the deployment on mobile and desktop before promoting it.
4. Record the production URL in the release notes and verify canonical hashes after promotion.

## Rollback

Use the hosting provider's deployment history to promote the previous known-good deployment. After rollback, verify the home page, all canonical hashes, the RSVP anchor, and one gallery lightbox journey. Keep the failed deployment available for diagnosis until the next release is confirmed.
