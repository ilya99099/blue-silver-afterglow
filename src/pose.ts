export type Point = { x: number; y: number; z?: number; visibility?: number };
export type PoseCheck = { label: string; passed: boolean };
export type Assessment = {
  visible: boolean;
  match: boolean;
  checks: PoseCheck[];
  hint: string;
};
const required = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function angle(a: Point, b: Point, c: Point): number {
  const ab = distance(a, b),
    cb = distance(c, b);
  if (ab * cb < 1e-8) return 180;
  const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
  return (
    (Math.acos(Math.max(-1, Math.min(1, dot / (ab * cb)))) * 180) / Math.PI
  );
}

/** Coordinates are normalized by image height to preserve angles on wide video. */
export function assessPose(points: Point[], aspect = 16 / 9): Assessment {
  const labels = [
    "Full body visible",
    "Wide stance",
    "Knees bent",
    "One hand raised",
    "Other hand at waist",
  ];
  const unavailable = (hint: string): Assessment => ({
    visible: false,
    match: false,
    hint,
    checks: labels.map((label) => ({ label, passed: false })),
  });
  if (
    !Number.isFinite(aspect) ||
    aspect <= 0 ||
    required.some((i) => {
      const p = points[i];
      return (
        !p ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        !Number.isFinite(p.visibility) ||
        p.visibility! < 0.55 ||
        p.x < 0.01 ||
        p.x > 0.99 ||
        p.y < 0.01 ||
        p.y > 0.99
      );
    })
  )
    return unavailable(
      "Step back so your shoulders, hands, knees, and feet are visible.",
    );
  const p = points.map((v) => ({ ...v, x: v.x * aspect }));
  const shoulders = distance(p[11], p[12]);
  const torso = distance(
    { x: (p[11].x + p[12].x) / 2, y: (p[11].y + p[12].y) / 2 },
    { x: (p[23].x + p[24].x) / 2, y: (p[23].y + p[24].y) / 2 },
  );
  if (shoulders < 0.04 || torso < 0.06)
    return unavailable("Face the camera with your whole body in frame.");
  const wide = Math.abs(p[27].x - p[28].x) > shoulders * 1.15;
  const knees =
    angle(p[23], p[25], p[27]) < 155 && angle(p[24], p[26], p[28]) < 155;
  const raised = (s: number, w: number) =>
    p[w].y < p[s].y + torso * 0.25 && p[w].y > p[s].y - torso * 0.85;
  const waist = (s: number, e: number, w: number, h: number) =>
    distance(p[w], p[h]) < torso * 0.65 && angle(p[s], p[e], p[w]) < 150;
  const leftRaised = raised(11, 15),
    rightRaised = raised(12, 16);
  const oneRaised = leftRaised !== rightRaised;
  const asymmetric =
    (leftRaised && !rightRaised && waist(12, 14, 16, 24)) ||
    (rightRaised && !leftRaised && waist(11, 13, 15, 23));
  const values = [true, wide, knees, oneRaised, asymmetric];
  const hints = [
    "",
    "Widen your stance.",
    "Lower into a squat and bend both knees.",
    "Extend one palm toward the camera at shoulder height.",
    "Keep your other hand close to your waist with the elbow bent.",
  ];
  const failed = values.findIndex((v) => !v);
  return {
    visible: true,
    match: failed < 0,
    checks: labels.map((label, i) => ({ label, passed: values[i] })),
    hint: failed < 0 ? "Hold steady — channel your energy." : hints[failed],
  };
}

export class PoseTrigger {
  private since: number | null = null;
  private released: number | null = null;
  private lastTime: number | null = null;
  private locked = false;
  constructor(
    readonly holdMs = 700,
    readonly releaseMs = 500,
  ) {}
  reset() {
    this.since = null;
    this.released = null;
    this.lastTime = null;
    this.locked = false;
  }
  update(match: boolean, now: number) {
    // Never count a suspended tab or stalled camera as continuous observation.
    if (
      this.lastTime !== null &&
      (now - this.lastTime > 300 || now < this.lastTime)
    ) {
      this.since = null;
      this.released = null;
    }
    this.lastTime = now;
    let fired = false;
    if (!match) {
      this.since = null;
      this.released ??= now;
      if (now - this.released >= this.releaseMs) this.locked = false;
    } else {
      this.released = null;
      if (!this.locked) {
        this.since ??= now;
        if (now - this.since >= this.holdMs) {
          this.locked = true;
          fired = true;
        }
      }
    }
    const progress = this.locked
      ? 1
      : this.since === null
        ? 0
        : Math.min(1, (now - this.since) / this.holdMs);
    return { fired, progress, locked: this.locked };
  }
}
