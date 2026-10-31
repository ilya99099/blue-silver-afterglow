# Reference observations

## Source and limits

Reviewed the user-provided reference video locally on October 31, 2026. Duration: approximately 10 seconds. Inspected 20 sampled frames, including close views around 5 and 6 seconds. Timing below is approximate; sampled frames do not establish the original detector thresholds or exact trigger time.

## Observed pose

- Face the camera with the full body visible.
- Place the feet wide apart and lower into a squat with the knees spread.
- Extend one arm toward the camera with an open palm around shoulder/face height.
- Keep the other elbow bent, with the hand near the waist.
- The reference shows the extended palm on the viewer’s right. Camera mirroring is unknown, so do not infer anatomical left/right from this alone.

Suggested UI instruction: “Step back so your full body is visible. Take a wide stance, bend your knees, extend one open palm toward the camera, and keep your other hand by your waist. Hold the pose.”

## Recognition design implications

- Require visible shoulders, elbows, wrists, hips, knees, and ankles for full-pose recognition.
- Combine a wide stance and bent knees with asymmetric arm positioning. A raised hand alone must not trigger the effect.
- Normalize distances by body dimensions and account for image aspect ratio when computing joint angles.
- Accept either mirrored version initially; this is a deliberate usability choice, not a claim about the original detector.
- Body landmarks do not reliably prove an open palm. Evaluate whether additional hand landmarks are needed before claiming to recognize finger configuration.
- A hand extended toward the camera can foreshorten the arm. Avoid relying on its apparent 2D length alone.
- Hold duration, confidence thresholds, and tolerance require testing; they cannot be recovered from this video.

## Visual sequence

- Around 0–2.5 seconds: the person moves back into a full-body camera view.
- Around 3–4 seconds: the person raises a palm and lowers into the stance.
- Around 4–5 seconds: a pale cyan circular geometric pattern appears under the feet, with faint red silhouettes nearby.
- Around 5.5–6.5 seconds: a stronger blue tint, bright cyan ground pattern, red silhouettes on both sides, vertical light streaks, particles, and the title “青銀亂殘光” appear.
- Around 7 seconds onward: the person leaves the stance; the stronger overlay disappears while a faint ground pattern remains in sampled frames.

## Implementation direction

Start with a procedural cyan ground pattern anchored near the feet and a short energy pulse. Add red afterimages, light streaks, and title treatment after recognition works reliably. Accurate person-shaped afterimages may require segmentation or another rendering approach; evaluate this separately from pose detection.

Do not ship the reference video or images of its participants as app assets. Use the clip as a visual reference and create the effect independently.
