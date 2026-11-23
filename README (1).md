# FaceArt – Real-Time Face Drawing Studio

Draw glasses, crowns, moustaches, decorations and freehand art on your face in real time. Face landmarks are detected locally in the browser with MediaPipe Face Landmarker; no video is uploaded or stored.

## Features
- Landing page (hero, features, how it works, about, footer)
- Live camera studio with explicit permission flow, loading, face-found / not-found status
- Face-attached glasses, crown, moustache and decorations (scaled and rotated with your head)
- Freehand brush, colour picker, brush size, eraser, clear and reset
- Responsive, touch-friendly, mirrored selfie view; camera stops when you leave

## Tech stack
HTML5, CSS3, JavaScript (ES modules), Canvas API, MediaPipe Tasks Vision, Vite

## Run locally
```bash
npm install
npm run dev      # open the printed URL (localhost counts as secure for camera)
npm run build    # production build in dist/
npm run preview
```
To test on a phone, use the deployed HTTPS URL (cameras need HTTPS except on localhost).

## Deployment
Vercel or Netlify: import the repo, build command `npm run build`, output directory `dist`. Both serve HTTPS.

## Notes
The MediaPipe WASM runtime (jsDelivr) and model file (Google storage) are fetched at runtime, so an internet connection is required the first time. To self-host, copy them into `public/` and update the URLs in `src/faceTracking.js`.

## Privacy
Video frames are processed in-memory in the browser only. Nothing is uploaded, stored or tracked.

## Screenshots
| Landing | Studio |
|---|---|
| _placeholder_ | _placeholder_ |
