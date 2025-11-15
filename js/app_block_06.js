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