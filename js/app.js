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

    // ===== Confetti (simple) =====
    const confettiCanvas = document.getElementById('confetti');
    const ctx = confettiCanvas.getContext('2d');
    function resizeCanvas(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
    window.addEventListener('resize', resizeCanvas); resizeCanvas();
    function confettiBurst(n=140, duration=900){
      const parts = Array.from({length:n},()=>({
        x: Math.random()*confettiCanvas.width,
        y: -10,
        vx: (Math.random()-0.5)*4,
        vy: Math.random()*3+2,
        r: Math.random()*3+1,
        a: 1
      }));
      const t0 = performance.now();
      function frame(t){
        const dt = (t - (confettiBurst._lt||t))/16; confettiBurst._lt = t;
        ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
        parts.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.a -= 0.01*dt; ctx.globalAlpha = Math.max(0,p.a); ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle = ['#f9b24d','#f29117','#ffd59c','#fff'][p.r|0 % 4]; ctx.fill(); });
        if (t - t0 < duration){ requestAnimationFrame(frame); } else { ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }
      }
      requestAnimationFrame(frame);
    }

    // ===== App State & Storage =====
    const APP = {
      BOT_USERNAME: '@CineCraft_robot', // TODO: замените на @имя_бота
      WORKER_BASE: 'https://your-worker.example.dev/', // TODO: замените на ваш Worker
      API_KEY: 'dev-123',
      COOLDOWN_SPIN_HOURS: 24,
      MAX_TRIVIA: 5,
    };
    const store = {
      get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def; }catch(_){ return def }},
      set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
      now(){ return Date.now(); }
    };
    const SKEY = {
      coins: 'beer_coins',
      spinAt: 'beer_spin_next',
      rewards: 'beer_rewards',
      passport: 'beer_passport',
      visits: 'beer_visits',
      trivia: 'beer_trivia',
    };
    function addCoins(n){ const c = Math.max(0, (store.get(SKEY.coins,0) + n)|0); store.set(SKEY.coins,c); syncCoins(); }
    function coins(){ return store.get(SKEY.coins,0)|0; }

    function syncCoins(){
      qsa('#coins,#coins-inline,#coins-profile').forEach(el=> el && (el.textContent = coins()));
      const lvl = levelFromCoins(coins());
      const pct = Math.min(100, (coins() % 1000)/10);
      const lvlEl = document.getElementById('level'); if (lvlEl) lvlEl.textContent = lvl;
      const lm = document.getElementById('lvl-meter'); if (lm) lm.style.width = pct+'%';
      const cm = document.getElementById('coin-meter'); if (cm) cm.style.width = Math.min(100, coins()/10)+'%';
    }
    function levelFromCoins(c){ if (c >= 3000) return 'Gold'; if (c >= 1500) return 'Silver'; return 'Bronze'; }

    // ===== Pages: Home interactions =====
    document.addEventListener('click', (e)=>{
      const openBtn = e.target.closest('[data-open-sheet]');
      if (openBtn){ e.preventDefault(); const tplSel = openBtn.dataset?.template || openBtn.getAttribute('data-template') || openBtn.dataset?.tpl;const ttl    = openBtn.dataset?.title || openBtn.getAttribute('data-title') || openBtn.getAttribute('title') || '';const from   = openBtn.dataset?.from  || 'bottom';let sheetHtml = '';if (tplSel){ const tpl = document.querySelector(tplSel); if (tpl) sheetHtml = tpl.innerHTML; }if (typeof openSheet==='function'){ openSheet({ title: ttl, html: sheetHtml, from }); }else { const sheet=document.getElementById('sheet'); const body=document.getElementById('sheet-body')||sheet?.querySelector('.sheet__body'); if (sheet){ if (body) body.innerHTML=sheetHtml; sheet.classList.add('is-open'); document.body.classList.add('sheet-open'); } }try{ const st = window.MiniState || (window.SWR && window.SWR.get && window.SWR.get()) || {}; if (typeof paintBadgesFromState==='function') paintBadgesFromState(st);}catch(_){ }if (typeof initSheet==='function') initSheet(ttl||''); return; }
      const tab = e.target.closest('[data-page]'); if (tab){ e.preventDefault(); navigateTo(tab.dataset.page); }

      // sheet actions
      const act = e.target.closest('[data-action]')?.dataset.action;
      if (!act) return;
      switch(act){
        case 'start-cap': startCapToss(); break;
        case 'cap-help': alert('Свайпай, чтобы бросать. Комбо и «Foam Frenzy» позже прикрутим.'); break;
        case 'spin': handleSpin(); break;

        case 'reset-passport': resetPassport(); break;
        case 'submit-trivia': submitTrivia(); break;
        case 'reset-trivia': resetTrivia(); break;
        case 'copy-ref': copyRef(); break;
        case 'share-ref': shareRef(); break;
        case 'add-visit': addVisit(); break;
      }
    });

    // ===== Router bootstrap =====
    const start = currentId(); history.replaceState({id:start}, '', '#'+start); setActivePage(start);
    setTimeout(()=>{ TG?.disableVerticalSwipes?.(); syncBack(); }, 0);
    setTimeout(()=>{ TG?.disableVerticalSwipes?.(); syncBack(); }, 300);

    // ===== User name in profile =====
    (function fillUser(){
      const u = TG?.initDataUnsafe?.user; const name = u ? (u.first_name + (u.last_name? (' ' + u.last_name) : '')) : 'Гость';
      const nameEl = document.getElementById('user-name'); if (nameEl) nameEl.textContent = name;
    })();

    // ===== Sheet initializers =====
    
function initSheet(title){
  if (/паспорт/i.test(title)) {
    // при открытии шторки всегда красим из актуального источника:
    // 1) свежий серверный state, 2) локальный кэш (v1 или legacy)
    let st = window.MiniState || {};
    let styles = Array.isArray(st.styles) ? st.styles
               : (Array.isArray(st.styles_user) ? st.styles_user : null);
    if (!styles) styles = getCachedStyles();
    try { paintBadgesFromState({styles}); } catch(_){}
  }
  if (/колесо/i.test(title)) initSpin();
  if (/реферал|друз/i.test(title)) initRef();
  if (/викторин/i.test(title)) renderTrivia();
  if (/визит/i.test(title)) renderVisits();
  if (/cap toss/i.test(title)) initCapUI();
  syncCoins();
}


    // ===== Rewards feed =====
    function logReward(rec){ const r = store.get(SKEY.rewards,[]); r.unshift({ts:Date.now(),...rec}); store.set(SKEY.rewards,r); renderRewards(); }
    function renderRewards(){
      const r = store.get(SKEY.rewards,[]); const box = document.getElementById('rewards-feed'); if (!box) return;
      if (!r.length){ box.textContent='Пока пусто'; return; }
      box.innerHTML = r.slice(0,8).map(x=>`<div>• ${new Date(x.ts).toLocaleString()} — ${x.source}: <b>${x.prize}</b></div>`).join('');
    }




