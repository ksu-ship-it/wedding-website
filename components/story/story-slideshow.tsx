"use client";

import Image from "next/image";
import { useState } from "react";

import type { ImageAsset, StoryMoment } from "@/content/types";
import { getResponsiveFillImageProps } from "@/lib/image-slots";

type StorySlideshowProps = {
  images: ImageAsset[];
  moments: StoryMoment[];
};

export function StorySlideshow({ images, moments }: StorySlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const orderedMoments = [...moments].sort((left, right) => left.order - right.order);
  const moment = orderedMoments[activeIndex];
  const image = images.find((item) => item.id === moment.imageId) ?? images[activeIndex];

  function move(direction: -1 | 1) {
    setActiveIndex((index) => Math.min(orderedMoments.length - 1, Math.max(0, index + direction)));
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      <figure className="group relative mx-auto aspect-[4/5] w-full max-w-2xl overflow-hidden bg-white/85 shadow-sm transition-shadow duration-[3000ms] hover:shadow-lg md:aspect-[4/3]">
        <Image
          {...getResponsiveFillImageProps(image, "(max-width: 767px) 100vw, 50vw")}
          fill
          alt={moment.alt}
          className="object-contain object-center transition-transform duration-[3000ms] ease-out group-hover:scale-[1.02]"
        />
      </figure>
      <div className="grid gap-4">
        <div className="w-full text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-copper">
            {activeIndex + 1} / {orderedMoments.length}
          </p>
          <h3 className="mt-2 font-serif text-3xl text-deep-blue">{moment.heading}</h3>
          <p className="mt-2 text-base leading-7 text-deep-blue/75">{moment.body}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center border border-dusty-blue text-deep-blue disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous story moment"
            disabled={activeIndex === 0}
            onClick={() => move(-1)}
          >
            <span aria-hidden="true">&#8592;</span>
          </button>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center border border-coral text-deep-blue disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next story moment"
            disabled={activeIndex === orderedMoments.length - 1}
            onClick={() => move(1)}
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
