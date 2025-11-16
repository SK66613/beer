(function () {
  const wheel = document.getElementById('bonusWheel');
  const track = document.getElementById('wheelTrack');
  if (!wheel || !track) return;

  const items = Array.from(track.children);
  const N = items.length;

  const pill  = document.getElementById('pickedPill');
  const claim = document.getElementById('claimBtn');
  const spin  = document.getElementById('spinBtn');

  /* Название -> ссылка (можно донастроить) */
  const bonusLinks = {
    "Кружка": "#tpl-lastpriz",
    "Футболка": "#tpl-lastpriz",
    "Фисташки": "#tpl-lastpriz",
    "Скидка": "#tpl-lastpriz",
    "Дегустация": "#tpl-lastpriz",
    "Монеты": "#tpl-lastpriz"
  };

  /* ================== общие утилиты ================== */
  let STEP = 114;
  requestAnimationFrame(() => {
    const a = items[0]?.getBoundingClientRect();
    const b = items[1]?.getBoundingClientRect();
    if (a && b) {
      const dx = Math.round(b.left - a.left);
      if (dx > 40 && dx < 300) STEP = dx;
    }
  });

  let curr = 0;
  let startX = 0, startCurr = 0, dragging = false, lastX = 0, lastT = 0, vel = 0;
  let interacted = false;
  let spinning = false;

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
        TG.HapticFeedback.impactOccurred(level);
        return;
      }
    } catch (_) {}
    try {
      if (navigator.vibrate) {
        navigator.vibrate(level === 'heavy' ? 30 : level === 'medium' ? 20 : 12);
      }
    } catch (_) {}
  }

  /* ====== Состояние из server state (MiniState) ====== */
  function getMiniState() {
    return (window.MiniState || {});
  }
  function getWheelState() {
    const st = getMiniState();
    return st.wheel || {};
  }

  /* ====== Кулдаун "Забрать бонус" на основе MiniState.wheel ====== */
  let claimTimerId = null;
  let claimLeftMsLocal = 0;

  function refreshClaimState() {
    if (!claim) return;

    const wheelState = getWheelState();
    const rem = Number(wheelState.claim_cooldown_left_ms || 0);
    const hasPrize = !!wheelState.has_unclaimed;

    if (claimTimerId) {
      clearInterval(claimTimerId);
      claimTimerId = null;
    }

    if (!hasPrize) {
      claim.disabled = true;
      claim.textContent = 'Нет приза к выдаче';
      return;
    }

    claimLeftMsLocal = rem;

    if (claimLeftMsLocal <= 0) {
      claim.disabled = false;
      claim.textContent = 'Забрать бонус';
      return;
    }

    claim.disabled = true;
    const tick = () => {
      if (claimLeftMsLocal <= 0) {
        clearInterval(claimTimerId);
        claimTimerId = null;
        claim.disabled = false;
        claim.textContent = 'Забрать бонус';
        return;
      }
      const totalSec = Math.floor(claimLeftMsLocal / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      claim.textContent =
        'Доступно через ' +
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
      claimLeftMsLocal -= 1000;
    };
    tick();
    claimTimerId = setInterval(tick, 1000);
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
      claim.dataset.bonus = name;
    }
  }

  function updateUI() {
    items.forEach((el, i) => {
      let dx = i - curr;
      dx = mod(dx + N / 2, N) - N / 2;
      const x = dx * STEP;
      const s = 1 - Math.min(Math.abs(dx) * 0.16, 0.48);
      el.style.transform = `translate(-50%,-50%) translateX(${x}px) scale(${s})`;
      el.style.zIndex = String(1000 - Math.abs(dx) * 10);
      el.classList.toggle('active', Math.round(Math.abs(dx)) === 0);
    });

    if (interacted) {
      updatePillByIndex(mod(Math.round(curr), N));
    } else {
      if (pill) {
        pill.classList.add('muted');
        pill.textContent = 'Нажми «Крутануть»';
      }
      if (claim) {
        delete claim.dataset.bonus;
      }
    }

    refreshClaimState();
    syncCoinsUI();
  }

  /* ====== Вращение ====== */
  function spinTo(targetIdx, laps = 1, dur = 1600) {
    const base = nearest(curr, targetIdx, N);
    const dir = (base >= curr ? 1 : -1) || 1;
    const to = base + dir * (laps * N);

    const from = curr;
    const t0 = performance.now();
    let lastPulse = 0;

    function tick(t) {
      const k = Math.min((t - t0) / dur, 1);
      curr = from + (to - from) * (1 - Math.pow(1 - k, 3));
      updateUI();

      const period = 80 + 180 * k;
      if (t - lastPulse >= period) {
        hapticPulse('light');
        lastPulse = t;
      }

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
      else {
        curr = to;
        interacted = true;
        updateUI();
      }
    }
    requestAnimationFrame(tick);
  }

  /* ================== Монеты из server state ================== */
  function getCoins() {
    const st = getMiniState();
    return Number(st.coins || 0);
  }

  function getSpinCost() {
    const st = getMiniState();
    const cfg = st.config || {};
    if (typeof cfg.WHEEL_SPIN_COST === 'number') return cfg.WHEEL_SPIN_COST;
    if (typeof cfg.SPIN_COST === 'number') return cfg.SPIN_COST;
    return 0;
  }

  function syncCoinsUI() {
    const coins = getCoins();
    ['coins-inline', 'coins-inline-2', 'coins-profile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = coins;
    });
    if (spin) {
      const lock = (coins < getSpinCost()) || spinning;
      spin.classList.toggle('is-locked', lock);
    }
  }

  /* ================== Toasts ================== */
  function ensureToastStyles() {
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

#spinBtn.is-locked{ opacity:.6; }
#spinBtn.is-locked:active{ transform:none; }

#confetti { position: fixed; left:0; top:0; width:100%; height:100%; pointer-events:none; overflow:visible; z-index:10000; }
.confetti-piece{ position: fixed; left: var(--x); top: var(--y); width:8px; height:8px; border-radius:2px; transform: translate(-50%,-50%); animation: confetti-fall .95s ease-out forwards; }
@keyframes confetti-fall { to { transform: translate(calc(var(--dx)), calc(var(--dy))) rotate(260deg); opacity:0; } }
`;
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showToast(msg, type = 'error', ms = 3000) {
    ensureToastStyles();
    const host = document.getElementById('toasts') || (() => {
      const d = document.createElement('div');
      d.id = 'toasts';
      d.className = 'toasts';
      document.body.appendChild(d);
      return d;
    })();
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'ok' ? ' toast--ok' : ' toast--error');
    el.innerHTML = `<span>${msg}</span><button class="toast__close" aria-label="Закрыть">✕</button>`;
    host.appendChild(el);
    const close = () => {
      el.style.animation = 'toast-out .22s ease forwards';
      setTimeout(() => el.remove(), 240);
    };
    el.querySelector('.toast__close').addEventListener('click', close);
    setTimeout(close, ms);
  }

  /* ================== события ================== */

  // Если нужно, можно вернуть клик по карточке и drag — пока отключено, чтобы не путать
  /*
  track.addEventListener('click', (e) => {
    const b = e.target.closest('.bonus'); if (!b) return;
    const idx = items.indexOf(b);
    if (idx >= 0) snapTo(idx, 320);
  });
  */

  /* ===== Крутануть: запрос к GAS (wheel.spin) ===== */
  spin?.addEventListener('click', async () => {
    if (spinning) return;

    const coins = getCoins();
    const cost  = getSpinCost();

    if (coins < cost) {
      hapticPulse('medium');
      showToast(`Недостаточно монет. Нужно ${cost} 🪙`, 'error', 3000);
      return;
    }

    spinning = true;
    spin.classList.add('is-locked');

    try {
      const tg_init = (window.getTgInit && window.getTgInit()) ||
                      (TG && TG.initData) || '';

      const r = window.jpost
        ? await window.jpost('/api/mini/event', {
            tg_init,
            type: 'wheel.spin',
            data: {}
          })
        : null;

      if (!r || !r.ok) {
        if (r && r.error === 'no_coins') {
          showToast('Не хватает монет для крутки', 'error', 3000);
        } else if (r && r.error === 'no_prize_config') {
          showToast('Призы пока не настроены', 'error', 3000);
        } else {
          showToast('Ошибка при крутке, попробуй ещё раз', 'error', 3000);
        }
        return;
      }

      if (r.fresh_state && window.applyServerState) {
        window.applyServerState(r.fresh_state);
      }

      const prize = r.prize || {};
      const code  = prize.code || '';
      let idx = items.findIndex(el =>
        (el.dataset.code || el.dataset.name || '').toString() === code.toString()
      );
      if (idx < 0) {
        idx = Math.floor(Math.random() * N);
      }

      hapticPulse('light');
      const rect = spin.getBoundingClientRect();
      confettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
      spinTo(idx, 1, 1600);
    } catch (e) {
      showToast('Ошибка сети, попробуй ещё раз', 'error', 3000);
    } finally {
      spinning = false;
      spin.classList.remove('is-locked');
      syncCoinsUI();
      refreshClaimState();
    }
  });

  /* ===== «Забрать бонус»: запрос к GAS (wheel.claim) ===== */
  claim?.addEventListener('click', async () => {
    if (claim.disabled) return;

    try {
      const tg_init = (window.getTgInit && window.getTgInit()) ||
                      (TG && TG.initData) || '';

      const r = window.jpost
        ? await window.jpost('/api/mini/event', {
            tg_init,
            type: 'wheel.claim',
            data: {}
          })
        : null;

      if (!r || !r.ok) {
        if (r && r.error === 'claim_cooldown') {
          showToast('Забрать бонус можно позже', 'error', 3000);
        } else if (r && r.error === 'no_unclaimed_prize') {
          showToast('Нет приза к выдаче', 'error', 3000);
        } else {
          showToast('Ошибка, попробуй ещё раз', 'error', 3000);
        }
        refreshClaimState();
        return;
      }

      if (r.fresh_state && window.applyServerState) {
        window.applyServerState(r.fresh_state);
      }

      // Имя приза — из стейта колеса, если есть
      let name = '';
      const st = getWheelState();
      if (st.last_prize_title) {
        name = st.last_prize_title;
      } else {
        const idx = mod(Math.round(curr), N);
        name = items[idx]?.dataset?.name || '';
      }

      try {
        window.Profile?.incPoints?.(100);
        window.Profile?.setPrize?.(name);
      } catch (_) {}

      showToast('Приз подтверждён, подойди к бармену', 'ok', 2500);
      try {
        window.openLastPrizesSheet && window.openLastPrizesSheet();
      } catch (_) {}

      refreshClaimState();
    } catch (e) {
      showToast('Ошибка сети, попробуй ещё раз', 'error', 3000);
    }
  });

  /* ================== конфетти (DOM) ================== */
  function confettiBurst(x, y) {
    ensureToastStyles();
    let layer = document.getElementById('confetti');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'confetti';
      document.body.appendChild(layer);
    }
    const colors = ['#7b5bff', '#3de0c5', '#ffd166', '#ef476f', '#06d6a0', '#118ab2'];
    const rect = document.body.getBoundingClientRect();
    const ox = (x ?? rect.width / 2);
    const oy = (y ?? rect.height / 3);
    for (let i = 0; i < 36; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.background = colors[i % colors.length];
      const angle = (i / 36) * Math.PI * 2;
      const speed = 140 + Math.random() * 120;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed + 220;
      el.style.setProperty('--x', ox + 'px');
      el.style.setProperty('--y', oy + 'px');
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      layer.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  }

  /* старт */
  updateUI();
})();
