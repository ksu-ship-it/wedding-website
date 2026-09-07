# SPEC-001 Implementation Checklist

Each task is a small, reviewable micro-commit. Complete tasks in order; keep each commit focused on one milestone and run the narrowest relevant validation before proceeding.

## Phase 1: Foundation

- [X] **M01** Initialize Next.js 15+ App Router project with React 19, TypeScript, Tailwind CSS v4, linting, and test scripts. Commit: `chore: initialize wedding app foundation`
- [X] **M02** Add root layout, metadata, editorial serif and clean sans-serif font loading, and accessible page shell. Commit: `feat: establish wedding page shell`
- [X] **M03** Add typed static content models and placeholder content files for event, navigation, schedule, travel, FAQ, RSVP, story, and gallery data. Commit: `feat: add wedding content contracts`

## Phase 2: Navigation and Layout

- [X] **M04** Build canonical section composition in `app/page.tsx` with `#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, and `#RSVP`. Commit: `feat: compose canonical wedding sections`
- [X] **M05** Implement mobile-first navigation with 44x44px controls, slide-out overlay, focus containment, Escape dismissal, focus restoration, and hash history. Commit: `feat: add mobile navigation overlay`
- [X] **M06** Add base mobile `grid-cols-1` layouts for hero, story, and schedule; add only `md:` and `lg:` scale-up modifiers. Commit: `feat: enforce mobile-first section layouts`
- [X] **M07** Add shared section primitives, editorial typography, responsive spacing, visible focus states, and reduced-motion behavior. Commit: `style: add accessible editorial system`

## Phase 3: Hero and Event Details

- [X] **M08** Implement hero content as one scenic romantic image field with readable overlay content, explicit slot ratio, intrinsic dimensions, blur placeholder, and mobile-sized source metadata. Commit: `feat: add optimized wedding hero`
- [X] **M09** Implement mounted client-only countdown with pure time calculation, zero-state transition, stable placeholder, and no server clock rendering. Commit: `feat: add hydration-safe countdown`
- [X] **M10** Implement image-led story content with left editorial copy and a right captioned slideshow, plus schedule cards, travel guide, FAQ disclosure, and RSVP anchor content. Commit: `feat: add wedding details sections`

## Phase 4: Image Experience

- [X] **M11** Add image slot metadata and responsive image helper enforcing dimensions, blur data, aspect ratios, and mobile delivery. Commit: `feat: add zero-cls image contracts`
- [X] **M12** Build mobile gallery with one-column base and optional two-column mobile layout, expanding at `md:` without micro-images. Commit: `feat: add responsive masonry gallery`
- [X] **M13** Add full-screen lightbox with 44x44px controls, keyboard handling, focus restoration, boundary clamping, and natural touch swipe gestures. Commit: `feat: add touch-friendly gallery lightbox`

## Phase 5: Verification and Deployment

- [X] **M14** Add unit/component tests for countdown states, canonical navigation, focus behavior, image slot validation, lightbox boundaries, etc. Commit: `test: cover wedding interactions`
- [X] **M15** Add responsive end-to-end tests for mobile and desktop layouts, direct hashes, browser history, reduced motion, touch swipe, and no horizontal overflow. Commit: `test: verify responsive guest journeys`
- [X] **M16** Run lint, typecheck, tests, build, and production image audit; fix any CLS, hydration, accessibility, or mobile data regressions. Commit: `chore: harden wedding release`
- [X] **M17** Configure deployment environment, verify production canonical hashes and image sizing, and document the release URL and rollback procedure. Commit: `docs: document wedding deployment`

## Phase 6: Approved Image Content Handoff

- [X] **M18** Replace temporary hero artwork with the supplied `202309 - 4x6.jpg` using the Option 1 fill layout (`object-cover object-center`) in `public/images/hero/`, including responsive frame ratios, alt text, intrinsic dimensions, and blur data. Commit: `content: add approved hero photography`
- [X] **M19** Replace temporary story artwork with ordered approved story images in `public/images/story/`, adding one-sentence captions for college visits, first home, graduation, and traveling the world. Commit: `content: add approved story photography`
- [X] **M20** Replace temporary gallery artwork with approved images in `public/images/gallery/`, preserving varied slot ratios, captions, alt text, and mobile-sized delivery metadata. Commit: `content: add approved gallery photography`
- [X] **M21** Enforce the production image-content audit so missing files, temporary filenames, incorrect role folders, missing captions, and incomplete metadata fail release validation. Commit: `chore: enforce production image readiness`

## Phase 7: Advanced Visual System

- [X] **M22** Update `app/layout.tsx`, `app/page.tsx`, and the hero composition to render the primary image as a fixed `inset-0` viewport layer, place all scroll content above it, and keep page gaps transparent. Depends on M18. Commit: `feat: add fixed hero background layer`
- [X] **M23** Update `components/ui/section.tsx`, the hero event-details wrapper, and each canonical section composition so `#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, and `#RSVP` use opaque theme card interiors with reserved dimensions and transparent outer margins. Depends on M22. Commit: `feat: add opaque section cards`
- [X] **M24** Add `motion/reveal.tsx` and apply it to section headers, captions, and detail groups; implement Intersection Observer entry states using `opacity-100 translate-y-0 duration-700 ease-out`, bounded hover scale/shadow states, observer fallbacks, and reduced-motion behavior. Depends on M23. Commit: `feat: add scroll reveal motion system`
- [X] **M25** Extend `tests/e2e/` and component tests to verify fixed background layering, opaque card interiors, transparent gaps, observer fallback, reduced motion, hover bounding-box stability, no horizontal overflow, and no layout shift. Depends on M22-M24. Commit: `test: verify advanced visual system`

## Definition Of Done

- [ ] All canonical hashes work without full-page reloads.
- [ ] Base mobile styles precede `md:`/`lg:` expansion in every responsive component.
- [ ] All buttons, nav links, accordions, and lightbox controls meet 44x44px minimums.
- [ ] Hero, story, and schedule are single-column below `md:`; gallery is one or two columns on mobile.
- [ ] Every image slot has explicit dimensions/aspect ratio, blur placeholder, and mobile-sized delivery.
- [ ] The hero uses one approved wide scenic romantic image with readable overlay content.
- [ ] Our story uses left editorial copy and a right captioned slideshow on desktop, stacked on mobile.
- [ ] All release image files are approved, descriptive, role-specific, and free of temporary placeholder naming.
- [ ] The image-content audit fails missing, mislocated, temporary, or metadata-incomplete assets.
- [X] The hero background is fixed to the viewport and remains visible through transparent page gaps.
- [X] Every structural section has an opaque card interior that blocks background bleed.
- [X] Reveal and hover motion preserve layout geometry and respect reduced-motion preferences.
- [ ] Countdown is mounted client-side with no hydration clock mismatch.
- [ ] Lightbox swipe, keyboard, close, focus restoration, and boundary behavior pass.
- [ ] Lint, typecheck, tests, build, and responsive end-to-end checks pass.
