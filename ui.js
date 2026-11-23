export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function setStatus(el, text, kind) { el.textContent = text; el.dataset.kind = kind || ''; }
export function showMessage(el, html) { el.innerHTML = html || ''; el.hidden = !html; }
export function setLoading(el, on) { el.hidden = !on; }
export function markActive(btn, on) { btn.classList.toggle('active', !!on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
