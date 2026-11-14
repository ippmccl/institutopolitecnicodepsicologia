// Mentalia Mates · juegos de fracciones: primero partes iguales de un entero (pizza, tiras de papel),
// después equivalencias y comparación, y al final emparejar dibujo y número (memory).
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const frTxt = (n, d, T) => {
  const nm = { 2: ['medio', 'medios', 'mig', 'migs'], 3: ['tercio', 'tercios', 'terç', 'terços'], 4: ['cuarto', 'cuartos', 'quart', 'quarts'], 5: ['quinto', 'quintos', 'cinquè', 'cinquens'], 6: ['sexto', 'sextos', 'sisè', 'sisens'], 8: ['octavo', 'octavos', 'vuitè', 'vuitens'] }[d];
  if (!nm) return `${n}/${d}`;
  return T(`${n === 1 ? 'un' : n} ${n === 1 ? nm[0] : nm[1]}`, `${n === 1 ? 'un' : n} ${n === 1 ? nm[2] : nm[3]}`);
};

// pizza en SVG con porciones que se pueden tocar
function pizza(h, d, { fill = () => null, onTap, size = 220 } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'pz'); svg.style.width = size + 'px'; svg.style.height = size + 'px';
  const base = document.createElementNS(NS, 'circle'); base.setAttribute('cx', 50); base.setAttribute('cy', 50); base.setAttribute('r', 48); base.setAttribute('fill', '#E9B872'); svg.append(base);
  const slices = [];
  for (let i = 0; i < d; i++) {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d === 1 ? 'M50 5 A45 45 0 1 1 49.9 5 Z' : `M50 50 L${(50 + 44 * Math.cos(a0)).toFixed(2)} ${(50 + 44 * Math.sin(a0)).toFixed(2)} A44 44 0 0 1 ${(50 + 44 * Math.cos(a1)).toFixed(2)} ${(50 + 44 * Math.sin(a1)).toFixed(2)} Z`);
    p.setAttribute('stroke', '#8B5A2B'); p.setAttribute('stroke-width', '1.6');
    p.style.cursor = onTap ? 'pointer' : 'default';
    const paint = () => { const f = fill(i); p.setAttribute('fill', f || '#F4D58D'); };
    paint(); p._paint = paint;
    if (onTap) p.addEventListener('click', () => { onTap(i); slices.forEach(s => s._paint()); });
    slices.push(p); svg.append(p);
    // ingrediente dibujado en la porción
    const mid = (a0 + a1) / 2, tx = 50 + 28 * Math.cos(mid), ty = 50 + 28 * Math.sin(mid);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', tx.toFixed(1)); t.setAttribute('y', (ty + 4).toFixed(1)); t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', d > 6 ? '9' : '12'); t.style.pointerEvents = 'none'; t._i = i;
    svg.append(t); p._t = t;
  }
  svg._slices = slices;
  svg.redraw = () => slices.forEach(s => s._paint());
  return svg;
}
function optBtn(api, label, say, onPick) {
  const { h, speak } = api;
  return h('button', { class: 'opt', onclick: e => onPick(label, e.currentTarget) }, label,
    h('span', { class: 'ospk', role: 'button', onclick: e => { e.stopPropagation(); speak(say); } }, '🔊'));
}

