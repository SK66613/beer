(function(){
  'use strict';
  if (window.__BEST_OFFLINE_ENSURE__) return; window.__BEST_OFFLINE_ENSURE__ = true;

  const KEY_PF = 'beer_profile_cache_v1';
  const KEY_STATE = 'beer_state_v2';
  const FBK = (typeof FLAPPY_BEST!=='undefined' ? FLAPPY_BEST : 'flappy_best');

  function getJSON(k){
    try{ return JSON.parse(localStorage.getItem(k)||'null') || null; }catch(_){ return null; }
  }
  function setTextById(id, val){
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(val!=null ? val : 0);
  }
  function computeBest(){
    var pf = getJSON(KEY_PF) || {};
    var st = getJSON(KEY_STATE) || {};
    var best = Number(pf.best||0);
    if (!best) best = Number(st.my_best_score||0);
    if (!best){
      try{ best = Number(localStorage.getItem(FBK)||0); }catch(_){ best = 0; }
    }
    if (best>0){
      // persist back for future offline
      try{
        pf.best = best;
        localStorage.setItem(KEY_PF, JSON.stringify(pf));
        var lsBest = Number(localStorage.getItem(FBK)||0);
        if (best > lsBest) localStorage.setItem(FBK, String(best));
      }catch(_){}
    }
    return best||0;
  }
  function ensure(){
    var best = computeBest();
    setTextById('pf-flappy-best', best);
  }

  // Hook non-destructively after existing renders
  var _apply = window.applyServerState;
  window.applyServerState = function(st){
    try{ if (typeof _apply === 'function') return _apply(st); }
    finally { try{ ensure(); }catch(_){ } }
  };

  var _renderFlappy = window.renderFlappy;
  window.renderFlappy = function(){
    try{ if (typeof _renderFlappy === 'function') _renderFlappy(); }
    finally { try{ ensure(); }catch(_){ } }
  };

  // Run on boot and on focus
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensure, {once:true});
  } else {
    ensure();
  }
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) ensure(); });
})();