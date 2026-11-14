// Mentalia Mates · juegos de números y cantidades: tocar, construir y mover antes del número escrito.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
// colores de las regletas (1 a 10)
const ROD = ['#FFFFFF', '#E8474C', '#8BC34A', '#B46BD3', '#F2C14E', '#2E9D5B', '#7A4A2A', '#222222', '#4C6FE8', '#F2A33A'];

function optBtn(api, v, onPick) {
  const { h, speak } = api;
  return h('button', { class: 'opt', onclick: e => onPick(v, e.currentTarget) }, String(v),
    h('span', { class: 'ospk', role: 'button', onclick: e => { e.stopPropagation(); speak(String(v)); } }, '🔊'));
}
function ask(main, api, q, ans, onDone, opts) {
  const { h, T, speak, speakBtn } = api;
  let err = false;
  const row = h('div', { class: 'opts' }, ...(opts || api.options(ans, 4, 3)).map(v => optBtn(api, v, (val, el) => {
    if (val === ans) { el.classList.add('glow'); speak(T(`¡Sí! ${ans}.`, `Sí! ${ans}.`)); setTimeout(() => onDone(!err), 1700); }
    else { err = true; el.classList.add('no'); speak(T('Casi. Vuelve a mirarlo.', 'Gairebé. Torna-ho a mirar.')); }
  })));
  main.append(h('h2', { class: 'qtext' }, q, ' ', speakBtn(q)), row, api.dontKnow(() => ans, () => setTimeout(() => onDone(false), 3200)));
  speak(q);
}
let actx = null;
function clap() { try { actx ||= new (window.AudioContext || window.webkitAudioContext)(); const n = actx.createBufferSource(), g = actx.createGain(); const b = actx.createBuffer(1, actx.sampleRate * 0.08, actx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); n.buffer = b; g.gain.value = 0.8; n.connect(g).connect(actx.destination); n.start(); } catch { /* sin sonido */ } }

// 1 · Torres de bloques: construir cantidades y comparar alturas
function towers(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0; const ROUNDS = 6;
  const tower = (n, col) => h('div', { class: 'tower' }, ...Array.from({ length: n }, (_, i) => h('span', { class: 'tb', style: { background: col } })), h('b', {}, String(n)));
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} torres! Cuantos más bloques, más alta la torre.`, `${ok} torres! Com més blocs, més alta la torre.`), ok, ROUNDS);
    round++; main.innerHTML = '';
    if (round % 2) {
      const n = rnd(2, round < 3 ? 6 : 12); let have = 0;
      const q = T(`Construye una torre de ${n} bloques.`, `Construeix una torre de ${n} blocs.`);
      const slot = h('div', { class: 'tslot' });
      const draw = () => { slot.innerHTML = ''; slot.append(tower(have, '#4C9BE8')); };
      const done = h('button', { class: 'go big-go', type: 'button' }, '✔️ ', T('¡Hecho!', 'Fet!'));
      done.addEventListener('click', () => { if (have === n) { ok++; speak(T(`¡Torre de ${n}!`, `Torre de ${n}!`)); setTimeout(next, 1800); } else speak(T(`Tu torre tiene ${have}. Necesitas ${n}.`, `La teva torre en té ${have}. En necessites ${n}.`)); });
      main.append(h('h2', { class: 'qtext' }, '🧱 ', q, ' ', speakBtn(q)), slot, h('div', { class: 'jumps' },
        h('button', { class: 'ctl big', type: 'button', onclick: () => { if (have > 0) have--; draw(); speak(String(have)); } }, '➖'),
        h('button', { class: 'ctl big', type: 'button', onclick: () => { if (have < 15) have++; draw(); speak(String(have)); } }, '➕')), done);
      draw(); speak(q);
    } else {
      const a = rnd(2, 10); let b = rnd(2, 10); while (b === a) b = rnd(2, 10);
      main.append(h('div', { class: 'towers2' }, tower(a, '#E8774C'), tower(b, '#9B6BD3')));
      const kind = rnd(0, 1);
      if (kind === 0) ask(main, api, T('¿Qué torre es más alta?', 'Quina torre és més alta?'), Math.max(a, b), g => { if (g) ok++; next(); }, [a, b]);
      else ask(main, api, T(`¿Cuántos bloques más tiene la torre de ${Math.max(a, b)}?`, `Quants blocs més té la torre de ${Math.max(a, b)}?`), Math.abs(a - b), g => { if (g) ok++; next(); });
    }
  }
  next();
}

// 2 · Regletas y muro del 10: qué regleta completa la fila
function rods(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0; const ROUNDS = 6;
  const rod = (n, extra = {}) => h('div', { class: 'rod', style: { width: `calc(${n} * var(--u))`, background: ROD[n - 1] }, ...extra }, String(n));
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} muros completos! 7 y 3 hacen 10, igual que 6 y 4.`, `${ok} murs complets! 7 i 3 fan 10, igual que 6 i 4.`), ok, ROUNDS);
    round++; main.innerHTML = '';
    const total = round <= 3 ? 10 : rnd(6, 10);
    const a = rnd(1, total - 1), need = total - a;
    const q = T(`El muro tiene que medir ${total}. Ya hay una regleta de ${a}. ¿Qué regleta falta?`, `El mur ha de fer ${total}. Ja hi ha una regleta de ${a}. Quina regleta falta?`);
    let err = false;
    const row = h('div', { class: 'rodrow' }, rod(a), h('div', { class: 'rod gap', style: { width: `calc(${need} * var(--u))` } }, '?'));
    const ref = h('div', { class: 'rodrow' }, rod(total));
    const pool = h('div', { class: 'rodpool' }, ...shuffle([...new Set([need, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== need)).slice(0, 4)])]).map(n => {
      const r = rod(n); r.setAttribute('role', 'button');
      r.addEventListener('click', () => {
        speak(String(n));
        if (n === need) { if (!err) ok++; row.lastChild.replaceWith(rod(need)); speak(T(`¡Sí! ${a} y ${need} hacen ${total}.`, `Sí! ${a} i ${need} fan ${total}.`)); setTimeout(next, 2400); }
        else { err = true; r.classList.add('no'); speak(T(n > need ? 'Esa es demasiado larga.' : 'Esa es demasiado corta.', n > need ? 'Aquesta és massa llarga.' : 'Aquesta és massa curta.')); }
      }); return r;
    }));
    main.append(h('h2', { class: 'qtext' }, '📏 ', q, ' ', speakBtn(q)), h('div', { class: 'rodwall' }, ref, row), h('p', { class: 'hint' }, T('Toca la regleta que encaja', 'Toca la regleta que encaixa')), pool,
      api.dontKnow(() => need, () => { err = true; pool.querySelectorAll('.rod').forEach(r => { if (r.textContent === String(need)) r.classList.add('glow'); }); }));
    speak(q);
  }
  next();
}

