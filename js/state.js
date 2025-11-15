// === 1:1 extracted from REF_index_refs_clean.html ===
function applyServerState(state){
    if (!state || state.ok===false) return;
    window.__state = state;
    // config: spin cost
    if (state.config && typeof state.config.SPIN_COST === "number"){
      setText(["#spin-cost",".js-spin-cost","[data-bind='spin-cost']"], state.config.SPIN_COST);
    }
    

window.applyServerState = function(state){
    
    try{ window.MiniState = state; }

window.SWR = { get: load, save, ver, KEY };

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
</script>
<script>
// --- SWR: persistent cache + bootstrap (stale-while-revalidate) ---
(function(){
  const KEY = 'beer_state_v2';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}');
