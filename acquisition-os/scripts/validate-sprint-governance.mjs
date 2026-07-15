#!/usr/bin/env node
/**
 * Engineering Law 001 — checklist + COMPLETE gate automation.
 *
 * Commands (via package.json):
 *   npm run governance:checklist:init -- <N> <slug>
 *   npm run governance:pre-sprint -- <N>
 *   npm run governance:close -- <N>
 *
 * Exit 0 = pass. Exit 1 = STOP (do not implement / do not mark COMPLETE).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const engineering = path.join(root, "docs/engineering");
const checklistsDir = path.join(engineering, "checklists");
const sprintChecklists = path.join(checklistsDir, "sprints");
const memoryIndex = path.join(root, "docs/project-memory/INDEX.md");
const memorySprints = path.join(root, "docs/project-memory/sprints");
const retrospectives = path.join(engineering, "retrospectives");
const scorecards = path.join(engineering, "scorecards");

const [, , mode, numArg, slugArg] = process.argv;

function fail(msg) {
  console.error(`governance: FAIL — ${msg}`);
  console.error("STOP per ENGINEERING_LAWS.md (Law 001).");
  process.exit(1);
}

function ok(msg) {
  console.log(`governance: PASS — ${msg}`);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseSprintNum(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) fail("Sprint number must be a non-negative integer.");
  return n;
}

/** Returns { total, checked, unchecked } for GitHub task-list items. */
function analyzeCheckboxes(markdown) {
  const lines = markdown.split(/\r?\n/);
  let checked = 0;
  let unchecked = 0;
  for (const line of lines) {
    if (/^\s*- \[x\]/i.test(line)) checked += 1;
    else if (/^\s*- \[ \]/i.test(line)) unchecked += 1;
  }
  return { total: checked + unchecked, checked, unchecked };
}

function requireAllChecked(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} missing: ${path.relative(root, filePath)}`);
  }
  const md = fs.readFileSync(filePath, "utf8");
  const { total, checked, unchecked } = analyzeCheckboxes(md);
  if (total === 0) fail(`${label} has no checklist items: ${path.relative(root, filePath)}`);
  if (unchecked > 0) {
    fail(
      `${label} incomplete (${checked}/${total} checked, ${unchecked} open): ${path.relative(root, filePath)}`
    );
  }
  ok(`${label} complete (${checked}/${total})`);
}

function previousSprintComplete(n) {
  if (n <= 0) return;
  if (!fs.existsSync(memoryIndex)) fail("project-memory INDEX.md missing");
  const index = fs.readFileSync(memoryIndex, "utf8");
  const prev = pad(n - 1);
  // Match a table row that references S{prev}- and status COMPLETE
  const rowRe = new RegExp(`\\|\\s*${prev}\\b[^|]*\\|[^|]*\\|\\s*\\*?\\*?COMPLETE\\*?\\*?\\s*\\|`, "i");
  if (!rowRe.test(index)) {
    fail(
      `Sprint ${prev} is not COMPLETE in INDEX.md — cannot start Sprint ${pad(n)} (Law 001)`
    );
  }
  ok(`Prior sprint ${prev} is COMPLETE in INDEX`);
}

function initChecklists(n, slug) {
  if (!slug) fail("Usage: governance:checklist:init -- <N> <slug>");
  const clean = String(slug)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!clean) fail("Invalid slug");

  fs.mkdirSync(sprintChecklists, { recursive: true });
  const p = pad(n);
  const preSrc = fs.readFileSync(path.join(checklistsDir, "PRE_SPRINT_CHECKLIST.md"), "utf8");
  const closeSrc = fs.readFileSync(path.join(checklistsDir, "SPRINT_CLOSE_CHECKLIST.md"), "utf8");

  const preOut = path.join(sprintChecklists, `S${p}-pre-sprint.md`);
  const closeOut = path.join(sprintChecklists, `S${p}-close.md`);
  if (fs.existsSync(preOut) || fs.existsSync(closeOut)) {
    fail(`Checklist already exists for S${p} — refusing overwrite`);
  }

  const stamp = (src) =>
    src
      .replace(/# Sprint __ —/g, `# Sprint ${p} —`)
      .replace(/\*\*Sprint number:\*\* __/, `**Sprint number:** ${p}`)
      .replace(/\*\*Slug:\*\* __/, `**Slug:** ${clean}`);

  // Keep only the instance body after the first "# Sprint"
  const body = (src) => {
    const idx = src.indexOf("# Sprint __");
    return stamp(idx >= 0 ? src.slice(idx) : src);
  };

  fs.writeFileSync(preOut, body(preSrc), "utf8");
  fs.writeFileSync(closeOut, body(closeSrc), "utf8");
  ok(`Wrote ${path.relative(root, preOut)}`);
  ok(`Wrote ${path.relative(root, closeOut)}`);
  console.log("Check every - [ ] to - [x], then run governance:pre-sprint / governance:close.");
}

function preSprint(n) {
  previousSprintComplete(n);
  const p = pad(n);
  requireAllChecked(path.join(sprintChecklists, `S${p}-pre-sprint.md`), `Pre-sprint checklist S${p}`);
  ok(`Sprint ${p} pre-sprint gate clear — implementation may begin (in-scope only)`);
}

function closeSprint(n) {
  const p = pad(n);
  requireAllChecked(path.join(sprintChecklists, `S${p}-close.md`), `Sprint-close checklist S${p}`);

  const memoryFiles = fs.existsSync(memorySprints)
    ? fs.readdirSync(memorySprints).filter((f) => f.startsWith(`S${p}-`) && f.endsWith(".md"))
    : [];
  if (memoryFiles.length === 0) fail(`No project memory file matching S${p}-*.md`);
  ok(`Memory present: ${memoryFiles.join(", ")}`);

  const retro = path.join(retrospectives, `S${p}-retrospective.md`);
  if (!fs.existsSync(retro)) fail(`Retrospective missing: ${path.relative(root, retro)}`);
  ok("Retrospective present");

  const score = path.join(scorecards, `S${p}-scorecard.md`);
  if (!fs.existsSync(score)) fail(`Scorecard missing: ${path.relative(root, score)}`);
  ok("Scorecard present");

  console.log("");
  console.log(`governance: Sprint ${p} may transition to COMPLETE.`);
  console.log("Update INDEX.md + sprint memory Status to COMPLETE only after this pass.");
  ok(`Sprint ${p} close gate clear`);
}

if (mode === "init" || mode === "checklist:init") {
  initChecklists(parseSprintNum(numArg), slugArg);
} else if (mode === "pre-sprint") {
  preSprint(parseSprintNum(numArg));
} else if (mode === "close") {
  closeSprint(parseSprintNum(numArg));
} else {
  console.error(`Usage:
  node scripts/validate-sprint-governance.mjs init <N> <slug>
  node scripts/validate-sprint-governance.mjs pre-sprint <N>
  node scripts/validate-sprint-governance.mjs close <N>`);
  process.exit(1);
}