// 1 · Pizzería: come porciones y di qué fracción te has comido
function pizzeria(main, api) {
  const { h, T, speak, speakBtn } = api;
  let round = 0, ok = 0; const ROUNDS = 6;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡Has repartido ${ok} pizzas! El número de abajo dice en cuántos trozos iguales se corta; el de arriba, cuántos coges.`, `Has repartit ${ok} pizzes! El número de sota diu en quants trossos iguals es talla; el de dalt, quants n'agafes.`), ok, ROUNDS);
    round++;
    const d = [2, 3, 4, 4, 6, 8][rnd(0, 5)], n = rnd(1, d - 1);
    const eaten = new Set();
    main.innerHTML = '';
    const q = T(`La pizza está cortada en ${d} trozos iguales. Cómete ${n}.`, `La pizza està tallada en ${d} trossos iguals. Menja't ${n}.`);
    const count = h('p', { class: 'say' });
    const upd = () => { count.textContent = T(`Te has comido ${eaten.size} de ${d}`, `T'has menjat ${eaten.size} de ${d}`); };
    const pz = pizza(h, d, { fill: i => (eaten.has(i) ? '#fff8ee' : null), onTap: i => { if (eaten.has(i)) eaten.delete(i); else eaten.add(i); speak(String(eaten.size)); upd(); } });
    const done = h('button', { class: 'go big-go', type: 'button' }, '😋 ', T('¡Ya está!', 'Ja està!'));
    done.addEventListener('click', () => {
      if (eaten.size !== n) { speak(T(`Tienes que comerte ${n} trozos. Llevas ${eaten.size}.`, `T'has de menjar ${n} trossos. En portes ${eaten.size}.`)); return; }
      done.remove();
      const q2 = T('¿Qué fracción te has comido?', 'Quina fracció t\'has menjat?');
      const ans = `${n}/${d}`;
      const set = new Set([ans, `${d}/${n}`, `${n}/${d + 1 > 8 ? d - 1 : d + 1}`, `${d - n}/${d}`]); set.delete('0/' + d);
      let err = false;
      const row = h('div', { class: 'opts' }, ...shuffle([...set]).slice(0, 4).map(f => { const [a, b] = f.split('/').map(Number); return optBtn(api, f, frTxt(a, b, T), (v, el) => {
        if (v === ans) { if (!err) ok++; el.classList.add('glow'); speak(T(`¡Sí! ${frTxt(n, d, T)}: ${n} trozos de ${d}.`, `Sí! ${frTxt(n, d, T)}: ${n} trossos de ${d}.`)); setTimeout(next, 2200); }
        else { err = true; el.classList.add('no'); speak(T('Fíjate: abajo, en cuántos trozos se corta; arriba, cuántos te has comido.', 'Fixa-t\'hi: a sota, en quants trossos es talla; a dalt, quants te n\'has menjat.')); }
      }); }));
      main.append(h('h2', { class: 'qtext' }, q2, ' ', speakBtn(q2)), row, api.dontKnow(() => ans, () => setTimeout(next, 3200)));
      speak(q2);
    });
    main.append(h('h2', { class: 'qtext' }, '🍕 ', q, ' ', speakBtn(q)), h('div', {}, pz), count, done);
    upd(); speak(q);
  }
  next();
}

