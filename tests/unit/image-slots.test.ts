import { describe, expect, it } from "vitest";

import { getImageSlotContract, getResponsiveImageProps, validateImageAsset } from "@/lib/image-slots";
import type { ImageAsset } from "@/content/types";

const validAsset: ImageAsset = {
  id: "test-image",
  src: "/images/test.svg",
  mobileSrc: "/images/test-mobile.svg",
  alt: "A test image",
  width: 1200,
  height: 900,
  blurDataURL: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
  slot: "galleryLandscape",
  aspectRatio: 4 / 3,
  role: "gallery",
  status: "approved",
  sourcePath: "/images/gallery/landscape.webp",
};

describe("image slot contracts", () => {
  it("exposes mobile and desktop ratios for each slot", () => {
    expect(getImageSlotContract("galleryPortrait")).toMatchObject({
      mobileRatio: "4:5",
      desktopRatio: "2:3",
    });
  });

  it("validates stable image metadata and builds responsive props", () => {
    expect(validateImageAsset(validAsset)).toBe(true);
    expect(getResponsiveImageProps(validAsset, "100vw")).toMatchObject({
      width: 1200,
      height: 900,
      placeholder: "blur",
      sizes: "100vw",
      "data-mobile-src": "/images/test-mobile.svg",
    });
  });

  it("rejects incomplete image metadata", () => {
    expect(validateImageAsset({ ...validAsset, alt: "", width: 0 })).toBe(false);
    expect(() => getResponsiveImageProps({ ...validAsset, blurDataURL: "" }, "100vw")).toThrow(
      "Invalid image asset",
    );
  });
});
