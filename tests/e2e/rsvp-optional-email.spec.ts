import { expect, test } from "@playwright/test";

const household = {
  householdId: "h1",
  members: [
    { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: false },
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

test.describe("optional email RSVP", () => {
  test("allows email-free and valid-email submissions and retains choices on invalid email", async ({ page }) => {
    const submittedEmails: Array<string | null> = [];
    await page.route("**/api/rsvp/lookup", (route) => route.fulfill({
      json: { household, responses: null, plusOnes: [] },
    }));
    await page.route("**/api/rsvp/submission", async (route) => {
      const body = route.request().postDataJSON() as { contactEmail: string | null; responses: Record<string, string> };
      submittedEmails.push(body.contactEmail);
      await route.fulfill({
        json: { confirmation: {
          submissionId: `submission-${submittedEmails.length}`,
          submittedAt: new Date().toISOString(),
          responses: body.responses,
          plusOnes: [],
        } },
      });
    });

    await openInvitation(page);
    await page.getByRole("radio", { name: "Alicia Anderson: Attending" }).check();
    await page.getByRole("radio", { name: "Brandon Anderson: Undecided" }).check();
    await expect(page.getByLabel(/email.*optional/i)).toHaveJSProperty("required", false);
    await page.getByRole("button", { name: /submit rsvp/i }).click();
    await expect(page.getByRole("status")).toContainText("Your response is saved");
    expect(submittedEmails.at(-1)).toBeNull();

    await page.getByRole("button", { name: /edit responses/i }).click();
    await page.getByLabel(/email.*optional/i).fill("guest@example.com");
    await page.getByRole("button", { name: /submit rsvp/i }).click();
    await expect(page.getByRole("status")).toContainText("Your response is saved");
    expect(submittedEmails.at(-1)).toBe("guest@example.com");

    await page.getByRole("button", { name: /edit responses/i }).click();
    await page.getByLabel(/email.*optional/i).fill("invalid");
    await page.getByRole("button", { name: /submit rsvp/i }).click();
    await expect(page.locator("#RSVP p[role='alert']")).toContainText(/enter a valid email address/i);
    await expect(page.getByRole("radio", { name: "Alicia Anderson: Attending" })).toBeChecked();
    expect(submittedEmails).toEqual([null, "guest@example.com"]);
  });
});
