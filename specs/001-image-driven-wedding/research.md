# Research: Image-Driven Wedding Website

## Decision: App Router single-page composition

**Decision**: Use one `app/page.tsx` to render the continuous experience and semantic
sections with the six canonical IDs. Keep `app/layout.tsx` for fonts, metadata, and the
root accessibility shell.

**Rationale**: The feature is explicitly a single-page experience; one composition keeps
hash navigation, browser history, and section ordering predictable.

**Alternatives considered**: Separate routes per detail area were rejected because they
would violate the single-page requirement and interrupt the visual story.

## Decision: Mobile-first Tailwind layout

**Decision**: Write base classes for mobile block flow and `grid-cols-1`, then add only
`md:` and `lg:` modifiers for larger compositions. Enforce 44x44px minimum interactive
boxes.

**Rationale**: This directly satisfies the constitution and protects the primary guest
journey on small touch devices.

**Alternatives considered**: Desktop-first layouts with mobile overrides were rejected
because they create fragile cascade behavior and risk undersized mobile controls.

## Decision: Client-only countdown island

**Decision**: Isolate the live countdown behind a React client boundary. Render a stable
placeholder until `useEffect` confirms mounting, then calculate remaining time in the
browser and transition to a completed-event state at zero.

**Rationale**: Server and browser clocks differ, so server-rendering the live value could
cause hydration mismatch. A mounted client calculation avoids that mismatch while keeping
the rest of the page static.

**Alternatives considered**: Server-rendering a timestamp was rejected because it still
requires client reconciliation and can display stale values before hydration.

## Decision: Explicit image slot contracts

**Decision**: Every image record carries dimensions, blur placeholder data, responsive
source metadata, and a named aspect-ratio slot. The UI reserves that ratio before image
load and chooses mobile-sized sources for mobile viewports.

**Rationale**: Intrinsic dimensions and reserved aspect boxes prevent layout shift; source
selection avoids sending desktop-sized files over cellular connections.

**Alternatives considered**: Unconstrained background images and CSS-only image URLs were
rejected because they weaken accessibility, optimization, and CLS guarantees.

## Decision: Scenic hero image field with readable overlay

**Decision**: Treat the hero as one dominant wide scenic image composition rather than a
separate text column and adjacent image. Couple identity, date, location, countdown, and
the primary RSVP action sit in an authored overlay region with contrast protection and a
responsive focal point that keeps the couple visible.

**Rationale**: The landing view should communicate the emotional identity of the wedding
through one memorable photograph before guests begin reading supporting details.

**Alternatives considered**: A split hero with text beside the image was rejected because
it weakens the requested romantic scene and makes the first viewport feel like an
information layout instead of an invitation.

## Decision: Editorial copy plus captioned story slideshow

**Decision**: Keep `#our-story` as a two-region section at `md:` and larger: heading and
description on the left, with an image slideshow on the right. Each authored story moment
contains one image, one concise sentence caption, meaningful alt text, and stable slot
metadata. The regions stack in source order on mobile.

**Rationale**: This makes the couple's story image-led while preserving a clear editorial
reading order and enough image area for guests to inspect each milestone.

**Alternatives considered**: A text-heavy story list and a freeform masonry story were
rejected because they dilute the narrative sequence and make captions harder to associate
with their images.

## Decision: Approved role-specific image assets

**Decision**: Store release assets under `public/images/hero/`, `public/images/story/`, and
`public/images/gallery/`, with descriptive filenames that identify the subject or moment.
Temporary filenames such as `placeholder`, `dummy`, or `sample` are development-only and
must fail the release audit.

**Rationale**: Explicit role folders make content handoff predictable and prevent a
temporary scaffold asset from silently reaching production.

**Alternatives considered**: A shared undifferentiated image folder and filename-based
role inference were rejected because they make review, replacement, and responsive source
mapping ambiguous.

## Decision: Fixed viewport background with opaque content cards

**Decision**: Render the primary hero image as a fixed viewport background layer below the
scrollable page content. Keep page gaps and outer margins transparent, while every
structural section places its core content inside a solid, bounded theme card.

**Rationale**: This creates the requested parallax-like visual continuity without allowing
the background image to reduce text contrast or compete with details inside sections.

**Alternatives considered**: A background image on each section was rejected because it
breaks visual continuity; transparent sections were rejected because they reduce content
readability over photography.

## Decision: Observer-driven reveal and bounded hover motion

**Decision**: Use a shared Intersection Observer reveal wrapper for section headers,
captions, and detail groups. Motion enters with opacity and upward translation over 700ms
with ease-out timing. Hover scale/shadow effects remain inside pre-sized containers, and
reduced-motion or missing Observer support makes content immediately visible.

**Rationale**: This gives the page a quiet sense of arrival while preserving accessibility,
stable geometry, and progressive enhancement.

**Alternatives considered**: Always-on CSS animation was rejected because it ignores
viewport context and reduced-motion preferences; layout-affecting hover changes were
rejected because they can shift nearby content.

## Decision: Mobile overlay and touch lightbox

**Decision**: Use a client mobile menu overlay with focus containment, Escape dismissal,
and focus restoration. Use a full-screen lightbox with explicit controls plus touch swipe
thresholds and boundary clamping.

**Rationale**: The overlay keeps navigation discoverable without consuming mobile width;
touch gestures make image browsing natural while explicit controls preserve accessibility.

**Alternatives considered**: A sticky bottom nav was not selected for the initial release;
a hover-only gallery viewer was rejected for touch devices.

## Decision: Async Next.js inputs by policy

**Decision**: The initial page has no dynamic route segments and no search parameters. Any
future App Router page or layout receiving `params` or `searchParams` MUST type those
values as asynchronous inputs and await them before use.

**Rationale**: This keeps the plan compatible with current Next.js App Router conventions
and prevents synchronous access regressions if personalization or filtering is added.

**Alternatives considered**: Synchronous access was rejected because it conflicts with the
requested Next.js 15+ architectural safeguard.
