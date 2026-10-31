# Project instructions

## Goal

Build a browser camera app for the Core Tech Engineering Intern interview. Recognize Akaza’s Destructive Death — Final Form: Blue Silver Chaotic Afterglow pose and overlay an anime-inspired effect. The user must be able to demonstrate the app and explain its implementation.

## Workflow

- Explain and discuss the work with the user in Russian. Use English for all code, comments, documentation, UI, and materials intended to be shown at the interview. Interview answers and demo scripts should be in English; explanations of them may be in Russian.
- Read PLAN.md before implementation and update progress based on actual results.
- First complete the camera → landmarks → pose decision → effect pipeline, then polish the visuals.
- Make small, understandable changes. Briefly explain each milestone, why the approach was chosen, and how it was checked.
- Resolve routine technical choices independently within the requested scope. Do not request permission again for already authorized work.
- Verify the visual reference before defining the target pose. Do not substitute an arbitrary gesture; record uncertainty if the reference is unavailable.
- Keep camera handling, landmark inference, pose logic, effects, and UI separate. Add a server only if there is a concrete need.

## Technical requirements

- Process camera frames and recognize poses entirely in the browser. Do not upload frames, record video, or request microphone access.
- Request camera access after an explicit user action. Support stopping the camera and releasing media tracks and animation loops.
- Handle denied access, missing cameras, model loading and failures, missing people, and incomplete framing.
- Account for mirroring, resizing, and video cropping when aligning overlays.
- Use model confidence, normalized distances or angles, temporal holding, and retrigger protection. Keep thresholds explainable.
- Keep Preview Effect clearly labeled as a graphics preview, not evidence of pose recognition.
- Prefer procedural graphics and few dependencies. Verify current library documentation before integration.
- Never put secrets in the repository or client code.

## Validation and explanation

- Check the build and types after substantial changes once the corresponding commands exist.
- Test detector decisions: matching and nonmatching poses, low confidence, missing landmarks, holding, resetting, and retriggering.
- Check the app in a browser. Explicitly identify real-camera checks that still require the user.
- Do not claim camera behavior, performance, or accuracy was verified using only synthetic tests or effect previews.
- Keep brief notes on decisions, limitations, and AI assistance for interview preparation. Do not invent measurements or user experience.
- Publish, send links, and create external resources only within the user’s authorization.
