// src/utils/devToolsBlocker.js

export function initDevToolsBlocker() {
  const REDIRECT = '/';

  function goHome() {
    if (window.location.pathname !== REDIRECT) {
      window.location.replace(REDIRECT);
    } else {
      window.location.reload();
    }
  }

  // ── Metodă 1: Image getter (cea mai fiabilă, nu afectează userii normali) ──
  // Funcționează DOAR când consola DevTools e deschisă și afișează obiecte.
  function setupImageTrap() {
    const img = new Image();
    let triggered = false;
    Object.defineProperty(img, 'id', {
      get() {
        if (!triggered) {
          triggered = true;
          goHome();
        }
        return '';
      },
    });
    // eslint-disable-next-line no-console
    console.log('%c', img);
  }

  // Rulează o dată la start și la fiecare 3 secunde
  setupImageTrap();
  setInterval(() => {
    // eslint-disable-next-line no-console
    console.clear();
    setupImageTrap();
  }, 3000);

  // ── Metodă 2: Dimensiunea ferestrei — threshold MARE ca să nu afecteze userii
  // Folosim 200px în loc de 100px — DevTools ocupă mult mai mult de 200px
  function checkWindowSize() {
    const wDiff = window.outerWidth  - window.innerWidth;
    const hDiff = window.outerHeight - window.innerHeight;
    // 200px threshold — scrollbar + UI chrome e max ~20px, DevTools e 300px+
    if (wDiff > 200 || hDiff > 200) {
      goHome();
    }
  }

  window.addEventListener('resize', checkWindowSize);
  setInterval(checkWindowSize, 1000); // la fiecare secundă, nu 500ms

  // ── Metodă 3: Blochează shortcut-uri DevTools ──────────────────────────────
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, true);

  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault(); return false;
    }
    if (ctrl && e.shiftKey && ['I','J','C','K','i','j','c','k'].includes(e.key)) {
      e.preventDefault(); return false;
    }
    if (ctrl && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault(); return false;
    }
  }, true);

  // ── Metodă 4: Blochează selecția de text ──────────────────────────────────
  document.addEventListener('selectstart', (e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) return;
    e.preventDefault();
  });

  // ── Metodă 5: Timing detection — threshold MARE (5s) ca să nu afecteze mobile
  let lastTime = Date.now();
  setInterval(() => {
    const now     = Date.now();
    const elapsed = now - lastTime;
    // 5000ms în loc de 2000ms — mobile poate fi lent fără DevTools
    if (elapsed > 5000) {
      goHome();
    }
    lastTime = now;
  }, 1000);
}