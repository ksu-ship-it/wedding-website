import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Alex_Brush, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/ui/skip-link";
import "./globals.css";

const editorialSerif = Cormorant_Garamond({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cleanSans = DM_Sans({
  variable: "--font-clean-sans",
  subsets: ["latin"],
});

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

export const metadata: Metadata = {
  title: "A Day to Remember",
  description: "A wedding celebration shared with the people we love.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sansFont.variable} ${signatureFont.variable} ${editorialSerif.variable} ${cleanSans.variable}`}>
      <body className="min-h-screen overflow-x-clip bg-transparent text-deep-blue antialiased">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
