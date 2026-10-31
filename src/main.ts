import "./style.css";
import { openCamera, cameraError } from "./camera";
import { createTracker } from "./tracker";
import { assessPose, PoseTrigger, type Point } from "./pose";
import {
  drawCompass,
  drawSkeleton,
  Effects,
  captureAfterimage,
} from "./effects";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

const guide = `<svg viewBox="0 0 240 200" fill="none" aria-label="Wide squat with one hand raised" role="img"><ellipse cx="120" cy="178" rx="94" ry="15" stroke="currentColor" opacity=".25"/><circle cx="120" cy="40" r="16"/><path d="M109 59L96 104L145 104L133 59M109 62L79 84L83 111L99 102M134 64L157 80L171 48M101 105L68 128L57 168L78 171M141 105L168 128L181 168L161 172M171 49L166 30M171 49L172 24M174 49L180 28M176 51L187 36" stroke-linecap="round" stroke-linejoin="round"/><path d="M111 61H131"/></svg>`;
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<header><a class="brand" href="./"><span class="brand-mark">✳</span> AFTERGLOW <span class="brand-label">POSE LAB</span></a><span class="local-badge"><i></i> ON-DEVICE EXPERIENCE</span></header>
<main><section class="intro"><div><p class="eyebrow">DESTRUCTIVE DEATH / FINAL FORM</p><h1>Find your stance.<br><em>Unleash the afterglow.</em></h1></div><p class="intro-copy">A camera experiment inspired by Akaza.<br>Your movement becomes the effect.</p></section>
<div class="workspace"><section class="stage-panel" aria-label="Camera and effects"><div class="stage-top"><span><i id="live-dot"></i> <span id="camera-label">CAMERA OFF</span></span><span id="fps">LOCAL PROCESSING</span></div>
<div class="stage" id="stage"><video id="video" autoplay playsinline muted></video><canvas id="overlay" aria-hidden="true"></canvas><div id="idle"><div class="idle-symbol">✳</div><p>Enter the arena</p><span>Start your camera to bring the technique to life.</span></div><div id="countdown" role="status" aria-live="polite" hidden><strong id="countdown-number">3</strong><span>Step back and strike your pose</span></div><span id="preview-label" hidden>EFFECT PREVIEW · NO POSE DETECTION</span><div class="corners" aria-hidden="true"></div></div>
<div class="stage-bottom"><span id="status" role="status" aria-live="polite">Ready when you are.</span><span class="version">EXPERIMENT 001</span></div></section>
<aside><div class="instruction-top"><span class="eyebrow">THE TECHNIQUE</span><span class="number">01 / 01</span></div><h2>Blue Silver<br>Chaotic Afterglow</h2><div class="pose-guide">${guide}<span>Either side works</span></div><p class="instructions">Step back. Take a wide squat. Extend one open palm toward the camera and keep the other hand at your waist.</p><div id="checks" class="checks"></div><div class="hold-label"><span id="hold-label">HOLD THE POSE</span><span id="hold-value">0%</span></div><div class="progress"><div id="progress"></div></div><p class="hold-note">Hold for 0.7 seconds to activate.</p></aside></div>
<div class="controls"><div class="actions"><button id="start" class="primary">Start camera <span>↗</span></button><button id="stop" hidden>Stop camera</button><button id="preview">Preview effect <span>✧</span></button></div><div class="toggles"><label><input type="checkbox" id="debug"> Show landmarks</label><label><input type="checkbox" id="mirror" checked> Mirror</label><label><input type="checkbox" id="reduced"> Reduced motion</label></div></div><p id="error" role="alert" hidden></p>
<footer><span><span class="privacy-icon">◇</span> Camera frames stay in your browser. No video recording. No uploads.</span><span>POSE STUDY / AKAZA</span></footer><details><summary>About this prototype</summary><p>Body landmarks detect the stance and arm positions. Open-palm finger configuration is not verified yet. Thresholds need real-camera calibration. Preview effect tests graphics only.</p></details></main>`;
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const video = el<HTMLVideoElement>("video"),
  canvas = el<HTMLCanvasElement>("overlay"),
  stage = el("stage");
const ctx = canvas.getContext("2d")!;
const start = el<HTMLButtonElement>("start"),
  stop = el<HTMLButtonElement>("stop"),
  preview = el<HTMLButtonElement>("preview");
const debug = el<HTMLInputElement>("debug"),
  mirror = el<HTMLInputElement>("mirror"),
  reduced = el<HTMLInputElement>("reduced");
reduced.checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
let tracker: PoseLandmarker | null = null,
  stream: MediaStream | null = null,
  points: Point[] = [];
let session = 0,
  running = false,
  raf = 0,
  lastFrame = -1,
  lastInference = 0,
  lastSeen = 0,
  inferenceCount = 0,
  fpsStart = 0;
const trigger = new PoseTrigger(),
  effects = new Effects();
let previewRequested = false;
let previewDeadline: number | null = null;
function cancelPreview() {
  previewDeadline = null;
  previewRequested = false;
  el("countdown").hidden = true;
  preview.disabled = false;
  preview.innerHTML = "Preview effect <span>✧</span>";
}
function updateCountdown(now: number) {
  if (previewDeadline === null) return;
  const seconds = Math.ceil((previewDeadline - now) / 1000);
  if (seconds > 0) {
    el("countdown-number").textContent = String(seconds);
    return;
  }
  previewDeadline = null;
  el("countdown").hidden = true;
  if (running) {
    previewRequested = true;
    preview.textContent = "Capturing…";
  } else {
    effects.trigger(
      now,
      [],
      mirror.checked,
      stage.clientWidth / stage.clientHeight,
    );
    el("idle").hidden = true;
    el("preview-label").textContent =
      "EFFECT PREVIEW · ILLUSTRATED SAMPLE · START CAMERA FOR YOUR COPIES";
    el("preview-label").hidden = false;
    cancelPreview();
  }
}
function setStatus(text: string) {
  if (el("status").textContent !== text) el("status").textContent = text;
}
function resetChecks() {
  showAssessment(assessPose([]));
  setProgress(0);
}
function showAssessment(result: ReturnType<typeof assessPose>) {
  el("checks").innerHTML = result.checks
    .map(
      (c) =>
        `<div class="check ${c.passed ? "passed" : ""}"><span>${c.passed ? "✓" : "○"}</span>${c.label}</div>`,
    )
    .join("");
}
function setProgress(progress: number) {
  el("progress").style.width = `${progress * 100}%`;
  el("hold-value").textContent = `${Math.round(progress * 100)}%`;
}
function stopCamera() {
  session++;
  running = false;
  cancelPreview();
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  tracker?.close();
  tracker = null;
  video.pause();
  video.srcObject = null;
  points = [];
  trigger.reset();
  effects.clear();
  cancelAnimationFrame(raf);
  raf = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  start.disabled = false;
  start.hidden = false;
  start.innerHTML = "Start camera <span>↗</span>";
  stop.hidden = true;
  el("idle").hidden = false;
  el("preview-label").hidden = true;
  el("camera-label").textContent = "CAMERA OFF";
  el("live-dot").classList.remove("on");
  el("fps").textContent = "LOCAL PROCESSING";
  el("hold-label").textContent = "HOLD THE POSE";
  resetChecks();
  setStatus("Camera stopped.");
}
async function startCamera() {
  stopCamera();
  const current = session;
  start.disabled = true;
  start.textContent = "Starting…";
  stop.hidden = false;
  el("error").hidden = true;
  setStatus("Allow camera access to begin.");
  try {
    const opened = await openCamera();
    if (current !== session) {
      opened.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = opened;
    video.srcObject = stream;
    await video.play();
    if (current !== session) return;
    stage.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    el("idle").hidden = true;
    setStatus("Loading pose model…");
    el("camera-label").textContent = "LOADING MODEL";
    const model = await createTracker();
    if (current !== session) {
      model.close();
      return;
    }
    tracker = model;
    running = true;
    start.hidden = true;
    stop.hidden = false;
    el("camera-label").textContent = "CAMERA LIVE";
    el("live-dot").classList.add("on");
    lastFrame = -1;
    lastInference = 0;
    lastSeen = performance.now();
    fpsStart = lastSeen;
    inferenceCount = 0;
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      if (current === session) {
        stopCamera();
        setStatus("Camera disconnected. Reconnect and try again.");
      }
    });
    setStatus("Step back until your whole body is visible.");
    schedule();
  } catch (error) {
    if (current !== session) return;
    stopCamera();
    el("error").textContent =
      `${cameraError(error)} If the model failed to load, check that setup:assets completed.`;
    el("error").hidden = false;
    setStatus("Unable to start. See the message below.");
  }
}
function schedule() {
  if (!raf) raf = requestAnimationFrame(render);
}
function render(now: number) {
  raf = 0;
  updateCountdown(now);
  const w = stage.clientWidth,
    h = stage.clientHeight,
    dpr = Math.min(devicePixelRatio, 2);
  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (
    running &&
    tracker &&
    video.readyState >= 2 &&
    video.currentTime !== lastFrame &&
    now - lastInference >= 66
  ) {
    lastFrame = video.currentTime;
    lastInference = now;
    lastSeen = now;
    try {
      const detection = tracker.detectForVideo(video, now);
      try {
        points = detection.landmarks[0] ?? [];
        const result = assessPose(points, video.videoWidth / video.videoHeight);
        if (previewDeadline !== null) trigger.reset();
        const state = trigger.update(
          result.match && previewDeadline === null,
          now,
        );
        showAssessment(result);
        setProgress(state.progress);
        el("hold-label").textContent = state.locked
          ? "RELEASE TO RECHARGE"
          : "HOLD THE POSE";
        if (state.fired || previewRequested) {
          const mask = detection.segmentationMasks?.[0];
          const captured = mask
            ? captureAfterimage(video, mask, mirror.checked)
            : null;
          effects.trigger(
            now,
            points,
            mirror.checked,
            video.videoWidth / video.videoHeight,
            captured,
          );
          el("preview-label").textContent =
            "EFFECT PREVIEW · NO POSE DETECTION";
          el("preview-label").hidden = !previewRequested;
          cancelPreview();
        }
        setStatus(
          state.locked
            ? "Technique activated. Release the pose to recharge."
            : result.hint,
        );
        inferenceCount++;
        if (now - fpsStart > 1000) {
          el("fps").textContent =
            `${Math.round((inferenceCount * 1000) / (now - fpsStart))} POSE CHECKS / SEC`;
          fpsStart = now;
          inferenceCount = 0;
        }
      } finally {
        detection.close();
      }
    } catch (error) {
      stopCamera();
      el("error").textContent =
        `Pose processing failed: ${cameraError(error)} Try restarting the camera.`;
      el("error").hidden = false;
      return;
    }
  }
  if (running && now - lastSeen > 500) {
    points = [];
    trigger.reset();
    resetChecks();
    setStatus("Waiting for new camera frames…");
  }
  if (debug.checked) drawSkeleton(ctx, points, w, h, mirror.checked);
  effects.draw(ctx, w, h, now, reduced.checked);
  if (!running && !effects.active(now) && previewDeadline === null) {
    drawCompass(ctx, w * 0.5, h * 0.76, w * 0.22, 0, 0.16);
    el("preview-label").hidden = true;
    el("idle").hidden = false;
  }
  if (running || effects.active(now) || previewDeadline !== null) schedule();
}
start.addEventListener("click", startCamera);
stop.addEventListener("click", stopCamera);
preview.addEventListener("click", () => {
  effects.clear();
  trigger.reset();
  setProgress(0);
  previewDeadline = performance.now() + 3000;
  preview.disabled = true;
  preview.textContent = "Get ready…";
  el("idle").hidden = true;
  el("preview-label").hidden = true;
  el("countdown-number").textContent = "3";
  el("countdown").hidden = false;
  schedule();
});
mirror.addEventListener("change", () => {
  video.style.transform = mirror.checked ? "scaleX(-1)" : "none";
  effects.clear();
  trigger.reset();
  setProgress(0);
  schedule();
});
video.style.transform = "scaleX(-1)";
window.addEventListener("pagehide", stopCamera);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelPreview();
    trigger.reset();
    effects.clear();
    points = [];
  }
});
new ResizeObserver(schedule).observe(stage);
resetChecks();
schedule();
