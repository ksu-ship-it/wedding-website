import { expect, test } from "@playwright/test";

const household = {
  householdId: "h1",
  members: [
    { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
    { id: "a2", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
  ],
};

async function openInvitation(page: import("@playwright/test").Page) {
  await page.goto("/#RSVP");
  await page.getByRole("textbox", { name: "Secret word" }).pressSequentially("lenny");
  await page.getByRole("button", { name: "Enter" }).click();
  await page.getByLabel("First name").fill("Alicia");
  await page.getByLabel("Last name").fill("Anderson");
  await page.getByRole("button", { name: /find my invitation/i }).click();
}

test.describe("granted plus-one RSVP", () => {
  test("submits an unnamed guest only for the granted invitee", async ({ page }) => {
    await page.route("**/api/rsvp/lookup", (route) => route.fulfill({
      json: { household, responses: null, plusOnes: [] },
    }));
    let submittedPlusOnes: unknown;
    await page.route("**/api/rsvp/submission", async (route) => {
      const body = route.request().postDataJSON() as { responses: Record<string, string>; plusOnes: unknown };
      submittedPlusOnes = body.plusOnes;
      await route.fulfill({
        json: {
          confirmation: {
            submissionId: "submission-1",
            submittedAt: new Date().toISOString(),
            responses: body.responses,
            plusOnes: body.plusOnes,
          },
        },
      });
    });

    await openInvitation(page);
    await expect(page.getByRole("group", { name: "Guest of Alicia Anderson" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Guest of Brandon Anderson" })).toHaveCount(0);
    await page.getByRole("radio", { name: "Alicia Anderson: Attending" }).check();
    await page.getByRole("radio", { name: "Brandon Anderson: Undecided" }).check();
    await page.getByRole("checkbox", { name: /bring a guest for alicia anderson/i }).check();
    await page.getByRole("radio", { name: "Guest of Alicia Anderson: Attending" }).check();
    await page.getByRole("button", { name: /submit rsvp/i }).click();

    await expect(page.getByRole("status")).toContainText("Your response is saved");
    expect(submittedPlusOnes).toEqual([
      { grantedToInviteeId: "a1", guestName: null, status: "attending" },
    ]);
  });

  test("shows a server rejection when a request adds an ungranted guest", async ({ page }) => {
    await page.route("**/api/rsvp/lookup", (route) => route.fulfill({
      json: { household, responses: null, plusOnes: [] },
    }));
    await page.route("**/api/rsvp/submission", async (route) => {
      await route.fulfill({
        status: 400,
        json: { message: "The plus-one is not granted to this invitee." },
      });
    });

    await openInvitation(page);
    await page.getByRole("radio", { name: "Alicia Anderson: Attending" }).check();
    await page.getByRole("radio", { name: "Brandon Anderson: Undecided" }).check();
    await page.getByRole("checkbox", { name: /bring a guest for alicia anderson/i }).check();
    await page.getByRole("radio", { name: "Guest of Alicia Anderson: Attending" }).check();
    await page.getByRole("button", { name: /submit rsvp/i }).click();

    await expect(page.locator("#RSVP p[role='alert']")).toContainText(/plus-one is not granted/i);
    await expect(page.getByRole("radio", { name: "Brandon Anderson: Undecided" })).toBeChecked();
  });
});
