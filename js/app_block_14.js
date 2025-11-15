(function(){
  const API_BASE = "https://craftbeer-demo.cyberian13.workers.dev";
  const TG = (window.Telegram && window.Telegram.WebApp) || null;
  try{ TG?.ready(); TG?.expand(); TG?.disableVerticalSwipes?.(); }catch(_){}

  const $ = (sel)=>document.querySelector(sel);

  // --- Utils
  function setText(selList, v){
    (Array.isArray(selList)?selList:[selList]).forEach(sel=>{
      const el = document.querySelector(sel);
      if (el) el.textContent = (v==null? "" : String(v));
    });
  }
  function jsonPost(url, body){
    return fetch(url, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(body||{})
    }).then(r=>r.json().catch(()=>({ok:false})));
  }
  function seal(name, fn){
    try { Object.defineProperty(window, name, { value: fn, writable:false, configurable:false }); }
    catch(_) { window[name] = fn; }
  }

  // --- Final API
  async function api(type, data){
    const payload = { type, data:(data||{}), tg_init: TG?.initData || "" };
    const res = await jsonPost(API_BASE + "/api/mini/event", payload);
    if (res && res.fresh_state) applyServerState(res.fresh_state);
    return res;
  }
  seal("api", api);

  // public helpers used elsewhere
  seal("submitGameScore", async (score, gameId="flappy_bee", mode="daily")=>api("game.submit",{ score:Number(score||0), game_id:String(gameId), mode:String(mode) }));
  seal("claimPrize", async (name, value)=>api("bonus.claim",{ prize_name:String(name||""), prize_value:Number(value||0) }));
  seal("addStamp", async (styleId)=>api("style.collect",{ style_id:String(styleId||""), status:"collected" }));

  // --- Style id normalizer
  const MAP_RU = {
    "лагер":"lager","лаґер":"lager","лягер":"lager",
    "стаут":"stout",
    "вайцен":"weizen","вeйцен":"weizen","вeйцeн":"weizen",
    "витбир":"wit","вітбир":"wit","витбирь":"wit","wit":"wit",
    "портер":"porter",
    "пилснер":"pils","пилс":"pils","пильзнер":"pils",
    "сауэр":"sour","зауэр":"sour",
    "сидр":"cider",
    "ipa":"ipa","ипа":"ipa"
  };
  function slugify(txt){
    if (!txt) return "";
    txt = String(txt).trim().toLowerCase();
    if (MAP_RU[txt]) return MAP_RU[txt];
    // fallback: latin slug
    return txt.normalize('NFKD').replace(/[^\w]+/g,'').replace(/_/g,'') || txt;
  }
  function styleIdFromCard(card){
    if (!card) return "";
    const ds = card.dataset || {};
    if (ds.code) return String(ds.code).trim().toLowerCase();
    if (ds.styleId) return String(ds.styleId).trim().toLowerCase();
    // try common title elements
    const titleEl = card.querySelector(".pslot__title, .pslot-title, .pslot__label, .pslot-label, .title, .name");
    const txt = titleEl ? titleEl.textContent : card.textContent;
    return slugify(txt);
  }

  // --- Passport click handler (once)
  function bindPassportClicks(){
  const grid = document.querySelector('#passport-grid');
  if (!grid || grid.__psInit) return;
  grid.__psInit = true;
  grid.addEventListener('click', (e)=>{
    const card = e.target.closest('.pslot');
    if (!card) return;
    const code = styleIdFromCard(card);
    if (!code) return;
    e.preventDefault();
    try { collectStyle(code); } catch(_){}
  }, {passive:false});
});
        if (!(res && res.ok)) card.classList.remove("is-pending");
      }catch(_){ card.classList.remove("is-pending"); }
    });
  }

  // --- Leaderboard render (server only)
  function renderLeaderboard(lb){
    const box = document.querySelector("#lb-list") || document.querySelector("#leaderboard .lb-list");
    if (!box) return;
    const rows = Array.isArray(lb) ? lb : [];
    if (!rows.length){
      box.innerHTML = '<div class="muted-sm">Пока нет результатов</div>';
      setText(["#lb-you-score",".js-lb-me-best","[data-bind='lb-me-best']"], 0);
      return;
    }
    box.innerHTML = rows.slice(0,10).map((r,i)=>{
      const best = (r.best_score!=null? r.best_score : r.score)||0;
      const uname = r.username ? "@"+r.username : (r.tg_id||"user");
      return `<div class="lb-row">
        <div class="lb-rank">${i+1}</div>
        <div class="lb-name">${uname}</div>
        <div class="lb-score">${best}</div>
      </div>`;
    }).join("");
  }

  // --- Profile & passport from server
  function paintProfile(state){
  state = state || (window.SWR && SWR.get()) || state;

    const coins = Number(state?.coins||0);
    setText(["#pf-coins",".js-coins","[data-bind='coins']"], coins);
    try{ localStorage.setItem("beer_coins", String(coins)); }catch(_){}

    const total = Number(state?.styles_total || 6);
    const styles = Array.isArray(state?.styles) ? state.styles : [];
    setText(["#pf-pass-count","#pf-stamps-count",".js-stamps-count","[data-bind='stamps-count']"], `${styles.length}/${total}`);

    const lastLabel = state?.last_stamp_name || state?.last_stamp_id || "—";
    setText(["#pf-pass-list","#pf-last-stamp","#prof-last-stamp",".js-last-stamp","[data-bind='last-stamp']"], lastLabel);
    // change caption to "Последний штамп" near pf-pass-list if found
    const el = document.getElementById("pf-pass-list");
    if (el && el.parentElement){
      const lbl = el.parentElement.querySelector(".metric__lbl, .label");
      if (lbl) lbl.textContent = "Последний штамп";
    }

    // mark collected in grid
    try{
      const owned = new Set(styles.map(s=>String(s).toLowerCase()));
      document.querySelectorAll("#passport-grid .pslot").forEach(card=>{
        const code = styleIdFromCard(card);
        const got = code && owned.has(code);
        card.classList.toggle("is-done", !!got);
        const badge = card.querySelector(".pslot__badge, .pslot-badge, [data-role='pslot-badge']");
        if (badge) badge.textContent = got ? "Получен" : "Получить";
      });
    }catch(_){}
  }

  // --- Final apply
  function applyServerState(state){
    if (!state || state.ok===false) return;
    window.__state = state;
    // config: spin cost
    if (state.config && typeof state.config.SPIN_COST === "number"){
      setText(["#spin-cost",".js-spin-cost","[data-bind='spin-cost']"], state.config.SPIN_COST);
    }
    paintProfile(state);
    window.MiniState = state;
    try {
      const _st = Array.isArray(state.styles) ? state.styles : (Array.isArray(state.styles_user) ? state.styles_user : []);
      localStorage.setItem('beer_passport', JSON.stringify({styles:_st, ts: Date.now()}));
    } catch(_) {}
try { paintBadgesFromState(state); } catch(_) {}
    try { renderLeaderboard(); } catch(_) {};
    // legacy logs
    try{
      const claims = Array.isArray(state.last_prizes)?state.last_prizes:[];
      const log = claims.map(x=>({ts: Date.parse(x.ts||new Date())||Date.now(), source:"bonus", prize: x.prize_name||"Приз"}));
      localStorage.setItem("beer_rewards", JSON.stringify(log.slice(0,30)));
    }catch(_){}
    bindPassportClicks();
  }
  try { Object.defineProperty(window, "applyServerState", { value: applyServerState, writable:false, configurable:false }); }
  catch(_) { window.applyServerState = applyServerState; }

  // --- Initial bootstrap & state
  (async function init(){
    try{
      const start_param = TG?.initDataUnsafe?.start_param || "";
      await jsonPost(API_BASE + "/api/mini/bootstrap", { tg_init: TG?.initData || "", data:{ start_param } });
    }catch(_){}
    try{
      const st = await jsonPost(API_BASE + "/api/mini/state", { tg_init: TG?.initData || "" });
      if (st && st.ok) applyServerState(st);
    }catch(_){}
  })();

  // manual refresh buttons (optional)
  document.addEventListener("click", async (e)=>{
    if (e.target.matches("#lb-refresh, [data-action='lb-refresh']")){
      const st = await jsonPost(API_BASE + "/api/mini/state", { tg_init: TG?.initData || "" });
      if (st && st.ok) applyServerState(st);
    }
  });
})();

