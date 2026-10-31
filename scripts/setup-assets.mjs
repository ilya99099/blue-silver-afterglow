import { mkdir, cp, writeFile, access } from "node:fs/promises";
await mkdir("public/models", { recursive: true });
await cp("node_modules/@mediapipe/tasks-vision/wasm", "public/wasm", {
  recursive: true,
});
const path = "public/models/pose_landmarker_lite.task";
try {
  await access(path);
  console.log("Model already present. WASM assets refreshed.");
} catch {
  const url =
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Model download failed: ${response.status}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
  console.log("Model and WASM assets are ready.");
}