// 3 · Decenas y unidades: agrupar de 10 en 10 para contar colecciones grandes
function tens(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0; const ROUNDS = 4;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} colecciones contadas! Hacer grupos de 10 ayuda a contar mucho más rápido.`, `${ok} col·leccions comptades! Fer grups de 10 ajuda a comptar molt més ràpid.`), ok, ROUNDS);
    round++; main.innerHTML = '';
    const n = rnd(round < 3 ? 12 : 21, round < 3 ? 29 : 59), e = ['🔘', '🪨', '🫘', '🧷'][round % 4];
    let loose = n, bags = 0;
    const q = T('Hay muchos. Toca «Hacer una bolsa de 10» para agruparlos.', "N'hi ha molts. Toca «Fer una bossa de 10» per agrupar-los.");
    const pile = h('div', { class: 'pile' }), bagsEl = h('div', { class: 'bags' });
    const draw = () => { pile.innerHTML = ''; for (let i = 0; i < loose; i++) pile.append(h('span', {}, e)); bagsEl.innerHTML = ''; for (let i = 0; i < bags; i++) bagsEl.append(h('span', { class: 'bag' }, '👜', h('b', {}, '10'))); };
    const mk = h('button', { class: 'go big-go', type: 'button' }, '👜 ', T('Hacer una bolsa de 10', 'Fer una bossa de 10'));
    mk.addEventListener('click', () => {
      if (loose < 10) { speak(T('Ya no quedan 10. ¡Vamos a contar!', 'Ja no en queden 10. Comptem!')); mk.remove();
        ask(main, api, T(`${bags} bolsas de 10 y ${loose} sueltos. ¿Cuántos hay en total?`, `${bags} bosses de 10 i ${loose} solts. Quants n'hi ha en total?`), n, g => { if (g) ok++; next(); }); return; }
      loose -= 10; bags++; draw(); speak(T(`${bags} ${bags === 1 ? 'bolsa' : 'bolsas'} de 10`, `${bags} ${bags === 1 ? 'bossa' : 'bosses'} de 10`));
    });
    main.append(h('h2', { class: 'qtext' }, '👜 ', q, ' ', speakBtn(q)), bagsEl, pile, mk);
    draw(); speak(q);
  }
  next();
}

