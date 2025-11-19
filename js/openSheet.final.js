(function(){
  const prev = window.openSheet;
  window.openSheet = function(opts){
    try{ typeof prev==='function' && prev(opts); }catch(e){}
    const title = (opts && (opts.title||'')) + '';
    const tpl   = (opts && (opts.tpl||'')) + '';

    // Паспорт
    try{
      if (/паспорт/i.test(title)){
        const st = (window.MiniState || (window.SWR && window.SWR.get && window.SWR.get()) || {});
        typeof window.paintBadgesMaybe==='function' && window.paintBadgesMaybe(st);
      }
    }catch(e){}

    // Квиз
    try{
      if ((/(викторин|квиз)/i.test(title)) || /tpl-trivia/i.test(tpl)){
        if (typeof window.mountTrivia==='function'){
          setTimeout(function(){
            try{
              const btn = document.querySelector('#trivia-start [data-action="trivia-start"]');
              const txt = (btn && (btn.textContent||btn.innerText||'')).trim();
              if (!/Проверяем статус/i.test(txt)) window.mountTrivia(true);
            }catch(e){}
          },0);
        }
      }
    }catch(e){}
  };
})();
