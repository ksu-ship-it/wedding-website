import type { FAQItem } from "./types";

export const frequentlyAskedQuestions = [
  {
    id: "dress-code",
    question: "What is the dress code?",
    answer: "Garden formal. Wear something comfortable enough for an evening outdoors and bring a layer for later.",
    defaultOpen: true,
  },
  {
    id: "children",
    question: "Are children invited?",
    answer: "Your invitation will include the names of everyone invited. Please reach out if you have questions.",
  },
  {
    id: "plus-ones",
    question: "Can I bring a plus-one?",
    answer: "Plus-ones will be named on the invitation. We are grateful for your understanding as we plan the weekend.",
  },
] satisfies FAQItem[];
