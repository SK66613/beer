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

      const pin = window.prompt('PIN сотрудника (одноразовый)');
      if (pin == null){ // cancel
        toast('Отменено', false);
        return;
      }
      if (String(pin).trim() === ''){
        toast('Введите PIN', false);
        return;
      }

      // Отправляем одноразовый PIN на бэкенд, проверка только на сервере
      if (API){
        const r = await API('style.collect', {
          style_id: String(code),
          pin: String(pin).trim()
        });
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
          if (r && r.error === 'pin_invalid'){
            toast('ПИН неверный или уже использован', false);
          }else if (r && r.error === 'pin_used'){
            toast('Этот ПИН уже был использован', false);
          }else if (r && r.error === 'pin_required'){
            toast('Нужно ввести ПИН у сотрудника', false);
          }else if (r && r.error){
            toast(r.error, false);
          }else{
            toast('Ошибка сети', false);
          }
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
