import { test } from "node:test";
import assert from "node:assert/strict";
import { assessPose, PoseTrigger, type Point } from "./pose";
function pose(): Point[] {
  const p = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 1,
  }));
  const coords: Record<number, number[]> = {
    11: [0.43, 0.3],
    12: [0.57, 0.3],
    13: [0.36, 0.45],
    14: [0.66, 0.39],
    15: [0.43, 0.49],
    16: [0.63, 0.26],
    23: [0.44, 0.53],
    24: [0.56, 0.53],
    25: [0.34, 0.59],
    26: [0.66, 0.59],
    27: [0.33, 0.82],
    28: [0.67, 0.82],
  };
  for (const [i, [x, y]] of Object.entries(coords))
    p[+i] = { x, y, visibility: 1 };
  return p;
}
test("reference-like stance matches in either mirrored orientation", () => {
  const p = pose();
  assert.equal(assessPose(p).match, true);
  assert.equal(assessPose(p.map((v) => ({ ...v, x: 1 - v.x }))).match, true);
});
test("missing or low-confidence landmarks and partial framing fail safely", () => {
  assert.equal(assessPose([]).visible, false);
  for (const patch of [{ visibility: 0.1 }, { x: 1.1 }, { y: NaN }]) {
    const p = pose();
    p[27] = { ...p[27], ...patch };
    assert.equal(assessPose(p).match, false);
  }
});
test("straight legs, narrow feet and both hands raised do not match", () => {
  let p = pose();
  p[25] = { ...p[25], x: 0.44 };
  p[27] = { ...p[27], x: 0.44 };
  p[26] = { ...p[26], x: 0.56 };
  p[28] = { ...p[28], x: 0.56 };
  assert.equal(assessPose(p).match, false);
  p = pose();
  p[27].x = 0.49;
  p[28].x = 0.51;
  assert.equal(assessPose(p).checks[1].passed, false);
  p = pose();
  p[15].y = 0.26;
  assert.equal(assessPose(p).match, false);
});
test("image aspect changes preserve physical angles when x coordinates are adjusted", () => {
  const p = pose();
  assert.equal(
    assessPose(p, 16 / 9).match,
    assessPose(
      p.map((v) => ({ ...v, x: 0.5 + ((v.x - 0.5) * 16) / 9 })),
      1,
    ).match,
  );
});
test("holds continuously, fires once, then requires release before rearming", () => {
  const t = new PoseTrigger();
  for (let n = 0; n < 700; n += 100)
    assert.equal(t.update(true, n).fired, false);
  assert.equal(t.update(true, 700).fired, true);
  assert.equal(t.update(true, 800).fired, false);
  for (let n = 900; n <= 1400; n += 100) t.update(false, n);
  for (let n = 1500; n < 2200; n += 100)
    assert.equal(t.update(true, n).fired, false);
  assert.equal(t.update(true, 2200).fired, true);
});
test("a missing observation resets hold and a stalled stream cannot trigger", () => {
  const t = new PoseTrigger();
  t.update(true, 0);
  t.update(true, 200);
  t.update(false, 300);
  assert.equal(t.update(true, 400).progress, 0);
  assert.equal(t.update(true, 2000).fired, false);
  assert.equal(t.update(true, 2000).progress, 0);
  t.reset();
  assert.equal(t.update(true, 2100).progress, 0);
});
