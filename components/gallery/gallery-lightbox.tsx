"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";

import { getImageSlotContract, getResponsiveFillImageProps } from "@/lib/image-slots";
import type { ImageAsset } from "@/content/types";

type GalleryLightboxProps = {
  images: ImageAsset[];
};

const focusableSelector =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const swipeThreshold = 50;

function getCollageClass(index: number) {
  const layouts = [
    "md:col-span-3 md:row-span-3",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-2",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-2 md:row-span-2",
    "md:col-span-1 md:row-span-2",
    "md:col-span-1 md:row-span-1",
    "md:col-span-1 md:row-span-1",
    "md:col-span-2 md:row-span-2",
  ];

  return layouts[index % layouts.length];
}

export function GalleryLightbox({ images }: GalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const activeImage = activeIndex === null ? null : images[activeIndex];

  useEffect(() => {
    if (activeIndex === null) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index === null ? null : Math.max(0, index - 1)));
      } else if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index === null ? null : Math.min(images.length - 1, index + 1)));
      } else if (event.key === "Tab") {
        const dialog = document.getElementById("gallery-lightbox");
        const focusableElements = dialog
          ? Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
          : [];
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (firstElement && lastElement) {
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, images.length]);

  useEffect(() => {
    if (activeIndex === null) {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    }
  }, [activeIndex]);

  function openLightbox(index: number, trigger: HTMLElement) {
    returnFocusRef.current = trigger;
    setActiveIndex(index);
  }

  function closeLightbox() {
    setActiveIndex(null);
  }

  function move(direction: -1 | 1) {
    setActiveIndex((index) => {
      if (index === null) {
        return null;
      }
      return Math.min(images.length - 1, Math.max(0, index + direction));
    });
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      return;
    }

    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < swipeThreshold) {
      return;
    }

    move(deltaX > 0 ? -1 : 1);
  }

  return (
    <>
      <div className="relative md:hidden" aria-label="Wedding gallery">
        {(() => {
          const image = images[mobileIndex];
          return (
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/85">
              <div
                className="group relative block h-full w-full text-left"
              >
                <Image
                  {...getResponsiveFillImageProps(image, "100vw")}
                  fill
                  alt={image.alt}
                  className="object-contain transition-transform duration-[3000ms] group-hover:scale-105"
                />
              </div>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center border border-deep-blue/60 bg-cream/65 text-deep-blue shadow-sm backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous gallery image"
                disabled={mobileIndex === 0}
                onClick={() => setMobileIndex((index) => Math.max(0, index - 1))}
              >
                <span aria-hidden="true">&#8592;</span>
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center border border-deep-blue/60 bg-cream/65 text-deep-blue shadow-sm backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next gallery image"
                disabled={mobileIndex === images.length - 1}
                onClick={() => setMobileIndex((index) => Math.min(images.length - 1, index + 1))}
              >
                <span aria-hidden="true">&#8594;</span>
              </button>
            </div>
          );
        })()}
      </div>

      <div className="hidden grid-cols-1 gap-0 sm:grid-cols-2 md:grid md:auto-rows-[9rem] md:grid-cols-4 md:grid-flow-dense" aria-label="Wedding gallery">
        {images.map((image, index) => {
          const slot = getImageSlotContract(image.slot);
          return (
            <div
              key={image.id}
              className={`group relative block min-h-0 w-full overflow-hidden rounded-xl bg-white/85 text-left ${slot.aspectClassName.split(" ")[0]} md:aspect-auto ${getCollageClass(index)}`}
            >
              <Image
                {...getResponsiveFillImageProps(image, "(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw")}
                fill
                alt={image.alt}
                className="object-contain md:object-cover transition-transform duration-[3000ms] group-hover:scale-105"
              />
            </div>
          );
        })}
      </div>

      {activeImage && activeIndex !== null ? (
        <div
          id="gallery-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-deep-blue/95 p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded gallery image"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            ref={closeRef}
            type="button"
            className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center border border-peach text-cream md:right-8 md:top-8"
            aria-label="Close gallery"
            onClick={closeLightbox}
          >
            <span aria-hidden="true">x</span>
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center border border-peach text-cream disabled:cursor-not-allowed disabled:opacity-40 md:left-8"
            aria-label="Previous image"
            disabled={activeIndex === 0}
            onClick={() => move(-1)}
          >
            <span aria-hidden="true">&#8592;</span>
          </button>
          <figure className="relative max-h-full w-full max-w-5xl">
            <div className="relative mx-auto h-[min(78vh,52rem)] w-full">
              <Image
                {...getResponsiveFillImageProps(activeImage, "100vw")}
                fill
                alt={activeImage.alt}
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </figure>
          <button
            type="button"
            className="absolute right-4 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center border border-peach text-cream disabled:cursor-not-allowed disabled:opacity-40 md:right-8"
            aria-label="Next image"
            disabled={activeIndex === images.length - 1}
            onClick={() => move(1)}
          >
            <span aria-hidden="true">&#8594;</span>
          </button>
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs uppercase tracking-[0.18em] text-peach">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
      ) : null}
    </>
  );
}
