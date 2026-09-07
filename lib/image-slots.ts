import type { ImageProps } from "next/image";

import type { ImageAsset, ImageSlot } from "@/content/types";

export type ImageSlotContract = {
  mobileRatio: string;
  desktopRatio: string;
  aspectClassName: string;
};

const slotContracts: Record<ImageSlot, ImageSlotContract> = {
  hero: { mobileRatio: "4:5", desktopRatio: "16:9", aspectClassName: "aspect-[4/5] md:aspect-[16/9]" },
  storyPortrait: { mobileRatio: "4:5", desktopRatio: "3:4", aspectClassName: "aspect-[4/5] md:aspect-[3/4]" },
  storyLandscape: { mobileRatio: "4:3", desktopRatio: "3:2", aspectClassName: "aspect-[4/3] md:aspect-[3/2]" },
  galleryPortrait: { mobileRatio: "4:5", desktopRatio: "2:3", aspectClassName: "aspect-[4/5] md:aspect-[2/3]" },
  galleryLandscape: { mobileRatio: "4:3", desktopRatio: "3:2", aspectClassName: "aspect-[4/3] md:aspect-[3/2]" },
  gallerySquare: { mobileRatio: "1:1", desktopRatio: "1:1", aspectClassName: "aspect-square" },
};

export function getImageSlotContract(slot: ImageSlot) {
  return slotContracts[slot];
}

export function validateImageAsset(asset: ImageAsset) {
  return Boolean(
    asset.src &&
      asset.mobileSrc &&
      asset.alt &&
      asset.width > 0 &&
      asset.height > 0 &&
      asset.blurDataURL &&
      asset.aspectRatio > 0,
  );
}

export function getResponsiveImageProps(
  asset: ImageAsset,
  sizes: string,
): Pick<ImageProps, "src" | "width" | "height" | "placeholder" | "blurDataURL" | "sizes"> & {
  "data-mobile-src": string;
} {
  if (!validateImageAsset(asset)) {
    throw new Error(`Invalid image asset: ${asset.id}`);
  }

  return {
    src: asset.src,
    width: asset.width,
    height: asset.height,
    placeholder: "blur",
    blurDataURL: asset.blurDataURL,
    sizes,
    "data-mobile-src": asset.mobileSrc,
  };
}

export function getResponsiveFillImageProps(
  asset: ImageAsset,
  sizes: string,
): Omit<ReturnType<typeof getResponsiveImageProps>, "width" | "height"> {
  const props = getResponsiveImageProps(asset, sizes);

  return {
    src: props.src,
    placeholder: props.placeholder,
    blurDataURL: props.blurDataURL,
    sizes: props.sizes,
    "data-mobile-src": props["data-mobile-src"],
  };
}
