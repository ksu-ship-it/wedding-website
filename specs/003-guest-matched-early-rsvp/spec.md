# Feature Specification: Guest-Matched Early RSVP

**Feature Branch**: `003-guest-matched-early-rsvp`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Review the existing implementation and create an easy-to-use early RSVP system. Recommend RSVP tools and explain tradeoffs such as open-source options and email integration. Guests authenticate by matching first and last name against an uploaded guest list, then RSVP for their household or party. Show plus-one controls only when granted, and make email optional."

## User Scenarios & Testing

### User Story 1 - Find and Open an Invitation (Priority: P1)

As an invited guest, I want to enter my first and last name and see only the invitation associated with my exact guest-list match, so that I can reach the right household RSVP without creating an account.

**Why this priority**: Guest-specific access is the foundation for protecting the roster and enforcing each invitation's party size.

**Independent Test**: Submit a valid guest name and verify that the matched household appears; submit an unknown name and verify that no invitation or roster details are revealed.

**Acceptance Scenarios**:

1. **Given** a published guest list contains one exact first-and-last-name match, **When** the guest submits their name, **Then** the system opens the matching invitation and shows only its household or party.
2. **Given** the submitted name does not match a published invitee, **When** the guest submits it, **Then** the system shows a generic no-match message without disclosing whether another guest or household exists.
3. **Given** an invitation has already been opened, **When** the guest returns before the response deadline and matches again, **Then** the current saved household responses are shown for review or update.

### User Story 2 - Respond for a Household (Priority: P1)

As an invited guest, I want to submit a response for each person in my household or party at once, so that I can give the hosts a complete and accurate early headcount.

**Why this priority**: The central outcome is one low-friction response that covers the whole invited party.

**Independent Test**: Open a household invitation, set responses for multiple members, submit once, and verify all responses are saved together and shown on confirmation.

**Acceptance Scenarios**:

1. **Given** a guest is matched, **When** the invitation opens, **Then** it lists all invitees assigned to that household or party and allows an attendance response for each person.
2. **Given** the guest has completed responses for their party, **When** they submit once, **Then** all responses are saved as one complete submission and a confirmation summarizes the party's choices.
3. **Given** a household member's attendance is unknown, **When** the guest reviews the form, **Then** the guest can select an undecided response or return later without accidentally submitting a response for that member.

### User Story 3 - Use Only Granted Plus-One Options (Priority: P1)

As an invited guest, I want the form to reflect the plus-one allowance on my invitation, so that I can add a partner only when the hosts have granted that option.

**Why this priority**: Per-invite limits must be honored to keep the submitted headcount aligned with the hosts' guest list.

**Independent Test**: Compare invitations with and without plus-one permission and verify only the permitted invitation presents a named plus-one slot.

**Acceptance Scenarios**:

1. **Given** a matched invitee has a plus-one allowance, **When** the invitation is displayed, **Then** it shows one slot labeled "Guest of [Name]" and allows an optional partner name.
2. **Given** a matched invitee has no plus-one allowance, **When** the invitation is displayed and submitted, **Then** no control or path permits adding an extra person.
3. **Given** a plus-one is granted but no partner name is entered, **When** the party response is submitted, **Then** the allowed guest slot remains identifiable without requiring a name.

### User Story 4 - Maintain the Guest List and Review Replies (Priority: P2)

As a host, I want to load and review a guest list with household groupings and per-person plus-one permissions, then review the submitted replies, so that I can manage invitations without editing application code.

**Why this priority**: Accurate invitation rules and practical response access are necessary for operating the system, though guests can demonstrate the core flow against a prepared list first.

**Independent Test**: Import a valid sample list, correct a rejected row from the preview, publish it, and verify that submitted replies can be reviewed and exported by the host.

**Acceptance Scenarios**:

1. **Given** a host uploads a supported guest-list file, **When** the system validates it, **Then** it previews accepted and rejected rows and prevents a partial publish when required data is invalid.
2. **Given** the uploaded list contains household identifiers and plus-one permissions, **When** it is published, **Then** each invitee is linked to the correct household and permission.
3. **Given** guests have submitted replies, **When** the host opens the response view, **Then** the host can review attendance, plus-one names, optional email addresses, and submission time, and export the responses in a usable tabular format.

### User Story 5 - Share an Optional Email (Priority: P2)

As an invited guest, I want to optionally provide an email address with my response, so that the hosts can contact me about the reply without making email a barrier to responding.

**Why this priority**: Email helps with follow-up and tool integrations, but guest-list matching must work without collecting it.

**Independent Test**: Submit a response once without email and once with a valid email; verify both succeed and only the supplied address is saved.

**Acceptance Scenarios**:

1. **Given** a guest leaves the email field blank, **When** they submit a valid party response, **Then** the RSVP is accepted without asking for an address.
2. **Given** a guest supplies an email address, **When** they submit, **Then** the address is validated and stored with the response for host follow-up.
3. **Given** a guest enters an invalid email address, **When** they submit, **Then** the form explains the field error and preserves their other answers.

### Edge Cases

- Two invitees have the same exact first and last name; the host must resolve the collision before publishing the guest list, and ambiguous rows must not open an arbitrary household.
- Names contain accents, apostrophes, hyphens, or extra whitespace; matching must preserve the entered spelling while applying consistent outer-whitespace and case normalization.
- The upload is empty, malformed, has duplicate identifiers, references a missing household, or grants an invalid plus-one count; it must be rejected with actionable row-level feedback.
- A guest has no household members other than themself, or their household includes children.
- A guest changes an answer or submits again; the latest valid party response replaces the earlier response without creating duplicate active records.
- A host edits or republishes a guest list after responses have been recorded; existing responses remain attributable and are not silently reassigned.
- The guest loses network connectivity during submission; the interface must distinguish an unconfirmed save from a confirmed response and must not report success prematurely.
- Repeated guesses attempt to discover names or enumerate invitees; the system limits attempts and does not reveal roster or household data.
- A guest enters a long or non-Latin name, or uses assistive technology or a mobile viewport; the form remains operable and readable.
- A guest has a granted plus-one but no name yet; the response can be submitted without fabricating a party member name.

