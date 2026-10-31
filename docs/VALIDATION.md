# Validation record

## Automated checks

- TypeScript type checking and production build passed during development.
- Six tests cover accepted and mirrored poses, missing/low-confidence landmarks, negative poses, aspect-ratio correction, hold/release timing, and interrupted observations.
- Browser inspection confirmed the interface, independent effect preview, countdown-to-preview transition, and cancellation of a pending camera startup.

## User testing

On October 31, 2026, the user reported that the pose checklist turned green and activation worked on their camera. Subsequent feedback drove wider copy spacing, segmentation-based red human copies, and a three-second preview countdown. After those revisions, the user reported that the final manual test passed and the app appeared to work correctly.

This is user-reported functional validation on one setup. Browser version, device specifications, detailed test matrix, and performance measurements were not recorded. It is not evidence of universal accuracy or a measured FPS target.

## Remaining validation limits

- Measure inference/render performance on a documented device.
- Test broader lighting, framing, body proportions, and ordinary gestures.
- Verify production model/WASM loading and camera access after hosting is enabled.
- Test denied permission, physical camera disconnection, and model/network failure systematically.

## Known limitations

Open-palm fingers and palm direction are not classified. Rules use 2D geometry and can accept similar stances. One person is tracked. Segmentation edges can be imperfect; red copies are captured still images, not continuously animated clones. Copies may be cropped at the edges when the user fills the frame. Inference runs on the main thread with an approximate 15 Hz cap; this cap is not a measured performance result.
