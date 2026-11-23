// Face-attached designs. All are drawn relative to anchors so they scale/rotate with the head.
const withPose = (ctx, origin, roll, fn) => { ctx.save(); ctx.translate(origin.x, origin.y); ctx.rotate(roll); fn(); ctx.restore(); };

export function drawGlasses(ctx, a) {
  const d = a.eyeDist, rad = d * 0.36;
  withPose(ctx, a.eyeMid, a.roll, () => {
    ctx.lineWidth = Math.max(3, d * 0.06); ctx.strokeStyle = '#111'; ctx.fillStyle = 'rgba(80,160,255,0.22)';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * d / 2, 0, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-d / 2 + rad, 0); ctx.quadraticCurveTo(0, -rad * 0.4, d / 2 - rad, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-d / 2 - rad, 0); ctx.lineTo(-a.faceW / 2, -rad * 0.1);
    ctx.moveTo(d / 2 + rad, 0); ctx.lineTo(a.faceW / 2, -rad * 0.1); ctx.stroke();
  });
}

export function drawCrown(ctx, a) {
  const w = a.faceW * 0.8, h = a.faceH * 0.38;
  const up = { x: -Math.sin(a.roll), y: Math.cos(a.roll) }; // down-direction rotated by roll
  const base = { x: a.forehead.x - up.x * a.faceH * 0.12, y: a.forehead.y - up.y * a.faceH * 0.12 };
  withPose(ctx, base, a.roll, () => {
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#f5a300');
    ctx.fillStyle = g; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = Math.max(2, w * 0.02);
    ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * 0.6);
    ctx.lineTo(-w / 4, -h * 0.3); ctx.lineTo(0, -h); ctx.lineTo(w / 4, -h * 0.3);
    ctx.lineTo(w / 2, -h * 0.6); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff3b6b';
    for (const x of [-w / 4, 0, w / 4]) { ctx.beginPath(); ctx.arc(x, -h * 0.15, w * 0.035, 0, Math.PI * 2); ctx.fill(); }
  });
}

export function drawMoustache(ctx, a) {
  const w = a.faceW * 0.42;
  const origin = { x: (a.noseBase.x + a.lip.x) / 2, y: (a.noseBase.y + a.lip.y) / 2 + w * 0.02 };
  withPose(ctx, origin, a.roll, () => {
    ctx.fillStyle = '#2b1a12';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, -w * 0.04);
      ctx.bezierCurveTo(s * w * 0.25, -w * 0.2, s * w * 0.6, -w * 0.05, s * w * 0.55, w * 0.18);
      ctx.bezierCurveTo(s * w * 0.4, w * 0.02, s * w * 0.2, w * 0.1, 0, w * 0.08);
      ctx.closePath(); ctx.fill();
    }
  });
}

export function drawDecor(ctx, a, t) {
  // cheek blush
  const r = a.faceW * 0.1;
  for (const s of [-1, 1]) {
    const c = { x: a.nose.x + s * a.faceW * 0.27, y: a.nose.y + a.faceH * 0.02 };
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    g.addColorStop(0, 'rgba(255,80,140,0.55)'); g.addColorStop(1, 'rgba(255,80,140,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
  }
  // forehead sparkles that gently pulse
  const pulse = 0.75 + 0.25 * Math.sin(t / 250);
  const up = { x: Math.sin(a.roll), y: -Math.cos(a.roll) };
  [[-0.22, 0.1], [0, 0.2], [0.22, 0.1]].forEach(([dx, dy], i) => {
    const px = a.forehead.x + Math.cos(a.roll) * dx * a.faceW + up.x * dy * a.faceH;
    const py = a.forehead.y + Math.sin(a.roll) * dx * a.faceW + up.y * dy * a.faceH;
    star(ctx, px, py, a.faceW * 0.05 * (i === 1 ? 1.3 : 1) * pulse);
  });
}

function star(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffe66d'; ctx.shadowColor = '#ffe66d'; ctx.shadowBlur = r;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.35 : r; const an = (i * Math.PI) / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

/** Freehand painting on a persistent canvas (brush + eraser). */
export class Painter {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.mode = 'brush'; this.color = '#ff4d8d'; this.size = 8; this.last = null; }
  begin(p) { this.last = p; this.line(p, p); }
  move(p) { if (this.last) { this.line(this.last, p); this.last = p; } }
  end() { this.last = null; }
  line(a, b) {
    const c = this.ctx; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = this.size;
    if (this.mode === 'eraser') c.globalCompositeOperation = 'destination-out'; else c.strokeStyle = this.color;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.restore();
  }
  clear() { this.ctx.clearRect(0, 0, this.c.width, this.c.height); }
}
