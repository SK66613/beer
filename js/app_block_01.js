// === KV-first: in-memory localStorage shim (no persistent cache) ===
(function(){
  try{
    const mem = new Map();
    const real = window.localStorage;
    const passthrough = new Set(["beer_state_v2", "beer_coins", "bonus_log_v1", "beer_rewards", "beer_passport", "beer_passport_v1", "leaderboard_cache", "beer_profile_cache_v1", "flappy_best", "beer_refs_v1", "beer_profile_cache_v1", "flappy_best", "beer_refs_v1"]); // add keys if you need persistence

    const _set = real.setItem.bind(real);
    const _get = real.getItem.bind(real);
    const _rem = real.removeItem.bind(real);
    const _clr = real.clear.bind(real);

    Object.defineProperties(window.localStorage, {
      setItem: { value: function(k,v){ if (passthrough.has(k)) return _set(k,v); mem.set(String(k), String(v)); } },
      getItem: { value: function(k){ if (passthrough.has(k)) return _get(k); return mem.has(String(k)) ? mem.get(String(k)) : null; } },
      removeItem: { value: function(k){ mem.delete(String(k)); if (passthrough.has(k)) _rem(k); } },
      clear: { value: function(){ mem.clear(); if (passthrough.size>0) _clr(); } }
    });
  }catch(_){}
})();