// 2 · Ingredientes: pon cada ingrediente en su fracción y descubre fracciones equivalentes
function toppings(main, api) {
  const { h, T, speak, speakBtn } = api;
  const ING = { q: { e: '🧀', c: '#FFE07A', es: 'queso', ca: 'formatge' }, m: { e: '🍄', c: '#D9C2A7', es: 'champiñones', ca: 'xampinyons' }, p: { e: '🍅', c: '#F28B7A', es: 'tomate', ca: 'tomàquet' } };
  let round = 0, ok = 0; const ROUNDS = 6;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} pizzas perfectas! Ya sabes que 1/2 y 2/4 son la misma cantidad de pizza.`, `${ok} pizzes perfectes! Ja saps que 1/2 i 2/4 són la mateixa quantitat de pizza.`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    if (round % 2 === 1) {
      // pizza de ingredientes
      const d = round === 1 ? 4 : 8, a = rnd(1, d - 1), b = d - a;
      const want = { q: a, m: b };
      const put = Array(d).fill(null); let tool = 'q';
      const q = T(`Haz una pizza con ${a}/${d} de queso y ${b}/${d} de champiñones.`, `Fes una pizza amb ${a}/${d} de formatge i ${b}/${d} de xampinyons.`);
      const pz = pizza(h, d, { fill: i => (put[i] ? ING[put[i]].c : null), onTap: i => { put[i] = put[i] === tool ? null : tool; pz._slices[i]._t.textContent = put[i] ? ING[put[i]].e : ''; speak(L2(ING[tool])); } });
      const L2 = o => T(o.es, o.ca);
      const tools = h('div', { class: 'tools' }, ...['q', 'm'].map(k => { const b2 = h('button', { class: 'tool' + (k === tool ? ' on' : ''), type: 'button' }, ING[k].e, ' ', L2(ING[k])); b2.addEventListener('click', () => { tool = k; tools.querySelectorAll('.tool').forEach(x => x.classList.remove('on')); b2.classList.add('on'); speak(L2(ING[k])); }); return b2; }));
      const check = h('button', { class: 'go big-go', type: 'button' }, '✔️ ', T('¡Al horno!', 'Al forn!'));
      let err = false;
      check.addEventListener('click', () => {
        const cq = put.filter(x => x === 'q').length, cm = put.filter(x => x === 'm').length;
        if (cq === want.q && cm === want.m) { if (!err) ok++; speak(T('¡Pizza perfecta! Al horno.', 'Pizza perfecta! Al forn.')); pz.classList.add('bake'); setTimeout(next, 2200); }
        else { err = true; speak(T(`Llevas ${cq} de queso y ${cm} de champiñones. Necesitas ${want.q} y ${want.m}.`, `Portes ${cq} de formatge i ${cm} de xampinyons. En necessites ${want.q} i ${want.m}.`)); }
      });
      main.append(h('h2', { class: 'qtext' }, '👨‍🍳 ', q, ' ', speakBtn(q)), tools, h('div', {}, pz), check);
      speak(q);
    } else {
      // ¿es lo mismo? dos pizzas, una al lado de la otra
      const pairs = [[1, 2, 2, 4], [1, 2, 4, 8], [1, 4, 2, 8], [3, 4, 6, 8], [1, 3, 2, 6], [1, 2, 1, 4], [1, 3, 1, 4], [3, 4, 2, 4]];
      const [a, b, c, d] = pairs[rnd(0, pairs.length - 1)];
      const same = a * d === b * c;
      const q = T(`¿Es lo mismo ${a}/${b} que ${c}/${d} de pizza?`, `És el mateix ${a}/${b} que ${c}/${d} de pizza?`);
      const p1 = pizza(h, b, { fill: i => (i < a ? '#F28B7A' : null), size: 160 }), p2 = pizza(h, d, { fill: i => (i < c ? '#F28B7A' : null), size: 160 });
      let err = false;
      const pick = v => (yes, el) => {
        if ((v === 'si') === same) { if (!err) ok++; el.classList.add('glow'); speak(same ? T(`¡Sí! ${a}/${b} y ${c}/${d} son la misma cantidad: son fracciones equivalentes.`, `Sí! ${a}/${b} i ${c}/${d} són la mateixa quantitat: són fraccions equivalents.`) : T(`¡Bien visto! No es lo mismo: hay más pizza en ${a * d > b * c ? a + '/' + b : c + '/' + d}.`, `Ben vist! No és el mateix: hi ha més pizza a ${a * d > b * c ? a + '/' + b : c + '/' + d}.`)); setTimeout(next, 3200); }
        else { err = true; el.classList.add('no'); speak(T('Mira bien cuánto espacio pintado hay en cada pizza.', 'Mira bé quant espai pintat hi ha a cada pizza.')); }
      };
      main.append(h('h2', { class: 'qtext' }, '🤔 ', q, ' ', speakBtn(q)), h('div', { class: 'vs' }, h('div', {}, p1, h('b', { class: 'frl' }, `${a}/${b}`)), h('b', {}, '='), h('div', {}, p2, h('b', { class: 'frl' }, `${c}/${d}`))),
        h('div', { class: 'opts' }, optBtn(api, '✅ ' + T('Sí', 'Sí'), T('Sí, es lo mismo', 'Sí, és el mateix'), pick('si')), optBtn(api, '❌ ' + T('No', 'No'), T('No, no es lo mismo', 'No, no és el mateix'), pick('no'))),
        api.dontKnow(() => (same ? T('sí, es lo mismo', 'sí, és el mateix') : T('no es lo mismo', 'no és el mateix')), () => setTimeout(next, 3400)));
      speak(q);
    }
  }
  next();
}

// 3 · Tiras de papel: el muro de fracciones (más trozos = trozos más pequeños)
function strips(main, api) {
  const { h, T, speak, speakBtn } = api;
  const DEN = [1, 2, 3, 4, 6, 8];
  const COL = { 1: '#9B6BD3', 2: '#4C9BE8', 3: '#4CAF7A', 4: '#F2C14E', 6: '#F2A33A', 8: '#E85C4C' };
  let round = 0, ok = 0; const ROUNDS = 6;
  const wall = (onPiece, show = DEN) => h('div', { class: 'wall' }, ...show.map(d => h('div', { class: 'wrow' }, ...Array.from({ length: d }, (_, i) => { const b = h('button', { class: 'wp', type: 'button', style: { '--c': COL[d] } }, d === 1 ? '1' : `1/${d}`); b._d = d; b._i = i; if (onPiece) b.addEventListener('click', () => onPiece(b)); return b; }))));
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} retos de papel! Cuanto más se divide la tira, más pequeño es cada trozo.`, `${ok} reptes de paper! Com més es divideix la tira, més petit és cada tros.`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    if (round % 2 === 1) {
      // ¿cuántos trozos de 1/b caben en 1/a?
      const [a, b] = [[2, 4], [2, 8], [3, 6], [4, 8], [2, 6]][rnd(0, 4)];
      const need = b / a;
      const q = T(`¿Cuántos trozos de 1/${b} caben en 1/${a}? Toca los trozos de 1/${b} para ponerlos debajo.`, `Quants trossos d'1/${b} caben en 1/${a}? Toca els trossos d'1/${b} per posar-los a sota.`);
      let placed = 0;
      const target = h('div', { class: 'wrow tgt' }, h('div', { class: 'wp wbig', style: { '--c': COL[a], flex: `0 0 ${100 / a}%` } }, `1/${a}`));
      const under = h('div', { class: 'wrow under' });
      const w = wall(p => { if (p._d !== b || p.classList.contains('used')) { speak(T(`Busca los trozos de 1/${b}.`, `Busca els trossos d'1/${b}.`)); return; } p.classList.add('used'); placed++;
        under.append(h('div', { class: 'wp', style: { '--c': COL[b], flex: `0 0 ${100 / b}%` } }, `1/${b}`)); speak(String(placed));
        if (placed === need) { ok++; speak(T(`¡Caben ${need}! ${need} trozos de 1/${b} son lo mismo que 1/${a}.`, `Hi caben ${need}! ${need} trossos d'1/${b} són el mateix que 1/${a}.`)); setTimeout(next, 3000); }
      }, [b]);
      main.append(h('h2', { class: 'qtext' }, '📏 ', q, ' ', speakBtn(q)), target, under, h('p', { class: 'hint' }, '⬇️'), w, api.dontKnow(() => need, () => setTimeout(next, 3200)));
      speak(q);
    } else {
      // ¿qué trozo es más grande?
      let a = DEN[rnd(1, 5)], b = DEN[rnd(1, 5)]; while (a === b) b = DEN[rnd(1, 5)];
      const big = Math.min(a, b);
      const q = T(`¿Qué trozo es más grande: 1/${a} o 1/${b}? Toca el más grande en las tiras.`, `Quin tros és més gran: 1/${a} o 1/${b}? Toca el més gran a les tires.`);
      let err = false;
      const w = wall(p => {
        if (p._d !== a && p._d !== b) { speak(T(`Busca los trozos de 1/${a} y de 1/${b}.`, `Busca els trossos d'1/${a} i d'1/${b}.`)); return; }
        if (p._d === big) { if (!err) ok++; p.classList.add('ok'); speak(T(`¡Sí! 1/${big} es más grande: la tira está partida en menos trozos.`, `Sí! 1/${big} és més gran: la tira està partida en menys trossos.`)); setTimeout(next, 3000); }
        else { err = true; p.classList.add('no'); speak(T('Ese es más pequeño. ¡Compara el tamaño!', 'Aquest és més petit. Compara la mida!')); }
      });
      main.append(h('h2', { class: 'qtext' }, '📏 ', q, ' ', speakBtn(q)), w, api.dontKnow(() => `1/${big}`, () => setTimeout(next, 3200)));
      speak(q);
    }
  }
  next();
}

