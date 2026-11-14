// Mentalia Mates · app para niños. Sin datos personales: solo iniciales, fecha de nacimiento (orientativa
// para el nivel) y un PIN de 4 números. De momento los datos se guardan en este dispositivo.
import { OPS, opById, LESSONS_PER_UNIT, QUESTIONS, reviewGen, options } from './curriculum.js';
import { GAMES, tableHTML } from './games.js';

const KEY = 'mm-data-v1';
const $app = document.getElementById('app');
let data = load();
let user = null;
let lang = data.lang || 'es';
let session = null; // { start, minutes, warned:Set, done:[], unitsTouched:Set }

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { users: {} }; } catch { return { users: {} }; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* sin almacenamiento */ } }
const L = o => (o && typeof o === 'object' ? (o[lang] ?? o.es) : o);
const T = (es, ca) => L({ es, ca });
const today = () => new Date().toISOString().slice(0, 10);
async function hash(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mm|' + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') for (const [p, val] of Object.entries(v)) { if (p.startsWith('--')) el.style.setProperty(p, val); else el.style[p] = val; }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
function speak(text) {
  try { const s = speechSynthesis; s.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ' ').replace(/×/g, lang === 'ca' ? ' per ' : ' por ').replace(/÷/g, lang === 'ca' ? ' entre ' : ' entre ').replace(/−/g, ' menos ').replace(/\?/g, ''));
    const want = lang === 'ca' ? 'ca' : 'es'; const v = s.getVoices().find(x => x.lang?.toLowerCase().startsWith(want)) || s.getVoices().find(x => x.lang?.toLowerCase().startsWith('es'));
    if (v) u.voice = v; u.lang = v ? v.lang : (want === 'ca' ? 'ca-ES' : 'es-ES'); u.rate = 0.9; s.speak(u); } catch { /* sin voz */ }
}
const speakBtn = text => h('button', { class: 'spk', type: 'button', 'aria-label': T('Escuchar', 'Escoltar'), onclick: e => { e.stopPropagation(); speak(text); } }, '🔊');
function applyPrefs() { document.body.classList.toggle('caps', !!(user && user.caps)); document.documentElement.lang = lang; }

// ---------- barra superior ----------
function topbar(back) {
  const st = user ? stats(user) : null;
  return h('header', { class: 'top' },
    back ? h('button', { class: 'icon', onclick: back, 'aria-label': T('Volver', 'Tornar') }, '⬅️') : h('span', { class: 'logo' }, '🧮'),
    h('b', { class: 'brand' }, 'Mentalia Mates'),
    h('span', { class: 'grow' }),
    st ? h('span', { class: 'chip' }, '🔥 ', String(st.streak)) : null,
    st ? h('span', { class: 'chip' }, '⭐ ', String(st.stars)) : null,
    st ? h('span', { class: 'chip' }, '🏆 ', String(st.cups)) : null,
    session ? timerChip() : null,
    h('button', { class: 'icon lang', onclick: () => { lang = lang === 'es' ? 'ca' : 'es'; if (user) { user.lang = lang; save(); } data.lang = lang; save(); applyPrefs(); rerender(); } }, lang === 'es' ? 'CA' : 'ES'),
    user ? h('button', { class: 'icon', title: T('Salir', 'Sortir'), onclick: () => { endSession(true); } }, '🚪') : null);
}
let rerender = () => {};
function screen(build) { rerender = () => { $app.innerHTML = ''; $app.append(...[].concat(build())); }; rerender(); window.scrollTo(0, 0); }