## Requirements

### Functional Requirements

- **FR-001**: The RSVP flow MUST be reachable from the existing `#RSVP` destination and MUST preserve the site's single-page navigation behavior.
- **FR-002**: Hosts MUST be able to load a guest list containing a stable invitee identity, first name, last name, household or party grouping, and per-invitee plus-one permission.
- **FR-003**: Before publishing a guest list, the system MUST validate required fields, group references, duplicate identities or ambiguous exact names, and plus-one permissions, and MUST show row-level corrections without partially publishing invalid data.
- **FR-004**: The guest MUST enter first and last name; the system MUST match the complete name against the published guest list after trimming outer whitespace and applying case-insensitive comparison, without fuzzy or partial matching.
- **FR-005**: The system MUST reveal household, invitation, or RSVP data only after a unique guest match, and MUST use a generic failure response that does not confirm other guest or household data.
- **FR-006**: The system MUST show every person assigned to the matched household or party and collect an independent attendance response for each person.
- **FR-007**: The guest MUST be able to submit the household or party responses in one action, and the system MUST save the submission consistently so a partial save is not presented as success.
- **FR-008**: The system MUST permit a guest to review and update their party's response before the RSVP deadline without creating duplicate active responses.
- **FR-009**: The system MUST show a plus-one slot only for the invitee(s) granted that permission, MUST cap each slot at one additional person, and MUST allow a partner name to be left blank.
- **FR-010**: The system MUST NOT permit a guest without plus-one permission to add another person through the interface or submission request.
- **FR-011**: The guest MAY provide an email address; it MUST NOT be required for identity matching or RSVP submission and MUST be validated only when provided.
- **FR-012**: The system MUST confirm successful submission and summarize the saved party responses; it MUST NOT show success before the responses are durably accepted.
- **FR-013**: Hosts MUST be able to review and export submitted attendance, plus-one names, optional email addresses, and submission timestamps.
- **FR-014**: The system MUST protect guest-list and RSVP data from public client-side delivery and MUST limit repeated name-match attempts to reduce enumeration.
- **FR-015**: RSVP controls MUST be keyboard accessible, labeled for assistive technology, mobile usable, and provide clear validation and submission states.
- **FR-016**: The planning deliverables MUST compare suitable implementation tools against ease of setup, open-source/self-hosting, guest-list privacy, household and plus-one support, email integration, and ongoing cost, then identify a recommended default and the tradeoffs that remain for the hosts to choose.

### Key Entities

- **Invitee**: A person named on the guest list, with a stable identity, first and last name, household membership, and plus-one permission.
- **Household / Party**: A host-defined group of invitees whose responses are presented together.
- **Invitation**: The guest-specific envelope unlocked by a unique exact name match, including the authorized party and per-person response limits.
- **Plus-One Slot**: One additional person allowance attached to an invitee, with an optional partner name and attendance response.
- **RSVP Submission**: The latest set of attendance choices for an invitation, optional contact email, and submission time.
- **Guest-List Import**: A host-supplied roster with validation results and a published version used for name matching.

## Success Criteria

### Measurable Outcomes

- **SC-001**: At least 90% of test guests can locate their invitation and submit a complete party response in under two minutes without host assistance.
- **SC-002**: 100% of test invitations reveal only the uniquely matched household and never expose other guest-list entries.
- **SC-003**: 100% of test submissions enforce the uploaded household membership and granted plus-one limit, including attempts to alter the submission outside the visible controls.
- **SC-004**: A host can import, correct, and publish a representative guest list and export its responses without editing application code.
- **SC-005**: Email-free and email-provided RSVP submissions both complete successfully when all other required information is valid.
- **SC-006**: In the supported mobile and desktop browser checks, all core RSVP tasks complete without horizontal overflow, lost answers, or inaccessible controls.
- **SC-007**: Repeated invalid name attempts do not reveal whether a specific invitee or household exists.
- **SC-008**: A guest who resubmits a changed answer sees one current response per invited party member, not duplicate active submissions.

## Assumptions

- The early RSVP covers one wedding event and collects attending, unable-to-attend, or undecided status per invited person; meal selection and multi-event schedules are out of scope unless later requested.
- Hosts will provide a guest list and explicitly assign household membership and plus-one permission before invitations are published.
- Exact matching ignores letter case and outer whitespace only; it does not use aliases, partial matching, phonetic matching, or fuzzy search.
- Duplicate exact first-and-last-name pairs must be resolved by the host before publishing; name-only matching is not strong identity proof, so attempt limits and minimal error disclosure are required, and the hosts accept this residual risk for the invitation use case.
- The optional email is collected for host follow-up and may support a confirmation email if the selected tool supports it; guests without email still receive an on-page confirmation.
- The current site-wide shared secret-word gate remains unchanged; guest-name matching protects the RSVP invitation data, not the rest of the website.
- Hosts need a simple import and response-review/export workflow; a full general-purpose invitation-design or campaign platform is not required.
- Neon managed PostgreSQL Free is the selected storage provider: it is hosted and operated by Neon, not self-hosted by the couple. The implementation must remain within the published free quotas; a paid plan is not assumed.
- Guest-list data and RSVP responses are private event data and are retained only as long as the hosts need them for wedding planning and follow-up.
