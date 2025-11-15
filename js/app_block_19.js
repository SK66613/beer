(function(){
  'use strict';
  if (window.__CACHE_SWR_PATCH__) return; window.__CACHE_SWR_PATCH__ = true;

  const KEY_STATE = 'beer_state_v2';
  const KEY_PF    = 'beer_profile_cache_v1';
  const KEY_P1    = 'beer_passport_v1';
  const KEY_P2    = 'beer_passport';

  function $(s){ return document.querySelector(s); }
  function $all(s){ return Array.from(document.querySelectorAll(s)); }
  function lsGet(k, d){ try{ return JSON.parse(localStorage.getItem(k)||'null') ?? d; }catch(_){ return d; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){ } }
  function text(el, v){ if (el) el.textContent = String(v); }

  function legacyToList(obj){
    if (!obj) return [];
    if (Array.isArray(obj.styles)) return obj.styles;
    if (Array.isArray(obj.stamps)) return obj.stamps;
    if (typeof obj==='object') return Object.keys(obj);
    return [];
  }
  function cachedStyles(){
    const a1 = legacyToList(lsGet(KEY_P1, {stamps:[]}));
    const a2 = legacyToList(lsGet(KEY_P2, {}));
    return Array.from(new Set([ ...a1, ...a2 ].map(x=>String(x||'').toLowerCase())));
  }
  function stylesFromState(st){
    const s = Array.isArray(st?.styles) ? st.styles : (Array.isArray(st?.styles_user) ? st.styles_user : []);
    return (s||[]).map(x=>String(x).toLowerCase());
  }
  function stylesUnion(st){ return Array.from(new Set([ ...stylesFromState(st||{}), ...cachedStyles() ])); }

  function computeMyRanks(st){
    try{
      const TG = (window.Telegram && window.Telegram.WebApp) || null;
      const uid   = String(TG?.initDataUnsafe?.user?.id || '');
      const uname = String(TG?.initDataUnsafe?.user?.username || '');
      const today = Array.isArray(st?.leaderboard_today)   ? st.leaderboard_today   : [];
      const all   = Array.isArray(st?.leaderboard_alltime) ? st.leaderboard_alltime : [];
      const isMe  = r => String(r.tg_id||r.uid||'')===uid || (uname && r.username===uname);
      const ixToday = today.findIndex(isMe);
      const ixAll   = all.findIndex(isMe);
      const bestAll = Math.max(0, ...all.filter(isMe).map(r => (r.best_score!=null?r.best_score:r.score)|0));
      return {
        rankToday: ixToday>=0 ? ixToday+1 : '—',
        rankAll:   ixAll>=0   ? ixAll+1   : '—',
        best:      (st?.my_best_score|0) || bestAll || (+(localStorage.getItem('flappy_best')||0)|0) || 0
      };
    }catch(_){ return {rankToday:'—',rankAll:'—',best:0}; }
  }

  // Provide a painter if not present, but don't clobber existing one
  window.paintBadgesFromState = window.paintBadgesFromState || function(st){
    const owned = new Set(stylesUnion(st));
    const upd = (card)=>{
      const code = String(card.getAttribute('data-style-id')||card.getAttribute('data-code')||'').trim().toLowerCase();
      const ok = !!(code && owned.has(code));
      card.classList.toggle('is-done', ok);
      if (ok) card.setAttribute('aria-disabled','true');
      const b = card.querySelector('.pslot__badge, .pslot-badge, [data-role="pslot-badge"]');
      if (b) b.textContent = ok ? 'Получен' : 'Получить';
    };
    $all('#passport-grid .pslot').forEach(upd);
    $all('#sheet .pslot[data-style-id], #sheet .pslot[data-code]').forEach(upd);

    const total = Number((window.MiniState?.styles_total)||6);
    const cntEl = $('#pf-pass-count'); if (cntEl) cntEl.textContent = `${owned.size}/${total}`;
    const lastEl= $('#pf-last-stamp'); if (lastEl) lastEl.textContent = window.MiniState?.last_stamp_name || window.MiniState?.last_stamp_id || lastEl.textContent || '—';
  };

  function paintProfileFromState(st){
    if (typeof st?.coins === 'number') text($('#pf-coins'), st.coins|0);
    const refs = Number(st?.ref_total || st?.ref_count || st?.refs || 0); text($('#pf-refs-count'), refs);
    const ranks = computeMyRanks(st);
    text($('#pf-today-rank'), ranks.rankToday);
    text($('#pf-all-rank'),   ranks.rankAll);
    text($('#pf-flappy-best'), ranks.best);
    window.paintBadgesFromState(st);
    lsSet(KEY_PF, {
      coins:(st?.coins|0), refs,
      rankToday:ranks.rankToday, rankAll:ranks.rankAll, best:ranks.best,
      passCount: ($('#pf-pass-count')?.textContent)||null,
      last: ($('#pf-last-stamp')?.textContent)||null
    });
  }

  function paintProfileFromCache(){
    const c = lsGet(KEY_PF,null); if (!c) return;
    if (c.coins!=null) text($('#pf-coins'), c.coins);
    if (c.refs!=null)  text($('#pf-refs-count'), c.refs);
    if (c.rankToday!=null) text($('#pf-today-rank'), c.rankToday);
    if (c.rankAll!=null)   text($('#pf-all-rank'), c.rankAll);
    if (c.best!=null)      text($('#pf-flappy-best'), c.best);
    if (c.passCount){ const el=$('#pf-pass-count'); if (el) el.textContent=c.passCount; }
    if (c.last){ const el=$('#pf-last-stamp'); if (el) el.textContent=c.last; }
    window.paintBadgesFromState(window.MiniState||lsGet(KEY_STATE,{}));
  }

  const prevApply = window.applyServerState;
  window.applyServerState = function(state){
    try{
      if (state && state.ok!==false){
        const prev = lsGet(KEY_STATE, {});
        const merged = Object.assign({}, prev, state, { _ver: Number(state.kv_ver||Date.now()) });
        lsSet(KEY_STATE, merged);
        paintProfileFromState(merged);
      }
    }catch(_){}
    try{ return prevApply && prevApply(state); }catch(_){}
  };

  // Boot: cache-first
  (function(){
    const swr = lsGet(KEY_STATE, null);
    if (swr && Object.keys(swr).length){
      window.MiniState = Object.assign({}, window.MiniState||{}, swr);
      paintProfileFromState(swr);
    }else{
      paintProfileFromCache();
    }
    try{ window.renderLeaderboard && window.renderLeaderboard(); }catch(_){}
  })();

})();