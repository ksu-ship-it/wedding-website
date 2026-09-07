# Wedding Website

An image-led, single-page wedding invitation built with Next.js App Router, React, TypeScript, and Tailwind CSS.

## Development

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Verification

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run audit:images
npm.cmd run build
```

The browser suite covers canonical hashes, history, reduced motion, responsive navigation, gallery boundaries, touch swipe, and focus restoration.

## Content

Static wedding content lives in [content](content). Approved photography can replace the local placeholder assets under [public/images](public/images) while preserving the existing image metadata contracts.

## Deployment

See [docs/deployment.md](docs/deployment.md) for Vercel setup, production verification, release notes, and rollback steps.
