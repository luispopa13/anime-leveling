// src/utils/devToolsBlocker.js
// Detectează DevTools prin 5 metode independente și redirecționează la /

export function initDevToolsBlocker() {
  const REDIRECT = '/';

  function goHome() {
    if (window.location.pathname !== REDIRECT) {
      window.location.replace(REDIRECT);
    } else {
      // Dacă suntem deja la /, reîncarcă pagina ca să ascundă orice conținut
      window.location.reload();
    }
  }

  // ── Metodă 1: Image getter (cea mai fiabilă pentru console) ────────────────
  // Când DevTools e deschis și consola afișează un obiect, apelează getters.
  // Această metodă funcționează în Chrome, Firefox, Edge.
  function setupImageTrap() {
    const img = new Image();
    Object.defineProperty(img, 'id', {
      get() {
        goHome();
      },
    });
    // eslint-disable-next-line no-console
    console.log(img);
  }
  setupImageTrap();

  // Re-triggere la fiecare 2 secunde
  setInterval(() => {
    // eslint-disable-next-line no-console
    console.clear();
    setupImageTrap();
  }, 2000);

  // ── Metodă 2: Detectare prin dimensiunea ferestrei ─────────────────────────
  // DevTools deschis lateral sau jos schimbă innerWidth/innerHeight.
  // Threshold mic (100px) ca să prindă și ferestre mici de DevTools.
  const W_THRESHOLD = 100;
  const H_THRESHOLD = 100;

  function checkWindowSize() {
    const wDiff = window.outerWidth  - window.innerWidth;
    const hDiff = window.outerHeight - window.innerHeight;
    if (wDiff > W_THRESHOLD || hDiff > H_THRESHOLD) {
      goHome();
    }
  }

  window.addEventListener('resize', checkWindowSize);
  setInterval(checkWindowSize, 500);

  // ── Metodă 3: Blochează toate shortcut-urile și click-dreapta ──────────────
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl/Cmd + Shift + I/J/C/K (DevTools shortcuts)
    if (ctrl && e.shiftKey && ['I','J','C','K','i','j','c','k'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl + U (View Source)
    if (ctrl && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl + S (Save)
    if (ctrl && (e.key === 's' || e.key === 'S')) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    // Ctrl + P (Print - poate expune sursa)
    if (ctrl && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, true);

  // ── Metodă 4: Detectare prin devtools chrome extension protocol ────────────
  // Chrome DevTools schimbă window.outerHeight când e deschis în modul separat
  let lastHeight = window.outerHeight;
  let lastWidth  = window.outerWidth;

  setInterval(() => {
    const hChanged = Math.abs(window.outerHeight - lastHeight) > 50;
    const wChanged = Math.abs(window.outerWidth  - lastWidth)  > 50;

    if (hChanged || wChanged) {
      lastHeight = window.outerHeight;
      lastWidth  = window.outerWidth;
      // Dacă s-a schimbat brusc → posibil DevTools deschis/închis
      setTimeout(checkWindowSize, 100);
    }
  }, 500);

  // ── Metodă 5: Detectare prin firebug / console.profiles ───────────────────
  // Unele browsere expun console.profiles când DevTools e activ
  setInterval(() => {
    if (
      (window.console && window.console.profiles &&
       window.console.profiles.length > 0) ||
      (window.Firebug &&
       window.Firebug.chrome &&
       window.Firebug.chrome.isInitialized)
    ) {
      goHome();
    }
  }, 1000);

  // ── Metodă 6: Blochează selecția de text (previne copy-paste din sursa) ────
  document.addEventListener('selectstart', (e) => {
    // Permite selecția în input-uri și textarea
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) return;
    e.preventDefault();
  });

  // ── Metodă 7: Detectare prin erori de timing (debugger statement) ──────────
  // Dacă DevTools e deschis cu "Pause on exceptions" activ,
  // sau dacă userul a pus un breakpoint, timing-ul se schimbă.
  let lastTime = Date.now();
  setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastTime;
    // Dacă intervalul de 500ms a durat mult mai mult (debugging pauze)
    if (elapsed > 2000) {
      goHome();
    }
    lastTime = now;
  }, 500);
}