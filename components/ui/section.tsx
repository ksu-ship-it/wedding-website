import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Reveal } from "@/motion/reveal";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

export function Section({ eyebrow, title, intro, children, className, ...props }: SectionProps) {
  return (
    <section
      className={`scroll-mt-24 px-6 py-20 md:px-10 md:py-28 lg:px-16 ${className ?? ""}`}
      {...props}
    >
      <Reveal
        direction="left"
        className="relative isolate mx-auto grid min-h-[24rem] w-full max-w-7xl grid-cols-1 gap-10 overflow-hidden rounded-3xl bg-white/85 p-6 shadow-2xl backdrop-blur-md md:grid-cols-2 md:gap-16 md:p-10"
      >
        <Reveal delay="details">
          <header>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-copper">{eyebrow}</p>
            <h2 className="mt-4 max-w-xl font-serif text-5xl leading-none text-deep-blue md:text-6xl">
              {title}
            </h2>
            {intro ? <p className="mt-6 max-w-md text-base leading-7 text-deep-blue/75">{intro}</p> : null}
          </header>
        </Reveal>
        <Reveal delay="details" className="min-w-0">
          <div>{children}</div>
        </Reveal>
      </Reveal>
    </section>
  );
}
