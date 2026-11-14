import { later, factor } from './pace.js';
// Mentalia Mates · juegos de multiplicar. Primero entender (filas iguales, rectángulos), luego practicar
// jugando. Todo con voz, opciones grandes con 🔊, «No lo sé» y la tabla como apoyo visual sin castigo.
// Cada juego recibe api = { h, T, speak, speakBtn, options, tableBtn, finish(msg) }.
import { FRAC_GAMES } from './games-frac.js';
import { ADDSUB_GAMES } from './games-addsub.js';
import { NUM_GAMES } from './games-num.js';
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// tarjeta de respuesta con altavoz
function optBtn(api, v, onPick) {
  const { h, speak, T } = api;
  return h('button', { class: 'opt', onclick: e => onPick(v, e.currentTarget) }, String(v),
    h('span', { class: 'ospk', role: 'button', 'aria-label': T('Escuchar', 'Escoltar'), onclick: e => { e.stopPropagation(); speak(String(v)); } }, '🔊'));
}

// 1 · Cajas de bloques: construir 3 filas de 4 y ver que es 4 + 4 + 4
function blocks(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0;
  const ROUNDS = 5;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡Has construido ${ok} cajas! Multiplicar es poner filas iguales.`, `Has construït ${ok} capses! Multiplicar és posar files iguals.`), ok, ROUNDS);
    round++;
    const R = rnd(2, 4), C = rnd(2, 5);
    let rows = 1, cols = 1;
    main.innerHTML = '';
    const q = T(`Construye una caja de ${R} filas con ${C} bloques en cada fila.`, `Construeix una capsa de ${R} files amb ${C} blocs a cada fila.`);
    const box = h('div', { class: 'lego' });
    const info = h('p', { class: 'say' });
    const draw = () => {
      box.style.setProperty('--c', cols); box.innerHTML = '';
      for (let i = 0; i < rows * cols; i++) box.append(h('span', { class: 'brick', style: { '--h': (Math.floor(i / cols) * 47) % 360 } }));
      info.textContent = `${rows} ${T('filas', 'files')} × ${cols} = ${Array(rows).fill(cols).join(' + ')} = ${rows * cols}`;
    };
    const ctl = (lab, f) => h('button', { class: 'ctl', type: 'button', onclick: () => { f(); draw(); speak(info.textContent); } }, lab);
    const check = h('button', { class: 'go big-go', type: 'button', onclick: () => {
      if (rows === R && cols === C) { ok++; speak(T(`¡Perfecto! ${R} por ${C} son ${R * C}.`, `Perfecte! ${R} per ${C} fan ${R * C}.`)); box.classList.add('win'); later(next, 2200); }
      else speak(T(`Cuenta otra vez: necesitas ${R} filas y ${C} bloques en cada fila.`, `Torna a comptar: necessites ${R} files i ${C} blocs a cada fila.`));
    } }, '✔️ ', T('¡Hecho!', 'Fet!'));
    main.append(h('h2', { class: 'qtext' }, q, ' ', speakBtn(q)), h('div', { class: 'lego-ctl' },
      h('div', {}, h('b', {}, T('Filas', 'Files')), ctl('➖', () => { rows = Math.max(1, rows - 1); }), h('span', { class: 'n' }, ''), ctl('➕', () => { rows = Math.min(6, rows + 1); })),
      h('div', {}, h('b', {}, T('Bloques por fila', 'Blocs per fila')), ctl('➖', () => { cols = Math.max(1, cols - 1); }), ctl('➕', () => { cols = Math.min(8, cols + 1); }))),
    box, info, check);
    draw(); speak(q);
  }
  next();
}

// 2 · Carrera de rectángulos: los dados dicen filas y columnas; quien cubra más papel gana
function rectangles(main, api) {
  const { h, T, speak, speakBtn } = api;
  const N = 10, owner = Array(N * N).fill(0);
  let turn = 1, turns = 0, mine = 0, robot = 0;
  const MAXT = 8;
  main.innerHTML = '';
  const grid = h('div', { class: 'rgrid' });
  for (let i = 0; i < N * N; i++) grid.append(h('span'));
  const score = h('div', { class: 'rscore' });
  const msg = h('h2', { class: 'qtext' });
  const dice = h('div', { class: 'dice' });
  const roll = h('button', { class: 'go big-go', type: 'button' }, '🎲 ', T('Tirar los dados', 'Tirar els daus'));
  const paint = () => { [...grid.children].forEach((c, i) => { c.className = owner[i] === 1 ? 'me' : owner[i] === 2 ? 'bot' : ''; }); score.innerHTML = ''; score.append(h('span', { class: 'me' }, '🧒 ', String(mine)), h('span', { class: 'bot' }, '🤖 ', String(robot))); };
  const fits = (r0, c0, R, C) => { if (r0 + R > N || c0 + C > N) return false; for (let r = r0; r < r0 + R; r++) for (let c = c0; c < c0 + C; c++) if (owner[r * N + c]) return false; return true; };
  const place = (r0, c0, R, C, who) => { for (let r = r0; r < r0 + R; r++) for (let c = c0; c < c0 + C; c++) owner[r * N + c] = who; };
  const anyFit = (R, C) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(r, c, R, C) || fits(r, c, C, R)) return true; return false; };
  function myTurn() {
    if (turns >= MAXT || (!anyFit(1, 1))) return end();
    msg.textContent = T('Tu turno: tira los dados', 'El teu torn: tira els daus'); roll.disabled = false; speak(msg.textContent);
  }
  roll.addEventListener('click', () => {
    roll.disabled = true;
    const R = rnd(1, 6), C = rnd(1, 6);
    dice.textContent = `${DICE[R - 1]} ${DICE[C - 1]}`;
    if (!anyFit(R, C)) { msg.textContent = T('No cabe… ¡pierdes el turno!', 'No hi cap… perds el torn!'); speak(msg.textContent); turns++; return later(botTurn, 1600); }
    const q = T(`${R} filas por ${C} columnas. ¿Cuántos cuadritos son?`, `${R} files per ${C} columnes. Quants quadrets són?`);
    msg.textContent = q; speak(q);
    const opts = api.options(R * C, 4, 4);
    const row = h('div', { class: 'opts' }, ...opts.map(v => optBtn(api, v, (val, el) => {
      if (val !== R * C) { el.classList.add('no'); speak(T('Casi. Cuenta las filas y las columnas.', 'Gairebé. Compta les files i les columnes.')); return; }
      row.remove(); speak(T(`¡Sí! ${R * C}. Ahora toca el papel donde quieres pintarlo.`, `Sí! ${R * C}. Ara toca el paper on el vols pintar.`));
      msg.textContent = T('Toca la esquina de arriba a la izquierda de tu rectángulo', 'Toca la cantonada de dalt a l\'esquerra del teu rectangle');
      grid.onclick = e => {
        const i = [...grid.children].indexOf(e.target); if (i < 0) return;
        const r0 = Math.floor(i / N), c0 = i % N;
        let [rr, cc] = fits(r0, c0, R, C) ? [R, C] : fits(r0, c0, C, R) ? [C, R] : [0, 0];
        if (!rr) { speak(T('Ahí no cabe. Prueba en otro sitio.', 'Aquí no hi cap. Prova en un altre lloc.')); return; }
        grid.onclick = null; place(r0, c0, rr, cc, 1); mine += R * C; turns++; paint(); later(botTurn, 900);
      };
    })), api.dontKnow(() => R * C));
    main.insertBefore(row, grid);
  });
  function botTurn() {
    if (turns >= MAXT) return end();
    msg.textContent = T('Turno del robot 🤖', 'Torn del robot 🤖');
    const R = rnd(1, 6), C = rnd(1, 6); dice.textContent = `${DICE[R - 1]} ${DICE[C - 1]}`;
    later(() => {
      outer: for (let r = N - 1; r >= 0; r--) for (let c = N - 1; c >= 0; c--) { if (fits(r, c, R, C)) { place(r, c, R, C, 2); robot += R * C; break outer; } if (fits(r, c, C, R)) { place(r, c, C, R, 2); robot += R * C; break outer; } }
      turns++; paint(); speak(T(`El robot ha sacado ${R} por ${C}, ${R * C}.`, `El robot ha tret ${R} per ${C}, ${R * C}.`)); later(myTurn, 1800);
    }, 1200);
  }
  function end() { api.finish(mine >= robot ? T(`¡Has ganado! Has pintado ${mine} cuadritos y el robot ${robot}.`, `Has guanyat! Has pintat ${mine} quadrets i el robot ${robot}.`) : T(`El robot ha pintado ${robot} y tú ${mine}. ¡La próxima ganas tú!`, `El robot n'ha pintat ${robot} i tu ${mine}. La propera guanyes tu!`), mine >= robot ? 1 : 0, 1); }
  main.append(h('p', { class: 'hint' }, T('Los dados dicen las filas y las columnas. Gana quien pinte más papel.', 'Els daus diuen les files i les columnes. Guanya qui pinti més paper.')), score, dice, msg, roll, grid);
  paint(); myTurn();
}

