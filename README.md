# Afterglow — Pose Lab

[Live demo](https://ilya99099.github.io/blue-silver-afterglow/) · [Source code](https://github.com/ilya99099/blue-silver-afterglow)

A browser-only camera experiment inspired by Akaza’s **Destructive Death — Final Form: Blue Silver Chaotic Afterglow**. Built as an engineering interview project.

## Run locally

Use Node.js 22.12+ or a current supported LTS release (developed with Node 24).

```sh
npm ci
npm run setup:assets
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`. Allow camera access when prompted. Use HTTPS for remote hosting; ordinary HTTP on a LAN address does not support camera access.

The asset setup script copies WASM files from the installed MediaPipe package and downloads the version 1 float16 Pose Landmarker Lite model from Google. These generated files are ignored by Git but included in the production build. Run asset setup before building a fresh checkout. Package versions are recorded in `package-lock.json`.

```sh
npm test
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static HTTPS host. A GitHub Actions workflow is included to validate changes and deploy the main branch to GitHub Pages using GitHub Actions as the Pages source. The build uses DEPLOY_BASE to support the repository subpath.

## Try the pose

1. Start the camera and step back until your shoulders, hands, knees, and feet are visible.
2. Face the camera, spread your feet, and lower into a wide squat.
3. Extend one open palm toward the camera around shoulder height.
4. Keep the other hand near your waist, with that elbow bent.
5. Hold for 0.7 seconds. Release the pose for at least 0.5 seconds to rearm.

Either mirrored orientation is accepted. The checklist shows which conditions pass. Enable **Show landmarks** to inspect tracking. **Preview effect** starts a visible three-second countdown so you can step back and pose. With the camera running, the cutout is captured from a fresh frame after the countdown, not when the button is clicked. Automatic pose triggering is suppressed during the countdown. Preview is not a recognition test. Stopping the camera or hiding the tab cancels the countdown. **Stop camera** releases media tracks; it also cancels a pending startup. **Reduced motion** removes moving streaks and rotation.

## Architecture

- `src/camera.ts`: camera constraints and access error messages.
- `src/tracker.ts`: MediaPipe initialization, with GPU preference and CPU fallback.
- `src/pose.ts`: pure geometry rules and a time-based trigger state machine.
- `src/effects.ts`: landmark overlay and procedural Canvas animation.
- `src/main.ts`: UI, lifecycle, camera frame loop, and coordination.
- `src/pose.test.ts`: detector and timing tests.

MediaPipe estimates body landmarks; it is not trained here to classify an anime move. Application rules combine landmark confidence, stance width, knee angles, and asymmetric hand positions. Image aspect ratio is applied before computing geometry. Distances are normalized by shoulder width or torso length.

Detection is limited to approximately 15 checks per second, while drawing uses `requestAnimationFrame`. The model currently runs synchronously on the main thread. Moving inference into a worker is a possible improvement after measuring performance. A gap longer than 300 ms resets accumulated hold time rather than treating missing observations as a valid pose.

Video is displayed without cropping. The canvas uses the same aspect ratio, and both video and landmark coordinates account for mirroring. The effect captures its ground anchor from the feet at activation.

## Privacy and dependencies

Camera frames are processed locally. At effect activation, one frame is masked and tinted in browser memory to create red copies of the actual person. The sprite is discarded after the animation or when the camera is stopped. No frames are saved to disk or uploaded; the app does not record video, request a microphone, or use an API key. Model and WASM files are served from the app’s own origin after setup. The stylesheet requests optional Google Fonts; system fonts are fallbacks. There is no analytics or application backend.

Primary dependencies: TypeScript, Vite, and `@mediapipe/tasks-vision`. The visual effect is drawn procedurally. No frames or people from the supplied reference video are included as app assets.

## Verification and current limitations

Verified during development:

- Type checking and production build.
- Six synthetic test cases covering pose matching, mirrored coordinates, negative poses, missing/low-confidence landmarks, aspect ratio, holding, release, and stale observations.
- Browser UI and the independent effect preview, with no captured browser warnings or errors during those checks.
- Cancellation while camera permission was pending.

The user reported a successful final manual test after the segmentation and countdown revisions. This confirms the tested local flow on their setup, not general accuracy or measured performance. See [the validation record](docs/VALIDATION.md) for evidence and remaining checks.

The prototype recognizes body configuration, not individual finger positions or a reliably measured palm direction. It can therefore accept similar body poses. Knee angles are measured in 2D and depend on camera viewpoint. The model tracks one person. Current thresholds are initial engineering choices, not measured accuracy claims.

The effect builds over 4.8 seconds: a layered cyan floor pattern, red body silhouettes, blue arena shading, vertical streaks, particles, and a delayed title. Copies now use the pose model’s person segmentation mask and the activation camera frame, preserving the actual outline and red-tinted clothing/face shading. Each copy is placed outside the person’s detected bounding box with a gap, and clipped away from the central person. Copies can extend off-screen when the person fills much of the frame; step back for more room. With the camera running, Preview effect captures a fresh person mask. Without the camera, it explicitly shows an illustrated sample, not the real-person result. Reduced motion keeps silhouettes and fades while freezing streak movement and circle rotation. The revised flow was user-tested. Segmentation adds inference overhead; performance has not been benchmarked.

## AI-assisted development

AI assisted with reference analysis, implementation, tests, and documentation. Synthetic tests establish behavior of the rules, not real-world model accuracy. Next steps are hosted verification and an interview walkthrough. See [the interview study guide](docs/INTERVIEW.md). See `PLAN.md` and `REFERENCE.md` for progress and decisions.

## References

- [MediaPipe Pose Landmarker for Web](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
- [Vite guide](https://vite.dev/guide/)
