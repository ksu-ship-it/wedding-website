import type { ScheduleEvent } from "./types";

export const schedule = [
  {
    id: "welcome",
    title: "Welcome drinks",
    startLabel: "Friday, April 24 at 6:00 PM",
    location: "The Sea Cliff Manor terrace",
    guidance: "Come as you are for a relaxed first toast together.",
  },
  {
    id: "ceremony",
    title: "Ceremony",
    startLabel: "Saturday, April 24 at 4:00 PM",
    location: "The Sea Cliff Manor meadow",
    guidance: "Please arrive 20 minutes early and follow the garden path.",
  },
  {
    id: "dinner",
    title: "Dinner and dancing",
    startLabel: "Saturday, April 24 at 5:30 PM",
    location: "The Sea Cliff Manor barn",
    guidance: "Dinner, speeches, and a very full dance floor to follow.",
  },
] satisfies ScheduleEvent[];
