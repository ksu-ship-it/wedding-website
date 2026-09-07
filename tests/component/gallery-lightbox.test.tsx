import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ImageAsset } from "@/content/types";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";

vi.mock("next/image", () => ({
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & {
      blurDataURL?: string;
      fill?: boolean;
      placeholder?: string;
    },
  ) => {
    const imageProps = { ...props };
    const alt = imageProps.alt;
    const src = imageProps.src;
    delete imageProps.blurDataURL;
    delete imageProps.fill;
    delete imageProps.placeholder;
    return <span role="img" aria-label={alt} data-src={src} />;
  },
}));

const images: ImageAsset[] = [
  {
    id: "one",
    src: "/one.svg",
    mobileSrc: "/one-mobile.svg",
    alt: "First image",
    caption: "First",
    width: 1000,
    height: 1000,
    blurDataURL: "data:image/gif;base64,AA==",
    slot: "gallerySquare",
    aspectRatio: 1,
    role: "gallery",
    status: "approved",
    sourcePath: "/images/gallery/one.svg",
  },
  {
    id: "two",
    src: "/two.svg",
    mobileSrc: "/two-mobile.svg",
    alt: "Second image",
    caption: "Second",
    width: 1000,
    height: 1000,
    blurDataURL: "data:image/gif;base64,AA==",
    slot: "gallerySquare",
    aspectRatio: 1,
    role: "gallery",
    status: "approved",
    sourcePath: "/images/gallery/two.svg",
  },
];

describe("GalleryLightbox", () => {
  it("keeps gallery images non-interactive", () => {
    render(<GalleryLightbox images={images} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open First" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous gallery image" })).toBeDisabled();
  });

  it("keeps mobile gallery navigation available", () => {
    render(<GalleryLightbox images={images} />);
    fireEvent.click(screen.getByRole("button", { name: "Next gallery image" }));
    expect(screen.getByRole("button", { name: "Previous gallery image" })).toBeEnabled();
  });
});
