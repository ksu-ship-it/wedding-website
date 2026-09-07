import type { TravelGuideItem } from "./types";

export const travelGuide = [
  {
    id: "arrival",
    category: "arrival",
    title: "Getting here",
    body: "The venue is about 90 minutes north of New York City by car. Detailed directions will be shared with the final invitation.",
  },
  {
    id: "stay",
    category: "accommodation",
    title: "Where to stay",
    body: "A small room block is reserved at nearby inns and hotels. Booking information will be added soon.",
  },
  {
    id: "transport",
    category: "transport",
    title: "Weekend transport",
    body: "Shuttle details between the recommended hotels and venue will be available closer to the date.",
  },
  {
    id: "parking",
    category: "parking",
    title: "Parking",
    body: "On-site parking will be available, with accessible spaces near the main entrance.",
  },
] satisfies TravelGuideItem[];
