import { expect, test } from "@playwright/test";

const hashes = ["#our-story", "#schedule", "#travel", "#gallery", "#FAQ", "#RSVP"];

test.describe("canonical wedding journeys", () => {
  test("direct hashes resolve and browser history returns to the prior section", async ({ page }) => {
    for (const hash of hashes) {
      await page.goto(`/${hash}`);
      await expect(page.locator(hash)).toBeVisible();
    }

    await page.goto("/");
    const desktopNavigation = page.getByRole("navigation", { name: "Primary navigation" });
    if (await desktopNavigation.isVisible()) {
      await desktopNavigation.getByRole("link", { name: "Our story" }).click();
    } else {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("navigation", { name: "Mobile primary navigation" }).getByRole("link", { name: "Our story" }).click();
    }
    await expect(page).toHaveURL(/#our-story$/);
    if (await desktopNavigation.isVisible()) {
      await desktopNavigation.getByRole("link", { name: "Schedule" }).click();
    } else {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("navigation", { name: "Mobile primary navigation" }).getByRole("link", { name: "Schedule" }).click();
    }
    await expect(page).toHaveURL(/#schedule$/);
    await page.goBack();
    await expect(page).toHaveURL(/#our-story$/);
  });

  test("reduced motion keeps RSVP directly reachable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("link", { name: "RSVP" }).first().click();
    await expect(page).toHaveURL(/#RSVP$/);
    await expect(page.locator("#RSVP")).toBeVisible();
  });

  test("fixed background sits behind opaque section cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("fixed-hero-background")).toBeVisible();
    const card = page.locator("#our-story > div [data-reveal='true']").first();
    await expect(card).toHaveClass(/w-full/);
    await expect(card).toHaveClass(/rounded-3xl/);
    await expect(card).toHaveClass(/bg-white\/85/);
    await expect(card).toHaveClass(/backdrop-blur-md/);
    await expect(card).toHaveClass(/shadow-2xl/);
    expect(await card.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
    expect(await page.getByTestId("fixed-hero-background").evaluate((element) => getComputedStyle(element).position)).toBe("fixed");
  });

  test("reveal content is immediately visible with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const storyReveal = page.locator("#our-story [data-reveal='true']").first();
    await expect(storyReveal).toHaveClass(/opacity-100/);
    await expect(storyReveal).toHaveClass(/translate-y-0/);
  });

  test("section gaps stay transparent and card interiors remain opaque", async ({ page }) => {
    await page.goto("/");
    const storySection = page.locator("#our-story");
    const storyCard = storySection.locator(":scope > div [data-reveal='true']").first();

    await expect(storyCard).toHaveClass(/w-full/);
    await expect(storyCard).toHaveClass(/rounded-3xl/);
    await expect(storyCard).toHaveClass(/bg-white\/85/);
    await expect(storyCard).toHaveClass(/backdrop-blur-md/);
    await expect(storyCard).toHaveClass(/shadow-2xl/);
    await expect(storySection).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    expect(await storyCard.evaluate((element) => getComputedStyle(element).overflow)).toBe("hidden");
  });

  test("hover transitions keep gallery tile geometry stable", async ({ page }) => {
    await page.goto("/#gallery");
    const tile = page.locator("#gallery button[aria-label^='Open ']").first();
    const before = await tile.boundingBox();

    await tile.hover();

    const after = await tile.boundingBox();
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after?.width).toBe(before?.width);
    expect(after?.height).toBe(before?.height);
  });
});

test.describe("responsive guest experience", () => {
  test("mobile navigation and gallery remain usable without horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "This journey targets the mobile navigation project.");
    await page.goto("/");
    await expect(page.getByRole("timer", { name: "Countdown to the wedding" })).toBeVisible();
    await expect(page.locator("html")).toHaveCSS("overflow-x", "visible");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.locator("#mobile-navigation")).toBeVisible();
    await expect(page.locator("#mobile-navigation a")).toHaveCount(6);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();

    const gallery = page.locator("#gallery [aria-label='Wedding gallery']").first();
    await expect(gallery).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous gallery image" })).toBeDisabled();
    await page.getByRole("button", { name: "Next gallery image" }).click();
    await expect(page.getByRole("button", { name: "Previous gallery image" })).toBeEnabled();
  });

  test("desktop sections expand while preserving the page width", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "This journey targets the desktop layout project.");
    await page.goto("/");
    await expect(page.locator("#hero")).toBeVisible();
    const heroHeight = await page.locator("#hero").evaluate((element) => element.getBoundingClientRect().height);
    expect(heroHeight).toBeGreaterThanOrEqual(896);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("gallery photos stay non-interactive while mobile arrows navigate", async ({ page }, testInfo) => {
    await page.goto("/#gallery");
    await expect(page.locator("#gallery button[aria-label^='Open ']")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Expanded gallery image" })).not.toBeVisible();

    if (testInfo.project.name === "mobile") {
      await expect(page.getByRole("button", { name: "Previous gallery image" })).toBeDisabled();
      await page.getByRole("button", { name: "Next gallery image" }).click();
      await expect(page.getByRole("button", { name: "Previous gallery image" })).toBeEnabled();
    }
  });
});
