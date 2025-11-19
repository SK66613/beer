(function(){
  'use strict';

  // ===== Параметры квиза профиля =====
  const STEPS = [
    {
      type: 'q',
      id: 'scene',
      coins: 10,
      text: 'Представь кадр из фильма: ты заходишь в бар. Какая сцена про тебя?',
      options: [
        { value: 'solo',       label: 'Один заходит, садится у стойки и просто выдыхает' },
        { value: 'small_team', label: 'Пара друзей вваливается с фразой «ну что, как неделя?»' },
        { value: 'party',      label: 'Шумная компания, смех, шутки бармену с порога' },
        { value: 'cowork',     label: 'Человек с ноутом ищет уголок: «это мой офис на вечер»' }
      ]
    },
    {
      type: 'q',
      id: 'evening_scene',
      coins: 10,
      text: 'Если бы твой идеальный вечер с пивом был картинкой — что там происходит?',
      options: [
        { value: 'sofa',    label: 'Диван, сериал и что-то лёгкое в бокале' },
        { value: 'music',   label: 'Музыка, редкие этикетки, хочется пробовать новое' },
        { value: 'sports',  label: 'Матч на экране, стол, друзья, шум и эмоции' },
        { value: 'tasting', label: 'Маленькие дегустационные бокалы, нюхаю и разбираю вкусы' }
      ]
    },
    {
      type: 'q',
      id: 'beer_character',
      coins: 20,
      text: 'Представь, что пиво — это персонаж. Кто ближе всего по духу?',
      options: [
        { value: 'light',   label: 'Лёгкий, разговорчивый, с тобой весь вечер, но не давит' },
        { value: 'bitter',  label: 'Резкий, дерзкий, с характером — его либо любят, либо «слишком»' },
        { value: 'dessert', label: 'Тёплый, плотный, немного сладкий, десертный друг' },
        { value: 'sour',    label: 'Странный, кисленький, яркий — с ним точно не скучно' }
      ]
    },
    {
      type: 'q',
      id: 'experiments',
      coins: 20,
      text: 'Бар предлагает совершенно новый странный стиль. Как ты реагируешь?',
      options: [
        { value: 'max',   label: '«Давай два! Я за этим и пришёл»' },
        { value: 'mid',   label: '«Окей, разок можно, но хочу знать, что взять “на всякий”»' },
        { value: 'low',   label: '«Я за надёжность. Лучше то, что уже знаю»' }
      ]
    },
    {
      type: 'q',
      id: 'focus',
      coins: 20,
      text: 'В идеальном бокале что для тебя критично важно?',
      options: [
        { value: 'aroma',    label: 'Чтобы аромат первым встречал — цитрус, хмель, тропики' },
        { value: 'taste',    label: 'Чтобы вкус был выверен: баланс, горечь, сладость/кислота' },
        { value: 'body',     label: 'Чтобы было ощущение плотности и длинного послевкусия' },
        { value: 'strength', label: 'Чтобы чувствовалась крепость — вечер удался' }
      ]
    },
    {
      type: 'q',
      id: 'anti_flavors',
      coins: 30,
      text: 'А с чем у тебя точно не дружба в бокале?',
      options: [
        { value: 'banana',    label: 'Когда вдруг банан/гвоздика — не моё' },
        { value: 'coffee',    label: 'Когда пиво как десерт: кофе, шоколад, молочные стауты' },
        { value: 'acid',      label: 'Когда прям ярко-кислое, как лимонад или кислые конфеты' },
        { value: 'pine',      label: 'Когда хмель как жёсткая хвоя и горечь до слёз' },
        { value: 'ok_all',    label: 'Да я со всеми дружу, люблю пробовать разное' }
      ]
    },
    {
      type: 'q',
      id: 'snacks',
      coins: 10,
      text: 'На столе у тебя чаще всего что рядом с бокалом?',
      options: [
        { value: 'snacks',   label: 'Снэки: орехи, чипсы, сухарики' },
        { value: 'fastfood', label: 'Пицца, бургеры и подобные радости' },
        { value: 'meat',     label: 'Мясо/гриль: крылья, рёбра и компания' },
        { value: 'no_food',  label: 'Обычно без еды, главное — сам бокал' }
      ]
    },
    {
      type: 'q',
      id: 'budget',
      coins: 20,
      text: 'Какой сценарий про тебя чаще всего?',
      options: [
        { value: 'quick',   label: 'Забежал на один–два бокала, выдохнул и домой' },
        { value: 'normal',  label: 'Нормально посидеть: пару позиций и закуска — вечер удался' },
        { value: 'event',   label: 'Это событие: дегустация, новый релиз, закладываю отдельный бюджет' }
      ]
    },
    {
      type: 'q',
      id: 'time_of_day',
      coins: 10,
      text: 'В какой момент дня чаще всего ловишь мысль: «неплохо бы пивка»?',
      options: [
        { value: 'after_work', label: 'После работы/дел, ближе к вечеру' },
        { value: 'late',       label: 'Поздно вечером/ночью' },
        { value: 'weekend',    label: 'Днём в выходные' },
        { value: 'random',     label: 'Спонтанно — когда совпало настроение или зовут' }
      ]
    },
    {
      type: 'q',
      id: 'comms',
      coins: 10,
      text: 'Представь, бар — это человек в твоём Telegram. Что от него хотелось бы получать?',
      options: [
        { value: 'pings',   label: 'Короткие пинги: «сегодня день такого-то стиля/акции»' },
        { value: 'picks',   label: 'Подборки: «3 варианта под твой вкус на вечер»' },
        { value: 'games',   label: 'Игры, квизы и розыгрыши за монеты и призы' },
        { value: 'stories', label: 'Истории и мини-гайды про стили, чтобы разбираться' }
      ]
    },
    {
      type: 'q',
      id: 'birthday_optin',
      coins: 40,
      text: 'У нас есть фишка — поздравлять своих людей не просто «с праздником», а под их вкус. Как тебе идея персональных подарков от бара к дню рождения?',
      options: [
        { value: 'love',    label: 'Обожаю такие штуки, я за' },
        { value: 'ok',      label: 'Норм, если без спама и навязчивости' },
        { value: 'neutral', label: 'Скорее нейтрально' },
        { value: 'no',      label: 'Не люблю, когда напоминают про ДР' }
      ]
    },
    {
      type: 'birthday',
      id: 'birthday_date',
      coins: 0,
      text: 'Укажи день и месяц рождения, чтобы мы под тебя готовили персональные подарки и акции. За это ещё подкинем монет 😉'
    }
  ];

  const TOTAL_QUESTIONS = STEPS.filter(s => s.type === 'q').length;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  // ===== Telegram / haptic =====
  const TG = window.Telegram && window.Telegram.WebApp;
  function haptic(level){
    try{ TG?.HapticFeedback?.impactOccurred(level || 'light'); }
    catch(_){ navigator.vibrate?.(10); }
  }

  // ===== Баланс / призы (локальный фолбэк, основной — через воркер/GAS) =====
  const COIN_KEY = 'beer_coins';
  function getCoins(){ return +(localStorage.getItem(COIN_KEY) || 0); }
  function setCoins(v){
    localStorage.setItem(COIN_KEY, String(Math.max(0, v|0)));
    try{ window.syncCoinsUI?.(); }catch(_){}
  }
  function addCoins(n){
    if (typeof window.addCoins === 'function') return window.addCoins(n);
    setCoins(getCoins() + (n|0));
  }
  function logPrize(txt){
    try{ window.logReward?.({source:'profile_quiz', prize:txt}); }catch(_){}
  }

  // ===== Ключи прохождения =====
  const UID = TG?.initDataUnsafe?.user?.id || 'anon';
  const QUIZ_ID = 'beer_profile_quiz_v1';
  const LAST_KEY = `${QUIZ_ID}_last_finish_${UID}`;
  const BDAY_KEY = `${QUIZ_ID}_bday_${UID}`;
  const getLast = () => +(localStorage.getItem(LAST_KEY) || 0);
  const setLast = (ts = Date.now()) => localStorage.setItem(LAST_KEY, String(ts));

  // ===== Состояние =====
  const S = {
    i: 0,
    canNext: false,
    score: 0,
    earned: [],
    profile: {},
    birthdayDay: 1,
    birthdayMonth: 1,
    birthdayTouched: false,
    completed: false,
    pending: false            // <-- ждём свежий статус из таблицы
  };

  // ===== «Память шторки»: как у Паспорта (устойчиво) =====
  const hasCompleted = () => !!S.completed || !!getLast();

  // ===== DOM =====
  const elBody  = () => document.getElementById('trivia-body');
  const elStart = () => document.getElementById('trivia-start');
  const elHint  = () => document.getElementById('trivia-start-hint');
  const rootCard = () => document.getElementById('trivia-body')?.closest('.trivia-card');

  // ===== Стили (твои + два фикса скрытия) =====
  let stylesInjected = false;
  function ensureStyles(){
    if (stylesInjected) return;
    stylesInjected = true;
    const css = `
      .trivia-q p{ margin:8px 0; }
      .trivia-sub{ font-size:12px; opacity:0.7; margin-bottom:6px; }
      .trivia-progress{ width:100%; height:6px; border-radius:999px; overflow:hidden; background:rgba(255,255,255,0.06); margin-bottom:10px; }
      .trivia-progress-bar{ height:100%; width:0%; background:linear-gradient(90deg,#ffb347,#ff7b00); transition:width .25s ease; }
      .trivia-opts{ margin-top:8px; }
      .trivia-opt{ display:flex; align-items:flex-start; gap:8px; padding:8px 10px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); margin-bottom:8px; cursor:pointer; transition:background .15s ease,border-color .15s ease,transform .12s ease; }
      .trivia-opt:hover{ background:rgba(255,255,255,0.05); }
      .trivia-opt.is-selected{ background:rgba(255,152,0,0.18); border-color:#ffb347; transform:translateY(-1px); }
      .trivia-opt input{ display:none; }
      .trivia-cta{ margin-top:12px; }
      .trivia-next{ width:100%; opacity:0.5; pointer-events:none; background:transparent !important; border:1px solid rgba(255,255,255,0.35); color:#fff; }
      .trivia-next.is-active{ opacity:1; pointer-events:auto; background:#ff9800 !important; border-color:#ff9800; color:#000 !important; }
      .bday-wheels{ display:flex; gap:16px; justify-content:center; margin:16px 0 8px; }
      .bday-wheel{ position:relative; display:flex; flex-direction:column; align-items:center; min-width:110px; }
      .bday-wheel-scroll{ width:100%; max-height:120px; overflow-y:auto; padding:20px 0; scrollbar-width:none; -ms-overflow-style:none; }
      .bday-wheel-scroll::-webkit-scrollbar{ display:none; }
      .bday-wheel-item{ height:28px; display:flex; align-items:center; justify-content:center; font-size:14px; opacity:0.55; transition:opacity .12s ease, transform .12s ease; }
      .bday-wheel-item.is-active{ font-size:18px; font-weight:600; opacity:1; transform:scale(1.0); }
      .bday-wheel-highlight{ position:absolute; left:6px; right:6px; top:50%; height:32px; transform:translateY(-50%); border-radius:999px; border:1px solid rgba(255,255,255,0.3); pointer-events:none; }
      .trivia-card .trivia-start{ display:flex; flex-direction:column; align-items:stretch; gap:10px; }
      .trivia-start-inner{ display:flex; gap:12px; align-items:flex-start; }
      .trivia-start-icon{ flex:0 0 auto; width:40px; height:40px; border-radius:999px; overflow:hidden; }
      .trivia-start-icon img{ display:block; width:100%; height:100%; object-fit:contain; }
      .trivia-start-copy{ flex:1 1 auto; }
      .trivia-start__hint{ margin-top:4px; font-size:12px; opacity:0.75; }
      .trivia-start-btn{ margin-top:4px; width:100%; display:block; }
      .trivia-start-btn.is-done{ opacity:0.7; pointer-events:none; background:transparent !important; border:1px solid rgba(255,255,255,0.35); color:#aaaaaa !important; }

      /* ✅ фиксы поведения шторки */
      .trivia-start.is-hidden { display: none !important; }
      .trivia-card.is-running > .h1 { display: none !important; }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ===== Транспорт через window.api =====
  async function sendProfileQuizFinishToServer() {
    const data = {
      quiz_id: QUIZ_ID,
      score: S.score,
      bday_day: S.birthdayDay,
      bday_month: S.birthdayMonth,
      profile: S.profile,
      answers_json: JSON.stringify(S.profile || {})
    };

    if (typeof window.api !== 'function') {
      console.warn('[quiz.finish] нет window.api, локальный режим');
      setLast(); addCoins(S.score);
      return;
    }

    try {
      const res = await window.api('profile_quiz.finish', data);
      console.log('[quiz.finish] response', res);

      if (res && res.ok) {
        const remoteCompleted = res.status === 'completed' || res.completed === true || res.done === true;
        if (remoteCompleted) S.completed = true;
        setLast();

        if (res.fresh_state && window.applyServerState) {
          window.applyServerState(res.fresh_state);
        } else if (window.syncCoinsUI) {
          window.syncCoinsUI();
        }
      }
    } catch (e) {
      console.error('[quiz.finish] error', e);
    }
  }

  // ===== Свежая проверка состояния из таблицы (с анти-кэшем) =====
  async function fetchProfileQuizStateFromServer(fresh){
    if (typeof window.api !== 'function') {
      console.warn('[quiz.state] нет window.api');
      S.pending = false;
      renderStartRow();
      return;
    }

    try {
      const res = await window.api('profile_quiz.state', {
        quiz_id: QUIZ_ID,
        fresh: fresh ? 1 : 0,
        no_cache: 1,
        ts: Date.now()
      });
      console.log('[quiz.state] response', res);

      if (res && res.ok) {
        const remoteCompleted =
          res.status === 'completed' || res.completed === true || res.done === true ||
          res.bday_day != null || res.bday_month != null;

        if (remoteCompleted) { S.completed = true; setLast(); }

        S.birthdayDay   = Number(res.bday_day || S.birthdayDay || 1) || 1;
        S.birthdayMonth = Number(res.bday_month || S.birthdayMonth || 1) || 1;
      }
    } catch (e) {
      console.error('[quiz.state] error', e);
    }

    S.pending = false;
    renderStartRow();
  }

  // ===== Стартовая плашка =====
  function renderStartRow(){
    const start = elStart(), hint = elHint();
    if (!start) return;

    start.classList.remove('is-hidden');
    const btn = start.querySelector('[data-action="trivia-start"]');
    if (!btn) return;

    if (S.pending){
      btn.disabled = true;
      btn.classList.remove('is-done','is-active');
      btn.textContent = 'Проверяем статус…';
      if (hint){ hint.style.display='block'; hint.textContent='Обновляем данные из таблицы…'; }
      return;
    }

    if (hasCompleted()){
      btn.disabled = true;
      btn.classList.remove('is-active');
      btn.classList.add('is-done');
      btn.textContent = 'Квиз пройден';
      if (hint){ hint.style.display='block'; hint.textContent='Квиз можно пройти один раз 🙌'; }
    } else {
      btn.disabled = false;
      btn.classList.remove('is-done');
      btn.classList.add('is-active');
      btn.textContent = 'Начать';
      if (hint){ hint.style.display='none'; hint.textContent=''; }
    }
  }

  // ===== Прогресс (номер среди вопросов type="q") =====
  function getQuestionIndex(stepIndex){
    let idx = 0;
    for (let i = 0; i <= stepIndex; i++) if (STEPS[i].type === 'q') idx++;
    return idx;
  }

  // ===== Рендер шага =====
  function renderStep(){
    const step = STEPS[S.i];
    const box = elBody();
    if (!box || !step) return;
    ensureStyles();

    if (step.type === 'q')       renderQuestionStep(step);
    else if (step.type==='birthday') renderBirthdayStep(step);
  }

  function renderQuestionStep(step){
    const box = elBody(); if (!box) return;
    const qIndex = getQuestionIndex(S.i);
    const totalQ = TOTAL_QUESTIONS;
    const answered = Math.max(0, qIndex - 1);
    const progress = Math.round((answered / totalQ) * 100);

    S.canNext = false;

    box.innerHTML =
      `<div class="trivia-q">
         <div class="trivia-progress"><div class="trivia-progress-bar" style="width:${progress}%"></div></div>
         <div class="trivia-sub">Вопрос на ${step.coins} монет</div>
         <p class="trivia-text">${step.text}</p>
         <div class="trivia-opts">
           ${step.options.map(opt => `
             <label class="trivia-opt" data-val="${opt.value}">
               <input type="radio" name="ans" value="${opt.value}">
               <span>${opt.label}</span>
             </label>`).join('')}
         </div>
         <div class="trivia-cta">
           <button class="btn btn-primary trivia-next" data-action="trivia-next" disabled>Далее</button>
         </div>
       </div>`;
  }

  // ===== Кнопка финала (активация после скролла барабанов) =====
  function enableBirthdayButton(){
    const body = elBody(); if (!body) return;
    const btn = body.querySelector('[data-action="trivia-save-bday"]');
    if (!btn) return;
    btn.disabled = false;
    btn.classList.add('is-active');
  }

  // ===== Вспомогательная генерация: много «колец» для бесконечного скролла =====
  function buildLoopedItems(count, render){
    const LOOPS = 7;
    let html = '';
    for (let k=0;k<LOOPS;k++){
      for (let v=1; v<=count; v++){
        html += render(v);
      }
    }
    return { html, LOOPS };
  }

  // ===== Инициализация барабанов (бесконечный скролл + центровка) =====
  function initBirthdayWheelsLooped(){
    const body = elBody(); if (!body) return;

    const wheels = body.querySelectorAll('.bday-wheel-scroll');
    wheels.forEach(scrollEl=>{
      const kind  = scrollEl.dataset.kind;
      const total = (kind==='day') ? 31 : 12;
      const items = Array.from(scrollEl.querySelectorAll('.bday-wheel-item'));
      if (!items.length) return;

      const firstIdx = 0;
      const lastIdxFirstRing = total - 1;
      const ringHeight = items[lastIdxFirstRing].offsetTop + items[lastIdxFirstRing].offsetHeight - items[firstIdx].offsetTop;
      const LOOPS = Math.round(items.length / total);

      let cur = (kind==='day' ? (S.birthdayDay||1) : (S.birthdayMonth||1));
      if (kind==='day')  { if (cur<1 || cur>31) cur = 1; }
      else               { if (cur<1 || cur>12) cur = 1; }

      const midStartIndex = Math.floor(LOOPS/2) * total;
      const targetIndex   = midStartIndex + (cur - 1);
      const targetItem    = items[targetIndex];
      const centerTop     = targetItem.offsetTop - (scrollEl.clientHeight/2 - targetItem.offsetHeight/2);
      scrollEl.scrollTop  = centerTop;

      let stopTimer = null;
      let lastVal = cur;

      function valueByCenter(){
        const rect = scrollEl.getBoundingClientRect();
        const cy   = rect.top + rect.height/2;
        let best = null, bestDist = Infinity, bestVal = null;
        for (const it of items){
          const r  = it.getBoundingClientRect();
          const ic = (r.top + r.bottom)/2;
          const d  = Math.abs(ic - cy);
          if (d < bestDist){ bestDist = d; best = it; bestVal = Number(it.dataset.value)||null; }
        }
        return { node: best, val: bestVal };
      }

      function applyActive(node){
        items.forEach(x=>x.classList.toggle('is-active', x===node));
      }

      function setModel(val, silent){
        if (kind==='day'){
          if (val!==S.birthdayDay){ S.birthdayDay = val; if(!silent){ S.birthdayTouched = true; enableBirthdayButton(); } }
          else if(!silent){ S.birthdayTouched = true; enableBirthdayButton(); }
        }else{
          if (val!==S.birthdayMonth){ S.birthdayMonth = val; if(!silent){ S.birthdayTouched = true; enableBirthdayButton(); } }
          else if(!silent){ S.birthdayTouched = true; enableBirthdayButton(); }
        }
      }

      function wrapIfNeeded(){
        const top   = scrollEl.scrollTop;
        const maxTop= scrollEl.scrollHeight - scrollEl.clientHeight;
        if (top < ringHeight){
          scrollEl.scrollTop = top + ringHeight*(LOOPS-2);
        } else if (top > maxTop - ringHeight){
          scrollEl.scrollTop = top - ringHeight*(LOOPS-2);
        }
      }

      function onScroll(isEnd){
        wrapIfNeeded();
        const {node, val} = valueByCenter();
        if (!node || !val) return;

        if (!isEnd){
          if (val!==lastVal){
            lastVal = val;
            applyActive(node);
            setModel(val, false);
            haptic('light');
          }
        }else{
          const top = node.offsetTop - (scrollEl.clientHeight/2 - node.offsetHeight/2);
          scrollEl.scrollTo({ top, behavior:'smooth' });
          applyActive(node);
          setModel(val, true);
          haptic('medium');
        }
      }

      const first = valueByCenter();
      if (first.node){ applyActive(first.node); }

      scrollEl.addEventListener('scroll', ()=>{
        onScroll(false);
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = setTimeout(()=>onScroll(true), 130);
      });

      scrollEl.addEventListener('click', (e)=>{
        const row = e.target.closest('.bday-wheel-item');
        if (!row) return;
        const top = row.offsetTop - (scrollEl.clientHeight/2 - row.offsetHeight/2);
        scrollEl.scrollTo({ top, behavior:'smooth' });
      });
    });
  }

  // ===== Рендер шага ДР (с бесконечными барабанами) =====
  function renderBirthdayStep(step){
    const box = elBody(); if (!box) return;
    ensureStyles();

    try{
      if (!S.birthdayTouched){
        const saved = localStorage.getItem(BDAY_KEY);
        if (saved){
          const [dS,mS] = saved.split('-');
          const d = parseInt(dS,10), m = parseInt(mS,10);
          if (d>=1 && d<=31) S.birthdayDay = d;
          if (m>=1 && m<=12) S.birthdayMonth = m;
        }
      }
    }catch(_){}

    const score = S.score || 0;

    const days   = buildLoopedItems(31, v => `<div class="bday-wheel-item" data-value="${v}">${v}</div>`);
    const months = buildLoopedItems(12, v => `<div class="bday-wheel-item" data-value="${v}">${MONTHS[v-1]}</div>`);

    box.innerHTML =
      `<div class="trivia-q trivia-bday">
         <div class="trivia-title">Финальный шаг</div>
         <p class="trivia-text">Ты набрал <b>${score} монет</b> в этой викторине вкуса.</p>
         <p class="trivia-text">${step.text}</p>
         <div class="bday-wheels">
           <div class="bday-wheel">
             <div class="bday-wheel-scroll" data-kind="day">
               ${days.html}
             </div>
             <div class="bday-wheel-highlight"></div>
           </div>
           <div class="bday-wheel">
             <div class="bday-wheel-scroll" data-kind="month">
               ${months.html}
             </div>
             <div class="bday-wheel-highlight"></div>
           </div>
         </div>
         <p class="trivia-sub">Дата нужна только для того, чтобы вовремя прилетал подарок от бара — без спама.</p>
         <div class="trivia-cta">
           <button class="btn btn-primary trivia-next" data-action="trivia-save-bday" disabled>Указать дату и забрать монеты</button>
         </div>
       </div>`;

    initBirthdayWheelsLooped();
  }

  // ===== Завершение =====
  function renderFinish(){
    const box = elBody(); if (!box) return;
    const score = S.score || 0;
    box.innerHTML =
      `<div class="trivia-q">
         <p>Готово! Мы сохранили твой «паспорт вкуса» и дату. На счёт зачислено <b>${score} монет</b>.</p>
       </div>`;
  }

  function startQuiz(){
    rootCard()?.classList.add('is-running');
    elStart()?.classList.add('is-hidden');
    S.i=0; S.canNext=false; S.score=0;
    S.earned = new Array(STEPS.length).fill(false);
    S.profile={}; S.birthdayTouched=false;
    renderStep();
  }

  function finishQuiz(){
    logPrize(`+${S.score}🪙 за викторину вкуса`);
    S.completed = true;
    setLast();
    haptic('light');
    renderFinish();
    rootCard()?.classList.remove('is-running');
    sendProfileQuizFinishToServer();
    setTimeout(renderStartRow, 1400);
  }

  // ===== Слушатель кликов =====
document.addEventListener('click', async (e) => {
  // старт
  if (e.target.closest?.('[data-action="trivia-start"]')){
    e.preventDefault();

    // 1) сразу покажем «Проверяем статус…»
    S.pending = true;
    renderStartRow();

    // 2) принудительно обновим состояние из таблицы/бэка
    try { await fetchProfileQuizStateFromServer(true); } catch(_) {}

    // 3) если после обновления уже пройдено — просто перерисуем плашку «Квиз пройден»
    if (hasCompleted()){
      S.pending = false;
      renderStartRow();
      return;
    }

    // 4) иначе запускаем вопросы
    startQuiz();
    return;
  }

    if (!body || !body.contains(e.target)) return;
    const step = STEPS[S.i];

    const opt = e.target.closest?.('.trivia-opt');
    if (opt && step && step.type === 'q' && body.contains(opt)){
      const value = opt.dataset.val;
      body.querySelectorAll('.trivia-opt').forEach(el => el.classList.remove('is-selected'));
      opt.classList.add('is-selected');
      if (step.id) S.profile[step.id] = value;

      const nextBtn = body.querySelector('.trivia-next');
      if (nextBtn){ nextBtn.disabled=false; nextBtn.classList.add('is-active'); }
      S.canNext = true;
      haptic('light');
      return;
    }

    if (e.target.closest?.('[data-action="trivia-next"]')){
      e.preventDefault();
      if (!S.canNext) return;
      const curStep = STEPS[S.i];
      if (curStep && curStep.type === 'q' && !S.earned[S.i]){
        S.score += curStep.coins || 0;
        S.earned[S.i] = true;
      }
      if (S.i < STEPS.length - 1){ S.i++; S.canNext=false; renderStep(); }
      else { finishQuiz(); }
      return;
    }

    if (e.target.closest?.('[data-action="trivia-save-bday"]') && step && step.type === 'birthday'){
      e.preventDefault();
      const d = S.birthdayDay || 1;
      const m = S.birthdayMonth || 1;
      if (!(d>=1 && d<=31 && m>=1 && m<=12)){ alert('Укажи реальную дату — день от 1 до 31 и месяц 😉'); return; }

      try{
        const payload = `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}`;
        localStorage.setItem(BDAY_KEY, payload);
        try{ window.onBeerBirthdaySaved?.({ day:d, month:m, score:S.score, profile:S.profile }); }catch(_){}
      }catch(_){}

      finishQuiz();
      return;
    }
  });

  // ===== Монтаж при появлении в шторке =====
  function mountIfReady(){
    const body = elBody(), start = elStart();
    if (body && start){
      ensureStyles();
      S.pending = true;
      renderStartRow();
      body.innerHTML = '';
      fetchProfileQuizStateFromServer(true);
      return true;
    }
    return false;
  }
  if (!mountIfReady()){
    const mo = new MutationObserver(()=>{ if (mountIfReady()) mo.disconnect(); });
    mo.observe(document.body, {childList:true, subtree:true});
  }

  // экспорт для явного вызова
  window.mountTrivia = function(forceFresh){
    ensureStyles();
    const body = elBody(); if (body) body.innerHTML = '';
    const start = elStart(); if (start) start.classList.remove('is-hidden');
    S.i=0; S.canNext=false; S.score=0;
    S.earned = new Array(STEPS.length).fill(false);
    S.profile={}; S.birthdayTouched=false;
    S.pending = true;
    renderStartRow();
    fetchProfileQuizStateFromServer(!!forceFresh);
  };

  const _openSheet = window.openSheet;
  window.openSheet = function(opts){
    _openSheet && _openSheet(opts);
    const title = (opts && opts.title) || '';
    if (/викторин/i.test(title) && typeof window.mountTrivia === 'function'){
      window.mountTrivia(true);
    }
  };

})();
