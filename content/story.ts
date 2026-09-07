import type { StoryMoment } from "./types";

export const storyMoments = [
  {
    id: "college-visits",
    heading: "The early chapters",
    body: "Before the big milestones, there were the ordinary days that made being together feel easy.",
    imageId: "story-college-visits",
    imageSlot: "storyPortrait",
    alt: "A photograph from one of the couple's college visits",
    caption: "The first places we learned to make memories together.",
    order: 1,
  },
  {
    id: "first-home",
    heading: "A place of our own",
    body: "Our first home became a collection of small rituals, shared plans, and room for the future.",
    imageId: "story-first-home",
    imageSlot: "storyLandscape",
    alt: "A photograph from the couple's first home",
    caption: "Our first home, and the beginning of so many shared routines.",
    order: 2,
  },
  {
    id: "highschool-graduation",
    heading: "Growing together",
    body: "We have cheered each other through every new beginning and every leap into what comes next.",
    imageId: "story-highschool-graduation",
    imageSlot: "storyLandscape",
    alt: "A photograph from a high school graduation celebration",
    caption: "Celebrating the people we were becoming, side by side.",
    order: 3,
  },
  {
    id: "traveling-the-world",
    heading: "Out into the world",
    body: "Every journey has given us another story to bring home and another reason to keep exploring.",
    imageId: "story-traveling-the-world",
    imageSlot: "storyPortrait",
    alt: "A photograph from the couple's travels around the world",
    caption: "The world got bigger, and so did our story.",
    order: 4,
  },
] satisfies StoryMoment[];