// 4 · El tablero con dados: avanzar casilla a casilla contra el robot
function board(main, api) {
  const { h, T, speak } = api;
  const N = 30; let me = 0, bot = 0, turn = 'me';
  main.innerHTML = '';
  const cells = h('div', { class: 'board' }, ...Array.from({ length: N + 1 }, (_, i) => h('div', { class: 'cell' + (i === N ? ' goal' : '') }, h('b', {}, i === N ? '🏁' : String(i)), h('span', { class: 'tok' }))));
  const msg = h('h2', { class: 'qtext' });
  const dice = h('div', { class: 'dice' });
  const roll = h('button', { class: 'go big-go', type: 'button' }, '🎲 ', T('Tirar el dado', 'Tirar el dau'));
  const draw = () => [...cells.children].forEach((c, i) => { c.lastChild.textContent = (i === me ? '🧒' : '') + (i === bot ? '🤖' : ''); });
  let need = 0, steps = 0;
  const say = t => { msg.textContent = t; speak(t); };
  roll.addEventListener('click', () => {
    roll.disabled = true; const d = rnd(1, 6); dice.textContent = DICE[d - 1]; need = Math.min(d, N - me); steps = 0;
    say(T(`Has sacado ${d}. Toca ${need === 1 ? 'la casilla siguiente' : `las ${need} casillas siguientes, una a una`}.`, `Has tret ${d}. Toca ${need === 1 ? 'la casella següent' : `les ${need} caselles següents, una a una`}.`));
  });
  cells.addEventListener('click', e => {
    const c = e.target.closest('.cell'); if (!c || need === 0) return;
    const i = [...cells.children].indexOf(c);
    if (i !== me + 1) { speak(T(`La siguiente es la ${me + 1}.`, `La següent és la ${me + 1}.`)); return; }
    me++; steps++; draw(); speak(String(me));
    if (me >= N) return setTimeout(() => api.finish(T('¡Has llegado a la meta! 🏁', 'Has arribat a la meta! 🏁'), 1, 1), 800);
    if (steps === need) { need = 0; setTimeout(botTurn, 900); }
  });
  function botTurn() {
    const d = rnd(1, 6); dice.textContent = DICE[d - 1]; bot = Math.min(N, bot + d); draw();
    say(T(`El robot saca ${d} y va a la ${bot}.`, `El robot treu ${d} i va a la ${bot}.`));
    if (bot >= N) return setTimeout(() => api.finish(T('¡El robot ha llegado primero! La próxima vez ganas tú.', 'El robot ha arribat primer! La propera vegada guanyes tu.'), 0, 1), 1500);
    setTimeout(() => { roll.disabled = false; say(T('¡Tu turno!', 'El teu torn!')); }, 1600);
  }
  main.append(msg, dice, roll, cells);
  draw(); say(T('Tira el dado y avanza tantas casillas como puntos salgan.', 'Tira el dau i avança tantes caselles com punts surtin.'));
}

