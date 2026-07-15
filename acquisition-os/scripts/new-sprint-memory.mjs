#!/usr/bin/env node
/**
 * Scaffold the next sprint memory file from TEMPLATE.md
 * Usage: npm run memory:new -- <number> <slug>
 * Example: npm run memory:new -- 1 auth-sessions
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const memoryDir = path.join(root, "docs/project-memory");
const templatePath = path.join(memoryDir, "TEMPLATE.md");
const sprintsDir = path.join(memoryDir, "sprints");
const indexPath = path.join(memoryDir, "INDEX.md");

const [, , numArg, slugArg] = process.argv;
if (!numArg || !slugArg) {
  console.error("Usage: npm run memory:new -- <number> <slug>");
  process.exit(1);
}

const num = Number(numArg);
if (!Number.isInteger(num) || num < 0) {
  console.error("Sprint number must be a non-negative integer.");
  process.exit(1);
}

const slug = String(slugArg)
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  console.error("Slug must contain letters or numbers.");
  process.exit(1);
}

const padded = String(num).padStart(2, "0");
const fileName = `S${padded}-${slug}.md`;
const outPath = path.join(sprintsDir, fileName);

if (fs.existsSync(outPath)) {
  console.error(`Refusing to overwrite existing memory: ${fileName}`);
  process.exit(1);
}

let template = fs.readFileSync(templatePath, "utf8");
template = template
  .replaceAll("# Sprint NN — Title", `# Sprint ${padded} — ${slug}`)
  .replaceAll("**Sprint:** NN", `**Sprint:** ${padded}`)
  .replaceAll("**Codename / slug:** _(slug)_", `**Codename / slug:** ${slug}`)
  .replaceAll("**Status:** Draft | Complete", "**Status:** Draft")
  .replace(
    "> Copy this template to `sprints/SNN-slug.md`. Fill every section. Use `N/A` only when truly not applicable — never leave blank.\n\n",
    ""
  );

fs.mkdirSync(sprintsDir, { recursive: true });
fs.writeFileSync(outPath, template, "utf8");

const index = fs.readFileSync(indexPath, "utf8");
const row = `| ${padded} ${slug} | [${fileName}](./sprints/${fileName}) | Draft | _(fill on close)_ |`;
const marker = "## Next required read";
let updated = index;
if (updated.includes(marker)) {
  updated = updated.replace(`\n${marker}`, `\n${row}\n\n${marker}`);
} else {
  updated = `${updated.trimEnd()}\n${row}\n`;
}
updated = updated.replace(
  /## Next required read\n\nBefore Sprint \d+ begins:.*/,
  `## Next required read\n\nBefore the next sprint begins: complete and publish **${fileName}**, then set INDEX status to Complete.`
);
fs.writeFileSync(indexPath, updated, "utf8");

console.log(`Created ${path.relative(root, outPath)}`);
console.log("Fill all 17 sections before sprint close. Set INDEX status to Complete when done.");
