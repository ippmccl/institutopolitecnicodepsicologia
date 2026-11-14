// Mentalia Mates · temario. Cada operación tiene unidades ordenadas de fácil a difícil; cada unidad,
// 3 lecciones cortas: 1) con dibujos y opciones, 2) solo números y opciones, 3) escribir la respuesta.
// Los problemas llegan al final, cuando la operación ya se sabe. Cada generador devuelve una pregunta:
// { q:{es,ca}, show:'html', answer, opts?:[...], keypad?:bool }
const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const T = (es, ca) => ({ es, ca });

// Objetos sin copyright (emoji) con nombre en singular y plural
export const OBJ = [
  ['✏️', ['lápiz', 'lápices'], ['llapis', 'llapis']], ['🍬', ['caramelo', 'caramelos'], ['caramel', 'caramels']],
  ['🍎', ['manzana', 'manzanas'], ['poma', 'pomes']], ['⚽', ['pelota', 'pelotas'], ['pilota', 'pilotes']],
  ['🐟', ['pez', 'peces'], ['peix', 'peixos']], ['⭐', ['estrella', 'estrellas'], ['estrella', 'estrelles']],
  ['🎈', ['globo', 'globos'], ['globus', 'globus']], ['🚗', ['coche', 'coches'], ['cotxe', 'cotxes']],
  ['🌸', ['flor', 'flores'], ['flor', 'flors']], ['🧸', ['osito', 'ositos'], ['osset', 'ossets']],
  ['🍪', ['galleta', 'galletas'], ['galeta', 'galetes']], ['🦆', ['pato', 'patos'], ['ànec', 'ànecs']],
];
const nm = (o, n) => ({ es: `${n} ${o[1][n === 1 ? 0 : 1]}`, ca: `${n} ${o[2][n === 1 ? 0 : 1]}` });

// opciones: la correcta + distractores cercanos, sin repetir y sin negativos
export function options(ans, n = 3, spread = 3) {
  const s = new Set([ans]);
  let guard = 0;
  while (s.size < n && guard++ < 100) { const v = ans + r(-spread, spread); if (v >= 0 && v !== ans) s.add(v); }
  for (let k = 1; s.size < n; k++) s.add(ans + k * 10);
  return [...s].sort(() => Math.random() - 0.5);
}
const row = (e, n, cls = '') => `<div class="pics ${cls}">${Array.from({ length: n }, () => `<span>${e}</span>`).join('')}</div>`;
const groups = (e, g, n) => `<div class="groups">${Array.from({ length: g }, () => row(e, n, 'grp')).join('')}</div>`;
const col = (a, b, op) => `<div class="colop"><div></div><div>${a}</div><div>${op}</div><div>${b}</div><div class="bar"></div></div>`;
const big = s => `<div class="bigop">${s}</div>`;
// Como en el cole: la misma operación se presenta unas veces en horizontal y otras en vertical (en columna).
// Se alternan para que en cada lección salgan los dos formatos.
let turn = 0;
const both = (a, b, op, vertical = 0.5) => ((turn++ % 2 === 0) === (vertical >= 0.5) ? col(a, b, op) : big(`${a} ${op} ${b} = ?`));

// mode 0: dibujos + opciones · 1: opciones · 2: teclado
const ask = (mode, ans, show0, show1, q, spread) => ({
  q, answer: ans, show: mode === 0 ? show0 : show1,
  opts: mode < 2 ? options(ans, mode === 0 ? 3 : 4, spread) : null, keypad: mode === 2,
});