// ---------- estadísticas: racha, estrellas y copas ----------
function stats(u) {
  const days = [...new Set(u.starDays || [])].sort();
  let streak = 0; const d = new Date();
  if (!days.includes(today())) d.setDate(d.getDate() - 1);
  while (days.includes(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  const stars = days.length;
  return { streak, stars, cups: Math.floor(stars / 7), toCup: 7 - (stars % 7) };
}

// ---------- entrar / registrarse ----------
function loginScreen() {
  screen(() => [topbar(), h('main', { class: 'center' },
    h('div', { class: 'hero' }, '🧮✨'),
    h('h1', {}, T('¡Hola! Vamos a jugar con las mates', 'Hola! Juguem amb les mates')),
    h('div', { class: 'bigbtns' },
      h('button', { class: 'big b1', onclick: newUserScreen }, h('span', { class: 'e' }, '🌟'), T('Soy nuevo', 'Soc nou')),
      h('button', { class: 'big b2', onclick: loginForm }, h('span', { class: 'e' }, '🔑'), T('Ya tengo mi número', 'Ja tinc el meu número'))),
    h('p', { class: 'small muted' }, T('No guardamos datos personales: solo tus iniciales, tu fecha de nacimiento y tu número secreto.', 'No guardem dades personals: només les teves inicials, la data de naixement i el teu número secret.'), ' ', h('a', { href: 'privacidad.html' }, T('Privacidad', 'Privacitat'))))]);
}
function pinPad(onDone) {
  let pin = '';
  const dots = h('div', { class: 'dots' });
  const draw = () => { dots.innerHTML = ''; for (let i = 0; i < 4; i++) dots.append(h('span', { class: i < pin.length ? 'on' : '' })); };
  draw();
  const pad = h('div', { class: 'keypad' }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, ''].map(k => k === '' ? h('span') : h('button', { type: 'button', onclick: () => {
    if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
    draw(); if (pin.length === 4) setTimeout(() => onDone(pin, () => { pin = ''; draw(); }), 150);
  } }, String(k))));
  return h('div', {}, dots, pad);
}
function loginForm() {
  const ini = h('input', { class: 'inp', maxlength: 5, placeholder: T('Tus iniciales', 'Les teves inicials'), autocomplete: 'off' });
  const msg = h('p', { class: 'err' });
  screen(() => [topbar(loginScreen), h('main', { class: 'center' },
    h('h2', {}, T('Escribe tus iniciales y tu número secreto', 'Escriu les teves inicials i el teu número secret')), ini,
    pinPad(async (pin, reset) => {
      const i = ini.value.replace(/[^A-Za-zÀ-ÿ]/g, '').toUpperCase(); const hs = await hash(pin);
      const u = Object.values(data.users).find(x => x.ini === i && x.pin === hs);
      if (!u) { msg.textContent = T('No lo encuentro. Revisa las iniciales y el número.', 'No el trobo. Revisa les inicials i el número.'); reset(); return; }
      user = u; lang = u.lang || lang; applyPrefs(); chooseTime();
    }), msg)]);
}
function newUserScreen() {
  const ini = h('input', { class: 'inp', maxlength: 5, placeholder: T('Tus iniciales', 'Les teves inicials'), autocomplete: 'off' });
  const birth = h('input', { class: 'inp', type: 'date', max: today() });
  const caps = h('input', { type: 'checkbox' });
  const msg = h('p', { class: 'err' });
  screen(() => [topbar(loginScreen), h('main', { class: 'center' },
    h('h2', {}, T('Crea tu perfil', 'Crea el teu perfil')),
    h('label', { class: 'field' }, T('Iniciales', 'Inicials'), ini),
    h('label', { class: 'field' }, T('Fecha de nacimiento', 'Data de naixement'), birth),
    h('label', { class: 'check' }, caps, ' ', T('Quiero las letras en MAYÚSCULAS', 'Vull les lletres en MAJÚSCULES')),
    h('h3', {}, T('Elige tu número secreto de 4 cifras', 'Tria el teu número secret de 4 xifres')),
    pinPad(async (pin, reset) => {
      const i = ini.value.replace(/[^A-Za-zÀ-ÿ]/g, '').toUpperCase();
      if (!i || !birth.value) { msg.textContent = T('Faltan las iniciales o la fecha.', 'Falten les inicials o la data.'); reset(); return; }
      const hs = await hash(pin);
      if (Object.values(data.users).some(x => x.ini === i && x.pin === hs)) { msg.textContent = T('Ese número ya está usado con estas iniciales. Elige otro.', 'Aquest número ja està fet servir amb aquestes inicials. Tria\'n un altre.'); reset(); return; }
      const id = 'u' + Date.now().toString(36);
      user = data.users[id] = { id, ini: i, birth: birth.value, pin: hs, lang, caps: caps.checked, prog: {}, last: null, starDays: [], log: [] };
      save(); applyPrefs(); pinCard(i, pin);
    }), msg)]);
}
// tarjeta para recordar el número (se puede descargar como imagen)
function pinCard(ini, pin) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 360; const g = c.getContext('2d');
  g.fillStyle = '#FFF8E7'; g.fillRect(0, 0, 600, 360); g.strokeStyle = '#2B6E8B'; g.lineWidth = 10; g.strokeRect(10, 10, 580, 340);
  g.fillStyle = '#2B6E8B'; g.font = 'bold 34px system-ui'; g.fillText('🧮 Mentalia Mates', 40, 70);
  g.fillStyle = '#333'; g.font = '26px system-ui'; g.fillText(T('Mis iniciales:', 'Les meves inicials:') + ' ' + ini, 40, 150);
  g.fillText(T('Mi número secreto:', 'El meu número secret:'), 40, 210); g.font = 'bold 72px system-ui'; g.fillStyle = '#E8774C'; g.fillText(pin.split('').join(' '), 40, 300);
  const url = c.toDataURL('image/png');
  screen(() => [topbar(), h('main', { class: 'center' },
    h('h2', {}, T('¡Perfil creado! Guarda tu número', 'Perfil creat! Guarda el teu número')),
    h('img', { class: 'card', src: url, alt: '' }),
    h('div', { class: 'bigbtns' },
      h('a', { class: 'big b2', href: url, download: `mentalia-mates-${ini}.png` }, h('span', { class: 'e' }, '⬇️'), T('Descargar mi tarjeta', 'Descarregar la meva targeta')),
      h('button', { class: 'big b1', onclick: chooseTime }, h('span', { class: 'e' }, '▶️'), T('¡A jugar!', 'A jugar!'))))]);
}

