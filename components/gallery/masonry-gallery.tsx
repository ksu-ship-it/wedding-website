import type { ImageAsset } from "@/content/types";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";

type MasonryGalleryProps = {
  images: ImageAsset[];
};

export function MasonryGallery({ images }: MasonryGalleryProps) {
  return <GalleryLightbox images={images} />;
}
