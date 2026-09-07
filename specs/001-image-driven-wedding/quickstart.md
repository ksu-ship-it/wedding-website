# Quickstart: Image-Driven Wedding Website

## Prerequisites

- Node.js version supported by the selected Next.js 15 release
- npm, pnpm, or yarn
- Approved wedding copy and image assets with alt text, dimensions, blur data, and
   descriptive filenames
- Asset folders populated by role: `public/images/hero/`, `public/images/story/`, and
   `public/images/gallery/`

## Setup

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Manual validation

1. Load the page at a mobile viewport and confirm the hero is readable, the navigation
   trigger and every interactive control are at least 44x44px, the scenic hero crop keeps
   the couple visible, and no horizontal scroll appears.
2. Open the mobile menu, verify focus containment, Escape dismissal, focus restoration,
   and navigation to each canonical hash.
3. Check `#our-story`, `#schedule`, and the hero remain one column below the `md:` width.
4. Check `#our-story` places copy before the slideshow on mobile and places copy left of
   the large slideshow on desktop; verify each story frame keeps its caption visible.
5. Check `#gallery` uses one or two vertical columns on mobile and does not create
   micro-images.
6. Open a gallery tile, swipe in both directions on a touch-capable device, verify first
   and last image boundaries, then close the lightbox.
7. Confirm the countdown shows a stable placeholder before mount, updates after mount,
   and displays the completed state after the target time.
8. Navigate through `#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, and `#RSVP`
   and verify browser back/forward behavior without a full-page reload.
9. Confirm all rendered production image paths resolve to their role-specific folders and
   no production path contains `placeholder`, `dummy`, or `sample`.
10. Scroll through every canonical section and confirm the fixed hero image remains behind
   transparent gaps while every section's core content is inside an opaque bounded card.
11. Confirm section headers, captions, and details use fade-and-slide-up entry motion only
   when motion is allowed; verify reduced-motion mode shows content immediately.
12. Hover eligible media/detail elements on desktop and confirm scale/shadow changes do
   not alter their bounding boxes or introduce horizontal overflow.

## Automated validation

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run audit:images
npm run build
```

The responsive browser suite must cover mobile and desktop viewports, reduced motion,
keyboard navigation, direct canonical hashes, image loading stability, and touch lightbox
navigation. The build must fail if a future dynamic page or layout reads `params` or
`searchParams` without awaiting them.
