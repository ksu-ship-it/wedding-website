import { expect, test } from "@playwright/test";

const validCsv = "invitee_id,household_id,first_name,last_name,plus_one_allowed\ng1,h1,Ada,Love,true";
const invalidCsv = "invitee_id,household_id,first_name,last_name,plus_one_allowed\ng1,,Ada,Love,true";

test.describe("host RSVP management", () => {
  test("logs in, corrects a roster import, publishes, reviews, and exports", async ({ page }, testInfo) => {
    let previewCount = 0;
    await page.route("**/api/admin/rsvp**", async (route) => {
      if (route.request().method() === "GET") {
        const action = new URL(route.request().url()).searchParams.get("action");
        if (action === "responses") {
          await route.fulfill({ json: { responses: [{
            household: "Love party",
            invitee: "Ada Love",
            attendance: "attending",
            plusOneName: null,
            plusOneAttendance: null,
            contactEmail: null,
            versionId: "v2",
            submittedAt: "2026-09-30T12:00:00.000Z",
          }] } });
        } else if (action === "export") {
          await route.fulfill({
            status: 200,
            contentType: "text/csv",
            headers: { "content-disposition": "attachment; filename=responses.csv" },
            body: "household,invitee,attendance\nLove party,Ada Love,attending\n",
          });
        } else {
          await route.fulfill({ status: 401, json: { authenticated: false } });
        }
        return;
      }

      const isMultipart = route.request().headers()["content-type"]?.startsWith("multipart/form-data");
      if (isMultipart) {
        previewCount += 1;
        await route.fulfill({ json: { preview: previewCount === 1
          ? { versionId: "draft-1", rowCount: 1, validRows: 0, invalidRows: 1, rows: [], issues: [{ rowNumber: 2, field: "household_id", message: "Household is required." }] }
          : { versionId: "draft-2", rowCount: 1, validRows: 1, invalidRows: 0, rows: [{ rowNumber: 2, inviteeId: "g1", firstName: "Ada", lastName: "Love" }], issues: [] } } });
        return;
      }

      const body = route.request().postDataJSON() as { action: string; password?: string; versionId?: string };
      if (body.action === "login") {
        await route.fulfill({ status: body.password === "host-secret" ? 200 : 401, json: { authenticated: body.password === "host-secret" } });
      } else if (body.action === "publish") {
        await route.fulfill({ json: { published: true, versionId: body.versionId } });
      } else {
        await route.fulfill({ status: 400, json: { message: "Unsupported action." } });
      }
    });

    await page.goto("/admin/rsvp");
    await page.getByLabel("Host passphrase").pressSequentially("host-secret");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByLabel("Guest list CSV")).toBeVisible();

    await page.getByLabel("Guest list CSV").setInputFiles({ name: "guests.csv", mimeType: "text/csv", buffer: Buffer.from(invalidCsv) });
    await page.getByRole("button", { name: /preview import/i }).click();
    await expect(page.getByText(/row 2.*household_id/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /publish guest list/i })).toBeDisabled();

    await page.getByLabel("Guest list CSV").setInputFiles({ name: "guests.csv", mimeType: "text/csv", buffer: Buffer.from(validCsv) });
    await page.getByRole("button", { name: /preview import/i }).click();
    await expect(page.getByText(/1 valid row/i)).toBeVisible();
    await page.getByRole("button", { name: /publish guest list/i }).click();
    await expect(page.getByRole("status")).toContainText(/guest list published/i);

    await expect(page.getByText("Ada Love")).toBeVisible();
    const exportLink = page.getByRole("link", { name: /export csv/i });
    await expect(exportLink).toHaveAttribute("href", "/api/admin/rsvp?action=export");
    if (testInfo.project.name === "mobile") return;

    const download = page.waitForEvent("download");
    await exportLink.click();
    expect((await download).suggestedFilename()).toBe("responses.csv");
  });
});
