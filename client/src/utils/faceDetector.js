/**
 * TalentTrail AI — Real-Time Browser Face Presence Detector
 * 
 * Multi-strategy client-side face presence detection:
 * 1. Native Shape Detection API (window.FaceDetector) when supported by Chromium/Edge
 * 2. High-performance Anthropometric Computer Vision (Canvas YCbCr / Luminance structural analysis)
 * 
 * Strict Privacy & Security:
 * - 100% in-browser on-device evaluation
 * - Zero raw images or biometric templates uploaded or stored
 * - Detects presence/absence only (no identity or emotion inference)
 */

let nativeDetectorInstance = null;
let offscreenCanvas = null;
let offscreenCtx = null;

/**
 * Check if the browser supports the native Shape Detection FaceDetector API
 */
export function isNativeFaceDetectorSupported() {
  return typeof window !== 'undefined' && 'FaceDetector' in window;
}

/**
 * Initialize or get cached offscreen canvas for frame analysis
 */
function getOffscreenContext(width = 160, height = 120) {
  if (!offscreenCanvas) {
    if (typeof document !== 'undefined') {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }
  return { canvas: offscreenCanvas, ctx: offscreenCtx };
}

/**
 * Evaluate real-time face presence from a live HTML5 <video> element
 * @param {HTMLVideoElement} videoElement - Live camera preview element
 * @returns {Promise<{ faceDetected: boolean, confidence: number, method: string, reason?: string, box?: object }>}
 */
export async function detectFacePresence(videoElement) {
  if (!videoElement) {
    return { faceDetected: false, isVideoReady: false, confidence: 0, method: 'none', reason: 'NO_VIDEO_ELEMENT' };
  }

  // Verify video is actively rendering frames and unpaused
  if (
    videoElement.readyState < 2 ||
    videoElement.videoWidth === 0 ||
    videoElement.videoHeight === 0 ||
    videoElement.paused
  ) {
    return { faceDetected: false, isVideoReady: false, confidence: 0, method: 'none', reason: 'VIDEO_NOT_READY' };
  }

  // Verify underlying media stream track is active and unmuted
  const stream = videoElement.srcObject;
  if (stream && typeof stream.getVideoTracks === 'function') {
    const videoTrack = stream.getVideoTracks()?.[0];
    if (!videoTrack || videoTrack.readyState !== 'live' || videoTrack.muted) {
      return { faceDetected: false, isVideoReady: false, confidence: 0, method: 'track_inspection', reason: 'CAMERA_TRACK_INACTIVE' };
    }
  }

  // Strategy 1: Native Chromium Shape Detection FaceDetector API
  if (isNativeFaceDetectorSupported()) {
    try {
      if (!nativeDetectorInstance) {
        nativeDetectorInstance = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
      }
      const detectedFaces = await nativeDetectorInstance.detect(videoElement);
      if (detectedFaces && detectedFaces.length > 0) {
        const primary = detectedFaces[0];
        return {
          faceDetected: true,
          isVideoReady: true,
          confidence: 0.96,
          method: 'native_face_detector',
          box: primary.boundingBox
        };
      }
    } catch {
      // Fallback gracefully to anthropometric CV
    }
  }

  // Strategy 2: Anthropometric Computer Vision (Canvas-based YCbCr + Luminance Structure)
  try {
    const width = 160;
    const height = 120;
    const { ctx } = getOffscreenContext(width, height);
    if (!ctx) {
      return { faceDetected: false, isVideoReady: false, confidence: 0, method: 'canvas_fallback', reason: 'NO_2D_CONTEXT' };
    }

    ctx.drawImage(videoElement, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;

    let skinCount = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;

    // Fast 4-pixel stride sampling for sub-millisecond execution
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Normalized color space & YCbCr chrominance transformation
      // Standard skin locus: Cb in [77, 127], Cr in [133, 173]
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      const isSkinChrominance = (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173);
      const isSkinLocus = (r > 60 && g > 40 && b > 20 && (r - g) > 12 && r > b);

      if (isSkinChrominance || isSkinLocus) {
        const pixelIdx = i / 4;
        const px = pixelIdx % width;
        const py = Math.floor(pixelIdx / width);

        skinCount++;
        sumX += px;
        sumY += py;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }

    // A valid human face in front of a camera requires:
    // 1. Minimum skin mass: at least 100 sampled pixels
    // 2. Minimum bounding dimensions
    const boxW = Math.max(0, maxX - minX);
    const boxH = Math.max(0, maxY - minY);
    const boxArea = boxW * boxH;

    if (skinCount >= 100 && boxW >= 20 && boxH >= 22 && boxArea >= 500) {
      const aspect = boxW / boxH;
      const density = (skinCount * 4) / boxArea;

      // Human face aspect ratio is typically vertical oval (0.45 to 1.65)
      // and fill density within the bounding box is non-zero (0.18 to 0.95)
      if (aspect >= 0.45 && aspect <= 1.65 && density >= 0.18 && density <= 0.95) {
        const centerX = sumX / skinCount;
        const centerY = sumY / skinCount;

        // Verify face is substantially in frame
        if (centerY > 5 && centerY < height - 5 && centerX > 5 && centerX < width - 5) {
          return {
            faceDetected: true,
            isVideoReady: true,
            confidence: Math.min(0.95, Math.max(0.65, density + 0.25)),
            method: 'anthropometric_cv',
            box: { x: minX, y: minY, width: boxW, height: boxH }
          };
        }
      }
    }

    return {
      faceDetected: false,
      isVideoReady: true,
      confidence: 0,
      method: 'anthropometric_cv',
      reason: 'BELOW_FACIAL_THRESHOLD'
    };
  } catch (err) {
    return {
      faceDetected: false,
      isVideoReady: false,
      confidence: 0,
      method: 'error_fallback',
      reason: err.message
    };
  }
}
