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

// === Block separator ===

// === EARLY: Telegram init + API binding to Worker (with fresh_state support) ===
(function(){
  var TG = (window.Telegram && window.Telegram.WebApp) || null;
  try{ TG && TG.ready && TG.ready(); TG && TG.expand && TG.expand(); TG && TG.disableVerticalSwipes && TG.disableVerticalSwipes(); }catch(_){}

  var API_BASE = (window.API_BASE || "https://craftbeer-demo.cyberian13.workers.dev");

  async function apiCall(type, data){
    try{
      const res = await fetch(API_BASE + "/api/mini/event", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ type, data: (data||{}), tg_init: TG?.initData || "" })
      });
      const j = await res.json();
      if (j && j.fresh_state && window.applyServerState) {
        window.applyServerState(j.fresh_state);
      }
      return j;
    }catch(e){ return { ok:false, error: String(e) }; }
  }
  window.api = apiCall;

  window.applyServerState = function(state){
    
    try{ window.MiniState = state; }catch(_){}
if (!state || state.ok === false) return;
    try{
      // coins
      if (typeof state.coins === 'number') {
        localStorage.setItem('beer_coins', String(state.coins));
        try{ window.syncCoinsUI && window.syncCoinsUI(); }catch(_){}
        var pf = document.getElementById('pf-coins'); if (pf) pf.textContent = String(state.coins|0);
      }
      // last prizes -> two keys used by UI variants
      var claims = Array.isArray(state.last_prizes) ? state.last_prizes : [];
      var v1 = claims.map(function(x){ return { name: x.prize_name || 'Приз', ts: Date.parse(x.ts||new Date()) || Date.now() }; });
      var v2 = claims.map(function(x){ return { ts: Date.parse(x.ts||new Date()) || Date.now(), source: 'bonus', prize: x.prize_name || 'Приз' }; });
      localStorage.setItem('bonus_log_v1', JSON.stringify(v1.slice(0,30)));
      localStorage.setItem('beer_rewards', JSON.stringify(v2.slice(0,30)));
      try{ window.renderRewards && window.renderRewards(); }catch(_){}

      // passport styles -> two formats
      var styles = Array.isArray(state.styles) ? state.styles : [];
      var map = {}; styles.forEach(function(s){ map[String(s)] = 1; });
      localStorage.setItem('beer_passport', JSON.stringify(map));
      localStorage.setItem('beer_passport_v1', JSON.stringify({ stamps: styles }));
      try{ window.renderPassport && window.renderPassport(); }catch(_){}
    }catch(_){}
  
      // === PATCH: server-driven profile/leaderboard/passport ===
      try{
        // Passport counters + last stamp
        var total = Number(state.styles_total || 6);
        var cnt   = (Array.isArray(state.styles) ? state.styles.length : 0);
        var lastLabel = state.last_stamp_name || state.last_stamp_id || '—';
        var elCnt = document.getElementById('pf-pass-count'); if (elCnt) elCnt.textContent = String(cnt + '/' + total);
        var elVal = document.getElementById('pf-pass-list');  if (elVal) elVal.textContent = String(lastLabel);
        if (elVal && elVal.parentElement){ var lbl = elVal.parentElement.querySelector('.metric__lbl'); if (lbl) lbl.textContent = 'Последний штамп'; }

        // Mark stamps in grid (case-insensitive)
        var grid = document.getElementById('passport-grid');
        if (grid){
          var owned = {}; (Array.isArray(state.styles)?state.styles:[]).forEach(function(s){ owned[String(s).toLowerCase()] = 1; });
          grid.querySelectorAll('.pslot').forEach(function(card){
            var code = String(card.getAttribute('data-code')||'').toLowerCase();
            var ok = !!owned[code];
            card.classList.toggle('is-done', ok);
            var b = card.querySelector('.pslot__badge'); if (b) b.textContent = ok ? 'Получен' : 'Получить';
          });
        }

        // Leaderboard (server only)
        if (state.leaderboard_today){
          var box = document.getElementById('lb-list');
          if (box){
            var lb = state.leaderboard_today || [];
            if (!lb.length){
              box.innerHTML = '<div class="muted-sm">Пока пусто. Сыграй раунд!</div>';
            } else {
              box.innerHTML = lb.map(function(r,i){
                var medal = (i<3 ? (' lb-medal-'+(i+1)) : '');
                var name  = r.username ? ('@'+r.username) : (r.tg_id||'—');
                var ava   = (r.username||'U').slice(0,1).toUpperCase();
                return '<div class="lb-row'+medal+'">'+
                  '<div class="lb-rank">'+(i+1)+'</div>'+
                  '<div class="lb-avatar">'+ava+'</div>'+
                  '<div class="lb-name">'+name+'</div>'+
                  '<div class="lb-score">'+(r.score|0)+'</div>'+
                '</div>';
              }).join('');
            }
          }
          var meScore = document.getElementById('lb-you-score'); if (meScore) meScore.textContent = String(state.game_today_best||0);
        }
      }catch(_){}
};

  async function bootstrapAndLoad(){
    try{
      const sp = TG?.initDataUnsafe?.start_param || "";
      await fetch(API_BASE + "/api/mini/bootstrap", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ tg_init: TG?.initData || "", data:{ start_param: sp } })
      });
    }catch(_){}
    try{
      const r = await fetch(API_BASE + "/api/mini/state", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ tg_init: TG?.initData || "" })
      });
      const st = await r.json();
      if (st && st.ok && window.applyServerState) window.applyServerState(st);
    }catch(_){}
  }

  function waitInit(cb){
    const t0 = Date.now();
    (function tick(){
      if (TG && TG.initData && TG.initData.length>0) return cb();
      if (Date.now()-t0 > 3000) return cb();  // timeout — всё равно попробуем
      setTimeout(tick, 60);
    })();
  }

  bootstrapAndLoad();
})();