<script>
(function(){
  const TG = window.Telegram && window.Telegram.WebApp;
  const API_BASE = window.API_BASE || "https://твой-воркер.workers.dev";
  let KV_VER = 0;            // защита от старых ответов
  let CURRENT_LB = 'today';  // вкладка: 'today' | 'all'

  function updateLbSeg(){
    try{
      document.querySelectorAll('.lb-seg [data-lb-tab]').forEach(btn=>{
        const on = (btn.getAttribute('data-lb-tab') === CURRENT_LB);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }catch(_) {}
  }


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
  async function jpost(path, body){
  return (async ()=>{
    try{
      const res = await fetch((API_BASE||'') + path, {
        method:'POST', headers:{'Content-Type':'application/json','Cache-Control':'no-store'}, cache:'no-store',
        body: JSON.stringify(body||{})
      });
      const ct = (res.headers && res.headers.get && res.headers.get('content-type')) || '';
      if (ct && ct.indexOf('application/json')>=0){
        try { return await res.json(); } catch(_) { return {ok: res.ok}; }
      }
      return {ok: res.ok};
    }catch(_){ return {ok:false, error:'net'}; }
  })();
},
      cache:'no-store',
      body: JSON.stringify(body||{})
    });
    try { return await res.json(); } catch { return {ok:false}; }
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

 // 5) Двухфазный старт: мгновенно из кэша → параллельно 2 запроса → что быстрее, то красим
async function bootFast(){
  const tg_init = TG?.initData || '';
  const start_param = TG?.initDataUnsafe?.start_param || '';

  // 2 сек таймауты чтобы не зависать
  const ctl1 = new AbortController(), ctl2 = new AbortController();
  setTimeout(()=>ctl1.abort(), 2000);
  setTimeout(()=>ctl2.abort(), 2000);

  // параллельно: bootstrap и state
  const pBootstrap = jpost('/api/mini/bootstrap', { tg_init, data:{ start_param } }, ctl1.signal)
    .then(r => applyIfNew(r?.fresh_state ?? r))
    .catch(()=>{});
  const pState = jpost('/api/mini/state', { tg_init, fresh:1 }, ctl2.signal)
    .then(applyIfNew)
    .catch(()=>{});

  // первое пришедшее уже красит экран
  await Promise.race([pBootstrap, pState]).catch(()=>{});
  // второе — дообновит, когда догрузится
}

// НЕ ждём 2.5–3 сек: стартуем сразу, но если initData так и не появится — всё равно пробуем
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootFast, {once:true});
} else {
  bootFast();
}

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