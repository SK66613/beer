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