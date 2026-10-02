import { WeddingHero } from "@/components/hero/wedding-hero";
import { FixedHeroBackground } from "@/components/hero/fixed-hero-background";
import { MasonryGallery } from "@/components/gallery/masonry-gallery";
import { StorySlideshow } from "@/components/story/story-slideshow";
import { SiteHeader } from "@/components/ui/site-header";
import { Section } from "@/components/ui/section";
import { frequentlyAskedQuestions } from "@/content/faq";
import { galleryImages } from "@/content/gallery";
import { heroImage, storyImages } from "@/content/images";
import { navigationItems } from "@/content/navigation";
import { rsvpPrompt } from "@/content/rsvp";
import { storyMoments } from "@/content/story";
import { hotelRecommendations, travelGuide } from "@/content/travel";
import { weddingEvent } from "@/content/wedding-event";
import { AccessGate } from "@/components/access/access-gate";
import { GuestRsvpLookup } from "@/components/rsvp/guest-rsvp";

export default function Home() {
  return (
    <AccessGate>
      <FixedHeroBackground image={heroImage} />
      <div className="relative z-10 min-h-screen">
        <SiteHeader coupleNames={weddingEvent.coupleNames} items={navigationItems} />
        <main id="main-content" tabIndex={-1} className="relative">
          <WeddingHero event={weddingEvent} />

        <Section
          id="our-story"
          eyebrow="01 / Our Story"
          title="The chapters that led us here."
          intro=""
        >
          <StorySlideshow images={storyImages} moments={storyMoments} />
        </Section>

        {/* <Section
          id="schedule"
          eyebrow="02 / Schedule"
          title="A weekend in three acts."
          intro="Keep this page close as the details come together."
        >
          <div className="grid grid-cols-1 gap-0">
            {schedule.map((event) => (
              <article key={event.id} className="border-t border-dusty-blue/50 py-6 transition-shadow duration-[3000ms] hover:shadow-[inset_0.25rem_0_0_var(--coral)] first:pt-0">
                <p className="text-sm text-copper">{event.startLabel}</p>
                <h3 className="mt-2 font-serif text-3xl text-deep-blue">{event.title}</h3>
                <p className="mt-2 text-sm font-medium text-deep-blue/80">{event.location}</p>
                <p className="mt-3 text-base leading-7 text-deep-blue/75">{event.guidance}</p>
              </article>
            ))}
          </div>
        </Section> */}

        <Section
          id="travel"
          eyebrow="03 / Travel"
          title="The Event"
          intro=""
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {travelGuide.map((item) => (
              <article key={item.id} className="border-t border-dusty-blue/50 pt-5 transition-shadow duration-[3000ms] hover:shadow-[inset_0.25rem_0_0_var(--coral)]">
                <p className="text-xs uppercase tracking-[0.18em] text-copper">{item.category}</p>
                <h3 className="mt-3 font-serif text-2xl text-deep-blue">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-deep-blue/75">{item.body}</p>
              </article>
            ))}
          </div>
<div className="mt-10">
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {hotelRecommendations.map((hotel) => (
                <article key={hotel.id} className="flex h-full flex-col border border-dusty-blue/40 bg-white/70 p-5 shadow-[0_0_0_1px_rgba(72,95,120,0.04)]">
                  <h4 className="mt-3 font-serif text-2xl text-deep-blue">{hotel.name}</h4>
                  <p className="mt-3 text-sm leading-6 text-deep-blue/80">{hotel.address}</p>
                  {hotel.note ? <p className="mt-4 text-sm leading-6 text-deep-blue/75">{hotel.note}</p> : null}
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center border-b-2 border-coral pb-1 text-sm font-medium text-deep-blue transition-colors hover:text-coral justify-end"
                  >
                    {">>>"}
                  </a>
                </article>
              ))}
            </div>
          </div>
          
        </Section>

        <Section
          id="FAQ"
          eyebrow="05 / FAQ"
          title="A few useful answers."
          intro=""
        >
          <div className="grid grid-cols-1 text-center md:text-center">
            {frequentlyAskedQuestions.map((item) => (
              <details key={item.id} open={item.defaultOpen} className="border-t border-dusty-blue/50 py-5 text-center md:text-center">
                <summary className="cursor-pointer list-none pr-8 font-serif text-2xl text-deep-blue md:text-center">
                  {item.question}
                </summary>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-deep-blue/75 md:text-center">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section
          id="RSVP"
          eyebrow="06 / RSVP"
          title="Find your invitation"
          intro=""
        >
          <div className="border-t border-dusty-blue/50 pt-5">
            <p className="text-sm uppercase tracking-[0.18em] text-copper">{rsvpPrompt.deadline}</p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-deep-blue/80">{rsvpPrompt.instructions}</p>
            <div className="mt-8">
              <GuestRsvpLookup />
            </div>
          </div>
        </Section>

        <Section
          id="gallery"
          eyebrow="07 / Gallery"
          title="A place for the memories."
          intro=""
        >
          <MasonryGallery images={galleryImages} />
        </Section>
        </main>
        <footer className="border-t border-dusty-blue/50 bg-cream px-6 py-10 md:px-10 lg:px-16">
          <p className="mx-auto max-w-6xl text-sm text-deep-blue/70">{weddingEvent.coupleNames}</p>
        </footer>
      </div>
    </AccessGate>
  );
}