// ---------- tiempo de juego ----------
function chooseTime() {
  screen(() => [topbar(), h('main', { class: 'center' },
    h('h2', {}, T('¿Cuánto tiempo quieres jugar hoy?', 'Quant temps vols jugar avui?')), speakBtn(T('¿Cuánto tiempo quieres jugar hoy?', 'Quant temps vols jugar avui?')),
    h('div', { class: 'bigbtns three' }, ...[5, 10, 15].map((m, i) => h('button', { class: 'big b' + (i + 1), onclick: () => { session = { start: Date.now(), minutes: m, warned: new Set(), done: [], units: new Set() }; tick(); home(); } },
      h('span', { class: 'e' }, ['⏱️', '⏰', '🕒'][i]), `${m} min`))),
    h('p', { class: 'muted' }, T('Si llegas al tiempo que elijas, ganas una ⭐. Con 7 estrellas, ¡una copa! 🏆', 'Si arribes al temps que triïs, guanyes una ⭐. Amb 7 estrelles, una copa! 🏆')))]);
}
let tickId = null;
function tick() {
  clearInterval(tickId);
  tickId = setInterval(() => {
    if (!session) return clearInterval(tickId);
    const min = (Date.now() - session.start) / 60000;
    document.querySelectorAll('.timer').forEach(el => { el.textContent = '⏱️ ' + Math.max(0, Math.ceil(session.minutes - min)) + "'"; });
    for (const m of [5, 10, 15]) if (min >= m && !session.warned.has(m) && m <= session.minutes) {
      session.warned.add(m);
      const reached = m >= session.minutes;
      if (reached) { awardStar(); toast(T(`¡Genial! Has jugado ${m} minutos y ganas una estrella ⭐`, `Genial! Has jugat ${m} minuts i guanyes una estrella ⭐`), true); }
      else toast(T(`¡Llevas ${m} minutos! Lo estás haciendo muy bien 💪`, `Ja portes ${m} minuts! Ho estàs fent molt bé 💪`));
    }
  }, 1000);
}
const timerChip = () => h('span', { class: 'chip timer' }, '⏱️');
function awardStar() { if (!user.starDays.includes(today())) { user.starDays.push(today()); save(); } }
function toast(text, big = false) {
  const t = h('div', { class: 'toast' + (big ? ' big' : '') }, text); document.body.append(t); speak(text); setTimeout(() => t.remove(), big ? 5000 : 3500);
}

