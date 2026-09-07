# Implementation Plan: Image-Driven Wedding Website

**Branch**: `001-image-driven-wedding` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-image-driven-wedding/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Build a single-page wedding invitation experience that leads with photography, a
fixed full-viewport scenic background, opaque sectional content cards, a split editorial
story with a captioned image slideshow, event schedule cards, travel and FAQ guidance, a
constrained mobile gallery, and an anchored RSVP action. The implementation will use
Next.js App Router with React 19, Tailwind CSS v4, static typed content, and small client
islands only for the live countdown, mobile overlay navigation, and touch-enabled
lightbox. The base layout is mobile-first; `md:` and `lg:` modifiers add larger-screen
composition.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x with React 19

**Primary Dependencies**: Next.js 15+, Tailwind CSS v4.0, Next Image, and minimal
open-source browser-test tooling selected during setup

**Storage**: Static typed content and local image metadata; RSVP persistence is out of scope

**Testing**: Playwright responsive browser checks plus focused TypeScript tests for
countdown state and navigation state transitions

**Target Platform**: Current mobile and desktop browsers served by a Next.js web deployment

**Project Type**: Single-page web application

**Performance Goals**: Zero visible layout shift from image loading, story frame changes,
motion entry, or hover states; no full-page reload for canonical hash navigation; usable
interaction at mobile network conditions; 60 fps target for overlay, slideshow, reveal, and
lightbox transitions on representative devices; no temporary image filenames in a release build

**Constraints**: Mobile-first base classes only; `md:`/`lg:` scale upward; 44x44px minimum
touch targets; one or two gallery columns on mobile; all fluid image slots have explicit
aspect ratios; countdown client-only after mount; fixed hero background with viewport
coverage; scrollable content above the background; opaque card wrappers for every structural
section; Intersection Observer reveal motion; reduced-motion fallback; future dynamic
`params` and `searchParams` are awaited asynchronously; no unnecessary proprietary dependencies

**Scale/Scope**: One route and one continuous page with six canonical hash destinations,
five interactive client islands plus a shared reveal utility, an approved hero composition,
an ordered story slideshow, a curated gallery, opaque section cards, and static event information

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Next.js and React Foundation**: PASS. The plan targets Next.js 15+ App Router and
  React 19.
- **II. Tailwind-First Styling**: PASS. All layout and visual styling starts in Tailwind
  v4 utility classes; custom CSS is limited to irreducible lightbox or motion behavior.
- **III. Single-Page Navigation**: PASS. One App Router page owns the six canonical IDs;
  hash updates use in-page navigation and preserve browser history.
- **IV. Open-Source Simplicity**: PASS. Dependencies are limited to the framework,
  Tailwind, and focused open-source validation tools.
- **V. Stable, Optimized Imagery**: PASS. Every image slot has an explicit aspect-ratio
  contract, intrinsic dimensions, blur placeholder strategy, and mobile-sized variants.
- **VI. Mobile-First Design**: PASS. Base classes target mobile, `md:`/`lg:` scale up,
  controls are at least 44x44px, mobile navigation is an overlay, and gallery columns are
  limited to one or two.
- **Fixed background and cards**: PASS. The fixed background is isolated below the page
  content, while structural sections use opaque card interiors and transparent outer gaps.
- **Motion accessibility**: PASS. Reveal and hover motion are bounded, observer-enhanced,
  and disabled or made immediate for reduced-motion users and unsupported browsers.
- **Next.js async inputs**: PASS. No dynamic route is required; any future `params` or
  `searchParams` in pages/layouts MUST be typed and awaited as asynchronous inputs.
- **Hydration safety**: PASS. The live countdown is isolated behind a client boundary and
  starts only after mount, preventing server/client clock mismatch.

## Project Structure

### Documentation (this feature)

```text
specs/001-image-driven-wedding/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── ../../tasks.md       # Root sequential implementation checklist
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── layout.tsx                  # Fonts, metadata, root accessibility shell
├── page.tsx                    # One-page composition and canonical section order
├── globals.css                 # Tailwind entry and irreducible global rules only
└── not-found.tsx               # Minimal fallback for accidental non-canonical paths

components/
├── navigation/
│   ├── site-navigation.tsx     # Desktop links and mobile trigger
│   └── mobile-menu.tsx         # Client overlay, focus trap, escape handling
├── hero/
│   ├── wedding-hero.tsx
│   └── countdown-timer.tsx      # Client-only mounted clock
├── story/
│   ├── our-story.tsx             # Left editorial copy and right image region
│   └── story-slideshow.tsx       # Captioned story moment client island
├── schedule/event-schedule.tsx
├── travel/travel-guide.tsx
├── gallery/
│   ├── masonry-gallery.tsx
│   ├── gallery-tile.tsx
│   └── image-lightbox.tsx       # Client touch-swipe interaction
├── faq/faq-list.tsx
├── rsvp/rsvp-section.tsx
└── ui/                          # Shared 44x44px controls and section primitives

motion/
└── reveal.tsx                    # Intersection Observer reveal wrapper and fallback

content/
├── wedding-event.ts
├── images.ts                    # Hero and story image records
├── story.ts                     # Ordered story slideshow moments
├── schedule.ts
├── gallery.ts
├── travel.ts
├── faq.ts
└── navigation.ts

lib/
├── image-slots.ts               # Aspect-ratio and responsive image contracts
├── image-audit.ts               # Production filename/status/path validation
├── navigation.ts                # Canonical IDs and hash behavior
└── countdown.ts                 # Pure time calculations and completed state

public/images/
├── hero/
├── story/
└── gallery/

tests/
├── unit/
├── component/
└── e2e/
```