function genCount(max) {
  return mode => { const n = r(1, max), o = pick(OBJ); return ask(mode, n, row(o[0], n), mode === 1 ? row('🔵', n) : row(o[0], n), T('¿Cuántos hay?', 'Quants n\'hi ha?'), 2); };
}
function genCompare(max) {
  return mode => {
    let a = r(1, max), b = r(1, max); while (a === b) b = r(1, max);
    const o = pick(OBJ);
    const show = mode === 0 ? `<div class="vs">${row(o[0], a, 'sm')}<b>?</b>${row(o[0], b, 'sm')}</div>` : big(`${a} &nbsp;?&nbsp; ${b}`);
    return { q: T('¿Cuál es el número mayor?', 'Quin és el número més gran?'), show, answer: Math.max(a, b), opts: [a, b] };
  };
}
function genNext(min, max) {
  return mode => { const n = r(min, max - 1), after = Math.random() < 0.6; const ans = after ? n + 1 : n - 1;
    return ask(mode, ans, big(after ? `${n} → ?` : `? ← ${n}`), big(after ? `${n} , ?` : `? , ${n}`), after ? T('¿Qué número va después?', 'Quin número va després?') : T('¿Qué número va antes?', 'Quin número va abans?'), 2); };
}
function genTens(max) {
  return mode => { const t = r(1, Math.floor(max / 10)), u = r(0, 9), n = t * 10 + u;
    const show = `<div class="tens">${'<span class="ten">🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦</span>'.repeat(t)}${row('🟨', u, 'sm')}</div>`;
    return ask(mode, n, show, big(`${t} ${mode === 1 ? 'D' : 'D'} + ${u} U`), T('¿Qué número es?', 'Quin número és?'), 10); };
}
function genAdd(maxA, maxB, colum = false) {
  return mode => { const a = r(1, maxA), b = r(1, maxB), o = pick(OBJ);
    const op = both(a, b, '+', colum ? 0.7 : 0.5);
    const pics = maxA + maxB <= 20 ? `<div class="vs">${row(o[0], a, 'sm')}<b>+</b>${row(o[0], b, 'sm')}</div>${op}` : op;
    return ask(mode, a + b, pics, op, T('¿Cuánto es?', 'Quant fa?'), 3); };
}
function genSub(maxA, colum = false) {
  return mode => { const a = r(2, maxA), b = r(1, a - 1), o = pick(OBJ);
    const op = both(a, b, '−', colum ? 0.7 : 0.5);
    const pics = maxA <= 20 ? `<div class="pics sm">${Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? 'gone' : ''}">${o[0]}</span>`).join('')}</div>${op}` : op;
    return ask(mode, a - b, pics, op, T('¿Cuánto queda?', 'Quant en queda?'), 3); };
}
// Qué es multiplicar: filas iguales (como cajas de bloques) = sumar lo mismo varias veces
export const grid = (rows, cols, e = '🟪') => `<div class="arr" style="--c:${cols}">${Array.from({ length: rows * cols }, () => `<span>${e}</span>`).join('')}</div>`;
function genRepeated() {
  return mode => { const rows = r(2, 4), cols = r(2, 5), e = pick(['🟪', '🟦', '🟩', '🟧', '🟥']);
    const sum = Array(rows).fill(cols).join(' + ');
    const show = mode === 0 ? `${grid(rows, cols, e)}<p class="hint">${rows} ${rows === 1 ? 'fila' : 'filas'} × ${cols}</p>${big(`${sum} = ?`)}`
      : mode === 1 ? `${grid(rows, cols, e)}${big(`${rows} × ${cols} = ${sum} = ?`)}` : big(`${rows} × ${cols} = ?`) + `<p class="hint">${sum}</p>`;
    return ask(mode, rows * cols, show, show, T('Multiplicar es sumar lo mismo varias veces. ¿Cuántos hay?', 'Multiplicar és sumar el mateix diverses vegades. Quants n\'hi ha?'), 3); };
}
function genTable(t) {
  return mode => { const tt = t === 'mix' ? r(2, 10) : t, b = r(1, 10), o = pick(OBJ);
    const op = mode === 0 || Math.random() < 0.5 ? both(b, tt, '×') : both(tt, b, '×');
    const show0 = tt * b <= 30 ? `${groups(o[0], b, tt)}${op}` : op;
    return ask(mode, tt * b, show0, op, T('¿Cuánto es?', 'Quant fa?'), Math.max(2, tt)); };
}
function genMul2() {
  return mode => { const a = r(11, 49), b = r(2, 5); const op = both(a, b, '×', 0.7); return ask(mode, a * b, op, op, T('¿Cuánto es?', 'Quant fa?'), 10); };
}
function genShare() {
  return mode => { const g = r(2, 4), each = r(1, 4), n = g * each, o = pick(OBJ);
    const show = mode === 0 ? `${row(o[0], n, 'sm')}<div class="plates">${'<span>🍽️</span>'.repeat(g)}</div>${big(`${n} ÷ ${g} = ?`)}` : big(`${n} ÷ ${g} = ?`);
    return ask(mode, each, show, show, T(`Repartimos entre ${g}. ¿Cuántos le tocan a cada uno?`, `Repartim entre ${g}. Quants en toquen a cadascú?`), 2); };
}
function genDiv(maxT) {
  return mode => { const b = r(2, maxT), q = r(1, 10); return ask(mode, q, big(`${b * q} ÷ ${b} = ?`) + `<p class="hint">${b} × ? = ${b * q}</p>`, big(`${b * q} ÷ ${b} = ?`), T('¿Cuánto es?', 'Quant fa?'), 2); };
}
function genDivRest() {
  return mode => { const b = r(2, 6), q = r(1, 9), rest = r(1, b - 1), n = b * q + rest;
    return ask(mode, rest, big(`${n} ÷ ${b}`) + `<p class="hint">${b} × ${q} = ${b * q}</p>`, big(`${n} ÷ ${b}`), T('¿Cuánto sobra (el resto)?', 'Quant en sobra (el residu)?'), 2); };
}
// fracciones con un pastel dibujado en SVG
const pie = (parts, filled) => { let s = ''; for (let i = 0; i < parts; i++) { const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
  const x0 = 50 + 45 * Math.cos(a0), y0 = 50 + 45 * Math.sin(a0), x1 = 50 + 45 * Math.cos(a1), y1 = 50 + 45 * Math.sin(a1);
  s += `<path d="M50 50 L${x0.toFixed(1)} ${y0.toFixed(1)} A45 45 0 ${parts === 1 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${i < filled ? '#F2A33A' : '#fff'}" stroke="#2B6E8B" stroke-width="2"/>`; }
  return `<svg class="pie" viewBox="0 0 100 100">${s}</svg>`; };
function genFracRead(maxD) {
  return () => { const d = r(2, maxD), n = r(1, d - 1); const ans = `${n}/${d}`; const s = new Set([ans]);
    while (s.size < 3) { const dd = r(2, maxD); s.add(`${r(1, dd - 1)}/${dd}`); }
    return { q: T('¿Qué fracción está pintada?', 'Quina fracció està pintada?'), show: pie(d, n), answer: ans, opts: [...s].sort(() => Math.random() - 0.5) }; };
}
function genFracCompare() {
  return () => { const d = r(3, 8); let a = r(1, d - 1), b = r(1, d - 1); while (a === b) b = r(1, d - 1);
    return { q: T('¿Qué fracción es mayor?', 'Quina fracció és més gran?'), show: `<div class="vs">${pie(d, a)}${pie(d, b)}</div>`, answer: `${Math.max(a, b)}/${d}`, opts: [`${a}/${d}`, `${b}/${d}`] }; };
}
function genFracAdd() {
  return mode => { const d = r(3, 10), a = r(1, d - 2), b = r(1, d - 1 - a); const ans = `${a + b}/${d}`;
    const s = new Set([ans, `${a + b}/${d * 2}`, `${a + b + 1}/${d}`]);
    return { q: T('¿Cuánto es?', 'Quant fa?'), show: big(`${a}/${d} + ${b}/${d} = ?`) + (mode === 0 ? `<div class="vs">${pie(d, a)}<b>+</b>${pie(d, b)}</div>` : ''), answer: ans, opts: [...s].sort(() => Math.random() - 0.5) }; };
}
function genFracOf() {
  return mode => { const d = pick([2, 3, 4, 5]), k = r(1, 5), n = d * k;
    return ask(mode, k, big(`1/${d} de ${n} = ?`) + `<p class="hint">${n} ÷ ${d}</p>`, big(`1/${d} de ${n} = ?`), T('¿Cuánto es?', 'Quant fa?'), 2); };
}
// regla de tres directa con números enteros
function genRule3() {
  return mode => { const o = pick(OBJ), a = r(2, 5), k = r(2, 5), b = r(2, 9); const pa = a * k, ans = b * k;
    return ask(mode, ans, `<div class="r3"><div>${row(o[0], a, 'sm')} → ${pa} €</div><div>${row(o[0], b, 'sm')} → ? €</div></div>`,
      `<div class="r3"><div>${a} → ${pa}</div><div>${b} → ?</div></div>`,
      T(`Si ${nm(o, a).es} cuestan ${pa} €, ¿cuánto cuestan ${nm(o, b).es}?`, `Si ${nm(o, a).ca} costen ${pa} €, quant costen ${nm(o, b).ca}?`), 4); };
}
// problemas con enunciado (nivel avanzado)
function genProblem(kind) {
  return mode => { const o = pick(OBJ); let q, ans;
    if (kind === 'add') { const a = r(2, 9), b = r(1, 9); ans = a + b; q = T(`Tengo ${nm(o, a).es} y me dan ${nm(o, b).es}. ¿Cuántos tengo ahora?`, `Tinc ${nm(o, a).ca} i me'n donen ${nm(o, b).ca}. Quants en tinc ara?`); }
    else if (kind === 'sub') { const a = r(3, 15), b = r(1, a - 1); ans = a - b; q = T(`Tengo ${nm(o, a).es}. Mi hermano se lleva ${b}. ¿Cuántos me quedan?`, `Tinc ${nm(o, a).ca}. El meu germà se n'endú ${b}. Quants me'n queden?`); }
    else if (kind === 'mul') { const a = r(2, 6), b = r(2, 9); ans = a * b; q = T(`Hay ${a} cajas con ${nm(o, b).es} cada una. ¿Cuántos hay en total?`, `Hi ha ${a} capses amb ${nm(o, b).ca} cadascuna. Quants n'hi ha en total?`); }
    else { const g = r(2, 6), each = r(2, 8); ans = each; q = T(`Repartimos ${nm(o, g * each).es} entre ${g} amigos. ¿Cuántos le tocan a cada uno?`, `Repartim ${nm(o, g * each).ca} entre ${g} amics. Quants en toquen a cadascú?`); }
    return { q, answer: ans, show: `<div class="prob">${o[0]}</div>`, opts: mode < 2 ? options(ans, 4, 3) : null, keypad: mode === 2 };
  };
}

