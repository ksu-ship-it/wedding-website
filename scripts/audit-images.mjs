import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "content");
const imageRecords = [];
const temporaryNamePattern = /(placeholder|dummy|sample|temporary|temp)/i;
const requiredFields = [
  "src",
  "mobileSrc",
  "alt",
  "caption",
  "width",
  "height",
  "blurDataURL",
  "slot",
  "aspectRatio",
  "role",
  "status",
  "sourcePath",
];

function getProperty(object, name) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === name,
  );

  return property && ts.isPropertyAssignment(property) ? property.initializer : undefined;
}

function getLiteralValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isBinaryExpression(node)) {
    const left = getLiteralValue(node.left);
    const right = getLiteralValue(node.right);
    if (typeof left === "number" && typeof right === "number") {
      if (node.operatorToken.kind === ts.SyntaxKind.SlashToken) return left / right;
      if (node.operatorToken.kind === ts.SyntaxKind.AsteriskToken) return left * right;
    }
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return undefined;
}

function collectImageRecords(node) {
  if (ts.isObjectLiteralExpression(node) && getProperty(node, "src")) {
    const record = Object.fromEntries(
      requiredFields.map((field) => [field, getLiteralValue(getProperty(node, field))]),
    );
    if (record.src !== undefined || record.sourcePath !== undefined) {
      imageRecords.push(record);
    }
  }

  ts.forEachChild(node, collectImageRecords);
}

for (const fileName of fs.readdirSync(contentDir)) {
  if (!fileName.endsWith(".ts")) continue;
  const sourcePath = path.join(contentDir, fileName);
  const source = fs.readFileSync(sourcePath, "utf8");
  collectImageRecords(ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true));
}

const errors = [];

for (const record of imageRecords) {
  const label = record.id ?? record.src ?? "unnamed image";
  const missingFields = requiredFields.filter((field) => record[field] === undefined || record[field] === "");
  if (missingFields.length > 0) {
    errors.push(`${label}: missing metadata: ${missingFields.join(", ")}`);
    continue;
  }

  if (record.status !== "approved") errors.push(`${label}: status must be approved`);
  if (record.role !== "hero" && record.role !== "story" && record.role !== "gallery") {
    errors.push(`${label}: invalid role '${record.role}'`);
  }

  for (const field of ["src", "mobileSrc", "sourcePath"]) {
    const imagePath = record[field];
    if (!imagePath.startsWith("/images/")) {
      errors.push(`${label}: ${field} must be under /images/`);
      continue;
    }

    const expectedFolder = `/images/${record.role}/`;
    if (!imagePath.startsWith(expectedFolder)) {
      errors.push(`${label}: ${field} is outside ${expectedFolder}`);
    }
    if (temporaryNamePattern.test(path.basename(imagePath))) {
      errors.push(`${label}: ${field} uses a temporary filename`);
    }
    if (!fs.existsSync(path.join(root, "public", imagePath.slice(1)))) {
      errors.push(`${label}: missing file ${imagePath}`);
    }
  }

  if ((record.role === "story" || record.role === "gallery") && !record.caption) {
    errors.push(`${label}: story and gallery images require captions`);
  }
  if (record.width <= 0 || record.height <= 0 || record.aspectRatio <= 0) {
    errors.push(`${label}: dimensions and aspect ratio must be positive`);
  }
}

for (const role of ["hero", "story", "gallery"]) {
  const roleDir = path.join(root, "public", "images", role);
  for (const fileName of fs.readdirSync(roleDir)) {
    if (temporaryNamePattern.test(fileName)) {
      errors.push(`${role}: temporary asset filename ${fileName}`);
    }
  }
}

const galleryDir = path.join(root, "public", "images", "gallery");
const galleryDesktopAssets = fs
  .readdirSync(galleryDir)
  .filter((fileName) => /^gallery-.+\.webp$/i.test(fileName) && !/-mobile\.webp$/i.test(fileName));

if (galleryDesktopAssets.length !== 18) {
  errors.push(`gallery: expected 18 approved desktop assets, found ${galleryDesktopAssets.length}`);
}

for (const desktopAsset of galleryDesktopAssets) {
  const mobileAsset = desktopAsset.replace(/\.webp$/i, "-mobile.webp");
  if (!fs.existsSync(path.join(galleryDir, mobileAsset))) {
    errors.push(`gallery: missing mobile derivative ${mobileAsset}`);
  }
}

if (errors.length > 0) {
  console.error("Image audit failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Image audit passed: ${imageRecords.length} approved role records and ${galleryDesktopAssets.length} gallery image pairs have complete metadata.`);
