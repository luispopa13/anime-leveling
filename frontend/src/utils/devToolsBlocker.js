// src/utils/devToolsBlocker.js

export function initDevToolsBlocker() {
  const REDIRECT = '/';

  // ── Sterge iframe-urile din DOM si redirecteaza ────────────────────────────
  function onDevToolsDetected() {
    // Sterge toate iframe-urile din pagina
    document.querySelectorAll('iframe').forEach(f => f.remove());
    
    // Sterge si containerele care ar putea contine iframe
    document.querySelectorAll('[class*="player"], [class*="modal"], [class*="watch"]')
      .forEach(el => el.remove());

    // Redirecteaza dupa 100ms (timp sa se stearga DOM-ul)
    setTimeout(() => {
      if (window.location.pathname !== REDIRECT) {
        window.location.replace(REDIRECT);
      } else {
        window.location.reload();
      }
    }, 100);
  }

  // ── Metodă 1: Image getter — cea mai fiabila ───────────────────────────────
  let devToolsOpen = false;

  function checkDevTools() {
    const threshold = 160;
    const img = new Image();
    Object.defineProperty(img, 'id', {
      get() {
        if (!devToolsOpen) {
          devToolsOpen = true;
          onDevToolsDetected();
        }
        return '';
      },
    });
    // eslint-disable-next-line no-console
    console.log('%c', img);
  }

  setInterval(() => {
    // eslint-disable-next-line no-console
    console.clear();
    checkDevTools();
  }, 1000);

  // ── Metodă 2: Dimensiunea ferestrei ───────────────────────────────────────
  function checkWindowSize() {
    const wDiff = window.outerWidth  - window.innerWidth;
    const hDiff = window.outerHeight - window.innerHeight;
    if (wDiff > 200 || hDiff > 200) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        onDevToolsDetected();
      }
    } else {
      devToolsOpen = false; // resetam daca s-a inchis
    }
  }

  window.addEventListener('resize', checkWindowSize);
  setInterval(checkWindowSize, 1000);

  // ── Metodă 3: Shortcut-uri ────────────────────────────────────────────────
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, true);

  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      onDevToolsDetected();
      return false;
    }
    if (ctrl && e.shiftKey && ['I','J','C','K','i','j','c','k'].includes(e.key)) {
      e.preventDefault();
      onDevToolsDetected();
      return false;
    }
    if (ctrl && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      return false;
    }
  }, true);

  // ── Metodă 4: Timing detection ────────────────────────────────────────────
  let lastTime = Date.now();
  setInterval(() => {
    const now     = Date.now();
    const elapsed = now - lastTime;
    if (elapsed > 5000) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        onDevToolsDetected();
      }
    }
    lastTime = now;
  }, 1000);

  // ── Metodă 5: Blochează selectstart ──────────────────────────────────────
  document.addEventListener('selectstart', (e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) return;
    e.preventDefault();
  });
}