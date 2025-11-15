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