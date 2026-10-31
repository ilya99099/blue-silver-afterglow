import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
export async function createTracker() {
  const root = import.meta.env.BASE_URL;
  const vision = await FilesetResolver.forVisionTasks(`${root}wasm`);
  const options = {
    runningMode: "VIDEO" as const,
    numPoses: 1,
    outputSegmentationMasks: true,
    minPoseDetectionConfidence: 0.6,
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  };
  try {
    return await PoseLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: {
        modelAssetPath: `${root}models/pose_landmarker_lite.task`,
        delegate: "GPU",
      },
    });
  } catch {
    return PoseLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: {
        modelAssetPath: `${root}models/pose_landmarker_lite.task`,
        delegate: "CPU",
      },
    });
  }
}