// ---------- inicio: elegir operación ----------
const prog = (uid) => (user.prog[uid] ||= { lessons: 0, best: [] });
function unitState(op, i) { const p = user.prog[op.units[i].id]; const done = p ? p.lessons >= LESSONS_PER_UNIT : false; const open = i === 0 || done || (user.prog[op.units[i - 1].id]?.lessons >= LESSONS_PER_UNIT) || (user.open || []).includes(op.units[i].id); return { done, open, n: p ? p.lessons : 0 }; }
function home() {
  const st = stats(user);
  screen(() => [topbar(), h('main', {},
    h('h1', { class: 'hi' }, T(`¡Hola, ${user.ini}!`, `Hola, ${user.ini}!`)),
    user.last ? h('button', { class: 'continue', onclick: () => startLesson(opById(user.last.op), user.last.unit) }, '▶️ ', T('Seguir donde lo dejé: ', 'Continuar on ho vaig deixar: '), L(opById(user.last.op).units[user.last.unit].name)) : null,
    h('div', { class: 'ops' }, ...OPS.map(op => {
      const done = op.units.filter((_, i) => unitState(op, i).done).length;
      return h('button', { class: 'op', style: { '--c': op.color }, onclick: () => opScreen(op) }, h('span', { class: 'e' }, op.icon), h('b', {}, L(op.name)), h('small', {}, `${done}/${op.units.length}`));
    })),
    shelves(st))]);
}
function shelves(st) {
  return h('section', { class: 'shelves' },
    h('h3', {}, T('Mi estantería de estrellas', 'La meva prestatgeria d\'estrelles')),
    h('div', { class: 'shelf' }, ...Array.from({ length: Math.max(7, st.stars % 7 || 0) }, (_, i) => h('span', { class: i < (st.stars % 7) ? 'on' : '' }, '⭐'))),
    h('p', { class: 'muted small' }, T(`Te faltan ${st.toCup} estrellas para la próxima copa · racha: ${st.streak} días`, `Et falten ${st.toCup} estrelles per a la propera copa · ratxa: ${st.streak} dies`)),
    h('h3', {}, T('Mis copas', 'Les meves copes')),
    h('div', { class: 'shelf cups' }, ...(st.cups ? Array.from({ length: st.cups }, () => h('span', { class: 'on' }, '🏆')) : [h('span', {}, '🏆')])));
}
// recorrido de una operación: unidades en camino, con opción de saltar lo que ya sabe
function opScreen(op) {
  screen(() => [topbar(home), h('main', {},
    h('h1', { class: 'hi', style: { color: op.color } }, op.icon, ' ', L(op.name)),
    h('p', { class: 'muted' }, T('Sigue el camino. Si ya sabes algo, toca 🔓 para empezar más adelante.', 'Segueix el camí. Si ja saps alguna cosa, toca 🔓 per començar més endavant.')),
    GAMES[op.id] ? h('section', { class: 'games' }, h('h2', {}, '🎮 ', T('Juegos', 'Jocs')), h('div', { class: 'gbtns' }, ...GAMES[op.id].map(g => h('button', { class: 'gbtn', style: { '--c': op.color }, onclick: () => gameScreen(op, g) }, h('span', { class: 'e' }, g.e), h('b', {}, L(g)), h('small', {}, L(g.d)))))) : null,
    GAMES[op.id] ? h('h2', {}, '🗺️ ', T('Lecciones', 'Lliçons')) : null,
    h('ol', { class: 'path' }, ...op.units.map((u, i) => {
      const s = unitState(op, i);
      return h('li', { class: (s.done ? 'done ' : '') + (s.open ? 'open' : 'locked'), style: { '--c': op.color } },
        h('button', { class: 'node', disabled: !s.open, onclick: () => startLesson(op, i) }, s.done ? '✅' : s.open ? String(i + 1) : '🔒'),
        h('div', { class: 'ulabel' }, h('b', {}, L(u.name)), h('div', { class: 'lsn' }, ...Array.from({ length: LESSONS_PER_UNIT }, (_, k) => h('span', { class: k < s.n ? 'on' : '' }, '●')))),
        !s.open ? h('button', { class: 'skip', title: T('Ya lo sé', 'Ja ho sé'), onclick: () => { (user.open ||= []).push(u.id); save(); opScreen(op); } }, '🔓') : null);
    })))]);
}

