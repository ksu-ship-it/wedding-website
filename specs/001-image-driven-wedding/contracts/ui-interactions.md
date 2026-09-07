# UI Interaction Contract

## Canonical navigation

The page exposes exactly these in-page destinations:

`#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, `#RSVP`

A navigation activation updates the URL hash, preserves browser history, and scrolls to
the matching semantic section. Smooth scrolling is used unless reduced motion is enabled.

## Fixed background and section cards

- The primary hero image is a fixed viewport layer covering the screen behind the page
	content.
- The scrollable page content uses a higher stacking context than the fixed image.
- Page gaps, gutters, and outer margins remain transparent so the fixed image can bleed
	through between cards.
- Every structural section wraps its core content in a solid, opaque, crisply bounded card.
- The background image must never be visible through the interior of a card.
- The card wrapper reserves its dimensions before image or interactive content finishes
	loading.

## Section reveal and hover motion

- Headers, captions, and details layouts begin in a hidden visual state only when motion
	is available, then enter with opacity and upward translation over 700ms using an ease-out
	curve after intersection with the viewport.
- Without Intersection Observer support, content is immediately visible.
- With reduced motion enabled, content is immediately visible and translation/animated
	opacity are disabled.
- Pointer hover may apply restrained scale or shadow elevation to eligible media/detail
	elements, but the reserved layout box and neighboring geometry must remain unchanged.

## Scenic hero

- The landing section uses one dominant wide scenic romantic image rather than a separate
	image card beside the hero copy.
- Couple identity, event date, location, countdown, and the primary RSVP action remain
	readable over the image through authored contrast treatment.
- The hero image reserves its display field before loading and carries a focal point so
	responsive crops keep the couple visible.
- Mobile may use a taller crop, but the hero remains one image composition and must not
	push the primary information below the first useful viewport.

## Story slideshow

- `#our-story` uses editorial copy on the left and a large slideshow on the right at
	`md:` and larger.
- The story copy precedes the slideshow in source order; the regions stack on mobile.
- Each slide has one image, one concise sentence caption, meaningful alt text, and an
	authored order.
- Previous and next controls are at least 44x44px, keyboard reachable, and labeled with
	the current story context.
- Changing slides keeps the reserved image box stable and does not overlap or crop the
	caption.

## Mobile navigation overlay

- Trigger and each menu link provide at least a 44x44px touch target.
- The overlay opens from the mobile navigation trigger and contains every canonical link.
- Focus is contained while open; Escape and the close control dismiss it.
- Closing restores focus to the trigger.
- Selecting a link closes the overlay after the hash destination is activated.

## Responsive layout

- Hero, `#our-story`, and `#schedule`: `grid-cols-1` base; multi-column only at `md:`+
- Gallery: one column base; optional second column on mobile; richer composition at `md:`+
- No desktop-first class may require a downward mobile override.
- Reveal and hover effects never replace readable resting content or keyboard focus states.

## Gallery lightbox

- Opens full-screen from a gallery tile.
- Touch swipe past a defined threshold advances or returns one image.
- First and last boundaries clamp without invalid navigation.
- Close, previous, and next controls are at least 44x44px.
- Escape closes where keyboard input is available; focus returns to the originating tile.

## Production image assets

- Hero assets resolve under `public/images/hero/`.
- Story slideshow assets resolve under `public/images/story/`.
- Gallery assets resolve under `public/images/gallery/`.
- Production filenames are descriptive and approved; names containing `placeholder`,
	`dummy`, `sample`, or equivalent temporary terms are release failures.
- Use the filename convention `<role>-<moment>-<descriptor>.<extension>` with an optional
	`-mobile` variant, such as `hero-golden-hour-garden.webp` or `story-first-meeting.webp`.
- Every rendered asset has intrinsic dimensions or a stable ratio, blur data, meaningful
	alt text, role-specific source metadata, and a mobile-sized source or responsive source
	strategy.
