/* Moncy's Little Space — v2 additions.
   Loads after app.js and re-uses its globals (state, saveState, switchView, toast, today, fmt, periodStats, escapeHTML).
   New data is stored inside the existing `wellness_state` JSON (keys: profile, skills, requests, sanctuary),
   so no database migration is needed for these features. */
(function () {
  'use strict';
  const $id = id => document.getElementById(id);
  const esc = v => (typeof escapeHTML === 'function' ? escapeHTML(v) : String(v));
  const RM = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
  const weekdayShort = d => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
  const addDays = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); };

  function ensure() {
    state.profile = state.profile || { photo: '' };
    state.skills = state.skills || {};
    const s = state.skills; s.status = s.status || {}; s.removed = s.removed || []; s.custom = s.custom || []; s.practice = s.practice || {};
    state.requests = state.requests || [];
    state.sanctuary = state.sanctuary || { reflections: [], goodThings: [] };
    state.preferences = state.preferences || { appearance: 'light', skin: 'blush' };
  }

  /* =============== QUOTES =============== */
  const QUOTES = [
    'Be gentle with yourself; you are growing at your own pace.', 'You don’t have to do everything today. One kind step is enough.', 'Rest is not a reward. It is a need.',
    'Small steps still move you forward.', 'You are allowed to begin again, as many times as you need.', 'Not every day has to be productive to be worthwhile.',
    'Your feelings are valid, even the quiet ones.', 'You can be proud of how far you’ve come and still be learning.', 'It is okay to ask for help. It is a strength, not a weakness.',
    'Breathe in slowly. This moment is the only one you have to handle.', 'You are doing better than you think you are.', 'Healing is not a straight line, and that’s okay.',
    'Let today be soft. Let it be enough.', 'You deserve the same kindness you give to others.', 'Progress can be quiet.',
    'A calm mind begins with a kind thought.', 'You do not have to carry everything at once.', 'Nothing blooms all year. Let yourself have seasons.',
    'Your pace is your own. There is no late.', 'Drink some water, stretch your shoulders, and unclench your jaw.', 'Tiny joys count. Notice one today.',
    'You are more than your hardest days.', 'It’s okay to change your mind, your plans, and your path.', 'Today, choose peace over perfection.',
    'What you feel today will not last forever.', 'You are allowed to take up space.', 'Be the person you needed on a hard day. Start with yourself.',
    'Growth often looks like rest, from the outside.', 'You’ve made it through every hard day so far.', 'Say one kind thing to yourself today, out loud.',
    'Your body is working hard for you. Thank it.', 'Take the pressure off. Just do the next small thing.', 'Courage can be as quiet as getting out of bed.',
    'You are not behind. You are on your own path.', 'Allow yourself to enjoy things, even on imperfect days.', 'Let go of what you can’t control, and hold gently to what you can.',
    'A good day can start at any hour.', 'You are worthy of care, rest and joy.', 'It’s fine to move slowly, as long as you keep being kind to yourself.',
    'Sometimes the bravest thing is to rest.', 'Your story is still being written, and you hold the pen.', 'Choose one thing that would make today a little lighter.',
    'Comparison steals joy. Come back to your own garden.', 'You are allowed to say no without a long explanation.', 'Be patient. Good things grow slowly.',
    'Today’s effort counts, even if nobody sees it.', 'Let your heart be soft and your boundaries clear.', 'You are enough, exactly as you are today.',
    'A little sunlight, a little water, a little time. That is how things grow.', 'Mistakes are proof you’re trying.', 'You can feel two things at once: tired and hopeful.',
    'Trust the slow becoming.', 'Be proud of the small wins no one clapped for.', 'Treat your mind like a garden: gentle, patient, and with room for flowers.',
    'You don’t need to earn your rest.', 'Every morning is a quiet invitation to begin again.', 'There is strength in softness.',
    'Look after yourself the way you look after the people you love.', 'Your calm is worth protecting.', 'It’s okay if today’s goal is simply to get through.',
    'You are allowed to outgrow things that no longer fit.', 'Kind words, to yourself and others, are never wasted.', 'Wherever you are today, you are not alone.',
    'Nothing is wasted: not the rest, not the waiting, not the learning.', 'Let your goals be gentle enough to keep.', 'Start where you are. Use what you have. Do what you can.',
    'One deep breath can change the next hour.', 'You matter, and so do your small joys.'
  ];
  const SPACE_QUOTES = [
    'Even the darkest sky is full of light you can’t see yet.', 'Love is the one thing that travels across time and distance.', 'Every star you see left home long ago, and still found its way to you.',
    'You are made of the same stuff as stars. Shine at your own distance.', 'Time bends for the things we care about most.', 'In the quiet of space, even a small light is seen for miles.',
    'The universe is vast, and you are still a place someone calls home.', 'Orbit slowly. There is no rush to land.', 'Some of the best journeys begin with not knowing the way.',
    'Even a black hole can’t hold back the pull of something good.', 'Hope is a small spacecraft with enormous range.', 'You are a rare and beautiful event in a very big sky.'
  ];
  let quoteShift = 0;
  const dayOfYear = () => { const n = new Date(); return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 86400000); };
  const currentQuote = () => {
    const space = document.body.dataset.skin === 'space';
    const list = space ? SPACE_QUOTES.concat(QUOTES.slice(0, 18)) : QUOTES;
    return list[(dayOfYear() + quoteShift) % list.length];
  };
  function renderQuote() {
    const el = $id('dailyQuoteText'); if (!el) return;
    const q = currentQuote(); el.textContent = q;
    const fav = (state.favourites || []).some(f => f.type === 'Quote' && f.title === q);
    const b = $id('quoteFavBtn'); b.setAttribute('aria-pressed', String(fav)); b.textContent = fav ? '♥ Saved to favourites' : '♡ Save to favourites';
  }
  function setupQuote() {
    $id('quoteFavBtn')?.addEventListener('click', async () => {
      const q = currentQuote(); const i = (state.favourites || []).findIndex(f => f.type === 'Quote' && f.title === q);
      if (i >= 0) state.favourites.splice(i, 1); else state.favourites.push({ id: uid(), title: q, type: 'Quote', note: 'Quote of the day' });
      await saveState(); toast(i >= 0 ? 'Removed from favourites.' : 'Saved to your favourites ♡');
    });
    $id('quoteAnotherBtn')?.addEventListener('click', () => { quoteShift++; renderQuote(); });
  }

  /* =============== THEMES =============== */
  function setupThemes() {
    const sw = document.querySelector('.theme-switch');
    if (!sw) return;
    sw.innerHTML = '<button type="button" class="theme-choice active" id="bloomThemeBtn" aria-pressed="true" title="Bloom floral theme">✿ <span>Bloom</span></button><button type="button" class="theme-choice" id="spaceThemeBtn" aria-pressed="false" title="Space galaxy theme">✦ <span>Space</span></button>';
    const bloom = $id('bloomThemeBtn'), space = $id('spaceThemeBtn');
    const apply = (skin='bloom') => {
      skin = skin === 'space' ? 'space' : 'bloom';
      document.body.dataset.skin = skin;
      document.body.dataset.theme = 'dark';
      bloom.classList.toggle('active', skin === 'bloom'); bloom.setAttribute('aria-pressed', String(skin === 'bloom'));
      space.classList.toggle('active', skin === 'space'); space.setAttribute('aria-pressed', String(skin === 'space'));
      const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = skin === 'space' ? '#050b18' : '#210c19';
      window.applyThemeCursor?.(); renderQuote();
    };
    window.applyMoncySkin = apply;
    space.addEventListener('click', async () => { state.preferences = state.preferences || {}; state.preferences.skin = 'space'; apply('space'); await saveState(); });
    bloom.addEventListener('click', async () => { state.preferences = state.preferences || {}; state.preferences.skin = 'bloom'; apply('bloom'); await saveState(); });
    apply(state.preferences?.skin || 'bloom');
  }

  /* =============== NAVIGATION + VIEWS =============== */
  function injectNav() {
    const nav = $id('nav'); if (!nav) return;
    const add = (view, icon, label, special) => {
      const b = document.createElement('button'); b.className = 'nav-item'; b.type = 'button';
      if (special) b.setAttribute('data-open-sanctuary', ''); else { b.dataset.view = view; b.addEventListener('click', () => switchView(view)); }
      b.innerHTML = `${icon} <span>${label}</span>`; nav.append(b);
    };
    add('relief', '☁', 'Let it out'); add('care', '✿', 'Care guide'); add('week', '▦', 'Her week'); add('skills', '✧', 'Skills to learn');
    add('', '☾', 'Open when you need me', true); add('credits', '♡', 'Built for Moncy');
    // Keep Settings among the final navigation items after dynamically injected sections.
    const settingsButton = nav.querySelector('[data-view="settings"]');
    if (settingsButton) nav.append(settingsButton);
  }
  function injectViews() {
    const footer = document.querySelector('footer'); if (!footer) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = `
<section id="relief" class="view"><div class="page-title"><p class="eyebrow">NOTHING TO FIX HERE</p><h1>Let it out <span>♡</span></h1><p class="lead">Share what's on your heart. Nothing needs fixing here, only a little lightening.</p></div>
 <article class="panel relief">
  <div class="relief-step" id="reliefStep1"><h3 class="relief-h">How are you feeling right now?</h3><div class="mood-options relief-moods" id="reliefMoods" role="group" aria-label="Choose a feeling"></div>
   <label>Want to say more? (optional)<textarea id="reliefText" rows="4" placeholder="Write anything. You can also leave this empty."></textarea></label>
   <p class="small-note">This stays on this page unless you choose to save it. It is not an emergency service or therapy.</p>
   <button class="btn primary" id="reliefGo">Let it out</button></div>
  <div class="relief-step hidden" id="reliefStep2" aria-live="polite"><div id="reliefHeard"></div><div class="relief-actions"><button class="btn primary" id="reliefLighter">Help me feel a little lighter</button><button class="btn soft" id="reliefBack1">Start again</button></div></div>
  <div class="relief-step hidden" id="reliefStep3"><div class="relief-orb-wrap"><div class="relief-orb" id="reliefOrb" aria-hidden="true"></div></div><p class="relief-cue" id="reliefCue" aria-live="polite">Ready when you are</p><p class="small-note">Breathe in gently for four and out slowly for six. Don't force it, and stop whenever you like.</p>
   <div class="relief-float" id="reliefFloat" aria-live="polite"></div>
   <div class="relief-actions"><button class="btn primary" id="reliefBreath">Start breathing</button><button class="btn soft" id="reliefRelease">Let my words float away</button><button class="btn soft" id="reliefSave">Save to my comfort notes</button><button class="btn soft" id="reliefDone">I'm done</button></div></div>
  <div class="relief-step hidden" id="reliefCrisis" role="alert"><h3 class="relief-h">I'm really glad you told me.</h3><p>What you're feeling sounds very heavy, and you deserve real support from a real person, right now. You don't have to go through this alone.</p>
   <div class="crisis-card"><strong>Tele-MANAS (India)</strong><span>Free, 24×7 mental health support</span><a class="btn primary" href="tel:14416">Call 14416</a><a class="btn soft" href="tel:18008914416">Call 1-800-891-4416</a><strong>In an emergency</strong><a class="btn soft" href="tel:112">Call 112</a></div>
   <p>If you can, tell someone near you: a family member or a close friend. Ask them to stay with you.</p><div class="relief-actions"><button class="btn soft" id="reliefCrisisBack">Back</button></div></div>
 </article></section>

<section id="care" class="view"><div class="page-title"><p class="eyebrow">CARE THAT FOLLOWS YOUR BODY</p><h1>Women's care guide <span>✿</span></h1><p class="lead">Gentle, everyday care that changes with your cycle.</p></div>
 <article class="panel"><div class="care-now" id="careNow"></div><div class="phase-tabs" id="phaseTabs" role="tablist" aria-label="Cycle phases"></div><div class="phase-detail" id="phaseDetail" role="tabpanel"></div></article>
 <article class="panel"><div class="panel-head"><div><p class="eyebrow">EVERYDAY CARE</p><h3>Looking after your body</h3></div><span class="flower-stamp">♡</span></div><div id="careEveryday" class="care-details"></div></article>
 <article class="panel"><div class="panel-head"><div><p class="eyebrow">WHEN TO SEE A DOCTOR</p><h3>Listen to your body</h3></div></div><ul class="care-list" id="careDoctor"></ul><p class="small-note">This guide is general information, not medical advice or a diagnosis. Cycles vary from person to person; if something worries you, speak to a doctor.</p></article></section>

<section id="week" class="view"><div class="page-title"><p class="eyebrow">A KIND LOOK BACK</p><h1>Her week <span>▦</span></h1><p class="lead">The last seven days, gently summarised from what you've logged.</p></div><div id="weekBody"></div></section>

<section id="skills" class="view"><div class="page-title"><p class="eyebrow">LEARN AT YOUR OWN PACE</p><h1>Skills to learn <span>✧</span></h1><p class="lead">Pick what interests you. Remove anything that doesn't. No pressure, no streaks.</p></div>
 <article class="panel"><div class="skill-cats" id="skillCats" role="group" aria-label="Skill categories"></div><div id="skillNote" class="prediction-box hidden"></div><div id="skillList" class="skill-grid"></div>
 </article>
 <article class="panel"><div class="panel-head"><div><p class="eyebrow">YOUR OWN</p><h3>Add a skill of your own</h3></div></div><div class="form-grid"><label>Skill name<input id="skillName" placeholder="e.g. Mehndi designs"></label><label>Category<select id="skillCat"><option value="creative">Creative</option><option value="practical">Practical</option><option value="career">Career</option><option value="wellness">Wellness</option><option value="hobbies">Music and hobbies</option></select></label><label>Minutes a day<input id="skillMins" type="number" min="5" max="120" value="15"></label></div><button class="btn primary" id="skillAdd">Add skill</button></article></section>

<section id="credits" class="view"><div class="page-title"><p class="eyebrow">MADE WITH CARE</p><h1>Built for Moncy <span>♡</span></h1><p class="lead">Built by Shashanth Reddy.</p></div>
 <article class="panel"><div class="panel-head"><div><p class="eyebrow">VERSION HISTORY</p><h3>How this space has grown</h3></div></div><ol class="versions" id="versionList"></ol></article>
 <article class="panel"><div class="panel-head"><div><p class="eyebrow">REQUEST A FEATURE</p><h3>What would make this space better for you?</h3></div></div>
  <div class="mood-options req-cats" id="reqCats" role="group" aria-label="Request type"><button data-reqcat="New feature" class="selected">New feature</button><button data-reqcat="Something's broken">Something's broken</button><button data-reqcat="Just an idea">Just an idea</button></div>
  <label>Your request<textarea id="reqText" rows="4" placeholder="Type your idea here…"></textarea></label><button class="btn primary" id="reqSend">Send request</button><div class="entry-list" id="reqList"></div></article></section>`;
    footer.before(tpl.content);
  }
  function wrapSwitchView() {
    const orig = window.switchView; if (typeof orig !== 'function') return;
    window.switchView = function (id) {
      orig.apply(this, arguments);
      try { if (id === 'week') renderWeek(); if (id === 'care') renderCare(); if (id === 'skills') renderSkills(); if (id === 'credits') { renderRequests(); pullStatuses(); } } catch (e) { console.error(e); }
    };
  }

  /* =============== PROFILE PHOTO =============== */
  const photoUI = { img: null, ox: 0, oy: 0, zoom: 1, base: 1, drag: null };
  function renderAvatar() {
    const p = state.profile?.photo || '';
    document.querySelectorAll('.avatar,.home-avatar').forEach(el => {
      if (p) { el.style.backgroundImage = `url("${p}")`; el.textContent = ''; el.classList.add('has-photo'); }
      else { el.style.backgroundImage = ''; el.textContent = 'M'; el.classList.remove('has-photo'); }
    });
  }
  function setupProfile() {
    const dlg = document.createElement('dialog'); dlg.id = 'photoDialog'; dlg.setAttribute('aria-labelledby', 'pdTitle');
    dlg.innerHTML = `<div class="pd"><h2 id="pdTitle">Change photo</h2><canvas id="pdCanvas" width="256" height="256" aria-label="Photo preview, drag to move"></canvas>
<label class="pd-zoom">Zoom<input type="range" id="pdZoom" min="1" max="3" step="0.01" value="1"></label><p class="muted pd-hint" id="pdHint">Choose a photo, then drag it to move it.</p>
<div class="pd-actions"><label class="btn soft small file-btn">Choose from gallery<input type="file" id="pdFile" accept="image/*" hidden></label><label class="btn soft small file-btn">Take photo<input type="file" id="pdCam" accept="image/*" capture="user" hidden></label></div>
<div class="pd-actions"><button type="button" class="btn primary small" id="pdSave">Save</button><button type="button" class="btn soft small" id="pdRemove">Remove photo</button><button type="button" class="btn soft small" id="pdCancel">Cancel</button></div></div>`;
    document.body.append(dlg);
    const cv = $id('pdCanvas'), ctx = cv.getContext('2d'), zoom = $id('pdZoom');
    const draw = () => {
      ctx.fillStyle = '#e9d9d6'; ctx.fillRect(0, 0, 256, 256);
      const im = photoUI.img; if (!im) { ctx.fillStyle = '#997d82'; ctx.font = '600 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('No photo chosen', 128, 132); return; }
      const sc = photoUI.base * photoUI.zoom, w = im.width * sc, hh = im.height * sc;
      photoUI.ox = Math.min(0, Math.max(256 - w, photoUI.ox)); photoUI.oy = Math.min(0, Math.max(256 - hh, photoUI.oy));
      ctx.drawImage(im, photoUI.ox, photoUI.oy, w, hh);
    };
    const load = file => {
      if (!file) return; if (!/^image\//.test(file.type)) { toast('Please choose an image file.'); return; }
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); photoUI.img = im; photoUI.base = Math.max(256 / im.width, 256 / im.height); photoUI.zoom = 1; zoom.value = '1'; photoUI.ox = (256 - im.width * photoUI.base) / 2; photoUI.oy = (256 - im.height * photoUI.base) / 2; $id('pdHint').textContent = 'Drag to move, use the slider to zoom.'; draw(); };
      im.onerror = () => { URL.revokeObjectURL(url); toast('That photo could not be opened.'); };
      im.src = url;
    };
    $id('pdFile').addEventListener('change', e => { load(e.target.files[0]); e.target.value = ''; });
    $id('pdCam').addEventListener('change', e => { load(e.target.files[0]); e.target.value = ''; });
    zoom.addEventListener('input', () => {
      if (!photoUI.img) return; const old = photoUI.base * photoUI.zoom; photoUI.zoom = Number(zoom.value); const nw = photoUI.base * photoUI.zoom, k = nw / old;
      photoUI.ox = 128 - (128 - photoUI.ox) * k; photoUI.oy = 128 - (128 - photoUI.oy) * k; draw();
    });
    cv.addEventListener('pointerdown', e => { if (!photoUI.img) return; cv.setPointerCapture(e.pointerId); photoUI.drag = { x: e.clientX, y: e.clientY, ox: photoUI.ox, oy: photoUI.oy }; });
    cv.addEventListener('pointermove', e => { const d = photoUI.drag; if (!d) return; const r = cv.getBoundingClientRect(), k = 256 / r.width; photoUI.ox = d.ox + (e.clientX - d.x) * k; photoUI.oy = d.oy + (e.clientY - d.y) * k; draw(); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { photoUI.drag = null; }));
    cv.addEventListener('keydown', e => { const step = 12; if (!photoUI.img) return; if (e.key === 'ArrowLeft') photoUI.ox += step; else if (e.key === 'ArrowRight') photoUI.ox -= step; else if (e.key === 'ArrowUp') photoUI.oy += step; else if (e.key === 'ArrowDown') photoUI.oy -= step; else return; e.preventDefault(); draw(); });
    cv.tabIndex = 0;
    const openDlg = () => { photoUI.img = null; draw(); $id('pdHint').textContent = 'Choose a photo, then drag it to move it.'; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };
    $id('avatarBtn')?.addEventListener('click', openDlg); $id('homeAvatar')?.addEventListener('click', openDlg);
    $id('pdCancel').addEventListener('click', () => dlg.close());
    $id('pdSave').addEventListener('click', async () => {
      if (!photoUI.img) { toast('Choose a photo first, or use Cancel.'); return; }
      state.profile = state.profile || {}; state.profile.photo = cv.toDataURL('image/jpeg', .82); await saveState(); dlg.close(); toast('Your photo is updated ♡');
    });
    $id('pdRemove').addEventListener('click', async () => { state.profile = state.profile || {}; state.profile.photo = ''; await saveState(); dlg.close(); toast('Photo removed.'); });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* =============== LET IT OUT (relief) =============== */
  const RELIEF = {
    Sad: ['That sounds really painful, and it makes sense that it hurts.', 'You don’t have to explain or fix it. It’s enough that it’s here and you noticed.', 'Thank you for letting it out instead of carrying it silently.'],
    Anxious: ['That sounds exhausting, to have your mind racing like that.', 'Your body is trying to keep you safe. It isn’t your fault that it’s working overtime.', 'You’re here now. You’re safe in this moment.'],
    Overwhelmed: ['That’s a lot to hold at once. Of course it feels heavy.', 'You don’t have to carry all of it right now. Not everything has to be done at once.', 'Feeling overwhelmed means you’re doing a lot, not that you’re failing.'],
    Angry: ['It makes sense to feel angry. Something mattered, and it wasn’t respected.', 'You’re allowed to feel this without acting on it.', 'Thank you for putting it somewhere safe.'],
    Lonely: ['That ache of loneliness is real, and it’s very human.', 'Feeling lonely doesn’t mean you’re unlovable. It means you want connection, and that’s a good thing.', 'You’re not wrong to need people. You’re heard here.'],
    Tired: ['You sound really worn out. That kind of tiredness deserves to be taken seriously.', 'You don’t have to push through right now. Rest is allowed.', 'Being tired doesn’t make you weak.'],
    Low: ['I’m sorry you’re feeling so low. That’s a heavy place to be.', 'You don’t have to feel better on a schedule. Low days happen.', 'You showed up and said it out loud, and that matters.'],
    'Something else': ['Even when it has no name, it still counts.', 'You don’t have to find the right words for it.', 'Thank you for trusting this space with it.']
  };
  const CRISIS = /(kill myself|killing myself|suicid|end my life|take my life|want to die|wanna die|don'?t want to (live|be here)|no reason to live|better off dead|end it all|hurt myself|harm myself|self[- ]?harm|cut myself|cutting myself)/i;
  let rTimer = null, rOn = false, rMood = '', rText = '';
  function setupRelief() {
    const moods = $id('reliefMoods'); if (!moods) return;
    const icons = { Sad: '🌧️', Anxious: '☁️', Overwhelmed: '🌷', Angry: '🔥', Lonely: '🌙', Tired: '🫧', Low: '🍂', 'Something else': '✨' };
    Object.keys(RELIEF).forEach(m => { const b = document.createElement('button'); b.type = 'button'; b.dataset.rmood = m; b.innerHTML = `${icons[m]}<span>${m}</span>`; b.setAttribute('aria-pressed', 'false'); moods.append(b); });
    const step = n => { ['reliefStep1', 'reliefStep2', 'reliefStep3', 'reliefCrisis'].forEach(id => $id(id).classList.toggle('hidden', id !== n)); if (n !== 'reliefStep3') stopR(); };
    moods.addEventListener('click', e => { const b = e.target.closest('button[data-rmood]'); if (!b) return; rMood = b.dataset.rmood; moods.querySelectorAll('button').forEach(x => { const on = x === b; x.classList.toggle('selected', on); x.setAttribute('aria-pressed', String(on)); }); });
    const reset = () => { rMood = ''; rText = ''; $id('reliefText').value = ''; moods.querySelectorAll('button').forEach(x => { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); }); $id('reliefFloat').textContent = ''; step('reliefStep1'); };
    $id('reliefGo').addEventListener('click', () => {
      const text = $id('reliefText').value.trim();
      if (!rMood && !text) { toast('Choose how you feel, or write a few words.'); return; }
      rText = text;
      if (CRISIS.test(text)) { step('reliefCrisis'); return; }
      const lines = RELIEF[rMood] || RELIEF['Something else']; const out = [];
      if (text) { const sn = (text.split(/(?<=[.!?])\s/)[0] || text).slice(0, 140); out.push(`You wrote: “${sn}${sn.length < text.length ? '…' : ''}”`); }
      out.push(...lines);
      $id('reliefHeard').innerHTML = out.map((l, i) => `<p class="relief-line" style="animation-delay:${i * (RM() ? 0 : 1.1)}s">${esc(l)}</p>`).join('');
      step('reliefStep2'); $id('reliefHeard').firstElementChild?.setAttribute('tabindex', '-1');
    });
    $id('reliefBack1').addEventListener('click', reset);
    $id('reliefCrisisBack').addEventListener('click', reset);
    $id('reliefLighter').addEventListener('click', () => { $id('reliefFloat').textContent = ''; $id('reliefCue').textContent = 'Ready when you are'; $id('reliefBreath').textContent = 'Start breathing'; step('reliefStep3'); });
    $id('reliefBreath').addEventListener('click', () => { if (rOn) pauseR(); else startR(); });
    $id('reliefRelease').addEventListener('click', () => {
      const f = $id('reliefFloat'); f.textContent = ''; const t = rText || '';
      if (!t) { f.innerHTML = '<p class="relief-line">There’s nothing to release. You can simply rest.</p>'; return; }
      const s = document.createElement('p'); s.className = 'relief-away'; s.textContent = t; f.append(s);
      setTimeout(() => { f.innerHTML = '<p class="relief-line">Let go. You’re safe to put it down for now.</p>'; rText = ''; }, RM() ? 300 : 5200);
    });
    $id('reliefSave').addEventListener('click', async () => {
      const t = rText || ''; if (!t) { toast('There’s no text to save. That’s okay.'); return; }
      state.comfortNotes.push({ id: uid(), text: `[${rMood || 'Let it out'}] ${t}`, date: today() }); await saveState(); toast('Saved to your shared comfort notes.');
    });
    $id('reliefDone').addEventListener('click', () => { reset(); toast('Be gentle with yourself today ♡'); });
  }
  function startR() {
    const orb = $id('reliefOrb'), cue = $id('reliefCue'), b = $id('reliefBreath'); rOn = true; b.textContent = 'Pause';
    const cycle = () => {
      if (!rOn) return;
      orb.style.transition = 'transform 4s ease-in-out, opacity 4s ease-in-out'; orb.classList.add('in'); orb.style.transform = ''; cue.textContent = 'Breathe in gently…';
      rTimer = setTimeout(() => { if (!rOn) return; orb.style.transition = 'transform 6s ease-in-out, opacity 6s ease-in-out'; orb.classList.remove('in'); cue.textContent = 'And out, slowly…'; rTimer = setTimeout(cycle, 6000); }, 4000);
    };
    orb.style.transition = ''; orb.style.transform = ''; cycle();
  }
  function pauseR() { const orb = $id('reliefOrb'); rOn = false; clearTimeout(rTimer); const t = getComputedStyle(orb).transform; orb.style.transition = 'none'; orb.style.transform = t; $id('reliefCue').textContent = 'Paused. Resume whenever you like.'; $id('reliefBreath').textContent = 'Resume'; }
  function stopR() { rOn = false; clearTimeout(rTimer); const orb = $id('reliefOrb'); if (orb) { orb.classList.remove('in'); orb.style.transition = ''; orb.style.transform = ''; } }

  /* =============== WOMEN'S CARE GUIDE =============== */
  const PHASES = {
    menstrual: { name: 'Period (menstrual phase)', days: 'The days you bleed', feel: 'Energy is often lower. Cramps, tiredness and a low mood are common.', eat: 'Iron-rich foods like ragi, spinach (palak), lentils, chickpeas, dates, beetroot and sesame, with something sour such as lemon or amla to help absorption. Warm, easy-to-digest meals and plenty of water.', move: 'Gentle walking, stretching or restorative yoga. Rest if you need to; there’s no prize for pushing.', rest: 'Extra sleep helps. A warm water bottle on your lower belly can ease cramps for many people.', mind: 'Lower your expectations a little. Feeling quieter than usual is common.' },
    follicular: { name: 'After your period (follicular phase)', days: 'From when bleeding ends until just before ovulation', feel: 'Many people feel their energy and mood lift gradually.', eat: 'Fresh fruit and vegetables, whole grains, protein (dal, paneer, eggs, curd) and healthy fats like nuts and seeds. Keep iron foods going if your period was heavy.', move: 'A good time to try something new: brisk walks, dance, cycling or strength work.', rest: 'Keep your regular sleep rhythm. You may need less rest than last week.', mind: 'A nice window for learning, planning and starting small projects.' },
    ovulation: { name: 'Mid-cycle (ovulation window)', days: 'Around the middle of your cycle', feel: 'Energy and confidence are often at their highest. Some people notice mild one-sided pain, or clearer discharge.', eat: 'Water-rich foods, leafy greens, fibre and protein. Stay hydrated.', move: 'Enjoy higher-energy movement if it feels good, and warm up well.', rest: 'Sleep can be lighter for some; keep a calming bedtime routine.', mind: 'Social energy is often higher. Enjoy it, and still protect your quiet time.' },
    luteal: { name: 'Before your period (luteal phase)', days: 'The days after ovulation, until your next period', feel: 'PMS is common here: mood swings, bloating, cravings, breast tenderness, tiredness, and feeling more sensitive or irritable.', eat: 'Steady meals without long gaps. Foods with magnesium and fibre (nuts, seeds, bananas, oats, leafy greens) may help some people. Go easy on very salty food, and limit caffeine if it makes you anxious or bloated.', move: 'Walking, yoga, stretching or light strength work. Gentler movement can help with mood and bloating.', rest: 'Aim for earlier bedtimes; sleep can be harder in this phase.', mind: 'Mood dips before a period are very common and usually ease once it starts. Be kinder to yourself, avoid big arguments when you can, and use Let it out or the Open When You Need Me space.' }
  };
  const EVERYDAY = [
    ['Iron and blood health', 'Periods use up iron. Include dal, ragi, green leafy vegetables, chickpeas, jaggery in moderation, dates, pomegranate and beetroot. A source of vitamin C (lemon, amla, orange) with meals helps iron absorption, and tea or coffee right with meals can reduce it. Feeling constantly tired, dizzy or very pale is worth a blood test.'],
    ['Water and food', 'Sip water through the day, and eat regular meals. Skipping meals can make tiredness and mood swings worse.'],
    ['Sleep', 'Aim for consistent sleep and wake times. Screens off a little before bed helps many people.'],
    ['Movement', 'Gentle, regular movement helps cramps, mood and sleep. Any walk counts.'],
    ['Stress and mood', 'Stress can change your cycle. Small daily rituals (a walk, music, journaling, Let it out) help. Talk to someone you trust when things feel heavy.'],
    ['Hygiene and comfort', 'Change pads every 4–6 hours, or tampons/menstrual cups as directed on the pack, and wash hands before and after. Wear breathable cotton underwear and avoid scented products in the intimate area.'],
    ['Regular check-ups', 'See a doctor for routine health checks, any vaccines you’re due for, and questions about your periods. You never need a “big enough reason” to ask.']
  ];
  const COMFORT = ['A warm water bottle or warm bath on your lower belly or back', 'Gentle stretches: child’s pose, cat-cow, knees-to-chest', 'Warm drinks such as ginger or chamomile tea if you like them', 'A short walk, even ten minutes', 'Regular meals and plenty of water', 'If you use pain relief, follow the label or your doctor’s advice'];
  const DOCTOR = ['Bleeding that soaks through a pad or tampon every hour for two or more hours in a row', 'Periods lasting longer than 7 days', 'Pain so strong it stops you from daily life, or that painkillers don’t help', 'Cycles regularly shorter than 21 days or longer than 35 days', 'Periods that stop for 3 months or more (when you’re not pregnant)', 'Bleeding between periods or after sex', 'Feeling faint, very breathless or extremely tired', 'Mood changes before your period that seriously affect school, work or relationships (this can be treated)', 'Any symptom that worries you, even if it’s not on this list'];
  let careSel = null;
  function phaseFor(day, cycle, plen) { const ov = cycle - 14; if (day <= plen) return 'menstrual'; if (day >= ov - 1 && day <= ov + 1) return 'ovulation'; if (day < ov - 1) return 'follicular'; return 'luteal'; }
  function renderCare() {
    const now = $id('careNow'); if (!now) return;
    const st = periodStats(); let cur = null;
    if (st.cycleDay) cur = phaseFor(st.cycleDay, st.cycle, Number(st.latest?.length) || 5);
    now.innerHTML = cur ? `<div class="care-banner"><strong>Cycle day ${st.cycleDay}</strong><span>You may be in your <em>${esc(PHASES[cur].name.toLowerCase())}</em>. This is an estimate based on the dates you logged.${st.cycleDay > st.cycle ? ' Your next period may be due soon, or a little late. Cycles naturally vary.' : ''}</span></div>` : `<div class="care-banner"><strong>Log a period start date</strong><span>Add one in Health &amp; wellness and this guide will show where you may be in your cycle. Until then, explore every phase below.</span><button class="btn soft small" data-goto-health>Open period tracker</button></div>`;
    now.querySelector('[data-goto-health]')?.addEventListener('click', () => { switchView('health'); switchHealthTab('period'); });
    careSel = careSel || cur || 'menstrual';
    const tabs = $id('phaseTabs'); tabs.innerHTML = Object.keys(PHASES).map(k => `<button type="button" role="tab" class="tab${k === careSel ? ' active' : ''}" data-phase="${k}" aria-selected="${k === careSel}">${esc(PHASES[k].name.split(' (')[0])}${k === cur ? ' · now' : ''}</button>`).join('');
    const p = PHASES[careSel];
    $id('phaseDetail').innerHTML = `<h3>${esc(p.name)}</h3><p class="muted">${esc(p.days)}</p><dl class="phase-dl"><dt>What you might feel</dt><dd>${esc(p.feel)}</dd><dt>Eating</dt><dd>${esc(p.eat)}</dd><dt>Moving</dt><dd>${esc(p.move)}</dd><dt>Resting</dt><dd>${esc(p.rest)}</dd><dt>Mind and mood</dt><dd>${esc(p.mind)}</dd></dl>`;
    $id('careEveryday').innerHTML = EVERYDAY.map(([t, b]) => `<details><summary>${esc(t)}</summary><p>${esc(b)}</p></details>`).join('') + `<details><summary>Cramp and PMS comfort ideas</summary><ul class="care-list">${COMFORT.map(c => `<li>${esc(c)}</li>`).join('')}</ul></details>`;
    $id('careDoctor').innerHTML = DOCTOR.map(c => `<li>${esc(c)}</li>`).join('');
  }
  function setupCare() { $id('phaseTabs')?.addEventListener('click', e => { const b = e.target.closest('[data-phase]'); if (!b) return; careSel = b.dataset.phase; renderCare(); $id('phaseTabs').querySelector('.active')?.focus(); }); }

  /* =============== WEEKLY ANALYSIS =============== */
  const MOODSCORE = { Lovely: 5, Okay: 4, Tired: 3, Overwhelmed: 2, Low: 1 };
  const MOODLABEL = { 5: 'Lovely', 4: 'Okay', 3: 'Tired', 2: 'Overwhelmed', 1: 'A little low' };
  function weekData() {
    const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(today(), -i));
    const goal = Number(state.water?.goal || 2000);
    const per = days.map(d => {
      const c = (state.checkins || []).find(x => x.date === d);
      const water = (state.water?.logs || []).filter(x => x.date === d).reduce((n, x) => n + x.ml, 0);
      const meds = state.medications || []; const taken = meds.filter(m => (m.logs || []).some(l => l.date === d)).length;
      return { d, mood: c ? MOODSCORE[c.mood] || 0 : 0, moodName: c?.mood || '', sleep: c && c.sleep !== '' && c.sleep != null ? Number(c.sleep) : null, water, taken, meds: meds.length, journal: (state.journal || []).filter(x => x.date === d).length, garden: (state.garden || []).filter(x => x.date === d).length, practice: Object.values(state.skills?.practice || {}).filter(a => a.includes(d)).length };
    });
    return { days, per, goal };
  }
  function renderWeek() {
    const body = $id('weekBody'); if (!body) return; const { per, goal } = weekData();
    const checked = per.filter(x => x.mood); const avgMood = checked.length ? checked.reduce((n, x) => n + x.mood, 0) / checked.length : 0;
    const sleeps = per.filter(x => x.sleep != null && x.sleep > 0), avgSleep = sleeps.length ? sleeps.reduce((n, x) => n + x.sleep, 0) / sleeps.length : null;
    const waterDays = per.filter(x => x.water > 0), avgWater = per.reduce((n, x) => n + x.water, 0) / 7;
    const bestWater = per.slice().sort((a, b) => b.water - a.water)[0];
    const lowMood = checked.slice().sort((a, b) => a.mood - b.mood)[0];
    const medTotal = per.reduce((n, x) => n + x.meds, 0), medTaken = per.reduce((n, x) => n + x.taken, 0);
    const journal = per.reduce((n, x) => n + x.journal, 0), garden = per.reduce((n, x) => n + x.garden, 0), practiced = per.filter(x => x.practice > 0).length;
    const lines = [];
    if (!checked.length) lines.push('No check-ins this week yet. A quick daily check-in makes this page more helpful.');
    else if (avgMood >= 4) lines.push('Most of your check-ins this week felt good. Lovely to see.');
    else if (avgMood >= 3) lines.push('A mixed, ordinary kind of week, with a bit of everything.');
    else lines.push('This week seems to have felt heavy. Be extra gentle with yourself.');
    if (bestWater.water > 0) lines.push(`You drank the most water on ${weekdayShort(bestWater.d)} (${bestWater.water.toLocaleString()} ml).`);
    if (avgSleep != null) lines.push(`Your logged sleep averaged ${avgSleep.toFixed(1)} hours.`);
    if (journal) lines.push(`You wrote ${journal} journal entr${journal === 1 ? 'y' : 'ies'}.`);
    if (garden) lines.push(`You nurtured your garden ${garden} time${garden === 1 ? '' : 's'}.`);
    if (practiced) lines.push(`You practised a skill on ${practiced} day${practiced === 1 ? '' : 's'}.`);
    let next = 'Keep doing what feels good, and perhaps choose one small skill to explore.';
    if (avgSleep != null && avgSleep < 6.5) next = 'Try an earlier wind-down on one night next week. Your logged sleep was a little low.';
    else if (waterDays.length && avgWater < goal * .6) next = 'Keep a glass of water near you. A few extra sips a day add up.';
    else if (checked.length && avgMood < 3) next = 'Try Let it out, or step into Open When You Need Me. Reaching out to someone you trust can help too.';
    else if (!journal) next = 'A single line in your journal on one evening could be a nice start.';
    const moodBars = per.map(x => `<div class="wk-col"><div class="wk-bar" role="img" aria-label="${weekdayShort(x.d)}: ${x.mood ? MOODLABEL[x.mood] : 'no check-in'}"><span class="${x.mood ? 'm' + x.mood : 'none'}" style="height:${x.mood ? x.mood * 20 : 6}%"></span></div><small>${weekdayShort(x.d).slice(0, 3)}</small></div>`).join('');
    const waterBars = per.map(x => { const pct = Math.min(100, Math.round(x.water / goal * 100)); return `<div class="wk-col"><div class="wk-bar" role="img" aria-label="${weekdayShort(x.d)}: ${x.water} ml, ${pct}% of goal"><span class="w" style="height:${Math.max(pct, 4)}%"></span></div><small>${weekdayShort(x.d).slice(0, 3)}</small></div>`; }).join('');
    body.innerHTML = `<article class="panel"><div class="panel-head"><div><p class="eyebrow">THE SHORT VERSION</p><h3>How your week went</h3></div><span class="flower-stamp">♡</span></div><ul class="wk-summary">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul></article>
<div class="wk-grid"><article class="panel"><p class="eyebrow">MOOD</p><div class="wk-chart">${moodBars}</div><p class="small-note">Taller means a lighter mood that day. Gaps mean no check-in.</p></article>
<article class="panel"><p class="eyebrow">WATER (GOAL ${goal.toLocaleString()} ML)</p><div class="wk-chart">${waterBars}</div><p class="small-note">Average ${Math.round(avgWater).toLocaleString()} ml a day.</p></article></div>
<div class="home-health-grid wk-stats"><article class="home-stat"><p class="eyebrow">CHECK-INS</p><strong>${checked.length} / 7</strong><span>days you checked in</span></article><article class="home-stat"><p class="eyebrow">SLEEP</p><strong>${avgSleep != null ? avgSleep.toFixed(1) + ' h' : '—'}</strong><span>average logged</span></article><article class="home-stat"><p class="eyebrow">MEDICATION LOG</p><strong>${medTotal ? Math.round(medTaken / medTotal * 100) + '%' : '—'}</strong><span>${medTotal ? 'doses logged' : 'none scheduled'}</span></article><article class="home-stat"><p class="eyebrow">JOURNAL</p><strong>${journal}</strong><span>${journal === 1 ? 'entry' : 'entries'}</span></article><article class="home-stat"><p class="eyebrow">GARDEN</p><strong>${garden}</strong><span>moments nurtured</span></article><article class="home-stat"><p class="eyebrow">SKILLS</p><strong>${practiced}</strong><span>days practised</span></article></div>
<article class="panel"><p class="eyebrow">A GENTLE IDEA FOR NEXT WEEK</p><h3>${esc(next)}</h3>${lowMood && avgMood && lowMood.mood <= 2 ? `<p class="muted">${weekdayShort(lowMood.d)} looked like the hardest day. It’s okay to have days like that.</p>` : ''}<p class="small-note">This summary only uses what you’ve logged. It’s a mirror, not a measure, and not medical advice.</p></article>`;
  }

  /* =============== SKILLS =============== */
  const SKILLS = [
    ['photo', 'creative', 'Phone photography', 10, 'Easy', 'Take 3 photos today using natural light'], ['draw', 'creative', 'Drawing and sketching', 15, 'Easy', 'Sketch one object near you for 10 minutes'],
    ['write', 'creative', 'Creative writing', 10, 'Easy', 'Write five sentences about your day'], ['callig', 'creative', 'Calligraphy and hand lettering', 15, 'Medium', 'Practise writing your name in three styles'],
    ['video', 'creative', 'Video editing for reels', 20, 'Medium', 'Trim and join two short clips'],
    ['cook', 'practical', 'Cooking simple healthy meals', 30, 'Easy', 'Pick one easy recipe to make this week'], ['budget', 'practical', 'Budgeting and saving', 10, 'Easy', 'Write down what you spent today'],
    ['lang', 'practical', 'Learning a new language', 10, 'Medium', 'Learn five everyday words'], ['firstaid', 'practical', 'Basic first aid', 15, 'Easy', 'Learn how to treat a small cut or burn'],
    ['time', 'practical', 'Time management and planning', 10, 'Easy', 'Plan tomorrow’s top three tasks tonight'],
    ['comm', 'career', 'Communication and public speaking', 10, 'Medium', 'Say one idea out loud for one minute'], ['excel', 'career', 'Excel and Google Sheets', 20, 'Medium', 'Make a simple table with a SUM formula'],
    ['canva', 'career', 'Canva and basic design', 15, 'Easy', 'Design one simple poster'], ['typing', 'career', 'Typing and productivity tools', 10, 'Easy', 'Do a 5-minute typing practice'],
    ['code', 'career', 'Basic coding', 20, 'Medium', 'Write your first small web page'],
    ['yoga', 'wellness', 'Yoga for beginners', 15, 'Easy', 'Try a 10-minute gentle flow'], ['meditate', 'wellness', 'Meditation and breathing', 5, 'Easy', 'Sit quietly for three minutes'],
    ['sleep', 'wellness', 'Healthy sleep habits', 10, 'Easy', 'Set a regular bedtime for this week'], ['stretch', 'wellness', 'Stretching and gentle workouts', 10, 'Easy', 'Stretch your neck and shoulders for 5 minutes'],
    ['mindful', 'wellness', 'Mindful eating', 10, 'Easy', 'Eat one meal slowly without a screen'],
    ['sing', 'hobbies', 'Singing', 10, 'Easy', 'Sing one favourite song all the way through'], ['instr', 'hobbies', 'Learning an instrument', 15, 'Medium', 'Learn the notes of one simple tune'],
    ['dance', 'hobbies', 'Dance', 15, 'Easy', 'Learn the first 8 counts of a routine'], ['garden', 'hobbies', 'Gardening and plants', 10, 'Easy', 'Water and look after one plant'],
    ['read', 'hobbies', 'Reading habit', 10, 'Easy', 'Read five pages of any book']
  ].map(([id, cat, name, mins, level, step]) => ({ id, cat, name, mins, level, step }));
  const CATNAMES = { all: 'All', creative: 'Creative', practical: 'Practical', career: 'Career', wellness: 'Wellness', hobbies: 'Music and hobbies' };
  let skillFilter = 'all', undoTimer = null;
  const allSkills = () => SKILLS.concat((state.skills.custom || []).map(c => ({ ...c, level: 'Your own', step: c.step || 'Start with five minutes today', custom: true })));
  function lowEnergyToday() { const c = (state.checkins || []).find(x => x.date === today()); return !!c && (['Tired', 'Overwhelmed', 'Low'].includes(c.mood) || c.energy === 'Low'); }
  function renderSkills() {
    const list = $id('skillList'); if (!list) return; ensure();
    const S = state.skills; const low = lowEnergyToday();
    $id('skillCats').innerHTML = Object.keys(CATNAMES).map(k => `<button type="button" class="tab${k === skillFilter ? ' active' : ''}" data-skcat="${k}" aria-pressed="${k === skillFilter}">${CATNAMES[k]}</button>`).join('');
    const note = $id('skillNote'); note.classList.toggle('hidden', !low); note.textContent = low ? 'Low energy today? Lighter, easier skills are shown first. Nothing is required.' : '';
    let items = allSkills().filter(s => !S.removed.includes(s.id) && (skillFilter === 'all' || s.cat === skillFilter));
    const rank = s => (low ? (s.level === 'Easy' ? 0 : s.level === 'Your own' ? 1 : 2) : 0) + (S.status[s.id] === 'learning' ? -5 : 0);
    items = items.map((s, i) => [s, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
    list.innerHTML = items.map(s => {
      const st = S.status[s.id] || '', days = (S.practice[s.id] || []).length, doneToday = (S.practice[s.id] || []).includes(today());
      const q = encodeURIComponent(s.name + ' for beginners');
      return `<article class="skill-card" data-skill="${esc(s.id)}"><div class="skill-top"><strong>${esc(s.name)}</strong><details class="skill-menu"><summary aria-label="More options for ${esc(s.name)}">⋯</summary><div class="skill-menu-box"><button type="button" data-sk="remove">Remove from my list</button></div></details></div>
<p class="muted skill-meta">${s.mins} min a day · ${esc(s.level)} · ${esc(CATNAMES[s.cat] || '')}</p><p class="skill-step">First step: ${esc(s.step)}</p>
<div class="skill-status" role="group" aria-label="Status for ${esc(s.name)}">${[['want', 'Want to learn'], ['learning', 'Learning'], ['done', 'Done']].map(([k, l]) => `<button type="button" data-sk="status" data-val="${k}" aria-pressed="${st === k}" class="${st === k ? 'on' : ''}">${l}</button>`).join('')}</div>
${st === 'learning' ? `<div class="skill-prog"><button type="button" class="mini-btn" data-sk="practice" ${doneToday ? 'disabled' : ''}>${doneToday ? 'Practised today ✓' : 'I practised today'}</button><span class="muted">${days} day${days === 1 ? '' : 's'} practised</span><div class="progress-track"><span style="width:${Math.min(100, Math.round(days / 21 * 100))}%"></span></div></div>` : (days ? `<p class="muted">${days} day${days === 1 ? '' : 's'} practised so far</p>` : '')}
<a class="skill-link" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener noreferrer">Find a free tutorial ↗</a></article>`;
    }).join('') || '<div class="empty-state">No skills match this category. Add your own skill below.</div>';
  }
  function showUndo(msg, fn) {
    let bar = $id('undoBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'undoBar'; bar.className = 'undo-bar'; bar.setAttribute('role', 'status'); document.body.append(bar); }
    bar.innerHTML = `<span>${esc(msg)}</span><button type="button">Undo</button>`; bar.classList.add('show');
    bar.querySelector('button').onclick = () => { fn(); bar.classList.remove('show'); clearTimeout(undoTimer); };
    clearTimeout(undoTimer); undoTimer = setTimeout(() => bar.classList.remove('show'), 7000);
  }
  function setupSkills() {
    $id('skillCats')?.addEventListener('click', e => { const b = e.target.closest('[data-skcat]'); if (!b) return; skillFilter = b.dataset.skcat; renderSkills(); });
    $id('skillList')?.addEventListener('click', async e => {
      const b = e.target.closest('[data-sk]'); if (!b) return; const card = b.closest('.skill-card'), id = card.dataset.skill, S = state.skills, sk = allSkills().find(x => x.id === id); if (!sk) return;
      const act = b.dataset.sk;
      if (act === 'status') { S.status[id] = S.status[id] === b.dataset.val ? '' : b.dataset.val; await saveState(); }
      else if (act === 'practice') { S.practice[id] = S.practice[id] || []; if (!S.practice[id].includes(today())) S.practice[id].push(today()); await saveState(); toast('Nice. Small practice adds up ♡'); }
      else if (act === 'remove') { S.removed.push(id); await saveState(); showUndo(`Removed “${sk.name}”.`, async () => { S.removed = S.removed.filter(x => x !== id); await saveState(); }); }
    });
    $id('skillAdd')?.addEventListener('click', async () => {
      const name = $id('skillName').value.trim(); if (!name) { toast('Give your skill a name first.'); return; }
      state.skills.custom.push({ id: 'c_' + uid(), name, cat: $id('skillCat').value, mins: Math.max(5, Math.min(120, Number($id('skillMins').value) || 15)) }); $id('skillName').value = ''; await saveState(); toast('Skill added.');
    });
  }

  /* =============== SETTINGS: DATA IMPORT / EXPORT =============== */
  function setupDataTransfer() {
    const exportBtn = $id('exportWellnessData');
    const importInput = $id('importWellnessDataFile');
    const importBtn = $id('importWellnessData');
    exportBtn?.addEventListener('click', () => {
      try {
        const payload = { format: 'moncy-wellness-backup', version: 1, exportedAt: new Date().toISOString(), state: JSON.parse(JSON.stringify(state)) };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob); const a = document.createElement('a');
        a.href = url; a.download = `moncy-wellness-backup-${today()}.json`; document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Backup exported. Keep the file somewhere safe.');
      } catch (err) { console.error('Export failed', err); toast('Could not export the backup.'); }
    });
    importBtn?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', async () => {
      const file = importInput.files?.[0]; if (!file) return;
      try {
        if (file.size > 15 * 1024 * 1024) throw new Error('Backup file is larger than 15 MB.');
        const parsed = JSON.parse(await file.text());
        const incoming = parsed?.format === 'moncy-wellness-backup' ? parsed.state : parsed;
        if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error('This file is not a valid wellness backup.');
        if (!confirm('Import this backup and replace the current website data? Export a backup first if you may need the current data.')) return;
        if (typeof normalizeState === 'function') state = normalizeState(incoming); else state = { ...state, ...incoming };
        if (typeof renderAll === 'function') renderAll();
        const saved = await saveState();
        if (saved !== false) toast('Backup imported.');
      } catch (err) { console.error('Import failed', err); toast(err?.message || 'Could not import this backup.'); }
      finally { importInput.value = ''; }
    });
  }

  /* =============== CREDITS + REQUESTS =============== */
  const VERSIONS = [
    ['v2', 'October 2026', 'A softer Blush light mode, the Interstellar theme, a daily quote, a re-organised home, Let it out, the women’s care guide, a weekly look-back, skills to learn, profile photos, Open When You Need Me, and a birthday letter with photos and music.'],
    ['v1', 'Before', 'Her little space: journal, health and cycle tracking, planner, goals, books and music, letters, secret garden, comfort corner and little things museum.']
  ];
  let reqCat = 'New feature';
  function renderRequests() {
    const v = $id('versionList'); if (v) v.innerHTML = VERSIONS.map(([n, d, t]) => `<li><strong>${esc(n)}</strong> <span class="muted">${esc(d)}</span><p>${esc(t)}</p></li>`).join('');
    const l = $id('reqList'); if (!l) return;
    const list = (state.requests || []).slice().reverse();
    l.innerHTML = list.map(r => entryHTML(r.text, `${r.category} · ${fmt(r.date)} · ${r.status || 'received'}`, '')).join('') || '<div class="empty-state">Your requests will appear here, with their status.</div>';
  }
  async function pushRequest(r) { /* Requests are stored in the shared wellness_state row and sync with the rest of the app. */ }
  async function pullStatuses() { /* Shared requests are already synchronized through wellness_state. */ }
  function setupRequests() {
    $id('reqCats')?.addEventListener('click', e => { const b = e.target.closest('[data-reqcat]'); if (!b) return; reqCat = b.dataset.reqcat; $id('reqCats').querySelectorAll('button').forEach(x => x.classList.toggle('selected', x === b)); });
    $id('reqSend')?.addEventListener('click', async () => {
      const text = $id('reqText').value.trim(); if (!text) { toast('Type your idea first.'); return; }
      const r = { id: uid(), category: reqCat, text, date: today(), status: 'received' }; state.requests.push(r); $id('reqText').value = ''; await saveState(); pushRequest(r); toast('Request sent. Thank you ♡');
    });
  }

  /* =============== BIRTHDAY: sparkles + music =============== */
  const Music = {
    audio: null, ctx: null, master: null, timers: [], playing: false,
    ui() { const b = $id('giftMusicBtn'); if (b) { b.setAttribute('aria-pressed', String(this.playing)); b.textContent = this.playing ? '♪ Music on' : '♪ Music off'; } },
    start() {
      if (this.playing) return; this.playing = true; this.ui();
      const a = new Audio('assets/music/birthday.mp3'); a.loop = true; a.volume = .6; this.audio = a;
      const fb = () => { if (this.audio === a) { this.audio = null; if (this.playing) this.synth(); } };
      a.addEventListener('error', fb, { once: true }); const p = a.play(); if (p && p.catch) p.catch(fb);
    },
    synth() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; if (!this.ctx) this.ctx = new AC(); const c = this.ctx; if (c.state === 'suspended') c.resume();
        this.master = c.createGain(); this.master.gain.value = 0; this.master.gain.linearRampToValueAtTime(.5, c.currentTime + 2);
        const d = c.createDelay(); d.delayTime.value = .32; const fb = c.createGain(); fb.gain.value = .35; d.connect(fb); fb.connect(d);
        this.master.connect(c.destination); this.master.connect(d); d.connect(c.destination);
        const F = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
        const bar = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2], ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2], ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]];
        const beat = .66;
        const play = () => {
          if (!this.playing || !this.ctx) return; let t = c.currentTime + .1;
          bar.forEach(([n, b]) => {
            const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = F[n]; o2.frequency.value = F[n] / 2; const dur = b * beat;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .03); g.gain.exponentialRampToValueAtTime(.0008, t + dur * .98);
            o.connect(g); o2.connect(g); g.connect(this.master); o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur); t += dur;
          });
          this.timers.push(setTimeout(play, (t - c.currentTime + 2.5) * 1000));
        };
        play();
      } catch (e) { console.info('Music unavailable', e); }
    },
    stop() {
      this.playing = false; this.ui(); this.timers.forEach(clearTimeout); this.timers = [];
      if (this.audio) { try { this.audio.pause(); } catch (e) { } this.audio = null; }
      if (this.ctx) { try { this.master?.gain.setTargetAtTime(0, this.ctx.currentTime, .15); const c = this.ctx; this.ctx = null; setTimeout(() => { try { c.close(); } catch (e) { } }, 700); } catch (e) { } }
    },
    toggle() { this.playing ? this.stop() : this.start(); }
  };
  function burst(overlay) {
    if (RM()) return; const wrap = document.createElement('div'); wrap.className = 'gift-burst'; wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 26; i++) { const s = document.createElement('span'); const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220; s.style.setProperty('--x', Math.cos(a) * r + 'px'); s.style.setProperty('--y', Math.sin(a) * r - 40 + 'px'); s.style.animationDelay = (Math.random() * .25) + 's'; s.textContent = ['✨', '♡', '✿', '✦'][i % 4]; wrap.append(s); }
    overlay.append(wrap); setTimeout(() => wrap.remove(), 2200);
  }
  window.BirthdayExtras = { music: Music, burst };

  /* =============== SPACE STARFIELD DECOR + RENDER HOOK =============== */
  function renderExtras() { ensure(); renderAvatar(); renderQuote(); renderCare(); renderWeek(); renderSkills(); renderRequests(); }
  function init() {
    if (typeof state === 'undefined' || typeof saveState !== 'function') { console.warn('extras: app.js globals missing'); return; }
    injectNav(); injectViews(); setupThemes(); setupQuote(); setupProfile(); setupRelief(); setupCare(); setupSkills(); setupDataTransfer(); setupRequests(); wrapSwitchView();
    const orig = window.renderAll; window.renderAll = function () { orig.apply(this, arguments); try { renderExtras(); } catch (e) { console.error('extras render', e); } };
    try { ensure(); renderQuote(); renderRequests(); } catch (e) { console.error(e); }
  }
  init();
})();