// ---------- lección ----------
function startLesson(op, ui) {
  const u = op.units[ui];
  const p = prog(u.id);
  const mode = Math.min(p.lessons, LESSONS_PER_UNIT - 1); // 0 dibujos, 1 opciones, 2 escribir
  user.last = { op: op.id, unit: ui }; save();
  const review = reviewGen(op, ui);
  const qs = Array.from({ length: QUESTIONS }, (_, k) => (review && (k === 3 || k === 6) ? review(1) : u.gen(mode)));
  let k = 0, ok = 0, tries = 0;
  const bar = h('div', { class: 'qbar' }, h('span'));
  const stage = h('div', { class: 'stage' });
  function show() {
    bar.firstChild.style.width = (k / QUESTIONS) * 100 + '%';
    if (k >= QUESTIONS) return endLesson(op, ui, ok);
    const q = qs[k]; tries = 0;
    stage.innerHTML = '';
    const qt = L(q.q);
    stage.append(h('h2', { class: 'qtext' }, qt, ' ', speakBtn(qt + ' ' + q.show)), h('div', { class: 'qshow', html: q.show }));
    const answer = v => {
      const right = String(v) === String(q.answer);
      if (right) { if (tries === 0) ok++; stage.classList.add('good'); speak(pickOne(T('¡Muy bien!', 'Molt bé!'), T('¡Correcto!', 'Correcte!'), T('¡Genial!', 'Genial!'))); setTimeout(() => { stage.classList.remove('good'); k++; show(); }, 900); }
      else { tries++; stage.classList.add('bad'); setTimeout(() => stage.classList.remove('bad'), 500); speak(T('Casi. Prueba otra vez', 'Gairebé. Torna-ho a provar'));
        if (tries >= 2) { const sol = h('p', { class: 'sol' }, T('La respuesta es ', 'La resposta és '), h('b', {}, String(q.answer))); stage.append(sol); speak(T('La respuesta es ', 'La resposta és ') + q.answer); setTimeout(() => { k++; show(); }, 2200); } }
      return right;
    };
    if (q.opts) stage.append(h('div', { class: 'opts' }, ...q.opts.map(o => h('button', { class: 'opt', onclick: e => { if (!answer(o)) e.currentTarget.classList.add('no'); } }, String(o), h('span', { class: 'ospk', role: 'button', 'aria-label': T('Escuchar', 'Escoltar'), onclick: e => { e.stopPropagation(); speak(String(o)); } }, '🔊')))));
    else {
      let val = '';
      const disp = h('div', { class: 'disp' }, '?');
      const keys = h('div', { class: 'keypad ans' }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔️'].map(x => h('button', { type: 'button', class: x === '✔️' ? 'go' : '', onclick: () => {
        if (x === '⌫') val = val.slice(0, -1); else if (x === '✔️') { if (val) { answer(val); val = ''; } } else if (val.length < 5) val += x;
        disp.textContent = val || '?';
      } }, String(x))));
      stage.append(disp, keys);
    }
    stage.append(h('button', { class: 'dk', type: 'button', onclick: e => {
      e.currentTarget.disabled = true; tries = 2;
      const sol = h('p', { class: 'sol' }, '🤔 ', T('¡No pasa nada! Mira: la respuesta es ', 'No passa res! Mira: la resposta és '), h('b', {}, String(q.answer)));
      stage.append(sol);
      speak(T('No pasa nada. Mira: la respuesta es ', 'No passa res. Mira: la resposta és ') + q.answer + '. ' + T('Lo volveremos a practicar.', 'Ho tornarem a practicar.'));
      stage.querySelectorAll('.opt').forEach(b => { if (b.firstChild.textContent === String(q.answer)) b.classList.add('glow'); });
      setTimeout(() => { k++; show(); }, 3200);
    } }, '🤔 ', T('No lo sé', 'No ho sé')));
    speak(qt);
  }
  screen(() => [topbar(() => opScreen(op)), h('main', { class: 'lesson' }, h('div', { class: 'lhead', style: { '--c': op.color } }, op.icon, ' ', L(u.name), ' · ', T('lección', 'lliçó'), ' ', String(mode + 1)), ['mul', 'div'].includes(op.id) ? tableBtn() : null, bar, stage)]);
  show();
}
const pickOne = (...a) => a[Math.floor(Math.random() * a.length)];
function endLesson(op, ui, ok) {
  const u = op.units[ui], p = prog(u.id), pct = ok / QUESTIONS;
  const passed = pct >= 0.75;
  if (passed && p.lessons < LESSONS_PER_UNIT) p.lessons++;
  const unitDone = p.lessons >= LESSONS_PER_UNIT;
  if (unitDone && ui + 1 < op.units.length) user.last = { op: op.id, unit: ui + 1 };
  user.log.push({ d: today(), u: u.id, ok, n: QUESTIONS }); save();
  session && session.done.push({ op: op.id, ui, passed, unitDone });
  const msg = unitDone ? T(`¡Has aprendido ${L(u.learned)}! Ya puedes pasar al siguiente nivel.`, `Has après ${L(u.learned)}! Ja pots passar al nivell següent.`)
    : passed ? T(`¡Muy bien! Estás aprendiendo ${L(u.learned)}. Sigue con la siguiente lección.`, `Molt bé! Estàs aprenent ${L(u.learned)}. Continua amb la lliçó següent.`)
      : T(`Estás aprendiendo ${L(u.learned)}. Vamos a practicar un poco más esta lección.`, `Estàs aprenent ${L(u.learned)}. Practiquem una mica més aquesta lliçó.`);
  screen(() => [topbar(() => opScreen(op)), h('main', { class: 'center' },
    h('div', { class: 'hero' }, unitDone ? '🏅' : passed ? '🎉' : '💪'),
    h('h2', {}, `${ok} / ${QUESTIONS}`), h('p', { class: 'say' }, msg, ' ', speakBtn(msg)),
    h('div', { class: 'bigbtns' },
      h('button', { class: 'big b1', onclick: () => startLesson(op, unitDone && ui + 1 < op.units.length ? ui + 1 : ui) }, h('span', { class: 'e' }, '▶️'), T('Seguir', 'Continuar')),
      h('button', { class: 'big b2', onclick: () => opScreen(op) }, h('span', { class: 'e' }, '🗺️'), T('Ver el camino', 'Veure el camí'))))]);
  speak(msg);
}

