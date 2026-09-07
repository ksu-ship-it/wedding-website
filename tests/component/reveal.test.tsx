import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Reveal } from "@/motion/reveal";

const originalIntersectionObserverDescriptor = Object.getOwnPropertyDescriptor(window, "IntersectionObserver");

afterEach(() => {
  if (originalIntersectionObserverDescriptor) {
    Object.defineProperty(window, "IntersectionObserver", originalIntersectionObserverDescriptor);
  } else {
    Reflect.deleteProperty(window, "IntersectionObserver");
  }
  vi.restoreAllMocks();
});

describe("Reveal", () => {
  it("stays visible when IntersectionObserver is unavailable", async () => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: undefined,
    });

    render(<Reveal>Fallback content</Reveal>);

    await act(async () => {});

    expect(screen.getByText("Fallback content")).toHaveAttribute("data-reveal", "true");
    expect(screen.getByText("Fallback content")).toHaveClass("opacity-100", "translate-y-0");
  });

  it("holds detail content below the card until the docking delay completes", async () => {
    let observerCallback: IntersectionObserverCallback | undefined;

    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe() {}
      disconnect() {}
    }

    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: IntersectionObserverMock,
    });

    render(<Reveal delay="details">Detail content</Reveal>);
    const element = screen.getByText("Detail content");

    await act(async () => {});
    expect(element).toHaveClass("opacity-0", "translate-y-8", "delay-[400ms]");

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(element).toHaveClass("opacity-100", "translate-y-0", "delay-[400ms]");
  });

  it("replays when the observed element leaves and re-enters the viewport", async () => {
    let observerCallback: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();

    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
    }

    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      value: IntersectionObserverMock,
    });

    render(<Reveal direction="left" delay="details">Observed content</Reveal>);
    const element = screen.getByText("Observed content");

    await act(async () => {});
    expect(element).toHaveClass("opacity-0", "-translate-x-full", "delay-[400ms]");
    expect(observe).toHaveBeenCalledOnce();

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(element).toHaveClass("opacity-100", "translate-y-0", "duration-[2000ms]", "ease-out");

    await act(async () => {
      observerCallback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(element).toHaveClass("opacity-0", "-translate-x-full", "delay-[400ms]");
    expect(disconnect).not.toHaveBeenCalled();

    await act(async () => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(element).toHaveClass("opacity-100", "translate-y-0");
  });
});