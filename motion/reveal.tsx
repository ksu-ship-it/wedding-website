"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: "none" | "details";
  direction?: "up" | "left";
};

export function Reveal({ children, className = "", delay = "none", direction = "up" }: RevealProps) {
  const [isVisible, setIsVisible] = useState(true);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (reducedMotion || typeof window.IntersectionObserver !== "function" || !element) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={elementRef} data-reveal-observer="true">
      <div
        data-reveal="true"
        className={`transition-[opacity,transform] duration-[2000ms] ease-out motion-reduce:transform-none motion-reduce:transition-none ${
          delay === "details" ? "delay-[400ms]" : "delay-0"
        } ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