// 5 · Búsqueda del tesoro: descubrir números escondidos y ordenarlos de menor a mayor
function treasure(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0; const ROUNDS = 4;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡Has encontrado ${ok} tesoros!`, `Has trobat ${ok} tresors!`), ok, ROUNDS);
    round++; main.innerHTML = '';
    const k = round < 3 ? 4 : 5, max = round < 3 ? 20 : 100;
    const nums = []; while (nums.length < k) { const x = rnd(0, max); if (!nums.includes(x)) nums.push(x); }
    const sorted = [...nums].sort((a, b) => a - b);
    let found = 0, idx = 0, err = false;
    const q = T('Abre los cofres para encontrar los números.', 'Obre els cofres per trobar els números.');
    const chests = h('div', { class: 'chests' }, ...nums.map(n => {
      const c = h('button', { class: 'chest', type: 'button' }, '🧰');
      c.addEventListener('click', () => {
        if (!c.classList.contains('open')) { c.classList.add('open'); c.textContent = String(n); speak(String(n)); found++;
          if (found === k) { const q2 = T('¡Todos encontrados! Ahora tócalos de menor a mayor.', 'Tots trobats! Ara toca\'ls de més petit a més gran.'); msg.textContent = q2; speak(q2); }
          return; }
        if (found < k || c.classList.contains('done')) return;
        if (n === sorted[idx]) { c.classList.add('done'); line.append(h('span', { class: 'tn' }, String(n))); idx++; speak(String(n));
          if (idx === k) { if (!err) ok++; speak(T('¡Ordenados! Has encontrado el tesoro 💎', 'Ordenats! Has trobat el tresor 💎')); setTimeout(next, 2400); } }
        else { err = true; c.classList.add('no'); setTimeout(() => c.classList.remove('no'), 600); speak(T(`Busca el más pequeño que queda.`, `Busca el més petit que queda.`)); }
      });
      return c;
    }));
    const msg = h('h2', { class: 'qtext' }, '🗺️ ', q, ' ', speakBtn(q));
    const line = h('div', { class: 'tline' });
    main.append(msg, chests, line, api.dontKnow(() => sorted.join(', '), () => { err = true; }));
    speak(q);
  }
  next();
}

// 6 · Palmadas: escuchar cuántas palmadas hay o dar las palmadas que dice el número
function claps(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0; const ROUNDS = 6;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} ritmos perfectos! 👏`, `${ok} ritmes perfectes! 👏`), ok, ROUNDS);
    round++; main.innerHTML = '';
    const n = rnd(1, round < 4 ? 5 : 9);
    if (round % 2) {
      let c = 0;
      const q = T(`Da ${n} ${n === 1 ? 'palmada' : 'palmadas'}.`, `Fes ${n} ${n === 1 ? 'picada de mans' : 'picades de mans'}.`);
      const big = h('div', { class: 'numbig' }, String(n));
      const cnt = h('div', { class: 'clapcount' });
      const btn = h('button', { class: 'clapbtn', type: 'button' }, '👏');
      btn.addEventListener('click', () => { c++; clap(); cnt.append(h('span', {}, '👏')); btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit'); });
      const done = h('button', { class: 'go big-go', type: 'button' }, '✔️ ', T('¡Ya está!', 'Ja està!'));
      done.addEventListener('click', () => { if (c === n) { ok++; speak(T(`¡${n} palmadas!`, `${n} picades!`)); setTimeout(next, 1600); } else { speak(T(`Has dado ${c}. Vuelve a empezar: ${n}.`, `N'has fet ${c}. Torna a començar: ${n}.`)); c = 0; cnt.innerHTML = ''; } });
      main.append(h('h2', { class: 'qtext' }, q, ' ', speakBtn(q)), big, btn, cnt, done);
      speak(q);
    } else {
      const q = T('Escucha las palmadas. ¿Cuántas hay?', 'Escolta les picades. Quantes n\'hi ha?');
      const play = h('button', { class: 'go big-go', type: 'button' }, '👂 ', T('Escuchar', 'Escoltar'));
      const vis = h('div', { class: 'clapcount' });
      const run = () => { vis.innerHTML = ''; for (let i = 0; i < n; i++) setTimeout(() => { clap(); vis.append(h('span', {}, '👏')); }, 600 + i * 550); };
      play.addEventListener('click', run);
      main.append(play, vis);
      ask(main, api, q, n, g => { if (g) ok++; next(); });
      setTimeout(run, 1500);
    }
  }
  next();
}

export const NUM_GAMES = [
  { id: 'towers', e: '🧱', es: 'Torres de bloques', ca: 'Torres de blocs', d: { es: 'Construye y compara', ca: 'Construeix i compara' }, run: towers },
  { id: 'rods', e: '📏', es: 'Regletas: el muro del 10', ca: 'Regletes: el mur del 10', d: { es: '7 y 3 hacen 10', ca: '7 i 3 fan 10' }, run: rods },
  { id: 'tens', e: '👜', es: 'Bolsas de 10', ca: 'Bosses de 10', d: { es: 'Decenas y unidades', ca: 'Desenes i unitats' }, run: tens },
  { id: 'board', e: '🎲', es: 'El tablero', ca: 'El tauler', d: { es: 'Avanza con el dado', ca: 'Avança amb el dau' }, run: board },
  { id: 'treasure', e: '🗺️', es: 'Búsqueda del tesoro', ca: 'Cerca del tresor', d: { es: 'Encuentra y ordena', ca: 'Troba i ordena' }, run: treasure },
  { id: 'claps', e: '👏', es: 'Palmadas', ca: 'Picades de mans', d: { es: 'Cuenta con el ritmo', ca: 'Compta amb el ritme' }, run: claps },
];