// 3 · Batalla de cartas: salen dos cartas, multiplica antes que el robot
function cards(main, api) {
  const { h, T, speak } = api;
  let me = 0, bot = 0, round = 0;
  const ROUNDS = 8, maxT = api.maxTable || 10;
  function next() {
    if (round >= ROUNDS) return api.finish(me >= bot ? T(`¡Ganas la batalla! ${me} cartas para ti y ${bot} para el robot.`, `Guanyes la batalla! ${me} cartes per a tu i ${bot} per al robot.`) : T(`El robot se lleva ${bot} cartas y tú ${me}. ¡Revancha!`, `El robot s'endú ${bot} cartes i tu ${me}. Revenja!`), me, ROUNDS);
    round++;
    const a = rnd(1, maxT), b = rnd(1, 10), ans = a * b;
    main.innerHTML = '';
    const card = (n, suit) => h('div', { class: 'pcard' }, h('span', { class: 'cn' }, String(n)), h('span', { class: 'cs' }, suit), h('span', { class: 'cn b' }, String(n)));
    const bar = h('div', { class: 'botbar' }, h('span'));
    const sc = h('div', { class: 'rscore' }, h('span', { class: 'me' }, '🧒 ', String(me)), h('span', { class: 'bot' }, '🤖 ', String(bot)));
    let done = false, tries = 0;
    const think = 9000 - Math.min(4000, round * 300);
    const timer = later(() => { if (done) return; done = true; bot += 2; speak(T(`El robot ha sido más rápido: ${a} por ${b} son ${ans}.`, `El robot ha estat més ràpid: ${a} per ${b} fan ${ans}.`)); row.querySelectorAll('.opt').forEach(o => { if (o.firstChild.textContent === String(ans)) o.classList.add('glow'); }); later(next, 2600); }, think);
    bar.firstChild.style.animationDuration = (think * factor()) + 'ms';
    const row = h('div', { class: 'opts' }, ...api.options(ans, 4, Math.max(3, a)).map(v => optBtn(api, v, (val, el) => {
      if (done) return;
      if (val === ans) { done = true; clearTimeout(timer); if (tries === 0) { me += 2; speak(T('¡Te llevas las cartas!', 'T\'endús les cartes!')); } else { me += 1; speak(T('¡Bien! Te llevas una carta.', 'Molt bé! T\'endús una carta.')); } el.classList.add('glow'); later(next, 1500); }
      else { tries++; el.classList.add('no'); }
    })));
    main.append(sc, h('div', { class: 'cardsrow' }, card(a, '♥️'), h('b', { class: 'x' }, '×'), card(b, '♠️')), h('p', { class: 'hint' }, '🤖 ', T('El robot está pensando…', 'El robot està pensant…')), bar, row,
      api.dontKnow(() => ans, () => { done = true; clearTimeout(timer); later(next, 3200); }));
    speak(`${a} ${T('por', 'per')} ${b}`);
  }
  next();
}