**Structure Decision**: Use a single Next.js App Router project with page composition in
`app/page.tsx`, typed static content in `content/`, pure shared rules in `lib/`, and
interactive client islands isolated under `components/`. The page has no dynamic route
segments. Any future page or layout that receives `params` or `searchParams` MUST model
them as Promises and await them before use.

**Mobile-first layout contract**:

- Every component starts with the mobile block flow and `grid-cols-1` where a grid is
  needed; only `md:` and `lg:` add columns, spacing, and larger type.
- A fixed hero background covers the viewport behind the page content. Page gaps, gutters,
  and outer margins remain transparent so the image can bleed through between cards.
- Every structural section places its core content in an opaque, crisply bounded card; the
  background image must never show through a card interior.
- Hero, `#our-story`, and `#schedule` remain one column below `md:`.
- The hero uses one dominant scenic image with a reserved wide field and readable overlay
  content; the couple must remain inside the authored focal area at mobile and desktop sizes.
- `#our-story` uses a `grid-cols-1` base. At `md:` and larger, editorial copy remains on the
  left and the large captioned story slideshow occupies the right.
- Story slideshow frame changes preserve the reserved image box and keep the one-sentence
  caption visible with accessible previous/next controls.
- The mobile menu is a slide-out overlay with a 44x44px trigger, 44x44px links, focus
  containment, Escape dismissal, and focus restoration.
- The gallery uses one column by default and may use two mobile columns only when tile
  readability is preserved; larger compositions begin at `md:`.
- Section headers, captions, and detail groups use Intersection Observer reveal states with
  a visible fallback when JavaScript or observer support is unavailable. Reduced motion
  disables translation and animated opacity.
- Hover transforms and shadow elevation apply only inside reserved containers and cannot
  change layout dimensions or introduce horizontal overflow.

**Image slot contract**:

| Slot | Mobile ratio | Desktop ratio | Loading contract |
|---|---:|---:|---|
| Hero image | 4:5 crop | 21:9 scenic field | Reserved wide field, intrinsic dimensions, blur placeholder, focal point |
| Story portrait | 4:5 | 3:4 | Reserved aspect box, intrinsic dimensions, blur placeholder |
| Story landscape | 4:3 | 3:2 | Reserved aspect box, intrinsic dimensions, blur placeholder |
| Gallery portrait | 4:5 | 2:3 | Reserved tile ratio, mobile-sized source |
| Gallery landscape | 4:3 | 3:2 | Reserved tile ratio, mobile-sized source |
| Gallery square | 1:1 | 1:1 | Reserved tile ratio, mobile-sized source |

The image data contract MUST carry `src`, `alt`, `width`, `height`, `blurDataURL`,
`mobileSrc` or responsive source metadata, declared role and source path, approval status,
and the declared slot ratio. Story and gallery records MUST also carry a caption when
displayed as contextual image content. No fluid image may render without one of these
stable dimensions or ratios. Release validation MUST reject temporary filenames and
missing role-specific assets.

## Generated Design Artifacts

- [research.md](./research.md): architecture, hydration, imagery, and interaction decisions
- [data-model.md](./data-model.md): typed content entities and validation rules
- [contracts/ui-interactions.md](./contracts/ui-interactions.md): navigation, responsive,
  and lightbox behavior contracts
- [quickstart.md](./quickstart.md): manual and automated validation scenarios
- [../../tasks.md](../../tasks.md): repository-root sequential micro-commit checklist

## Post-Design Constitution Check

- **Next.js and React**: PASS. The page structure and future async input policy match
  Next.js 15+ App Router and React 19.
- **Tailwind and mobile-first**: PASS. Base mobile layout, `grid-cols-1`, `md:`/`lg:`
  expansion, 44x44px controls, and the mobile overlay are specified.
- **SPA navigation**: PASS. The UI contract fixes all six canonical hashes and history
  behavior.
- **Imagery and performance**: PASS. All listed image slots have explicit ratios,
  dimensions, blur placeholders, and mobile source requirements.
- **Hydration**: PASS. The countdown is the only clock-dependent client island and starts
  after mount.
- **Open-source simplicity**: PASS. No unnecessary library or service is required by the
  design; touch behavior is a focused local interaction.
- **Fixed background and cards**: PASS. The background layer, transparent margins, and
  opaque card boundaries are included in the interaction and responsive contracts.
- **Motion accessibility**: PASS. Intersection Observer reveal behavior, hover geometry,
  reduced motion, and stable dimensions are documented for implementation and testing.

## Complexity Tracking

No constitution violations. Client islands are limited to interactions that require live
time, touch gestures, or focus management; the rest remains server-rendered and static.
