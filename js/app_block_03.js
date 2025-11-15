// --- SWR: persistent cache + bootstrap (stale-while-revalidate) ---
(function(){
  const KEY = 'beer_state_v2';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(_){ return {}; } }
  function save(st){
    if (!st || st.ok===false) return;
    try{
      const cur = load();
      const merged = Object.assign({}, cur, st);
      merged._ver = Number(st.kv_ver || Date.now());
      localStorage.setItem(KEY, JSON.stringify(merged));
    }catch(_){}
  }
  function ver(){ const s = load(); return Number(s.kv_ver || s._ver || 0); }
  window.SWR = { get: load, save, ver, KEY };

  // Bootstrap UI instantly from cache (if present)
  try{
    const st = load();
    if (st && Object.keys(st).length){
      window.MiniState = Object.assign({}, window.MiniState||{}, st);
      try{ if (typeof paintProfile==='function') paintProfile(st); }catch(_){}
      try{ if (typeof paintBadgesFromState==='function') paintBadgesFromState(st); }catch(_){}
      try{ if (typeof renderLeaderboard==='function') renderLeaderboard(); }catch(_){}
    }
  }catch(_){}

  // Wrap applyServerState to persist fresh state then render
  try{
    const prev = window.applyServerState;
    window.applyServerState = function(state){
      if (!state || state.ok===false) return;
      try{ save(state); }catch(_){}
      if (typeof prev === 'function') return prev(state);
    };
  }catch(_){}
})();