// === Block separator ===

(function(){
  'use strict';
  const TG = (window.Telegram && window.Telegram.WebApp) || null;

  // Ключи локального хранилища (совместимы с твоими модулями)
  const WALLET_KEY   = 'beer_coins';
  const PRIZES_KEY   = 'bonus_log_v1';          // [{name, ts}]
  const PASSPORT_KEY = 'beer_passport_v1';      // {stamps:[]}
  const FLAPPY_BEST  = 'flappy_best';
  const LB_DAILY_KEY = ()=>'lb_flappy_' + new Date().toISOString().slice(0,10);
  const LB_ALL_KEY   ='lb_flappy_all';
  const REFS_KEY     ='beer_refs_v1';

  // Утилиты
  const getJSON = (k,def)=>{ try{ return JSON.parse(localStorage.getItem(k) || ''); }catch(_){ return def; } };
  const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
  const fmtDate = ts => new Date(ts).toLocaleDateString();
  const esc = s => String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  // --- Рендер шапки
  function renderHead(){
    const u = TG?.initDataUnsafe?.user || {};
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Гость';
    const uname = u.username ? '@'+u.username : '';
    const photo = u.photo_url || '';

    document.getElementById('pf-title').textContent = name;
    document.getElementById('pf-username').textContent = uname;
    const ava = document.getElementById('pf-ava');
    if (photo){ ava.src = photo; ava.alt = name; } else { ava.removeAttribute('src'); ava.alt=''; }
  }

  // --- Монеты
  function renderCoins(){
    document.getElementById('pf-coins').textContent = +(localStorage.getItem(WALLET_KEY)||0);
  }

  // --- Последние призы
  function renderPrizes(){
    const wrap = document.getElementById('pf-prizes');
    const log = getJSON(PRIZES_KEY, []) || [];
    if (!log.length){ wrap.innerHTML = '<div class="pf-muted">Пока пусто.</div>'; return; }
    wrap.innerHTML = log.slice(0,6).map(x =>
      `<div class="pf-item"><i class="pf-dot"></i><div>🎁 ${esc(x.name)}</div><div class="pf-muted">📅 ${fmtDate(x.ts)}</div></div>`
    ).join('');
  }

  // --- Игра «Шмель»
  function renderFlappy(){
    const st = (window.SWR && SWR.get && SWR.get()) || window.MiniState || {};
const bestLS = +(localStorage.getItem(FLAPPY_BEST)||0);
const bestSt = +(st.my_best_score||0);
const best = Math.max(bestLS, bestSt);
document.getElementById('pf-flappy-best').textContent = best;
if (best > bestLS) { try{ localStorage.setItem(FLAPPY_BEST, String(best)); }catch(_){} }

    const me = String(TG?.initDataUnsafe?.user?.id || 'anon');
    const daily = getJSON(LB_DAILY_KEY(), []) || [];
    const all   = getJSON(LB_ALL_KEY,    []) || [];

    const ixToday = daily.findIndex(r=> String(r.uid) === me);
    const ixAll   = all.findIndex  (r=> String(r.uid) === me);

    document.getElementById('pf-flappy-rank').textContent = ixToday>=0 ? (ixToday+1) : '—';
    document.getElementById('pf-today-rank').textContent  = ixToday>=0 ? (ixToday+1) : '—';
    document.getElementById('pf-all-rank').textContent    = ixAll>=0   ? (ixAll+1)   : '—';
  }


  // --- Рефералы
  function renderRefs(){
    const list = getJSON(REFS_KEY, []) || [];
    document.getElementById('pf-refs-count').textContent = list.length;
    const box = document.getElementById('pf-refs-list');
    if (!list.length){ box.innerHTML = '<div class="pf-muted">Пока нет приглашённых.</div>'; return; }
    box.innerHTML = list.slice(-5).reverse().map(r =>
      `<div class="pf-item"><i class="pf-dot"></i><div>${esc(r.name||('ID '+r.uid))}</div><div class="pf-muted">· ${fmtDate(r.ts)}</div></div>`
    ).join('');
  }


  // Публичный API (можно дергать из колеса/игр)
  window.Profile = {
    incPoints(n){ // +монеты
      const cur = +(localStorage.getItem(WALLET_KEY)||0);
      localStorage.setItem(WALLET_KEY, String(Math.max(0, cur + (n|0))));
      renderCoins(); try{ window.syncCoinsUI?.(); }catch(_){}
    },
    setPrize(name){ // лог приза
      const log = getJSON(PRIZES_KEY, [])||[];
      log.unshift({name, ts: Date.now()});
      setJSON(PRIZES_KEY, log.slice(0,30));
      renderPrizes();
    },
    addReferral(user){ // реферал
      const list = getJSON(REFS_KEY, [])||[];
      const uid  = user?.id || ('u'+Math.random().toString(36).slice(2,7));
      if (!list.find(x=>x.uid===uid)){
        list.push({uid, name: [user?.first_name,user?.last_name].filter(Boolean).join(' ') || ('User '+uid), ts:Date.now()});
        setJSON(REFS_KEY, list);
      }
      renderRefs();
    },
    refresh(){ renderHead(); renderCoins(); renderPrizes(); renderFlappy(); renderPassport(); renderRefs(); }
  };

  // Экспорт синка монет для других модулей
  window.syncCoinsUI = renderCoins;

  // Автоинициализация при загрузке страницы
  function initProfilePage(){
    renderHead(); renderCoins(); renderPrizes(); renderFlappy(); renderPassport(); renderRefs(); bindInvite();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initProfilePage);
  else initProfilePage();
})();

