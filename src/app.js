/* 1С·декс v2: интерфейс */
(function () {
  'use strict';
  const { chapters, lessons, challenges, badges, levels, cheats, sandboxExamples, makeR } = CONTENT;
  const LANG = (window.I18N && I18N.lang) || 'ru', EN = LANG === 'en';
  const T = (s) => (window.I18N ? I18N.t(s) : s);
  const nameOf = () => (EN && S.name === 'Ученик' ? 'Student' : S.name);
  const LOC = EN ? 'en-GB' : 'ru';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  const strip = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

  /* ================= состояние ================= */
  const KEY = 'odindex.v1';
  const fresh = () => ({
    xp: 0, done: {}, codes: {}, badges: {}, streak: 0, lastDay: '', sandboxRuns: 0, sandboxCode: '', name: 'Ученик',
    goal: 20, onboarded: false, days: {}, daily: null, combo: 0, bestCombo: 0, chests: {}, chestsOpened: 0, peeked: {}, sound: true, view: 'map', tourDone: false, music: 'off', musicVol: 50, accent: 'orange', egg1c: false
  });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* хранилище недоступно */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* без сохранения */ } };
  const dayStr = (t) => new Date(t).toLocaleDateString('sv');
  const today = () => dayStr(Date.now());
  const lvlIdx = () => Math.floor(S.xp / 100);
  const lvlTitle = (i) => levels[Math.min(i, levels.length - 1)];
  function D() {
    if (!S.daily || S.daily.date !== today()) S.daily = { date: today(), xp: 0, lessons: 0, runs: 0, clean: 0, maxCombo: 0, chal: 0, claimed: {} };
    return S.daily;
  }

  /* ================= звук ================= */
  let AC = null;
  function sfx(name) {
    if (!S.sound) return;
    const seqs = {
      run: [[660, .05]], ok: [[523, .08], [659, .08], [784, .08], [1046, .18]], fail: [[330, .1], [247, .2]],
      chest: [[392, .07], [523, .07], [659, .07], [784, .07], [1046, .3]], tap: [[880, .03]], level: [[523, .1], [523, .1], [784, .1], [1046, .3]]
    };
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      let t = AC.currentTime;
      seqs[name].forEach(([f, d]) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.045, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
        o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.92;
      });
    } catch (e) { /* без звука */ }
  }

  /* ================= пиксель-арт ================= */
  function sprite(map, pal, cls, title) {
    const h = map.length, w = map[0].length; let r = '';
    map.forEach((row, y) => { for (let x = 0; x < w; x++) { const c = row[x]; if (c !== '.' && pal[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>`; } });
    return `<svg class="${cls || ''}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'}>${r}</svg>`;
  }
  const SURF = [['......hhh.......', '.....hhhhh......', '.....hsssk......', '......sss.......', '...ssssssss.....', '..s..sSsss..s...', '.s...sSsss...s..', '......ssss......', '.....oooooo.....', '.....oo..oo.....', '....ss....ss....', '...ss......ss...', '.bbBBbbbbbbbbbb.', '..bbbbbbbbbbbb..', 'ffwwffwwwffwwwff', 'wwwwwwwwwwwwwwww'], ['................', '......hhh.......', '.....hhhhh......', '.....hsssk...ss.', '......sss..ss...', 'ss..ssSssss.....', '..ssssSsss......', '.....ssss.......', '....oooooo......', '...oo....oo.....', '..ss......ss....', '.bbBBbbbbbbbbbb.', '..bbbbbbbbbbbb..', '...f..f...f..f..', 'fwwffwwwffwwwffw', 'wwwwwwwwwwwwwwww'], ['.s............s.', '..s...hhh...s...', '...s.hhhhh.s....', '....shsssks.....', '......sss.......', '.....sSsss......', '.....sSsss......', '......ssss......', '.....oooooo.....', '.....oo..oo.....', '....ss....ss....', '...ss......ss...', '..bbBBbbbbbbbbb.', '...bbbbbbbbbbb..', 'wffwwwffwwwffwww', 'wwwwwwwwwwwwwwww'], ['................', '......hhh.......', '.....hhhhh......', '.....hsssk...ss.', '......sss..ss...', 'ss..ssSssss.....', '..ssssSsss......', '.....ssss.......', '....oooooo......', '...oo....oo.....', '..ss......ss....', '.bbBBbbbbbbbbbb.', '..bbbbbbbbbbbb..', '..f..f...f..f...', 'wwffwwwffwwwffww', 'wwwwwwwwwwwwwwww']];
  const OWL = SURF[0];
  const OWL_PAL = { k: '#ff5a1f', h: '#1c1c1b', s: '#4a4a47', S: '#2e2e2c', o: '#ff5a1f', b: '#8a8a86', B: '#ff5a1f', f: '#bfc7c5', w: '#2b3a40' };
  const surfFrame = (map) => { let r = ''; map.forEach((row, y) => { for (let x = 0; x < 16; x++) { const c = row[x]; if (c !== '.' && OWL_PAL[c]) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${OWL_PAL[c]}"/>`; } }); return r; };
  const SURF_SVG = SURF.map((f, i) => `<g class="fr f${i}">${surfFrame(f)}</g>`).join('');
  const SURL = {};
  (function initSurf() {
    let css = '';
    ['surf', 'stand', 'faces'].forEach(k => {
      const d = SURFDATA[k]; const bin = atob(d.png); const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      SURL[k] = URL.createObjectURL(new Blob([u8], { type: 'image/png' }));
      css += `.mc.${k === 'faces' ? 'face' : k} { background-image: url(${SURL[k]}); aspect-ratio: ${k === 'faces' ? d.w : k === 'surf' ? d.w : d.w} / ${d.h}; }\n`;
    });
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  })();
  const owl = (cls) => `<span class="mc surf ${cls || ''}" role="img" aria-label="Сёрфер Бит на волне"></span>`;
  const face = (i, cls) => `<span class="mc face f${i} ${cls || ''}" role="img" aria-label="Сёрфер Бит"></span>`;
  const stand = (cls) => `<span class="mc stand ${cls || ''}" role="img" aria-label="Сёрфер Бит с доской"></span>`;
  let FIRE = '';
  const makeFire = () => sprite(['....r...', '...rr...', '..ryr.r.', '.ryyrrr.', '.ryyyyr.', 'rryywyrr', '.ryyyyr.', '..rrrr..'], { r: ACCP(), y: mixHex(ACCP(), '#ffffff', 0.5), w: '#ffffff' }, 'ic');
  const GEM = sprite(['..kkkk..', '.kglggk.', 'kgllgggk', 'kglggggk', 'kgggggdk', '.kgggdk.', '..kddk..', '...kk...'], { k: '#000000', g: '#bdbdb8', l: '#ffffff', d: '#6a6a66' }, 'ic');
  const CHEST_MAP = ['..kkkkkkkk..', '.kbbbbbbbbk.', 'kbbbbbbbbbbk', 'kddddyyddddk', 'kkkkkyykkkkk', 'kbbbbyybbbbk', 'kbbbbbbbbbbk', 'kddddddddddk', 'kkkkkkkkkkkk'];
  const CHEST_OPEN = ['kkkkkkkkkkkk', 'kbbbbbbbbbbk', 'kddddddddddk', 'kkkkkkkkkkkk', 'kyywyyywyyyk', 'kbbbbyybbbbk', 'kbbbbbbbbbbk', 'kddddddddddk', 'kkkkkkkkkkkk'];
  const CHEST_PAL = { k: '#000000', b: '#3a3a38', d: '#1e1e1d', y: '#ff5a1f', w: '#ffd2bf' };
  const chestSvg = (open) => sprite(open ? CHEST_OPEN : CHEST_MAP, CHEST_PAL, '', 'Сундук');

  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ================= ASCII-рендер, частицы, пиксельный логотип ================= */
  const RAMP = ' .:-=+*#%@';
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const KINDS = ['tower', 'rings', 'spiral', 'waves', 'bars', 'grid', 'noise', 'city'];
  const art = (kind, seed, attrs) => `<canvas class="ascii" data-k="${kind}" data-s="${seed || 1}" ${attrs || ''} aria-hidden="true"></canvas>`;
  const regionArt = (ch, attrs) => art(KINDS[(ch.id - 1) % KINDS.length], ch.id * 7 + 3, attrs);
  const BANNER = () => art('city', 5, 'data-live data-fs="11"');
  const hash = (x, y, s) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sm = (t) => t * t * (3 - 2 * t);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * sm(xf) + (c - a) * sm(yf) + (a - b - c + d) * sm(xf) * sm(yf);
  }
  function prepArt(kind, seed) {
    const R = rng(seed); const P = { seed, ph: R() * 10 };
    if (kind === 'city') {
      P.b = []; let x = 0;
      while (x < 1) { const w = 0.025 + R() * 0.06; P.b.push({ x0: x, x1: x + w, h: 0.2 + R() * 0.62 * (0.5 + 0.5 * Math.sin(x * 3 + P.ph) ** 2) + R() * 0.15 }); x += w + R() * 0.008; }
    }
    return P;
  }
  function field(k, u, v, t, a, P, cx, cy) {
    switch (k) {
      case 'sphere': {
        const x = (u - 0.5) * a * 2.25, y = (v - 0.5) * 2.25, r2 = x * x + y * y;
        if (r2 > 1) return hash(cx, cy, 3) > 0.985 ? 0.25 + 0.5 * hash(cx, cy, 9) * (0.6 + 0.4 * Math.sin(t * 2 + cx)) : (r2 < 1.12 ? 0.1 : 0);
        const z = Math.sqrt(1 - r2), L = Math.max(0, -0.5 * x - 0.55 * y + 0.68 * z);
        const lon = Math.atan2(x, z) + t * 0.45, lat = Math.asin(y);
        const g = (Math.abs(Math.sin(lon * 6)) < 0.14 || Math.abs(Math.sin(lat * 6)) < 0.12) ? 1 : 0.42;
        return 0.08 + L * g;
      }
      case 'rings': {
        const x = (u - 0.5) * a, y = v - 0.5, d = Math.sqrt(x * x + y * y);
        return (0.5 + 0.5 * Math.sin(d * 46 - t * 3)) * Math.max(0, 1 - d * 1.7);
      }
      case 'waves': {
        let b = 0;
        for (let i = 0; i < 4; i++) { const c = 0.3 + i * 0.14 + 0.07 * Math.sin(u * 6 + i + t * 0.8 + P.ph) + 0.03 * Math.sin(u * 17 + i * 2); b = Math.max(b, Math.exp(-Math.pow((v - c) * 24, 2)) * (1 - i * 0.16)); }
        return b + (hash(cx, cy, 1) > 0.97 ? 0.2 : 0);
      }
      case 'spiral': {
        const x = (u - 0.5) * a, y = v - 0.5, r = Math.sqrt(x * x + y * y), an = Math.atan2(y, x);
        return (0.5 + 0.5 * Math.sin(an * 3 + Math.log(r + 0.01) * 9 - t * 2)) * Math.max(0, 1 - r * 1.8);
      }
      case 'bars': {
        const n = 18, i = Math.floor(u * n), h = 0.15 + 0.75 * Math.abs(Math.sin(i * 1.7 + P.ph + t * 1.3));
        return (v > 1 - h && (u * n - i) < 0.72) ? 0.95 - (v - (1 - h)) * 0.6 : 0;
      }
      case 'grid': {
        const hz = 0.42; if (v < hz) return Math.exp(-Math.pow((v - hz) * 30, 2)) * 0.5;
        const z = 1 / (v - hz + 0.03), X = (u - 0.5) * z * a;
        const fx = Math.abs(X * 0.8 - Math.round(X * 0.8)), fz = (z * 0.35 + t * 0.6) % 1;
        return ((fx < 0.06 || fz < 0.09) ? 0.85 : 0.04) * Math.min(1, (v - hz) * 3);
      }
      case 'noise': {
        const n = vnoise(u * 9 * a, v * 9 + t * 0.4, P.seed);
        return n > 0.55 ? (n - 0.55) * 2.4 : 0;
      }
      case 'city': {
        const bld = P.b.find(q => u >= q.x0 && u < q.x1);
        if (v > 0.94) return 0.18 + (hash(cx, cy, 2) > 0.7 ? 0.25 : 0);
        if (bld && v > 1 - bld.h - 0.06) {
          const win = (cx % 2 === 0) && (cy % 2 === 1);
          if (!win) return 0.16;
          const on = hash(cx, cy, P.seed) > 0.45 + 0.25 * Math.sin(t * 0.7 + cx * 0.3 + cy);
          return on ? 0.85 : 0.3;
        }
        return hash(cx, cy, 5) > 0.992 ? 0.45 : 0;
      }
      case 'tower': {
        const inMain = u > 0.3 && u < 0.62 && v > 0.1, inLow = u > 0.1 && u < 0.9 && v > 0.48, inSide = u > 0.62 && u < 0.78 && v > 0.28;
        if (v > 0.92) return (cx % 3 === 0 && hash(cx, cy, 4) > 0.3) ? 0.35 : 0.05;
        if (inMain || inLow || inSide) {
          const edge = (inMain && (u < 0.32 || v < 0.13)) ? 1 : 0;
          const w = (cx % 2 === 0 ? 0.85 : 0.45) * (cy % 2 === 0 ? 1 : 0.7);
          return Math.max(edge * 0.95, w * (0.55 + 0.45 * hash(cx, cy, 7)) * (inLow && !inMain ? 0.9 : 1));
        }
        return 0;
      }
    }
    return 0;
  }
  function sizeCanvas(cv) {
    const r = cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }
  function setupAscii(cv) {
    const kind = cv.dataset.k, seed = +cv.dataset.s || 1, live = cv.hasAttribute('data-live') && !reduceMotion;
    const fs = +cv.dataset.fs || 10, accent = cv.hasAttribute('data-acc');
    const P = prepArt(kind, seed); let st = sizeCanvas(cv);
    const draw = (t) => {
      const { ctx, w, h } = st; ctx.clearRect(0, 0, w, h);
      ctx.font = `${fs}px "JetBrains Mono", ui-monospace, monospace`; ctx.textBaseline = 'top';
      const cw = fs * 0.62, chh = fs * 1.18, cols = Math.floor(w / cw), rows = Math.floor(h / chh);
      if (!cols || !rows) return;
      const a = (cols * cw) / (rows * chh);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        let b = field(kind, (x + 0.5) / cols, (y + 0.5) / rows, t, a, P, x, y);
        if (b <= 0.06) continue; b = Math.min(1, b);
        const ci = Math.round(b * (RAMP.length - 1)); if (!ci) continue;
        const g = Math.round(60 + 190 * b);
        ctx.fillStyle = accent && b > 0.97 ? ACC() : `rgb(${g},${g},${Math.round(g * 0.97)})`;
        ctx.fillText(RAMP[ci], x * cw, y * chh);
      }
    };
    draw(seed * 0.37);
    cv._redraw = () => { st = sizeCanvas(cv); draw(seed * 0.37); };
    if (live) {
      const t0 = performance.now(); let last = 0;
      const loop = (now) => { if (!cv.isConnected) return; if (now - last > 90) { draw((now - t0) / 1000); last = now; } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }
  function setupParticles(cv) {
    const R = rng(+cv.dataset.s || 7), withOwl = cv.hasAttribute('data-owl'), dim = +cv.dataset.dim || 1;
    const ridges = 6, pts = [];
    const ridgeY = (k, x, t) => 0.5 + k * 0.085 + 0.07 * Math.sin(x * 4.2 + k * 1.3 + t * 0.12) + 0.035 * Math.sin(x * 11 + k * 2.1 - t * 0.08);
    for (let i = 0; i < 6000; i++) {
      const k = Math.floor(Math.pow(R(), 1.3) * ridges); const x = R() * 1.1 - 0.05;
      const gauss = (R() + R() + R() - 1.5) * (0.018 + k * 0.006);
      pts.push({ k, x, o: gauss, a: (0.25 + R() * 0.75) * (1 - k * 0.08), s: R() < 0.06 ? 1.6 : 1 });
    }
    const dust = []; for (let i = 0; i < 260; i++) dust.push({ x: R(), y: R() * 0.55, a: R() * 0.7, tw: R() * 6 });
    const owlFrames = [];
    if (withOwl) {
      const img = new Image();
      img.onload = () => {
        const fw = SURFDATA.surf.w, fh = SURFDATA.surf.h, oc = document.createElement('canvas'); oc.width = fw * 4; oc.height = fh;
        const octx = oc.getContext('2d'); octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0, 0, fw * 4, fh).data;
        for (let f = 0; f < 4; f++) {
          const pts2 = [];
          for (let y = 0; y < fh; y += 2) for (let x = 0; x < fw; x += 2) {
            const k = (y * fw * 4 + f * fw + x) * 4; if (data[k + 3] < 120) continue;
            const lum = (data[k] + data[k + 1] + data[k + 2]) / 765;
            if (R() > 0.55 + lum * 0.4) continue;
            pts2.push({ x: x / fw * 16, y: y / fh * 14, a: 0.25 + lum * 0.85 });
          }
          owlFrames.push(pts2);
        }
      };
      img.src = SURL.surf;
    }
    const spray = []; for (let i = 0; i < 160; i++) spray.push({ ph: R(), vx: 0.6 + R() * 1.4, vy: 1 + R() * 2.2, a: 0.4 + R() * 0.6 });
    let st = sizeCanvas(cv);
    const draw = (t) => {
      const { ctx, w, h } = st; ctx.clearRect(0, 0, w, h);
      dust.forEach(d => { ctx.fillStyle = `rgba(240,240,236,${(d.a * (0.6 + 0.4 * Math.sin(t * 1.5 + d.tw))) * 0.6 * dim})`; ctx.fillRect(d.x * w, d.y * h, 1, 1); });
      pts.forEach(p => {
        const y = (ridgeY(p.k, p.x, t) + p.o) * h, x = p.x * w;
        ctx.fillStyle = `rgba(240,240,236,${p.a * dim})`; ctx.fillRect(x, y, p.s, p.s);
      });
      if (withOwl) {
        const fx = 0.63 + 0.07 * Math.sin(t * 0.45), sz = Math.min(h * 0.46, w * 0.28) / 16;
        const cx = fx * w, gy = ridgeY(0, fx, t) * h;
        const slope = (ridgeY(0, fx + 0.01, t) - ridgeY(0, fx - 0.01, t)) * h / (0.02 * w);
        const ang = Math.atan(slope) * 0.8 + 0.1 * Math.sin(t * 1.6), ca = Math.cos(ang), sa = Math.sin(ang);
        const frame = owlFrames.length ? owlFrames[Math.floor(t * 3.2) % owlFrames.length] : [];
        const bob = Math.sin(t * 2.4) * sz * 0.3;
        frame.forEach(p => {
          const lx = (p.x - 8) * sz, ly = (p.y - 12.5) * sz;
          const X = cx + lx * ca - ly * sa, Y = gy + lx * sa + ly * ca + bob;
          ctx.fillStyle = `rgba(222,222,218,${Math.min(1, p.a)})`;
          ctx.fillRect(X, Y, 1.3, 1.3);
        });
        const dir = Math.cos(t * 0.45) >= 0 ? -1 : 1;
        spray.forEach(q => {
          const age = (t * 0.9 + q.ph) % 1;
          const X = cx + dir * (6 * sz + age * q.vx * 8 * sz), Y = gy - 1.5 * sz - age * q.vy * 4 * sz + age * age * 9 * sz + bob;
          ctx.fillStyle = `rgba(230,236,234,${q.a * (1 - age)})`; ctx.fillRect(X, Y, 1.3, 1.3);
        });
      }
    };
    draw(0);
    cv._redraw = () => { st = sizeCanvas(cv); draw(0); };
    if (!reduceMotion) {
      const t0 = performance.now(); let last = 0;
      const loop = (now) => { if (!cv.isConnected) return; if (now - last > 33) { draw((now - t0) / 1000); last = now; } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }
  function mountArt(root) {
    $$('canvas.ascii', root || document).forEach(cv => { if (!cv._m) { cv._m = 1; setupAscii(cv); } });
    $$('canvas.particles', root || document).forEach(cv => { if (!cv._m) { cv._m = 1; setupParticles(cv); } });
  }
  let rsT; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => $$('canvas.ascii, canvas.particles').forEach(c => c._redraw && c._redraw()), 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => $$('canvas.ascii').forEach(c => c._redraw && c._redraw()));

  const GLYPHS = {
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    'С': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    '·': ['.', '.', '.', '#', '.', '.', '.'],
    'Д': ['.###.', '.#.#.', '.#.#.', '.#.#.', '.#.#.', '#####', '#...#'],
    'Е': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'К': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#']
  };
  function wordmark(text) {
    let x = 0; const cells = [];
    [...text].forEach(ch => { const g = GLYPHS[ch]; if (!g) { x += 3; return; } g.forEach((row, y) => [...row].forEach((c, i) => { if (c === '#') cells.push([x + i, y]); })); x += g[0].length + 1; });
    const W = x - 1, H = 7;
    const back = cells.map(([cx, cy]) => `<rect x="${cx + 0.22}" y="${cy + 0.22}" width="1" height="1" fill="none" stroke="#2a2a2a" stroke-width=".05"/>`).join('');
    const front = cells.map(([cx, cy]) => `<rect x="${cx}" y="${cy}" width="1.01" height="1.01" fill="url(#wmS)"/>`).join('');
    return `<svg viewBox="-0.2 -0.2 ${W + 0.6} ${H + 0.6}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="1С·декс" shape-rendering="crispEdges">
      <defs><pattern id="wmS" width="1" height=".25" patternUnits="userSpaceOnUse"><rect width="1" height=".19" fill="#e9e9e6"/><rect y=".19" width="1" height=".06" fill="#7a7a76"/></pattern></defs>${back}${front}</svg>`;
  }


  /* ================= Цвет акцента ================= */
  const ACCENTS = {
    orange: { t: 'Оранжевый', acc: '#ff5a1f', h: '#ff7440', d: '#c43f0f', bd: '#4a2414', m: '#a3401a' },
    red: { t: 'Красный', acc: '#ff3b3b', h: '#ff6060', d: '#c42020', bd: '#4a1515', m: '#a32626' },
    yellow: { t: 'Жёлтый', acc: '#ffcc33', h: '#ffd966', d: '#c99a00', bd: '#4a3b10', m: '#a38214' },
    blue: { t: 'Голубой', acc: '#3ec5ff', h: '#6dd4ff', d: '#1b8fc4', bd: '#123a4a', m: '#1e6f94' },
    violet: { t: 'Фиолетовый', acc: '#9b7bff', h: '#b39bff', d: '#6d4fd6', bd: '#2a1f4a', m: '#5b45a3' },
    '1c': { t: 'Оригинальный 1С', acc: '#a67700', h: '#c48a00', d: '#7a5800', bd: '#e2c36a', m: '#e0b84a', pic: '#ffcc33' }
  };
  const hexRgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const ACCx = () => ACCENTS[S.accent] || ACCENTS.orange;
  const ACC = () => ACCx().acc;
  const ACCP = () => ACCx().pic || ACCx().acc;
  function applyAccent(id, rerender) {
    if (!ACCENTS[id]) id = 'orange';
    S.accent = id;
    const a = ACCENTS[id], st = document.documentElement.style;
    st.setProperty('--acc', a.acc); st.setProperty('--acc-h', a.h); st.setProperty('--acc-d', a.d);
    st.setProperty('--acc-bd', a.bd); st.setProperty('--acc-m', a.m); st.setProperty('--acc-rgb', hexRgb(id === '1c' ? '#e6b400' : a.acc).join(','));
    if (id === '1c') document.documentElement.dataset.theme = '1c'; else delete document.documentElement.dataset.theme;
    const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = id === '1c' ? '#ececec' : '#0a0a0a';
    CHEST_PAL.y = ACCP(); FIRE = makeFire();
    if (rerender) {
      save(); const y = window.scrollY; renderHeader(); router(); window.scrollTo(0, y);
      const wm = $('#wordmark'); if (wm) wm.innerHTML = wordmark('1С·ДЕКС');
    }
  }

  /* ================= Фоновая музыка ================= */
  const MUSIC = [
    { id: 'off', t: 'Выключена' },
    { id: 'surf', t: 'Прибой', d: 'Шум волн и тёплые аккорды' },
    { id: 'night', t: 'Ночной город', d: 'Лоу-фай пэд, медленное арпеджио, треск пластинки' },
    { id: 'deep', t: 'Глубина', d: 'Тёмный гул и редкие далёкие отзвуки' },
    { id: 'crystal', t: 'Кристаллы', d: '8-битные колокольчики в пустоте' },
    { id: 'server', t: 'Серверная', d: 'Гул стоек, вентиляторы и щелчки данных' }
  ];
  let mus = null;
  const mtof = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const musVol = () => Math.pow((S.musicVol == null ? 50 : S.musicVol) / 100, 1.6) * 0.9;
  function nbuf(ac, sec, kind) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'crackle') d[i] = Math.random() < 0.0007 ? w * 0.9 : 0;
      else d[i] = w;
    }
    return b;
  }
  function makeReverb(ac, sec) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    const cv = ac.createConvolver(); cv.buffer = b; return cv;
  }
  const keep = (m, n) => { m.nodes.push(n); return n; };
  function noiseSrc(m, kind, sec) { const s = keep(m, m.ac.createBufferSource()); s.buffer = nbuf(m.ac, sec || 4, kind); s.loop = true; s.start(); return s; }
  function filt(m, type, f, q) { const n = keep(m, m.ac.createBiquadFilter()); n.type = type; n.frequency.value = f; if (q != null) n.Q.value = q; return n; }
  function gainN(m, v) { const g = keep(m, m.ac.createGain()); g.gain.value = v; return g; }
  function lfo(m, freq, depth, param, base) { if (base != null) param.value = base; const o = keep(m, m.ac.createOscillator()), g = keep(m, m.ac.createGain()); o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(param); o.start(); return o; }
  function osc(m, type, f, det) { const o = keep(m, m.ac.createOscillator()); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(); return o; }
  function voice(m, dest, o) {
    const ac = m.ac, t = o.t || ac.currentTime + 0.02, os = ac.createOscillator(), g = ac.createGain();
    os.type = o.type || 'sine'; os.frequency.value = o.f; if (o.det) os.detune.value = o.det;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.peak, t + o.a);
    g.gain.setValueAtTime(o.peak, t + Math.max(o.a, o.dur - o.r)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    os.connect(g); let last = g;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); last = f; }
    last.connect(dest); (o.sends || []).forEach(s => last.connect(s));
    os.start(t); os.stop(t + o.dur + 0.05);
    os.onended = () => { try { os.disconnect(); g.disconnect(); last.disconnect(); } catch (e) { /* ok */ } };
  }
  function loopT(m, fn, first) { const tick = () => { if (mus !== m) return; const next = fn(); m.timers.push(setTimeout(tick, next)); }; m.timers.push(setTimeout(tick, first || 50)); }
  function delayLine(m, time, fb, lp, out, rev) {
    const dl = keep(m, m.ac.createDelay(2)), g = gainN(m, fb), f = filt(m, 'lowpass', lp);
    dl.delayTime.value = time; dl.connect(f); f.connect(g); g.connect(dl); f.connect(out); if (rev) f.connect(rev); return dl;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const PRESETS = {
    surf(m, out, rev) {
      const n = noiseSrc(m, 'white', 5), f = filt(m, 'lowpass', 650, 0.3), g = gainN(m, 0.1);
      n.connect(f); f.connect(g); g.connect(out); g.connect(rev);
      lfo(m, 0.075, 0.085, g.gain, 0.1); lfo(m, 0.06, 360, f.frequency, 650);
      const n2 = noiseSrc(m, 'white', 3), f2 = filt(m, 'highpass', 2600), g2 = gainN(m, 0.015);
      n2.connect(f2); f2.connect(g2); g2.connect(out); lfo(m, 0.075, 0.013, g2.gain, 0.015);
      const prog = [[48, 55, 59, 64], [45, 52, 57, 60, 64], [41, 48, 52, 57, 60], [43, 50, 55, 59, 62]]; let k = 0;
      loopT(m, () => { const ch = prog[k++ % prog.length]; ch.forEach((nn, i) => voice(m, out, { f: mtof(nn), type: i % 2 ? 'triangle' : 'sine', dur: 11.5, peak: 0.026, a: 3, r: 4.5, det: rnd(-6, 6), lp: 1500, sends: [rev] })); return 9000; });
    },
    night(m, out, rev) {
      const prog = [[45, 52, 55, 60, 64], [41, 48, 52, 57, 64], [38, 50, 53, 57, 60], [40, 47, 50, 55, 59]]; let k = 0, cur = prog[0];
      const dl = delayLine(m, 0.63, 0.38, 1800, out, rev);
      loopT(m, () => { cur = prog[k++ % prog.length]; cur.forEach(nn => { voice(m, out, { f: mtof(nn), type: 'sawtooth', dur: 10, peak: 0.017, a: 2.5, r: 3.5, det: -7, lp: 700, sends: [rev] }); voice(m, out, { f: mtof(nn), type: 'sawtooth', dur: 10, peak: 0.017, a: 2.5, r: 3.5, det: 7, lp: 700 }); }); return 8000; });
      let step = 0;
      loopT(m, () => { if (Math.random() < 0.78) voice(m, out, { f: mtof(pick(cur) + pick([12, 12, 24])), type: 'triangle', dur: 0.55, peak: 0.042, a: 0.01, r: 0.5, sends: [dl, rev] }); step++; return step % 2 ? 470 : 370; }, 1500);
      const cr = noiseSrc(m, 'crackle', 4), cf = filt(m, 'highpass', 1200), cg = gainN(m, 0.18); cr.connect(cf); cf.connect(cg); cg.connect(out);
    },
    deep(m, out, rev) {
      const f = filt(m, 'lowpass', 300, 2), g = gainN(m, 0.055); f.connect(g); g.connect(out); g.connect(rev);
      osc(m, 'sawtooth', 55, -6).connect(f); osc(m, 'sawtooth', 55, 6).connect(f); osc(m, 'sine', 82.41).connect(f);
      lfo(m, 0.025, 170, f.frequency, 300);
      const sub = gainN(m, 0.045); osc(m, 'sine', 41.2).connect(sub); sub.connect(out);
      const w = noiseSrc(m, 'brown', 6), wf = filt(m, 'lowpass', 220), wg = gainN(m, 0.05); w.connect(wf); wf.connect(wg); wg.connect(out); lfo(m, 0.04, 0.035, wg.gain, 0.05);
      loopT(m, () => { const nn = pick([64, 69, 71, 76, 81]); voice(m, out, { f: mtof(nn), type: 'sine', dur: 7, peak: 0.03, a: 0.02, r: 6.8, sends: [rev, rev] }); voice(m, out, { f: mtof(nn - 12), type: 'triangle', dur: 6, peak: 0.01, a: 0.05, r: 5.8, sends: [rev] }); return rnd(6000, 12000); }, 2500);
    },
    crystal(m, out, rev) {
      const dl = delayLine(m, 0.375, 0.45, 3000, out, rev);
      const pads = [[48, 55], [45, 52], [41, 48], [43, 50]]; let k = 0;
      loopT(m, () => { pads[k++ % pads.length].forEach(nn => voice(m, out, { f: mtof(nn), type: 'sine', dur: 12, peak: 0.03, a: 3, r: 4, sends: [rev] })); return 10000; });
      const pent = [72, 74, 76, 79, 81, 84, 86, 88];
      loopT(m, () => {
        const nn = pick(pent); voice(m, out, { f: mtof(nn), type: 'triangle', dur: 2.6, peak: 0.04, a: 0.004, r: 2.55, sends: [dl, rev] });
        if (Math.random() < 0.25) voice(m, out, { f: mtof(nn + 12), type: 'square', dur: 1.2, peak: 0.008, a: 0.004, r: 1.15, sends: [dl] });
        return rnd(650, 1700);
      }, 900);
    },
    server(m, out, rev) {
      const h1 = gainN(m, 0.022); osc(m, 'sine', 100).connect(h1); h1.connect(out); lfo(m, 0.6, 0.006, h1.gain, 0.022);
      const h2 = gainN(m, 0.04); osc(m, 'sine', 50).connect(h2); h2.connect(out);
      const fan = noiseSrc(m, 'white', 4), ff = filt(m, 'bandpass', 700, 0.7), fg = gainN(m, 0.07); fan.connect(ff); ff.connect(fg); fg.connect(out);
      const wh = noiseSrc(m, 'white', 3), wf = filt(m, 'bandpass', 2400, 3), wg = gainN(m, 0.012); wh.connect(wf); wf.connect(wg); wg.connect(out); lfo(m, 0.22, 0.008, wg.gain, 0.012);
      loopT(m, () => { const n = 1 + Math.floor(Math.random() * 6), t = m.ac.currentTime + 0.02; for (let i = 0; i < n; i++) voice(m, out, { f: rnd(900, 2600), type: 'square', t: t + i * 0.07, dur: 0.045, peak: 0.009, a: 0.003, r: 0.04, sends: [rev] }); return rnd(400, 2600); }, 1200);
      const clickBuf = nbuf(m.ac, 0.012, 'white');
      loopT(m, () => { const t = m.ac.currentTime; for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) { const s = m.ac.createBufferSource(), g = m.ac.createGain(), f = m.ac.createBiquadFilter(); s.buffer = clickBuf; f.type = 'highpass'; f.frequency.value = 2000; g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(out); s.start(t + i * 0.09); s.onended = () => { try { s.disconnect(); g.disconnect(); f.disconnect(); } catch (e) { /* ok */ } }; } return rnd(900, 3800); }, 2000);
    }
  };
  function stopMusic() {
    if (!mus) return; const m = mus; mus = null;
    m.timers.forEach(clearTimeout);
    try { const t = m.ac.currentTime, g = m.master.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.9); } catch (e) { /* ok */ }
    setTimeout(() => { m.nodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) { /* ok */ } try { n.disconnect(); } catch (e) { /* ok */ } }); try { m.master.disconnect(); } catch (e) { /* ok */ } }, 1100);
  }
  function startMusic(id) {
    stopMusic();
    if (!id || id === 'off' || !PRESETS[id]) return;
    let ac; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); ac = AC; } catch (e) { return; }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
    const m = { id, ac, master, nodes: [comp], timers: [] }; mus = m;
    const rev = keep(m, makeReverb(ac, 3.6)), rg = gainN(m, 0.4); rev.connect(rg); rg.connect(master);
    PRESETS[id](m, master, rev);
    master.gain.setValueAtTime(0, ac.currentTime); master.gain.linearRampToValueAtTime(document.hidden ? 0 : musVol(), ac.currentTime + 2.5);
  }
  function setMusicVol() { if (!mus) return; const t = mus.ac.currentTime, g = mus.master.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(musVol(), t + 0.15); }
  const musicKick = () => { if (S.music && S.music !== 'off' && !mus) startMusic(S.music); };
  document.addEventListener('pointerdown', musicKick, true);
  document.addEventListener('keydown', musicKick, true);
  document.addEventListener('visibilitychange', () => {
    if (!mus) return; const t = mus.ac.currentTime, g = mus.master.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(document.hidden ? 0 : musVol(), t + 0.8);
  });

  /* ================= Язык ================= */
  function setLang(l) {
    if (l === LANG) return;
    S.lang = l; save(); sfx('tap');
    waveTurn(() => { location.reload(); });
  }

  /* ================= Настройки звука и цвета ================= */
  let eggN = 0, eggT = 0;
  function settingsHtml() {
    return `<p class="muted set-l">Язык · Language</p>
      <div class="langsw" data-noi18n><button type="button" class="mopt ${EN ? '' : 'on'}" data-lang="ru"><b>Русский</b></button><button type="button" class="mopt ${EN ? 'on' : ''}" data-lang="en"><b>English</b></button></div>
      <p class="muted set-l">Фоновая музыка</p>
      <div class="mlist">${MUSIC.map(m => `<button type="button" class="mopt ${(S.music || 'off') === m.id ? 'on' : ''}" data-m="${m.id}"><b>${m.t}</b>${m.d ? `<span>${m.d}</span>` : ''}</button>`).join('')}</div>
      <label class="vol"><span>Громкость</span><input type="range" min="0" max="100" step="1" value="${S.musicVol == null ? 50 : S.musicVol}" id="volR" aria-label="Громкость музыки"></label>
      <p class="muted set-l">Цвет акцента</p>
      <div class="swatches">${Object.entries(ACCENTS).filter(([k]) => k !== '1c' || S.egg1c).map(([k, a]) => `<button type="button" class="sw ${S.accent === k ? 'on' : ''} ${k === '1c' ? 'sw1c' : ''}" data-acc="${k}" style="--c:${a.acc}" title="${a.t}" aria-label="${a.t}"></button>`).join('')}</div>
      <p class="muted acc-name">${esc(ACCx().t)}</p>`;
  }
  function bindSettings(root) {
    $$('[data-lang]', root).forEach(b => { b.onclick = () => setLang(b.dataset.lang); });
    $$('[data-m]', root).forEach(b => {
      b.onclick = () => {
        S.music = b.dataset.m; save();
        $$('[data-m]', root).forEach(x => x.classList.toggle('on', x === b));
        startMusic(S.music);
      };
    });
    const vr = $('#volR', root);
    if (vr) vr.oninput = () => { S.musicVol = +vr.value; setMusicVol(); clearTimeout(vr._t); vr._t = setTimeout(save, 300); };
    $$('[data-acc]', root).forEach(b => {
      b.onclick = () => {
        const k = b.dataset.acc;
        if (k === 'yellow') {
          const now = Date.now(); eggN = now - eggT < 900 ? eggN + 1 : 1; eggT = now;
          if (eggN === 4 && S.accent === 'yellow') toast('Хм, жёлтый тут не просто так…');
          if (eggN >= 7) {
            eggN = 0; S.egg1c = true; applyAccent('1c', true); sfx('level'); confetti();
            setTimeout(() => toast('Режим «Оригинальный 1С» включён. Почти как в Конфигураторе'), 200);
            return;
          }
          if (S.accent === 'yellow') { sfx('tap'); return; }
        } else eggN = 0;
        sfx('tap'); applyAccent(k, true);
      };
    });
  }

  /* ================= прогресс, XP, значки ================= */
  const chLessons = (id) => lessons.filter(l => l.ch === id);
  const chDone = (id) => chLessons(id).every(l => S.done[l.id]);
  const earned = (b) => (b.ch ? chDone(b.ch) : b.test(S));
  function checkBadges(silent) {
    const nb = []; const before = bizStageIdx(nBadges());
    badges.forEach(b => { if (!S.badges[b.id] && earned(b)) { S.badges[b.id] = Date.now(); nb.push(b); } });
    if (!silent && nb.length) {
      const after = bizStageIdx(nBadges());
      nb.forEach((b, i) => setTimeout(() => toast(`Бизнес: ${UPG[b.id] ? UPG[b.id].t : b.title}`), 1600 + i * 700));
      if (after > before) setTimeout(() => toast(`Компания переехала: ${BIZ_STAGES[after].name}!`), 1600 + nb.length * 700);
    }
    return nb;
  }
  const badgeEl = (b, cls) => `<div class="badge ${cls || ''} ${S.badges[b.id] ? '' : 'off'}" style="--c:${b.color}" title="${esc(b.title)}: ${esc(b.desc)}">${esc(b.glyph)}</div>`;
  function touchStreak() {
    const t = today(); if (S.lastDay === t) return;
    S.streak = S.lastDay === dayStr(Date.now() - 864e5) ? (S.streak || 0) + 1 : 1; S.lastDay = t;
  }
  function addXP(n) {
    const before = lvlIdx(); const d = D(); const t = today();
    const goalBefore = d.xp >= S.goal;
    S.xp += n; S.days[t] = (S.days[t] || 0) + n; d.xp += n;
    touchStreak(); save(); renderHeader();
    if (!goalBefore && d.xp >= S.goal) setTimeout(() => toast('Цель дня выполнена! Серия в безопасности'), 900);
    return lvlIdx() > before;
  }
  function award(item, clean) {
    if (S.done[item.id]) return null;
    const peeked = !!S.peeked[item.id];
    const xp = peeked ? Math.ceil(item.xp / 2) : item.xp;
    S.done[item.id] = Date.now();
    const d = D(); d.lessons++; if (item.level) d.chal++;
    if (clean) { d.clean++; S.combo = (S.combo || 0) + 1; } else S.combo = 0;
    d.maxCombo = Math.max(d.maxCombo, S.combo); S.bestCombo = Math.max(S.bestCombo || 0, S.combo);
    const bonus = clean && S.combo > 0 && S.combo % 5 === 0 ? 10 : 0;
    const levelUp = addXP(xp + bonus);
    const nb = checkBadges(); save(); renderHeader();
    return { xp, bonus, badges: nb, levelUp, combo: S.combo, peeked };
  }
  const nextLesson = () => lessons.find(l => !S.done[l.id]) || lessons[lessons.length - 1];

  /* задания дня (Duolingo daily quests + Boot.dev сундуки) */
  const QUESTS = [
    { id: 'xp', t: () => `Набери ${S.goal} XP`, need: () => S.goal, val: d => d.xp },
    { id: 'l2', t: () => 'Пройди 2 урока', need: () => 2, val: d => d.lessons },
    { id: 'run5', t: () => 'Запусти код 5 раз', need: () => 5, val: d => d.runs },
    { id: 'clean', t: () => 'Реши задание без подсказки', need: () => 1, val: d => d.clean },
    { id: 'combo3', t: () => 'Собери комбо из 3 чистых решений', need: () => 3, val: d => d.maxCombo },
    { id: 'chal', t: () => 'Реши любой челлендж', need: () => 1, val: d => d.chal }
  ];
  function todayQuests() {
    const R = rng(+today().replace(/-/g, ''));
    const rest = QUESTS.slice(1);
    const a = rest.splice(Math.floor(R() * rest.length), 1)[0];
    const b = rest[Math.floor(R() * rest.length)];
    return [QUESTS[0], a, b];
  }
  function questsHtml() {
    const d = D();
    return `<div class="quests">${todayQuests().map(q => {
      const n = q.need(), v = Math.min(q.val(d), n), ok = v >= n, cl = d.claimed[q.id];
      return `<div class="quest ${ok ? 'ok' : ''}"><div class="qt"><span>${esc(q.t())}</span><small>${v}/${n}</small></div>
        <div class="xpbar sm ${ok ? '' : 'y'}"><i style="width:${v / n * 100}%"></i></div>
        ${ok && !cl ? `<button class="btn xs" type="button" data-claim="${q.id}">Открыть сундук</button>` : cl ? '<span class="claimed">Награда получена</span>' : ''}</div>`;
    }).join('')}</div>`;
  }
  function bindClaims(root) {
    $$('[data-claim]', root).forEach(b => {
      b.onclick = () => {
        const d = D(); if (d.claimed[b.dataset.claim]) return;
        d.claimed[b.dataset.claim] = true; save();
        openChest('Награда за задание дня', 10, 25, router);
      };
    });
  }
  function goalRing(big) {
    const d = D(); const p = Math.min(100, Math.round(d.xp / S.goal * 100));
    if (!big) return `<span class="ring" style="--p:${p}"></span>`;
    return `<div class="ringbox"><div class="ring big" style="--p:${p}"></div><b>${Math.min(d.xp, 999)}/${S.goal}</b></div>`;
  }
  function weekHtml() {
    const now = new Date(); const dow = (now.getDay() + 6) % 7; const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let h = '';
    for (let i = 0; i < 7; i++) {
      const dt = new Date(now); dt.setDate(now.getDate() - dow + i);
      const xp = S.days[dayStr(dt)] || 0;
      h += `<div class="wd ${xp ? 'on' : ''} ${i === dow ? 'today' : ''}" title="${xp} XP"><span>${names[i]}</span><i>${xp ? FIRE : ''}</i></div>`;
    }
    return `<div class="week">${h}</div>`;
  }


  /* ================= Мой бизнес ================= */
  const BIZ_STAGES = [
    { need: 0, name: 'Гараж', w: 40, floors: 1, staff: 1, d: 'Ноутбук на коробке, удлинитель и мечта.' },
    { need: 1, name: 'Стол в коворкинге', w: 44, floors: 1, staff: 2, d: 'Первый клиент нашёл тебя по сарафану.' },
    { need: 3, name: 'Офис в подвале', w: 50, floors: 2, staff: 4, d: 'Окна под потолком, зато свой ключ.' },
    { need: 5, name: 'Свой офис', w: 56, floors: 3, staff: 7, d: 'Вывеска, переговорка и кулер с водой.' },
    { need: 8, name: 'Отдел внедрения', w: 60, floors: 4, staff: 12, d: 'Целый этаж программистов и аналитиков.' },
    { need: 11, name: 'Бизнес-центр', w: 64, floors: 6, staff: 20, d: 'Свой лифт, ресепшн и очередь из заказчиков.' },
    { need: 14, name: 'Башня интегратора', w: 60, floors: 8, staff: 35, d: 'Франшиза в трёх городах и офис со стеклянным фасадом.' },
    { need: 17, name: 'Штаб-квартира', w: 66, floors: 10, staff: 60, d: 'Флагман рынка. На крыше прожекторы и вертолётная площадка.' }
  ];
  const UPG = {
    first: { t: 'Ноутбук включён', e: 'В окне загорается рабочий экран' },
    hello: { t: 'Вывеска над входом', e: 'Клиенты наконец находят дверь' },
    vars: { t: 'Серверная стойка', e: 'База клиентов больше не живёт в тетрадке' },
    cond: { t: 'Кофейный киоск', e: 'Разработчики довольны, баги злятся' },
    loops: { t: 'Стеклянный лифт', e: 'Кабина ездит по фасаду туда и обратно' },
    coll: { t: 'Склад архивов', e: 'Пристройка для коробок с первичкой' },
    func: { t: 'Второй корпус', e: 'Отдельное крыло для отдела поддержки' },
    str: { t: 'Неон на крыше', e: 'Название компании светится над районом' },
    arch: { t: 'Антенна связи', e: 'Обмен с филиалами по расписанию' },
    job: { t: 'Касса у входа', e: 'Первые настоящие заказчики платят по счёту' },
    hunter: { t: 'Служебный автомобиль', e: 'Выезды к клиентам без такси' },
    legend: { t: 'Вертолётная площадка', e: 'Директор прилетает на планёрку' },
    streak3: { t: 'Ночная смена', e: 'Свет в окнах горит круглые сутки' },
    tinker: { t: 'R&D-лаборатория', e: 'Купол, где тестируют новые обработки' },
    senior: { t: 'Флаг компании', e: 'Развевается на крыше' },
    sniper: { t: 'Прожекторы', e: 'Лучи видно с другого конца города' },
    goal: { t: 'Деревья у входа', e: 'Зелёная зона для созвонов' },
    chests: { t: 'Сейф с выручкой', e: 'Стоит у ресепшена и мигает' },
    cert: { t: 'Табличка «Партнёр года»', e: 'Висит у главного входа' }
  };
  const nBadges = () => badges.filter(b => S.badges[b.id]).length;
  const bizStageIdx = (n) => { let i = 0; BIZ_STAGES.forEach((s, k) => { if (n >= s.need) i = k; }); return i; };
  function bizStats() {
    const n = nBadges(), si = bizStageIdx(n), st = BIZ_STAGES[si];
    const staff = st.staff + (S.badges.func ? 3 : 0) + (S.badges.tinker ? 2 : 0);
    const clients = Math.round(3 * Math.pow(1.7, si) + n * 2 + lessons.filter(l => S.done[l.id]).length);
    const revenue = clients * 38000 * (1 + si * 0.15);
    const rating = Math.min(5, 3 + n * 0.115).toFixed(1);
    return { n, si, st, staff, clients, revenue, rating, next: BIZ_STAGES[si + 1] };
  }
  const rub = (v) => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';

  function bizScene(opts) {
    opts = opts || {};
    const { si, st, staff } = bizStats();
    const AP = ACCP(), AL = mixHex(AP, '#ffffff', 0.72), AM = mixHex(AP, '#000000', 0.38), AD = mixHex(AP, '#000000', 0.58), AF = mixHex(AP, '#000000', 0.2);
    const has = (id) => !!S.badges[id];
    const R = rng(97);
    const W = 200, H = 150, G = 132;
    let r = '';
    const box = (x, y, w, h, c, extra) => { r += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${extra || ''}/>`; };
    // небо и звёзды
    ['#060606', '#090909', '#0c0c0b', '#0f0f0e', '#131312'].forEach((c, i) => box(0, i * 27, W, 28, c));
    for (let i = 0; i < 60; i++) box(Math.floor(R() * W), 20 + Math.floor(R() * 70), 1, 1, '#e9e9e6', `opacity="${(0.2 + R() * 0.6).toFixed(2)}" class="star" style="animation-delay:${(R() * 3).toFixed(1)}s"`);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) box(172 + x, 38 + y, 1, 1, x * x + y * y > 5 ? '#8a8a86' : '#d6d6d2');
    // дальний город
    let x = 0; while (x < W) { const w = 6 + Math.floor(R() * 10), h = 10 + Math.floor(R() * 30); box(x, G - h, w, h, '#121211'); for (let k = 0; k < 4; k++) if (R() > 0.55) box(x + 1 + Math.floor(R() * (w - 2)), G - h + 2 + Math.floor(R() * (h - 4)), 1, 1, '#3a3a38'); x += w + 1; }
    // прожекторы
    if (has('sniper') && si >= 3) {
      const ty = G - st.floors * (st.floors >= 8 ? 8 : 10) - 4;
      r += `<polygon points="${100 - 12},${ty} ${60},0 ${78},0" fill="${AP}" opacity=".08" class="beam"/><polygon points="${100 + 12},${ty} ${140},0 ${122},0" fill="#e9e9e6" opacity=".07" class="beam b2"/>`;
    }
    // земля, тротуар, дорога
    box(0, G, W, H - G, '#0b0b0b'); box(0, G, W, 1, '#2c2c2a'); box(0, G + 5, W, 1, '#1e1e1d');
    for (let i = 0; i < W; i += 10) box(i, G + 11, 5, 1, '#3a3a38');
    // пристройки слева
    if (has('coll')) { box(22, G - 12, 22, 12, '#151514'); box(22, G - 13, 22, 1, '#2c2c2a'); box(27, G - 8, 12, 8, '#1f1f1e'); for (let i = 0; i < 4; i++) box(28, G - 7 + i * 2, 10, 1, '#2a2a28'); }
    if (has('tinker')) { for (let yy = 0; yy < 8; yy++) { const hw = Math.round(Math.sqrt(64 - yy * yy) * 1.2); box(56 - hw, G - 1 - yy, hw * 2, 1, yy === 7 ? '#3a3a38' : '#1a1a19'); } box(53, G - 5, 2, 2, '#59d98e', 'class="blink"'); box(58, G - 4, 1, 1, AP, 'class="blink b2"'); }
    if (has('vars')) { box(8, G - 16, 8, 16, '#141413'); box(8, G - 16, 8, 1, '#3a3a38'); for (let i = 0; i < 6; i++) { box(9, G - 14 + i * 2, 6, 1, '#232322'); box(14, G - 14 + i * 2, 1, 1, i % 2 ? '#59d98e' : AP, `class="blink" style="animation-delay:${i * 0.3}s"`); } }
    // главное здание
    const bw = st.w, bx = 100 - Math.round(bw / 2), fh = st.floors >= 8 ? 8 : 10, bh = st.floors * fh, by = G - bh;
    if (si === 0) {
      box(bx, G - 18, bw, 18, '#171716'); box(bx - 1, G - 19, bw + 2, 2, '#2c2c2a');
      const dw = bw - 12; box(bx + 6, G - 14, dw, 14, '#0e0e0d');
      for (let i = 0; i < 7; i++) box(bx + 6, G - 14 + i * 2, dw, 1, '#1c1c1b');
      box(bx + 6, G - 4, dw, 4, '#050505');
      if (has('first')) { box(bx + 16, G - 3, 6, 2, AP, 'class="glow"'); box(bx + 15, G - 1, 8, 1, '#3a3a38'); }
      box(bx + bw / 2, G - 17, 1, 1, AL, 'class="blink"');
    } else {
      if (has('func')) { box(bx + bw, G - Math.min(bh, 30), 24, Math.min(bh, 30), '#141413'); box(bx + bw, G - Math.min(bh, 30) - 1, 24, 1, '#2c2c2a'); for (let f = 0; f < Math.min(st.floors, 3); f++) for (let k = 0; k < 4; k++) box(bx + bw + 3 + k * 5, G - 8 - f * 10, 3, 4, hash(k, f, 3) > 0.4 ? AF : '#222221'); }
      box(bx, by, bw, bh, '#191918'); box(bx - 1, by - 1, bw + 2, 2, '#2e2e2c');
      if (si >= 5) box(bx + bw - 6, by, 6, bh, '#151514');
      const cols = Math.floor((bw - 6) / 6);
      for (let f = 0; f < st.floors; f++) {
        if (f > 0) box(bx, G - f * fh, bw, 1, '#232322');
        for (let k = 0; k < cols; k++) {
          const wx = bx + 4 + k * 6, wy = G - f * fh - (fh - 2);
          if (f === 0 && Math.abs(wx + 2 - 100) < 6) continue;
          const lit = hash(k, f, si) > (has('streak3') ? 0.2 : 0.55);
          const first = has('first') && f === 0 && k === 0;
          box(wx, wy, 4, fh === 8 ? 4 : 5, first ? AP : lit ? (hash(k, f, 9) > 0.85 ? AL : hash(k, f, 4) > 0.5 ? AM : AD) : '#1f1f1e', first ? 'class="glow"' : (lit && hash(k, f, 5) > 0.85 ? 'class="flick"' : ''));
          if (si === 2 && f === 0) box(wx, wy, 4, 2, '#0a0a0a');
        }
      }
      box(96, G - 8, 8, 8, '#070707'); box(99, G - 8, 1, 8, '#2c2c2a');
      if (has('hello')) { box(91, G - 12, 18, 3, '#0a0a0a', 'stroke="#3a3a38" stroke-width=".4"'); r += `<text x="100" y="${G - 9.7}" font-family="JetBrains Mono, monospace" font-size="2.4" fill="#e9e9e6" text-anchor="middle">1С·ИНТЕГРАТОР</text>`; }
      if (has('cert')) { box(105, G - 6, 3, 3, AP); box(106, G - 5, 1, 1, AL); }
      if (has('job')) { box(110, G - 9, 7, 9, '#141413', 'stroke="#3a3a38" stroke-width=".3"'); r += `<text x="113.5" y="${G - 4}" font-family="JetBrains Mono, monospace" font-size="4" font-weight="700" fill="#b0ff6a" text-anchor="middle" class="glow">₽</text>`; }
      if (has('chests')) { box(88, G - 4, 4, 4, '#2a2a28'); box(89, G - 3, 1, 1, AP, 'class="blink"'); }
      if (has('loops') && st.floors >= 2) { box(bx - 5, by + 2, 4, bh - 2, '#0f0f0e', 'stroke="#3a3a38" stroke-width=".3"'); r += `<rect x="${bx - 4.5}" y="${G - 6}" width="3" height="4" fill="${AL}" class="lift" style="--lh:${-(bh - 10)}px"/>`; }
      // крыша
      const ry = by - 1;
      if (has('str')) { r += `<text x="100" y="${ry - 2}" font-family="JetBrains Mono, monospace" font-size="4" font-weight="700" fill="${AP}" text-anchor="middle" class="neon">${esc((S.bizName || '1С·Интегратор').toUpperCase().slice(0, 18))}</text>`; }
      if (has('arch')) { box(bx + 6, ry - 14, 1, 13, '#3a3a38'); box(bx + 4, ry - 10, 5, 1, '#3a3a38'); box(bx + 6, ry - 15, 1, 1, '#ff4d4d', 'class="blink"'); }
      if (has('senior')) { box(bx + bw - 8, ry - 12, 1, 12, '#6a6a66'); r += `<g class="flag"><rect x="${bx + bw - 7}" y="${ry - 12}" width="6" height="4" fill="${AP}"/><rect x="${bx + bw - 7}" y="${ry - 10}" width="6" height="1" fill="${AD}"/></g>`; }
      if (has('legend') && si >= 4) { box(bx + bw / 2 - 9, ry - 1, 18, 1, '#3a3a38'); r += `<text x="${100}" y="${ry - 1.5}" font-family="JetBrains Mono, monospace" font-size="3" fill="#e9e9e6" text-anchor="middle">H</text><g class="heli"><rect x="${bx + bw / 2 + 3}" y="${ry - 6}" width="7" height="3" fill="#2c2c2a"/><rect x="${bx + bw / 2}" y="${ry - 7}" width="13" height=".6" fill="#8a8a86"/><rect x="${bx + bw / 2 + 10}" y="${ry - 5}" width="4" height="1" fill="#2c2c2a"/></g>`; }
    }
    // кофе и деревья
    if (has('cond')) { box(140, G - 9, 10, 9, '#1a1a19'); box(139, G - 11, 12, 2, AP); box(142, G - 6, 6, 3, '#0a0a0a'); r += `<g class="steam"><rect x="144" y="${G - 15}" width="1" height="2" fill="#6a6a66"/><rect x="146" y="${G - 17}" width="1" height="2" fill="#6a6a66"/></g>`; }
    if (has('goal')) [80, 118].forEach(tx => { box(tx, G - 3, 4, 3, '#2a2a28'); box(tx - 1, G - 9, 6, 6, '#1f3d2b'); box(tx, G - 10, 4, 1, '#2b5a3d'); });
    if (has('hunter')) { r += `<g class="car park"><rect x="160" y="${G + 1}" width="14" height="3" fill="#2c2c2a"/><rect x="163" y="${G - 1}" width="7" height="2" fill="#3a3a38"/><rect x="172" y="${G + 1}" width="2" height="1" fill="${AL}"/></g>`; }
    // проезжающие машины (клиенты)
    const cars = Math.min(6, 1 + si);
    for (let i = 0; i < cars; i++) {
      const dur = 7 + (i * 2.3) % 6, rev = i % 2 === 1, y = G + (rev ? 7 : 12);
      r += `<g class="drive ${rev ? 'rev' : ''}" style="animation-duration:${dur}s;animation-delay:-${(i * 1.7).toFixed(1)}s"><rect x="0" y="${y}" width="9" height="2" fill="#2a2a28"/><rect x="2" y="${y - 1}" width="5" height="1" fill="#3a3a38"/><rect x="${rev ? 0 : 8}" y="${y}" width="1" height="1" fill="${AL}"/><rect x="${rev ? 8 : 0}" y="${y}" width="1" height="1" fill="#ff4d4d"/></g>`;
    }
    // сотрудники
    const people = Math.min(16, staff);
    for (let i = 0; i < people; i++) {
      const dur = 9 + ((i * 3.7) % 9), rev = i % 2 === 0, col = i === 0 ? AP : ['#d6d6d2', '#8a8a86', '#b9b9b5'][i % 3];
      r += `<g class="walk ${rev ? 'rev' : ''}" style="animation-duration:${dur.toFixed(1)}s;animation-delay:-${(i * 2.1).toFixed(1)}s"><rect x="0" y="${G - 0.5}" width="1" height="1" fill="${col}"/><rect x="0" y="${G + 0.5}" width="1" height="2" fill="${col}" opacity=".85"/><rect x="0" y="${G + 2.5}" width="1" height="1.5" fill="#3a3a38"/></g>`;
    }
    const vw = si <= 2 ? 140 : si <= 4 ? 170 : 200, vh = Math.round(vw * 0.625);
    return `<svg class="bizsvg" viewBox="${(W - vw) / 2} ${H - vh} ${vw} ${vh}" preserveAspectRatio="xMidYMax slice" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Мой бизнес: ${esc(st.name)}">${r}</svg>`;
  }
  function bizMini() {
    const s = bizStats();
    return `<a class="card bizmini" href="#/business"><div class="bizmini-art">${bizScene()}</div>
      <div class="bizmini-b"><span class="chip cur">Стадия ${s.si + 1}/${BIZ_STAGES.length}</span><b>${esc(s.st.name)}</b>
      <div class="meta"><span>${s.staff} чел. · ${s.clients} клиентов</span><span>↗</span></div></div></a>`;
  }
  function viewBusiness() {
    setIde(false);
    const s = bizStats(); const has = (id) => !!S.badges[id];
    const toNext = s.next ? s.next.need - s.n : 0;
    const prog = s.next ? (s.n - s.st.need) / (s.next.need - s.st.need) * 100 : 100;
    const log = badges.filter(b => S.badges[b.id]).sort((a, b) => S.badges[b.id] - S.badges[a.id]);
    view().innerHTML = `<section class="section nob"><div class="wrap">
      <div class="sec-head"><p class="eyebrow">// 07 — Мой бизнес</p><span class="bk">[ Стадия ${s.si + 1} / ${BIZ_STAGES.length} ]</span></div>
      <h2><span id="bizName" contenteditable="true" spellcheck="false" title="Нажми, чтобы переименовать">${esc(S.bizName || '1С·Интегратор')}</span><span class="cursor"></span></h2>
      <p class="lead" style="margin-top:14px">Твоя студия внедрения 1С. Каждый значок добавляет улучшение, а с ростом числа значков компания переезжает в здание побольше и нанимает людей.</p>
      <div class="bizgrid">
        <div class="card bizstage">${bizScene()}
          <span class="lab tl">${esc(s.st.name)}</span><span class="lab tr">Улучшений ${s.n}/${badges.length}</span>
          <span class="lab bl">${esc(s.st.d)}</span></div>
        <div class="bizside">
          <div class="kpis biz-kpis">
            <div class="kpi"><b>${s.staff}</b><span>Сотрудников</span></div>
            <div class="kpi"><b>${s.clients}</b><span>Клиентов</span></div>
            <div class="kpi"><b>${rub(s.revenue).replace(' ₽', '')}</b><span>Выручка в месяц, ₽</span></div>
            <div class="kpi"><b>${s.rating}★</b><span>Рейтинг у клиентов</span></div>
          </div>
          <div class="card" style="padding:18px">
            <h4 class="sidelab">${s.next ? `Следующая стадия: ${esc(s.next.name)}` : 'Максимальная стадия'}</h4>
            <div class="xpbar y"><i style="width:${prog}%"></i></div>
            <div class="meta" style="margin-top:8px"><span>${s.next ? `ещё ${toNext} ${toNext === 1 ? 'значок' : toNext < 5 ? 'значка' : 'значков'}` : 'ты на вершине рынка'}</span><span>${s.n} / ${s.next ? s.next.need : s.n}</span></div>
            <div class="stages">${BIZ_STAGES.map((b, i) => `<span class="${i <= s.si ? 'on' : ''} ${i === s.si ? 'cur' : ''}" title="${esc(b.name)} · ${b.need} значков"></span>`).join('')}</div>
          </div>
        </div>
      </div>

      <div class="sec-head" style="margin-top:56px"><p class="eyebrow">// Улучшения</p><span class="bk">[ ${s.n} / ${badges.length} ]</span></div>
      <div class="grid upg-grid">${badges.map(b => `<div class="card upg ${has(b.id) ? '' : 'off'}">${badgeEl(b, 'sm')}<div><h4>${esc(UPG[b.id] ? UPG[b.id].t : b.title)}</h4><p>${has(b.id) ? esc(UPG[b.id] ? UPG[b.id].e : '') : 'Откроется: ' + esc(b.desc.charAt(0).toLowerCase() + b.desc.slice(1))}</p></div><span class="chip ${has(b.id) ? 'on' : ''}">${has(b.id) ? 'Есть' : 'Нет'}</span></div>`).join('')}</div>

      <div class="grid bizlower">
        <div><div class="sec-head" style="margin-top:56px"><p class="eyebrow">// Стадии роста</p><span class="bk">[ ${BIZ_STAGES.length} ]</span></div>
          <div class="route">${BIZ_STAGES.map((b, i) => `<div class="srow ${i <= s.si ? 'done' : ''} ${i === s.si ? 'cur' : ''}"><span class="no">[${pad2(i + 1)}]</span><div><b>${esc(b.name)}</b><small>${esc(b.d)}</small></div><span class="mt">${b.need} знач. · ${b.staff} чел.</span></div>`).join('')}</div></div>
        <div><div class="sec-head" style="margin-top:56px"><p class="eyebrow">// Журнал компании</p><span class="bk">[ ${log.length} ]</span></div>
          <div class="bizlog">${log.length ? log.map(b => `<div><time>${new Date(S.badges[b.id]).toLocaleDateString(LOC)}</time><span>${esc(UPG[b.id] ? UPG[b.id].t : b.title)}</span><small>за значок «${esc(b.title)}»</small></div>`).join('') : '<p class="muted">Пока пусто. Пройди первый урок, и в гараже включится ноутбук.</p>'}</div>
          <a class="btn" href="#/lesson/${nextLesson().id}" style="margin-top:22px">Развивать бизнес ↗</a></div>
      </div>
    </div></section>`;
    const nm = $('#bizName');
    nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nm.blur(); } });
    nm.addEventListener('blur', () => { S.bizName = nm.textContent.trim().slice(0, 24) || '1С·Интегратор'; nm.textContent = S.bizName; save(); });
  }

  /* ================= общие элементы ================= */
  function toast(msg) {
    let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }
  function confetti() {
    const colors = [ACCP(), '#e9e9e6', '#6a6a66', ACCP()];
    for (let i = 0; i < 70; i++) {
      const d = document.createElement('div'); d.className = 'confetti';
      d.style.left = Math.random() * 100 + 'vw'; d.style.background = colors[i % colors.length];
      d.style.animationDuration = (1.6 + Math.random() * 1.8) + 's'; d.style.animationDelay = (Math.random() * 0.4) + 's';
      const s = 3 + Math.floor(Math.random() * 3) * 2; d.style.width = d.style.height = s + 'px';
      document.body.appendChild(d); setTimeout(() => d.remove(), 4200);
    }
  }
  function modal(html, cls) {
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="card modal-box ${cls || ''}">${html}</div>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) close(); });
    m.close = close;
    const f = m.querySelector('input, a, button'); if (f) f.focus();
    return m;
  }
  function openChest(title, min, max, after) {
    const m = modal(`<h2>${esc(title)}</h2><p class="muted">Нажми на сундук, чтобы открыть</p>
      <button class="chest" type="button" id="chestBtn" aria-label="Открыть сундук">${chestSvg(false)}</button>
      <div id="chestRes" style="min-height:90px"></div>`, 'chest-modal');
    sfx('tap');
    $('#chestBtn', m).onclick = (e) => {
      const btn = e.currentTarget; if (btn.dataset.open) return; btn.dataset.open = 1;
      btn.classList.add('open'); btn.innerHTML = chestSvg(true); btn.style.animation = 'none';
      const xp = min + Math.floor(Math.random() * (max - min + 1));
      S.chestsOpened = (S.chestsOpened || 0) + 1;
      const lu = addXP(xp); const nb = checkBadges(); save();
      sfx('chest'); confetti();
      $('#chestRes', m).innerHTML = `<div class="xp">+${xp} XP</div>${lu ? `<p class="pixel" style="font-size:10px;color:var(--purple)">Новый уровень: ${lvlTitle(lvlIdx())}!</p>` : ''}
        ${nb.map(b => `<div class="newbadge">${badgeEl(b, 'sm')}<div><b>Новый значок: ${esc(b.title)}</b><small>${esc(b.desc)}</small></div></div>`).join('')}
        <div class="row"><button class="btn" type="button" data-close>Забрать</button></div>`;
      m.addEventListener('click', ev => { if (ev.target.closest('[data-close]') && after) after(); });
    };
  }
  function goalModal(after) {
    const opts = [[10, 'Легко', '5 минут в день'], [20, 'Нормально', '10 минут в день'], [30, 'Серьёзно', '15 минут в день'], [50, 'Хардкор', '20+ минут в день']];
    let sel = S.goal;
    const m = modal(`${owl('m')}<h2>Какую цель ставим на день?</h2>
      <p class="muted">Серия дней не сгорит, даже если пройдёшь всего один урок. Цель просто помогает держать темп. Поменять можно в профиле.</p>
      <div class="goals">${opts.map(o => `<button type="button" class="goalopt ${sel === o[0] ? 'sel' : ''}" data-g="${o[0]}"><b>${o[1]}</b><span>${o[2]}</span><em>${o[0]} XP</em></button>`).join('')}</div>
      <div class="row"><button class="btn" type="button" id="goalOk">Погнали</button></div>`);
    $$('.goalopt', m).forEach(b => { b.onclick = () => { sel = +b.dataset.g; $$('.goalopt', m).forEach(x => x.classList.toggle('sel', x === b)); sfx('tap'); }; });
    $('#goalOk', m).onclick = () => { S.goal = sel; S.onboarded = true; save(); renderHeader(); m.close(); toast(`Цель дня: ${sel} XP`); after && after(); };
  }

  /* ================= шапка, поиск ================= */
  function renderHeader() {
    const li = lvlIdx(); const d = D();
    $('#hdrStats').innerHTML = `
      <button class="pill" id="searchBtn" type="button" title="Поиск по курсу">⌕ <kbd>Ctrl K</kbd></button>
      ${S.combo >= 2 ? `<span class="pill combo" title="Чистые решения подряд">КОМБО x${S.combo}</span>` : ''}
      <span class="pill goal" title="Цель дня">${goalRing()}${d.xp}/${S.goal}</span>
      <span class="pill" title="Дней подряд">${FIRE}${S.streak || 0}</span>
      <span class="pill" title="Опыт">${GEM}${S.xp}</span>
      <a class="pill lvl" href="#/profile" title="Профиль">УР ${li + 1}</a>
      <button class="pill" id="sndBtn" type="button" title="${S.sound ? 'Выключить звук' : 'Включить звук'}" aria-label="Звук">${S.sound ? '♪' : '×'}</button>
      <button class="pill lang" id="langBtn" type="button" title="${EN ? 'Переключить на русский' : 'Switch to English'}" data-noi18n>${EN ? 'RU' : 'EN'}</button>`;
    $('#searchBtn').onclick = openSearch;
    $('#sndBtn').onclick = () => { S.sound = !S.sound; save(); renderHeader(); sfx('tap'); };
    $('#langBtn').onclick = () => setLang(EN ? 'ru' : 'en');
    const h = location.hash.slice(2).split('/')[0].split('#')[0] || '';
    const map = { '': 'home', course: 'course', lesson: 'course', challenges: 'challenges', challenge: 'challenges', sandbox: 'sandbox', cheats: 'cheats', profile: 'profile', certificate: 'profile', business: 'business' };
    $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.r === map[h]));
  }
  function openSearch() {
    if ($('.search')) return;
    const items = [
      { t: 'Главная', s: 'раздел', h: '#/' }, { t: 'Карта курса', s: 'раздел', h: '#/course' }, { t: 'Челленджи', s: 'раздел', h: '#/challenges' },
      { t: 'Песочница', s: 'раздел', h: '#/sandbox' }, { t: 'Шпаргалка', s: 'раздел', h: '#/cheats' }, { t: 'Профиль', s: 'раздел', h: '#/profile' }, { t: 'Сертификат', s: 'раздел', h: '#/certificate' }, { t: 'Мой бизнес', s: 'раздел', h: '#/business' },
      ...lessons.map(l => ({ t: l.title, s: `Глава ${l.ch}${S.done[l.id] ? ' · пройдено' : ''}`, h: '#/lesson/' + l.id, body: strip(l.theory) })),
      ...challenges.map(c => ({ t: c.title, s: `Челлендж · ${c.level}`, h: '#/challenge/' + c.id, body: strip(c.theory) })),
      ...cheats.map(c => ({ t: c.t, s: 'Шпаргалка', h: '#/cheats', body: c.c }))
    ];
    const m = modal(`<div class="search"><input id="sq" type="search" placeholder="Найти урок или тему: массив, Попытка, ТаблицаЗначений..." autocomplete="off" aria-label="Поиск"><div class="sres" id="sres" role="listbox"></div>
      <div class="shint"><kbd>↑</kbd><kbd>↓</kbd> выбрать · <kbd>Enter</kbd> открыть · <kbd>Esc</kbd> закрыть</div></div>`, 'wide');
    const inp = $('#sq', m), box = $('#sres', m); let sel = 0, found = [];
    const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');
    const draw = () => {
      const q = norm(inp.value.trim());
      found = !q ? items.filter(i => i.s === 'раздел' || i.h === '#/lesson/' + nextLesson().id).slice(0, 8)
        : items.map(i => ({ i, sc: norm(i.t).startsWith(q) ? 3 : norm(i.t).includes(q) ? 2 : (i.body && norm(i.body).includes(q)) ? 1 : 0 })).filter(x => x.sc).sort((a, b) => b.sc - a.sc).slice(0, 9).map(x => x.i);
      sel = Math.min(sel, Math.max(0, found.length - 1));
      box.innerHTML = found.length ? found.map((f, i) => `<a class="sr ${i === sel ? 'on' : ''}" href="${f.h}" role="option"><span>${esc(f.t)}</span><small>${esc(f.s)}</small></a>`).join('') : '<div class="sempty">Ничего не нашлось. Попробуй другое слово</div>';
    };
    inp.addEventListener('input', () => { sel = 0; draw(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(found.length - 1, sel + 1); draw(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      if (e.key === 'Enter' && found[sel]) { location.hash = found[sel].h; m.close(); }
    });
    box.addEventListener('click', e => { if (e.target.closest('a')) m.close(); });
    draw(); inp.focus();
  }

  /* ================= редактор с автодополнением ================= */
  const KW_LIST = ['Если', 'Тогда', 'ИначеЕсли', 'Иначе', 'КонецЕсли', 'Для', 'Каждого', 'Из', 'По', 'Цикл', 'КонецЦикла', 'Пока', 'Процедура', 'КонецПроцедуры',
    'Функция', 'КонецФункции', 'Возврат', 'Прервать', 'Продолжить', 'Перем', 'Экспорт', 'Знач', 'И', 'ИЛИ', 'НЕ', 'Истина', 'Ложь', 'Неопределено', 'Новый',
    'Попытка', 'Исключение', 'КонецПопытки', 'ВызватьИсключение'];
  const TPL = [
    { label: 'Если', ins: 'Если ¦ Тогда\n\t\nКонецЕсли;', h: 'шаблон блока' },
    { label: 'Для', ins: 'Для Сч = 1 По ¦ Цикл\n\t\nКонецЦикла;', h: 'цикл со счётчиком' },
    { label: 'Для Каждого', ins: 'Для Каждого ¦ Из  Цикл\n\t\nКонецЦикла;', h: 'перебор коллекции' },
    { label: 'Пока', ins: 'Пока ¦ Цикл\n\t\nКонецЦикла;', h: 'цикл с условием' },
    { label: 'Процедура', ins: 'Процедура ¦()\n\t\nКонецПроцедуры', h: 'шаблон' },
    { label: 'Функция', ins: 'Функция ¦()\n\tВозврат ;\nКонецФункции', h: 'шаблон' },
    { label: 'Попытка', ins: 'Попытка\n\t¦\nИсключение\n\tСообщить(ОписаниеОшибки());\nКонецПопытки;', h: 'обработка ошибок' }
  ];
  const TYPES = ['Массив', 'Структура', 'Соответствие', 'ТаблицаЗначений', 'ГенераторСлучайныхЧисел'];
  const METHODS = [['Добавить', 1], ['Количество', 0], ['Вставить', 1], ['Удалить', 1], ['Найти', 1], ['Очистить', 0], ['Получить', 1], ['Установить', 1], ['ВГраница', 0],
    ['Свойство', 1], ['Колонки', -1], ['Итог', 1], ['Сортировать', 1], ['ВыгрузитьКолонку', 1], ['НайтиСтроки', 1], ['СлучайноеЧисло', 1], ['Ключ', -1], ['Значение', -1],
    ['ПС', -1], ['Таб', -1], ['НПП', -1], ['Имя', -1]];
  const FN_MATH = new Set(['Pow', 'Sqrt', 'Log', 'Log10', 'Exp', 'Sin', 'Cos', 'Tan']);
  const BASE_ITEMS = [
    ...TPL.map(t => ({ label: t.label, ins: t.ins, k: 'tpl', h: t.h })),
    ...KW_LIST.map(w => ({ label: w, ins: w, k: 'kw' })),
    ...BSL.NAMES.map(n => ({ label: n, ins: n + '(¦)', k: 'fn', h: FN_MATH.has(n) ? 'математика' : '' })),
    ...TYPES.map(n => ({ label: n, ins: n, k: 'type' })), { label: 'Символы', ins: 'Символы.', k: 'type' }
  ];
  const METHOD_ITEMS = METHODS.map(([n, a]) => ({ label: n, ins: a < 0 ? n : a === 0 ? n + '()' : n + '(¦)', k: 'm', h: a < 0 ? 'свойство' : 'метод' }));
  const nrm = (s) => s.toLowerCase().replace(/ё/g, 'е');
  const ID_RE = /[A-Za-zА-Яа-яЁё_0-9]/;

  class Editor {
    constructor(host, value, opts) {
      this.opts = opts || {};
      host.innerHTML = `<div class="gutter" aria-hidden="true"></div><div class="code-area"><pre aria-hidden="true"><code></code></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Редактор кода 1С" aria-autocomplete="list"></textarea><div class="ac" hidden></div></div>`;
      this.g = $('.gutter', host); this.pre = $('pre', host); this.code = $('code', host); this.ta = $('textarea', host); this.acEl = $('.ac', host);
      this.ta.value = value || ''; this.errLine = null; this.ac = null; this.suppress = false;
      this.ta.addEventListener('input', (e) => {
        this.errLine = null; this.render(); this.opts.onChange && this.opts.onChange(this.ta.value);
        if (this.suppress) return;
        if (e.inputType === 'insertText' && e.data && (ID_RE.test(e.data.slice(-1)) || e.data === '.')) this.suggest();
        else if (e.inputType === 'deleteContentBackward' && this.ac) this.suggest();
        else this.hideAC();
      });
      this.ta.addEventListener('scroll', () => { this.sync(); this.hideAC(); });
      this.ta.addEventListener('keydown', (e) => this.key(e));
      this.ta.addEventListener('blur', () => setTimeout(() => this.hideAC(), 150));
      this.ta.addEventListener('click', () => this.hideAC());
      this.acEl.addEventListener('mousedown', (e) => { const it = e.target.closest('.ac-i'); if (it && this.ac) { e.preventDefault(); this.accept(this.ac.items[+it.dataset.i]); } });
      this.render();
    }
    get value() { return this.ta.value; }
    set value(v) { this.ta.value = v; this.errLine = null; this.render(); this.opts.onChange && this.opts.onChange(v); }
    setError(line) { this.errLine = line || null; this.render(); }
    render() {
      const v = this.ta.value;
      this.code.innerHTML = BSL.highlight(v) + '\n ';
      const n = v.split('\n').length; let g = '';
      for (let i = 1; i <= n; i++) g += (i === this.errLine ? `<span class="err">${i}</span>` : i) + '\n';
      this.g.innerHTML = g + ' '; this.sync();
    }
    sync() { this.pre.scrollTop = this.ta.scrollTop; this.pre.scrollLeft = this.ta.scrollLeft; this.g.scrollTop = this.ta.scrollTop; }
    insert(text) {
      const ta = this.ta; ta.focus();
      let ok = false; try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
      if (!ok) { ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
    }
    suggest() {
      const ta = this.ta, v = ta.value, pos = ta.selectionStart;
      if (pos !== ta.selectionEnd) return this.hideAC();
      let st = pos; while (st > 0 && ID_RE.test(v[st - 1])) st--;
      const prefix = v.slice(st, pos);
      const afterDot = v[st - 1] === '.';
      if (!afterDot && (prefix.length < 1 || /^[0-9]/.test(prefix))) return this.hideAC();
      const lineStart = v.lastIndexOf('\n', st - 1) + 1;
      const before = v.slice(lineStart, st);
      if ((before.match(/"/g) || []).length % 2 === 1 || before.includes('//') || /^\s*\|/.test(before)) return this.hideAC();
      const prevWord = (before.match(/([A-Za-zА-Яа-яЁё_]+)\s+$/) || [])[1];
      let pool;
      if (afterDot) pool = METHOD_ITEMS;
      else if (prevWord && nrm(prevWord) === 'новый') pool = TYPES.map(n => ({ label: n, ins: n, k: 'type' }));
      else {
        const counts = {};
        (v.match(/[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*/g) || []).forEach(w => { counts[w] = (counts[w] || 0) + 1; });
        const known = new Set([...KW_LIST, ...BSL.NAMES, ...TYPES, 'Символы'].map(nrm));
        const vars = Object.keys(counts).filter(w => !known.has(nrm(w)) && w.length > 1 && (w !== prefix || counts[w] > 1)).map(w => ({ label: w, ins: w, k: 'var' }));
        pool = [...vars, ...BASE_ITEMS];
      }
      const q = nrm(prefix);
      const rank = { tpl: 0, var: 1, kw: 2, fn: 3, type: 4, m: 1 };
      let items = pool.filter(i => nrm(i.label).startsWith(q));
      if (q.length >= 2) items = items.concat(pool.filter(i => !nrm(i.label).startsWith(q) && nrm(i.label).includes(q)));
      const seen = new Set();
      items = items.filter(i => { const k = i.k + i.label; if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => (nrm(b.label).startsWith(q) - nrm(a.label).startsWith(q)) || (rank[a.k] - rank[b.k]) || a.label.length - b.label.length).slice(0, 7);
      if (!items.length || (items.length === 1 && nrm(items[0].label) === q && items[0].ins === items[0].label)) return this.hideAC();
      this.ac = { items, sel: 0, start: st, prefix };
      this.drawAC(lineStart, st);
    }
    drawAC(lineStart, st) {
      const { items, sel, prefix } = this.ac;
      const tags = { tpl: 'ШАБЛ', kw: 'СЛОВО', fn: 'ФУНК', type: 'ТИП', var: 'ПЕРЕМ', m: 'МЕТОД' };
      this.acEl.innerHTML = items.map((it, i) => {
        const L = it.label, k = nrm(L).indexOf(nrm(prefix));
        const lab = k >= 0 && prefix ? esc(L.slice(0, k)) + '<b>' + esc(L.slice(k, k + prefix.length)) + '</b>' + esc(L.slice(k + prefix.length)) : esc(L);
        return `<div class="ac-i ${i === sel ? 'on' : ''}" data-i="${i}" role="option"><span class="ac-k k-${it.k}">${tags[it.k]}</span><span>${lab}</span>${it.h ? `<span class="ac-h">${esc(it.h)}</span>` : ''}</div>`;
      }).join('') + '<div class="ac-foot">Tab или Enter вставить · Esc закрыть</div>';
      const v = this.ta.value; let col = 0;
      for (const ch of v.slice(lineStart, st)) col = ch === '\t' ? col + 4 - (col % 4) : col + 1;
      const line = v.slice(0, st).split('\n').length;
      const cw = this.charW();
      const cs = getComputedStyle(this.ta);
      let left = parseFloat(cs.paddingLeft) + col * cw - this.ta.scrollLeft;
      const top = parseFloat(cs.paddingTop) + line * 22 - this.ta.scrollTop + 2;
      this.acEl.hidden = false;
      const maxL = this.ta.clientWidth - this.acEl.offsetWidth - 8;
      left = Math.max(4, Math.min(left, maxL));
      const flip = top + this.acEl.offsetHeight > this.ta.clientHeight && top - 22 - this.acEl.offsetHeight > 0;
      this.acEl.style.left = left + 'px';
      this.acEl.style.top = (flip ? top - 26 - this.acEl.offsetHeight : top) + 'px';
    }
    charW() {
      if (!this._m) { this._m = document.createElement('span'); this._m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit'; this._m.textContent = 'ЖЖЖЖЖЖЖЖЖЖ'; this.pre.appendChild(this._m); }
      return this._m.getBoundingClientRect().width / 10 || 8.4;
    }
    hideAC() { this.ac = null; this.acEl.hidden = true; }
    accept(item) {
      if (!item || !this.ac) return;
      const ta = this.ta, pos = ta.selectionStart, start = this.ac.start;
      const v = ta.value; const lineStart = v.lastIndexOf('\n', start - 1) + 1;
      const ind = (v.slice(lineStart).match(/^[\t ]*/) || [''])[0];
      let text = item.ins.replace(/\n/g, '\n' + ind);
      const caret = text.indexOf('¦'); text = text.replace('¦', '');
      this.hideAC(); this.suppress = true;
      ta.setSelectionRange(start, pos); this.insert(text);
      this.suppress = false;
      const c = caret < 0 ? start + text.length : start + caret; ta.setSelectionRange(c, c);
      if (item.ins.endsWith('.')) this.suggest();
    }
    key(e) {
      const ta = this.ta;
      if (this.ac) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault(); const n = this.ac.items.length;
          this.ac.sel = (this.ac.sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
          const v = ta.value; this.drawAC(v.lastIndexOf('\n', this.ac.start - 1) + 1, this.ac.start); return;
        }
        if ((e.key === 'Enter' || e.key === 'Tab') && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); this.accept(this.ac.items[this.ac.sel]); return; }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.hideAC(); return; }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ' ') { e.preventDefault(); this.suggest(); return; }
      if ((e.key === ')' || e.key === ']' || e.key === '"') && !e.ctrlKey && ta.selectionStart === ta.selectionEnd && ta.value[ta.selectionStart] === e.key) {
        const v = ta.value, s = ta.selectionStart; const ls = v.lastIndexOf('\n', s - 1) + 1;
        const quotes = (v.slice(ls, s).match(/"/g) || []).length;
        if (e.key !== '"' || quotes % 2 === 1) { e.preventDefault(); ta.setSelectionRange(s + 1, s + 1); this.hideAC(); return; }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); this.hideAC(); this.opts.onRun && this.opts.onRun(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        if (!e.shiftKey && s === en) { this.insert('\t'); return; }
        const le = v.indexOf('\n', en - (en > s && v[en - 1] === '\n' ? 1 : 0)); const lineEnd = le < 0 ? v.length : le;
        const block = v.slice(ls, lineEnd);
        const nb = e.shiftKey ? block.replace(/^(\t| {1,4})/gm, '') : block.replace(/^/gm, '\t');
        ta.setSelectionRange(ls, lineEnd); this.insert(nb); ta.setSelectionRange(ls, ls + nb.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const v = ta.value, s = ta.selectionStart;
        const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s);
        let ind = (line.match(/^[\t ]*/) || [''])[0];
        const t = line.trim();
        if (/(Тогда|Цикл|Иначе|Попытка|Исключение|Then|Do|Else|Try|Except)\s*(\/\/.*)?$/i.test(t) || /^(Процедура|Функция|Procedure|Function)[\s(]/i.test(t)) ind += '\t';
        this.insert('\n' + ind);
      }
    }
  }

  /* ================= вывод и разбор ошибок ================= */
  function renderOut(el, res, append) {
    let h = '';
    if (!res.out.length && !res.error) h += '<div class="i">Код выполнился, но ничего не вывел. Добавь Сообщить(), чтобы увидеть результат</div>';
    res.out.forEach(o => { h += `<div class="${o.t === 'warn' ? 'w' : 'm'}">${esc(o.s) || ' '}</div>`; });
    if (res.error) {
      const head = res.error.kind === 'syntax' ? 'Синтаксическая ошибка' : 'Ошибка при выполнении';
      h += `<div class="e">${head}${res.error.line ? ', строка ' + res.error.line : ''}\n{Модуль(${res.error.line || '?'})}: ${esc(res.error.msg)}</div>`;
    }
    el.innerHTML = h + (append || ''); el.scrollTop = el.scrollHeight;
  }
  function explainError(msg) {
    const rules = [
      [/Переменная не определена \((.+?)\)/, (m) => `Имя <code>${esc(m[1])}</code> используется раньше, чем получает значение. Проверь опечатку: 1С не простит лишнюю или пропущенную букву.`],
      [/Ожидается (КонецЕсли|КонецЦикла|КонецПроцедуры|КонецФункции|КонецПопытки)/, (m) => `Каждый блок нужно закрыть. Похоже, где-то не хватает <code>${m[1]}</code>.`],
      [/Ожидается Тогда/, () => 'После условия в <code>Если</code> и <code>ИначеЕсли</code> обязательно идёт слово <code>Тогда</code>.'],
      [/Ожидается Цикл/, () => 'Заголовок цикла заканчивается словом <code>Цикл</code>: <code>Для Сч = 1 По 5 Цикл</code>.'],
      [/Ожидается По/, () => 'В цикле Для границы разделяются словом <code>По</code>: <code>Для Сч = 1 По 10 Цикл</code>.'],
      [/Ожидается символ \)/, () => 'Где-то не закрыта круглая скобка. Посчитай открывающие и закрывающие.'],
      [/ожидается оператор, а встретилось: \)/, () => 'Лишняя закрывающая скобка. Посчитай: сколько скобок открыл, столько и закрой.'],
      [/ожидается оператор, а встретилось: (.+)$/, (m) => `На этом месте должна начинаться новая команда, а стоит <code>${esc(m[1])}</code>. Проверь строку выше: возможно, там опечатка или лишний символ.`],
      [/Ожидается присваивание/, () => 'Строка должна либо присваивать значение через <code>=</code>, либо вызывать процедуру со скобками, например <code>Сообщить(Текст);</code>.'],
      [/Не закрыта строка/, () => 'Строка открылась кавычкой, но не закрылась. Текст должен быть в паре двойных кавычек.'],
      [/Процедура или функция с указанным именем не определена \((.+?)\)/, (m) => `Функции <code>${esc(m[1])}</code> нет. Проверь название или объяви её через <code>Функция ... КонецФункции</code>.`],
      [/Преобразование значения к типу Число/, () => 'Похоже, складываешь число со строкой, и число стоит слева. Поставь строку первой или оберни число в <code>Строка()</code>.'],
      [/Преобразование значения к типу Булево/, () => 'После <code>Если</code> или <code>Пока</code> должно стоять условие, например сравнение через <code>=</code> или <code>&lt;</code>.'],
      [/Деление на 0/, () => 'На ноль делить нельзя даже в 1С. Проверь делитель или оберни код в <code>Попытка</code>.'],
      [/слишком долго/, () => 'Цикл не останавливается. Проверь, что условие когда-нибудь станет Ложь и переменная внутри цикла меняется.'],
      [/Поле объекта не обнаружено \((.+?)\)/, (m) => `Поля <code>${esc(m[1])}</code> нет. Для структуры его добавляют через <code>Вставить()</code>, для таблицы через <code>Колонки.Добавить()</code>.`],
      [/Метод объекта не обнаружен \((.+?)\)/, (m) => `У этого объекта нет метода <code>${esc(m[1])}</code>. Загляни в шпаргалку или поставь точку после переменной, редактор покажет доступные методы.`],
      [/не является значением объектного типа/, () => 'Обращаешься через точку к пустому значению. Скорее всего переменной ещё не присвоили объект через <code>Новый</code>.'],
      [/индекса выходит за границы/, () => 'Индекс вне диапазона. Помни: у массивов счёт с нуля, последний элемент <code>Количество() - 1</code>.'],
      [/это процедура/, () => 'Процедура ничего не возвращает. Если нужен результат, объяви <code>Функция</code> и верни значение через <code>Возврат</code>.']
    ];
    const rulesEn = [
      [/Переменная не определена \((.+?)\)/, (m) => `The name <code>${esc(m[1])}</code> is used before it gets a value. Check for typos: 1C won't forgive an extra or missing letter.`],
      [/Ожидается (КонецЕсли|КонецЦикла|КонецПроцедуры|КонецФункции|КонецПопытки)/, (m) => `Every block has to be closed. Looks like a <code>${m[1]}</code> is missing somewhere.`],
      [/Ожидается Тогда/, () => 'The condition in <code>Если</code> and <code>ИначеЕсли</code> must be followed by <code>Тогда</code> (Then).'],
      [/Ожидается Цикл/, () => 'A loop header ends with the word <code>Цикл</code> (Do): <code>Для Сч = 1 По 5 Цикл</code>.'],
      [/Ожидается По/, () => 'In a Для loop the bounds are separated by <code>По</code> (To): <code>Для Сч = 1 По 10 Цикл</code>.'],
      [/Ожидается символ \)/, () => 'A round bracket isn\'t closed somewhere. Count the opening and closing ones.'],
      [/ожидается оператор, а встретилось: \)/, () => 'An extra closing bracket. Count them: as many as you opened, that many you close.'],
      [/ожидается оператор, а встретилось: (.+)$/, (m) => `A new statement should start here, but there's <code>${esc(m[1])}</code> instead. Check the line above: maybe a typo or a stray character.`],
      [/Ожидается присваивание/, () => 'A line should either assign a value with <code>=</code> or call a procedure with brackets, like <code>Сообщить(Текст);</code>.'],
      [/Не закрыта строка/, () => 'A string was opened with a quote but never closed. Text has to sit inside a pair of double quotes.'],
      [/Процедура или функция с указанным именем не определена \((.+?)\)/, (m) => `There's no function called <code>${esc(m[1])}</code>. Check the name or declare it with <code>Функция ... КонецФункции</code>.`],
      [/Преобразование значения к типу Число/, () => 'Looks like you\'re adding a number and a string with the number on the left. Put the string first or wrap the number in <code>Строка()</code>.'],
      [/Преобразование значения к типу Булево/, () => '<code>Если</code> or <code>Пока</code> must be followed by a condition, like a comparison with <code>=</code> or <code>&lt;</code>.'],
      [/Деление на 0/, () => 'You can\'t divide by zero, not even in 1C. Check the divisor or wrap the code in <code>Попытка</code>.'],
      [/слишком долго/, () => 'The loop never stops. Make sure the condition eventually becomes Ложь and the variable changes inside the loop.'],
      [/Поле объекта не обнаружено \((.+?)\)/, (m) => `There's no field <code>${esc(m[1])}</code>. For a structure, add it with <code>Вставить()</code>; for a table, with <code>Колонки.Добавить()</code>.`],
      [/Метод объекта не обнаружен \((.+?)\)/, (m) => `This object has no method <code>${esc(m[1])}</code>. Check the cheat sheet or type a dot after the variable and the editor will show the available methods.`],
      [/не является значением объектного типа/, () => 'You\'re using a dot on an empty value. Most likely the variable hasn\'t been given an object with <code>Новый</code> yet.'],
      [/индекса выходит за границы/, () => 'Index out of range. Remember: arrays count from zero, the last element is <code>Количество() - 1</code>.'],
      [/это процедура/, () => 'A procedure returns nothing. If you need a result, declare a <code>Функция</code> and return the value with <code>Возврат</code>.']
    ];
    for (const [re, fn] of (EN ? rulesEn : rules)) { const m = msg.match(re); if (m) return fn(m); }
    return EN ? 'Read the message in the Messages window and look at the highlighted line.' : 'Прочитай сообщение в окне Сообщения и посмотри на подсвеченную строку.';
  }
  function codePane(file, extraBtns) {
    return `<section class="codepane">
      <div class="ed-bar"><span class="ftab">${file}</span><span class="sp"></span>${extraBtns || ''}<button class="btn sm green" id="runBtn" type="button" title="Ctrl + Enter">▶ Запустить</button></div>
      <div class="editor" id="ed"></div>
      <div class="console"><div class="console-head">Сообщения<span class="sp"></span><span id="runInfo"></span><button id="clr" type="button">очистить</button></div>
      <div class="out" id="out" aria-live="polite"><div class="i">Нажми Запустить или Ctrl + Enter. Ctrl + Пробел покажет подсказки</div></div></div>
    </section>`;
  }
  function enhanceSnippets(root) {
    $$('.snip', root).forEach(pre => {
      const c = $('code.bsl', pre); if (!c) return;
      const src = c.textContent; c.innerHTML = BSL.highlight(src);
      if (pre.closest('.snip-wrap') || pre.closest('.cheat')) return;
      const wrap = document.createElement('div'); wrap.className = 'snip-wrap';
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(pre);
      const bar = document.createElement('div'); bar.className = 'snip-bar';
      bar.innerHTML = `${pre.hasAttribute('data-norun') ? '' : '<button type="button" data-a="run">▶ Запустить пример</button>'}<button type="button" data-a="copy">Копировать</button>`;
      wrap.appendChild(bar);
      bar.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'copy') {
          const done = () => { b.textContent = 'Скопировано'; setTimeout(() => { b.textContent = 'Копировать'; }, 1400); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(src).then(done, () => fallbackCopy(src, done)); else fallbackCopy(src, done);
          return;
        }
        const res = BSL.run(src); sfx('run');
        let out = $('.snip-out', wrap); if (!out) { out = document.createElement('div'); out.className = 'snip-out'; wrap.appendChild(out); }
        out.innerHTML = (res.out.length ? res.out.map(o => `<div class="m">${esc(o.s) || ' '}</div>`).join('') : (res.error ? '' : `<div class="m" style="color:var(--dim)">${T('ничего не выведено')}</div>`)) +
          (res.error ? `<div class="e">{Модуль(${res.error.line || '?'})}: ${esc(res.error.msg)}</div>` : '');
        D().runs++; save();
      });
    });
  }
  function fallbackCopy(text, done) {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { /* без копирования */ } t.remove();
  }

  /* ================= экраны ================= */
  const view = () => $('#view');
  let timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  function setIde(on) { document.body.classList.toggle('ide-mode', on); }

  function viewHome() {
    setIde(false);
    const nl = nextLesson();
    const totalXp = lessons.reduce((s, l) => s + l.xp, 0) + challenges.reduce((s, l) => s + l.xp, 0);
    const doneL = lessons.filter(l => S.done[l.id]).length;
    const returning = Object.keys(S.done).length > 0;
    const sec = (n, name, right) => `<div class="sec-head"><p class="eyebrow">// ${pad2(n)} — ${name}</p><span class="bk">[ ${right} ]</span></div>`;
    const topics = ['Сообщить', 'Переменные', 'Условия', 'Циклы', 'Массив', 'Структура', 'Соответствие', 'ТаблицаЗначений', 'Функции', 'Попытка', 'Строки', 'Запросы'];
    const tick = topics.map(t => `<span><b>✦</b>${t}</span>`).join('');
    view().innerHTML = `
    <section class="hero">
      <div class="hero-scene"><canvas class="particles" data-s="11" data-dim=".55" aria-hidden="true"></canvas></div>
      <div class="hero-in">
        <div>
          <p class="eyebrow">// Тренажёр встроенного языка 1С:Предприятие</p>
          <h1>Учи <em>1С</em>.<br>Пиши код.<br><span class="cursor">Качай уровень</span></h1>
          <p class="sub">Короткая теория, редактор с подсказками как в Конфигураторе и интерпретатор, который выполняет код прямо в браузере. Без установки платформы, без регистрации.</p>
          <div class="cta">
            <a class="btn" href="#/lesson/${nl.id}">${returning ? 'Продолжить квест' : 'Начать квест'} ↗</a>
            <a class="btn ghost" href="#/course">Карта курса (${chapters.length})</a>
          </div>
        </div>
        <div class="hud card">${art('sphere', 4, 'data-live data-acc data-fs="11"')}</div>
      </div>
      <div class="statrow">
        <div><b>${lessons.length}</b><span>Уроков</span></div>
        <div><b>${challenges.length}</b><span>Челленджей</span></div>
        <div><b>${badges.length}</b><span>Значков</span></div>
        <div><b>${totalXp}</b><span>XP на кону</span></div>
      </div>
    </section>
    <div class="ticker" aria-hidden="true"><div>${tick}${tick}</div></div>
    ${returning ? `
    <section class="section nob"><div class="wrap">
      ${sec(0, 'Статус', `Серия ${S.streak || 0} дн.`)}
      <h2>${esc(nameOf())}, продолжаем<span class="cursor"></span></h2>
      <div class="grid welcome">
        <div class="card"><h4>Следующий урок</h4><span class="chip cur">Глава ${nl.ch} · ${esc(chapters[nl.ch - 1].title)}</span>
          <div class="cont-title">${esc(nl.title)}</div>
          <div class="xpbar"><i style="width:${Math.round(doneL / lessons.length * 100)}%"></i></div>
          <div class="meta" style="margin:8px 0 18px"><span>${doneL} / ${lessons.length} уроков</span><span>+${nl.xp} XP</span></div>
          <a class="btn" href="#/lesson/${nl.id}">Продолжить ↗</a></div>
        <div class="card"><h4>Задания дня</h4>${questsHtml()}</div>
        <div class="card"><h4>Цель и серия</h4><div class="goalcard">${goalRing(true)}<div><h5>Цель дня</h5><p>${D().xp >= S.goal ? 'Выполнена. Можно чуть больше' : `Ещё ${S.goal - D().xp} XP до цели`}</p></div></div>
          <h4 style="margin-top:6px">Эта неделя</h4>${weekHtml()}</div>
      </div>
      <div style="margin-top:18px">${bizMini()}</div>
    </div></section>` : ''}

    <section class="section ${returning ? '' : 'nob'}"><div class="wrap">
      ${sec(1, 'О тренажёре', 'Зачем это всё')}
      <p class="manifest">1С·декс превращает сухой учебник в квест: <b>каждая строчка кода сразу выполняется</b>, ошибки объясняются простыми словами, а за решения начисляется опыт. Пишешь, запускаешь, <b>видишь результат за миллисекунды</b> и идёшь дальше, пока не начнёшь щёлкать задачи, которые 1С-ники решают на работе.</p>
    </div></section>

    <section class="section"><div class="wrap">
      ${sec(2, 'Маршрут', `${chapters.length} секторов`)}
      <h2 style="margin-bottom:30px">Карта приключения</h2>
      <div class="route">${chapters.map(ch => {
        const ls = chLessons(ch.id), d = ls.filter(l => S.done[l.id]).length;
        const st = d === ls.length ? '<span class="chip on">Пройдено</span>' : (nl.ch === ch.id ? '<span class="chip cur">Текущий</span>' : (d ? '<span class="chip on">В процессе</span>' : '<span class="chip">Впереди</span>'));
        return `<a class="rrow" href="#/course#ch${ch.id}"><span class="no">[${pad2(ch.id)}]</span><div class="th">${regionArt(ch, 'data-fs="6"')}</div>
          <div class="ti">${esc(ch.title)}<small>${esc(ch.desc)}</small></div><span class="mt">${ls.length} уроков · ${ls.reduce((s, l) => s + l.xp, 0)} XP</span>${st}<span class="ar">↗</span></a>`;
      }).join('')}
        <div class="rrow locked"><span class="no">[${pad2(chapters.length + 1)}]</span><div class="th">${art('grid', 41, 'data-fs="6"')}</div><div class="ti">Язык запросов<small>ВЫБРАТЬ, соединения, временные таблицы, виртуальные таблицы регистров</small></div><span class="mt">Следующий курс</span><span class="chip">Закрыто</span><span class="ar">↗</span></div>
        <div class="rrow locked"><span class="no">[${pad2(chapters.length + 2)}]</span><div class="th">${art('rings', 52, 'data-fs="6"')}</div><div class="ti">Управляемые формы<small>Клиент и сервер, реквизиты, команды, обработчики событий</small></div><span class="mt">Следующий курс</span><span class="chip">Закрыто</span><span class="ar">↗</span></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      ${sec(3, 'Процесс', '4 шага')}
      <h2 style="margin-bottom:30px">Как это работает</h2>
      <div class="grid steps">
        <div class="step"><div class="num">01</div><h3>Читай</h3><p>Теория порциями на пару минут. Любой пример в тексте запускается кнопкой.</p><div class="xpbar"><i style="width:25%"></i></div></div>
        <div class="step"><div class="num">02</div><h3>Пиши</h3><p>Автодополнение, шаблоны блоков по Tab и подсветка синтаксиса.</p><div class="xpbar"><i style="width:50%"></i></div></div>
        <div class="step"><div class="num">03</div><h3>Проверяй</h3><p>Пункты задания загораются по мере выполнения. Ошибки разбираются по-человечески.</p><div class="xpbar"><i style="width:75%"></i></div></div>
        <div class="step"><div class="num">04</div><h3>Качайся</h3><p>XP, уровни до 1С:Эксперта, комбо, сундуки, задания дня и сертификат.</p><div class="xpbar y"><i style="width:100%"></i></div></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap bizteaser">
      <div>${sec(4, 'Мой бизнес', `Стадия ${bizStats().si + 1} / ${BIZ_STAGES.length}`)}
        <h2>Учишься и строишь компанию</h2>
        <p class="lead" style="margin-top:18px">Каждый значок прокачивает твою студию внедрения 1С: гараж превращается в офис, офис в бизнес-центр, а там и до штаб-квартиры с вертолётной площадкой. Люди на тротуаре это твои сотрудники.</p>
        <a class="btn ghost" href="#/business" style="margin-top:10px">Открыть бизнес ↗</a></div>
      <a class="card bizstage" href="#/business">${bizScene()}<span class="lab tl">${esc(bizStats().st.name)}</span><span class="lab brr">${bizStats().staff} чел.</span></a>
    </div></section>

    <section class="section"><div class="wrap demo">
      <div>
        ${sec(5, 'Песочница', 'Live')}
        <h2>Попробуй прямо здесь</h2>
        <p class="lead" style="margin-top:18px">Набери <code>Есл</code> и нажми Tab, появится шаблон блока. Точка после переменной покажет методы, Ctrl + Enter запустит код. Обрати внимание: 1С сама разбивает числа на разряды.</p>
        <a class="btn ghost" href="#/sandbox" style="margin-top:10px">Открыть песочницу ↗</a>
      </div>
      <div class="card demo-box">
        <div class="ed-bar"><span class="ftab">Демо.bsl</span><span class="sp"></span><button class="btn sm green" id="runBtn" type="button">▶ Запустить</button></div>
        <div class="editor" id="ed" style="height:250px"></div>
        <div class="console" style="height:150px;min-height:0"><div class="console-head">Сообщения</div><div class="out" id="out"><div class="i">Жми Запустить</div></div></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      ${sec(6, 'Коллекция', `${Object.keys(S.badges).length} / ${badges.length}`)}
      <h2>Собери все значки</h2>
      <div class="badgebar">${badges.map(b => badgeEl(b)).join('')}</div>
    </div></section>

    <section class="section"><div class="wrap faqwrap">
      <div>${sec(7, 'FAQ', '5')}<h2>Вопросы,<br>отвеченные<span class="cursor"></span></h2></div>
      <div class="faq">
        <details open><summary><span>Нужно ли ставить 1С:Предприятие?</span></summary><p>Нет. Код выполняет встроенный в страницу интерпретатор. Сайт открывается как обычный файл и работает даже без интернета, просто шрифты подставятся системные.</p></details>
        <details><summary><span>Это настоящий язык 1С?</span></summary><p>Учебное подмножество встроенного языка: синтаксис, типы, Массив, Структура, Соответствие, ТаблицаЗначений, строковые функции, Попытка. Числа выводятся с разбивкой на разряды, как в платформе. Базы данных и запросов здесь нет, их разберём в следующем курсе.</p></details>
        <details><summary><span>Где хранится прогресс?</span></summary><p>В локальном хранилище браузера на этом устройстве. Никуда не отправляется. Очистишь данные сайта или откроешь в другом браузере, и прогресс начнётся заново.</p></details>
        <details><summary><span>Никогда не программировал. Справлюсь?</span></summary><p>Курс рассчитан на старт с нуля. Первые уроки занимают пару минут, у каждого задания есть подсказка, а ошибки объясняются простыми словами.</p></details>
        <details><summary><span>Что делать после курса?</span></summary><p>Порешать челленджи, поставить учебную версию платформы и пройтись по документации для разработчиков. Дальше стоит готовиться к сертификации 1С:Профессионал по платформе.</p></details>
      </div>
    </div></section>

    <section class="finale">
      <canvas class="particles" data-s="23" data-owl aria-hidden="true"></canvas>
      <div class="finale-in"><h2>Начни писать код, <b>который работает</b>, уже сегодня</h2><a class="btn white" href="#/lesson/${nl.id}">${returning ? 'Продолжить обучение' : 'Начать бесплатно'}</a></div>
    </section>`;

    const demo = 'Корзина = Новый ТаблицаЗначений;\nКорзина.Колонки.Добавить("Товар");\nКорзина.Колонки.Добавить("Сумма");\n\nСтр = Корзина.Добавить(); Стр.Товар = "Ноутбук"; Стр.Сумма = 89990;\nСтр = Корзина.Добавить(); Стр.Товар = "Мышь"; Стр.Сумма = 1490;\n\nДля Каждого Стр Из Корзина Цикл\n\tСообщить(Стр.Товар + ": " + Стр.Сумма + " руб.");\nКонецЦикла;\nСообщить("Итого: " + Корзина.Итог("Сумма"));';
    const ed = new Editor($('#ed'), demo, { onRun: () => go() });
    const go = () => { const res = BSL.run(ed.value); ed.setError(res.error && res.error.line); renderOut($('#out'), res); sfx('run'); };
    $('#runBtn').onclick = go;
    bindClaims(view());
  }

  function chestNode(ch) {
    const opened = S.chests[ch.id], ready = chDone(ch.id) && !opened;
    const st = opened ? 'opened' : ready ? 'ready' : 'locked';
    return `<button class="chest ${st}" type="button" data-chest="${ch.id}" ${st === 'locked' ? 'disabled' : ''} aria-label="Сундук главы ${ch.id}">${chestSvg(!!opened)}</button>
      <div class="plabel">${ready ? 'Сундук главы. Открой!' : opened ? 'Сундук открыт' : 'Сундук главы'}<small>${st === 'locked' ? 'пройди все уроки главы' : '+20…40 XP'}</small></div>`;
  }
  function viewCourse(anchor) {
    setIde(false);
    const nl = nextLesson();
    const doneL = lessons.filter(l => S.done[l.id]).length;
    const li = lvlIdx();
    const offs = [0, 64, 104, 64, 0, -64, -104, -64];
    const mapHtml = chapters.map(ch => {
      const ls = chLessons(ch.id); const d = ls.filter(l => S.done[l.id]).length; const b = badges.find(x => x.id === ch.badge);
      return `<section class="card region" id="ch${ch.id}" style="--rc:${ch.color}">
        <div class="region-art">${regionArt(ch)}<div class="region-title"><p class="eyebrow" style="margin:0">// ${pad2(ch.id)} — Сектор</p><h3>${esc(ch.title)}</h3><p>${esc(ch.desc)}</p></div>
          <div class="region-prog">${badgeEl(b)}<small>${d}/${ls.length}</small></div></div>
        <div class="path">${ls.map((l, i) => {
          const st = S.done[l.id] ? 'done' : l === nl ? 'current' : 'ahead';
          const ic = S.done[l.id] ? '✓' : l.type === 'quiz' ? '?' : l.checkpoint ? '⚑' : (i + 1);
          const x = offs[i % 8];
          return `<div class="pnode-wrap" style="--x:${x}px">${st === 'current' ? `<div class="start-bubble">${doneL ? 'ДАЛЬШЕ' : 'СТАРТ'}</div>` : ''}
            <a class="pnode ${st} ${l.checkpoint ? 'cp' : ''}" href="#/lesson/${l.id}" aria-label="${esc(l.title)}${S.done[l.id] ? ', пройдено' : ''}"><span>${ic}</span></a>
            <div class="plabel">${esc(l.title)}<small>${l.type === 'quiz' ? 'КВИЗ · ' : l.checkpoint ? 'ЧЕКПОИНТ · ' : ''}+${l.xp} XP</small></div>
            ${st === 'current' ? `<div class="pmascot" style="${x > 0 ? 'right' : 'left'}:-100px">${owl()}</div>` : ''}</div>`;
        }).join('')}<div class="pnode-wrap" style="--x:${offs[ls.length % 8]}px">${chestNode(ch)}</div></div>
      </section>`;
    }).join('');
    let num = 0;
    const listHtml = chapters.map(ch => {
      const ls = chLessons(ch.id); const d = ls.filter(l => S.done[l.id]).length; const b = badges.find(x => x.id === ch.badge);
      return `<div class="card chapter" id="ch${ch.id}">
        <div class="chapter-head">${badgeEl(b)}<div><h3>Глава ${ch.id}. ${esc(ch.title)}</h3><p>${esc(ch.desc)}</p></div><span class="cnt">${d}/${ls.length}</span></div>
        <ol class="lessons-list">${ls.map(l => {
          num++;
          const kind = l.type === 'quiz' ? '<span class="k qz">КВИЗ</span>' : l.checkpoint ? '<span class="k cp">ЧЕКПОИНТ</span>' : '<span class="k">КОД</span>';
          return `<li><a class="lrow ${S.done[l.id] ? 'done' : ''} ${l === nl && !S.done[l.id] ? 'next' : ''}" href="#/lesson/${l.id}"><span class="n">${pad2(num)}</span><span class="t">${esc(l.title)}</span>${kind}<span class="x">+${l.xp} XP</span><span class="s"></span></a></li>`;
        }).join('')}</ol></div>`;
    }).join('');
    const allDone = doneL === lessons.length;
    view().innerHTML = `
    <section class="banner"><div class="hero-scene">${BANNER()}</div>
      <div class="banner-in"><p class="eyebrow">// Курс 01 · Новичок</p><h1>Основы встроенного<br>языка 1С<span class="cursor"></span></h1>
      <p>Пройди путь от первого Сообщить() до боевых задач с реальной работы. ${lessons.length} уроков, ${lessons.filter(l => l.checkpoint).length} чекпоинта, квизы и сундук в конце каждой главы.</p>
      <a class="btn" href="#/lesson/${nl.id}">${doneL ? 'Продолжить' : 'Начать'}: ${esc(nl.title)} ↗</a></div>
    </section>
    <div class="wrap course-grid">
      <div>
        <div class="course-tools"><div class="seg" role="tablist"><button type="button" data-v="map" class="${S.view !== 'list' ? 'on' : ''}">Карта</button><button type="button" data-v="list" class="${S.view === 'list' ? 'on' : ''}">Список</button></div>
          <span class="muted" style="font-size:14px">${doneL} из ${lessons.length} уроков · ${Math.round(doneL / lessons.length * 100)}%</span></div>
        ${S.view === 'list' ? listHtml : mapHtml}
      </div>
      <aside class="side">
        <div class="card"><div class="prof-mini">${face(0)}<div><b>${esc(nameOf())}</b><small>Уровень ${li + 1} · ${lvlTitle(li)}</small></div></div>
          <div class="xpbar y"><i style="width:${S.xp % 100}%"></i></div>
          <div class="meta" style="margin-top:8px"><span>${S.xp} XP</span><span>до ур. ${li + 2}: ${100 - (S.xp % 100)} XP</span></div></div>
        <div class="card"><div class="goalcard">${goalRing(true)}<div><h5>Цель дня</h5><p>${D().xp >= S.goal ? 'Выполнена!' : `Ещё ${S.goal - D().xp} XP`}</p></div></div><h4>Задания дня</h4>${questsHtml()}</div>
        ${bizMini()}
        <div class="card"><h4>Серия: ${S.streak || 0} дн.</h4>${weekHtml()}</div>
        <div class="card"><h4>Значки глав</h4><div class="minibadges">${chapters.map(ch => badgeEl(badges.find(x => x.id === ch.badge), 'sm')).join('')}</div></div>
        <div class="card"><h4>Сертификат</h4><p style="margin:0 0 14px;color:var(--mute);font-size:14px">${allDone ? 'Курс пройден! Сертификат готов к печати.' : `Откроется, когда пройдёшь все ${lessons.length} уроков.`}</p><a class="btn sm ${allDone ? '' : 'ghost'}" href="#/certificate">${allDone ? 'Получить' : 'Посмотреть'} →</a></div>
      </aside>
    </div>`;
    $$('.seg button').forEach(b => { b.onclick = () => { S.view = b.dataset.v; save(); sfx('tap'); viewCourse(); }; });
    $$('[data-chest]').forEach(b => {
      b.onclick = () => {
        const id = +b.dataset.chest; if (S.chests[id] || !chDone(id)) return;
        S.chests[id] = true; save();
        openChest(`Сундук главы «${chapters[id - 1].title}»`, 20, 40, () => viewCourse());
      };
    });
    bindClaims(view()); mountArt(view());
    const target = anchor ? $('#' + anchor) : (doneL && S.view !== 'list' ? $('.pnode.current') : null);
    if (target) later(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
  }

  function viewChallenges() {
    setIde(false);
    const d = challenges.filter(c => S.done[c.id]).length;
    view().innerHTML = `
    <section class="section"><div class="wrap">
      <p class="eyebrow">Челленджи · решено ${d} из ${challenges.length}</p>
      <h2>Задачи на смекалку</h2>
      <p class="lead" style="margin-top:16px">Без пошаговых объяснений. Только условие, редактор и ты. За каждую задачу дают больше XP, чем за обычный урок.</p>
      <div class="grid chal-grid">${challenges.map((c, i) => `
        <a class="card chal ${S.done[c.id] ? 'done' : ''}" href="#/challenge/${c.id}">
          <div class="th">${art(['noise', 'spiral', 'rings', 'bars', 'waves', 'city', 'grid'][i % 7], 60 + i, 'data-fs="7"')}</div>
          <span><span class="tag lvl-${c.level}">${c.level}</span></span>
          <h3>${esc(c.title)}</h3>
          <p>${esc(strip(c.theory).slice(0, 120))}…</p>
          <div class="meta"><span>+${c.xp} XP</span><span>${S.done[c.id] ? '[✓] Решено' : 'Решить ↗'}</span></div>
        </a>`).join('')}</div>
    </div></section>`;
    mountArt(view());
  }

  function viewTask(item, kind) {
    setIde(true);
    const list = kind === 'lesson' ? lessons : challenges;
    const idx = list.indexOf(item);
    const group = kind === 'lesson' ? chLessons(item.ch) : challenges;
    const prev = list[idx - 1], next = list[idx + 1];
    const back = kind === 'lesson' ? '#/course' : '#/challenges';
    const isQuiz = item.type === 'quiz';
    const gDone = group.filter(l => S.done[l.id]).length;
    const label = kind === 'lesson' ? `Глава ${item.ch} · Урок ${pad2(idx + 1)}${item.checkpoint ? ' · Чекпоинт' : ''}${isQuiz ? ' · Квиз' : ''}` : `Челлендж · ${item.level}`;
    const nextHref = next ? `#/${kind}/${next.id}` : back;
    view().innerHTML = `
    <div class="ide">
      <section class="learn">
        <div class="learn-head"><a href="${back}">← ${kind === 'lesson' ? 'К карте' : 'К челленджам'}</a>
          <div class="dots">${group.map(l => `<a data-turn href="#/${kind}/${l.id}" class="${S.done[l.id] ? 'done' : ''} ${l === item ? 'cur' : ''}" title="${esc(l.title)}" aria-label="${esc(l.title)}"></a>`).join('')}</div></div>
        <div class="lprog" title="Прогресс главы"><i style="width:${gDone / group.length * 100}%"></i></div>
        <div class="learn-body">
          <p class="eyebrow">${label}</p>
          <h1>${esc(item.title)}</h1>
          ${item.theory}
          ${isQuiz ? `<div class="task"><h3>Задание <span>+${item.xp} XP</span></h3><ol class="checks"><li><span>Ответь правильно на все вопросы справа</span></li></ol></div>` : `
          <div class="task"><h3>Задание <span>+${S.peeked[item.id] ? Math.ceil(item.xp / 2) : item.xp} XP</span></h3><ol class="checks" id="checks">${item.tasks.map(t => `<li><span>${t}</span></li>`).join('')}</ol></div>
          <div class="help"><button class="btn sm ghost" id="hintBtn" type="button">Подсказка</button><button class="btn sm ghost" id="solBtn" type="button" style="display:none">Показать решение</button></div>
          <div class="callout hintbox" id="hintBox"><b>Подсказка</b><p>${esc(item.hint)}</p></div>`}
        </div>
        <div class="learn-foot">
          <a class="btn sm ghost" ${prev ? 'data-turn' : ''} href="${prev ? `#/${kind}/${prev.id}` : back}">← Назад</a>
          <span class="pos">${idx + 1} / ${list.length}</span>
          <a class="btn sm ${S.done[item.id] ? 'green' : 'ghost'}" id="nextBtn" ${next ? 'data-turn' : ''} href="${nextHref}">${next ? 'Дальше →' : 'Готово →'}</a>
        </div>
      </section>
      ${isQuiz ? `<section class="codepane"><div class="ed-bar"><span class="ftab">Квиз</span></div><div class="quiz">${item.quiz.map((q, qi) => `
        <div class="card qcard" data-q="${qi}"><div class="qn">Вопрос ${qi + 1} из ${item.quiz.length}</div><h3>${esc(q.q)}</h3>
          <div class="opts">${q.options.map((o, oi) => `<button class="opt" type="button" data-o="${oi}">${esc(o)}</button>`).join('')}</div>
          <div class="explain">${esc(q.explain)}</div></div>`).join('')}</div></section>`
        : codePane('Модуль.bsl', '<button class="btn sm ghost" id="resetBtn" type="button">Сброс</button>')}
    </div>
    <div class="fb" id="fb" role="status" aria-live="polite"></div>`;
    enhanceSnippets($('.learn-body'));

    let usedHint = false;
    const fb = $('#fb');
    const fbShow = (ok, title, text, actions) => {
      fb.className = 'fb show ' + (ok ? 'ok' : 'no');
      fb.innerHTML = `<div class="fb-in"><div class="fb-owl">${face(ok ? 4 : 1)}</div><div class="fb-t"><b>${title}</b><p>${text}</p></div><div class="fb-a">${actions}</div></div>`;
      $$('[data-fbclose]', fb).forEach(b => { b.onclick = () => { fb.className = 'fb'; }; });
      const hb = $('[data-fbhint]', fb);
      if (hb) hb.onclick = () => { usedHint = true; $('#hintBox').classList.add('show'); $('#hintBox').scrollIntoView({ block: 'center', behavior: 'smooth' }); fb.className = 'fb'; };
    };
    const PRAISE = ['Отлично!', 'Чётко!', 'Красота!', 'Так держать!', 'Ты в ударе!', 'Идеально!'];

    const finish = (clean) => {
      const g = award(item, clean);
      $('#nextBtn').classList.replace('ghost', 'green');
      const dot = $('.dots a.cur'); if (dot) dot.classList.add('done');
      const nextBtn = `<a class="btn green" ${next ? 'data-turn' : ''} href="${nextHref}">${next ? 'Дальше →' : 'Готово →'}</a>`;
      if (!g) { sfx('ok'); fbShow(true, 'Снова верно!', 'Этот урок уже пройден, XP повторно не начисляется. Но рука набивается.', `<button class="btn ghost" type="button" data-fbclose>Остаться</button>${nextBtn}`); return; }
      sfx(g.levelUp ? 'level' : 'ok'); confetti();
      const notes = [`+${g.xp} XP`];
      if (g.bonus) notes.push(`бонус за комбо x${g.combo}: +${g.bonus} XP`);
      else if (g.combo >= 2) notes.push(`комбо x${g.combo}`);
      if (g.peeked) notes.push('половина XP, решение было подсмотрено');
      else if (!clean) notes.push('с подсказкой, поэтому комбо обнулилось');
      fbShow(true, PRAISE[Math.floor(Math.random() * PRAISE.length)], notes.join(' · '), `<button class="btn ghost" type="button" data-fbclose>Остаться</button>${nextBtn}`);
      if (g.levelUp || g.badges.length) {
        later(() => modal(`${owl('m')}<h2>${g.levelUp ? 'Новый уровень!' : 'Новый значок!'}</h2>
          ${g.levelUp ? `<div class="xp">УР ${lvlIdx() + 1}</div><p class="pixel" style="font-size:11px;color:var(--purple)">${lvlTitle(lvlIdx())}</p>` : ''}
          ${g.badges.map(b => `<div class="newbadge">${badgeEl(b, 'sm')}<div><b>${esc(b.title)}</b><small>${esc(b.desc)}</small></div></div>`).join('')}
          <div class="row"><button class="btn" type="button" data-close>Круто!</button></div>`), 700);
      }
      if (!S.onboarded) later(() => { if (!$('.modal')) goalModal(); else later(() => goalModal(), 2500); }, 1500);
    };

    if (isQuiz) {
      const ok = new Set(); let wrong = 0;
      $$('.qcard').forEach(card => {
        const q = item.quiz[+card.dataset.q];
        $$('.opt', card).forEach(btn => btn.addEventListener('click', () => {
          const o = +btn.dataset.o;
          if (o === q.correct) {
            sfx('tap');
            btn.classList.add('right'); $$('.opt', card).forEach(b => { b.disabled = true; });
            $('.explain', card).classList.add('show'); ok.add(card.dataset.q);
            if (ok.size === item.quiz.length) { $('.checks li').classList.add('ok'); later(() => finish(wrong === 0), 450); }
          } else { wrong++; sfx('fail'); btn.classList.add('wrong'); btn.disabled = true; }
        }));
      });
      return;
    }

    const saved = S.codes[item.id];
    const ed = new Editor($('#ed'), saved != null ? saved : item.starter, {
      onChange: (v) => { S.codes[item.id] = v; clearTimeout(viewTask.t); viewTask.t = setTimeout(save, 400); },
      onRun: () => run()
    });
    const out = $('#out');
    let tries = 0;
    const run = () => {
      const code = ed.value; const res = BSL.run(code); tries++;
      D().runs++; save();
      ed.setError(res.error && res.error.line);
      const ch = item.check(makeR(res, code));
      $$('#checks li').forEach((li, i) => { li.classList.toggle('ok', !!ch[i]); li.classList.toggle('no', !ch[i]); });
      const pass = !res.error && ch.every(Boolean);
      $('#runInfo').textContent = res.ms + ' мс';
      if (pass) { renderOut(out, res, '<div class="s">✓ Все проверки пройдены</div>'); finish(!usedHint && !S.peeked[item.id]); return; }
      renderOut(out, res);
      sfx(res.error ? 'fail' : 'run');
      if (tries >= 2) $('#solBtn').style.display = '';
      if (res.error) {
        fbShow(false, res.error.kind === 'syntax' ? 'Код не собрался' : 'Код упал на строке ' + (res.error.line || '?'), explainError(res.error.msg),
          `<button class="btn ghost" type="button" data-fbhint>Подсказка</button><button class="btn pink" type="button" data-fbclose>Исправлю</button>`);
      } else {
        const fi = ch.findIndex(x => !x);
        const doneN = ch.filter(Boolean).length;
        fbShow(false, doneN ? `Почти! Готово ${doneN} из ${ch.length}` : 'Пока не сходится',
          `Не выполнен пункт ${fi + 1}: <span data-noi18n>${esc(strip(item.tasks[fi]))}</span>. Запуски без штрафа, пробуй сколько нужно.`,
          `<button class="btn ghost" type="button" data-fbhint>Подсказка</button><button class="btn pink" type="button" data-fbclose>Понятно</button>`);
      }
    };
    $('#runBtn').onclick = run;
    $('#clr').onclick = () => { out.innerHTML = ''; };
    $('#resetBtn').onclick = () => { ed.value = item.starter; ed.ta.focus(); };
    $('#hintBtn').onclick = () => { usedHint = true; $('#hintBox').classList.toggle('show'); sfx('tap'); };
    $('#solBtn').onclick = () => {
      if (S.peeked[item.id] || S.done[item.id]) { ed.value = item.solution; return; }
      const m = modal(`<h2>Подсмотреть решение?</h2><p class="muted">Так тоже учатся, но за урок тогда начислится только половина XP: ${Math.ceil(item.xp / 2)} вместо ${item.xp}. Комбо обнулится.</p>
        <div class="row"><button class="btn ghost" type="button" data-close>Ещё попробую</button><button class="btn pink" type="button" id="peekYes">Показать</button></div>`);
      $('#peekYes', m).onclick = () => { S.peeked[item.id] = true; usedHint = true; save(); ed.value = item.solution; m.close(); toast('Решение в редакторе. Разберись, как оно работает, и запусти'); };
    };
  }

  function viewSandbox() {
    setIde(true);
    view().innerHTML = `<div class="sandbox">${codePane('Песочница.bsl', `<div class="sb-ex">${sandboxExamples.map((x, i) => `<button class="btn sm ghost" type="button" data-ex="${i}">${esc(x.t)}</button>`).join('')}</div>`)}</div>`;
    const ed = new Editor($('#ed'), S.sandboxCode || sandboxExamples[0].c, {
      onChange: (v) => { S.sandboxCode = v; clearTimeout(viewSandbox.t); viewSandbox.t = setTimeout(save, 400); },
      onRun: () => run()
    });
    const run = () => {
      const res = BSL.run(ed.value); ed.setError(res.error && res.error.line);
      renderOut($('#out'), res); $('#runInfo').textContent = res.ms + ' мс';
      sfx(res.error ? 'fail' : 'run');
      S.sandboxRuns = (S.sandboxRuns || 0) + 1; D().runs++;
      const nb = checkBadges(); save();
      nb.forEach(b => { toast('Новый значок: ' + b.title); confetti(); sfx('level'); });
    };
    $('#runBtn').onclick = run;
    $('#clr').onclick = () => { $('#out').innerHTML = ''; };
    $$('[data-ex]').forEach(b => { b.onclick = () => { ed.value = sandboxExamples[+b.dataset.ex].c; ed.ta.focus(); }; });
    ed.ta.focus();
  }

  function viewCheats() {
    setIde(false);
    view().innerHTML = `<section class="section"><div class="wrap">
      <p class="eyebrow">Шпаргалка</p><h2>Синтаксис 1С на одном экране</h2>
      <p class="lead" style="margin-top:16px">Подглядывай сюда, когда забыл, как пишется КонецЦикла или что возвращает СтрНайти. Любой пример можно открыть в песочнице. А <kbd>Ctrl</kbd> + <kbd>K</kbd> найдёт нужный урок.</p>
      <div class="grid cheats">${cheats.map((c, i) => `<div class="card cheat"><h3>${esc(c.t)}<button class="btn xs ghost" type="button" data-c="${i}">В песочницу</button></h3><pre class="snip"><code class="bsl">${esc(c.c)}</code></pre></div>`).join('')}</div>
    </div></section>`;
    enhanceSnippets(view());
    $$('[data-c]').forEach(b => { b.onclick = () => { S.sandboxCode = cheats[+b.dataset.c].c; save(); location.hash = '#/sandbox'; }; });
  }

  function heatHtml() {
    const weeks = 18; const now = new Date(); const dow = (now.getDay() + 6) % 7;
    const start = new Date(now); start.setDate(now.getDate() - dow - (weeks - 1) * 7);
    let h = '';
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      if (d > now) { h += '<i style="visibility:hidden"></i>'; continue; }
      const xp = S.days[dayStr(d)] || 0;
      const l = xp >= 50 ? 3 : xp >= 20 ? 2 : xp > 0 ? 1 : 0;
      h += `<i class="l${l}" title="${d.toLocaleDateString(LOC)}: ${xp} XP"></i>`;
    }
    return `<div class="heat">${h}</div><div class="heat-legend">меньше <i style="background:#141414"></i><i style="background:var(--acc-bd)"></i><i style="background:var(--acc-m)"></i><i style="background:var(--acc)"></i> больше</div>`;
  }
  function viewProfile() {
    setIde(false);
    const li = lvlIdx();
    const doneL = lessons.filter(l => S.done[l.id]).length, doneC = challenges.filter(c => S.done[c.id]).length;
    const activeDays = Object.keys(S.days).length;
    view().innerHTML = `<section class="section"><div class="wrap">
      <div class="card profile-top">${face(0, 'ava')}
        <div><p class="eyebrow">Уровень ${li + 1} · ${lvlTitle(li)}</p>
          <h1 contenteditable="true" spellcheck="false" id="nm" title="Нажми, чтобы изменить имя">${esc(nameOf())}</h1>
          <div class="xpbar y"><i style="width:${S.xp % 100}%"></i></div>
          <div class="meta" style="margin-top:8px"><span>${S.xp} XP</span><span>до следующего уровня ${100 - (S.xp % 100)} XP</span></div></div>
      </div>
      <div class="kpis">
        <div class="card kpi"><b>${S.streak || 0}</b><span>дней подряд</span></div>
        <div class="card kpi"><b>${doneL}/${lessons.length}</b><span>уроков</span></div>
        <div class="card kpi"><b>${doneC}/${challenges.length}</b><span>челленджей</span></div>
        <div class="card kpi"><b>x${S.bestCombo || 0}</b><span>лучшее комбо</span></div>
      </div>
      <div class="grid prof-grid">
        <div class="card" style="padding:22px"><p class="eyebrow">Активность · ${activeDays} дн. с практикой</p>${heatHtml()}</div>
        <div class="card" id="setCard" style="padding:22px"><p class="eyebrow">Настройки</p>
          <p class="muted" style="margin:0 0 10px;font-size:14px">Цель дня</p>
          <div class="seg" id="goalSeg">${[10, 20, 30, 50].map(g => `<button type="button" data-g="${g}" class="${S.goal === g ? 'on' : ''}">${g} XP</button>`).join('')}</div>
          <p class="muted" style="margin:18px 0 10px;font-size:14px">Звуки интерфейса</p>
          <div class="seg" id="sndSeg"><button type="button" data-s="1" class="${S.sound ? 'on' : ''}">Вкл</button><button type="button" data-s="0" class="${S.sound ? '' : 'on'}">Выкл</button></div>
          ${settingsHtml()}
          <div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn sm" href="#/certificate">Сертификат →</a><button class="btn sm ghost" type="button" id="replayTour">Пройти обучение заново</button></div>
          <p class="muted set-l">Сохранение</p>
          <p class="muted" style="margin:0 0 10px;font-size:12px">Прогресс хранится в этом браузере. Чтобы перенести его на другое устройство или сайт, скачай файл и загрузи его там.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sm ghost" type="button" id="expSave">Скачать сохранение</button><button class="btn sm ghost" type="button" id="impSave">Загрузить сохранение</button><input type="file" id="impFile" accept=".json,application/json" hidden></div>
        </div>
      </div>
      <p class="eyebrow" style="margin-top:40px">Значки · ${Object.keys(S.badges).length} из ${badges.length}</p>
      <div class="grid badges-grid">${badges.map(b => `<div class="card bcard ${S.badges[b.id] ? '' : 'off'}">${badgeEl(b)}<div><h4>${esc(b.title)}</h4><p>${esc(b.desc)}</p></div></div>`).join('')}</div>
      <p class="eyebrow" style="margin-top:40px">Лестница уровней</p>
      <div class="badgebar" style="margin-top:0">${levels.map((t, i) => `<span class="tag ${i <= li ? '' : 'soon'}">${i + 1}. ${t}</span>`).join('')}</div>
      <div style="margin-top:40px"><button class="btn sm pink" id="resetAll" type="button">Сбросить весь прогресс</button></div>
    </div></section>`;
    const nm = $('#nm');
    nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nm.blur(); } });
    nm.addEventListener('blur', () => { S.name = nm.textContent.trim().slice(0, 30) || 'Ученик'; nm.textContent = S.name; save(); });
    $$('#goalSeg button').forEach(b => { b.onclick = () => { S.goal = +b.dataset.g; S.onboarded = true; save(); renderHeader(); sfx('tap'); viewProfile(); }; });
    $$('#sndSeg button').forEach(b => { b.onclick = () => { S.sound = b.dataset.s === '1'; save(); renderHeader(); sfx('tap'); viewProfile(); }; });
    $('#replayTour').onclick = () => runIntro();
    $('#expSave').onclick = () => {
      const blob = new Blob([JSON.stringify({ app: '1c-dex', v: 1, at: new Date().toISOString(), state: S }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `1c-dex-${today()}.json`;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Файл сохранения скачан');
    };
    $('#impSave').onclick = () => $('#impFile').click();
    $('#impFile').onchange = (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        let d; try { d = JSON.parse(rd.result); } catch (err) { toast('Не получилось прочитать файл'); return; }
        const st = d && d.app === '1c-dex' && d.state;
        if (!st || typeof st.xp !== 'number' || typeof st.done !== 'object') { toast('Это не файл сохранения 1С·декс'); return; }
        const n = Object.keys(st.done).length;
        const m = modal(`<h2>Загрузить сохранение?</h2><p class="muted">В файле ${st.xp} XP и ${n} пройденных заданий. Текущий прогресс в этом браузере заменится.</p>
          <div class="row"><button class="btn ghost" type="button" data-close>Отмена</button><button class="btn" type="button" id="impYes">Загрузить</button></div>`);
        $('#impYes', m).onclick = () => { S = Object.assign(fresh(), st); S.tourDone = true; save(); m.close(); applyAccent(S.accent, true); toast('Прогресс загружен'); };
      };
      rd.readAsText(f); e.target.value = '';
    };
    bindSettings(view());
    $('#resetAll').onclick = () => {
      const m = modal(`<h2>Начать заново?</h2><p class="muted">XP, значки, серия и весь сохранённый код удалятся без возможности вернуть.</p>
        <div class="row"><button class="btn ghost" data-close type="button">Отмена</button><button class="btn pink" id="yesReset" type="button">Сбросить</button></div>`);
      $('#yesReset', m).onclick = () => { S = fresh(); save(); m.close(); renderHeader(); viewProfile(); toast('Прогресс сброшен'); };
    };
  }

  function viewCert() {
    setIde(false);
    const doneL = lessons.filter(l => S.done[l.id]).length; const all = doneL === lessons.length;
    if (!all) {
      view().innerHTML = `<section class="section"><div class="wrap" style="max-width:720px">
        <div class="card" style="padding:34px;text-align:center"><div style="width:110px;margin:0 auto 14px">${face(3)}</div>
          <p class="eyebrow">Сертификат</p><h2>Почти там</h2>
          <p class="muted" style="margin:18px auto;max-width:460px">Сертификат откроется, когда пройдёшь все уроки курса. Осталось ${lessons.length - doneL} из ${lessons.length}.</p>
          <div class="xpbar y" style="max-width:420px;margin:0 auto"><i style="width:${doneL / lessons.length * 100}%"></i></div>
          <div style="margin-top:26px"><a class="btn" href="#/lesson/${nextLesson().id}">К следующему уроку →</a></div></div>
      </div></section>`;
      return;
    }
    const last = Math.max(...lessons.map(l => S.done[l.id]));
    view().innerHTML = `<section class="section"><div class="wrap">
      <div class="cert"><div class="cert-in">
        <div class="owlc">${stand()}</div>
        <p style="font-size:11px;color:var(--acc);letter-spacing:.2em">1С·ДЕКС</p>
        <h1>СЕРТИФИКАТ</h1>
        <p>подтверждает, что</p>
        <div class="nm">${esc(nameOf())}</div>
        <p>прошёл(ла) курс <b>Основы встроенного языка 1С</b>: переменные и типы, условия, циклы, коллекции, ТаблицаЗначений, процедуры и функции, обработка ошибок и боевые задачи.</p>
        <div class="cert-stats"><div><b>${lessons.length}</b><span>уроков</span></div><div><b>${S.xp}</b><span>XP</span></div><div><b>${challenges.filter(c => S.done[c.id]).length}</b><span>челленджей</span></div><div><b>${new Date(last).toLocaleDateString(LOC)}</b><span>дата</span></div></div>
        <small>Учебный сертификат локального тренажёра. Не является документом об образовании и не связан с фирмой 1С.</small>
        <div class="cert-seal">${badgeEl(badges.find(b => b.id === 'cert'))}</div>
      </div></div>
      <div class="cert-actions"><button class="btn" type="button" id="printCert">Распечатать или сохранить PDF</button><a class="btn ghost" href="#/profile">Изменить имя</a></div>
    </div></section>`;
    $('#printCert').onclick = () => window.print();
  }



  /* ================= Перелистывание пиксельной волной ================= */
  function swoosh() {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime, len = Math.floor(AC.sampleRate * 1.4);
      const buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const src = AC.createBufferSource(); src.buffer = buf;
      const f = AC.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.55); f.frequency.exponentialRampToValueAtTime(220, t + 1.35);
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      src.connect(f); f.connect(g); g.connect(AC.destination); src.start(t); src.stop(t + 1.4);
    } catch (e) { /* без звука */ }
  }
  let waving = false;
  function waveTurn(swap) {
    return new Promise(resolve => {
      if (waving || reduceMotion) { swap(); resolve(); return; }
      waving = true;
      const px = innerWidth < 700 ? 5 : 7;
      const W = Math.ceil(innerWidth / px), H = Math.ceil(innerHeight / px);
      const wrap = document.createElement('div'); wrap.className = 'wave';
      wrap.innerHTML = `<canvas width="${W}" height="${H}" style="width:${W * px}px;height:${H * px}px" aria-hidden="true"></canvas><div class="wave-rider">${owl()}</div>`;
      document.body.appendChild(wrap);
      const ctx = $('canvas', wrap).getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
      const rider = $('.wave-rider', wrap);
      swoosh();
      const T_IN = 640, HOLD = 120, T_OUT = 640, TOTAL = T_IN + HOLD + T_OUT;
      const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
      const tilt = 0.32, A1 = 3.2, A2 = 1.8, span = H * (1 + tilt) + 2 * (A1 + A2) + 14;
      const C = { b0: [12, 12, 12], b1: [20, 20, 20], b2: [30, 30, 29], s: [44, 44, 43], f0: [236, 236, 233], f1: [176, 176, 172], f2: [104, 104, 101], acc: hexRgb(ACCP()) };
      const top = new Float32Array(W), bot = new Float32Array(W);
      const t0 = performance.now(); let swapped = false;
      const surf = (x, base, t, ph) => base - tilt * H * (x / W) + A1 * Math.sin(x * 0.11 + t * 7 + ph) + A2 * Math.sin(x * 0.037 - t * 4.3 + ph * 2);
      const frame = (now) => {
        const ms = now - t0, t = ms / 1000, fi = Math.floor(t * 24);
        const pIn = ease(ms / T_IN), pOut = ease((ms - T_IN - HOLD) / T_OUT);
        const startB = H + tilt * H + A1 + A2 + 6;
        const bTop = startB - pIn * span, bBot = startB - pOut * span;
        for (let x = 0; x < W; x++) { top[x] = surf(x, bTop, t, 0); bot[x] = surf(x, bBot, t, 1.7) + 3; }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, dt = y - top[x], db = bot[x] - y;
          if (dt >= 0 && db > 0) {
            if (dt < 1) put(i, C.f0);
            else if (dt < 2) put(i, (x + y) % 2 ? C.f0 : C.f1);
            else if (dt < 3.2) put(i, (x + y) % 2 ? C.f1 : C.f2);
            else if (dt < 4.5 && (x + y + fi) % 3 === 0) put(i, C.f2);
            else if (db < 1.5) put(i, (x + y) % 2 ? C.f1 : C.f2);
            else if (db < 3 && (x + y) % 2) put(i, C.f2);
            else {
              const streak = ((y + x * 0.28 + t * 26) % 15) < 1.1 && hash(x >> 2, y, 3) > 0.35;
              const nearTop = dt < 14 ? ((x + y) % 2 ? C.b2 : C.b1) : ((x + y) % 2 && hash(x, y, 5) > 0.6 ? C.b1 : C.b0);
              put(i, streak ? C.s : nearTop);
            }
            if (dt < 3 && hash(x, y, fi) > 0.985) put(i, C.acc);
          } else if (dt < 0 && dt > -7 && hash(x, y, fi) > 0.86 + (-dt) * 0.02) put(i, -dt < 3 ? C.f1 : C.f2);
          else d[i + 3] = 0;
        }
        ctx.putImageData(img, 0, 0);
        // сёрфер на гребне
        const rx = Math.floor(W * 0.62), ry = top[rx] * px;
        if (pIn < 1 && ry > -40) {
          const slope = (top[rx + 2] - top[rx - 2]) / 4;
          const rw = rider.offsetWidth || 200, rh = rw * (SURFDATA.surf.h / SURFDATA.surf.w);
          rider.style.opacity = '1';
          rider.style.transform = `translate(${rx * px - rw / 2}px, ${ry - rh * 0.86}px) rotate(${Math.atan(slope) * 0.9}rad)`;
        } else rider.style.opacity = '0';
        if (!swapped && ms >= T_IN) { swapped = true; try { swap(); } catch (e) { /* ignore */ } }
        if (ms < TOTAL) requestAnimationFrame(frame);
        else { wrap.remove(); waving = false; resolve(); }
      };
      function put(i, c) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
      requestAnimationFrame(frame);
    });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-turn]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    const href = a.getAttribute('href');
    if (!href || href === (location.hash || '#/')) return;
    e.preventDefault();
    waveTurn(() => { location.hash = href; });
  }, true);

  /* ================= Интро: ASCII-компьютер ================= */
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  function blip(f) {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
      o.type = 'square'; o.frequency.value = (f || 520) + Math.random() * 60;
      g.gain.setValueAtTime(0.012, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.03);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + 0.035);
    } catch (e) { /* без звука */ }
  }
  let introEl = null;
  function computerCells(vw, vh, cw, chh, sx, sy, sw, sh) {
    const cols = Math.ceil(vw / cw), rows = Math.ceil(vh / chh), cells = [];
    const Bh = 4 * cw, Bv = 2 * chh, chin = 4 * chh;
    const mx0 = sx - Bh, mx1 = sx + sw + Bh, my0 = sy - Bv, my1 = sy + sh + Bv + chin;
    const cx = sx + sw / 2;
    const neckW = sw * 0.13, baseW = sw * 0.34, kbW = sw * 0.56;
    const nY0 = my1, nY1 = my1 + 2 * chh, bY1 = nY1 + 2 * chh, kY0 = bY1 + chh, kY1 = kY0 + 5 * chh, dY = kY1;
    const logo = '1С·ДЕКС', slot = '[==============]';
    const H = (c, r, k) => hash(c, r, k || 1);
    for (let r = 0; r < rows; r++) {
      const py = (r + 0.5) * chh;
      for (let c = 0; c < cols; c++) {
        const px = (c + 0.5) * cw;
        let ch = null, b = 0.3, acc = false;
        if (px > mx0 && px < mx1 && py > my0 && py < my1) {
          if (px > sx && px < sx + sw && py > sy && py < sy + sh) continue;
          const dl = (px - mx0) / cw, dr = (mx1 - px) / cw, dt = (py - my0) / chh, db = (my1 - py) / chh;
          const corner = Math.min(dl, dr) < 2 && Math.min(dt, db) < 1.2;
          if (corner && Math.min(dl, dr) + Math.min(dt, db) * 1.6 < 1.6) continue;
          const edge = dl < 1 || dr < 1 || dt < 1 || db < 1;
          const nearScr = px > sx - cw * 1.1 && px < sx + sw + cw * 1.1 && py > sy - chh * 1.1 && py < sy + sh + chh * 1.1;
          const chinTop = py > sy + sh + Bv && py < sy + sh + Bv + chh;
          if (edge) { ch = (dt < 1 || db < 1) ? '=' : '|'; b = (dl < 1 || dt < 1) ? 0.78 : 0.42; }
          else if (nearScr) { ch = (py < sy || py > sy + sh) ? '-' : ':'; b = (py < sy || px < sx) ? 0.2 : 0.32; }
          else if (chinTop) { ch = '_'; b = 0.38; }
          else {
            ch = '%#*+='[Math.floor(H(c, r) * 5)]; b = 0.26 + 0.12 * H(c, r, 3) + (dl < 3 || dt < 2 ? 0.08 : 0);
            const chinRow = Math.floor((py - (sy + sh + Bv)) / chh);
            if (chinRow === 2) {
              const lc = Math.floor((px - (mx0 + 6 * cw)) / cw);
              if (lc >= 0 && lc < logo.length) { ch = logo[lc]; b = 0.75; }
              const sc = Math.floor((px - (mx1 - (slot.length + 10) * cw)) / cw);
              if (sc >= 0 && sc < slot.length) { ch = slot[sc]; b = 0.5; }
              if (Math.abs(px - (mx1 - 6 * cw)) < cw / 2) { ch = 'o'; b = 1; acc = true; }
            }
          }
        } else if (py > nY0 && py < nY1 && Math.abs(px - cx) < neckW) {
          ch = Math.abs(Math.abs(px - cx) - neckW) < cw ? '|' : '#'; b = 0.3;
        } else if (py > nY1 && py < bY1 && Math.abs(px - cx) < baseW - (py < nY1 + chh ? 2 * cw : 0)) {
          ch = py < nY1 + chh ? '_' : '='; b = py < nY1 + chh ? 0.5 : 0.36;
        } else if (py > kY0 && py < kY1) {
          const kr = Math.floor((py - kY0) / chh), inset = (4 - kr) * cw * 0.8, x0 = cx - kbW + inset, x1 = cx + kbW - inset;
          if (px > x0 && px < x1) {
            const kc = Math.floor((px - x0) / cw);
            if (kr === 0 || kr === 4 || px < x0 + cw || px > x1 - cw) { ch = kr === 0 ? '_' : kr === 4 ? '=' : '|'; b = 0.4; }
            else if (kr === 3 && Math.abs(px - cx) < kbW * 0.35) { ch = Math.abs(Math.abs(px - cx) - kbW * 0.35) < cw ? (px < cx ? '[' : ']') : '_'; b = 0.62; }
            else { ch = '[_]'[(kc + kr) % 3]; b = 0.5 + 0.1 * H(c, r, 5); }
          }
          void 0;
        } else if (py > dY && py < dY + chh) { ch = '_'; b = 0.14 + 0.06 * H(c, r); }
        if (!ch || ch === ' ') continue;
        cells.push({ x: c * cw, y: r * chh, ch, b, acc, r });
      }
    }
    return cells;
  }
  async function runIntro() {
    if (introEl || tour) return;
    history.replaceState(null, '', '#/'); router();
    if (reduceMotion) { startTour(); return; }
    document.documentElement.classList.add('intro-lock');
    window.scrollTo(0, 0);
    const vw = innerWidth, vh = innerHeight, a = vw / vh;
    const fs = Math.max(7, Math.min(12, Math.round(vh / 72)));
    const cw = fs * 0.6, chh = Math.round(fs * 1.05 * 100) / 100;
    let sh = Math.max(vh * 0.36, vh - 24 * chh), sw = sh * a;
    if (sw > vw * 0.68) { sw = vw * 0.68; sh = sw / a; }
    const total = 2 * chh + sh + 18 * chh;
    const sx = (vw - sw) / 2, sy = Math.max(2 * chh, (vh - total) / 2 + 2 * chh);
    const el = document.createElement('div'); el.className = 'intro'; introEl = el;
    el.innerHTML = `<div class="intro-stage"><canvas aria-hidden="true"></canvas>
      <div class="intro-screen" style="left:${sx}px;top:${sy}px;width:${sw}px;height:${sh}px"><div class="intro-site" style="width:${vw}px;height:${vh}px"></div><div class="intro-line"></div><div class="intro-crt"></div></div></div>
      <button class="intro-skip" type="button">Пропустить ›</button>`;
    document.body.appendChild(el);
    const stage = $('.intro-stage', el), cv = $('canvas', el), site = $('.intro-site', el);
    let skipped = false;
    const finish = () => {
      if (!introEl) return;
      skipped = true; introEl.remove(); introEl = null;
      document.documentElement.classList.remove('intro-lock');
      document.removeEventListener('keydown', onKey, true);
      startTour();
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(); } };
    document.addEventListener('keydown', onKey, true);
    $('.intro-skip', el).onclick = finish;

    // сайт на экране
    site.innerHTML = $('.top').outerHTML + `<main>${view().innerHTML}</main>`;
    site.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    site.setAttribute('inert', '');
    mountArt(site);
    site.style.transform = `scale(${sw / vw})`;

    // ASCII-компьютер
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = vw * dpr; cv.height = vh * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${fs}px "JetBrains Mono", ui-monospace, monospace`; ctx.textBaseline = 'top';
    const cells = computerCells(vw, vh, cw, chh, sx, sy, sw, sh);
    const r0 = Math.min(...cells.map(c => c.r)), r1 = Math.max(...cells.map(c => c.r));
    cells.forEach(c => { c.t = 0.1 + (c.r - r0) / Math.max(1, r1 - r0) * 1.55 + (c.x / vw) * 0.22 + hash(c.x, c.y, 7) * 0.14; });
    const GL = '01{}[]<>/\\=+#;:';
    const DRAW = 2.1;
    const paint = (t) => {
      ctx.clearRect(0, 0, vw, vh);
      for (const c of cells) {
        if (t < c.t) continue;
        const age = t - c.t;
        if (age < 0.11) { ctx.fillStyle = ACCP(); ctx.fillText(GL[Math.floor(Math.random() * GL.length)], c.x, c.y); continue; }
        const g = Math.round(40 + 200 * c.b);
        ctx.fillStyle = c.acc ? ACCP() : `rgb(${g},${g},${Math.round(g * 0.97)})`;
        ctx.fillText(c.ch, c.x, c.y);
      }
    };
    await wait(350); if (skipped) return;
    await new Promise(res => {
      const t0 = performance.now(); let lastBlip = 0;
      const loop = (now) => {
        if (skipped) return res();
        const t = (now - t0) / 1000; paint(t);
        if (now - lastBlip > 70 && t < DRAW - 0.3) { blip(300 + Math.random() * 200); lastBlip = now; }
        if (t < DRAW) requestAnimationFrame(loop); else { paint(99); res(); }
      };
      requestAnimationFrame(loop);
    });
    if (skipped) return;
    // включение ЭЛТ
    await wait(250); if (skipped) return;
    $('.intro-line', el).classList.add('go'); sfx('run');
    await wait(260); if (skipped) return;
    site.classList.add('on');
    await wait(1200); if (skipped) return;
    // наезд камеры
    const Z = vw / sw;
    stage.style.transition = 'transform 2s cubic-bezier(.7,0,.25,1)';
    stage.style.transform = `translate(${-sx * Z}px, ${-sy * Z}px) scale(${Z})`;
    $('.intro-crt', el).classList.add('off');
    await wait(2050); if (skipped) return;
    el.classList.add('done');
    await wait(260); if (skipped) return;
    finish();
  }

  /* ================= Обучение: визуальная новелла ================= */
  const TOUR = [
    { go: '#/', face: 0, text: 'Йо! Я Бит. Днём ловлю волны, ночью пишу на 1С. Покажу, что тут где, это займёт пару минут.' },
    { go: '#/', t: '.nav', face: 0, text: 'Наверху меню со всеми разделами. Сейчас я сам по ним пробегусь, тебе остаётся только жать «Далее».' },
    { go: '#/', t: '#hdrStats', face: 2, text: 'Справа твои показатели: кольцо цели дня, серия дней подряд, опыт и уровень. Лупа открывает поиск по урокам, он же Ctrl + K.' },
    { go: '#/course', t: '.path, .lessons-list', face: 0, text: 'Это карта курса. Девять секторов, от первого Сообщить() до боевых задач с реальной работы. Уроки идут по порядку, текущий подсвечен оранжевым.' },
    { go: '#/course', t: '[data-chest="1"]', face: 2, text: 'В конце каждого сектора лежит сундук. Закрыл все уроки главы, открываешь его и забираешь XP.' },
    { go: '#/course', t: '.side .card:nth-child(2)', face: 0, text: 'Тут цель дня и задания дня. Они обновляются каждый день, и за каждое выполненное тоже дают сундук.' },
    { go: '#/lesson/hello', t: '.snip-wrap', face: 0, text: 'Так выглядит урок. Слева короткая теория. Примеры можно запускать прямо в тексте, кнопка под кодом.' },
    { go: '#/lesson/hello', t: '.task', face: 3, text: 'После теории идёт задание. Пункты загораются по мере выполнения, так сразу видно, чего не хватает.' },
    { go: '#/lesson/hello', t: '.editor', face: 0, text: 'Справа редактор. Он подсказывает слова и функции, а Tab разворачивает шаблоны вроде Если … КонецЕсли.' },
    { go: '#/lesson/hello', t: '#runBtn', face: 4, text: 'Эта кнопка запускает код, ещё можно нажать Ctrl + Enter. Результат появится в окне сообщений под редактором.' },
    { go: '#/lesson/hello', t: '.help', face: 1, text: 'Застрял? Жми «Подсказка». После двух попыток откроется готовое решение, но за урок тогда дам только половину XP.' },
    { go: '#/business', t: '.bizstage', face: 4, text: 'А это твой бизнес. Каждый значок даёт студии улучшение, и она растёт от гаража до штаб-квартиры.' },
    { go: '#/challenges', t: '.chal', face: 2, text: 'Челленджи для тех, кто прошёл базу. Пошаговых подсказок нет, зато и XP больше.' },
    { go: '#/sandbox', t: '.editor', face: 4, text: 'Песочница. Пиши что угодно, тут ничего не проверяется и ничего не сломаешь. Сверху лежат готовые примеры.' },
    { go: '#/cheats', t: '.cheats', face: 3, text: 'Шпаргалка. Весь синтаксис на одном экране, любой пример открывается в песочнице.' },
    { go: '#/profile', t: '#setCard', face: 0, text: 'В профиле статистика, значки и настройки цели дня. Отсюда же можно пройти это обучение заново.' },
    { go: '#/', face: 4, text: 'Вот и всё. Первый урок займёт пару минут. Погнали?', end: true }
  ];
  let tour = null;
  function startTour() {
    if (tour) return;
    const el = document.createElement('div'); el.className = 'tour';
    el.innerHTML = `<div class="tour-spot"></div>
      <div class="tour-char"><div class="bob">${stand()}</div></div>
      <div class="tour-box card" role="dialog" aria-label="Обучение">
        <div class="tour-name">${face(0)}<b>Бит</b></div>
        <p class="tour-text" aria-live="polite"></p>
        <div class="tour-foot"><button class="tour-skip" type="button">Пропустить обучение</button><span class="tour-n"></span>
          <span class="tour-acts"></span></div>
      </div>`;
    document.body.appendChild(el);
    tour = { el, i: -1, spot: $('.tour-spot', el), char: $('.tour-char', el), textEl: $('.tour-text', el), nameFace: $('.tour-name .mc', el), acts: $('.tour-acts', el), n: $('.tour-n', el), target: null, side: 'right', typing: false, busy: false };
    el.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      tourNext();
    });
    $('.tour-skip', el).onclick = () => endTour('#/');
    document.addEventListener('keydown', tourKey, true);
    spotLoop();
    requestAnimationFrame(() => tour && tour.char.classList.add('in'));
    tourGo(0);
  }
  function tourKey(e) {
    if (!tour) return;
    if (e.ctrlKey && e.key !== 'Enter') return;
    if (e.key === 'Tab') return;
    if (e.target && e.target.closest && e.target.closest('.tour button') && (e.key === 'Enter' || e.key === ' ')) return;
    e.preventDefault(); e.stopPropagation();
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') tourNext();
    else if (e.key === 'ArrowLeft') tourBack();
    else if (e.key === 'Escape') endTour('#/');
  }
  function tourNext() {
    if (!tour || tour.busy) return;
    if (tour.typing) { finishTyping(); return; }
    if (TOUR[tour.i].end) return;
    tourGo(tour.i + 1);
  }
  function tourBack() { if (tour && !tour.busy && tour.i > 0) tourGo(tour.i - 1); }
  function spotLoop() {
    if (!tour) return;
    const sp = tour.spot, t = tour.target;
    let L, T, W, H;
    if (t && t.isConnected) {
      const r = t.getBoundingClientRect(), p = 8;
      L = Math.max(4, r.left - p); T = Math.max(4, r.top - p);
      W = Math.max(0, Math.min(innerWidth - 4, r.right + p) - L); H = Math.max(0, Math.min(innerHeight - 4, r.bottom + p) - T);
    } else { L = innerWidth / 2; T = innerHeight / 2; W = 0; H = 0; }
    const v = `${Math.round(L)},${Math.round(T)},${Math.round(W)},${Math.round(H)}`;
    if (sp._v !== v) { sp._v = v; sp.style.left = L + 'px'; sp.style.top = T + 'px'; sp.style.width = W + 'px'; sp.style.height = H + 'px'; }
    sp.classList.toggle('on', !!(t && t.isConnected && W > 0));
    tour.raf = requestAnimationFrame(spotLoop);
  }
  function placeChar(target) {
    let side = 'right';
    if (target && innerWidth > 700) {
      const r = target.getBoundingClientRect(), ch = tour.char.getBoundingClientRect();
      const cw = ch.width || innerWidth * 0.25, top = innerHeight - (ch.height || innerHeight * 0.7);
      const overR = r.right > innerWidth - cw - innerWidth * 0.02 && r.bottom > top + 40;
      const overL = r.left < cw + innerWidth * 0.02 && r.bottom > top + 40;
      if (overR && !overL) side = 'left';
    }
    if (side === tour.side) return;
    tour.side = side;
    tour.char.classList.remove('in');
    setTimeout(() => { if (!tour) return; tour.char.classList.toggle('left', side === 'left'); requestAnimationFrame(() => tour && tour.char.classList.add('in')); }, 320);
  }
  async function tourGo(i) {
    const st = TOUR[i]; tour.i = i; tour.busy = true;
    tour.target = null;
    const cur = location.hash || '#/';
    if (cur !== st.go) { await waveTurn(() => { location.hash = st.go; }); }
    await nextFrame();
    if (!tour) return;
    if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) document.activeElement.blur();
    let target = null;
    if (st.t) {
      target = $(st.t);
      if (target && !target.closest('.top')) { target.style.scrollMarginTop = '84px'; target.scrollIntoView({ block: 'start', behavior: 'smooth' }); await wait(420); }
    }
    if (!tour) return;
    tour.target = target;
    placeChar(target);
    tour.nameFace.className = `mc face f${st.face}`;
    tour.char.classList.remove('hop'); void tour.char.offsetWidth; tour.char.classList.add('hop');
    tour.n.textContent = `${i + 1} / ${TOUR.length}`;
    tour.acts.innerHTML = st.end
      ? `<button class="btn ghost sm" type="button" data-a="look">Осмотрюсь сам</button><button class="btn sm" type="button" data-a="go">Начать первый урок ↗</button>`
      : `<button class="btn ghost sm tour-back" type="button" ${i === 0 ? 'disabled' : ''} aria-label="Назад">◂</button><button class="btn sm tour-next" type="button">Далее ▸</button>`;
    $$('button', tour.acts).forEach(b => {
      b.onclick = () => {
        if (b.dataset.a === 'go') endTour('#/lesson/' + nextLesson().id);
        else if (b.dataset.a === 'look') endTour('#/');
        else if (b.classList.contains('tour-back')) tourBack();
        else tourNext();
      };
    });
    tour.busy = false;
    typeLine(st.text);
  }
  function typeLine(str) {
    clearInterval(tour.typer);
    str = T(str);
    tour.full = str; tour.typing = true; tour.el.classList.remove('ready');
    let i = 0;
    tour.typer = setInterval(() => {
      if (!tour) return;
      i = Math.min(str.length, i + 1);
      tour.textEl.innerHTML = esc(str.slice(0, i)) + '<span class="caret"></span>';
      if (i % 3 === 0 && str[i - 1] !== ' ') blip();
      if (i >= str.length) finishTyping();
    }, 18);
  }
  function finishTyping() {
    if (!tour) return;
    clearInterval(tour.typer); tour.typing = false;
    tour.textEl.innerHTML = esc(tour.full);
    tour.el.classList.add('ready');
  }
  function endTour(hash) {
    if (!tour) return;
    clearInterval(tour.typer); cancelAnimationFrame(tour.raf);
    document.removeEventListener('keydown', tourKey, true);
    const el = tour.el; tour = null;
    el.classList.add('out'); setTimeout(() => el.remove(), 320);
    S.tourDone = true; save();
    if ((location.hash || '#/') !== hash) location.hash = hash; else router();
  }

  /* ================= роутер ================= */
  function router() {
    timers.forEach(clearTimeout); timers = [];
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, anchor] = raw.split('#');
    const [r, id] = path.split('/');
    $$('.modal').forEach(m => m.remove());
    window.scrollTo(0, 0);
    if (r === 'course') viewCourse(anchor);
    else if (r === 'lesson' && lessons.find(l => l.id === id)) viewTask(lessons.find(l => l.id === id), 'lesson');
    else if (r === 'challenges') viewChallenges();
    else if (r === 'challenge' && challenges.find(c => c.id === id)) viewTask(challenges.find(c => c.id === id), 'challenge');
    else if (r === 'sandbox') viewSandbox();
    else if (r === 'cheats') viewCheats();
    else if (r === 'profile') viewProfile();
    else if (r === 'certificate') viewCert();
    else if (r === 'business') viewBusiness();
    else viewHome();
    mountArt(view());
    renderHeader();
    if (!document.activeElement || document.activeElement === document.body) $('#view').focus({ preventScroll: true });
  }

  applyAccent(S.accent);
  $('#logoArt').innerHTML = face(0);
  const wmEl = $('#wordmark'); if (wmEl) wmEl.innerHTML = wordmark('1С·ДЕКС');
  checkBadges(true); save();
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) { e.preventDefault(); openSearch(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { const b = $('#runBtn'); if (b) { e.preventDefault(); b.click(); } }
  });
  window.addEventListener('hashchange', router);
  router();
  if (!S.tourDone) setTimeout(runIntro, 60);
})();