// ===== Referrals =====
function initRef(){
  const TG = window.Telegram && window.Telegram.WebApp;
  const uid = TG && TG.initDataUnsafe && TG.initDataUnsafe.user && TG.initDataUnsafe.user.id
    ? String(TG.initDataUnsafe.user.id).trim()
    : "";

  // бот из конфигурации или жёстко наш
  const rawBot = (window.APP && (APP.BOT_USERNAME || APP.BOT)) || "CineCraft_robot";
  const bot = String(rawBot).replace(/^@/, ""); // убираем @ на всякий

  // мини-апп диплинк (НЕ bot ?start=)
  const link = uid
    ? `https://t.me/${bot}/app?startapp=ref_${uid}`
    : `https://t.me/${bot}/app`;

  const input = document.getElementById('ref-link');
  if (input) input.value = link;
}

async function copyRef(){
  const el = document.getElementById('ref-link');
  if (!el) return;
  try { el.select?.(); document.execCommand?.('copy'); } catch(_) {}
  try { await navigator.clipboard.writeText(el.value); } catch(_) {}
  try { haptic('light'); } catch(_) {}
}

async function shareRef(){
  const el = document.getElementById('ref-link');
  if (!el) return;
  const txt = 'Залетай в пивной мини-апп и забери приз! ' + el.value;
  try {
    await navigator.share?.({ text: txt });
  } catch(_) {
    try { await navigator.clipboard.writeText(el.value); } catch(_) {}
  }
  try { haptic('light'); } catch(_) {}
}



    // ===== Init state =====
    syncCoins(); renderRewards();
  })();

// === Block separator ===

(function introSlider(){
  const TG = window.Telegram && window.Telegram.WebApp;

  // ====== КОНФИГ КНОПОК ПО СЛАЙДАМ ======
  // Индексы соответствуют порядку секций .intro__slide в #intro-slides
  const INTRO_CFG = {
    actions: {
      0: [ // Слайд 1 — две рядом
        { label:'Нет', type:'ghost', do:'navigate', value:'no' },
        { label:'Есть 18',  type:'primary', do:'answer', to:'next' } // перейти в раздел "Запись"
      ],
      1: [ // Слайд 0 — одна кнопка
        { label:'Продолжить', type:'primary', do:'next' }
      ],
      2: [ // Слайд 2 — одна кнопка
        { label:'Продолжить', type:'primary', do:'next' }
      ],
      3: [ // Слайд 3 — одна кнопка
        { label:'Играть', type:'ghost', do:'navigate' }
      ]
      // Примеры для будущих слайдов:
      // 3: [
      //   { label:'Открыть сайт', type:'primary', do:'link', href:'https://example.com' }
      // ],
      // 4: [
      //   { label:'Показать окно', type:'primary', do:'sheet', title:'Демо', tpl:'#tpl-example', from:'bottom' }
      // ]
    },
    onAnswer: (index, value) => {
      // Твой хук на ответы "Да/Нет" и т.п.
      // Например: localStorage.setItem('intro_answer_'+index, value);
      // console.log('Answer on slide', index, '=>', value);
    }
  };

  // ====== DOM ======
  const root = document.getElementById('intro');
  if(!root) return;

  const slidesWrap = root.querySelector('#intro-slides');
  const slides = Array.from(root.querySelectorAll('.intro__slide'));
  const progress = root.querySelector('#intro-progress');
  const actions = root.querySelector('#intro-actions');

  // Прогресс
  progress.innerHTML = slides.map(()=>'<i class="intro__seg"></i>').join('');
  const segs = Array.from(progress.children);

  let idx = 0, touchX0=0, touchX=0, dragging=false, backHandler=null;

  const haptic = (lvl='light') => { try{ TG?.HapticFeedback?.impactOccurred(lvl); }catch(_){ } };

  // Сервис: создать кнопку
  function btnHTML(cfg){
    const cls = ['intro__btn'];
    if (cfg.type === 'primary') cls.push('intro__btn--primary');
    if (cfg.type === 'ghost')   cls.push('intro__btn--ghost');
    const attrs = [];
    if (cfg.do) attrs.push(`data-act="${cfg.do}"`);
    if (cfg.value != null) attrs.push(`data-val="${String(cfg.value)}"`);
    if (cfg.to)    attrs.push(`data-to="${String(cfg.to)}"`);
    if (cfg.href)  attrs.push(`data-href="${String(cfg.href)}"`);
    if (cfg.title) attrs.push(`data-title="${String(cfg.title)}"`);
    if (cfg.tpl)   attrs.push(`data-tpl="${String(cfg.tpl)}"`);
    if (cfg.from)  attrs.push(`data-from="${String(cfg.from)}"`);
    return `<button class="${cls.join(' ')}" ${attrs.join(' ')}>${cfg.label}</button>`;
  }

  // Рендер низа (кнопок)
  function renderActions(){
    const set = INTRO_CFG.actions[idx] || defaultActions();
    // сетка: 1 / 2 / 3+
    actions.className = 'intro__actions';
    if (set.length === 1) actions.classList.add('intro__actions--one');
    else if (set.length === 2) actions.classList.add('intro__actions--two');
    else actions.classList.add('intro__actions--multi'); // см. CSS ниже
    actions.innerHTML = set.map(btnHTML).join('');
  }

  // Дефолт, если не задал для слайда: "Продолжить" или "Готово" на последнем
  function defaultActions(){
    const last = (idx === slides.length - 1);
    return [ { label: last ? 'Готово' : 'Продолжить', type:'primary', do: last ? 'done' : 'next' } ];
    // можно заменить на то, что тебе нужно по умолчанию
  }

  function apply(){
    slides.forEach((s,i)=> s.classList.toggle('active', i===idx));
    segs.forEach((d,i)=> d.classList.toggle('active', i<=idx));
    renderActions();
  }

  // Открыть / закрыть
  function openIntro(startIndex){
    if (Number.isInteger(startIndex)) idx = Math.max(0, Math.min(startIndex, slides.length-1));
    root.classList.add('is-open');
    document.body.classList.add('intro-open');

    try{
      TG?.BackButton?.show?.();
      backHandler = ()=> closeIntro();
      TG?.BackButton?.onClick?.(backHandler);
      TG?.disableVerticalSwipes?.();
    }catch(_){}

    apply();
    window.syncBack?.();
  }
  function closeIntro(){
    root.classList.remove('is-open');
    document.body.classList.remove('intro-open');

    try{ TG?.BackButton?.offClick?.(backHandler); backHandler=null; }catch(_){}
    if (typeof window.syncBack === 'function') window.syncBack(); else try{ TG?.BackButton?.hide?.(); }catch(_){}
  }

  function next(){ if(idx<slides.length-1){ idx++; apply(); haptic(); } }
  function prev(){ if(idx>0){ idx--; apply(); haptic(); } }

  // Жесты перелистывания
  slidesWrap.addEventListener('touchstart', e=>{ dragging=true; touchX0=touchX=e.touches[0].clientX; }, {passive:true});
  slidesWrap.addEventListener('touchmove',  e=>{ if(!dragging) return; touchX=e.touches[0].clientX; }, {passive:true});
  slidesWrap.addEventListener('touchend',   ()=>{ if(!dragging) return; dragging=false;
    const dx = touchX - touchX0; if (Math.abs(dx)>50){ dx<0 ? next() : prev(); }
  });

  // Клики по кнопкам низа
  actions.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-act]'); if(!b) return;
    const act  = b.getAttribute('data-act');
    const val  = b.getAttribute('data-val');
    const to   = b.getAttribute('data-to');
    const href = b.getAttribute('data-href');
    const title= b.getAttribute('data-title');
    const tpl  = b.getAttribute('data-tpl');
    const from = b.getAttribute('data-from') || 'bottom';

    switch(act){
      case 'next': next(); break;
      case 'prev': prev(); break;
      case 'done': haptic('medium'); closeIntro(); break;
      case 'answer':
        try{ INTRO_CFG.onAnswer && INTRO_CFG.onAnswer(idx, val); }catch(_){}
        next(); break;
      case 'navigate':
        closeIntro();
        if (typeof window.navigateTo === 'function') window.navigateTo(to);
        else if (to) location.hash = '#'+to;
        break;
      case 'link':
        try{ TG?.openLink ? TG.openLink(href) : window.open(href, '_blank'); }catch(_){}
        break;
      case 'sheet':
        closeIntro();
        if (typeof window.openSheet === 'function'){
          const tplNode = tpl ? document.querySelector(tpl) : null;
          const html = tplNode ? tplNode.innerHTML : '<div class="card"><b>Нет шаблона</b></div>';
          window.openSheet({ title, html, from });
        }
        break;
    }
  });

  // Открывать по кнопке: data-open-intro или data-open-intro="2" (старт слайд 2)
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-open-intro]');
    if (!t) return;
    e.preventDefault();
    const start = parseInt(t.getAttribute('data-open-intro'), 10);
    openIntro(Number.isFinite(start) ? start : undefined);
  });

  // Экспорт (если захочешь открыть из кода)
  window.openIntro  = openIntro;
  window.closeIntro = closeIntro;
})();

