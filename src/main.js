import './style.css';
import { Camera } from './camera.js';
import { FaceTracker, anchors } from './faceTracking.js';
import { drawGlasses, drawCrown, drawMoustache, drawDecor, Painter } from './drawingTools.js';
import { $, $$, setStatus, showMessage, setLoading, markActive } from './ui.js';

const studio = $('#studio'), stage = $('#stage'), video = $('#video');
const overlay = $('#overlay'), paint = $('#paint');
const octx = overlay.getContext('2d');
const camera = new Camera(video), tracker = new FaceTracker(), painter = new Painter(paint);
const state = { glasses: false, crown: false, moustache: false, decor: false };
let raf = 0, running = false;

/* ---------- canvas sizing ---------- */
function resize() {
  const w = Math.round(stage.clientWidth), h = Math.round(stage.clientHeight);
  if (!w || !h) return;
  if (overlay.width !== w || overlay.height !== h) {
    // keep painted strokes when resizing by scaling the old bitmap
    const old = document.createElement('canvas'); old.width = paint.width; old.height = paint.height;
    if (paint.width) old.getContext('2d').drawImage(paint, 0, 0);
    overlay.width = paint.width = w; overlay.height = paint.height = h;
    if (old.width) painter.ctx.drawImage(old, 0, 0, w, h);
  }
}
new ResizeObserver(resize).observe(stage);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));

/* ---------- render loop ---------- */
function frame(t) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  const lm = tracker.detect(video);
  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (!lm) { setStatus($('#status'), 'No face detected', 'warn'); showMessage($('#msg'), 'No face detected. Face the camera in good light 🙂'); return; }
  setStatus($('#status'), 'Face detected', 'ok'); showMessage($('#msg'), '');
  const a = anchors(lm, overlay.width, overlay.height);
  if (state.decor) drawDecor(octx, a, t);
  if (state.crown) drawCrown(octx, a);
  if (state.moustache) drawMoustache(octx, a);
  if (state.glasses) drawGlasses(octx, a);
}

/* ---------- camera lifecycle ---------- */
async function startCamera() {
  const btn = $('#camToggle'); btn.disabled = true;
  setLoading($('#loader'), true); showMessage($('#msg'), '');
  try {
    const dims = await camera.start();
    stage.style.aspectRatio = `${dims.width} / ${dims.height}`;
    await tracker.init();
    resize(); running = true; raf = requestAnimationFrame(frame);
    btn.textContent = 'Stop Camera'; setStatus($('#status'), 'Looking for face…');
  } catch (err) {
    console.error(err); camera.stop();
    const msg = err && err.name ? Camera.errorMessage(err) : 'Could not load the face model. Check your connection and try again.';
    showMessage($('#msg'), msg); setStatus($('#status'), 'Camera off', 'warn');
  } finally { setLoading($('#loader'), false); btn.disabled = false; }
}

function stopCamera() {
  running = false; cancelAnimationFrame(raf);
  camera.stop(); tracker.reset(); octx.clearRect(0, 0, overlay.width, overlay.height);
  $('#camToggle').textContent = 'Start Camera'; setStatus($('#status'), 'Camera off');
  showMessage($('#msg'), 'Camera stopped. Press <b>Start Camera</b> to begin again.');
}

$('#camToggle').addEventListener('click', () => (camera.active ? stopCamera() : startCamera()));

/* ---------- studio open/close ---------- */
function openStudio() { studio.hidden = false; document.body.classList.add('lock'); resize(); }
function closeStudio() { stopCamera(); studio.hidden = true; document.body.classList.remove('lock'); }
$$('[data-open-studio]').forEach((b) => b.addEventListener('click', openStudio));
$('#closeStudio').addEventListener('click', closeStudio);
window.addEventListener('pagehide', () => camera.stop());
document.addEventListener('visibilitychange', () => { if (document.hidden && camera.active) stopCamera(); });

/* ---------- toolbar ---------- */
$$('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.toggle; state[k] = !state[k]; markActive(b, state[k]);
}));
const modeBtns = $$('[data-mode]');
function setMode(mode) {
  painter.mode = mode; paint.style.pointerEvents = mode ? 'auto' : 'none';
  modeBtns.forEach((b) => markActive(b, b.dataset.mode === mode));
}
modeBtns.forEach((b) => b.addEventListener('click', () => setMode(painter.mode === b.dataset.mode && b.dataset.mode ? (setMode(null), null) : b.dataset.mode)));
$('#color').addEventListener('input', (e) => { painter.color = e.target.value; if (painter.mode !== 'brush') setMode('brush'); });
$('#size').addEventListener('input', (e) => { painter.size = +e.target.value; });
$('#clear').addEventListener('click', () => painter.clear());
$('#reset').addEventListener('click', () => {
  painter.clear(); Object.keys(state).forEach((k) => (state[k] = false));
  $$('[data-toggle]').forEach((b) => markActive(b, false)); setMode(null);
  $('#color').value = '#ff4d8d'; painter.color = '#ff4d8d'; $('#size').value = 8; painter.size = 8;
});

/* ---------- pointer drawing (stage is mirrored, so flip x) ---------- */
const pos = (e) => { const r = paint.getBoundingClientRect(); return { x: (r.right - e.clientX) * (paint.width / r.width), y: (e.clientY - r.top) * (paint.height / r.height) }; };
paint.addEventListener('pointerdown', (e) => { if (!painter.mode) return; paint.setPointerCapture(e.pointerId); painter.begin(pos(e)); });
paint.addEventListener('pointermove', (e) => painter.move(pos(e)));
['pointerup', 'pointercancel'].forEach((ev) => paint.addEventListener(ev, () => painter.end()));
setMode(null);
