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

