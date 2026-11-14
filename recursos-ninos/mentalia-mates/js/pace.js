// Velocidad de los juegos (🐢 lento · normal · 🐇 rápido): alarga las esperas y no corta la voz a medias
const KEY = 'mm-speed';
export const SPEEDS = [{ id: 'slow', f: 2, es: '🐢 Más lento', ca: '🐢 Més lent' }, { id: 'mid', f: 1.4, es: 'Normal', ca: 'Normal' }, { id: 'fast', f: 0.8, es: '🐇 Más rápido', ca: '🐇 Més ràpid' }];
export function speedId() { try { return localStorage.getItem(KEY) || 'mid'; } catch { return 'mid'; } }
export function setSpeed(id) { try { localStorage.setItem(KEY, id); } catch { /* nada */ } }
export const factor = () => (SPEEDS.find(s => s.id === speedId()) || SPEEDS[1]).f;
// espera ms × velocidad y, además, a que la voz termine la frase (máx. 10 s)
export function later(fn, ms = 0) {
  return setTimeout(() => {
    const t0 = Date.now();
    const go = () => { let busy = false; try { busy = speechSynthesis.speaking; } catch { /* sin voz */ } if (busy && Date.now() - t0 < 10000) setTimeout(go, 200); else fn(); };
    go();
  }, ms * factor());
}
