import { NextResponse } from "next/server";

import {
  findHouseholdInvitees,
  saveHouseholdSubmission,
} from "@/lib/rsvp/repository";
import {
  readInvitationSessionCookie,
} from "@/lib/rsvp/session";
import {
  SubmissionValidationError,
  submitHouseholdResponse,
} from "@/lib/rsvp/submission-service";
import { isSameOriginRequest } from "@/lib/rsvp/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "This request could not be verified." }, { status: 403 });
  }

  const session = readInvitationSessionCookie(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ message: "Please reopen your invitation before submitting." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "The household response is invalid." }, { status: 400 });
  }

  try {
    const confirmation = await submitHouseholdResponse(session, payload, {
      findHouseholdInvitees,
      saveHouseholdSubmission,
    });

    return NextResponse.json({ confirmation });
  } catch (error) {
    if (error instanceof SubmissionValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Your response could not be saved. Please try again." },
      { status: 503 },
    );
  }
}