// === Block separator ===

// Открыть шторку «Последние призы» и подлить содержимое из профиля
  window.openLastPrizesSheet = function(){
    const tpl  = document.getElementById('tpl-lastpriz');
    const html = tpl ? tpl.innerHTML : '<div class="card"><div class="h1">Последние призы</div><div id="pf-prizes-sheet"></div></div>';

    window.openSheet({ title: 'Последние призы', html, from: 'bottom' });

    // Бережно копируем готовый список призов из профиля
    const src = document.getElementById('pf-prizes');
    const dst = document.getElementById('pf-prizes-sheet');
    if (src && dst) dst.innerHTML = src.innerHTML;
  };

// === Block separator ===

document.addEventListener('DOMContentLoaded', () => {
  const ALLOW = 'input, textarea, select, [contenteditable], .selectable, .allow-select';

  // Блокируем начало выделения за пределами разрешённых мест
  document.addEventListener('selectstart', (e) => {
    if (e.target.closest(ALLOW)) return;
    e.preventDefault();
  }, { passive:false });

  // Рубим системное меню по долгому тапу (iOS/Android)
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest(ALLOW)) return;
    e.preventDefault();
  }, { passive:false });

  // Если что-то всё же выделилось — снимаем выделение
  document.addEventListener('selectionchange', () => {
    const activeOk = document.activeElement && document.activeElement.matches(ALLOW);
    if (!activeOk) {
      const sel = window.getSelection && window.getSelection();
      if (sel && sel.rangeCount) sel.removeAllRanges();
    }
  });
});

// === Block separator ===

(function(){
  function toast(msg){ try{ window.showToast?.(msg); }catch(_){ console.log('[toast]', msg); } }
  function safeNum(x){ const n = Number(x); return Number.isFinite(n) ? n : 0; }

  async function call(type, data){
    try{ return await (window.api ? window.api(type, data||{}) : Promise.resolve({ok:false, error:'no_api'})); }
    catch(e){ return { ok:false, error:String(e) }; }
  }

  // Coins
  const COIN_KEY='beer_coins';
  function setLocalCoins(v){
    localStorage.setItem(COIN_KEY, String(Math.max(0, v|0)));
    try{ window.syncCoinsUI && window.syncCoinsUI(); }catch(_){}
    const pf = document.getElementById('pf-coins'); if (pf) pf.textContent = String(v|0);
  }
  window.addCoins = async function(delta, src){
    delta = safeNum(delta)||0;
    const res = await call('coins.ledger', { delta, src: src || 'ui' });
    if (res && res.ok && typeof res.balance === 'number'){ setLocalCoins(res.balance); }
    else toast('Не удалось обновить баланс');
    return res;
  };

  // Wheel claim
  document.addEventListener('click', async (e)=>{
    const btn = e.target.closest('#claimBtn');
    if (!btn) return;
    const prize = btn.dataset && btn.dataset.bonus || '—';
    await call('bonus.claim', { prize_name: prize, src:'wheel' });
  });



  // Quiz finish (custom event)
  document.addEventListener('trivia:finish', async (e)=>{
    const d = e.detail || {};
    await call('quiz.result', { quiz_id: d.quiz_id || 'beer_trivia_v1', correct: d.correct|0, total: d.total|0, reward_coins: d.reward_coins|0 });
    if (d.reward_coins) await window.addCoins(d.reward_coins, 'quiz');
  });

  // Game submit
  window.Tournament = window.Tournament || {};
  const _submit = window.Tournament.submit;
  window.Tournament.submit = async function(score){
    try{ if (typeof _submit === 'function') _submit(score); }catch(_){}
    await call('game.submit', { game_id:'flappy_bee', score: score|0, mode:'daily' });
  };
})();

