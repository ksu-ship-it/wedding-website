import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

const enabled = process.env.RSVP_DATABASE_SMOKE === "1";

test.describe("Neon RSVP development branch smoke test", () => {
  test.skip(!enabled, "Set RSVP_DATABASE_SMOKE=1 to run against an isolated Neon branch.");

  test("imports the fixture, saves a household response, and restores it on lookup", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Run the live database smoke flow once, not concurrently per device.");

    await page.goto("/admin/rsvp");
    await page.getByLabel("Host passphrase").pressSequentially("neon-smoke-host-pass");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByLabel("Guest list CSV")).toBeVisible();

    await page.getByLabel("Guest list CSV").setInputFiles(resolve(process.cwd(), "tests/fixtures/rsvp-guests.csv"));
    await page.getByRole("button", { name: /preview import/i }).click();
    await expect(page.getByText(/10 valid rows/i)).toBeVisible();
    await page.getByRole("button", { name: /publish guest list/i }).click();
    await expect(page.getByRole("status")).toContainText(/guest list published/i);

    await page.goto("/#RSVP");
    const secretWord = page.getByRole("textbox", { name: "Secret word" });
    await secretWord.pressSequentially("lenny");
    await page.getByRole("button", { name: "Enter" }).click();
    await page.getByLabel("First name").fill("Alicia");
    await page.getByLabel("Last name").fill("Anderson");
    await page.getByRole("button", { name: /find my invitation/i }).click();

    await page.getByRole("radio", { name: "Alicia Anderson: Attending" }).check();
    await page.getByRole("radio", { name: "Brandon Anderson: Undecided" }).check();
    await page.getByRole("checkbox", { name: "Bring a guest for Alicia Anderson" }).check();
    await page.getByRole("radio", { name: "Guest of Alicia Anderson: Attending" }).check();
    await page.getByRole("button", { name: /submit rsvp/i }).click();
    await expect(page.getByRole("status")).toContainText("Your response is saved");
    await expect(page.getByText(/Guest of Alicia Anderson: Attending/)).toBeVisible();

    await page.reload();
    const reloadedSecret = page.getByRole("textbox", { name: "Secret word" });
    await reloadedSecret.pressSequentially("lenny");
    await page.getByRole("button", { name: "Enter" }).click();
    await page.getByLabel("First name").fill("Alicia");
    await page.getByLabel("Last name").fill("Anderson");
    await page.getByRole("button", { name: /find my invitation/i }).click();
    await expect(page.getByRole("radio", { name: "Alicia Anderson: Attending", exact: true })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Brandon Anderson: Undecided" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Bring a guest for Alicia Anderson" })).toBeChecked();

    await page.goto("/admin/rsvp");
    await expect(page.getByRole("cell", { name: "Alicia Anderson" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: "attending" }).first()).toBeVisible();
    const csvDownload = page.waitForEvent("download");
    await page.getByRole("link", { name: /export csv/i }).click();
    expect((await csvDownload).suggestedFilename()).toBe("rsvp-responses.csv");
  });
});
