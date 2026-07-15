import assert from "node:assert/strict";
import test from "node:test";
import { color, space } from "./index.js";

test("space tokens snap to 8pt grid (except 4px exception)", () => {
  assert.equal(space[2], 8);
  assert.equal(space[4], 16);
  assert.equal(space[1], 4);
});

test("accent exists for primary actions", () => {
  assert.ok(color.accent.startsWith("#"));
});
