export type ImageSlot =
  | "hero"
  | "storyPortrait"
  | "storyLandscape"
  | "galleryPortrait"
  | "galleryLandscape"
  | "gallerySquare";

export type NavigationHash =
  | "#our-story"
  | "#schedule"
  | "#travel"
  | "#gallery"
  | "#FAQ"
  | "#RSVP";

export interface WeddingEvent {
  coupleNames: string;
  eventDateTime: string;
  timeZone: string;
  venueName: string;
  locationLabel: string;
  rsvpDeadline: string;
  rsvpActionLabel: string;
}

export interface StoryMoment {
  id: string;
  heading: string;
  body: string;
  imageId: string;
  imageSlot: ImageSlot;
  alt: string;
  caption?: string;
  order: number;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startLabel: string;
  location: string;
  guidance: string;
}

export interface ImageAsset {
  id: string;
  src: string;
  mobileSrc: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  blurDataURL: string;
  slot: ImageSlot;
  aspectRatio: number;
  role: "hero" | "story" | "gallery";
  status: "approved" | "temporary";
  sourcePath: string;
}

export type TravelCategory = "arrival" | "accommodation" | "transport" | "parking";

export interface TravelGuideItem {
  id: string;
  category: TravelCategory;
  title: string;
  body: string;
  link?: string;
}

export interface HotelRecommendation {
  id: string;
  name: string;
  address: string;
  website: string;
  note?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export interface NavigationItem {
  label: string;
  hash: NavigationHash;
  order: number;
}

export interface RSVPPrompt {
  deadline: string;
  instructions: string;
  actionLabel: string;
  destination: string;
}
