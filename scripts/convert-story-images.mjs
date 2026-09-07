import fs from "node:fs/promises";
import path from "node:path";
import convert from "heic-convert";
import sharp from "sharp";

const storyDirectory = path.resolve("public/images/story");
const sourceFiles = [
  "college-visits.heic",
  "first-home.heic",
  "highschool-graduation.heic",
  "traveling-the-world.heic",
];

for (const sourceFile of sourceFiles) {
  const sourcePath = path.join(storyDirectory, sourceFile);
  const outputPath = path.join(storyDirectory, sourceFile.replace(/\.heic$/i, ".webp"));
  const sourceBuffer = await fs.readFile(sourcePath);
  const jpegBuffer = await convert({ buffer: sourceBuffer, format: "JPEG", quality: 0.9 });
  await sharp(jpegBuffer).rotate().webp({ quality: 84 }).toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  console.log(`${sourceFile} -> ${path.basename(outputPath)} (${metadata.width}x${metadata.height})`);
}
