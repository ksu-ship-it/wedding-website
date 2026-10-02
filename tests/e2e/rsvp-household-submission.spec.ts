import { expect, test } from "@playwright/test";

const household = {
  householdId: "h1",
  members: [
    { id: "a1", firstName: "Alicia", lastName: "Anderson", plusOneAllowed: true },
    { id: "a2", firstName: "Brandon", lastName: "Anderson", plusOneAllowed: false },
  ],
};

test.describe("household RSVP submission", () => {
  test("submits and later edits the party's current responses", async ({ page }) => {
    let savedResponses: Record<string, string> | null = null;

    await page.route("**/api/rsvp/lookup", async (route) => {
      await route.fulfill({
        json: {
          household,
          responses: savedResponses,
        },
      });
    });

    await page.route("**/api/rsvp/submission", async (route) => {
      const request = route.request().postDataJSON() as {
        responses: Record<string, string>;
        plusOnes: unknown[];
      };
      savedResponses = request.responses;
      await route.fulfill({
        json: {
          confirmation: {
            submissionId: "submission-1",
            submittedAt: new Date().toISOString(),
            responses: savedResponses,
            plusOnes: request.plusOnes,
          },
        },
      });
    });

    await page.goto("/#RSVP");
    const secretWord = page.getByRole("textbox", { name: "Secret word" });
    await secretWord.pressSequentially("lenny");
    await expect(secretWord).toHaveValue("lenny");
    await page.getByRole("button", { name: "Enter" }).click();
    await expect(page.getByRole("heading", { name: "Enter the secret word" })).toHaveCount(0);
    await page.getByLabel("First name").fill("Alicia");
    await page.getByLabel("Last name").fill("Anderson");
    await page.getByRole("button", { name: /find my invitation/i }).click();

    await page.getByRole("radio", { name: "Alicia Anderson: Attending" }).check();
    await page.getByRole("radio", { name: "Brandon Anderson: Declining" }).check();
    await page.getByRole("button", { name: /submit rsvp/i }).click();
    await expect(page.getByRole("status")).toContainText("Your response is saved");
    await expect(page.getByText(/Alicia Anderson.*Attending/i)).toBeVisible();

    await page.reload();
    await secretWord.pressSequentially("lenny");
    await page.getByRole("button", { name: "Enter" }).click();
    await page.getByLabel("First name").fill("Alicia");
    await page.getByLabel("Last name").fill("Anderson");
    await page.getByRole("button", { name: /find my invitation/i }).click();
    await expect(page.getByRole("radio", { name: "Alicia Anderson: Attending" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Brandon Anderson: Declining" })).toBeChecked();

    await page.getByRole("radio", { name: "Alicia Anderson: Declining" }).check();
    await page.getByRole("radio", { name: "Brandon Anderson: Attending" }).check();
    await page.getByRole("button", { name: /submit rsvp/i }).click();
    await expect(page.getByRole("status")).toContainText("Your response is saved");
    await expect(page.getByText(/Alicia Anderson.*Declining/i)).toBeVisible();
    await expect(page.getByText(/Brandon Anderson.*Attending/i)).toBeVisible();
    expect(savedResponses).toEqual({ a1: "declining", a2: "attending" });
  });
});
