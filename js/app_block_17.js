(function(){
  const TG = window.Telegram && window.Telegram.WebApp;
  const API_BASE = window.API_BASE || window.__API_BASE || "";
  const PIN_CODE = (window.DEMO_PIN || '1111');
  let KV_VER = 0, CURRENT_LB = 'today', pinOkSession = false;

  function jpost(path, body){
    return fetch((API_BASE||'')+path, {
      method:'POST', headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
      cache:'no-store', body: JSON.stringify(body||{})
    }).then(r=>r.json()).catch(()=>({ok:false, error:'net'}));
  }
  function getTgInit(){ try{ return TG?.initData || ''; }catch(_){ return ''; } }
  function saveSWR(state){
    try{
      const KEY = (window.SWR && SWR.KEY) || 'beer_state_v2';
      const cur = (window.SWR && SWR.get && SWR.get()) || {};
      const merged = Object.assign({}, cur, state); merged._ver = Number(state.kv_ver || Date.now());
      localStorage.setItem(KEY, JSON.stringify(merged));
    }catch(_){}
  }

  function computeMyRanks(st){
    const uid = String(TG?.initDataUnsafe?.user?.id || '');
    const uname = String(TG?.initDataUnsafe?.user?.username || '');
    const today = Array.isArray(st.leaderboard_today)?st.leaderboard_today:[];
    const all   = Array.isArray(st.leaderboard_alltime)?st.leaderboard_alltime:[];
    const isMe = r => String(r.tg_id||r.uid||'')===uid || (uname && r.username===uname);

    const ixToday = today.findIndex(isMe);
    const ixAll   = all.findIndex(isMe);
    const bestAll = Math.max(0, ...all.filter(isMe).map(r=>r.score|0));

    return {
      rankToday: ixToday>=0 ? ixToday+1 : '—',
      rankAll:   ixAll>=0   ? ixAll+1   : '—',
      best:      (st.my_best_score|0) || bestAll || 0
    };
  }

  function paintBadgesMaybe(st){
    const styles = Array.isArray(st.styles) ? st.styles
                 : (Array.isArray(st.styles_user) ? st.styles_user : []);
    if (typeof window.paintBadgesFromState==='function'){
      window.paintBadgesFromState({styles});
    }else{
      // минималка
      const owned = new Set((styles||[]).map(x=>String(x).toLowerCase()));
      document.querySelectorAll('#passport-grid .pslot, #sheet .pslot[data-style-id], #sheet .pslot[data-code]').forEach(card=>{
        const code = (card.getAttribute('data-style-id')||card.getAttribute('data-code')||'').trim().toLowerCase();
        const ok = code && owned.has(code);
        card.classList.toggle('is-done', !!ok);
        const b = card.querySelector('.pslot__badge, .pslot-badge, [data-role="pslot-badge"]');
        if (b) b.textContent = ok ? 'Получен' : 'Получить';
      });
    }
  }

  function paintProfileFromState(st){
    // coins
    if (typeof st.coins === 'number'){
      const pf = document.getElementById('pf-coins'); if (pf) pf.textContent = String(st.coins|0);
      try{ localStorage.setItem('beer_coins', String(st.coins|0)); window.syncCoinsUI?.(); }catch(_){}
    }
    // stamps count + last
    const total  = Number(st.styles_total || 6);
    const styles = Array.isArray(st.styles) ? st.styles
                : (Array.isArray(st.styles_user) ? st.styles_user : []);
    const cntEl  = document.getElementById('pf-pass-count'); if (cntEl) cntEl.textContent = `${styles.length}/${total}`;
    const lastEl = document.getElementById('pf-last-stamp');
    if (lastEl) lastEl.textContent = st.last_stamp_name || st.last_stamp_id || '—';

    // referrals
    const refs = Number(st.ref_total || st.ref_count || st.refs || 0);
    const rc = document.getElementById('pf-refs-count'); if (rc) rc.textContent = String(refs);

    // ranks + best (Шмель)
    const r = computeMyRanks(st);
    const tEl = document.getElementById('pf-today-rank'); if (tEl) tEl.textContent = r.rankToday;
    const aEl = document.getElementById('pf-all-rank');   if (aEl) aEl.textContent = r.rankAll;
    const bEl = document.getElementById('pf-flappy-best');if (bEl) bEl.textContent = r.best;

    paintBadgesMaybe(st);
    // перерисовать таблицу
    if (typeof window.renderLeaderboard==='function') window.renderLeaderboard();
  }

  // --- Финальный приём состояния от воркера
  const prevApply = window.applyServerState;
  window.applyServerState = function(state){
    if (!state || state.ok===false) return;
    const v = Number(state.kv_ver||0);
    if (v && KV_VER && v <= KV_VER) return; // не затираем свежак старым
    KV_VER = v || Date.now();
    window.MiniState = state;
    try{ saveSWR(state); }catch(_){}
    paintProfileFromState(state);
    try{ prevApply && prevApply(state); }catch(_){}
  };

  // --- PIN + отметка штампа (паспорт и шторка)
  document.addEventListener('click', function(e){
    const tile = e.target.closest('#passport-grid .pslot, #sheet .pslot[data-style-id], #sheet .pslot[data-code]');
    if (!tile) return;
    const sid = tile.getAttribute('data-style-id') || tile.getAttribute('data-code') || '';
    if (!sid) return;
    e.preventDefault();
    (async ()=>{
      if (!pinOkSession){
        const pin = prompt('PIN сотрудника (демо: 1111)');
        if (pin !== PIN_CODE){ alert('PIN неверный'); return; }
        pinOkSession = true; try{ TG?.showPopup?.({message:'PIN ОК'}); }catch(_){}
      }
      const r = await jpost('/api/mini/event', { tg_init: getTgInit(), type:'style.collect', data:{ style_id: String(sid) } });
      if (r && r.ok && r.fresh_state) window.applyServerState(r.fresh_state);
      else {
        // оффлайн/фейл — подсветим из кэша
        try{
          const key='beer_passport_v1';
          const cur = JSON.parse(localStorage.getItem(key)||'{"stamps":[]}');
          const stamps = Array.from(new Set([...(cur.stamps||[]), String(sid)]));
          localStorage.setItem(key, JSON.stringify({stamps}));
          paintBadgesMaybe({styles:stamps});
        }catch(_){}
      }
    })();
  }, {passive:false});

  // --- Heartbeat: мягко подтягиваем свежак
  setInterval(()=>{ jpost('/api/mini/state', { tg_init:getTgInit(), fresh:1 }).then(s=>{ if (s && s.ok) window.applyServerState(s); }); }, 30000);
  document.addEventListener('visibilitychange', ()=>{ if (!document.hidden) jpost('/api/mini/state', { tg_init:getTgInit(), fresh:1 }).then(s=>{ if (s && s.ok) window.applyServerState(s); }); });

  // --- При открытии шторки «Паспорт» докрашиваем из свежего state/кэша
  const _openSheet = window.openSheet;
  window.openSheet = function(opts){
    _openSheet && _openSheet(opts);
    const title = (opts && opts.title) || '';
    if (/паспорт/i.test(title)){
      const st = (window.MiniState || (window.SWR && SWR.get && SWR.get()) || {});
      paintBadgesMaybe(st);
    }
  };
})();