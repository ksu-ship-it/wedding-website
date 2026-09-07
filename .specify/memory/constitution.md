<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles: V. Stable, Optimized Imagery expanded for mobile delivery
- Added sections: VI. Mobile-First Design
- Removed sections: none
- Follow-up TODOs: none
-->

# Wedding Website Constitution

## Core Principles

### I. Next.js and React Foundation
The application MUST use Next.js 15 or newer with the App Router and React 19. New
routes, layouts, server interactions, and rendering behavior MUST follow the App Router
architecture. Dependencies or patterns that require an older Next.js or React major
version MUST NOT be introduced.

### II. Tailwind-First Styling
All layout, responsive behavior, spacing, typography, color, and fluid visual styling MUST
be implemented with Tailwind CSS v4.0. Custom CSS is permitted only for behavior that
Tailwind cannot express cleanly, and such usage MUST remain minimal and local to the
owning component.

### III. Single-Page Navigation
The wedding experience MUST behave as a single-page application with smooth hash
navigation. The canonical in-page destinations MUST include `#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, `#RSVP`.
Navigation changes MUST preserve browser back/forward behavior, support direct links to
each hash, and avoid full-page reloads for in-page movement.

### IV. Open-Source Simplicity
The project MUST prefer minimal, actively maintained open-source libraries. A new
dependency MUST have a clear user-facing or engineering benefit, an open-source
license compatible with the project, and no simpler built-in or existing-project
alternative. Proprietary services and unnecessary dependency layers MUST NOT be added.

### V. Stable, Optimized Imagery
All user-visible imagery MUST use Next.js `<Image />` unless a documented platform
constraint makes it impossible. Image implementations MUST provide intrinsic dimensions
or an equivalent stable aspect ratio and use blur placeholders where supported, so image
loading produces zero cumulative layout shift. Image sizes, formats, and responsive
variants MUST be appropriate to their rendered context, including fluid, dynamically
resized delivery for mobile viewports so guests are not sent unnecessarily large assets
over cellular connections.

### VI. Mobile-First Design
The project MUST follow these strict mobile-first laws:

- **Breakpoint ordering**: Every component MUST define its base layout and visual styles
	for mobile screens first. Larger layouts MUST be added with Tailwind responsive
	prefixes such as `md:` and `lg:`. Desktop-first styles MUST NOT be overridden
	downward for mobile.
- **Touch target minimums**: Every button, navigation link, and interactive accordion
	MUST provide a minimum 44x44 pixel touch target, including when its visible label or
	icon occupies less space.
- **Mobile image optimization**: Images MUST be fluid and served at a size appropriate
	to the mobile viewport. Implementations MUST use responsive image variants or an
	equivalent dynamic sizing strategy and MUST avoid sending a desktop-sized asset when
	a smaller mobile asset satisfies the rendered quality requirement.

## Technology and Performance Constraints

The implementation MUST preserve responsive behavior across mobile and desktop
viewports, maintain accessible semantic HTML and keyboard navigation, and avoid
introducing performance regressions that are observable in normal page use. Visual
effects MUST remain subordinate to content readability and interaction performance.

## Development Workflow

Every change MUST be checked against this constitution before review. Changes affecting
navigation MUST verify both canonical hashes and browser history behavior. Changes
affecting imagery MUST verify stable layout during loading. New dependencies MUST record
their purpose and license in the change description. Validation MUST include the
narrowest available lint, typecheck, test, or build command for the affected surface.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution supersedes conflicting project practices and guidance. Amendments
MUST state the affected principle, rationale, compatibility impact, and migration work
when applicable. The constitution version follows semantic versioning: MAJOR for
backward-incompatible governance changes or removals, MINOR for new or materially
expanded principles or sections, and PATCH for clarifications that do not change
requirements. Reviews MUST check compliance with every applicable principle, and any
exception MUST be documented with its scope, rationale, and approval.

**Version**: 1.1.0 | **Ratified**: 2026-09-06 | **Last Amended**: 2026-09-06
