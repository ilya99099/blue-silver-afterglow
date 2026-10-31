# Interview walkthrough

Use this as a study guide. Only present statements you can explain and support with the code.

## A short introduction

“I built a browser camera effect inspired by Akaza. MediaPipe estimates body landmarks, and my application checks the stance using geometric rules and a short hold timer. Once the pose matches, a Canvas animation draws the ground pattern and energy effects. A segmentation mask lets me create red copies of the person from a camera frame. Processing stays in the browser.”

## Two-minute demo

1. Start the camera and show the live view.
2. Enable landmarks and briefly explain the five-condition checklist.
3. Step back, take the pose, and hold until the effect activates.
4. Release the pose before triggering again.
5. Show the three-second Preview countdown and explain that preview bypasses pose matching.
6. Stop the camera to show the explicit resource lifecycle.

If recognition fails, use the checklist to explain what is missing. Label preview honestly; do not present it as successful recognition.

## Code reading order

1. `src/camera.ts`: permission request, constraints, and errors.
2. `src/tracker.ts`: model initialization, GPU/CPU fallback, and segmentation output.
3. `src/pose.ts`: confidence filtering, geometry, normalization, and trigger timing.
4. `src/main.ts`: frame loop, countdown, lifecycle, and result cleanup.
5. `src/effects.ts`: masked red cutout, copy placement, and animation phases.
6. `src/pose.test.ts`: what synthetic tests prove and what they cannot prove.

## Questions to practice

**Why use a pretrained model?**
It provides body landmarks without collecting and labeling a new training dataset. The application still needs explicit rules for this particular pose.

**Why geometric rules instead of training a classifier?**
For one specified pose, rules are easy to inspect, test, and explain. The tradeoff is sensitivity to viewpoint and thresholds. A larger gesture set or varied camera angles could justify a learned classifier.

**How do you avoid a single noisy frame triggering the effect?**
The pose must remain matched for 700 ms. Missing or invalid observations reset the hold. After activation, a release interval rearms the trigger. Long frame gaps also reset accumulated hold time.

**Why normalize coordinates?**
Image coordinates depend on frame dimensions, and apparent body size changes with distance. Aspect correction preserves angles; shoulder/torso normalization makes distance checks less dependent on scale.

**How are the red copies made?**
The segmentation mask provides a person-confidence value per pixel. At activation, the app combines that mask with one camera frame, converts the colors to crimson while retaining brightness detail, crops transparent space, and draws copies outside the original person's bounds. The sprite lives temporarily in memory and is not uploaded or saved.

**What is the performance tradeoff?**
Inference runs synchronously and can block the UI. Detection is throttled, while drawing uses requestAnimationFrame. Mask readback and cutout generation happen at activation, and the result is reused during the effect. A worker is a possible next improvement after profiling.

**What did AI contribute?**
AI assisted with reference analysis, implementation, tests, and documentation. The project was iterated through browser checks and user camera testing, including feedback on copy spacing, realistic silhouettes, and preview timing. Be specific about the parts you personally reviewed and understand.

**What would you improve next?**
Measure real performance, broaden negative-pose testing, improve viewpoint robustness, and evaluate hand landmarks for palm configuration. Avoid claiming these improvements are already implemented.
