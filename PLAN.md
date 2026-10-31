# Akaza camera effect — implementation plan

## Assignment and current status

The app must run entirely in a browser, display the user’s camera, and overlay a special effect when the user performs Akaza’s specified pose. Deliverables: source code, setup instructions, a hosted demo if possible, and preparation for a technical discussion.

The first local prototype is implemented: camera lifecycle, MediaPipe integration, pose rules, hold/release logic, debug landmarks, and a procedural effect. Type checking, production build, and six synthetic tests pass. Browser UI, effect preview, and cancellation while camera permission is pending have been checked. The user subsequently confirmed that all pose checks turn green and the original effect activates on their camera. The current effect uses segmentation-based red cutouts, a phased 4.8-second sequence, and a three-second preview countdown. The user reported a successful final local test.

The reference video was supplied privately and inspected locally. See REFERENCE.md for observations; the original video and its access link are not part of this repository.

Discuss and explain the work with the user in Russian. All code, comments, documentation, UI, and materials shown at the interview will be in English, including prepared interview answers and demo scripts.

## 1. Establish the visual target

- [x] View the reference and document torso, shoulder, elbow, and wrist positions; determine whether legs and fingers must be visible.
- [x] Write clear instructions for performing the pose.
- [x] Separate essential pose features from acceptable variation (initial design documented; tolerances require camera testing).

Done when the pose has a concrete, reference-backed description rather than an assumption based on the technique’s name.

## 2. Application foundation and camera

- [x] Selected TypeScript + Vite, MediaPipe Pose Landmarker Lite, and Canvas 2D after checking official documentation.
- [x] Add the start screen, camera view, stop control, and useful error messages.
- [ ] Check mirroring, resizing, and camera access on HTTPS/localhost.

Done when live video displays correctly and stopping releases the camera.

## 3. Pose recognition

- [x] Integrate the model and a landmark debug overlay (user-reported live validation completed).
- [x] Extract pose features into a pure function with explainable thresholds.
- [x] Add states: searching for a person → ready → holding → effect → waiting for reset.
- [ ] Test with synthetic inputs, then a real camera. Tune thresholds using observations.

Done when the target pose reliably triggers an event, ordinary movements do not repeatedly trigger it, and losing the person resets the hold.

## 4. Effect and interface

- [ ] Create a procedural blue-silver effect with pulses, particles, and shockwaves; compare its composition with the reference.
- [x] Add a visual pose guide, hold progress, and a separate Preview Effect control.
- [x] Tune duration, cap particle counts, and support reduced motion intensity.

Done when recognition triggers the effect, overlays align with the video, and the app remains usable.

## 5. Validation and delivery

- [ ] Check camera access granted and denied, restarting, missing people, partial framing, and model loading failures.
- [ ] Check different lighting, distances, mirroring, and ordinary gestures as negative examples.
- [ ] Measure performance on the user’s device; record browser and measurement conditions. Initial rendering target: around 30 FPS, subject to measurement.
- [x] Run type checks, detector tests, and the production build.
- [x] Prepare a README covering setup, the pose, architecture, dependencies, privacy, limitations, and AI assistance.
- [ ] Prepare the repository and HTTPS hosting; verify the deployed app and model loading.

## 6. Interview preparation

- [ ] Walk through the data flow from camera frame to effect and the purpose of each main module.
- [ ] Explain the distinction between landmark inference and rules for recognizing the specific pose.
- [ ] Discuss false positives, latency, performance, limitations, and potential improvements.
- [ ] Prepare an honest account of AI contributions, verification, and decisions the user understands.
- [ ] Rehearse a short demo and technical questions while navigating the code.

## Working order

Implement and validate stages 1–5 with brief explanations along the way. Then do a detailed walkthrough and mock interview. A reliable end-to-end pipeline comes first, followed by visual polish.

## Latest visual revision

The user confirmed activation works and requested wider spacing and actual red human copies. Enabled person segmentation, captured an ephemeral red-tinted camera cutout at activation, and placed copies outside the person bounds with a protected center. Camera-free preview remains explicitly labeled as an illustrated sample. The user subsequently reported a successful final local test; measured inference cost remains unverified.

## Delivery preparation

The user reported that the final local manual test passed. The segmentation copies and three-second countdown are included. Preparing source formatting, automated validation/deployment, and interview documentation. This report does not establish a comprehensive browser/device matrix or measured performance.
