(function(){
  // Final openSheet hook v2 — load this file LAST.
  // Always remounts Quiz on open to avoid stale HTML from template.
  const prev = window.openSheet;

  window.openSheet = function(opts){
    try { if (typeof prev === 'function') prev(opts); } catch(e){ console.warn('[final openSheet v2] prev failed', e); }

    const title = (opts && (opts.title || '')) + '';
    const tpl   = (opts && (opts.tpl   || '')) + '';

    // --- Passport Styles: repaint badges every open
    try {
      if (/паспорт/i.test(title)){
        const st = (window.MiniState || (window.SWR && window.SWR.get && window.SWR.get()) || {});
        if (typeof window.paintBadgesMaybe === 'function') window.paintBadgesMaybe(st);
      }
    } catch(e){ console.warn('[final openSheet v2] passport paint error', e); }

    // --- Trivia Quiz: ALWAYS remount fresh on open
    try {
      if ((/(викторин|квиз)/i).test(title) || /tpl-trivia/i.test(tpl)){
        if (typeof window.mountTrivia === 'function'){
          // Use rAF to ensure template DOM is in place
          requestAnimationFrame(function(){
            try {
              window.mountTrivia(true);
              console.log('[final openSheet v2] trivia mounted fresh');
            } catch(e){ console.warn('[final openSheet v2] trivia mount error', e); }
          });
        }
      }
    } catch(e){ console.warn('[final openSheet v2] trivia error', e); }
  };
})();
