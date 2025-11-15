(function(){
  'use strict';
  if (window.__CACHE_OFFLINE_BOOST__) return; window.__CACHE_OFFLINE_BOOST__ = true;

  const KEY_STATE = 'beer_state_v2';
  const KEY_PF    = 'beer_profile_cache_v1';

  function $(s){ return document.querySelector(s); }
  function lsGet(k, d){ try{ return JSON.parse(localStorage.getItem(k)||'null') ?? d; }catch(_){ return d; } }

  function setIf(el, val){ if (el && val!=null && val!==undefined && val!=='') el.textContent = String(val); }

  function offlinePaint(){
    // Prefer profile snapshot
    const c = lsGet(KEY_PF, null) || {};
    const st = lsGet(KEY_STATE, {}) || {};

    // === Шмель — лучший счёт ===
    // Priority: cached profile.best -> state.my_best_score -> local flappy_best
    let best = c.best;
    if (best==null || best===0){
      best = (st.my_best_score!=null ? st.my_best_score : undefined);
    }
    if (best==null || best===0){
      try{ best = +(localStorage.getItem('flappy_best')||0)|0; }catch(_){}
    }
    setIf($('#pf-flappy-best'), best);

    // === Рефералы ===
    // Priority: profile snapshot.refs -> state.ref_total/ref_count -> beer_refs_v1 list length
    let refs = c.refs;
    if (refs==null){
      refs = (st.ref_total!=null ? st.ref_total : (st.ref_count!=null ? st.ref_count : undefined));
    }
    if (refs==null){
      try{
        const raw = localStorage.getItem('beer_refs_v1');
        const arr = raw ? JSON.parse(raw) : [];
        refs = Array.isArray(arr) ? arr.length : 0;
      }catch(_){ refs = 0; }
    }
    const elRefs = document.getElementById('pf-refs-count');
    if (elRefs) elRefs.textContent = String(refs);

    // === Последний штамп ===
    // Read from profile snapshot.last; if absent, fallback to state.last_stamp_name/id
    let last = c.last;
    if (!last){
      last = st.last_stamp_name || st.last_stamp_id || '';
    }
    // Prefer #pf-pass-list; fallback to #pf-last-stamp if exists
    const elPassList = $('#pf-pass-list');
    if (elPassList){ setIf(elPassList, last || '—'); }
    else { setIf($('#pf-last-stamp'), last || '—'); }
  }

  // Run immediately (cache-first) and on visibility regain
  try{ offlinePaint(); }catch(_){}
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden){ try{ offlinePaint(); }catch(_){ } }
  });
})();