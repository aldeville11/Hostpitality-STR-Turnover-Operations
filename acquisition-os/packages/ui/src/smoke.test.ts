import assert from "node:assert/strict";
import test from "node:test";
import { color } from "./index.js";

test("ui re-exports token accent", () => {
  assert.equal(typeof color.accent, "string");
});
