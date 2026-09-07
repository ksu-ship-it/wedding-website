import Image from "next/image";

import type { ImageAsset } from "@/content/types";
import { getResponsiveFillImageProps } from "@/lib/image-slots";

type FixedHeroBackgroundProps = {
  image: ImageAsset;
};

export function FixedHeroBackground({ image }: FixedHeroBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-deep-blue" data-testid="fixed-hero-background">
      <Image
        {...getResponsiveFillImageProps(image, "100vw")}
        fill
        alt=""
        aria-hidden="true"
        priority
        className="object-cover object-[75%_center] md:object-center"
      />
      {/* <div
        // className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,75,88,0.65)_0%,rgba(47,75,88,0.16)_38%,rgba(47,75,88,0.86)_100%)]"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,75,88,0.65)_0%,rgba(47,75,88,0.16)_15%,rgba(47,75,88,0.86)_100%)]"

        aria-hidden="true"
      /> */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,75,88,0.7)_0%,rgba(47,75,88,0.3)_25%,rgba(47,75,88,0)_50%)]" aria-hidden="true" />

    </div>
  );
}
