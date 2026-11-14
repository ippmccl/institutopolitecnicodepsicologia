// Mentalia Mates · juegos de sumar y restar: de lo concreto a lo abstracto. Sumar es juntar, añadir o
// avanzar; restar es quitar, comer, pagar o retroceder. Sin prisa: se premia razonar, no la velocidad.
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function optBtn(api, v, onPick) {
  const { h, speak } = api;
  return h('button', { class: 'opt', onclick: e => onPick(v, e.currentTarget) }, String(v),
    h('span', { class: 'ospk', role: 'button', onclick: e => { e.stopPropagation(); speak(String(v)); } }, '🔊'));
}
// pregunta final con opciones, voz y «No lo sé»
function ask(main, api, q, ans, onDone) {
  const { h, T, speak, speakBtn } = api;
  let err = false;
  const row = h('div', { class: 'opts' }, ...api.options(ans, 4, 3).map(v => optBtn(api, v, (val, el) => {
    if (val === ans) { el.classList.add('glow'); speak(T(`¡Sí! ${ans}.`, `Sí! ${ans}.`)); setTimeout(() => onDone(!err), 1700); }
    else { err = true; el.classList.add('no'); speak(T('Casi. Vuelve a contar despacito.', 'Gairebé. Torna a comptar a poc a poc.')); }
  })));
  main.append(h('h2', { class: 'qtext' }, q, ' ', speakBtn(q)), row, api.dontKnow(() => ans, () => setTimeout(() => onDone(false), 3200)));
  speak(q);
}
const CAP = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

