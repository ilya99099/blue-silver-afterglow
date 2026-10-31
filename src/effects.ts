import type { Point } from "./pose";
import type { MPMask } from "@mediapipe/tasks-vision";
export const connections = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  w: number,
  h: number,
  mirror: boolean,
) {
  const xy = (p: Point) => [(mirror ? 1 - p.x : p.x) * w, p.y * h];
  ctx.save();
  ctx.strokeStyle = "#85e9ff";
  ctx.fillStyle = "#efffff";
  ctx.lineWidth = 2;
  for (const [a, b] of connections) {
    if (
      (points[a]?.visibility ?? 0) < 0.55 ||
      (points[b]?.visibility ?? 0) < 0.55
    )
      continue;
    const [ax, ay] = xy(points[a]),
      [bx, by] = xy(points[b]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  for (const p of points) {
    if ((p.visibility ?? 0) < 0.55) continue;
    const [x, y] = xy(p);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function drawCompass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phase: number,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.28);
  ctx.rotate(phase);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#8deeff";
  ctx.shadowColor = "#31caff";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  for (const r of [radius, radius * 0.94, radius * 0.78, radius * 0.22]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(radius * 0.26, 0);
    ctx.lineTo(radius * 0.76, -radius * 0.13);
    ctx.lineTo(radius * 0.63, 0);
    ctx.lineTo(radius * 0.76, radius * 0.13);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(radius * 0.82, 0);
    ctx.lineTo(radius * 0.94, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
/** A procedural body silhouette, captured from the activation pose without camera pixels. */
function createAfterimage(points: Point[], aspect: number): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = 640;
  sprite.height = Math.round(640 / aspect);
  const ctx = sprite.getContext("2d")!;
  const fallback: Record<number, [number, number]> = {
    0: [0.5, 0.29],
    11: [0.44, 0.38],
    12: [0.56, 0.38],
    13: [0.38, 0.49],
    14: [0.65, 0.43],
    15: [0.43, 0.55],
    16: [0.65, 0.32],
    23: [0.45, 0.59],
    24: [0.55, 0.59],
    25: [0.36, 0.65],
    26: [0.64, 0.65],
    27: [0.34, 0.83],
    28: [0.66, 0.83],
  };
  const xy = (i: number): [number, number] => {
    const p = points[i];
    return p
      ? [p.x * 640, p.y * sprite.height]
      : [fallback[i][0] * 640, fallback[i][1] * sprite.height];
  };
  const shoulderWidth = Math.max(28, Math.abs(xy(11)[0] - xy(12)[0]));
  ctx.fillStyle = "#c9003e";
  ctx.strokeStyle = "#c9003e";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "#ff064e";
  ctx.shadowBlur = 16;
  // Filled torso and thick joint chains produce a human shape, rather than a stick figure.
  ctx.beginPath();
  ctx.moveTo(...xy(11));
  for (const i of [12, 24, 23]) ctx.lineTo(...xy(i));
  ctx.closePath();
  ctx.fill();
  for (const [chain, thickness] of [
    [[11, 13, 15], 0.24],
    [[12, 14, 16], 0.24],
    [[23, 25, 27], 0.36],
    [[24, 26, 28], 0.36],
  ] as const) {
    ctx.lineWidth = shoulderWidth * thickness;
    ctx.beginPath();
    ctx.moveTo(...xy(chain[0]));
    for (const i of chain.slice(1)) ctx.lineTo(...xy(i));
    ctx.stroke();
  }
  const head = xy(0);
  const neck: [number, number] = [
    (xy(11)[0] + xy(12)[0]) / 2,
    (xy(11)[1] + xy(12)[1]) / 2,
  ];
  ctx.lineWidth = shoulderWidth * 0.3;
  ctx.beginPath();
  ctx.moveTo(...head);
  ctx.lineTo(...neck);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    head[0],
    head[1] - shoulderWidth * 0.1,
    shoulderWidth * 0.29,
    shoulderWidth * 0.38,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  for (const i of [27, 28]) {
    const [x, y] = xy(i);
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      shoulderWidth * 0.25,
      shoulderWidth * 0.12,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // The raised palm is stylized; finger configuration is not inferred by the pose model.
  const hand = xy(xy(15)[1] < xy(16)[1] ? 15 : 16);
  ctx.beginPath();
  ctx.ellipse(
    hand[0],
    hand[1],
    shoulderWidth * 0.13,
    shoulderWidth * 0.18,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.lineWidth = shoulderWidth * 0.045;
  for (let i = 0; i < 4; i++) {
    const x = hand[0] + (i - 1.5) * shoulderWidth * 0.065;
    ctx.beginPath();
    ctx.moveTo(x, hand[1]);
    ctx.lineTo(
      x + (i - 1.5) * 2,
      hand[1] - shoulderWidth * (0.25 + (i % 3) * 0.025),
    );
    ctx.stroke();
  }
  return sprite;
}

export type Afterimage = {
  canvas: HTMLCanvasElement;
  bounds: { x: number; y: number; width: number; height: number };
};

/** Crop transparent space once; placement can then use the actual person's width. */
function cropAfterimage(source: HTMLCanvasElement): Afterimage | null {
  const ctx = source.getContext("2d")!;
  const { width, height } = source;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 80) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  if (right <= left || bottom <= top) return null;
  const cropped = document.createElement("canvas");
  cropped.width = right - left + 1;
  cropped.height = bottom - top + 1;
  cropped
    .getContext("2d")!
    .drawImage(
      source,
      left,
      top,
      cropped.width,
      cropped.height,
      0,
      0,
      cropped.width,
      cropped.height,
    );
  return {
    canvas: cropped,
    bounds: {
      x: left / width,
      y: top / height,
      width: cropped.width / width,
      height: cropped.height / height,
    },
  };
}

/** Read camera pixels only at activation. Keep clothing and face shading inside the person mask. */
export function captureAfterimage(
  video: HTMLVideoElement,
  mask: MPMask,
  mirror: boolean,
): Afterimage | null {
  const source = document.createElement("canvas");
  source.width = mask.width;
  source.height = mask.height;
  const ctx = source.getContext("2d")!;
  ctx.drawImage(video, 0, 0, source.width, source.height);
  const frame = ctx.getImageData(0, 0, source.width, source.height);
  const confidence = mask.getAsFloat32Array();
  for (let i = 0; i < confidence.length; i++) {
    const offset = i * 4;
    const luminance =
      (frame.data[offset] * 0.2126 +
        frame.data[offset + 1] * 0.7152 +
        frame.data[offset + 2] * 0.0722) /
      255;
    // Saturated crimson preserves enough light/dark detail to read as a real human copy.
    frame.data[offset] = 95 + Math.round(luminance * 160);
    frame.data[offset + 1] = Math.round(luminance * 14);
    frame.data[offset + 2] = 28 + Math.round(luminance * 40);
    frame.data[offset + 3] = Math.round(
      Math.max(0, Math.min(1, (confidence[i] - 0.4) / 0.35)) * 255,
    );
  }
  ctx.putImageData(frame, 0, 0);
  if (!mirror) return cropAfterimage(source);
  const flipped = document.createElement("canvas");
  flipped.width = source.width;
  flipped.height = source.height;
  const target = flipped.getContext("2d")!;
  target.translate(source.width, 0);
  target.scale(-1, 1);
  target.drawImage(source, 0, 0);
  return cropAfterimage(flipped);
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

export class Effects {
  private started = -Infinity;
  private anchor = { x: 0.5, y: 0.84, radius: 0.34 };
  private afterimage: Afterimage | null = null;
  readonly duration = 4800;

  trigger(
    now: number,
    points: Point[],
    mirror: boolean,
    aspect = 16 / 9,
    captured?: Afterimage | null,
  ) {
    this.started = now;
    this.anchor = { x: 0.5, y: 0.84, radius: 0.34 };
    const displayed = points.map((p) => ({ ...p, x: mirror ? 1 - p.x : p.x }));
    // Only the camera-free preview uses an illustrated sample. Never substitute it for a missing person mask.
    this.afterimage =
      captured === undefined
        ? cropAfterimage(createAfterimage(displayed, aspect))
        : captured;
    if (displayed[27] && displayed[28]) {
      this.anchor = {
        x: (displayed[27].x + displayed[28].x) / 2,
        y: Math.min(0.94, Math.max(displayed[27].y, displayed[28].y)),
        radius: Math.max(
          0.22,
          Math.min(0.43, Math.abs(displayed[27].x - displayed[28].x) * 1.25),
        ),
      };
    }
  }

  clear() {
    this.started = -Infinity;
    this.afterimage = null;
  }
  active(now: number) {
    return now - this.started < this.duration;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    reduced: boolean,
  ) {
    const elapsed = now - this.started;
    if (elapsed < 0) return;
    if (elapsed > this.duration) {
      this.afterimage = null;
      return;
    }
    const summon = ease(elapsed / 650);
    const power = ease((elapsed - 650) / 650);
    const fade = 1 - ease((elapsed - 3600) / 1200);
    const strength = summon * fade;
    const x = this.anchor.x * w,
      y = this.anchor.y * h,
      r = this.anchor.radius * w;

    ctx.save();
    // The reference builds from a faint ground sigil to a dark blue arena.
    const vignette = ctx.createRadialGradient(
      x,
      h * 0.5,
      h * 0.12,
      x,
      h * 0.5,
      Math.max(w, h) * 0.7,
    );
    vignette.addColorStop(0, `rgba(10,30,78,${power * fade * 0.12})`);
    vignette.addColorStop(1, `rgba(2,12,57,${power * fade * 0.8})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    const aura = ctx.createRadialGradient(x, y, 0, x, y, r);
    aura.addColorStop(0, `rgba(53,175,255,${strength * 0.2})`);
    aura.addColorStop(1, "rgba(25,105,255,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
    drawCompass(
      ctx,
      x,
      y,
      r * (0.92 + summon * 0.08),
      reduced ? 0 : elapsed * 0.000025,
      strength,
    );
    drawCompass(ctx, x, y, r * 1.055, 0, strength * 0.35);

    if (this.afterimage) {
      const { canvas: sprite, bounds } = this.afterimage;
      const bodyLeft = bounds.x * w,
        bodyRight = (bounds.x + bounds.width) * w;
      const bodyWidth = bounds.width * w,
        bodyHeight = bounds.height * h;
      const gap = Math.max(18, w * 0.035);
      const scale = 0.92;
      const cloneWidth = bodyWidth * scale,
        cloneHeight = bodyHeight * scale;
      const floor = (bounds.y + bounds.height) * h;
      for (const side of [-1, 1]) {
        // Place copies outside the real person's entire outline, including outstretched arms.
        const outward = reduced ? 0 : power * w * 0.012;
        const left =
          side < 0
            ? bodyLeft - gap - cloneWidth - outward
            : bodyRight + gap + outward;
        ctx.save();
        // Keep the center clear even when the user stands close to the camera.
        ctx.beginPath();
        if (side < 0) ctx.rect(0, 0, Math.max(0, bodyLeft - gap / 2), h);
        else
          ctx.rect(
            bodyRight + gap / 2,
            0,
            Math.max(0, w - bodyRight - gap / 2),
            h,
          );
        ctx.clip();
        ctx.globalAlpha = strength * 0.22;
        ctx.shadowColor = "#ff064e";
        ctx.shadowBlur = 24;
        ctx.drawImage(
          sprite,
          left + side * 8,
          floor - cloneHeight - 3,
          cloneWidth,
          cloneHeight,
        );
        ctx.globalAlpha = strength * (0.3 + power * 0.65);
        ctx.shadowBlur = 12;
        ctx.drawImage(
          sprite,
          left,
          floor - cloneHeight,
          cloneWidth,
          cloneHeight,
        );
        ctx.restore();
      }
    }

    ctx.globalCompositeOperation = "lighter";
    const time = reduced ? 900 : elapsed;
    for (let i = 0; i < 44; i++) {
      const px = ((i * 0.61803398875) % 1) * w;
      const py = ((((i * 0.381966 + 1 - time * 0.00011) % 1) + 1) % 1) * h;
      const red = i % 3 === 0;
      ctx.strokeStyle = red ? "#ff1a62" : "#55caff";
      ctx.globalAlpha = strength * (0.12 + (i % 5) * 0.05) * (red ? power : 1);
      ctx.lineWidth = i % 4 === 0 ? 1.6 : 0.7;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - h * (0.1 + (i % 4) * 0.08));
      ctx.stroke();
      if (i % 3 === 0) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = "#d3f8ff";
        ctx.globalAlpha = strength * 0.65;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = "source-over";

    // Title arrives after the floor pattern and silhouettes, matching the reference rhythm.
    ctx.globalAlpha = power * fade;
    ctx.textAlign = "center";
    ctx.fillStyle = "#e3fbff";
    ctx.shadowColor = "#4ddaff";
    ctx.shadowBlur = 18;
    ctx.font = `600 ${Math.max(25, Math.min(50, w * 0.065))}px "Kaiti SC", "STKaiti", "Noto Serif CJK JP", serif`;
    const titleY = h * 0.13;
    ctx.fillText("青銀亂殘光", w / 2, titleY);
    const line = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
    line.addColorStop(0, "transparent");
    line.addColorStop(0.5, "#90efff");
    line.addColorStop(1, "transparent");
    ctx.fillStyle = line;
    ctx.fillRect(w * 0.2, titleY + h * 0.027, w * 0.6, 1.5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#b9e4ff";
    ctx.font = `500 ${Math.max(8, w * 0.011)}px sans-serif`;
    ctx.fillText("DESTRUCTIVE DEATH · FINAL FORM", w / 2, titleY + h * 0.075);
    ctx.restore();
  }
}
