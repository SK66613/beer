(function(){
  'use strict';
  if (window.__SHEET_REPAINT_SAFE__) return; window.__SHEET_REPAINT_SAFE__ = true;
  let throttle = false;
  function repaintOnce(){
    if (throttle) return;
    throttle = true;
    requestAnimationFrame(function(){
      try{
        const st = window.MiniState || (window.SWR && window.SWR.get && window.SWR.get()) || {};
        if (typeof window.paintBadgesFromState === 'function'){
          window.paintBadgesFromState(st);
        }
      }catch(_){}
      throttle = false;
    });
  }
  const mo = new MutationObserver(function(muts){
    // Only react when nodes are added into sheet (open or tab switch), ignore class flips on .pslot
    for (const m of muts){
      if (m.type === 'childList'){
        if ((m.target && (m.target.id === 'sheet' || (m.target.closest && m.target.closest('#sheet')))) ||
            (document.getElementById('passport-grid') || document.querySelector('#sheet .pslot'))){
          repaintOnce();
          break;
        }
      }
    }
  });
  try{
    const sheet = document.getElementById('sheet') || document.body;
    mo.observe(sheet, {subtree:true, childList:true}); // no attribute watching to avoid loops
  }catch(_){}
})();