// 1 · La máquina: echar tapones por dos tubos y juntarlos (sumar) o un monstruo que se come tapones (restar)
function machine(main, api) {
  const { h, T, speak } = api;
  const add = api.opId !== 'sub';
  let round = 0, ok = 0; const ROUNDS = 5;
  async function next() {
    if (round >= ROUNDS) return api.finish(add ? T(`¡${ok} sumas con la máquina! Sumar es juntar.`, `${ok} sumes amb la màquina! Sumar és ajuntar.`) : T(`¡${ok} restas con el monstruo! Restar es quitar.`, `${ok} restes amb el monstre! Restar és treure.`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    const cap = CAP[round % CAP.length];
    if (add) {
      const a = rnd(1, round < 3 ? 4 : 7), b = rnd(1, round < 3 ? 4 : 6);
      const cupA = h('div', { class: 'cup' }), cupB = h('div', { class: 'cup' });
      const tubeA = h('div', { class: 'tube' }, h('b', {}, String(a))), tubeB = h('div', { class: 'tube' }, h('b', {}, String(b)));
      let inA = 0, inB = 0;
      const q = T(`Echa ${a} tapones por el primer tubo y ${b} por el segundo.`, `Tira ${a} taps pel primer tub i ${b} pel segon.`);
      const drop = (cup, isA) => { if ((isA ? inA : inB) >= (isA ? a : b)) return; cup.append(h('span', { class: 'capi' }, cap)); if (isA) inA++; else inB++; speak(String(isA ? inA : inB));
        if (inA === a && inB === b) { speak(T('¡Ahora junta los vasos!', 'Ara ajunta els gots!')); join.disabled = false; } };
      const join = h('button', { class: 'go big-go', type: 'button', disabled: true }, '🤝 ', T('Juntar', 'Ajuntar'));
      join.addEventListener('click', () => {
        join.remove(); const all = h('div', { class: 'cup big' }, ...[...cupA.children, ...cupB.children].map(x => x.cloneNode(true)));
        machineEl.replaceWith(all);
        ask(main, api, T(`${a} + ${b}: ¿cuántos tapones hay ahora?`, `${a} + ${b}: quants taps hi ha ara?`), a + b, good => { if (good) ok++; next(); });
      });
      const machineEl = h('div', { class: 'machine' },
        h('div', { class: 'mcol' }, h('button', { class: 'drop', type: 'button', onclick: () => drop(cupA, true) }, cap, ' ⬇️'), tubeA, cupA),
        h('div', { class: 'mplus' }, '+'),
        h('div', { class: 'mcol' }, h('button', { class: 'drop', type: 'button', onclick: () => drop(cupB, false) }, cap, ' ⬇️'), tubeB, cupB));
      main.append(h('h2', { class: 'qtext' }, '🏭 ', q, ' ', api.speakBtn(q)), machineEl, join);
      speak(q);
    } else {
      const n = rnd(round < 3 ? 4 : 6, round < 3 ? 7 : 12), k = rnd(1, n - 1);
      let eaten = 0;
      const q = T(`Hay ${n} tapones. El monstruo tiene hambre: dale ${k}. Toca los tapones.`, `Hi ha ${n} taps. El monstre té gana: dona-li'n ${k}. Toca els taps.`);
      const mon = h('div', { class: 'monster' }, '👾');
      const jar = h('div', { class: 'cup big' }, ...Array.from({ length: n }, () => { const c = h('button', { class: 'capi btn0', type: 'button' }, cap); c.addEventListener('click', () => {
        if (eaten >= k || c.classList.contains('gone')) return; c.classList.add('gone'); eaten++; mon.classList.remove('chomp'); void mon.offsetWidth; mon.classList.add('chomp'); speak(T(`¡Ñam! ${eaten}`, `Nyam! ${eaten}`));
        if (eaten === k) setTimeout(() => ask(main, api, T(`${n} − ${k}: ¿cuántos tapones quedan?`, `${n} − ${k}: quants taps queden?`), n - k, good => { if (good) ok++; next(); }), 900);
      }); return c; }));
      main.append(h('h2', { class: 'qtext' }, '👾 ', q, ' ', api.speakBtn(q)), mon, jar);
      speak(q);
    }
  }
  next();
}

// 2 · La recta numérica: la rana salta hacia delante (+) o hacia atrás (−)
function numberLine(main, api) {
  const { h, T, speak, speakBtn } = api;
  const add = api.opId !== 'sub';
  let round = 0, ok = 0; const ROUNDS = 6, MAX = 20;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡La rana ha hecho ${ok} viajes perfectos! Sumar es avanzar y restar es retroceder.`, `La granota ha fet ${ok} viatges perfectes! Sumar és avançar i restar és retrocedir.`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    const mix = round > 3;
    const plus = mix ? Math.random() < 0.5 : add;
    const k = rnd(1, 6), start = plus ? rnd(0, MAX - k) : rnd(k, MAX), target = plus ? start + k : start - k;
    let pos = start, jumps = 0, err = false;
    const line = h('div', { class: 'nline' }, ...Array.from({ length: MAX + 1 }, (_, i) => h('div', { class: 'tick' + (i === start ? ' start' : '') }, h('span', { class: 'fr' }), h('b', {}, String(i)))));
    const draw = () => { [...line.children].forEach((t, i) => { t.firstChild.textContent = i === pos ? '🐸' : ''; t.classList.toggle('here', i === pos); }); const el = line.children[pos]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); };
    const q = T(`La rana está en el ${start}. Tarjeta: ${plus ? '+' : '−'} ${k}. ${plus ? 'Salta hacia delante' : 'Salta hacia atrás'} ${k} ${k === 1 ? 'vez' : 'veces'}.`, `La granota és al ${start}. Targeta: ${plus ? '+' : '−'} ${k}. ${plus ? 'Salta endavant' : 'Salta enrere'} ${k} ${k === 1 ? 'cop' : 'cops'}.`);
    const jump = d => { if (pos + d < 0 || pos + d > MAX) return; pos += d; jumps++; speak(String(pos)); draw(); };
    const here = h('button', { class: 'go big-go', type: 'button' }, '📍 ', T('¡Aquí!', 'Aquí!'));
    here.addEventListener('click', () => {
      if (pos === target) { if (!err) ok++; speak(T(`¡Sí! ${start} ${plus ? 'más' : 'menos'} ${k} son ${target}.`, `Sí! ${start} ${plus ? 'més' : 'menys'} ${k} fan ${target}.`)); line.children[pos].classList.add('win'); setTimeout(next, 2400); }
      else { err = true; speak(T(`Estás en el ${pos}. Recuerda: ${plus ? 'hacia delante' : 'hacia atrás'} ${k} saltos desde el ${start}.`, `Ets al ${pos}. Recorda: ${plus ? 'endavant' : 'enrere'} ${k} salts des del ${start}.`)); }
    });
    main.append(h('h2', { class: 'qtext' }, '🐸 ', q, ' ', speakBtn(q)), h('div', { class: 'ncard ' + (plus ? 'plus' : 'minus') }, `${plus ? '+' : '−'} ${k}`), h('div', { class: 'nwrap' }, line),
      h('div', { class: 'jumps' }, h('button', { class: 'ctl big', type: 'button', onclick: () => jump(-1) }, '⬅️'), h('button', { class: 'ctl big', type: 'button', onclick: () => jump(1) }, '➡️')), here,
      api.dontKnow(() => target, () => { pos = target; draw(); setTimeout(next, 3300); }));
    draw(); speak(q);
  }
  next();
}

// 3 · Manos que cuentan: levantar o doblar dedos
function hands(main, api) {
  const { h, T, speak } = api;
  const add = api.opId !== 'sub';
  let round = 0, ok = 0; const ROUNDS = 6;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡${ok} cuentas con los dedos! Tus manos siempre te ayudan a contar.`, `${ok} comptes amb els dits! Les teves mans sempre t'ajuden a comptar.`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    const up = Array(10).fill(false);
    let a, b, q, ans;
    if (add) { a = rnd(1, 5); b = rnd(1, 5); ans = a + b; for (let i = 0; i < a; i++) up[i] = true; q = T(`Tienes ${a} dedos levantados. Levanta ${b} más tocando los dedos.`, `Tens ${a} dits aixecats. Aixeca'n ${b} més tocant els dits.`); }
    else { a = rnd(3, 10); b = rnd(1, a - 1); ans = a - b; for (let i = 0; i < a; i++) up[i] = true; q = T(`Tienes ${a} dedos levantados. Dobla ${b} tocando los dedos.`, `Tens ${a} dits aixecats. Doblega'n ${b} tocant els dits.`); }
    const count = () => up.filter(Boolean).length;
    const handEl = side => h('div', { class: 'hand ' + side }, ...Array.from({ length: 5 }, (_, j) => {
      const i = side === 'l' ? j : 5 + j;
      const f = h('button', { class: 'finger' + (up[i] ? ' up' : ''), type: 'button', style: { '--i': j } });
      f.addEventListener('click', () => { up[i] = !up[i]; f.classList.toggle('up', up[i]); speak(String(count())); }); return f;
    }), h('div', { class: 'palm' }));
    const done = h('button', { class: 'go big-go', type: 'button' }, '✋ ', T('¡Ya está!', 'Ja està!'));
    done.addEventListener('click', () => {
      if (count() !== ans) { speak(T(`Tienes ${count()} dedos levantados. ${add ? `Tenías ${a} y tienes que levantar ${b} más.` : `Tenías ${a} y tienes que doblar ${b}.`}`, `Tens ${count()} dits aixecats. ${add ? `En tenies ${a} i n'has d'aixecar ${b} més.` : `En tenies ${a} i n'has de doblegar ${b}.`}`)); return; }
      done.remove();
      ask(main, api, T(`${a} ${add ? '+' : '−'} ${b}: ¿cuántos dedos quedan levantados?`, `${a} ${add ? '+' : '−'} ${b}: quants dits queden aixecats?`), ans, good => { if (good) ok++; next(); });
    });
    main.append(h('h2', { class: 'qtext' }, '✋ ', q, ' ', api.speakBtn(q)), h('div', { class: 'hands' }, handEl('l'), handEl('r')), done);
    speak(q);
  }
  next();
}

// 4 · Pinzas y tarjetas: a una tarjeta con puntos se le añaden o quitan; pon la pinza en el resultado
function clips(main, api) {
  const { h, T, speak, speakBtn } = api;
  const add = api.opId !== 'sub';
  let round = 0, ok = 0; const ROUNDS = 6;
  const dots = n => h('div', { class: 'dots10' }, ...Array.from({ length: 10 }, (_, i) => h('span', { class: i < n ? 'on' : '' })));
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡Has puesto ${ok} pinzas en su sitio!`, `Has posat ${ok} pinces al seu lloc!`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    const a = add ? rnd(1, 7) : rnd(3, 10), b = add ? rnd(1, 10 - a) : rnd(1, a - 1), ans = add ? a + b : a - b;
    const q = add ? T(`La tarjeta tiene ${a}. Le añadimos ${b}. ¿En qué tarjeta pones la pinza?`, `La targeta en té ${a}. N'hi afegim ${b}. A quina targeta poses la pinça?`)
      : T(`La tarjeta tiene ${a}. Le quitamos ${b}. ¿En qué tarjeta pones la pinza?`, `La targeta en té ${a}. N'hi traiem ${b}. A quina targeta poses la pinça?`);
    let err = false;
    const choices = shuffle([ans, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== ans)).slice(0, 3)]).sort((x, y) => x - y);
    const row = h('div', { class: 'clipcards' }, ...choices.map(n => { const c = h('button', { class: 'ccard', type: 'button' }, h('b', {}, String(n)), dots(n), h('span', { class: 'ospk', role: 'button', onclick: e => { e.stopPropagation(); speak(String(n)); } }, '🔊'));
      c.addEventListener('click', () => {
        if (n === ans) { if (!err) ok++; c.classList.add('clipped'); c.append(h('span', { class: 'clip' }, '🧷')); speak(T(`¡Bien! ${a} ${add ? 'más' : 'menos'} ${b} son ${ans}.`, `Molt bé! ${a} ${add ? 'més' : 'menys'} ${b} fan ${ans}.`)); setTimeout(next, 2300); }
        else { err = true; c.classList.add('no'); speak(T('Cuenta los puntos otra vez.', 'Compta els punts una altra vegada.')); }
      }); return c; }));
    main.append(h('h2', { class: 'qtext' }, '🧷 ', q, ' ', speakBtn(q)),
      h('div', { class: 'vs' }, h('div', { class: 'ccard big0' }, h('b', {}, String(a)), dots(a)), h('b', {}, add ? '+' : '−'), h('div', { class: 'ccard big0' }, h('b', {}, String(b)), dots(b))),
      row, api.dontKnow(() => ans, () => { row.querySelectorAll('.ccard').forEach(x => { if (x.querySelector('b').textContent === String(ans)) x.classList.add('glow'); }); err = true; }));
    speak(q);
  }
  next();
}

// 5 · La tienda: pagar con cereales de la hucha (restar) o ganar cereales vendiendo (sumar)
function shop(main, api) {
  const { h, T, speak, speakBtn } = api;
  const add = api.opId !== 'sub';
  const ITEMS = [['🍦', T('un helado', 'un gelat')], ['🧃', T('un zumo', 'un suc')], ['🍪', T('una galleta', 'una galeta')], ['🎈', T('un globo', 'un globus')], ['🖍️', T('una cera', 'una cera')], ['🍎', T('una manzana', 'una poma')], ['🧸', T('un osito', 'un osset')]];
  let round = 0, ok = 0; const ROUNDS = 5;
  function next() {
    if (round >= ROUNDS) return api.finish(T(`¡Has hecho ${ok} compras perfectas en la tienda!`, `Has fet ${ok} compres perfectes a la botiga!`), ok, ROUNDS);
    round++;
    main.innerHTML = '';
    const [e, name] = ITEMS[rnd(0, ITEMS.length - 1)];
    const have = round < 3 ? 10 : rnd(10, 15), price = rnd(2, round < 3 ? 6 : 9);
    const pig = h('div', { class: 'piggy' }, h('span', { class: 'pe' }, '🐷'));
    const coins = h('div', { class: 'coins' });
    const counter = h('div', { class: 'counter' }, h('span', { class: 'pe' }, e), h('b', {}, `${price} 🥣`));
    if (!add) {
      let paid = 0;
      const q = T(`Tienes ${have} cereales en tu hucha. Quieres ${name}, que cuesta ${price}. Toca los cereales para pagar.`, `Tens ${have} cereals a la guardiola. Vols ${name}, que costa ${price}. Toca els cereals per pagar.`);
      for (let i = 0; i < have; i++) { const c = h('button', { class: 'coin', type: 'button' }, '🥣'); c.addEventListener('click', () => {
        if (paid >= price || c.classList.contains('gone')) return; c.classList.add('gone'); paid++; counter.append(h('span', { class: 'paid' }, '🥣')); speak(String(paid));
        if (paid === price) setTimeout(() => ask(main, api, T(`${have} − ${price}: tenías ${have} y has pagado ${price}. ¿Cuántos cereales te quedan?`, `${have} − ${price}: en tenies ${have} i n'has pagat ${price}. Quants cereals et queden?`), have - price, good => { if (good) ok++; next(); }), 900);
      }); coins.append(c); }
      main.append(h('h2', { class: 'qtext' }, '🛒 ', q, ' ', speakBtn(q)), h('div', { class: 'shoprow' }, h('div', {}, pig, coins), counter));
      speak(q);
    } else {
      const start = rnd(2, 8), sold = rnd(2, 7);
      let got = 0;
      const q = T(`Tienes ${start} cereales. Vendes ${name} y te pagan ${sold}. Toca los cereales para guardarlos en la hucha.`, `Tens ${start} cereals. Vens ${name} i et paguen ${sold}. Toca els cereals per guardar-los a la guardiola.`);
      for (let i = 0; i < start; i++) coins.append(h('span', { class: 'coin in' }, '🥣'));
      const pay = h('div', { class: 'coins pay' }, ...Array.from({ length: sold }, () => { const c = h('button', { class: 'coin', type: 'button' }, '🥣'); c.addEventListener('click', () => {
        if (c.classList.contains('gone')) return; c.classList.add('gone'); got++; coins.append(h('span', { class: 'coin in' }, '🥣')); speak(String(start + got));
        if (got === sold) setTimeout(() => ask(main, api, T(`${start} + ${sold}: tenías ${start} y te han dado ${sold}. ¿Cuántos tienes ahora?`, `${start} + ${sold}: en tenies ${start} i te n'han donat ${sold}. Quants en tens ara?`), start + sold, good => { if (good) ok++; next(); }), 900);
      }); return c; }));
      main.append(h('h2', { class: 'qtext' }, '🛒 ', q, ' ', speakBtn(q)), h('div', { class: 'shoprow' }, h('div', {}, pig, coins), h('div', { class: 'counter' }, h('span', { class: 'pe' }, '🙋'), pay)));
      speak(q);
    }
  }
  next();
}

export const ADDSUB_GAMES = [
  { id: 'machine', e: '🏭', es: 'La máquina', ca: 'La màquina', d: { es: 'Juntar o quitar tapones', ca: 'Ajuntar o treure taps' }, run: machine },
  { id: 'line', e: '🐸', es: 'La rana saltarina', ca: 'La granota saltadora', d: { es: 'Salta en la recta numérica', ca: 'Salta a la recta numèrica' }, run: numberLine },
  { id: 'hands', e: '✋', es: 'Manos que cuentan', ca: 'Mans que compten', d: { es: 'Levanta y dobla dedos', ca: 'Aixeca i doblega dits' }, run: hands },
  { id: 'clips', e: '🧷', es: 'Pinzas y tarjetas', ca: 'Pinces i targetes', d: { es: 'Pon la pinza en el resultado', ca: 'Posa la pinça al resultat' }, run: clips },
  { id: 'shop', e: '🛒', es: 'La tienda', ca: 'La botiga', d: { es: 'Pagar y contar el cambio', ca: 'Pagar i comptar el canvi' }, run: shop },
];