// 4 · Memory: emparejar el dibujo con la fracción escrita
function memory(main, api) {
  const { h, T, speak } = api;
  const all = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5], [3, 8], [5, 6], [1, 8], [4, 5]];
  const pick = shuffle(all).slice(0, 6);
  const cards = shuffle(pick.flatMap(([n, d]) => [{ k: `${n}/${d}`, pic: true, n, d }, { k: `${n}/${d}`, pic: false, n, d }]));
  let open = [], found = 0, tries = 0, lock = false;
  main.innerHTML = '';
  const board = h('div', { class: 'memo' });
  cards.forEach(c => {
    const face = h('div', { class: 'mface' });
    if (c.pic) face.append(pizza(h, c.d, { fill: i => (i < c.n ? '#F28B7A' : null), size: 78 })); else face.append(h('b', { class: 'mfr' }, h('sup', {}, String(c.n)), h('span', {}, '—'), h('sub', {}, String(c.d))));
    const b = h('button', { class: 'mcard', type: 'button' }, h('span', { class: 'mback' }, '❓'), face);
    b.addEventListener('click', () => {
      if (lock || b.classList.contains('up')) return;
      b.classList.add('up'); speak(frTxt(c.n, c.d, T)); open.push([b, c]);
      if (open.length === 2) {
        tries++; lock = true;
        const [[b1, c1], [b2, c2]] = open;
        if (c1.k === c2.k && c1.pic !== c2.pic) { found++; b1.classList.add('ok'); b2.classList.add('ok'); open = []; lock = false; speak(T('¡Pareja!', 'Parella!'));
          if (found === pick.length) setTimeout(() => api.finish(T(`¡Has encontrado las ${found} parejas en ${tries} intentos!`, `Has trobat les ${found} parelles en ${tries} intents!`), found, tries), 1200); }
        else setTimeout(() => { b1.classList.remove('up'); b2.classList.remove('up'); open = []; lock = false; }, 1400);
      }
    });
    board.append(b);
  });
  main.append(h('h2', { class: 'qtext' }, '🃏 ', T('Busca las parejas: la pizza y su fracción', 'Busca les parelles: la pizza i la seva fracció')), board);
  speak(T('Busca las parejas: cada pizza con su fracción.', 'Busca les parelles: cada pizza amb la seva fracció.'));
}

export const FRAC_GAMES = [
  { id: 'pizzeria', e: '🍕', es: 'Pizzería', ca: 'Pizzeria', d: { es: 'Come porciones y di la fracción', ca: 'Menja porcions i digues la fracció' }, run: pizzeria },
  { id: 'toppings', e: '🍄', es: 'Ingredientes', ca: 'Ingredients', d: { es: 'Equivalencias: ¿1/2 = 2/4?', ca: 'Equivalències: 1/2 = 2/4?' }, run: toppings },
  { id: 'strips', e: '📏', es: 'Tiras de papel', ca: 'Tires de paper', d: { es: 'Qué trozo es más grande', ca: 'Quin tros és més gran' }, run: strips },
  { id: 'memo', e: '🃏', es: 'Memory de fracciones', ca: 'Memory de fraccions', d: { es: 'Pizza y número', ca: 'Pizza i número' }, run: memory },
];