// 4 · Matamoscas: se dice una multiplicación y hay que cazar el resultado
function swatter(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0;
  const ROUNDS = 8, maxT = api.maxTable || 10;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡Has cazado ${ok} moscas de ${ROUNDS}!`, `Has caçat ${ok} mosques de ${ROUNDS}!`), ok, ROUNDS);
    round++;
    const a = rnd(2, maxT), b = rnd(1, 10), ans = a * b;
    const set = new Set([ans]); while (set.size < 9) { const x = rnd(2, maxT) * rnd(1, 10); if (x !== ans) set.add(x); }
    main.innerHTML = '';
    const q = `${a} × ${b}`;
    let err = false;
    const board = h('div', { class: 'flies' }, ...shuffle([...set]).map(v => {
      const f = h('button', { class: 'fly', type: 'button', style: { '--d': (Math.random() * 2).toFixed(2) + 's' } }, h('span', { class: 'fe' }, '🪰'), h('b', {}, String(v)),
        h('span', { class: 'ospk', role: 'button', onclick: e => { e.stopPropagation(); speak(String(v)); } }, '🔊'));
      f._v = v;
      f.addEventListener('click', () => {
        if (v === ans) { if (!err) ok++; f.classList.add('hit'); f.querySelector('.fe').textContent = '💥'; speak(T(`¡Cazada! ${q} son ${ans}.`, `Caçada! ${q} fan ${ans}.`)); later(next, 1500); }
        else { err = true; f.classList.add('no'); speak(T('¡Esa mosca se ha escapado! Prueba otra.', 'Aquesta mosca s\'ha escapat! Prova\'n una altra.')); }
      });
      return f;
    }));
    main.append(h('h2', { class: 'qtext' }, '🫱 ', T('Caza el resultado de', 'Caça el resultat de'), ' ', h('span', { class: 'bigop inline' }, q), ' ', speakBtn(`${a} ${T('por', 'per')} ${b}`)), board,
      api.dontKnow(() => ans, () => { board.querySelectorAll('.fly').forEach(x => { if (x._v === ans) x.classList.add('glow'); }); err = true; }));
    speak(`${a} ${T('por', 'per')} ${b}`);
  }
  next();
}

// 5 · Cierra la caja: tira dos dados, multiplica y cierra la tapa con ese resultado
function shutbox(main, api) {
  const { h, T, speak } = api;
  const TILES = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 36];
  const closed = new Set();
  let rolls = 0;
  const MAXR = 18;
  main.innerHTML = '';
  const box = h('div', { class: 'shut' }, ...TILES.map(n => h('button', { class: 'tile', type: 'button', disabled: true }, String(n))));
  const msg = h('h2', { class: 'qtext' }, T('Tira los dados, multiplica y cierra la tapa con ese número.', 'Tira els daus, multiplica i tanca la tapa amb aquest número.'));
  const dice = h('div', { class: 'dice' });
  const info = h('p', { class: 'hint' });
  const roll = h('button', { class: 'go big-go', type: 'button' }, '🎲 ', T('Tirar', 'Tirar'));
  const upd = () => { info.textContent = T(`Tapas cerradas: ${closed.size} de ${TILES.length} · tiradas: ${rolls} de ${MAXR}`, `Tapes tancades: ${closed.size} de ${TILES.length} · tirades: ${rolls} de ${MAXR}`); };
  roll.addEventListener('click', () => {
    if (rolls >= MAXR) return;
    rolls++; roll.disabled = true;
    const a = rnd(1, 6), b = rnd(1, 6), p = a * b;
    dice.textContent = `${DICE[a - 1]} × ${DICE[b - 1]}`;
    speak(`${a} ${T('por', 'per')} ${b}`);
    const tiles = [...box.children];
    const target = tiles.find(t => +t.textContent === p);
    if (closed.has(p)) { speak(T(`${a} por ${b} son ${p}, pero esa tapa ya está cerrada. ¡Otra vez!`, `${a} per ${b} fan ${p}, però aquesta tapa ja està tancada. Una altra vegada!`)); upd(); roll.disabled = false; if (rolls >= MAXR) endGame(); return; }
    tiles.forEach(t => { if (!closed.has(+t.textContent)) t.disabled = false; });
    let tries = 0;
    tiles.forEach(t => { t.onclick = () => {
      if (+t.textContent === p) { closed.add(p); t.classList.add('closed'); t.disabled = true; tiles.forEach(x => { x.onclick = null; x.disabled = true; }); speak(T(`¡Sí! ${a} por ${b} son ${p}. Tapa cerrada.`, `Sí! ${a} per ${b} fan ${p}. Tapa tancada.`)); upd(); if (closed.size === TILES.length || rolls >= MAXR) later(endGame, 1400); else roll.disabled = false; }
      else { tries++; t.classList.add('no'); later(() => t.classList.remove('no'), 600); speak(T('Esa no. Vuelve a multiplicar.', 'Aquesta no. Torna a multiplicar.')); if (tries >= 2) target.classList.add('glow'); }
    }; });
    upd();
  });
  function endGame() { api.finish(T(`Has cerrado ${closed.size} tapas en ${rolls} tiradas. ¡Muy bien!`, `Has tancat ${closed.size} tapes en ${rolls} tirades. Molt bé!`), closed.size, TILES.length); }
  main.append(msg, dice, roll, box, info);
  upd(); speak(msg.textContent);
}

export const GAMES = {
  num: NUM_GAMES,
  add: ADDSUB_GAMES,
  sub: ADDSUB_GAMES,
  frac: FRAC_GAMES,
  mul: [
    { id: 'blocks', e: '🧱', es: 'Cajas de bloques', ca: 'Capses de blocs', d: { es: 'Entiende qué es multiplicar', ca: 'Entén què és multiplicar' }, run: blocks },
    { id: 'rect', e: '🟩', es: 'Carrera de rectángulos', ca: 'Cursa de rectangles', d: { es: 'Dados, filas y columnas', ca: 'Daus, files i columnes' }, run: rectangles },
    { id: 'cards', e: '🃏', es: 'Batalla de cartas', ca: 'Batalla de cartes', d: { es: 'Más rápido que el robot', ca: 'Més ràpid que el robot' }, run: cards },
    { id: 'swat', e: '🪰', es: 'Matamoscas', ca: 'Matamosques', d: { es: 'Caza el resultado', ca: 'Caça el resultat' }, run: swatter },
    { id: 'shut', e: '📦', es: 'Cierra la caja', ca: 'Tanca la capsa', d: { es: 'Dados que se multiplican', ca: 'Daus que es multipliquen' }, run: shutbox },
  ],
};

// Tabla de multiplicar (pitagórica) como apoyo visual
export function tableHTML(a, b) {
  let s = '<table class="pyth"><tr><th>×</th>' + Array.from({ length: 10 }, (_, j) => `<th class="${j + 1 === b ? 'hl' : ''}">${j + 1}</th>`).join('') + '</tr>';
  for (let i = 1; i <= 10; i++) { s += `<tr><th class="${i === a ? 'hl' : ''}">${i}</th>`; for (let j = 1; j <= 10; j++) s += `<td class="${i === a && j === b ? 'hit' : i === a || j === b ? 'hl' : ''}">${i * j}</td>`; s += '</tr>'; }
  return s + '</table>';
}