// === Block separator ===

/* ===== Flappy-lite+ — coins, shield, custom sprites, BackButton ШМЕЛЬ ===== */
(function flappyLitePlus(){
  const TG = window.Telegram && window.Telegram.WebApp;

  // DOM
  const root   = document.getElementById('flappy'); if (!root) return;
  const stage  = document.getElementById('fl-stage');
  const birdEl = document.getElementById('fl-bird');
  const hintEl = document.getElementById('fl-hint');
  const scoreEl= document.getElementById('fl-score');
  const barEl  = document.getElementById('fl-bar');

  const coinIco= document.getElementById('fl-coin-ico');
  const coinCnt= document.getElementById('fl-coin-count');
  const shIco  = document.getElementById('fl-shield-ico');
  const shBar  = document.getElementById('fl-shield-bar');

  const resBox = document.getElementById('fl-result');
  const bestEl = document.getElementById('fl-best');
  const worldEl= document.getElementById('fl-world');
  const cta    = document.getElementById('fl-cta');

  /* ===== ASSETS: поменяй пути/размеры под свои картинки ===== */
  const ASSETS = {
    bird:   { img: 'bumblebee.png',  w: 56, h: 42 },
    pipes:  { top:'pipe_top.png', bottom:'pipe_bottom.png', width:54 },
    coin:   { img:'coin.png',   w:32, h:32, value:5 },
    shield: { img:'shield.png', w:34, h:34, dur_ms:6000 }
  };

  /* ===== TUNING ===== */
  const WORLD_RECORD     = 200;
  const GRAVITY          = 1800;
  const FLAP_VELOCITY    = -520;
  const SPEED_X          = 220;
  const ACCEL_EACH_MS    = 8000;
  const SPEED_STEP       = 28;
  const PIPE_SPAWN_MS    = 1300;
  const GAP_MIN          = 150;
  const GAP_MAX          = 190;
  const GAP_TOP_PAD      = 80;
  const BIRD_X_FACTOR    = 0.25;
  const ROT_UP           = -35, ROT_DOWN = 90;
  const SAFE_FLOOR_PAD   = 6;

  // items
  const COIN_IN_GAP_PROB = 0.9;
  const SHIELD_PROB      = 0.9;
  const SHIELD_COOLDOWN  = 9000;

  // магнит монет при щите
  const MAGNET_ENABLED   = true;
  const MAGNET_RADIUS    = 140;
  const MAGNET_PULL_PX_S = 300;

  // STATE
  let best     = Number(localStorage.getItem('flappy_best')||0);
  let running  = false, started=false;
  let raf      = 0, spawnT = Infinity, t0 = 0, backOff=null; // PATCH: spawnT=Infinity, t0=0
  let w=0,h=0, birdX=0, birdY=0, birdVY=0;

  let pipes=[];   // {x, gapY, gap, topEl, botEl, passed:false}
  let items=[];   // [{type:'coin'|'shield', x,y, el}]
  let lastShieldSpawn = 0;

  let score=0, coins=0;
  let shieldActive=false, shieldUntil=0;

  // ---- Global wallet (общий баланс мини-аппа) ----
const WALLET_KEY = 'beer_coins';
function getWallet(){ return +(localStorage.getItem(WALLET_KEY)||0); }
function setWallet(v){ localStorage.setItem(WALLET_KEY, String(Math.max(0, v|0))); try{ window.syncCoinsUI?.(); }catch(_){ } }
// Унифицировано: если у тебя уже есть window.addCoins — используем его.
function addWallet(n){ if (typeof window.addCoins==='function') return window.addCoins(n|0); setWallet(getWallet()+(n|0)); }
const COIN_TO_WALLET = 1; // 1 подобранная монетка = 1 в общий баланс (поменяй при желании)


  // helpers
  const haptic = lvl=>{ try{ TG?.HapticFeedback?.impactOccurred(lvl||'light'); }catch(_){} };
  const clamp  = (v,a,b)=> Math.max(a, Math.min(b, v));
  const rand   = (a,b)=> a + Math.random()*(b-a);

  // apply assets → css vars & backgrounds
  function applyAssets(){
    document.documentElement.style.setProperty('--bird-w', (ASSETS.bird.w||48)+'px');
    document.documentElement.style.setProperty('--bird-h', (ASSETS.bird.h||36)+'px');
    if (ASSETS.bird.img){
      birdEl.classList.add('fl-bird--sprite');
      birdEl.style.backgroundImage = `url(${ASSETS.bird.img})`;
    } else {
      birdEl.classList.remove('fl-bird--sprite'); birdEl.style.backgroundImage = '';
    }
    document.documentElement.style.setProperty('--pipe-w', (ASSETS.pipes.width||76)+'px');
    if (ASSETS.coin.img)   coinIco.style.backgroundImage = `url(${ASSETS.coin.img})`;
    if (ASSETS.shield.img) shIco.style.backgroundImage = `url(${ASSETS.shield.img})`;
    document.documentElement.style.setProperty('--coin-w', (ASSETS.coin.w||32)+'px');
    document.documentElement.style.setProperty('--coin-h', (ASSETS.coin.h||32)+'px');
    document.documentElement.style.setProperty('--pow-w',  (ASSETS.shield.w||34)+'px');
    document.documentElement.style.setProperty('--pow-h',  (ASSETS.shield.h||34)+'px');
  }

  // layout
  function layout(){
    w = stage.clientWidth; h = stage.clientHeight;
    birdX = w * BIRD_X_FACTOR;
    if (!started){ birdY = h * 0.45; applyBird(); }
  }
  function applyBird(){ birdEl.style.left = birdX + 'px'; birdEl.style.top = birdY + 'px'; }
  function setScore(v){ scoreEl.textContent = v; }
  function setCoins(v){ coinCnt.textContent = v; }

  // pipes
  function spawnPipe(){
    const gap = rand(GAP_MIN, GAP_MAX);
    const minY = GAP_TOP_PAD + gap/2;
    const maxY = h - GAP_TOP_PAD - gap/2;
    const gapY = rand(minY, maxY);

    const top = document.createElement('div');
    const bot = document.createElement('div');
    top.className = 'fl-pipe-part';
    bot.className = 'fl-pipe-part';
    if (ASSETS.pipes.top && ASSETS.pipes.bottom){
      top.classList.add('fl-pipe--sprite'); bot.classList.add('fl-pipe--sprite');
      top.style.backgroundImage = `url(${ASSETS.pipes.top})`;
      bot.style.backgroundImage = `url(${ASSETS.pipes.bottom})`;
    }
    stage.appendChild(top); stage.appendChild(bot);

    const p = { x: w + (ASSETS.pipes.width||76), gapY, gap, topEl: top, botEl: bot, passed:false };
    pipes.push(p);
    positionPipe(p);

    // coin in gap?
    if (Math.random() < COIN_IN_GAP_PROB){
      const c = document.createElement('div');
      c.className = 'fl-coin';
      if (ASSETS.coin.img) c.style.backgroundImage = `url(${ASSETS.coin.img})`;
      stage.appendChild(c);
      items.push({ type:'coin', x: p.x + 200, y: gapY, el: c });
      positionItem(items[items.length-1]);
    }

    // occasional shield (with cooldown)
    if (Date.now() - lastShieldSpawn > SHIELD_COOLDOWN && Math.random() < SHIELD_PROB){
      const s = document.createElement('div');
      s.className = 'fl-power';
      if (ASSETS.shield.img) s.style.backgroundImage = `url(${ASSETS.shield.img})`;
      stage.appendChild(s);
      items.push({ type:'shield', x: p.x + 300, y: gapY - gap*0.35, el: s });
      positionItem(items[items.length-1]);
      lastShieldSpawn = Date.now();
    }
  }

  function positionPipe(p){
    const pipeW = (ASSETS.pipes.width||76);
    const th = p.gapY - p.gap/2;
    const bt = p.gapY + p.gap/2;
    p.topEl.style.left = p.x + 'px';
    p.topEl.style.top  = '0px';
    p.topEl.style.height = th + 'px';
    p.topEl.style.width  = pipeW + 'px';
    p.botEl.style.left = p.x + 'px';
    p.botEl.style.top  = bt + 'px';
    p.botEl.style.height = (h - bt) + 'px';
    p.botEl.style.width  = pipeW + 'px';
  }

  function positionItem(it){ it.el.style.left = it.x + 'px'; it.el.style.top  = it.y + 'px'; }
  function removePipe(p){ p.topEl.remove(); p.botEl.remove(); }
  function removeItem(it){ it.el.remove(); }

  // collisions
  function rectsOverlap(a,b){ return !(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom); }
  function collidePipe(){
    const br = birdEl.getBoundingClientRect();
    for (const p of pipes){
      if (rectsOverlap(br, p.topEl.getBoundingClientRect()) || rectsOverlap(br, p.botEl.getBoundingClientRect())) return true;
    }
    return false;
  }
  function collideItems(){
    const br = birdEl.getBoundingClientRect();
    const dead=[];
    for (let i=0;i<items.length;i++){
      const it = items[i];
      const ir = it.el.getBoundingClientRect();
      if (rectsOverlap(br, ir)){
        if (it.type==='coin'){
          coins += 1; setCoins(coins);
          score += (ASSETS.coin.value||5); setScore(score);
          haptic('medium');
        } else if (it.type==='shield'){
          activateShield();
          haptic('medium');
        }
        removeItem(it); dead.push(i);
      }
    }
    for (let i=dead.length-1;i>=0;i--) items.splice(dead[i],1);
  }

  // shield
  function activateShield(){
    shieldActive = true;
    shieldUntil  = Date.now() + (ASSETS.shield.dur_ms||6000);
    birdEl.classList.add('fl-bird--shield');
  }
  function updateShieldHud(){
    if (!shieldActive){ shBar.style.transform = 'scaleX(0)'; return; }
    const left = shieldUntil - Date.now();
    if (left <= 0){
      shieldActive = false; birdEl.classList.remove('fl-bird--shield');
      shBar.style.transform = 'scaleX(0)';
    } else {
      const pct = clamp(left / (ASSETS.shield.dur_ms||6000), 0, 1);
      shBar.style.transform = `scaleX(${pct})`;
    }
  }

  // control
  function flap(){
    if (!running) return;
    if (!started){
      // PATCH: первый тап — реальный старт
      started = true;
      hintEl.style.display = 'none';
      birdVY = FLAP_VELOCITY;
      t0 = performance.now();        // старт таймеров
      spawnT = t0;                   // разрешаем спавн
      tick._prev = t0;               // сброс дельты
    } else {
      birdVY = FLAP_VELOCITY;
    }
    haptic('light');
  }

  // loop
  function tick(){
    const now = performance.now();
    const dt  = Math.min(32, now - (tick._prev||now)); tick._prev = now;

    // PATCH: до старта — ничего не двигаем/не спавним/бар не бежит
    if (!started){
      birdY += Math.sin(now/300) * 0.12;  // лёгкое покачивание
      applyBird();
      updateShieldHud();
      raf = requestAnimationFrame(tick);
      return;
    }

    // progress bar — только после старта
    const elapsed = now - t0;
    const prog = Math.min(1, elapsed / 45000);
    barEl.style.transform = `scaleX(${1-prog})`;

    // speed
    const speed = SPEED_X + Math.floor(elapsed / ACCEL_EACH_MS) * SPEED_STEP;

    // bird physics
    birdVY += GRAVITY * (dt/1000);
    birdY  += birdVY * (dt/1000);
    const ang = clamp((birdVY/600)*45, ROT_UP, ROT_DOWN);
    birdEl.style.transform = `translate(-50%,-50%) rotate(${ang}deg)`;

    const topLimit = 6;
    const botLimit = h - SAFE_FLOOR_PAD;
    if (birdY <= topLimit){ birdY = topLimit; birdVY = 0; }
    if (birdY >= botLimit){ birdY = botLimit; if (!shieldActive){ crash(); return; } else { birdVY = -200; } }

    // move pipes/items (+ magnet)
    const dx = speed * dt/1000;
    for (const p of pipes){ p.x -= dx; positionPipe(p); }
    for (const it of items){
      it.x -= dx;
      if (MAGNET_ENABLED && shieldActive && it.type === 'coin'){
        const vx=birdX-it.x, vy=birdY-it.y, dist=Math.hypot(vx,vy);
        if (dist < MAGNET_RADIUS){
          const pull = MAGNET_PULL_PX_S * (dt/1000);
          const step = Math.min(pull, dist||0);
          const nx = vx/(dist||1), ny = vy/(dist||1);
          it.x += nx*step; it.y += ny*step;
          it.el.style.transform = 'translate(-50%,-50%) scale(1.08)';
        } else it.el.style.transform = 'translate(-50%,-50%)';
      } else it.el.style.transform = 'translate(-50%,-50%)';
      positionItem(it);
    }

    // passed score
    for (const p of pipes){
      if (!p.passed && p.x + (ASSETS.pipes.width||76) < birdX){
        p.passed = true; score += 1; setScore(score); haptic('light');
      }
    }

    // remove off-screen
    while (pipes.length && pipes[0].x < -(ASSETS.pipes.width||76)-2){ removePipe(pipes[0]); pipes.shift(); }
    while (items.length && items[0].x < -80){ removeItem(items[0]); items.shift(); }

    // collisions
    collideItems();
    if (collidePipe()){
      if (shieldActive){
        shieldActive = false; birdEl.classList.remove('fl-bird--shield'); shBar.style.transform = 'scaleX(0)';
        birdVY = -260;
      } else { crash(); return; }
    }

    // spawn pipes — только после старта (тут мы уже после return’а)
    if (now - spawnT > PIPE_SPAWN_MS){ spawnT = now; spawnPipe(); }

    // HUD
    applyBird();
    updateShieldHud();

    raf = requestAnimationFrame(tick);
  }

  function crash(){ haptic('heavy'); finish(); }
  function finish(){
    running=false; cancelAnimationFrame(raf);
    if (score > best){ best=score; try{ localStorage.setItem('flappy_best', String(best)); }catch(_){ } }

    // submit в турнир (как у тебя)
    try { window.Tournament?.submit(score); } catch(_) {}

    addWallet(Math.floor(coins * COIN_TO_WALLET)); // зачисляем все собранные за раунд


    document.getElementById('fl-best').textContent = best;
    document.getElementById('fl-world').textContent = WORLD_RECORD;
    resBox.classList.add('show'); cta.classList.add('show');
  }

  function resetScene(){
    // clear
    pipes.forEach(removePipe); pipes = [];
    items.forEach(removeItem); items = [];
    coins=0; setCoins(0);
    shieldActive=false; birdEl.classList.remove('fl-bird--shield'); shBar.style.transform = 'scaleX(0)';

    // bird / hud
    started=false; score=0; setScore(0);
    hintEl.style.display = '';
    birdVY = 0; birdEl.style.transform = 'translate(-50%,-50%) rotate(0deg)';
    barEl.style.transform = 'scaleX(1)';      // PATCH: бар полный на старте
    layout();

    // PATCH: до первого тапа ничего не спавним
    spawnT = Infinity;
    tick._prev = performance.now();
  }

  function openFlappy(){
    root.classList.add('is-open'); document.body.classList.add('flappy-open');
    try{
      TG?.BackButton?.show?.(); backOff = ()=> closeFlappy();
      TG?.BackButton?.onClick?.(backOff);
      TG?.disableVerticalSwipes?.(); TG?.expand?.();
    }catch(_){}

    resBox.classList.remove('show'); cta.classList.remove('show');

    applyAssets();
    layout(); resetScene();

    running = true;
    // PATCH: НЕ стартуем таймер тут; ждём первый тап
    raf = requestAnimationFrame(tick);
  }

  function closeFlappy(){
    running=false; cancelAnimationFrame(raf);
    root.classList.remove('is-open'); document.body.classList.remove('flappy-open');
    try{ TG?.BackButton?.offClick?.(backOff); TG?.BackButton?.hide?.(); }catch(_){}
  }

  // controls
  stage.addEventListener('pointerdown', (e)=>{ e.preventDefault(); flap(); }, {passive:false});
  document.addEventListener('keydown', (e)=>{
    if (!root.classList.contains('is-open')) return;
    if (e.code==='Space' || e.key==='ArrowUp'){ e.preventDefault(); flap(); }
    if (e.key==='Escape'){ closeFlappy(); }
  });

  // CTA
  cta.addEventListener('click', (e)=>{
    if (!e.target.closest('.btn')) return;
    closeFlappy(); openFlappy();
  });

  // openers
  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-open-flappy]'); if (!t) return;
    e.preventDefault(); openFlappy();
  });
  document.addEventListener('click', (e)=>{
    if (e.target.closest('[data-close-flappy]')) closeFlappy();
  });

  // resize
  new ResizeObserver(()=> layout()).observe(stage);
})();

