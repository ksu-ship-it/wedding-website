import type { NavigationItem } from "./types";

export const navigationItems = [
  { label: "Our Story", hash: "#our-story", order: 1 },
  // { label: "Schedule", hash: "#schedule", order: 2 },
  { label: "Travel", hash: "#travel", order: 3 },
  { label: "FAQ", hash: "#FAQ", order: 4 },
  { label: "RSVP", hash: "#RSVP", order: 5 },
  { label: "Gallery", hash: "#gallery", order: 6 },
] satisfies NavigationItem[];
