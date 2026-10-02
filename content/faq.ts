import type { FAQItem } from "./types";

export const frequentlyAskedQuestions = [
  {
    id: "dress-code",
    question: "What is the dress code?",
    answer: "Our wedding attire is formal.",
    defaultOpen: true,
  },
  {
    id: "indoor-or-outdoor",
    question: "Is the ceremony indoors or outdoors?",
    answer: "Our ceremony will take place outdoors, weather permitting. Please dress accordingly.",
  },
  {
    id: "children",
    question: "Are children invited?",
    answer: "While we love your little ones, our wedding will be an adults-only celebration.",
  },
  {
    id: "plus-ones",
    question: "Can I bring a plus-one?",
    answer: "We are only able to accommodate the guests formally listed on your invitation and RSVP. Thank you for understanding!",
  },
] satisfies FAQItem[];
