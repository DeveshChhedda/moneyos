/* ================= icons (inline, stroke) ================= */
const I = (() => {
  const p = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    in: '<path d="M12 19V5M5 12l7 7 7-7"/>',
    out: '<path d="M12 5v14M5 12l7-7 7 7"/>',
    bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6 15h4"/>',
    loan: '<path d="M4 20V9l8-5 8 5v11z"/><path d="M9 20v-6h6v6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="16.5" cy="13.5" r="1.2"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6z"/>',
    download: '<path d="M12 3v12M6 11l6 6 6-6M4 21h16"/>',
    upload: '<path d="M12 17V5M6 9l6-6 6 6M4 21h16"/>',
    swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    net: '<path d="M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2 2.6 5 3.2 5 1.3 5 3.3-2.2 3.2-5 3.2-5-1.2-5-3.2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  };
  const f = (n, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[n] || ''}</svg>`;
  return f;
})();

/* ================= toast ================= */
let _toastT;
function toast(msg, action) {
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button>${esc(action.label)}</button>` : '');
  if (action) el.querySelector('button').onclick = () => { el.classList.remove('show'); action.fn(); };
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(_toastT); _toastT = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2200);
}

/* ================= bottom sheet ================= */
const sheets = [];
function openSheet(title, html, onMount, opts = {}) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', title);
  sh.innerHTML = `<div class="sheet-grab"></div><div class="sheet-h"><h2>${esc(title)}</h2>${opts.headerExtra || ''}<button class="icon-btn" data-close aria-label="Close">${I('x')}</button></div><div class="sheet-b">${html}</div>`;
  document.body.append(scrim, sh); document.body.style.overflow = 'hidden';
  const api = { el: sh, body: sh.querySelector('.sheet-b'), close };
  function close() {
    sh.classList.remove('show'); scrim.classList.remove('show');
    setTimeout(() => { sh.remove(); scrim.remove(); }, 300);
    const i = sheets.indexOf(api); if (i >= 0) sheets.splice(i, 1); if (!sheets.length) document.body.style.overflow = '';
    opts.onClose && opts.onClose();
  }
  scrim.onclick = close; sh.querySelector('[data-close]').onclick = close;
  // swipe down to dismiss (mobile)
  let y0 = null, dy = 0; const grab = sh.querySelector('.sheet-h');
  const start = e => { if (window.innerWidth >= 700) return; y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; };
  const move = e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transform = `translateY(${dy}px)`; };
  const end = () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 110) close(); y0 = null; };
  [grab, sh.querySelector('.sheet-grab')].forEach(g => { g.addEventListener('touchstart', start, { passive: true }); g.addEventListener('touchmove', move, { passive: true }); g.addEventListener('touchend', end); });
  sheets.push(api);
  requestAnimationFrame(() => { scrim.classList.add('show'); sh.classList.add('show'); });
  onMount && onMount(api);
  return api;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && sheets.length) sheets[sheets.length - 1].close(); });

function confirmSheet(title, msg, okLabel, danger) {
  return new Promise(res => {
    let done = false;
    openSheet(title, `<p class="muted" style="margin:4px 0 0">${msg}</p><div class="btn-row"><button class="btn" data-no>Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okLabel)}</button></div>`, s => {
      s.body.querySelector('[data-no]').onclick = () => { done = true; s.close(); res(false); };
      s.body.querySelector('[data-ok]').onclick = () => { done = true; s.close(); res(true); };
    }, { onClose: () => { if (!done) res(false); } });
  });
}

/* ================= charts ================= */
function niceScale(v, n = 4) { if (v <= 0) v = 1; const raw = v / n; const e = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / e; const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; const k = Math.ceil(v / step); return { max: step * k, ticks: k }; }
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }

// grouped bars: labels[], series [{name,color,values}]
function barChart(...a) { return chartSlot('bar', a); }
function drawBar(W, labels, series, h = 190) {
  const H = h, pl = 44, pr = 6, pt = 10, pb = 24;
  const sc = niceScale(Math.max(1, ...series.flatMap(s => s.values))); const max = sc.max, T = sc.ticks;
  const cw = (W - pl - pr) / labels.length; const gw = Math.min(cw * 0.7, 54); const bw = gw / series.length;
  let g = '';
  for (let i = 0; i <= T; i++) { const y = pt + (H - pt - pb) * (1 - i / T); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 8}" y="${y + 3.5}" text-anchor="end">${fmtC(max * i / T)}</text>`; }
  labels.forEach((l, i) => {
    const x0 = pl + cw * i + (cw - gw) / 2;
    series.forEach((s, j) => { const v = s.values[i] || 0; const bh = (H - pt - pb) * v / max; const x = x0 + j * bw; g += `<rect x="${x + 1}" y="${H - pb - bh}" width="${Math.max(1, bw - 2)}" height="${Math.max(0, bh)}" rx="${Math.min(3, bw / 3)}" fill="${s.color}"><title>${esc(s.name)} ${esc(l)}: ${fmt(v)}</title></rect>`; });
    g += `<text x="${pl + cw * i + cw / 2}" y="${H - 7}" text-anchor="middle">${esc(l)}</text>`;
  });
  const leg = series.length > 1 ? `<div class="legend">${series.map(s => `<span><b style="background:${s.color}"></b>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Bar chart">${g}</svg>${leg}`;
}

