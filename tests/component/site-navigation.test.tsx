import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteNavigation } from "@/components/navigation/site-navigation";
import { navigationItems } from "@/content/navigation";

describe("SiteNavigation", () => {
  it("traps mobile focus and restores focus after Escape", () => {
    render(<SiteNavigation items={navigationItems} />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });

    fireEvent.click(trigger);
    const links = screen.getAllByRole("link");
    const close = document.querySelector("#mobile-navigation button[aria-label='Close navigation']");
    const lastLink = links[links.length - 1];
    const menu = document.querySelector("#mobile-navigation");

    expect(close).toBeTruthy();
    expect(menu).toHaveClass("bg-cream", "isolate", "z-50");
    expect(menu?.parentElement).toHaveClass("bg-deep-blue/70");
    lastLink.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveFocus();
  });
});
