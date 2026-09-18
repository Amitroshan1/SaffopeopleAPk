import { isNativeApp } from './platform.js';
import { ensureCameraPermission } from './nativePermissions.js';

/**
 * Prepares camera + microphone for HR assessment (getUserMedia).
 * Native camera permission is requested first; mic is granted via WebView prompt with RECORD_AUDIO in manifest.
 */
export async function openAssessmentMediaStream() {
  if (!isNativeApp()) {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  const cam = await ensureCameraPermission();
  if (!cam.granted) {
    const err = new Error(cam.message || 'Camera permission denied');
    err.name = 'NotAllowedError';
    throw err;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera and microphone are not supported on this device.');
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (e) {
    const msg =
      e?.name === 'NotAllowedError'
        ? 'Camera and microphone permissions are required. Allow both when prompted, then tap Enable again.'
        : e?.message || 'Unable to access camera and microphone.';
    const err = new Error(msg);
    err.name = e?.name || 'NotAllowedError';
    throw err;
  }
}