// === Block separator ===

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

// === Block separator ===

(function app(){
    const TG = window.Telegram && window.Telegram.WebApp;
    if (TG){
      try{ TG.ready(); TG.expand(); TG.disableVerticalSwipes?.(); TG.enableClosingConfirmation?.(); TG.onEvent?.('viewportChanged', () => TG.disableVerticalSwipes?.()); }catch(e){ console.warn('TG init error', e); }
    }

    const ROOT = 'home';
    const sheetRoot = document.getElementById('sheet');
    const sheetPanel= sheetRoot?.querySelector('.sheet__panel');
    const sheetBody = document.getElementById('sheet-body');
    const sheetTitle= sheetRoot?.querySelector('.sheet__title');

    const qsa = sel => Array.from(document.querySelectorAll(sel));
    const isInDOM = id => !!document.getElementById(id);

    function currentId(){
      const url = new URL(location.href);
      const qp = (url.searchParams.get('page') || '').trim();
      if (qp && isInDOM(qp)) return qp;
      const h = (location.hash || '#'+ROOT).replace(/^#/, '');
      return isInDOM(h) ? h : ROOT;
    }
    function setActivePage(id){
      qsa('main > section, section.page').forEach(s => {
        const on = (s.id === id);
        s.classList.toggle('active', on);
        s.style.display = on ? 'block' : 'none';
      });
      qsa('[data-page]').forEach(t => t.classList.toggle('active', t.dataset.page === id));
      requestAnimationFrame(()=> window.scrollTo({ top: 0, behavior:'auto' }));
      syncBack();
    }
    function navigateTo(id){
      if (!id || !isInDOM(id)) return;
      const h = '#'+id;
      if (h !== (location.hash || '#'+ROOT)){ history.pushState({id}, '', h); }
      setActivePage(id);
    }

    function showBack(){ try{ TG?.BackButton?.show && TG.BackButton.show(); }catch(_){ } }
    function hideBack(){ try{ TG?.BackButton?.hide && TG.BackButton.hide(); }catch(_){ } }
    function syncBack(){
      if (!TG) return;
      const atRoot = (currentId() === ROOT);
      const sheetOpen = sheetRoot?.classList.contains('is-open');
      if (sheetOpen || !atRoot) showBack(); else hideBack();
    }

    TG?.BackButton?.onClick?.(()=>{ if (sheetRoot && sheetRoot.classList.contains('is-open')){ closeSheet(); return; } const atRoot = (currentId() === ROOT); if (!atRoot) history.back(); });
    TG?.onEvent?.('backButtonClicked', ()=>{ if (sheetRoot && sheetRoot.classList.contains('is-open')){ closeSheet(); return; } const atRoot = (currentId() === ROOT); if (!atRoot) history.back(); });
    window.addEventListener('popstate', ()=> setActivePage(currentId()));

    function haptic(level='light'){ try{ TG?.HapticFeedback?.impactOccurred && TG.HapticFeedback.impactOccurred(level); } catch(_){ try{ navigator.vibrate && navigator.vibrate(level==='light'?10:16); }catch(_){} } }
    function openSheet({title='', html='', from='bottom'} = {}){
      if (!sheetRoot) return;
      sheetRoot.classList.toggle('sheet-bottom', from==='bottom');
      if (sheetTitle) sheetTitle.textContent = title || '';
      if (sheetBody && html != null) sheetBody.innerHTML = html;
      sheetRoot.classList.add('is-open'); document.body.classList.add('sheet-open');
      
try{
  var __st = (window.MiniState || (window.SWR && SWR.get()) || {});
  if (/паспорт/i.test(title) && typeof paintBadgesFromState==='function') paintBadgesFromState(__st);
  if (/последние призы|призы/i.test(title) && typeof window.renderRewards==='function') window.renderRewards();
}catch(_){}

try{ if (typeof initSheet==='function') initSheet(title||''); }catch(_){ }
requestAnimationFrame(()=> sheetPanel?.focus({preventScroll:true}));
      haptic('light'); syncBack();
    }
    function closeSheet(){ if (!sheetRoot) return; sheetRoot.classList.remove('is-open'); document.body.classList.remove('sheet-open'); 
try{ var __st = (window.MiniState||(window.SWR&&SWR.get())||{}); if (typeof paintBadgesFromState==='function') paintBadgesFromState(__st); }catch(_){ }
haptic('light'); syncBack(); }
    window.openSheet = openSheet; window.closeSheet = closeSheet;
    sheetRoot?.addEventListener('click', (e)=>{ if (e.target.closest('[data-close-sheet]')) closeSheet(); });
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && sheetRoot?.classList.contains('is-open')) closeSheet(); });

    // Prevent iOS pull-to-refresh when no TG.disableVerticalSwipes
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isiOS && !(TG && typeof TG.disableVerticalSwipes === 'function')){
      let startY = 0; document.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, {passive:true});
      document.addEventListener('touchmove', e => { const dy = e.touches[0].clientY - startY; const atTop = (window.scrollY <= 0); if (dy > 0 && atTop){ e.preventDefault(); } }, {passive:false});
    }

    