// === Block separator ===

// PATCH: click on stamp card -> collect (case-insensitive code)
document.addEventListener('click', async function(e){
  var card = e.target.closest('#passport-grid .pslot');
  if (!card) return;
  var code = String(card.getAttribute('data-code')||'').trim();
  if (!code) return;
  try {
    await (window.api ? window.api('style.collect', { style_id: code.toLowerCase(), status:'collected' }) : Promise.resolve());
  } catch(_) {}
}, { passive:true });

// === Block separator ===

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

// === Block separator ===

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

// === Block separator ===

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

// === Block separator ===

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

// === Block separator ===

(function(){
  'use strict';
  if (window.__SHEET_REPAINT_SAFE__) return; window.__SHEET_REPAINT_SAFE__ = true;
  let throttle = false;
  function repaintOnce(){
    if (throttle) return;
    throttle = true;
    requestAnimationFrame(function(){
      try{
        const st = window.MiniState || (window.SWR && window.SWR.get && window.SWR.get()) || {};
        if (typeof window.paintBadgesFromState === 'function'){
          window.paintBadgesFromState(st);
        }
      }catch(_){}
      throttle = false;
    });
  }
  const mo = new MutationObserver(function(muts){
    // Only react when nodes are added into sheet (open or tab switch), ignore class flips on .pslot
    for (const m of muts){
      if (m.type === 'childList'){
        if ((m.target && (m.target.id === 'sheet' || (m.target.closest && m.target.closest('#sheet')))) ||
            (document.getElementById('passport-grid') || document.querySelector('#sheet .pslot'))){
          repaintOnce();
          break;
        }
      }
    }
  });
  try{
    const sheet = document.getElementById('sheet') || document.body;
    mo.observe(sheet, {subtree:true, childList:true}); // no attribute watching to avoid loops
  }catch(_){}
})();

// === Block separator ===

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

// === Block separator ===

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

// === Block separator ===

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

// === Block separator ===

