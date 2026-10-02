import type { HotelRecommendation, TravelGuideItem } from "./types";

export const travelGuide = [
  {
    id: "parking",
    category: "parking",
    title: "Parking",
    body: "Complimentary parking will be available at the venue. Valet service will also be offered.",
  },
  {
    id: "stay",
    category: "accommodation",
    title: "Where to stay",
    body: "A few nearby hotel options are listed below for your convenience.",
  },
  // {
  //   id: "transport",
  //   category: "transport",
  //   title: "Weekend transport",
  //   body: "Shuttle details between the recommended hotels and venue will be available closer to the date.",
  // },
  
] satisfies TravelGuideItem[];

export const hotelRecommendations = [
  {
    id: "hilton-garden-inn-roslyn",
    name: "Hilton Garden Inn Roslyn",
    address: "3 Harbor Park Drive, Port Washington NY 11050",
    website: "https://www.hilton.com/en/hotels/nycpwgi-hilton-garden-inn-roslyn/?SEO_id=GMB-AMER-GI-NYCPWGI&y_source=1_NjQ4NjYxNi03MTUtbG9jYXRpb24ud2Vic2l0ZQ%3D%3D",
    note: "",
  },
  {
    id: "the-roslyn",
    name: "The Roslyn, Tapestry Collection by Hilton",
    address: "1221 Old Northern Boulevard, Roslyn, NY 11576",
    website: "https://www.hilton.com/en/hotels/lgarsup-the-roslyn/?SEO_id=GMB-AMER-UP-LGARSUP&y_source=1_MTYwNjAyNjAtNzE1LWxvY2F0aW9uLndlYnNpdGU%3D",
    note: "",
  },
  {
    id: "mansion-at-glen-cove",
    name: "The Mansion at Glen Cove",
    address: "200 Dosoris Lane, Glen Cove, NY 11542",
    website: "http://www.themansionatglencove.com/?utm_source=google+business+profile&utm_medium=new+york&utm_campaign=wedding-venues",
    note: "",
  },
] satisfies HotelRecommendation[];
