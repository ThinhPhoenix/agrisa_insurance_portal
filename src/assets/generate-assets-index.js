#!/usr/bin/env node

/**
 * Auto-generate assets index.js from all files in this directory and subdirectories
 *
 * ?Usage:
 *   node generate_assets_index.js
 *   (or: bun generate_assets_index.js)
 *
 * !Requirements:
 * - Run this script in the src/assets directory
 * - All asset files (images, sounds, videos, etc.) should be placed in this directory or its subfolders
 * - Asset files should not be named index.* or generate_assets_index.*
 * - The script will ignore .DS_Store and similar system files
 * - The generated index.js will export an Assets object with all assets imported and mapped by PascalCase name
 *
 * @example
 *   import Assets from './assets/index.js';
 *   Usage: Assets.VueSvg, Assets.NavMenuClickMp3, etc.
 *
 * @author ThinhPhoenix
 * @version 1.0.0
 */
const fs = require("fs");
const path = require("path");

const assetsDir = __dirname;
const indexPath = path.join(assetsDir, "index.js");

function toExportName(filePath) {
  let name = path.basename(filePath, path.extname(filePath));
  const rel = path.relative(assetsDir, filePath).split(path.sep);
  if (rel.length > 1) {
    name = rel.slice(0, -1).concat(name).join("_");
  }
  return name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (
      !file.startsWith("index.") &&
      !file.startsWith("generate-assets-index")
    ) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(assetsDir).filter((f) => !f.endsWith(".DS_Store"));

const importLines = files.map((f) => {
  const relPath = "./" + path.relative(assetsDir, f).replace(/\\/g, "/");
  const exportName = toExportName(f);
  return `import ${exportName} from '${relPath}';`;
});

const assetObjectLines = files.map((f) => {
  const exportName = toExportName(f);
  return `  ${exportName},`;
});

const output = [
  "//! ⚠️ THIS FILE IS AUTO-GENERATED. DO NOT EDIT DIRECTLY. RUN generate_index.js TO UPDATE. ⚠️",
  ...importLines,
  "",
  "const Assets = {",
  ...assetObjectLines,
  "};",
  "",
  "export default Assets;",
  "",
].join("\n");

fs.writeFileSync(indexPath, output);