const U = (id, es, ca, gen, learned) => ({ id, name: T(es, ca), gen, learned });
export const OPS = [
  { id: 'num', icon: '🔢', color: '#4C9BE8', name: T('Números', 'Nombres'), units: [
    U('num5', 'Contar hasta 5', 'Comptar fins a 5', genCount(5), T('contar hasta 5', 'comptar fins a 5')),
    U('num10', 'Contar hasta 10', 'Comptar fins a 10', genCount(10), T('contar hasta 10', 'comptar fins a 10')),
    U('numcmp', 'Mayor y menor', 'Més gran i més petit', genCompare(10), T('comparar números', 'comparar nombres')),
    U('num20', 'Antes y después (hasta 20)', 'Abans i després (fins a 20)', genNext(1, 20), T('el orden de los números hasta 20', "l'ordre dels nombres fins a 20")),
    U('num100', 'Decenas y unidades', 'Desenes i unitats', genTens(99), T('las decenas y unidades', 'les desenes i unitats')),
    U('num1000', 'Antes y después (hasta 1000)', 'Abans i després (fins a 1000)', genNext(100, 999), T('los números hasta 1000', 'els nombres fins a 1000')),
  ] },
  { id: 'add', icon: '➕', color: '#4CAF7A', name: T('Sumas', 'Sumes'), units: [
    U('add5', 'Sumas hasta 5', 'Sumes fins a 5', genAdd(3, 2), T('sumar hasta 5', 'sumar fins a 5')),
    U('add10', 'Sumas hasta 10', 'Sumes fins a 10', genAdd(5, 5), T('sumar hasta 10', 'sumar fins a 10')),
    U('add20', 'Sumas hasta 20', 'Sumes fins a 20', genAdd(10, 9), T('sumar hasta 20', 'sumar fins a 20')),
    U('add2', 'Sumas de dos cifras', 'Sumes de dues xifres', genAdd(60, 39, true), T('sumar números de dos cifras', 'sumar nombres de dues xifres')),
    U('add3', 'Sumas de tres cifras', 'Sumes de tres xifres', genAdd(600, 399, true), T('sumar números de tres cifras', 'sumar nombres de tres xifres')),
    U('addp', 'Problemas de sumar', 'Problemes de sumar', genProblem('add'), T('resolver problemas de sumar', 'resoldre problemes de sumar')),
  ] },
  { id: 'sub', icon: '➖', color: '#E8774C', name: T('Restas', 'Restes'), units: [
    U('sub5', 'Restas hasta 5', 'Restes fins a 5', genSub(5), T('restar hasta 5', 'restar fins a 5')),
    U('sub10', 'Restas hasta 10', 'Restes fins a 10', genSub(10), T('restar hasta 10', 'restar fins a 10')),
    U('sub20', 'Restas hasta 20', 'Restes fins a 20', genSub(20), T('restar hasta 20', 'restar fins a 20')),
    U('sub2', 'Restas de dos cifras', 'Restes de dues xifres', genSub(99, true), T('restar números de dos cifras', 'restar nombres de dues xifres')),
    U('sub3', 'Restas de tres cifras', 'Restes de tres xifres', genSub(999, true), T('restar números de tres cifras', 'restar nombres de tres xifres')),
    U('subp', 'Problemas de restar', 'Problemes de restar', genProblem('sub'), T('resolver problemas de restar', 'resoldre problemes de restar')),
  ] },
  { id: 'mul', icon: '✖️', color: '#9B6BD3', name: T('Multiplicaciones', 'Multiplicacions'), units: [
    U('mulc', 'Qué es multiplicar: filas iguales', 'Què és multiplicar: files iguals', genRepeated(), T('que multiplicar es sumar lo mismo varias veces', 'que multiplicar és sumar el mateix diverses vegades')),
    // primero las tablas con patrón fácil (de 2 en 2, de 5 en 5, de 10 en 10)
    ...[2, 5, 10, 1, 3, 4, 6, 7, 8, 9].map(t => U('t' + t, `La tabla del ${t}`, `La taula del ${t}`, genTable(t), T(`la tabla del ${t}`, `la taula del ${t}`))),
    U('tmix', 'Todas las tablas mezcladas', 'Totes les taules barrejades', genTable('mix'), T('todas las tablas', 'totes les taules')),
    U('mul2', 'Multiplicar dos cifras', 'Multiplicar dues xifres', genMul2(), T('multiplicar números de dos cifras', 'multiplicar nombres de dues xifres')),
    U('mulp', 'Problemas de multiplicar', 'Problemes de multiplicar', genProblem('mul'), T('resolver problemas de multiplicar', 'resoldre problemes de multiplicar')),
  ] },
  { id: 'div', icon: '➗', color: '#D35B8E', name: T('Divisiones', 'Divisions'), units: [
    U('share', 'Repartir', 'Repartir', genShare(), T('repartir a partes iguales', 'repartir a parts iguals')),
    U('div5', 'Dividir con las tablas hasta el 5', 'Dividir amb les taules fins al 5', genDiv(5), T('dividir con las tablas hasta el 5', 'dividir amb les taules fins al 5')),
    U('div10', 'Dividir con todas las tablas', 'Dividir amb totes les taules', genDiv(10), T('dividir con todas las tablas', 'dividir amb totes les taules')),
    U('divr', 'Divisiones con resto', 'Divisions amb residu', genDivRest(), T('las divisiones con resto', 'les divisions amb residu')),
    U('divp', 'Problemas de dividir', 'Problemes de dividir', genProblem('div'), T('resolver problemas de dividir', 'resoldre problemes de dividir')),
  ] },
  { id: 'frac', icon: '🍕', color: '#F2A33A', name: T('Fracciones', 'Fraccions'), units: [
    U('fr4', 'Medios, tercios y cuartos', 'Meitats, terços i quarts', genFracRead(4), T('reconocer medios, tercios y cuartos', 'reconèixer meitats, terços i quarts')),
    U('fr8', 'Leer fracciones', 'Llegir fraccions', genFracRead(8), T('leer fracciones', 'llegir fraccions')),
    U('frcmp', 'Comparar fracciones', 'Comparar fraccions', genFracCompare(), T('comparar fracciones', 'comparar fraccions')),
    U('fradd', 'Sumar fracciones', 'Sumar fraccions', genFracAdd(), T('sumar fracciones con el mismo denominador', 'sumar fraccions amb el mateix denominador')),
    U('frof', 'La fracción de un número', "La fracció d'un nombre", genFracOf(), T('calcular la fracción de un número', "calcular la fracció d'un nombre")),
  ] },
  { id: 'r3', icon: '⚖️', color: '#2B6E8B', name: T('Regla de tres', 'Regla de tres'), units: [
    U('r3a', 'Si 1 cuesta…, ¿cuánto cuestan…?', 'Si 1 costa…, quant costen…?', genRule3(), T('la regla de tres', 'la regla de tres')),
  ] },
];
export const opById = id => OPS.find(o => o.id === id);
export const LESSONS_PER_UNIT = 3;
export const QUESTIONS = 8;
// repaso: preguntas de unidades ya hechas que vuelven a aparecer
export function reviewGen(op, unitIdx) { if (unitIdx === 0) return null; const u = op.units[r(0, unitIdx - 1)]; return u.gen; }
