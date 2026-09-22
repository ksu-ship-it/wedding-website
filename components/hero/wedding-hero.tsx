import { CountdownTimer } from "@/components/hero/countdown-timer";
import type { WeddingEvent } from "@/content/types";
import { Reveal } from "@/motion/reveal";
import { Section } from "@/components/ui/section";
import { Alex_Brush, Inter } from "next/font/google";

// 1. Initialize your clean body font
const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans", 
});

// 2. Initialize your elegant wedding signature font
const signatureFont = Alex_Brush({
  weight: "400", // Alex Brush loads standard weight
  subsets: ["latin"],
  variable: "--font-signature", // Binds it to a CSS Variable
});


type WeddingHeroProps = {
  event: WeddingEvent;
};

export function WeddingHero({ event }: WeddingHeroProps) {
  return (
    <>
      <section
        id="hero"
        className="relative isolate min-h-[42rem] overflow-hidden md:min-h-[70rem]"
      >
        <Reveal className="relative z-10 mx-auto flex min-h-[10rem] w-full max-w-6xl items-center justify-center px-6 py-12 text-cream md:min-h-[10rem] md:px-10 md:py-20 lg:px-16">
          <div className="w-full max-w-3xl border border-white/20 bg-[rgba(47,75,88,0.22)] px-6 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.12)]  md:px-12 md:py-12">
            <p className="text-center text-[0.68rem] font-medium uppercase tracking-[0.32em] text-peach">
              Together with their families
            </p>

            <h1 className="mt-6 text-center font-signature text-6xl leading-[0.85] text-cream md:text-8xl">
              {event.coupleNames}
            </h1>

            <div className="mx-auto mt-6 h-px w-20 bg-white/60" aria-hidden="true" />

            <p className="mt-6 text-center text-[0.7rem] font-medium uppercase tracking-[0.32em] text-cream/85">
              invite you to celebrate
            </p>

            <div className="mt-5 flex flex-col items-center justify-center gap-2 text-center md:flex-row md:gap-4">
              <span className="text-[0.72rem] uppercase tracking-[0.22em] text-cream/85">
                April 24, 2027
              </span>
              <span className="hidden h-px w-8 bg-white/60 md:block" aria-hidden="true" />
              <span className="text-[0.72rem] uppercase tracking-[0.22em] text-cream/85">
                {event.locationLabel}
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      <Section
        aria-label="Event details"
        className="mt-40 md:mt-24 px-6 py-10 md:px-10 md:py-14 lg:px-16"
                    id="event-details"
                eyebrow="00 / Event details"
                title="The start of forever."
                intro=""
      >
        <Reveal className="relative isolate mx-auto grid min-h-[16rem] w-full max-w-7xl grid-cols-1 gap-8 overflow-hidden bg-cream p-6 md:grid-cols-2 md:items-end md:p-10">
          <div>
            <p className="font-serif text-3xl text-deep-blue">{event.venueName}</p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-copper">
              {event.locationLabel}
            </p>
            <p className="mt-4 text-sm text-deep-blue/70">April 24, 2027</p>
          </div>
          <CountdownTimer targetDateTime={event.eventDateTime} />
        </Reveal>
      </Section>

              {/* <Section
                id="our-story"
                eyebrow="01 / Our story"
                title="The chapters that led us here."
                intro="A few moments from the story we are lucky enough to keep writing together."
              >
                <StorySlideshow images={storyImages} moments={storyMoments} />
              </Section> */}
    </>
  );
}
