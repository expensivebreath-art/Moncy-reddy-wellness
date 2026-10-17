/* Open When You Need Me — isolated module. Nothing here touches other features except
   saved reflections use the shared state.sanctuary object in Supabase. */
(function () {
  'use strict';
  const C = window.SANCTUARY_CONTENT;
  if (!C) return;
  const RM = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- tiny helpers ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const k of kids.flat()) { if (k == null || k === false) continue; e.append(k.nodeType ? k : document.createTextNode(k)); }
    return e;
  }
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };

  /* ---------- state ---------- */
  let root, stage, live, built = false, scene = 1, history = [], opener = null, petalTimer = null;
  const $q = (s, r) => (r || root).querySelector(s);

  /* ---------- World illustration ---------- */
  function worldSVG() {
    seed = 11;
    const center = [[690, 900], [850, 790], [1020, 705], [1170, 640], [1248, 603]];
    const cx = y => { // approximate path centre x at a given y
      for (let i = 0; i < center.length - 1; i++) {
        const a = center[i], b = center[i + 1];
        if (y <= a[1] && y >= b[1]) return a[0] + (b[0] - a[0]) * (a[1] - y) / (a[1] - b[1]);
      }
      return 1250;
    };
    let stars = '';
    for (let i = 0; i < 46; i++) stars += `<circle cx="${(rnd() * 1600).toFixed(0)}" cy="${(rnd() * 330).toFixed(0)}" r="${(rnd() * 1.6 + .5).toFixed(1)}" class="st" style="animation-delay:${(rnd() * 6).toFixed(1)}s"/>`;
    let pines = '';
    for (let i = 0; i < 26; i++) { const x = 20 + i * 62 + rnd() * 30, hgt = 26 + rnd() * 30; if (x > 1130 && x < 1340) continue; pines += `<path d="M${x.toFixed(0)},548 l-${(hgt * .32).toFixed(0)},0 l${(hgt * .32).toFixed(0)},-${hgt.toFixed(0)} l${(hgt * .32).toFixed(0)},${hgt.toFixed(0)}z" fill="var(--pine)"/>`; }
    let stones = '';
    for (let i = 0; i < 17; i++) {
      const t = i / 16, y = 892 - t * 286, x = cx(y) + (rnd() - .5) * 40, s = 1 - t * .62;
      stones += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(34 * s).toFixed(0)}" ry="${(11 * s).toFixed(0)}" fill="var(--stone)" opacity="${(.5 + rnd() * .35).toFixed(2)}"/>`;
    }
    const colors = ['#F5D7DC', '#CE8195', '#C9BDE4', '#E8C48C', '#F6B99C', '#FFF5E9'];
    let flowers = '';
    for (let i = 0; i < 64; i++) {
      const y = 712 + rnd() * 170, x = rnd() * 1600, c = cx(y);
      if (Math.abs(x - c) < 70 + (y - 700) * .22) continue;
      if (x > 1000 && y < 760) continue;
      const s = .75 + (y - 700) / 170 * 1.05, col = colors[Math.floor(rnd() * colors.length)];
      let petals = '';
      for (let k = 0; k < 5; k++) { const a = k * 72 * Math.PI / 180; petals += `<circle cx="${(Math.cos(a) * 7.5).toFixed(1)}" cy="${(-54 + Math.sin(a) * 7.5).toFixed(1)}" r="6" fill="${col}"/>`; }
      flowers += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><g class="fl" style="animation-delay:-${(rnd() * 6).toFixed(1)}s"><path d="M0,0 C3,-20 -3,-36 0,-50" stroke="var(--stem)" stroke-width="2.5" fill="none"/>${petals}<circle cx="0" cy="-54" r="4" fill="#E8C48C"/></g></g>`;
    }
    let grass = '';
    for (let i = 0; i < 40; i++) { const x = rnd() * 1600, hh = 30 + rnd() * 42; grass += `<path d="M${x.toFixed(0)},900 q${(rnd() * 14 - 7).toFixed(0)},-${(hh / 2).toFixed(0)} ${(rnd() * 22 - 11).toFixed(0)},-${hh.toFixed(0)}" stroke="var(--g2)" stroke-width="3" fill="none" stroke-linecap="round" class="gr" style="animation-delay:-${(rnd() * 5).toFixed(1)}s"/>`; }
    const blossoms = [[130, 470, 62], [190, 420, 55], [90, 410, 48], [245, 455, 58], [345, 505, 52], [300, 470, 46], [385, 530, 40], [150, 360, 46], [70, 470, 40], [270, 525, 42], [210, 370, 38]];
    const bl = blossoms.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--blossom)" opacity=".92"/><circle cx="${x + r * .25}" cy="${y - r * .2}" r="${r * .45}" fill="#FFF5E9" opacity=".35"/>`).join('');
    const lamp = (x, y) => `<g><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 52}" stroke="var(--wood)" stroke-width="4"/><circle cx="${x}" cy="${y - 6}" r="26" fill="url(#glowG)" class="lampglow"/><rect x="${x - 6}" y="${y - 14}" width="12" height="16" rx="3" fill="#E8C48C"/></g>`;
    const cloud = (x, y, s, d) => `<g class="cloud" transform="translate(${x} ${y}) scale(${s})"><g style="animation-duration:${d}s;animation-delay:-${(d / 3).toFixed(0)}s"><ellipse cx="0" cy="0" rx="90" ry="22" fill="var(--cloud)"/><ellipse cx="-34" cy="-14" rx="46" ry="22" fill="var(--cloud)"/><ellipse cx="30" cy="-18" rx="52" ry="26" fill="var(--cloud)"/></g></g>`;
    return `<svg class="sx-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
<defs>
<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sk0)"/><stop offset=".5" style="stop-color:var(--sk1)"/><stop offset="1" style="stop-color:var(--sk2)"/></linearGradient>
<linearGradient id="lakeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lk0)"/><stop offset="1" style="stop-color:var(--lk1)"/></linearGradient>
<linearGradient id="mistG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--mist);stop-opacity:0"/><stop offset=".6" style="stop-color:var(--mist);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--mist);stop-opacity:0"/></linearGradient>
<radialGradient id="sunG"><stop offset="0" style="stop-color:var(--sun)" stop-opacity="1"/><stop offset=".35" style="stop-color:var(--sun)" stop-opacity=".45"/><stop offset="1" style="stop-color:var(--sun)" stop-opacity="0"/></radialGradient>
<radialGradient id="glowG"><stop offset="0" stop-color="#FFE3A8" stop-opacity=".95"/><stop offset="1" stop-color="#FFB86B" stop-opacity="0"/></radialGradient>
</defs>
<rect width="1600" height="900" fill="url(#skyG)"/>
<g class="stars">${stars}</g>
<g class="L L-far">
 <g class="sunset"><circle cx="780" cy="400" r="260" fill="url(#sunG)" opacity="var(--sunglow)"/><circle cx="780" cy="400" r="62" fill="var(--sun)"/></g>
 ${cloud(260, 190, 1.1, 90)}${cloud(1180, 150, .9, 110)}${cloud(760, 250, .7, 130)}
 <path d="M0,520 L0,430 L120,360 L230,410 L380,300 L520,400 L640,340 L780,430 L900,330 L1040,420 L1180,310 L1330,410 L1460,350 L1600,420 L1600,520Z" fill="var(--m0)"/>
 <rect y="430" width="1600" height="110" fill="url(#mistG)"/>
 <path d="M0,520 L0,470 L160,410 L300,470 L460,400 L620,480 L760,440 L920,490 L1100,420 L1260,490 L1420,430 L1600,480 L1600,520Z" fill="var(--m1)"/>
</g>
<g class="L L-mid">
 <path d="M0,545 Q300,505 600,540 T1200,525 T1600,535 L1600,570 L0,570Z" fill="var(--m2)"/>
 ${pines}
 <path d="M0,540 L1600,540 L1600,760 L0,760Z" fill="url(#lakeG)"/>
 <g class="refl" opacity="var(--refl)"><rect x="740" y="550" width="80" height="5" rx="2" fill="var(--sun)"/><rect x="752" y="566" width="56" height="5" rx="2" fill="var(--sun)"/><rect x="760" y="582" width="42" height="5" rx="2" fill="var(--sun)"/><rect x="766" y="598" width="30" height="4" rx="2" fill="var(--sun)"/><rect x="770" y="612" width="22" height="4" rx="2" fill="var(--sun)"/></g>
 <ellipse class="rip" cx="420" cy="620" rx="60" ry="9" fill="none" stroke="#fff" stroke-width="2"/><ellipse class="rip r2" cx="980" cy="600" rx="70" ry="10" fill="none" stroke="#fff" stroke-width="2"/><ellipse class="rip r3" cx="640" cy="672" rx="80" ry="11" fill="none" stroke="#fff" stroke-width="2"/><ellipse class="rip r4" cx="230" cy="688" rx="64" ry="9" fill="none" stroke="#fff" stroke-width="2"/>
 <path d="M1010,650 C1100,596 1180,572 1260,585 L1600,585 L1600,900 L1010,900Z" fill="var(--g1)"/>
 <g class="cabin">
  <rect x="1190" y="545" width="116" height="52" fill="var(--wood)"/><path d="M1178,548 L1248,498 L1318,548Z" fill="var(--roof)"/><rect x="1282" y="504" width="14" height="30" fill="var(--roof)"/>
  <rect x="1240" y="562" width="20" height="35" rx="2" fill="var(--door)"/>
  <rect x="1203" y="556" width="22" height="20" rx="2" fill="#FFE3A8" class="win"/><rect x="1275" y="556" width="22" height="20" rx="2" fill="#FFE3A8" class="win"/>
  <circle cx="1214" cy="566" r="30" fill="url(#glowG)" class="winglow"/><circle cx="1286" cy="566" r="30" fill="url(#glowG)" class="winglow"/>
  ${lamp(1322, 556)}${lamp(1160, 570)}
 </g>
 <g class="cat" transform="translate(1346 596)"><ellipse cx="0" cy="-8" rx="15" ry="11" fill="var(--cat)"/><circle cx="-11" cy="-19" r="8" fill="var(--cat)"/><path d="M-17,-24 l2,-9 l6,6z M-9,-26 l4,-8 l4,8z" fill="var(--cat)"/><path class="tail" d="M14,-6 C26,-6 28,-20 20,-24" stroke="var(--cat)" stroke-width="5" fill="none" stroke-linecap="round"/></g>
</g>
<g class="L L-near">
 <path d="M0,660 C300,636 560,704 800,724 C1000,738 1060,716 1010,700 L1010,900 L0,900Z" fill="var(--g0)"/>
 <path d="M0,740 C200,712 400,756 600,800 L600,900 L0,900Z" fill="var(--g1)" opacity=".7"/>
 <path d="M600,900 C700,828 860,770 940,722 C1040,670 1150,630 1232,603 L1264,603 C1210,650 1130,692 1050,740 C960,792 880,845 800,900Z" fill="var(--path)"/>
 ${stones}
 ${lamp(560, 764)}${lamp(1060, 650)}
 <g class="cherry"><path d="M222,900 C208,780 236,704 192,606 C176,566 150,526 130,474" stroke="var(--bark)" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M204,650 C252,606 304,566 346,506" stroke="var(--bark)" stroke-width="13" fill="none" stroke-linecap="round"/>${bl}</g>
 ${flowers}
 ${grass}
</g>
</svg>`;
  }

  function nookSVG() {
    const books = [['#CE8195', 46], ['#C9BDE4', 38], ['#8DAB91', 50], ['#E8C48C', 36], ['#F6B99C', 44], ['#CE8195', 34], ['#8DAB91', 42]];
    let bx = 138, shelf = '';
    for (const [c, w] of books) { shelf += `<rect x="${bx}" y="${300 - 96 - (w % 3) * 6}" width="${w * .6}" height="${96 + (w % 3) * 6}" rx="3" fill="${c}"/>`; bx += w * .6 + 3; }
    let b2 = 138, shelf2 = '';
    for (const [c, w] of books.slice().reverse()) { shelf2 += `<rect x="${b2}" y="${440 - 90 - (w % 4) * 5}" width="${w * .55}" height="${90 + (w % 4) * 5}" rx="3" fill="${c}"/>`; b2 += w * .55 + 3; }
    const lantern = (x, len) => `<g class="lant"><line x1="${x}" y1="0" x2="${x}" y2="${len}" stroke="var(--nk-frame)" stroke-width="3"/><circle cx="${x}" cy="${len + 30}" r="70" fill="url(#glowG)" class="nk-glow"/><rect x="${x - 15}" y="${len}" width="30" height="46" rx="8" fill="#E8C48C"/><rect x="${x - 15}" y="${len}" width="30" height="8" rx="3" fill="var(--nk-frame)"/></g>`;
    return `<svg class="sx-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
<defs><clipPath id="winClip"><rect x="570" y="150" width="460" height="400" rx="10"/></clipPath></defs>
<rect width="1600" height="900" fill="var(--nk-wall)"/>
<rect y="650" width="1600" height="250" fill="var(--nk-floor)"/>
<g stroke="rgba(0,0,0,.08)" stroke-width="3"><line x1="0" y1="700" x2="1600" y2="700"/><line x1="0" y1="760" x2="1600" y2="760"/><line x1="0" y1="830" x2="1600" y2="830"/></g>
<g clip-path="url(#winClip)"><rect x="570" y="150" width="460" height="400" fill="url(#skyG)"/><circle cx="800" cy="360" r="40" fill="var(--sun)"/><path d="M570,420 L650,330 L720,390 L800,300 L900,400 L960,340 L1030,410 L1030,550 L570,550Z" fill="var(--m0)"/><path d="M570,470 L690,400 L800,460 L930,420 L1030,470 L1030,550 L570,550Z" fill="var(--m1)"/><rect x="570" y="480" width="460" height="70" fill="url(#lakeG)"/></g>
<rect x="570" y="150" width="460" height="400" rx="10" fill="none" stroke="var(--nk-frame)" stroke-width="16"/><line x1="800" y1="150" x2="800" y2="550" stroke="var(--nk-frame)" stroke-width="8"/><line x1="570" y1="350" x2="1030" y2="350" stroke="var(--nk-frame)" stroke-width="8"/>
<rect x="545" y="548" width="510" height="16" rx="6" fill="var(--nk-frame)"/>
<g class="curt"><path d="M470,120 C560,220 520,420 500,640 L400,640 L400,120Z" fill="var(--nk-curtain)"/></g><g class="curt c2"><path d="M1130,120 C1040,220 1080,420 1100,640 L1200,640 L1200,120Z" fill="var(--nk-curtain)"/></g>
<g transform="translate(120 0)"><rect x="100" y="300" width="300" height="12" rx="4" fill="var(--nk-frame)"/><rect x="100" y="440" width="300" height="12" rx="4" fill="var(--nk-frame)"/>${shelf}${shelf2}
<g transform="translate(330 440)"><rect x="-14" y="-52" width="28" height="42" rx="6" fill="#B07A5E"/><path d="M0,-52 C-20,-76 -34,-70 -28,-92 M0,-52 C10,-84 30,-78 28,-98 M0,-52 C0,-80 -2,-96 6,-110" stroke="#6F946F" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>
<ellipse cx="800" cy="800" rx="540" ry="72" fill="var(--nk-rug)"/>
<g transform="translate(-130 0)"><g><rect x="1040" y="610" width="470" height="110" rx="34" fill="var(--nk-sofa)"/><rect x="1040" y="560" width="470" height="80" rx="34" fill="var(--nk-sofa2)"/>
 <path d="M1090,600 C1180,640 1330,640 1470,606 L1470,700 L1090,700Z" fill="var(--nk-blanket)"/><g stroke="rgba(255,255,255,.35)" stroke-width="5"><line x1="1140" y1="630" x2="1140" y2="700"/><line x1="1220" y1="640" x2="1220" y2="700"/><line x1="1300" y1="642" x2="1300" y2="700"/><line x1="1380" y1="636" x2="1380" y2="700"/></g>
 <rect x="1070" y="560" width="96" height="86" rx="22" fill="var(--nk-cushion)" transform="rotate(-8 1118 603)"/><rect x="1430" y="566" width="84" height="80" rx="22" fill="var(--nk-cushion2)" transform="rotate(7 1472 606)"/>
 <g class="nkcat" transform="translate(1300 590)"><ellipse cx="0" cy="0" rx="48" ry="26" fill="var(--cat)"/><circle cx="38" cy="-6" r="18" fill="var(--cat)"/><path d="M28,-20 l4,-14 l10,10z M40,-22 l8,-12 l6,14z" fill="var(--cat)"/><path d="M-46,4 C-70,10 -72,-8 -56,-12" stroke="var(--cat)" stroke-width="9" fill="none" stroke-linecap="round"/></g></g></g>
<g><rect x="676" y="720" width="12" height="80" fill="var(--nk-frame)"/><ellipse cx="682" cy="720" rx="64" ry="14" fill="var(--nk-frame)"/><path d="M660,684 h44 v24 q0,20 -22,20 q-22,0 -22,-20z" fill="#FFF5E9"/><path d="M704,692 q18,2 12,16 q-4,8 -12,6" stroke="#FFF5E9" stroke-width="5" fill="none"/>
 <g class="steam" stroke="rgba(255,255,255,.7)" stroke-width="4" fill="none" stroke-linecap="round"><path d="M672,672 q-10,-14 0,-26 q10,-12 0,-26"/><path d="M692,672 q-10,-14 0,-26 q10,-12 0,-26" style="animation-delay:-1.4s"/></g></g>
<g transform="translate(440 780) rotate(-6)"><path d="M0,0 l70,-12 l70,12 l0,10 l-70,-10 l-70,10z" fill="#FFF5E9"/><line x1="70" y1="-12" x2="70" y2="-2" stroke="#d8c4ae" stroke-width="3"/></g>
<rect class="nk-shade" width="1600" height="900" fill="#150f22"/>
${lantern(300, 30)}${lantern(800, 0)}${lantern(1300, 40)}
</svg>`;
  }

  /* ---------- Build DOM once ---------- */
  function build() {
    if (built) return; built = true;
    root = h('div', { id: 'sanctuary', class: 'sx', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Open When You Need Me', hidden: true, tabindex: '-1' });
    const world = h('div', { class: 'sx-world', 'aria-hidden': 'true', html: worldSVG() });
    const petals = h('div', { class: 'sx-petals', 'aria-hidden': 'true' });
    const flies = h('div', { class: 'sx-flies', 'aria-hidden': 'true' });
    for (let i = 0; i < 9; i++) flies.append(h('span', { class: 'fly', style: `left:${(8 + rnd() * 84).toFixed(0)}%;top:${(48 + rnd() * 40).toFixed(0)}%;animation-duration:${(9 + rnd() * 9).toFixed(1)}s;animation-delay:-${(rnd() * 12).toFixed(1)}s` }));
    const nook = h('div', { class: 'sx-nook', 'aria-hidden': 'true', html: nookSVG() });
    const veil = h('div', { class: 'sx-veil', 'aria-hidden': 'true' });
    const bar = h('header', { class: 'sx-bar' },
      h('button', { type: 'button', class: 'sx-btn sx-back', 'aria-label': 'Go back one step', onclick: back }, '← Back'),
      h('span', { class: 'sx-spacer' }),
      h('button', { type: 'button', class: 'sx-btn sx-skipanim', onclick: skipAnimation }, 'Skip animation'),
      h('button', { type: 'button', class: 'sx-btn sx-exit', 'aria-label': 'Leave this place and return to your little space', onclick: close }, 'Exit ✕'));
    stage = h('main', { class: 'sx-stage' });
    live = h('div', { class: 'sx-sr', 'aria-live': 'polite', role: 'status' });
    root.append(world, petals, flies, nook, veil, bar, stage, live);
    stage.append(buildScene1(), buildScene2(), buildScene3(), buildScene4(), buildScene5(), buildScene6(), buildScene7(), buildScene8());
    document.body.append(root);
    root.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') trapFocus(e);
    });
  }

  function trapFocus(e) {
    const f = [...root.querySelectorAll('button:not([disabled]),input,textarea,select,audio[controls],a[href]')].filter(el => el.offsetParent !== null && !el.closest('[hidden]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  const sceneEl = (n, cls, ...kids) => h('section', { class: 'sx-scene ' + (cls || ''), 'data-s': n, hidden: true, 'aria-label': 'Scene ' + n }, ...kids);
  const title = (t, id) => h('h2', { class: 'sx-title', tabindex: '-1', id }, t);
  const soft = t => h('p', { class: 'sx-soft' }, t);
  const btn = (label, fn, cls) => h('button', { type: 'button', class: 'sx-cta ' + (cls || ''), onclick: fn }, label);

  /* Scene 1 */
  function buildScene1() {
    return sceneEl(1, 'sx-low', h('div', { class: 'sx-card sx-intro-card' }, title(C.entry.title), soft(C.entry.text), btn(C.entry.button, () => go(2))));
  }
  /* Scene 2 */
  function buildScene2() {
    const signs = h('ul', { class: 'sx-signs', 'aria-label': 'Signposts along the path' }, C.walk.signs.map((s, i) => h('li', { class: 'sx-sign s' + (i + 1) }, h('span', null, s))));
    return sceneEl(2, 'sx-low', signs, h('div', { class: 'sx-card' }, title('Walking into calm'), soft(C.walk.text), h('div', { class: 'sx-actions' }, btn('Continue', () => go(3)))));
  }
  /* Scene 3 */
  function buildScene3() {
    const L = C.letGo;
    const bubbles = h('div', { class: 'sx-bubbles', role: 'group', 'aria-label': 'Worries you can look at, optional' });
    const out = h('div', { class: 'sx-bubble-out', 'aria-live': 'polite' });
    const sel = { el: null, w: null };
    L.worries.forEach((w, i) => {
      const b = h('button', { type: 'button', class: 'sx-bubble b' + (i + 1), 'aria-pressed': 'false', onclick: () => pick(b, w) }, h('span', null, w.label));
      bubbles.append(b);
    });
    function pick(b, w) {
      bubbles.querySelectorAll('.sx-bubble').forEach(x => { x.classList.remove('open'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('open'); b.setAttribute('aria-pressed', 'true'); sel.el = b; sel.w = w;
      out.replaceChildren(h('h3', { class: 'sx-sub' }, w.label), soft(w.message), h('div', { class: 'sx-actions' },
        btn('Release it', () => release(), 'ghost'), btn('Keep it for now', () => keep(), 'ghost')));
      announce(w.message);
    }
    function release() {
      if (!sel.el) return; const el = sel.el; el.classList.remove('open'); el.classList.add('gone'); el.disabled = true;
      out.replaceChildren(soft(L.releasedNote)); announce(L.releasedNote); sel.el = null;
    }
    function keep() { if (sel.el) sel.el.classList.remove('open'); out.replaceChildren(soft(L.keepNote)); announce(L.keepNote); sel.el = null; }
    return sceneEl(3, 'sx-low', bubbles, h('div', { class: 'sx-card' }, title(L.title), soft(L.intro), out, h('div', { class: 'sx-actions' }, btn('Continue', () => go(4)), h('button', { type: 'button', class: 'sx-link', onclick: () => go(4) }, 'Skip this'))));
  }
  /* Scene 4 */
  function buildScene4() {
    const N = C.nook, panel = h('div', { class: 'sx-nook-panel', 'aria-live': 'polite' });
    const choices = h('div', { class: 'sx-choices', role: 'group', 'aria-label': 'What would help right now?' });
    N.choices.forEach(c => choices.append(h('button', { type: 'button', class: 'sx-choice', onclick: () => choose(c) }, c.label)));
    function choose(c) {
      root.classList.toggle('nook-dim', c.id === 'rest');
      let i = 0;
      const line = soft(c.lines[0]);
      const act = h('button', { type: 'button', class: 'sx-cta ghost', onclick: step }, c.lines.length > 1 ? c.action : 'Stay a while');
      function step() {
        if (c.id === 'comfort') root.classList.add('nook-warm');
        if (c.id === 'encouragement') root.classList.add('nook-lit');
        i++;
        if (i < c.lines.length) { line.textContent = c.lines[i]; announce(c.lines[i]); act.textContent = i === c.lines.length - 1 ? 'Stay a while' : 'Next'; }
        else { act.hidden = true; }
      }
      if (c.id === 'rest') { root.classList.add('nook-lit'); }
      panel.replaceChildren(h('h3', { class: 'sx-sub' }, c.label), line, h('div', { class: 'sx-actions' }, act, btn('Choose what I need →', () => { root.classList.remove('nook-dim'); go(5); })));
      announce(c.lines[0]);
    }
    return sceneEl(4, 'sx-low', h('div', { class: 'sx-card' }, title(N.title), soft(N.text), choices, panel, h('div', { class: 'sx-actions' }, h('button', { type: 'button', class: 'sx-link', onclick: () => go(5) }, 'Skip to choices'))));
  }
  /* Scene 5 */
  const ICON = {
    sad: 'M12 3c3 4 5 6.5 5 9a5 5 0 0 1-10 0c0-2.5 2-5 5-9z',
    overthinking: 'M12 12a2 2 0 1 1 2 2a4 4 0 1 1-4-4a6 6 0 1 1 6 6',
    motivation: 'M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 15c0-3 2-5 6-5 0 3-2 5-6 5z',
    'miss-me': 'M12 20s-7-4.500-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.500-7 10-7 10z',
    laugh: 'M8 14c1 2 7 2 8 0M9 9h.01M15 9h.01M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z',
    sleep: 'M20 14.500A8 8 0 1 1 9.500 4a6.500 6.500 0 0 0 10.500 10.500z',
    'not-enough': 'M12 3l2.600 5.500 6 .8-4.400 4.200 1.100 6L12 16.700 6.700 19.500l1.100-6L3.400 9.300l6-.8z',
    lost: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM15.500 8.500l-2 5-5 2 2-5z'
  };
  const svgIcon = d => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); s.append(p); return s; };
  function buildScene5() {
    const grid = h('div', { class: 'sx-cards' });
    C.categories.forEach((c, i) => grid.append(h('button', { type: 'button', class: 'sx-cat c' + (i % 4), onclick: () => openCategory(c) },
      h('span', { class: 'sx-cat-ill' }, svgIcon(ICON[c.id] || ICON.lost)), h('span', { class: 'sx-cat-t' }, c.title), h('span', { class: 'sx-cat-b' }, c.blurb))));
    return sceneEl(5, 'sx-wide', h('div', { class: 'sx-card sx-wide-card' }, title('Choose what you need'), soft('Pick whatever feels closest. You can come back and choose again.'), grid));
  }
  /* Scene 6 – dedicated experiences */
  let expBox;
  function buildScene6() {
    expBox = h('div', { class: 'sx-card sx-exp' });
    return sceneEl(6, 'sx-wide', expBox);
  }
  const persist = (kind, text) => {
    try {
      if (!text || !text.trim() || typeof state === 'undefined') return false;
      state.sanctuary = state.sanctuary || { reflections: [], goodThings: [] };
      state.sanctuary.reflections = state.sanctuary.reflections || [];
      state.sanctuary.reflections.push({ id: crypto.randomUUID(), kind, text: text.trim(), date: today() });
      saveState(); return true;
    } catch (e) { return false; }
  };
  function voiceBlock(src) {
    const wrap = h('div', { class: 'sx-voice', hidden: true });
    if (!src) return wrap;
    const a = h('audio', { controls: true, preload: 'metadata', 'aria-label': 'Voice message from Shashanth' });
    a.addEventListener('loadedmetadata', () => { wrap.hidden = false; });
    a.addEventListener('error', () => { wrap.hidden = true; });
    wrap.append(h('p', { class: 'sx-small' }, 'A voice message for you'), a); a.src = src;
    return wrap;
  }
  function expShell(c, body) {
    expBox.replaceChildren(title(c.title, 'expTitle'), soft(c.blurb), body || '', voiceBlock(c.voice), h('div', { class: 'sx-actions' },
      btn('Continue', () => { leaveExperience(); go(7); }), h('button', { type: 'button', class: 'sx-link', onclick: () => { leaveExperience(); go(5); } }, '← Choose something else')));
  }
  function leaveExperience() { root.classList.remove('exp-night'); setMode(root.dataset.base); Sound.stop(); clearTimers(); }

  function linesReveal(lines, afterEl) {
    const box = h('div', { class: 'sx-lines' }); let i = 0;
    const p = soft(lines[0]); box.append(p);
    const more = h('button', { type: 'button', class: 'sx-cta ghost', onclick: () => { i++; if (i < lines.length) { p.textContent = lines[i]; announce(lines[i]); pulse(p); } if (i >= lines.length - 1) more.hidden = true; } }, 'Another gentle thought');
    if (lines.length < 2) more.hidden = true;
    box.append(more); return box;
  }
  function pulse(el) { el.classList.remove('fadein'); void el.offsetWidth; el.classList.add('fadein'); }

  function openCategory(c) {
    const body = h('div', { class: 'sx-exp-body' });
    const intro = linesReveal(c.lines);
    if (c.id === 'sad') {
      const ta = h('textarea', { class: 'sx-input', rows: '3', 'aria-label': 'What is on your heart (optional)', placeholder: 'Optional. Write it, and let it fall away like rain.' });
      const rain = h('div', { class: 'sx-rain', 'aria-hidden': 'true' }); for (let i = 0; i < 22; i++) rain.append(h('i', { style: `left:${(rnd() * 100).toFixed(0)}%;animation-delay:-${(rnd() * 2).toFixed(2)}s;animation-duration:${(1.2 + rnd()).toFixed(2)}s` }));
      const fall = h('p', { class: 'sx-fall', 'aria-live': 'polite' });
      const go1 = btn('Let it fall like rain', () => { const t = ta.value.trim(); if (!t) { announce('Nothing to let go of. That’s okay too.'); fall.textContent = 'Nothing needs to be written. You can simply sit with it.'; return; } fall.textContent = t; fall.classList.remove('melt'); void fall.offsetWidth; fall.classList.add('melt'); ta.value = ''; announce('Your words are falling away like rain.'); }, 'ghost');
      body.append(intro, soft(c.prompt), ta, h('div', { class: 'sx-actions' }, go1, btn('Save to shared space', () => { if (persist('sad', ta.value)) { ta.value = ''; announce('Saved to your shared space.'); fall.textContent = 'Saved to your shared space.'; } else announce('Nothing to save.'); }, 'ghost')), fall, rain);
    } else if (c.id === 'overthinking') {
      const ta = h('textarea', { class: 'sx-input', rows: '3', 'aria-label': 'The thought that keeps circling', placeholder: 'The thought that keeps circling…' });
      const lake = h('div', { class: 'sx-lakestrip', 'aria-live': 'polite' });
      body.append(intro, soft(c.prompt), ta, h('div', { class: 'sx-actions' }, btn('Set it on the lake', () => {
        const t = ta.value.trim(); if (!t) { announce('Write a thought first, or just continue.'); return; }
        lake.append(h('span', { class: 'boat' }, '⛵ ' + (t.length > 60 ? t.slice(0, 57) + '…' : t))); ta.value = ''; announce('Your thought is floating away on the water. It can stay unanswered.');
      }, 'ghost')), lake);
    } else if (c.id === 'motivation') {
      const done = soft(''); const chips = h('div', { class: 'sx-chips', role: 'group', 'aria-label': 'Choose one tiny step' });
      c.steps.forEach(s => chips.append(h('button', { type: 'button', class: 'sx-chip', 'aria-pressed': 'false', onclick: e => { chips.querySelectorAll('.sx-chip').forEach(x => x.setAttribute('aria-pressed', 'false')); e.currentTarget.setAttribute('aria-pressed', 'true'); done.textContent = '“' + s + '”. ' + c.stepDone; pulse(done); announce(done.textContent); } }, s)));
      body.append(intro, chips, done);
    } else if (c.id === 'miss-me') {
      const hisNotes = (C.hisNotes || []).filter(Boolean);
      body.append(intro);
      if (hisNotes.length) { const hb = h('div', { class: 'sx-his' }, h('p', { class: 'sx-small' }, 'A note from Shashanth'), ...hisNotes.map(n => h('p', { class: 'sx-soft' }, n))); body.append(hb); }
    } else if (c.id === 'laugh') {
      let j = Math.floor(Math.random() * c.jokes.length); const q = soft(''), a = soft(''); a.classList.add('punch');
      const show = () => { q.textContent = c.jokes[j][0]; a.textContent = ''; reveal.hidden = false; };
      const reveal = btn('Tell me', () => { a.textContent = c.jokes[j][1]; pulse(a); reveal.hidden = true; announce(c.jokes[j][1]); }, 'ghost');
      const next = btn('Another one', () => { j = (j + 1) % c.jokes.length; show(); }, 'ghost');
      body.append(intro.firstChild, q, a, h('div', { class: 'sx-actions' }, reveal, next)); show();
    } else if (c.id === 'sleep') {
      root.classList.add('exp-night'); setMode('night');
      const ta = h('textarea', { class: 'sx-input', rows: '3', 'aria-label': 'What can wait until tomorrow (optional)', placeholder: 'Optional. What can wait until tomorrow?' });
      const lanterns = h('div', { class: 'sx-lanterns', 'aria-live': 'polite' });
      const snd = soundRow(['rain', 'wind', 'water']);
      body.append(intro, soft(c.prompt), ta, h('div', { class: 'sx-actions' }, btn('Send it away on a lantern', () => {
        const t = ta.value.trim(); if (!t) { announce('Nothing to send. You can rest.'); return; }
        lanterns.append(h('span', { class: 'lantern-up' }, h('i', null), t.length > 50 ? t.slice(0, 47) + '…' : t)); ta.value = ''; announce('Your thought drifts up and away on a lantern. It can wait until tomorrow.');
        later(() => { lanterns.replaceChildren(soft(c.goodnight)); }, 6000);
      }, 'ghost')), lanterns, soft('Optional sounds'), snd);
    } else if (c.id === 'not-enough') {
      const inputs = c.fields.map(f => h('label', { class: 'sx-field' }, f, h('input', { type: 'text', class: 'sx-input', maxlength: '140', placeholder: 'Anything small counts' })));
      const mirror = h('div', { class: 'sx-mirror', 'aria-live': 'polite' });
      body.append(intro, ...inputs, h('div', { class: 'sx-actions' }, btn('See what’s true', () => {
        const vals = inputs.map((l, i) => [c.fields[i], l.querySelector('input').value.trim()]).filter(v => v[1]);
        if (!vals.length) { mirror.replaceChildren(soft('Even if nothing comes to mind right now: ' + c.mirror)); return; }
        mirror.replaceChildren(soft(c.mirror), h('ul', { class: 'sx-list' }, vals.map(v => h('li', null, h('em', null, v[0] + ': '), v[1]))), btn('Save to shared space', () => { persist('not-enough', vals.map(v => v[0] + ': ' + v[1]).join('\n')); announce('Saved to your shared space.'); }, 'ghost'));
      }, 'ghost')), mirror);
    } else if (c.id === 'lost') {
      let i = 0; const q = h('p', { class: 'sx-soft sx-q' }, c.questions[0]);
      const ta = h('textarea', { class: 'sx-input', rows: '2', 'aria-label': 'Your thoughts (optional)', placeholder: 'Optional. Think, or write.' });
      const nextQ = btn('Another question', () => { i = (i + 1) % c.questions.length; q.textContent = c.questions[i]; pulse(q); ta.value = ''; announce(c.questions[i]); }, 'ghost');
      body.append(intro, q, ta, h('div', { class: 'sx-actions' }, nextQ, btn('Save to shared space', () => { if (persist('lost', c.questions[i] + '\n' + ta.value)) announce('Saved to your shared space.'); }, 'ghost')), soft(c.closing));
    }
    expShell(c, body);
    go(6);
  }

  /* Scene 7 – activities */
  let actPanel, actGrid;
  function buildScene7() {
    actGrid = h('div', { class: 'sx-cards sx-acts' });
    C.activities.forEach(a => actGrid.append(h('button', { type: 'button', class: 'sx-cat', onclick: () => openActivity(a) }, h('span', { class: 'sx-cat-t' }, a.title), h('span', { class: 'sx-cat-b' }, a.blurb))));
    actPanel = h('div', { class: 'sx-actpanel', hidden: true });
    return sceneEl(7, 'sx-wide', h('div', { class: 'sx-card sx-wide-card' }, title('Something gentle, if you like'), soft('Nothing here is required. Choose one, or none.'), actGrid, actPanel,
      h('div', { class: 'sx-actions' }, btn('I’m ready to finish →', () => go(8)), h('button', { type: 'button', class: 'sx-link', onclick: () => go(5) }, '← Back to what I need'))));
  }
  function showPanel(content) { actGrid.hidden = true; actPanel.hidden = false; actPanel.replaceChildren(content, h('button', { type: 'button', class: 'sx-link', onclick: closePanel }, '← Other things to try')); const f = actPanel.querySelector('button,textarea,input'); if (f) f.focus(); }
  function closePanel() { stopBreath(); Sound.stop(); clearTimers(); setMode(root.dataset.base); actPanel.hidden = true; actGrid.hidden = false; }
  function openActivity(a) {
    const mk = {
      breathe: breatheUI, sunset: sunsetUI, nature: natureUI, note: noteUI, write: writeUI, good: goodUI
    }[a.id];
    showPanel(h('div', null, h('h3', { class: 'sx-sub' }, a.title), mk()));
  }

  /* Breathing */
  let breathTimer = null, breathOn = false;
  function stopBreath() { breathOn = false; if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; } }
  function breatheUI() {
    const ring = h('div', { class: 'sx-orb', 'aria-hidden': 'true' }), cue = h('p', { class: 'sx-cue', 'aria-live': 'off' }, 'Ready when you are');
    const wrap = h('div', { class: 'sx-breath' }, h('div', { class: 'sx-orb-wrap' }, ring), cue);
    const start = h('button', { type: 'button', class: 'sx-cta ghost' }, 'Start');
    const freezeTransform = () => { const t = getComputedStyle(ring).transform; ring.style.transition = 'none'; ring.style.transform = t; };
    function cycle() {
      if (!breathOn) return;
      ring.style.transition = `transform 4s ease-in-out, opacity 4s ease-in-out`; ring.classList.add('in'); ring.style.transform = ''; cue.textContent = 'Breathe in gently…';
      breathTimer = setTimeout(() => {
        if (!breathOn) return;
        ring.style.transition = `transform 6s ease-in-out, opacity 6s ease-in-out`; ring.classList.remove('in'); cue.textContent = 'And out, slowly…';
        breathTimer = setTimeout(cycle, 6000);
      }, 4000);
    }
    start.addEventListener('click', () => {
      if (breathOn) { stopBreath(); freezeTransform(); cue.textContent = 'Paused. Resume whenever you like.'; start.textContent = 'Resume'; }
      else { breathOn = true; ring.style.transition = ''; ring.style.transform = ''; start.textContent = 'Pause'; cycle(); }
    });
    return h('div', null, wrap, h('p', { class: 'sx-small' }, C.breatheReminder), h('div', { class: 'sx-actions' }, start, h('button', { type: 'button', class: 'sx-cta ghost', onclick: closePanel }, 'Skip')));
  }
  /* Sunset */
  function sunsetUI() {
    const msg = soft(''); const base = root.dataset.base;
    const next = base === 'golden' ? 'dusk' : 'night';
    root.classList.add('sx-sunset'); setMode(next);
    later(() => { msg.textContent = C.sunsetMessage; pulse(msg); announce(C.sunsetMessage); }, RM() ? 300 : 7000);
    return h('div', null, soft('Watch the sky change. There’s nothing to do.'), msg, h('div', { class: 'sx-actions' }, h('button', { type: 'button', class: 'sx-cta ghost', onclick: () => { root.classList.remove('sx-sunset'); closePanel(); } }, 'Done watching')));
  }
  /* Notes */
  function noteUI() {
    const all = [...(C.hisNotes || []).filter(Boolean).map(t => ({ t, his: true })), ...C.notes.map(t => ({ t }))];
    let i = Math.floor(Math.random() * all.length); const p = soft(''), who = h('p', { class: 'sx-small' });
    const show = () => { p.textContent = all[i].t; who.textContent = all[i].his ? 'A note from Shashanth' : 'A note for you'; pulse(p); announce(all[i].t); };
    show();
    return h('div', null, who, p, h('div', { class: 'sx-actions' }, btn('Another note', () => { i = (i + 1) % all.length; show(); }, 'ghost')));
  }
  /* Write */
  function writeUI() {
    let pi = 0; const prompt = h('p', { class: 'sx-soft sx-q' }, C.writePrompts[0]);
    const ta = h('textarea', { class: 'sx-input', rows: '4', 'aria-label': 'Write to yourself', placeholder: 'Write a note to keep in your shared space.' });
    const status = h('p', { class: 'sx-small', 'aria-live': 'polite' }, 'Saved to your shared space only when you choose to save it.');
    const saved = h('div', { class: 'sx-saved' });
    const renderSaved = () => {
      const list = (typeof state !== 'undefined' && state.sanctuary?.reflections || []).slice(-4).reverse();
      saved.replaceChildren(...(list.length ? [h('p', { class: 'sx-small' }, 'Your saved reflections')] : []), ...list.map(r => h('div', { class: 'sx-saveditem' }, h('span', null, (r.text || '').slice(0, 140)), h('button', { type: 'button', class: 'sx-link', 'aria-label': 'Delete this reflection', onclick: () => { state.sanctuary.reflections = state.sanctuary.reflections.filter(x => x.id !== r.id); saveState(); renderSaved(); } }, 'Delete'))));
    };
    renderSaved();
    return h('div', null, prompt, ta, h('div', { class: 'sx-actions' },
      btn('Another prompt', () => { pi = (pi + 1) % C.writePrompts.length; prompt.textContent = C.writePrompts[pi]; pulse(prompt); }, 'ghost'),
      btn('Save to shared space', () => { if (persist('reflection', C.writePrompts[pi] + '\n' + ta.value)) { ta.value = ''; status.textContent = 'Saved to your shared space.'; renderSaved(); } else status.textContent = 'Nothing to save yet.'; }, 'ghost'),
      btn('Discard', () => { ta.value = ''; status.textContent = 'Discarded. Nothing was kept.'; }, 'ghost')), status, saved);
  }
  /* Three good things */
  function goodUI() {
    const ins = [1, 2, 3].map(n => h('input', { type: 'text', class: 'sx-input', maxlength: '140', 'aria-label': 'Good thing ' + n, placeholder: 'Something pleasant, meaningful or comforting' }));
    const status = h('p', { class: 'sx-small', 'aria-live': 'polite' });
    return h('div', null, soft(C.goodThingsIntro), ...ins, h('div', { class: 'sx-actions' },
      btn('Save to shared space', () => {
        const t = ins.map(i => i.value.trim()).filter(Boolean); if (!t.length) { status.textContent = 'Nothing to save yet. Noticing is enough too.'; return; }
        try { state.sanctuary = state.sanctuary || { reflections: [], goodThings: [] }; state.sanctuary.goodThings = state.sanctuary.goodThings || []; state.sanctuary.goodThings.push({ id: crypto.randomUUID(), items: t, date: today() }); saveState(); ins.forEach(i => i.value = ''); status.textContent = 'Saved to your shared space.'; } catch (e) { status.textContent = 'Could not save right now.'; }
      }, 'ghost'),
      btn('Not now', () => { ins.forEach(i => i.value = ''); closePanel(); }, 'ghost')), status);
  }
  /* Nature sounds */
  function natureUI() { return h('div', null, h('p', { class: 'sx-small' }, 'Soft sounds, off until you choose. Add your own recordings to assets/nature/ to replace the generated ones.'), soundRow(C.natureSounds.map(s => s.id))); }
  function soundRow(ids) {
    const row = h('div', { class: 'sx-sounds', role: 'group', 'aria-label': 'Nature sounds' });
    const stop = h('button', { type: 'button', class: 'sx-cta ghost', onclick: () => { Sound.stop(); row.querySelectorAll('.sx-chip').forEach(x => x.setAttribute('aria-pressed', 'false')); } }, 'Stop');
    const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(Sound.vol), 'aria-label': 'Volume', class: 'sx-vol' });
    vol.addEventListener('input', () => Sound.setVolume(Number(vol.value)));
    const chips = h('div', { class: 'sx-chips' });
    ids.forEach(id => { const def = C.natureSounds.find(s => s.id === id); const b = h('button', { type: 'button', class: 'sx-chip', 'aria-pressed': 'false', onclick: () => { chips.querySelectorAll('.sx-chip').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); Sound.play(def); } }, def.label); chips.append(b); });
    row.append(chips, h('label', { class: 'sx-vollab' }, 'Volume', vol), stop); return row;
  }

  /* Scene 8 */
  function buildScene8() {
    const E = C.ending;
    const main = h('div', { class: 'sx-card sx-end' }, title(E.title), soft(E.text), h('p', { class: 'sx-lede' }, E.line), h('p', { class: 'sx-small' }, E.support), h('p', { class: 'sx-small' }, E.helplines),
      h('div', { class: 'sx-actions' }, btn('Return to My Little Space', close), btn('Stay Here a Little Longer', stay, 'ghost')));
    const stayBar = h('div', { class: 'sx-staybar', hidden: true }, h('p', { class: 'sx-soft' }, 'Stay as long as you like.'), soundRow(['rain', 'wind', 'forest', 'water']), h('div', { class: 'sx-actions' }, btn('Return to My Little Space', close)));
    function stay() { main.hidden = true; stayBar.hidden = false; root.classList.add('sx-stay'); announce('Staying a little longer.'); stayBar.querySelector('button')?.focus(); }
    const sc = sceneEl(8, 'sx-low', main, stayBar);
    sc._reset = () => { main.hidden = false; stayBar.hidden = true; root.classList.remove('sx-stay'); };
    return sc;
  }

  /* ---------- Sounds ---------- */
  const Sound = {
    ctx: null, master: null, vol: .5, audio: null, nodes: [], t: [],
    unlock() { try { if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination); } if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { } },
    setVolume(v) { this.vol = v; if (this.audio) this.audio.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, .05); },
    noise(kind) {
      const c = this.ctx, len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0, last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2; } }
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true; return s;
    },
    synth(id) {
      this.unlock(); const c = this.ctx; if (!c) return; const g = c.createGain(); g.gain.value = 0; g.connect(this.master); g.gain.setTargetAtTime(1, c.currentTime, .6); this.nodes.push(g);
      const lfo = (freq, amt, param) => { const o = c.createOscillator(), a = c.createGain(); o.frequency.value = freq; a.gain.value = amt; o.connect(a); a.connect(param); o.start(); this.nodes.push(o, a); };
      const chain = (src, ...fs) => { let n = src; fs.forEach(f => { n.connect(f); n = f; }); n.connect(g); src.start(); this.nodes.push(src, ...fs); };
      const filt = (type, f, q) => { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
      if (id === 'rain') { chain(this.noise('pink'), filt('highpass', 900), filt('lowpass', 8500)); const body = c.createGain(); body.gain.value = .5; const n2 = this.noise('brown'); n2.connect(filt('lowpass', 500)).connect(body); body.connect(g); n2.start(); this.nodes.push(n2, body); }
      else if (id === 'wind') { const bp = filt('bandpass', 420, .7); chain(this.noise('brown'), bp); lfo(.07, 220, bp.frequency); const gg = c.createGain(); gg.gain.value = .5; }
      else if (id === 'water') { const bp = filt('bandpass', 950, 1.2); chain(this.noise('pink'), bp, filt('lowpass', 2600)); lfo(.6, 340, bp.frequency); lfo(1.3, 180, bp.frequency); }
      else if (id === 'forest') {
        const bp = filt('bandpass', 380, .6); chain(this.noise('brown'), bp); lfo(.05, 140, bp.frequency);
        const chirp = () => { if (!this.ctx) return; const n = 2 + Math.floor(Math.random() * 3); for (let k = 0; k < n; k++) { const t0 = c.currentTime + k * .17, o = c.createOscillator(), e = c.createGain(); o.type = 'sine'; const f0 = 2200 + Math.random() * 1500; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f0 * 1.3, t0 + .1); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(.05, t0 + .02); e.gain.exponentialRampToValueAtTime(.0001, t0 + .13); o.connect(e); e.connect(g); o.start(t0); o.stop(t0 + .15); } this.t.push(setTimeout(chirp, 2500 + Math.random() * 5500)); };
        this.t.push(setTimeout(chirp, 1500));
      }
    },
    play(def) {
      this.stop(); this.unlock();
      const a = new Audio(def.file); a.loop = true; a.volume = this.vol;
      const fallback = () => { if (this.audio === a) { this.audio = null; } this.synth(def.id); };
      this.audio = a;
      a.addEventListener('error', fallback, { once: true });
      const p = a.play(); if (p && p.catch) p.catch(() => { if (this.audio === a) fallback(); });
    },
    stop() {
      if (this.audio) { try { this.audio.pause(); } catch (e) { } this.audio = null; }
      this.t.forEach(clearTimeout); this.t = [];
      if (this.ctx && this.nodes.length) { const nodes = this.nodes; this.nodes = []; try { nodes[0].gain.cancelScheduledValues(0); nodes[0].gain.setTargetAtTime(0, this.ctx.currentTime, .03); } catch (e) { } setTimeout(() => nodes.forEach(n => { try { n.stop && n.stop(); } catch (e) { } try { n.disconnect(); } catch (e) { } }), 160); }
    },
    dispose() { this.stop(); if (this.ctx) { try { this.ctx.close(); } catch (e) { } this.ctx = null; this.master = null; } }
  };

  /* ---------- Scene control ---------- */
  function setMode(m) { root.dataset.mode = m; }
  function announce(t) { if (live) { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); } }
  function go(n, isBack) {
    if (!isBack && scene !== n) history.push(scene);
    stage.querySelectorAll('.sx-scene').forEach(s => { s.hidden = true; s.classList.remove('on'); });
    const el = stage.querySelector(`.sx-scene[data-s="${n}"]`); if (!el) return;
    if (el._reset) el._reset();
    el.hidden = false; void el.offsetWidth; el.classList.add('on');
    scene = n; root.dataset.scene = String(n);
    if (n <= 3 || n === 7 || n === 8) root.classList.remove('nook-dim');
    if (n === 8) { root.classList.remove('sx-sunset'); setMode('night'); }
    else if (n === 6 && root.classList.contains('exp-night')) setMode('night');
    else if (n === 7 && root.classList.contains('sx-sunset')) { /* keep sunset sky */ }
    else setMode(root.dataset.base);
    if (n !== 1) root.classList.add('intro-done');
    const hd = el.querySelector('.sx-title'); if (hd) { hd.focus({ preventScroll: true }); }
    if (n === 1) announce(C.a11y.world); if (n === 4) announce(C.a11y.nook);
    const showSkip = n <= 2; root.querySelector('.sx-skipanim').hidden = !showSkip;
    root.querySelector('.sx-back').hidden = n === 1;
    if (n === 1) clearTimers();
    el.scrollTop = 0; const card = el.querySelector('.sx-card'); if (card) card.scrollTop = 0;
  }
  function back() {
    Sound.stop(); stopBreath(); clearTimers();
    const prev = history.pop(); go(prev || 1, true);
    if (prev === 7 && actPanel) { actPanel.hidden = true; actGrid.hidden = false; }
  }
  function skipAnimation() { root.classList.add('sx--skip', 'intro-done'); announce('Animation skipped.'); }

  /* ---------- Ambient: petals ---------- */
  function spawnPetal() {
    if (RM() || !root || root.hidden) return;
    const w = root.querySelector('.sx-petals'); if (w.childElementCount > 14) return;
    const p = h('span', { class: 'petal-fall' }); const dur = 14 + Math.random() * 12;
    p.style.cssText = `left:${(Math.random() * 100).toFixed(0)}%;--dx:${(80 + Math.random() * 260).toFixed(0)}px;--r:${(180 + Math.random() * 360).toFixed(0)}deg;animation-duration:${dur.toFixed(1)}s;width:${(9 + Math.random() * 8).toFixed(0)}px;height:${(12 + Math.random() * 8).toFixed(0)}px`;
    p.addEventListener('animationend', () => p.remove()); w.append(p);
  }

  /* ---------- Open / close ---------- */
  function open(from) {
    try {
      build();
      opener = from || document.activeElement;
      const dark = document.body.dataset.theme === 'dark';
      root.dataset.tone = dark ? 'dark' : 'light'; root.dataset.base = dark ? 'dusk' : 'golden'; setMode(root.dataset.base);
      root.classList.remove('sx--skip', 'intro-done', 'exp-night', 'nook-dim', 'nook-warm', 'nook-lit', 'sx-sunset', 'sx-stay', 'sx--leaving');
      root.classList.add('sx--enter');
      history = []; scene = 1; root.hidden = false; document.body.classList.add('sx-open');
      go(1, true); root.focus({ preventScroll: true });
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('sx--in')));
      later(() => root.classList.remove('sx--enter'), 1400);
      for (let i = 0; i < 4; i++) later(spawnPetal, 2500 + i * 1500);
      clearInterval(petalTimer); petalTimer = setInterval(spawnPetal, 3200);
    } catch (e) { console.error('Sanctuary failed to open', e); if (typeof toast === 'function') toast('Could not open this place right now. The rest of your space still works.'); }
  }
  function close() {
    stopBreath(); Sound.dispose(); clearTimers(); clearInterval(petalTimer); petalTimer = null;
    root.classList.add('sx--leaving');
    setTimeout(() => { root.hidden = true; root.classList.remove('sx--in', 'sx--leaving'); document.body.classList.remove('sx-open'); root.querySelectorAll('.petal-fall').forEach(p => p.remove()); if (opener && opener.focus) { try { opener.focus(); } catch (e) { } } if (typeof switchView === 'function' && !document.querySelector('.view.active-view')) switchView('home'); }, RM() ? 0 : 450);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && root && !root.hidden) { Sound.stop(); stopBreath(); } });
  document.addEventListener('click', e => { const t = e.target.closest('[data-open-sanctuary]'); if (t) { e.preventDefault(); open(t); } });
  window.Sanctuary = { open, close };
})();
