(function(){
  // --- config
  const API_BASE = window.API_BASE || (window.__API_BASE || "");
  const TG = (window.Telegram && window.Telegram.WebApp) || null;
  const PIN_CODE = (window.DEMO_PIN || '1111');

  // --- state gates
  let KV_VER = 0;
  let CURRENT_LB = (window.CURRENT_LB || 'today');
  let pinOkSession = false; // PIN спрашиваем один раз за сессию

  // --- small helpers
  function jpost(path, body){
    return fetch((API_BASE||'') + path, {
      method:'POST',
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
      cache:'no-store',
      body: JSON.stringify(body||{})
    }).then(r=>r.json()).catch(()=>({ok:false, error:'net'}));
  }
  function getTgInit(){
    try { return TG && TG.initData ? TG.initData : ''; } catch(_){ return ''; }
  }
  function showOk(msg){
    try { if (TG && TG.showPopup) TG.showPopup({message: msg||'ОК'}); else console.log(msg||'ОК'); } catch(_){}
  
  // --- cache helpers for passport (support both v1 and legacy map)
  function getCachedStyles(){
    try{
      const v1 = JSON.parse(localStorage.getItem('beer_passport_v1')||'null');
      if (v1 && Array.isArray(v1.stamps)) return v1.stamps.map(s=>String(s).toLowerCase());
    }catch(_){}
    try{
      const legacy = JSON.parse(localStorage.getItem('beer_passport')||'null');
      if (legacy){
        if (Array.isArray(legacy)) return legacy.map(s=>String(s).toLowerCase());
        if (typeof legacy==='object'){
          return Object.keys(legacy).filter(k=>legacy[k]).map(s=>String(s).toLowerCase());
        }
      }
    }catch(_){}
    return [];
  }
  function cacheStyles(arr){
    arr = Array.from(new Set((arr||[]).map(x=>String(x).toLowerCase())));
    try{ localStorage.setItem('beer_passport_v1', JSON.stringify({stamps: arr})); }catch(_){}
    try{
      const map = {}; arr.forEach(s=>map[s]=1);
      localStorage.setItem('beer_passport', JSON.stringify(map));
    }catch(_){}
    return arr;
  }
  function cacheAdd(code){
    code = String(code||'').toLowerCase().trim();
    if (!code) return;
    const arr = getCachedStyles();
    if (!arr.includes(code)) arr.push(code);
    cacheStyles(arr);
  }
}
  function ensureLbButtons(){
    document.querySelectorAll('.lb-seg button, .lb-seg [role="button"], .js-lb-mode').forEach(btn=>{
      const t = (btn.textContent||'').trim().toLowerCase();
      if (!btn.hasAttribute('data-lb-tab')){
        if (btn.classList.contains('js-lb-mode')){
          const m=(btn.dataset.mode||'').toLowerCase();
          btn.setAttribute('data-lb-tab', m==='all'?'all':'today');
        }else{
          if (t==='день'||t==='day') btn.setAttribute('data-lb-tab','today');
          if (t==='все'||t==='all')  btn.setAttribute('data-lb-tab','all');
        }
      }
      btn.setAttribute('role','button'); btn.setAttribute('tabindex','0'); btn.style.pointerEvents='auto';
    });
  }
  function updateLbSeg(){
    document.querySelectorAll('[data-lb-tab]').forEach(b=>{
      const on = (b.getAttribute('data-lb-tab')===CURRENT_LB);
      b.setAttribute('aria-pressed', on?'true':'false');
    });
  }

  // --- reliable leaderboard renderer (override any previous)
  window.renderLeaderboard = function(){
    const st = window.MiniState || {};
    const listEl = document.getElementById('lb-list');
    if (!listEl) return;
    const arr = (CURRENT_LB==='all') ? (st.leaderboard_alltime||[]) : (st.leaderboard_today||[]);
    if (!Array.isArray(arr) || arr.length===0){
      listEl.innerHTML = '<div class="muted-sm">Пока пусто.</div>';
    }else{
      listEl.innerHTML = arr.map(function(r,i){
        const medal = (i<3 ? (' lb-medal-'+(i+1)) : '');
        const name  = r.username ? ('@'+r.username) : (r.tg_id||'—');
        const ava   = (r.username||'U').slice(0,1).toUpperCase();
        return '<div class="lb-row'+medal+'">'+
          '<div class="lb-rank">'+(i+1)+'</div>'+
          '<div class="lb-avatar">'+ava+'</div>'+
          '<div class="lb-name">'+name+'</div>'+
          '<div class="lb-score">'+(r.score|0)+'</div>'+
        '</div>';
      }).join('');
    }
    updateLbSeg();
  };

  // --- badges painter for passport + sheet (strictly from server state)
  function paintBadgesFromState(st){
  st = st || (window.SWR && SWR.get()) || st;

    try{
      const styles = Array.isArray(st.styles) ? st.styles
                    : (Array.isArray(st.styles_user) ? st.styles_user : []);
      const owned = new Set((styles||[]).map(x=>String(x).toLowerCase()));
      // main passport grid
      document.querySelectorAll('#passport-grid .pslot').forEach(card=>{
        const code = String(card.getAttribute('data-code')||'').trim().toLowerCase();
        const ok = !!(code && owned.has(code));
        card.classList.toggle('is-done', ok);
        const b = card.querySelector('.pslot__badge, .pslot-badge, [data-role="pslot-badge"]');
        if (b) b.textContent = ok ? 'Получен' : 'Получить';
      });
      // sheet tiles
      document.querySelectorAll('#sheet .pslot[data-style-id], #sheet .pslot[data-code]').forEach(card=>{
        const code = String(card.getAttribute('data-style-id')||card.getAttribute('data-code')||'').trim().toLowerCase();
        const ok = !!(code && owned.has(code));
        card.classList.toggle('is-done', ok);
        const b = card.querySelector('.pslot__badge, .pslot-badge, [data-role="pslot-badge"]');
        if (b) b.textContent = ok ? 'Получен' : 'Получить';
      });
    }catch(_){}
  }

  // --- gate server state and repaint
  (function(){
    const prev = window.applyServerState;
    window.applyServerState = function(state){
      if (!state || state.ok===false) return;
      const v = Number(state.kv_ver||0);
      if (v && KV_VER && v <= KV_VER) return;
      KV_VER = v || Date.now();
      window.MiniState = state;
      try{ prev && prev(state); }catch(_){}
      paintBadgesFromState(state);
      window.renderLeaderboard();
    };
  })();

  // --- unified collectStyle with single PIN step and clear confirm
  
async function collectStyle(styleId){
  if (!pinOkSession){
    const pin = prompt('PIN сотрудника (демо: 1111)');
    if (pin !== PIN_CODE){ alert('PIN неверный'); return; }
    pinOkSession = true; showOk('PIN ОК');
  }
  const tg_init = getTgInit();
  const r = await jpost('/api/mini/event', { tg_init, type:'style.collect', data:{ style_id: String(styleId) } });
  if (r && r.ok && r.fresh_state){
    window.applyServerState(r.fresh_state); // сервер всё подсветит и сохранит
  }else{
    // оффлайн/ошибка сети — не даём UX развалиться: подсветим из локального кэша
    cacheAdd(String(styleId));
    try{ paintBadgesFromState({styles: getCachedStyles()}); }catch(_){}
    if (r && r.error) console.warn('collectStyle offline fallback:', r.error);
    showOk('Штамп отмечен локально');
  }
}

  // --- clicks: passport tiles and sheet tiles -> collectStyle
  document.addEventListener('click', function(e){
    const tile = e.target.closest('#passport-grid .pslot, #sheet .pslot[data-style-id], #sheet .pslot[data-code]');
    if (!tile) return;
    const sid = tile.getAttribute('data-style-id') || tile.getAttribute('data-code') || '';
    if (!sid) return;
    e.preventDefault();
    collectStyle(sid);
  }, {passive:false});

  // --- LB tab clicks (both new [data-lb-tab] and old .js-lb-mode)
  document.addEventListener('click', async function(e){
    const tab = e.target.closest('[data-lb-tab], .js-lb-mode');
    if (!tab) return;
    const modeAttr = tab.getAttribute('data-lb-tab') || (tab.dataset && tab.dataset.mode) || 'today';
    CURRENT_LB = (String(modeAttr).toLowerCase()==='all') ? 'all' : 'today';
    updateLbSeg();
    window.renderLeaderboard();
    if (CURRENT_LB==='all'){
      const s = await jpost('/api/mini/state', { tg_init: getTgInit(), fresh: 1 });
      if (s && s.ok) window.applyServerState(s);
    }
  }, {passive:true});

  // --- init
  ensureLbButtons();
  updateLbSeg();
  window.renderLeaderboard();
  if (window.MiniState) paintBadgesFromState(window.MiniState);
})();