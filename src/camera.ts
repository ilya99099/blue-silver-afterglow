export async function openCamera(): Promise<MediaStream> {
  if (!window.isSecureContext)
    throw new Error("Camera access requires HTTPS or localhost.");
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error(
      "This browser does not support camera access. Try a recent Chrome browser.",
    );
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
  });
}
export function cameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError")
      return "Camera permission was denied. Allow access in your browser settings, then try again.";
    if (error.name === "NotFoundError")
      return "No camera found. Connect a camera and try again.";
    if (error.name === "NotReadableError")
      return "The camera is unavailable. Close other apps using it and try again.";
  }
  return error instanceof Error
    ? error.message
    : "Unable to start the camera. Please try again.";
}
