# RSVP UI and Interaction Contract

**Scope**: Internal contract for the existing single-page guest experience and a protected host RSVP management surface. This is not a public third-party API.

## Guest Flow at `#RSVP`

1. The initial RSVP panel asks for first and last name. It does not preload, embed, or suggest roster names.
2. A guest submits both fields. The server trims outer whitespace, applies case-insensitive normalization, and requires one exact full-name match in the active roster.
3. On a unique match, the server establishes a short-lived, household-scoped invitation session and returns only that household's names, plus-one permissions, and current saved responses.
4. On any failed, ambiguous, inactive, or rate-limited match, show a generic recovery message. Do not disclose whether an invitee, another household member, or a prior response exists.
5. The party response form shows one attendance control per listed person. A guest with a granted plus-one receives one "Guest of [Name]" row with optional partner name and attendance; guests without an allowance see no add-person control.
6. Email is an optional contact field. It is never required to unlock the invitation or submit.
7. Submission is one action for the party. The server validates all roster IDs, permissions, current roster version, statuses, and optional email, then saves the party response consistently.
8. A confirmed state appears only after the server acknowledges a durable save. It summarizes each invited person's response and any plus-one. A guest can edit and resubmit before the published deadline.

## Internal Server Boundaries

### Guest lookup

- **Request**: `POST /api/rsvp/lookup` with `{ firstName, lastName }`.
- **Success**: `200` with the matched household's display-only response model and current saved attendance; establish an HTTP-only, same-site invitation-session cookie.
- **Invalid input**: `400` with field-level format errors.
- **No unique match / inactive roster / ambiguous record**: one generic `404` response with no match details.
- **Rate limited**: `429` with retry guidance that does not reveal whether a name is valid.
- **Security**: lookup executes on the server; request size is bounded; no client-supplied household ID can establish authority.

### Party submission

- **Request**: `POST /api/rsvp/submission` with attendance values keyed by roster invitee ID, optional plus-one response for granted invitees, and nullable `contactEmail`.
- **Success**: `200` with a summary of the saved party response and timestamp.
- **Invalid or unauthorized fields**: `400` for validation errors or `403` for a session/household mismatch; do not save partial responses.
- **Unavailable or failed save**: non-success response; retain form values and state clearly that the response was not confirmed.
- **Security**: the server derives the household from the session, rechecks active roster permissions, rejects extra IDs/plus-ones, validates same-site origin for mutation, and writes the whole response transactionally.

### Host roster and response management

- Admin actions require a dedicated host session established with a host passphrase stored as a server-only hash and a signed, secure, HTTP-only cookie. The public site secret word is not sufficient and must not be reused as the host credential.
- Host login attempts are rate-limited. Rotate the host passphrase by updating its deployed secret; invalidate existing sessions when the session-signing secret changes.
- CSV upload first creates a draft and returns row-numbered validation results. No invalid draft may be published.
- Publish is explicit and atomic. Existing responses remain tied to the roster version that authorized them.
- Response review and export are host-only and include invitee name, household, attendance, granted/used plus-one, optional contact email, roster version, and submission/update time.
- No unauthenticated endpoint can list guests, search suggestions, export responses, or inspect host import errors containing roster data.

## Accessibility and Responsive Behavior

- Use semantic form labels, field descriptions, grouped controls, visible focus, and announced validation/submission results.
- All interactive targets meet the constitution's 44x44 CSS-pixel minimum.
- Mobile-first layout stacks lookup, party members, plus-one detail, and confirmation in a single readable column; larger layouts may align fields in columns at `md:` and above.
- Respect reduced-motion preferences and preserve the existing `#RSVP` hash and browser-history behavior.
- Errors preserve entered form values. Loading and submitted states prevent accidental duplicate writes without blocking screen-reader feedback.
