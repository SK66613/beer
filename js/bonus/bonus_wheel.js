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