// ---------- fin de la sesión: lo que ha trabajado ----------
function endSession(logout) {
  if (!session || (!session.done.length && !(session.games || []).length)) { session = null; clearInterval(tickId); user = null; return loginScreen(); }
  const lines = []; const seen = new Set();
  for (const d of session.done) { const op = opById(d.op), u = op.units[d.ui]; if (seen.has(u.id)) continue; seen.add(u.id);
    const s = unitState(op, d.ui);
    lines.push(s.done ? T(`✅ Has aprendido ${L(u.learned)}.`, `✅ Has après ${L(u.learned)}.`) : T(`📘 Estás aprendiendo ${L(u.learned)}. La próxima vez continuamos aquí.`, `📘 Estàs aprenent ${L(u.learned)}. La propera vegada continuem aquí.`)); }
  for (const g of [...new Set(session.games || [])]) lines.push(T(`🎮 Has jugado a «${g}».`, `🎮 Has jugat a «${g}».`));
  const min = Math.round((Date.now() - session.start) / 60000);
  session = null; clearInterval(tickId);
  screen(() => [topbar(), h('main', { class: 'center' },
    h('div', { class: 'hero' }, '🌈'), h('h2', {}, min < 1 ? T('¡Hoy has jugado un ratito!', 'Avui has jugat una estoneta!') : min === 1 ? T('¡Hoy has jugado 1 minuto!', 'Avui has jugat 1 minut!') : T(`¡Hoy has jugado ${min} minutos!`, `Avui has jugat ${min} minuts!`)),
    h('ul', { class: 'learned' }, ...lines.map(l => h('li', {}, l))),
    h('p', { class: 'say' }, T('¡Lo estás haciendo muy bien! 🌟', 'Ho estàs fent molt bé! 🌟')),
    h('button', { class: 'big b1', onclick: () => { user = null; loginScreen(); } }, h('span', { class: 'e' }, '👋'), T('Salir', 'Sortir')))]);
  speak(lines.join(' '));
}

