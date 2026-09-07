import type { NavigationItem } from "@/content/types";
import { SiteNavigation } from "@/components/navigation/site-navigation";

type SiteHeaderProps = {
  coupleNames: string;
  items: NavigationItem[];
};

export function SiteHeader({ coupleNames, items }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-dusty-blue/50 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-6 px-6 md:px-10 lg:px-16">
        <a href="#main-content" className="font-serif text-2xl text-deep-blue">
          {coupleNames}
        </a>
        <SiteNavigation items={items} />
      </div>
    </header>
  );
}
