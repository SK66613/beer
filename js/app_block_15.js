(function(){
  const TG = window.Telegram && window.Telegram.WebApp;
  const API_BASE = window.API_BASE || "https://craftbeer-demo.cyberian13.workers.dev";
  let KV_VER = 0;            // защита от старых ответов
  let CURRENT_LB = 'today';  // вкладка: 'today' | 'all'

  // 1) Полностью вырубаем локальный "кэш" лидерборда/скорингов
  (function killLocalLB(){
    const DROP = ['leaderboard','lb_','score','best']; // подстроки ключей, которые блокируем
    const ls = window.localStorage;
    const g = ls.getItem.bind(ls), s = ls.setItem.bind(ls), r = ls.removeItem.bind(ls);
    const hit = k => k && DROP.some(x => k.toLowerCase().includes(x));
    ls.getItem  = k => hit(k) ? null : g(k);
    ls.setItem  = (k,v) => hit(k) ? void 0 : s(k,v);
    ls.removeItem = k => r(k);
  })();

  // 2) Запросы к воркеру
function jpost(path, body, signal){
  return (async ()=>{
    try{
      const res = await fetch((API_BASE||'') + path, {
        method:'POST',
        headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
        cache:'no-store',
        keepalive:true,           // iOS/мобилки стабильнее
        signal: signal || null,
        body: JSON.stringify(body||{})
      });
      const ct = res.headers?.get?.('content-type') || '';
      if (ct.includes('application/json')){
        try { return await res.json(); } catch(_) { return {ok: res.ok}; }
      }
      return {ok: res.ok};
    }catch(_){ return {ok:false, error:'net'}; }
  })();
}


  // 3) Применяем state только если он свежее
  const prevApply = window.applyServerState;
  function applyIfNew(state){
    if (!state || state.ok === false) return false;
    const v = Number(state.kv_ver || 0);
    if (v && KV_VER && v <= KV_VER) return false;
    KV_VER = v || Date.now();
    window.MiniState = state;
    try { prevApply && prevApply(state); } catch {}
    updateLbSeg(); renderLeaderboard();
    return true;
  }

  // 4) Единый рендер лидерборда — только из state.* c воркера
  function renderLeaderboard(){
    updateLbSeg();
    const st = window.MiniState || {};
    const list = document.querySelector('#lb-list');        // список
    const you  = document.querySelector('#lb-you');         // блок "YOU best score" (если есть)
    const arr  = CURRENT_LB === 'all'
      ? (st.leaderboard_alltime || [])
      : (st.leaderboard_today   || []);

    // список
    if (list){
      list.innerHTML = (arr || []).map((r,i) => {
        const rank = i+1;
        const name = r.username ? '@'+r.username : (r.tg_id || '—');
        const score = (r.score|0);
        const badge = (i<3) ? ` lb-medal-${rank}` : '';
        return `
          <div class="lb-row${badge}">
            <div class="lb-rank">${rank}</div>
            <div class="lb-avatar">${(r.username||'U')[0].toUpperCase()}</div>
            <div class="lb-name">${name}</div>
            <div class="lb-score">${score}</div>
          </div>`;
      }).join('');
      if (!arr.length) list.innerHTML = '<div class="muted-sm">Пока пусто.</div>';
    }

    // YOU (берём из того же массива, НЕ из памяти)
    if (you){
      const me = (arr || []).find(x => String(x.tg_id||'') === String(st.tg_id||''));
      you.innerHTML = me
        ? `<div class="you-row"><div class="you-tag">YOU</div><div class="you-name">${me.username?('@'+me.username):'—'}</div><div class="you-score">${me.score|0}</div></div>`
        : '';
    }
  }

  // 5) Двухфазный старт: быстро из KV → потом свежак из таблицы (fresh:1)
  async function boot(){
    const tg_init = TG?.initData || '';
    const start_param = TG?.initDataUnsafe?.start_param || '';
    try { const b = await jpost('/api/mini/bootstrap', { tg_init, data:{ start_param } }); applyIfNew(b.fresh_state?b.fresh_state:b); } catch {}
    try { const s = await jpost('/api/mini/state', { tg_init, fresh:1 }); applyIfNew(s); } catch {}
  }
  (function wait(t0){ t0=t0||Date.now(); if (TG?.initData?.length){ boot(); return; } if (Date.now()-t0>2500){ boot(); return; } setTimeout(()=>wait(t0), 40); })();

  // 6) Кнопки: вкладки и «Обновить» — всегда тянут fresh:1
  document.addEventListener('click', async (e)=>{
    const tab = e.target.closest('[data-lb-tab]');
    if (tab){
      CURRENT_LB = tab.getAttribute('data-lb-tab') || 'today';
      updateLbSeg(); renderLeaderboard();
      return;
    }
    if (e.target.closest('[data-action="lb-refresh"]')){
      const tg_init = TG?.initData || '';
      const s = await jpost('/api/mini/state', { tg_init, fresh:1 });
      applyIfNew(s);
    }
  });
})();