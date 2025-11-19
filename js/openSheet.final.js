(function(){
  // Final openSheet hook — load this file LAST across your scripts!
  // It keeps existing behavior and adds:
  //  - Passport paint on open
  //  - Quiz mount with a safety check to avoid double-mounts
  const prev = window.openSheet;

  window.openSheet = function(opts){
    try { if (typeof prev === 'function') prev(opts); } catch(e){ console.warn('[final openSheet] prev failed', e); }
    const title = (opts && (opts.title || '')) + '';

    // --- Passport Styles: repaint badges every open
    try {
      if (/паспорт/i.test(title)){
        const st = (window.MiniState || (window.SWR && window.SWR.get && window.SWR.get()) || {});
        if (typeof window.paintBadgesMaybe === 'function') window.paintBadgesMaybe(st);
      }
    } catch(e){ console.warn('[final openSheet] passport paint error', e); }

    // --- Trivia Quiz: mount fresh, but avoid double calls if someone else already did
    try {
      if (/викторин/i.test(title) && typeof window.mountTrivia === 'function'){
        // micro-delay to let earlier hooks update the UI first
        setTimeout(function(){
          try {
            const start = document.getElementById('trivia-start');
            const btn   = start && start.querySelector('[data-action="trivia-start"]');
            const txt   = (btn && (btn.textContent || btn.innerText || '')).trim();

            // If another hook already triggered a "fresh check", btn text should be "Проверяем статус…"
            // Only call mountTrivia if we DON'T see that state.
            if (!/Проверяем статус/i.test(txt)){
              window.mountTrivia(true);
            }
          } catch(e){ console.warn('[final openSheet] trivia mount inner error', e); }
        }, 0);
      }
    } catch(e){ console.warn('[final openSheet] trivia error', e); }
  };
})();