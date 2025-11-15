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

