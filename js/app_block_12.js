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