applyPrefs();
// Modo consulta: Mentalia abre Mates con un paciente (iniciales y fecha) sin crear otro perfil ni PIN.
// El paciente llega por el almacenamiento local (nunca por la dirección) y caduca en 2 minutos.
function fromMentalia() {
  if (!/[?&]consulta\b/.test(location.search)) return false;
  let hd = null;
  try { hd = JSON.parse(localStorage.getItem('mm-handoff')); localStorage.removeItem('mm-handoff'); } catch { /* nada */ }
  if (!hd || !hd.pid || Date.now() - hd.t > 120000) return false;
  const id = 'm-' + hd.pid;
  user = data.users[id] ||= { id, ini: hd.ini, birth: hd.birth, pin: null, lang: hd.lang || lang, caps: false, prog: {}, last: null, starDays: [], log: [], consulta: true };
  user.ini = hd.ini; user.birth = hd.birth;
  lang = user.lang || lang; save(); applyPrefs();
  history.replaceState(null, '', location.pathname);
  return true;
}
if (fromMentalia()) chooseTime(); else loginScreen();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

// ---------- tabla de multiplicar como apoyo (sin castigo) ----------
function showTable() {
  const ov = h('div', { class: 'ov', onclick: e => { if (e.target === ov) ov.remove(); } },
    h('div', { class: 'ovbox' }, h('h2', {}, '📋 ', T('La tabla de multiplicar', 'La taula de multiplicar')), h('div', { html: tableHTML() }),
      h('p', { class: 'muted small' }, T('Busca la fila y la columna: donde se cruzan está el resultado.', 'Busca la fila i la columna: on es creuen hi ha el resultat.')),
      h('button', { class: 'big b1 small', onclick: () => ov.remove() }, '👍 ', T('Ya lo tengo', 'Ja ho tinc'))));
  document.body.append(ov);
  speak(T('Busca la fila y la columna: donde se cruzan está el resultado.', 'Busca la fila i la columna: on es creuen hi ha el resultat.'));
}
const tableBtn = () => h('button', { class: 'tblbtn', type: 'button', onclick: showTable }, '📋 ', T('Ver la tabla', 'Veure la taula'));

// ---------- juegos ----------
function gameScreen(op, g) {
  const main = h('div', { class: 'gstage' });
  const api = {
    h, T, speak, speakBtn, options, maxTable: 10, opId: op.id,
    tableBtn,
    dontKnow: (getAns, after) => h('div', { class: 'gfoot' }, h('button', { class: 'dk', type: 'button', onclick: e => {
      e.currentTarget.disabled = true; const a = getAns();
      main.append(h('p', { class: 'sol' }, '🤔 ', T('¡No pasa nada! La respuesta es ', 'No passa res! La resposta és '), h('b', {}, String(a))));
      speak(T('No pasa nada. La respuesta es ', 'No passa res. La resposta és ') + a);
      if (after) after();
    } }, '🤔 ', T('No lo sé', 'No ho sé')), ['mul', 'div'].includes(op.id) ? tableBtn() : null),
    finish: (msg, ok, n) => {
      user.log.push({ d: today(), g: g.id, ok, n }); save();
      if (session) (session.games ||= []).push(L(g));
      screen(() => [topbar(() => opScreen(op)), h('main', { class: 'center' }, h('div', { class: 'hero' }, '🏅'), h('h2', {}, L(g)), h('p', { class: 'say' }, msg, ' ', speakBtn(msg)),
        h('div', { class: 'bigbtns' }, h('button', { class: 'big b1', onclick: () => gameScreen(op, g) }, h('span', { class: 'e' }, '🔁'), T('Otra vez', 'Una altra vegada')),
          h('button', { class: 'big b2', onclick: () => opScreen(op) }, h('span', { class: 'e' }, '🎮'), T('Otros juegos', 'Altres jocs'))))]);
      speak(msg);
    },
  };
  screen(() => [topbar(() => opScreen(op)), h('main', { class: 'lesson game' }, h('div', { class: 'lhead', style: { '--c': op.color } }, g.e, ' ', L(g)), main)]);
  g.run(main, api);
}
