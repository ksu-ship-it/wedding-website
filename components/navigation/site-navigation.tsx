"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { NavigationItem } from "@/content/types";

type SiteNavigationProps = {
  items: NavigationItem[];
};

const focusableSelector =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteNavigation({ items }: SiteNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        triggerRef.current?.focus();
      }
      wasOpenRef.current = false;
      document.body.style.overflow = "";
      return;
    }

    wasOpenRef.current = true;
    document.body.style.overflow = "hidden";
    const firstLink = menuRef.current?.querySelector<HTMLElement>(focusableSelector);
    firstLink?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) {
        return;
      }

      const focusableElements = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <nav aria-label="Primary navigation" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {items.map((item) => (
            <li key={item.hash}>
              <a
                href={item.hash}
                className="flex min-h-11 items-center px-3 text-sm text-deep-blue/75 transition-colors duration-[3000ms] hover:text-coral"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        ref={triggerRef}
        type="button"
        aria-controls="mobile-navigation"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        className="flex min-h-11 min-w-11 items-center justify-center border border-dusty-blue text-sm text-deep-blue md:hidden"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <span aria-hidden="true" className="text-lg leading-none">
            x
          </span>
        ) : (
          <span aria-hidden="true" className="flex w-5 flex-col gap-1">
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current" />
            <span className="h-px w-full bg-current" />
          </span>
        )}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-40 bg-deep-blue/70 md:hidden" onClick={closeMenu}>
          <aside
            id="mobile-navigation"
            ref={menuRef}
            aria-label="Mobile navigation"
            className="relative z-50 isolate ml-auto flex h-full w-[min(88vw,24rem)] flex-col bg-cream px-6 py-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-5">
              <p className="font-serif text-2xl text-deep-blue"></p>
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center border border-dusty-blue text-sm text-deep-blue"
                aria-label="Close navigation"
                onClick={closeMenu}
              >
                <span aria-hidden="true">x</span>
              </button>
            </div>
            <nav aria-label="Mobile primary navigation" className="pt-5">
              <ul>
                {items.map((item) => (
                  <li key={item.hash} className="border-b border-dusty-blue/30">
                    <a
                      href={item.hash}
                      className="flex min-h-14 items-center text-2xl font-serif text-deep-blue hover:text-coral"
                      onClick={closeMenu}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