// === Block separator ===

(function () {
  const wheel = document.getElementById('bonusWheel');
  const track = document.getElementById('wheelTrack');
  if (!wheel || !track) return;

  const items = Array.from(track.children);
  const N = items.length;

  const pill  = document.getElementById('pickedPill');
  const claim = document.getElementById('claimBtn');
  const spin  = document.getElementById('spinBtn');

  /* Название -> ссылка (поменяй под себя) */
  const bonusLinks = {
    "Кружка": "#tpl-lastpriz",
    "Футболка": "#tpl-lastpriz",
    "Фисташки": "#tpl-lastpriz",
    "Скидка": "#tpl-lastpriz",
    "Дегустация": "#tpl-lastpriz",
    "Монеты": "#tpl-lastpriz"
  };

  /* ================== общие утилиты ================== */
  let STEP = 114; // уточняем по факту после рендера
  requestAnimationFrame(() => {
    const a = items[0]?.getBoundingClientRect();
    const b = items[1]?.getBoundingClientRect();
    if (a && b) {
      const dx = Math.round(b.left - a.left);
      if (dx > 40 && dx < 300) STEP = dx;
    }
  });

  let curr = 0; // «плавающее» положение
  let startX = 0, startCurr = 0, dragging = false, lastX = 0, lastT = 0, vel = 0;
  let interacted = false; // станет true после первого выбора
  let spinning = false;   // блок повторного старта

  const mod = (a, n) => ((a % n) + n) % n;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function nearest(curr, idx, n) {
    let t = idx;
    while (t - curr > n / 2) t -= n;
    while (curr - t > n / 2) t += n;
    return t;
  }

  /* ===== Хаптики (Telegram + фоллбек) ===== */
  const TG = window.Telegram && window.Telegram.WebApp;
  function hapticPulse(level = 'light') {
    try {
      if (TG?.HapticFeedback) {
        if (level === 'selection') return TG.HapticFeedback.selectionChanged();
        TG.HapticFeedback.impactOccurred(level); // 'soft' | 'light' | 'medium' | 'heavy' | 'rigid'
        return;
      }
    } catch (_) {}
    try { if (navigator.vibrate) { navigator.vibrate(level === 'heavy' ? 30 : level === 'medium' ? 20 : 12); } } catch (_) {}
  }

  /* ====== Кулдаун «Забрать бонус» + таймер ====== */
  const COOLDOWN_MS = 0.1 * 60 * 60 * 1000; // 24 часа
  const UID = (TG?.initDataUnsafe?.user?.id) || 'anon';
  const CLAIM_KEY = 'bonusClaim_ts_' + UID;

  function getLastClaim() { return +(localStorage.getItem(CLAIM_KEY) || 0); }
  function setLastClaim(ts = Date.now()) { localStorage.setItem(CLAIM_KEY, String(ts)); }
  function remainingMs() { return Math.max(0, getLastClaim() + COOLDOWN_MS - Date.now()); }
  function fmtClock(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  let claimTimerId = null;
  function refreshClaimState() {
    if (!claim) return;

    const rem = remainingMs();
    const canClaim = interacted && rem <= 0;

    if (canClaim) {
      claim.disabled = false;
      claim.textContent = 'Забрать бонус';
      if (claimTimerId) { clearInterval(claimTimerId); claimTimerId = null; }
    } else {
      claim.disabled = true;
      if (interacted && rem > 0) {
        claim.textContent = 'Доступно через ' + fmtClock(rem);
        if (!claimTimerId) {
          claimTimerId = setInterval(() => {
            const r = remainingMs();
            if (r > 0) claim.textContent = 'Доступно через ' + fmtClock(r);
            else {
              clearInterval(claimTimerId); claimTimerId = null;
              claim.textContent = 'Забрать бонус';
              claim.disabled = !interacted;
            }
          }, 1000);
        }
      } else {
        claim.textContent = 'Забрать бонус';
        if (claimTimerId) { clearInterval(claimTimerId); claimTimerId = null; }
      }
    }
  }

  /* ================== UI ================== */
  function updatePillByIndex(idx) {
    const it = items[idx];
    const name = it?.dataset?.name || '—';
    const img = it?.querySelector('img')?.src || '';
    if (!pill) return;
    pill.classList.remove('muted');
    pill.innerHTML = img ? `<img src="${img}" alt=""><span>${name}</span>` : name;
    if (claim) {
      claim.disabled = false;
      claim.dataset.bonus = name;
    }
  }

  function updateUI() {
    // позиционирование как «кольцо»
    items.forEach((el, i) => {
      let dx = i - curr;
      dx = mod(dx + N / 2, N) - N / 2; // (-N/2; N/2]
      const x = dx * STEP;
      const s = 1 - Math.min(Math.abs(dx) * 0.16, 0.48);
      el.style.transform = `translate(-50%,-50%) translateX(${x}px) scale(${s})`;
      el.style.zIndex = String(1000 - Math.abs(dx) * 10);
      el.classList.toggle('active', Math.round(Math.abs(dx)) === 0);
    });

    if (interacted) {
      updatePillByIndex(mod(Math.round(curr), N));
    } else {
      if (pill) { pill.classList.add('muted'); pill.textContent = 'Нажми «Крутануть»'; }
      if (claim) { claim.disabled = true; delete claim.dataset.bonus; }
    }

    // важное: синхронизация состояния кнопки с кулдауном и монетами
    refreshClaimState();
    syncCoinsUI();
  }

  /* ====== Вращение со слабой вибрацией ====== */
  function spinTo(targetIdx, laps = 1, dur = 1600) {
    const base = nearest(curr, targetIdx, N);
    const dir = (base >= curr ? 1 : -1) || 1;
    const to = base + dir * (laps * N);

    const from = curr, t0 = performance.now();
    let lastPulse = 0;

    function tick(t) {
      const k = Math.min((t - t0) / dur, 1);
      curr = from + (to - from) * (1 - Math.pow(1 - k, 3)); // easeOut
      updateUI();

      // лёгкие пульсы во время вращения (в начале чаще)
      const period = 80 + 180 * k; // 80ms → 260ms
      if (t - lastPulse >= period) { hapticPulse('light'); lastPulse = t; }

      if (k < 1) {
        requestAnimationFrame(tick);
      } else {
        curr = to;
        interacted = true;
        updateUI();
      }
    }
    requestAnimationFrame(tick);
  }

  function snapTo(targetIdx, dur = 420) {
    const to = nearest(curr, targetIdx, N);
    const from = curr;
    const t0 = performance.now();
    function tick(t) {
      const k = Math.min((t - t0) / dur, 1);
      curr = from + (to - from) * easeOut(k);
      updateUI();
      if (k < 1) requestAnimationFrame(tick);
      else { curr = to; interacted = true; updateUI(); }
    }
    requestAnimationFrame(tick);
  }

  /* ================== Кошелёк монет БОНУСЫ РЕГУЛИРОВКА МОНЕТ  ================== */
  const COIN_KEY = 'beer_coins';
  const SPIN_COST = 1;

  function getCoins(){ return +(localStorage.getItem(COIN_KEY) || 0); }
  function setCoins(v){
    v = Math.max(0, v|0);
    localStorage.setItem(COIN_KEY, String(v));
    syncCoinsUI();
  }
  function addCoins(n){ setCoins(getCoins() + (n|0)); }

  function syncCoinsUI(){
    ['coins-inline','coins-inline-2','coins-profile'].forEach(id=>{
      const el = document.getElementById(id);
      if (el) el.textContent = getCoins();
    });
    if (spin){
      const lock = (getCoins() < SPIN_COST) || spinning;
      spin.classList.toggle('is-locked', lock);
      // Не делаем spin.disabled — чтобы клик показывал тост
    }
  }

  // (опционально) стартовый баланс для теста:
  if (getCoins() === 0) addCoins(300);

  /* ================== Toasts (всплывашки) ================== */
  function ensureToastStyles(){
    if (document.getElementById('toast-styles')) return;
    const css = `
.toasts{
  position:fixed; right:16px; bottom:calc(env(safe-area-inset-bottom,0px) + 16px);
  z-index:100000; display:grid; gap:8px; width:min(92vw,320px); pointer-events:none;
}
.toast{
  pointer-events:auto; display:flex; align-items:center; gap:10px;
  padding:12px 14px; border-radius:14px; color:#fff;
  background:rgba(18,20,24,.96); border:1px solid rgba(255,255,255,.12);
  box-shadow:0 10px 24px rgba(0,0,0,.35);
  transform:translateX(120%); opacity:0; animation:toast-in .25s ease forwards;
}
.toast--error{ border-color:rgba(255,107,107,.45); box-shadow:0 10px 24px rgba(255,107,107,.15); }
.toast--ok{    border-color:rgba(55,214,122,.45);  box-shadow:0 10px 24px rgba(55,214,122,.15); }
.toast__close{ margin-left:auto; opacity:.7; background:transparent; border:0; color:inherit; cursor:pointer; }
@keyframes toast-in { to { transform:translateX(0); opacity:1; } }
@keyframes toast-out{ to { transform:translateX(120%); opacity:0; } }

/* визуально «блок»: */
#spinBtn.is-locked{ opacity:.6; }
#spinBtn.is-locked:active{ transform:none; }

/* простые конфетти */
#confetti { position: fixed; left:0; top:0; width:100%; height:100%; pointer-events:none; overflow:visible; z-index:10000; }
.confetti-piece{ position: fixed; left: var(--x); top: var(--y); width:8px; height:8px; border-radius:2px; transform: translate(-50%,-50%); animation: confetti-fall .95s ease-out forwards; }
@keyframes confetti-fall { to { transform: translate(calc(var(--dx)), calc(var(--dy))) rotate(260deg); opacity:0; } }
`;
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showToast(msg, type='error', ms=3000){
    ensureToastStyles();
    const host = document.getElementById('toasts') || (()=>{
      const d=document.createElement('div'); d.id='toasts'; d.className='toasts';
      document.body.appendChild(d); return d;
    })();
    const el = document.createElement('div');
    el.className = 'toast' + (type==='ok' ? ' toast--ok' : ' toast--error');
    el.innerHTML = `<span>${msg}</span><button class="toast__close" aria-label="Закрыть">✕</button>`;
    host.appendChild(el);
    const close = ()=>{ el.style.animation='toast-out .22s ease forwards'; setTimeout(()=> el.remove(), 240); };
    el.querySelector('.toast__close').addEventListener('click', close);
    setTimeout(close, ms);
  }

  /* ================== события ================== */
  // клик по карточке — центрируем её
  /*
  track.addEventListener('click', (e) => {
    const b = e.target.closest('.bonus'); if (!b) return;
    const idx = items.indexOf(b);
    if (idx >= 0) snapTo(idx, 320);
  });

  // свайп / drag
  track.addEventListener('pointerdown', (e) => {
    dragging = true; wheel.classList.add('dragging');
    startX = lastX = e.clientX; lastT = e.timeStamp; startCurr = curr;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    curr = startCurr - dx / STEP;               // бесконечная карусель
    const dt = e.timeStamp - lastT;
    if (dt > 0) { vel = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = e.timeStamp; }
    updateUI();
  }, { passive: true });
  function endDrag() {
    if (!dragging) return;
    dragging = false; wheel.classList.remove('dragging');
    interacted = true;
    snapTo(mod(Math.round(curr - vel * 6), N), 480);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  */

  /* ===== Крутануть с оплатой монет + тост при нехватке ===== */
  spin?.addEventListener('click', () => {
    if (spinning) return;

    if (getCoins() < SPIN_COST) {
      hapticPulse('medium');
      showToast(`Недостаточно монет. Нужно ${SPIN_COST} 🪙`, 'error', 3000);
      return;
    }

    // списываем монеты перед стартом
    setCoins(getCoins() - SPIN_COST);
    hapticPulse('light');

    // запускаем вращение
    spinning = true;
    const idx = Math.floor(Math.random() * N);
    spinTo(idx, 1, 1600);

    // конфетти из кнопки
    const r = spin.getBoundingClientRect();
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2);

    // разблокируем по окончании анимации
    setTimeout(() => {
      spinning = false;
      syncCoinsUI();
    }, 1650);
  });

  /* ===== «Забрать бонус» — учёт кулдауна + запись в профиль + переход ===== */
claim?.addEventListener('click', () => {
  if (claim.disabled) return;

  const idx  = mod(Math.round(curr), N);
  const name = items[idx]?.dataset?.name || '';

  // фиксируем клик и обновляем кулдаун
  setLastClaim();
  refreshClaimState();

  // пишем в профиль: +очки и лог приза
  try {
    window.Profile?.incPoints?.(100);
    window.Profile?.setPrize?.(name);
  } catch (_) {}

  // Открываем шторку с последними призами
  window.openLastPrizesSheet();
});


  /* ================== конфетти (DOM) ================== */
  function confettiBurst(x, y) {
    ensureToastStyles(); // тут также лежит CSS для конфетти
    let layer = document.getElementById('confetti');
    if (!layer) { layer = document.createElement('div'); layer.id = 'confetti'; document.body.appendChild(layer); }
    const colors = ['#7b5bff', '#3de0c5', '#ffd166', '#ef476f', '#06d6a0', '#118ab2'];
    const rect = document.body.getBoundingClientRect();
    const ox = (x ?? rect.width / 2), oy = (y ?? rect.height / 3);
    for (let i = 0; i < 36; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.background = colors[i % colors.length];
      const angle = (i / 36) * Math.PI * 2;
      const speed = 140 + Math.random() * 120;
      const dx = Math.cos(angle) * speed, dy = Math.sin(angle) * speed + 220;
      el.style.setProperty('--x', ox + 'px');
      el.style.setProperty('--y', oy + 'px');
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      layer.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  }

  /* старт */
  updateUI();          // отрисовать колесо + плашку
  refreshClaimState(); // сразу проверить кулдаун на кнопке
  syncCoinsUI();       // и с монетами
})();

// === Block separator ===

(function(){
  'use strict';

  // ===== Параметры =====
  const QUESTIONS = [
    { q:'Какой стиль обычно самый хмельной и ароматный цитрусом?', opts:['IPA','Lager','Weizen','Stout'], ok:0 },
    { q:'У какого стиля выраженные кофейно-шоколадные ноты?',     opts:['Sour','Stout','Pilsner','Cider'], ok:1 },
    { q:'Пшеничный немецкий стиль с бананом/гвоздикой — это…',    opts:['Weizen','Porter','APA','Saison'], ok:0 },
    { q:'Кислотность — фишка стиля…',                             opts:['Sour','Bock','Amber','Doppelbock'], ok:0 },
  ];
  const REWARD = 100;                    // монет за прохождение
  const COOLDOWN_MS = 0.1*60*60*1000;     // 24 часа

  // ===== Telegram / хаптики =====
  const TG = window.Telegram && window.Telegram.WebApp;
  function haptic(level){ try{ TG?.HapticFeedback?.impactOccurred(level||'light'); }catch(_){ navigator.vibrate?.(10); } }

  // ===== Баланс / лента призов (используем твои, иначе фоллбек) =====
  const COIN_KEY = 'beer_coins';
  function getCoins(){ return +(localStorage.getItem(COIN_KEY)||0); }
  function setCoins(v){ localStorage.setItem(COIN_KEY, String(Math.max(0,v|0))); try{ window.syncCoinsUI?.(); }catch(_){ } }
  function addCoins(n){ if (typeof window.addCoins==='function') return window.addCoins(n); setCoins(getCoins()+(n|0)); }
  function logPrize(txt){ try{ window.logReward?.({source:'trivia', prize:txt}); }catch(_){ } }

  // ===== Кулдаун =====
  const UID = TG?.initDataUnsafe?.user?.id || 'anon';
  const QUIZ_ID = 'beer_trivia_v1';
  const LAST_KEY = `${QUIZ_ID}_last_finish_${UID}`;
  const now = ()=>Date.now();
  const getLast=()=>+(localStorage.getItem(LAST_KEY)||0);
  const setLast=(ts=now())=> localStorage.setItem(LAST_KEY, String(ts));
  const remain=()=> Math.max(0, getLast()+COOLDOWN_MS - now());
  const fmt=(ms)=>{ const s=Math.floor(ms/1000),h=String(Math.floor(s/3600)).padStart(2,'0'),m=String(Math.floor((s%3600)/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0'); return `${h}:${m}:${ss}`; };

  // ===== Состояние =====
  const S = { i:0, canNext:false, timer:null };

  // ===== Утилиты DOM =====
  const elBody  = ()=> document.getElementById('trivia-body');
  const elStart = ()=> document.getElementById('trivia-start');
  const elHint  = ()=> document.getElementById('trivia-start-hint');

  const rootCard = () => document.getElementById('trivia-body')?.closest('.trivia-card');


  // ===== Рендеры =====
  function renderStartRow(){
    const start = elStart(), hint = elHint();
    if (!start) return;

    const left = remain();
    start.classList.remove('is-hidden');

    if (left>0){
      const btn = start.querySelector('[data-action="trivia-start"]');
      if (btn){ btn.disabled = true; }
      if (hint){ hint.style.display='inline'; hint.textContent = 'Доступно через ' + fmt(left); }
      // тикающий таймер
      clearInterval(S.timer);
      S.timer = setInterval(()=>{
        const r = remain();
        if (r>0){ if (hint) hint.textContent = 'Доступно через ' + fmt(r); }
        else{
          clearInterval(S.timer); S.timer=null;
          if (btn) btn.disabled = false;
          if (hint) hint.style.display='none';
        }
      }, 1000);
    }else{
      // доступно: кнопка активна, подсказку прячем
      const btn = start.querySelector('[data-action="trivia-start"]');
      if (btn) btn.disabled = false;
      if (hint) hint.style.display='none';
      clearInterval(S.timer); S.timer=null;
    }
  }

  function renderQuestion(){
    const box = elBody(); if (!box) return;
    const q = QUESTIONS[S.i];
    const total = QUESTIONS.length;
    S.canNext = false;

    box.innerHTML =
      `<div class="trivia-q">
         <div class="trivia-title">Вопрос ${S.i+1} из ${total}: ${q.q}</div>
         <div class="trivia-opts">
           ${q.opts.map((t,idx)=>`
             <label class="trivia-opt" data-idx="${idx}">
               <input type="radio" name="ans" value="${idx}">
               <span>${t}</span>
             </label>`).join('')}
         </div>
         <div class="trivia-cta">
           <button class="btn btn-primary trivia-next is-hidden" data-action="trivia-next" disabled>Далее</button>
         </div>
       </div>`;
  }

  function renderFinish(){
    const box = elBody(); if (!box) return;
    box.innerHTML =
      `<div class="trivia-q">
         <div class="trivia-title"></div>
         <p>Поздравляем! На счёт зачислено <b>${REWARD} монет</b>.</p>
       </div>`;
  }

  // ===== Флоу =====
  function startQuiz(){
    rootCard()?.classList.add('is-running'); // спрятать заголовок

    // скрыть стартовую плашку
    elStart()?.classList.add('is-hidden');
    // стопнуть таймер, если был
    clearInterval(S.timer); S.timer=null;
    // начать
    S.i=0; S.canNext=false; renderQuestion();
  }

  function finishQuiz(){
    addCoins(REWARD);
    logPrize(`+${REWARD}🪙 за викторину`);
    setLast(); haptic('light');

    renderFinish();

    // через 1.4с показываем стартовую плашку с кулдауном
    setTimeout(renderStartRow, 1400);
    rootCard()?.classList.remove('is-running'); // вернуть заголовок

  }

  // ===== Делегаты событий =====
  document.addEventListener('click', (e)=>{
    const body = elBody();
    // старт
    if (e.target.closest?.('[data-action="trivia-start"]')){
      e.preventDefault();
      if (remain()>0) return; // защита
      startQuiz();
      return;
    }
    if (!body) return;

    // выбор варианта
    const opt = e.target.closest?.('.trivia-opt');
    if (opt && body.contains(opt)){
      const pick = +opt.dataset.idx;
      const ok   = QUESTIONS[S.i].ok;

      body.querySelectorAll('.trivia-opt').forEach(el=> el.classList.remove('wrong','correct'));

      const nextBtn = body.querySelector('.trivia-next');
      if (pick===ok){
        opt.classList.add('correct');
        body.querySelectorAll('.trivia-opt').forEach(el=> el.style.pointerEvents='none');
        if (nextBtn){ nextBtn.classList.remove('is-hidden'); nextBtn.disabled=false; }
        S.canNext=true; haptic('light');
      }else{
        opt.classList.add('wrong');
        if (nextBtn){ nextBtn.classList.add('is-hidden'); nextBtn.disabled=true; }
        S.canNext=false; haptic('medium');
      }
      return;
    }

    // далее (только после верного ответа)
    if (e.target.closest?.('[data-action="trivia-next"]')){
      e.preventDefault();
      if (!S.canNext) return;
      if (S.i < QUESTIONS.length-1){ S.i++; renderQuestion(); }
      else { finishQuiz(); }
    }
  });

  // ===== Монтаж при появлении в шторке =====
  function mountIfReady(){
    const body = elBody(), start = elStart();
    if (body && start){
      // при каждом открытии шторки показываем стартовую плашку/таймер
      renderStartRow();
      body.innerHTML = ''; // на старте — только плашка
      return true;
    }
    return false;
  }

  // 1) сразу, если уже вставлено
  if (!mountIfReady()){
    // 2) следим за DOM (шторка подставит темплейт позже)
    const mo = new MutationObserver(()=>{ if (mountIfReady()) mo.disconnect(); });
    mo.observe(document.body, {childList:true, subtree:true});
  }

  // экспорт, если хочешь дёргать при openSheet()
  window.mountTrivia = function(){ renderStartRow(); elBody().innerHTML=''; };

})();

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