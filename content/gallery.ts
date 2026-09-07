import type { ImageAsset } from "./types";

const blurDataURL = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

const galleryRecords = [
  ["gallery-164508", "gallery-164508-4x6", "The couple sharing a relaxed moment outdoors", "A quiet moment in the open air.", 1600, 1067, "galleryLandscape", 1600 / 1067],
  ["gallery-165325", "gallery-165325-16x9", "The couple together in a wide scenic landscape", "The view is always better together.", 1600, 900, "galleryLandscape", 16 / 9],
  ["gallery-170041", "gallery-170041-4x6", "The couple in a tall outdoor portrait", "One of the days we will remember forever.", 1600, 2400, "galleryPortrait", 2 / 3],
  ["gallery-170654", "gallery-170654-4x6", "The couple enjoying an outdoor afternoon together", "An afternoon made for wandering.", 1600, 1067, "galleryLandscape", 3 / 2],
  ["gallery-170739", "gallery-170739-4x6", "The couple smiling together outside", "The smiles that say everything.", 1600, 1067, "galleryLandscape", 3 / 2],
  ["gallery-171516", "gallery-171516-4x6", "The couple standing together in a sunny outdoor setting", "Sunlight, laughter, and us.", 1600, 1067, "galleryLandscape", 3 / 2],
  ["gallery-172337", "gallery-172337-4x6", "The couple sharing a tall portrait outdoors", "A little space, a lot of joy.", 1600, 2400, "galleryPortrait", 2 / 3],
  ["gallery-202309", "gallery-202309-4x6", "The couple together in a scenic romantic setting", "The beginning of forever.", 1600, 1066, "galleryLandscape", 3 / 2],
  ["gallery-20260725-163206", "gallery-20260725-163206", "The couple captured in a vertical outdoor portrait", "A day worth holding onto.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-20260725-163735", "gallery-20260725-163735", "The couple together in a vertical portrait", "The world feels close when we are together.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-20260725-164748", "gallery-20260725-164748", "The couple smiling together in a vertical outdoor portrait", "The kind of joy that stays with us.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-20260725-170935", "gallery-20260725-170935", "The couple together in a bright vertical portrait", "A bright little chapter in our story.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-20260727-185926", "gallery-20260727-185926", "The couple in a tall portrait outside", "A portrait of the life we are building.", 1531, 2400, "galleryPortrait", 1531 / 2400],
  ["gallery-20260727-191420", "gallery-20260727-191420", "The couple together in a vertical portrait", "Another memory to carry forward.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-20260727-191745", "gallery-20260727-191745-1", "The couple sharing a joyful outdoor moment", "The joy is in the details.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-20260727-193104", "gallery-20260727-193104", "The couple together in a tall outdoor portrait", "A moment that feels like home.", 1109, 2400, "galleryPortrait", 1109 / 2400],
  ["gallery-210410", "gallery-210410-4x6", "The couple sharing a tall outdoor portrait", "The long way brought us here.", 1600, 2400, "galleryPortrait", 2 / 3],
  ["gallery-img-4678", "gallery-img-4678", "The couple together in a wide outdoor photograph", "One more beautiful place to remember.", 1600, 1067, "galleryLandscape", 3 / 2],
] as const;

export const galleryImages = galleryRecords.map(([id, stem, alt, caption, width, height, slot, aspectRatio]) => ({
  id,
  src: `/images/gallery/${stem}.webp`,
  mobileSrc: `/images/gallery/${stem}-mobile.webp`,
  alt,
  caption,
  width,
  height,
  blurDataURL,
  slot,
  aspectRatio,
  role: "gallery" as const,
  status: "approved" as const,
  sourcePath: `/images/gallery/${stem}.webp`,
})) satisfies ImageAsset[];
