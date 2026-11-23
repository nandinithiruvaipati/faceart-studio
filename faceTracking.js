import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// MediaPipe landmark indices
export const LM = { leftEye: 33, rightEye: 263, nose: 1, noseBase: 2, upperLip: 0, forehead: 10, chin: 152, faceL: 234, faceR: 454 };

export class FaceTracker {
  constructor() { this.landmarker = null; this.smooth = null; this.lastTime = -1; }

  async init() {
    if (this.landmarker) return;
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: 'VIDEO', numFaces: 1
    });
    try { this.landmarker = await FaceLandmarker.createFromOptions(fileset, opts('GPU')); }
    catch { this.landmarker = await FaceLandmarker.createFromOptions(fileset, opts('CPU')); }
  }

  /** Returns smoothed key points in normalized coords, or null if no face. */
  detect(video) {
    if (!this.landmarker || video.readyState < 2) return this.smooth;
    if (video.currentTime === this.lastTime) return this.smooth; // no new frame
    this.lastTime = video.currentTime;
    const res = this.landmarker.detectForVideo(video, performance.now());
    const lm = res.faceLandmarks && res.faceLandmarks[0];
    if (!lm) { this.smooth = null; return null; }
    const a = 0.55; // smoothing factor (higher = snappier)
    const next = lm.map((p) => ({ x: p.x, y: p.y }));
    this.smooth = this.smooth && this.smooth.length === next.length
      ? next.map((p, i) => ({ x: this.smooth[i].x + (p.x - this.smooth[i].x) * a, y: this.smooth[i].y + (p.y - this.smooth[i].y) * a }))
      : next;
    return this.smooth;
  }

  reset() { this.smooth = null; this.lastTime = -1; }
  close() { if (this.landmarker) this.landmarker.close(); this.landmarker = null; }
}

/** Convert normalized landmarks into canvas-space anchors with scale and roll. */
export function anchors(lm, w, h) {
  const P = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const l = P(LM.leftEye), r = P(LM.rightEye), fl = P(LM.faceL), fr = P(LM.faceR);
  const forehead = P(LM.forehead), chin = P(LM.chin), nose = P(LM.nose), noseBase = P(LM.noseBase), lip = P(LM.upperLip);
  return {
    l, r, nose, noseBase, lip, forehead, chin, fl, fr,
    eyeMid: { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 },
    eyeDist: Math.hypot(r.x - l.x, r.y - l.y),
    faceW: Math.hypot(fr.x - fl.x, fr.y - fl.y),
    faceH: Math.hypot(chin.x - forehead.x, chin.y - forehead.y),
    roll: Math.atan2(r.y - l.y, r.x - l.x)
  };
}
