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
        <Reveal className="relative z-10 mx-auto flex min-h-[42rem] w-full max-w-6xl flex-col justify-top px-6 py-12 text-cream md:min-h-[56rem] md:px-10 md:py-20 lg:px-16">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.28em] text-peach">
            The beginning of forever
          </p>
          <h1 className="max-w-3xl font-signature text-6xl leading-[0.9] text-cream md:text-8xl">
            {event.coupleNames}
          </h1>
          {/* <p className="mt-8 max-w-xl text-base leading-7 text-cream/90 md:text-lg">
            We are gathering the stories, places, and people that make this celebration ours.
          </p> */}
        </Reveal>
      </section>

      <Section
        aria-label="Event details"
        className="mt-40 md:mt-24 px-6 py-10 md:px-10 md:py-14 lg:px-16"
                    id="event-details"
                eyebrow="00 / Event details"
                title="The start of something new."
                intro="The places, times, and moments we are gathering to celebrate the beginning of forever."
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
