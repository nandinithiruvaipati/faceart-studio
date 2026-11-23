export class Camera {
  constructor(video) { this.video = video; this.stream = null; }

  static errorMessage(err) {
    switch (err && err.name) {
      case 'NotAllowedError': case 'SecurityError':
        return 'Camera permission was denied. Allow camera access in your browser settings and try again.';
      case 'NotFoundError': case 'OverconstrainedError':
        return 'No camera was found on this device.';
      case 'NotReadableError':
        return 'Your camera is in use by another app. Close it and try again.';
      default: return 'Could not start the camera: ' + (err && err.message ? err.message : 'unknown error');
    }
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const e = new Error('Camera access needs a modern browser and HTTPS.'); e.name = 'NotFoundError'; throw e;
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false
    });
    this.video.srcObject = this.stream;
    await new Promise((res) => { this.video.onloadedmetadata = res; });
    await this.video.play();
    return { width: this.video.videoWidth, height: this.video.videoHeight };
  }

  stop() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null; this.video.srcObject = null;
  }

  get active() { return !!this.stream; }
}
