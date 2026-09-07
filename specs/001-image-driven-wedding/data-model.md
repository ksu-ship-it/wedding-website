# Data Model: Image-Driven Wedding Website

## WeddingEvent

- `coupleNames`: display name for the hero and metadata
- `eventDateTime`: authoritative countdown target
- `timeZone`: timezone used to interpret the event target
- `venueName`: ceremony or reception venue
- `locationLabel`: guest-facing location text
- `rsvpDeadline`: date by which guests should respond
- `rsvpActionLabel`: label for the response action

**Rules**: The event target and timezone are required. The completed-event state begins
when the target is reached. Display copy must remain readable when names or venue labels
wrap.

## StoryMoment

- `id`: stable content identifier
- `heading`: editorial heading
- `body`: narrative copy
- `imageId`: reference to a gallery or story image
- `imageSlot`: named aspect-ratio contract
- `alt`: meaningful image description
- `caption`: one concise sentence shown with the story image
- `order`: authored slideshow order

**Rules**: Story moments are presented as an ordered slideshow on the right side of the
story section at `md:` and larger. The story copy remains on the left at those widths and
stacks before the slideshow on smaller screens. Every moment must reference an approved
asset stored under `public/images/story/`.

## HeroImageComposition

- `imageId`: reference to the approved wide scenic hero asset
- `desktopSrc`: desktop delivery source
- `mobileSrc`: mobile delivery source or responsive source metadata
- `alt`: meaningful description of the scene and couple
- `overlayPosition`: authored placement of readable hero content
- `focalPoint`: optional focal point used to preserve the couple during responsive crops
- `width`: intrinsic desktop source width
- `height`: intrinsic desktop source height
- `blurDataURL`: low-resolution placeholder data

**Rules**: The hero uses one dominant scenic image from `public/images/hero/`. The
production asset must not use temporary placeholder naming and must reserve a stable
wide display area before loading.

## ScheduleEvent

- `id`: stable event identifier
- `title`: guest-facing event name
- `startLabel`: date or time display
- `location`: venue or meeting point
- `guidance`: concise guest instruction

**Rules**: Events retain their authored order and all four display fields are required.

## ImageAsset

- `id`: stable asset identifier
- `src`: default optimized image source
- `mobileSrc`: mobile-sized source or responsive source metadata
- `alt`: required accessible description
- `caption`: optional contextual label
- `width`: intrinsic source width
- `height`: intrinsic source height
- `blurDataURL`: placeholder data
- `slot`: `hero`, `storyPortrait`, `storyLandscape`, `galleryPortrait`,
  `galleryLandscape`, or `gallerySquare`
- `aspectRatio`: declared reserved display ratio
- `role`: `hero`, `story`, or `gallery`
- `status`: `approved` or `temporary`
- `sourcePath`: role-specific path under `public/images/hero/`, `public/images/story/`, or `public/images/gallery/`

**Rules**: Every rendered image has dimensions or a stable aspect ratio and a blur
placeholder. Mobile presentation uses one or two gallery columns only. Release assets
must have `status: approved`, a descriptive filename, and a `sourcePath` matching their
role. Filenames containing `placeholder`, `dummy`, or `sample` are temporary-only and
must fail the production image audit.

**Filename convention**: Use `<role>-<moment>-<descriptor>.<extension>` for the primary
asset and the same stem with `-mobile` for a mobile-specific source. Examples include
`hero-golden-hour-garden.webp`, `story-first-meeting.webp`,
`story-first-travel.webp`, and `gallery-dance-floor.webp`.

## TravelGuideItem

- `id`: stable item identifier
- `category`: arrival, accommodation, transport, or parking
- `title`: scannable heading
- `body`: practical guidance
- `link`: optional external map or booking link

## FAQItem

- `id`: stable item identifier
- `question`: visible question
- `answer`: accessible answer content
- `defaultOpen`: optional initial state

## NavigationItem

- `label`: visible navigation label
- `hash`: one of `#our-story`, `#schedule`, `#travel`, `#gallery`, `#FAQ`, `#RSVP`
- `order`: authored navigation order

## RSVPPrompt

- `deadline`: displayed response deadline
- `instructions`: response guidance
- `actionLabel`: next action label
- `destination`: response destination or form entry point
