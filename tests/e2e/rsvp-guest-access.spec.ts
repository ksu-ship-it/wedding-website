import { expect, test } from "@playwright/test";

async function openRsvp(page: import("@playwright/test").Page) {
  await page.goto("/#RSVP");
  const secretWord = page.getByRole("textbox", { name: "Secret word" });
  await secretWord.pressSequentially("lenny");
  await page.getByRole("button", { name: "Enter" }).click();
}

test.describe("guest RSVP lookup", () => {
  test("accepts a valid exact lookup and reveals the household", async ({ page }) => {
    await openRsvp(page);
    await page.getByLabel("First name").fill("Alicia");
    await page.getByLabel("Last name").fill("Anderson");
    await page.getByRole("button", { name: /find my invitation/i }).click();

    await expect(page.getByRole("group", { name: "Attendance for Alicia Anderson" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Attendance for Brandon Anderson" })).toBeVisible();
  });

  test("shows a generic recovery message for an unknown match", async ({ page }) => {
    await openRsvp(page);
    await page.getByLabel("First name").fill("Unknown");
    await page.getByLabel("Last name").fill("Guest");
    await page.getByRole("button", { name: /find my invitation/i }).click();

    await expect(page.locator("#RSVP p[role='alert']")).toHaveText(/we couldn't find that invitation/i);
  });

  test("keeps unknown and ambiguous matches indistinguishable", async ({ page }) => {
    await openRsvp(page);
    await page.route("**/api/rsvp/lookup", async (route) => {
      const payload = route.request().postDataJSON() as { firstName: string };
      await route.fulfill({
        status: 404,
        json: { message: "We couldn't find that invitation." },
      });
      expect(payload.firstName).toMatch(/unknown|duplicate/i);
    });

    for (const firstName of ["Unknown", "Duplicate"]) {
      await page.getByLabel("First name").fill(firstName);
      await page.getByLabel("Last name").fill("Guest");
      await page.getByRole("button", { name: /find my invitation/i }).click();
      await expect(page.locator("#RSVP p[role='alert']")).toHaveText("We couldn't find that invitation.");
    }
  });

  test("shows retry guidance when lookup is rate limited", async ({ page }) => {
    await openRsvp(page);
    await page.route("**/api/rsvp/lookup", async (route) => {
      await route.fulfill({
        status: 429,
        json: { message: "Too many attempts. Please wait before trying again." },
      });
    });
    await page.getByLabel("First name").fill("Alicia");
    await page.getByLabel("Last name").fill("Anderson");
    await page.getByRole("button", { name: /find my invitation/i }).click();

    await expect(page.locator("#RSVP p[role='alert']")).toHaveText(/too many attempts.*wait/i);
  });
});