function lineChart(...a) { return chartSlot('line', a); }
function drawLine(W, labels, values, color = 'var(--accent)', h = 180) {
  const H = h, pl = 48, pr = 8, pt = 12, pb = 24;
  const mn0 = Math.min(0, ...values), mx0 = Math.max(1, ...values);
  const span0 = mx0 - Math.min(0, mn0); const sc = niceScale(span0); const step = sc.max / sc.ticks;
  const mn = mn0 < 0 ? -Math.ceil(-mn0 / step) * step : 0; const mx = Math.ceil(mx0 / step) * step || step; const T = Math.round((mx - mn) / step);
  const X = i => pl + (W - pl - pr) * (labels.length === 1 ? 0.5 : i / (labels.length - 1));
  const Y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
  let g = '';
  for (let i = 0; i <= T; i++) { const v = mn + step * i, y = Y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${pl - 8}" y="${y + 3.5}" text-anchor="end">${fmtC(v)}</text>`; }
  const pts = values.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  g += `<polygon points="${X(0)},${Y(Math.max(mn, 0))} ${pts} ${X(values.length - 1)},${Y(Math.max(mn, 0))}" fill="${color}" opacity=".08"/>`;
  g += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  values.forEach((v, i) => { g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.2" fill="var(--surface)" stroke="${color}" stroke-width="2"><title>${esc(labels[i])}: ${fmt(v)}</title></circle>`; });
  const lstep = Math.ceil(labels.length / 8);
  labels.forEach((l, i) => { if (i % lstep === 0 || i === labels.length - 1) g += `<text x="${X(i)}" y="${H - 7}" text-anchor="middle">${esc(l)}</text>`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Line chart">${g}</svg>`;
}

const CHARTS = {}; let _chN = 0;
function chartSlot(kind, args) { const id = 'ch' + (++_chN); CHARTS[id] = { kind, args }; const h = kind === 'bar' ? (args[2] || 190) : (args[3] || 180); return `<div class="chartbox" data-ch="${id}" style="min-height:${h}px"></div>`; }
function drawCharts(root = document) {
  $$('.chartbox', root).forEach(el => { const c = CHARTS[el.dataset.ch]; if (!c) return; const W = Math.max(240, Math.floor(el.clientWidth)); if (el._w === W) return; el._w = W; el.innerHTML = c.kind === 'bar' ? drawBar(W, ...c.args) : drawLine(W, ...c.args); });
}
let _rsT; window.addEventListener('resize', () => { clearTimeout(_rsT); _rsT = setTimeout(() => drawCharts(), 150); });
// items [{label,value,color}] -> interactive donut with legend
let _donutN = 0;
function donut(items, centerLabel = 'Total') {
  items = items.filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  if (items.length > 8) { const rest = items.slice(7); items = items.slice(0, 7).concat({ label: 'Everything else', value: sum(rest, x => x.value), color: '#9BA0AC' }); }
  const total = sum(items, x => x.value); const id = 'dn' + (++_donutN);
  if (!total) return `<p class="muted small">Nothing to show for this period yet.</p>`;
  const R = 62, r = 44, C = 75; let a0 = -Math.PI / 2; let arcs = '';
  items.forEach((it, i) => {
    const frac = it.value / total; const a1 = a0 + frac * Math.PI * 2 - (items.length > 1 ? 0.012 : 0);
    const large = a1 - a0 > Math.PI ? 1 : 0; const P = (rad, a) => `${C + rad * Math.cos(a)},${C + rad * Math.sin(a)}`;
    const d = frac >= 0.9999 ? `M${C - R},${C}a${R},${R} 0 1,0 ${R * 2},0a${R},${R} 0 1,0 -${R * 2},0M${C - r},${C}a${r},${r} 0 1,1 ${r * 2},0a${r},${r} 0 1,1 -${r * 2},0` : `M${P(R, a0)}A${R},${R} 0 ${large} 1 ${P(R, a1)}L${P(r, a1)}A${r},${r} 0 ${large} 0 ${P(r, a0)}Z`;
    arcs += `<path class="seg-arc" data-i="${i}" d="${d}" fill="${it.color}" fill-rule="evenodd" style="cursor:pointer"/>`;
    a0 += frac * Math.PI * 2;
  });
  const legend = items.map((it, i) => `<button class="dl-row" data-i="${i}"><b style="background:${it.color}"></b><span>${esc(it.label)}</span><em>${fmt(it.value)}</em></button>`).join('');
  const data = JSON.stringify(items.map(x => [x.label, x.value]));
  return `<div class="donut-wrap" id="${id}" data-items='${esc(data)}' data-total="${total}" data-cl="${esc(centerLabel)}">
    <svg viewBox="0 0 150 150" width="150" height="150" role="img" aria-label="Donut chart">${arcs}
      <text x="75" y="70" text-anchor="middle" style="fill:var(--muted);font-size:10.5px" class="dc-l">${esc(centerLabel)}</text>
      <text x="75" y="88" text-anchor="middle" style="fill:var(--text);font-size:15px;font-weight:650" class="dc-v">${esc(fmtC(total))}</text></svg>
    <div class="dl">${legend}</div></div>`;
}
function wireDonuts(root) {
  $$('.donut-wrap', root).forEach(w => {
    const items = JSON.parse(w.dataset.items); const total = +w.dataset.total; let sel = -1;
    const set = i => {
      sel = sel === i ? -1 : i;
      $$('.seg-arc', w).forEach(p => (p.style.opacity = sel < 0 || +p.dataset.i === sel ? 1 : 0.25));
      $$('.dl-row', w).forEach(b => b.classList.toggle('on', +b.dataset.i === sel));
      $('.dc-l', w).textContent = sel < 0 ? w.dataset.cl : items[sel][0].slice(0, 16);
      $('.dc-v', w).textContent = sel < 0 ? fmtC(total) : pct(items[sel][1] / total);
    };
    $$('.seg-arc,.dl-row', w).forEach(el => el.addEventListener('click', () => set(+el.dataset.i)));
  });
}

function progress(v, max, cls = '') { const p = max ? clamp(v / max, 0, 1) : 0; const c = max && v / max >= 1 ? 'over' : max && v / max >= 0.8 ? 'warn' : ''; return `<div class="bar ${cls} ${cls.includes('plain') ? '' : c}"><i style="width:${(p * 100).toFixed(1)}%"></i></div>`; }
function deltaPill(cur, prev, goodWhenDown) {
  if (!prev) return cur ? `<span class="delta flat">New this month</span>` : '';
  const d = (cur - prev) / prev; if (Math.abs(d) < 0.005) return `<span class="delta flat">Same as last month</span>`;
  const down = d < 0; const good = goodWhenDown ? down : !down;
  return `<span class="delta ${good ? 'good' : 'bad'}">${down ? '↓' : '↑'} ${Math.abs(d * 100).toFixed(1)}% vs last month</span>`;
}