(function(){
  'use strict';
  if (window.__PASSPORT_PIN_GUARD__) return; window.__PASSPORT_PIN_GUARD__ = true;

  const API = (typeof window.api === 'function') ? window.api : null;
  const PIN_CODE = String(window.DEMO_PIN || window.PIN_CODE || '1111');

  function toast(msg, ok){
    try{
      if (window.showToast) return window.showToast(msg, ok);
      // fallback
      if (!ok) console.warn(msg); else console.log(msg);
    }catch(_){}
  }

  function updatePassportCaches(styleCode){
    try{
      const code = String(styleCode||'').trim();
      if (!code) return;
      // beer_passport map
      let map = {}; try{ map = JSON.parse(localStorage.getItem('beer_passport')||'{}')||{}; }catch(_){}
      map[code] = 1;
      localStorage.setItem('beer_passport', JSON.stringify(map));

      // beer_passport_v1 {stamps:[]}
      let v1 = {}; try{ v1 = JSON.parse(localStorage.getItem('beer_passport_v1')||'{}')||{}; }catch(_){}
      const arr = Array.isArray(v1.stamps) ? v1.stamps.slice() : [];
      const codeL = code.toLowerCase();
      if (!arr.some(s => String(s).toLowerCase()===codeL)) arr.push(code);
      localStorage.setItem('beer_passport_v1', JSON.stringify({ stamps: arr }));
    }catch(_){}
  }

  // Prevent double prompts & double sends
  let inFlight = false;

  document.addEventListener('click', async function onClickCapture(e){
    // We handle in capture phase to stop other listeners from firing duplicate prompts
  }, true);

  document.addEventListener('click', async function onClick(e){
    const tgt = e.target;
    const card = tgt && tgt.closest ? tgt.closest('.pslot') : null;
    if (!card) return; // not a passport card
    const grid = card.closest('#passport-grid');
    if (!grid) return; // only process inside passport grid
    // Prevent other handlers to avoid double prompts
    e.stopImmediatePropagation();
    e.preventDefault();

    // If already collected — do nothing (button inactive)
    if (card.classList.contains('is-done') || card.getAttribute('aria-disabled')==='true'){
      const badge = card.querySelector('.pslot__badge');
      if (badge){
        badge.setAttribute('aria-disabled','true');
      }
      return;
    }

    if (inFlight) return; // guard

    const code = String(card.getAttribute('data-code') || card.getAttribute('data-style-id') || '').trim();
    if (!code) return;

    // Ask for PIN exactly once
    inFlight = true;
    card.classList.add('is-busy');
    try{
      const badge = card.querySelector('.pslot__badge');
      if (badge) badge.setAttribute('aria-busy','true');

      const pin = window.prompt('PIN сотрудника (демо: 1111)');
      if (pin == null){ // cancel
        toast('Отменено', false);
        return;
      }
      if (String(pin) !== PIN_CODE){
        toast('PIN неверный', false);
        return;
      }

      // Correct PIN -> send event to worker
      if (API){
        const r = await API('style.collect', { style_id: String(code) });
        if (r && r.ok){
          // Update local caches and repaint
          updatePassportCaches(code);
          // Mark UI as collected
          card.classList.add('is-done');
          card.setAttribute('aria-disabled','true');
          if (badge){
            badge.textContent = 'Получен';
            badge.setAttribute('aria-disabled','true');
            badge.removeAttribute('aria-busy');
          }
          try{
            const st = (window.SWR && window.SWR.get && window.SWR.get()) || window.MiniState || {};
            if (r.fresh_state && window.applyServerState){
              window.applyServerState(r.fresh_state);
            }else if (window.paintBadgesFromState){
              window.paintBadgesFromState(st);
            }
          }catch(_){}
          toast('Штамп получен', true);
        }else{
          toast((r && r.error) ? r.error : 'Ошибка сети', false);
        }
      }else{
        // No API available — do not send, do not mark collected
        toast('API недоступен', false);
      }
    }finally{
      card.classList.remove('is-busy');
      const badge = card.querySelector('.pslot__badge');
      if (badge) badge.removeAttribute('aria-busy');
      inFlight = false;
    }
  }, true); // use capture to outrun other listeners

})();

// === Block separator ===

(function(){
  if (window.__REFS_HOOK_MIN__) return; window.__REFS_HOOK_MIN__ = true;
  function applyRefsFromState(s){
    try{
      var refs = (s && (s.ref_total!=null ? s.ref_total : s.ref_count));
      if (refs == null){
        try{
          var raw = localStorage.getItem('beer_refs_v1');
          if (raw){ var arr = JSON.parse(raw); refs = Array.isArray(arr) ? arr.length : 0; }
        }catch(_){}
      }
      if (refs == null){
        try{ refs = +(localStorage.getItem('beer_refs_total')||'0'); }catch(_){}
      }
      refs = Number(refs||0);
      var el = document.getElementById('pf-refs-count');
      if (el) el.textContent = String(refs);
      try{ localStorage.setItem('beer_refs_total', String(refs)); }catch(_){}
    }catch(_){}
  }
  // hook both state appliers
  var _a = window.applyServerState;
  window.applyServerState = function(s){ try{ _a && _a(s); } finally { applyRefsFromState(s); } };
  var _b = window.applyIfNew;
  window.applyIfNew = function(s){ try{ _b && _b(s); } finally { applyRefsFromState(s); } };
  // paint from cache on boot
  try{
    var cached = +(localStorage.getItem('beer_refs_total')||'0');
    var el = document.getElementById('pf-refs-count');
    if (el && cached) el.textContent = String(cached);
  }catch(_){}
})();