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
      text: 'А теперь — идеальный вечер. Какой кадр больше похож на твой?',
      options: [
        { value: 'slow',     label: 'Спокойно, пара бокалов, разговор или музыка в фоне' },
        { value: 'fun',      label: 'Смеяться, общаться, пробовать разное' },
        { value: 'tasting',  label: 'Прямо дегустация: сравнивать стили, обсуждать, запоминать' },
        { value: 'background', label: 'Пиво как фон — важнее компания или дело' }
      ]
    },
    {
      type: 'q',
      id: 'beer_character',
      coins: 10,
      text: 'Если бы пиво было персонажем, какой из этих тебе ближе всего?',
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
      coins: 20,
      text: 'А вот что в пиве тебя скорее отталкивает?',
      options: [
        { value: 'too_sour',   label: 'Сильная кислота (прямо “лимон в лицо”)' },
        { value: 'too_bitter', label: 'Жёсткая горечь, после которой лицо сводит' },
        { value: 'too_sweet',  label: 'Чересчур сладкие десертные истории' },
        { value: 'weird',      label: 'Слишком “перегруженные” вкусы (копчёное, острое, странные сочетания)' }
      ]
    },
    {
      type: 'q',
      id: 'snacks',
      coins: 10,
      text: 'С чем чаще всего берёшь пиво?',
      options: [
        { value: 'meat',   label: 'Мясо / колбаски / бургеры' },
        { value: 'snacks', label: 'Чипсы, сухарики, орешки и всё из этой серии' },
        { value: 'cheese', label: 'Сыры, закуски потоньше' },
        { value: 'solo',   label: 'Чаще всего вообще без еды' }
      ]
    },
    {
      type: 'q',
      id: 'budget',
      coins: 10,
      text: 'Про деньги. Какой вариант ближе к твоему привычному сценарию?',
      options: [
        { value: 'one_good', label: 'Лучше один-два, но прям «вау, как круто»' },
        { value: 'balanced', label: 'Хочу баланс: и вкусно, и по деньгам окей' },
        { value: 'more_for_less', label: 'Главное — посидеть подольше и побольше, но в разумном бюджете' },
        { value: 'no_matter', label: 'Зависит от дня и настроения, нет жёсткого сценария' }
      ]
    },
    {
      type: 'q',
      id: 'time_of_day',
      coins: 10,
      text: 'Когда чаще всего возникает мысль «хочу пива»?',
      options: [
        { value: 'after_work', label: 'После работы, вечером — расслабиться' },
        { value: 'weekend',    label: 'В выходные, когда есть время посидеть' },
        { value: 'event',      label: 'По событиям: матчи, встречи, поездки' },
        { value: 'random',     label: 'Случайно, без чёткого сценария' }
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
      text: 'У нас есть фишка — поздравлять своих людей не просто смской. Как тебе идея персональных подарков от бара к дню рождения?',
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

  const TG = window.Telegram?.WebApp;

  function haptic(type='light'){
    try{
      if (!TG || !TG.HapticFeedback) return;
      if (type==='impact') TG.HapticFeedback.impactOccurred('medium');
      else if (type==='success') TG.HapticFeedback.notificationOccurred('success');
      else TG.HapticFeedback.impactOccurred('light');
    }catch(_){}
  }

  function getCoins(){
    try{
      if (typeof window.getCoins === 'function') return window.getCoins();
      return 0;
    }catch(_){ return 0;}
  }
  function setCoins(v){
    try{
      if (typeof window.setCoins === 'function') return window.setCoins(v);
    }catch(_){}
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
    // флаг прохождения: первично из localStorage, далее — из сервера (profile_quiz.state / finish)
    completed: getLast() > 0
  };

  const hasCompleted = () => !!S.completed;

  // ===== Работа с сервером (GAS / profile_quiz) =====
  function fetchProfileQuizStateFromServer(){
    if (typeof window.getTgInit !== 'function' || typeof window.jpost !== 'function') return;
    try{
      const tg_init = window.getTgInit();
      window.jpost('/api/mini/event', {
        tg_init,
        type: 'profile_quiz.state',
        data: { quiz_id: 'beer_profile_v1' }
      })
      .then((res)=>{
        if (!res || !res.ok) return;
        S.completed = res.status === 'completed';

        // подхват даты рождения (если уже есть на сервере)
        if (res.bday_day != null){
          const d = Number(res.bday_day);
          if (d >= 1 && d <= 31) S.birthdayDay = d;
        }
        if (res.bday_month != null){
          const m = Number(res.bday_month);
          if (m >= 1 && m <= 12) S.birthdayMonth = m;
        }

        // мягкий локальный кэш
        if (S.completed){
          try{ setLast(Date.now()); }catch(_){}
        }

        // обновляем кнопку "Начать / Квиз пройден"
        renderStartRow();
      })
      .catch((err)=>{
        console.warn('profile_quiz.state error', err);
      });
    }catch(e){
      console.warn('profile_quiz.state error', e);
    }
  }

  function sendProfileQuizFinishToServer(){
    // если нет воркера / jpost — работаем по старинке (локальные монеты и кэш)
    if (typeof window.getTgInit !== 'function' || typeof window.jpost !== 'function'){
      try{
        setLast(Date.now());
        addCoins(S.score);
      }catch(_){}
      return;
    }

    try{
      const tg_init = window.getTgInit();
      const payload = {
        tg_init,
        type: 'profile_quiz.finish',
        data: {
          quiz_id: 'beer_profile_v1',
          score: S.score,
          bday_day: S.birthdayDay,
          bday_month: S.birthdayMonth,
          profile: S.profile,
          answers_json: JSON.stringify(S.profile || {})
        }
      };
      window.jpost('/api/mini/event', payload)
        .then((res)=>{
          if (!res || !res.ok) return;
          S.completed = res.status === 'completed';

          if (S.completed){
            try{ setLast(Date.now()); }catch(_){}
          }

          // если воркер вернёт fresh_state — обновим глобальный профиль, иначе просто монетки
          try{
            if (res.fresh_state && typeof window.applyFreshState === 'function'){
              window.applyFreshState(res.fresh_state);
            }else{
              if (typeof window.syncCoinsUI === 'function') window.syncCoinsUI();
            }
          }catch(_){}
        })
        .catch((err)=>{
          console.warn('profile_quiz.finish error', err);
        });
    }catch(e){
      console.warn('profile_quiz.finish error', e);
    }
  }

  // ===== DOM =====
  const elBody  = () => document.getElementById('trivia-body');
  const elStart = () => document.getElementById('trivia-start');
  const elHint  = () => document.getElementById('trivia-start-hint');
  const rootCard = () => document.getElementById('trivia-body')?.closest('.trivia-card');

  // ===== Создание html для опций =====
  function renderOptions(step){
    if (!step || !Array.isArray(step.options)) return '';
    return step.options.map(opt => `
      <button
        type="button"
        class="trivia-opt"
        data-val="${String(opt.value)}">
        <span class="trivia-opt__label">${opt.label}</span>
      </button>
    `).join('');
  }

  // ===== Шаги =====
  function currentStep(){
    return STEPS[S.i] || null;
  }

  function renderStep(){
    const body = elBody();
    if (!body) return;
    const step = currentStep();
    if (!step) return;

    S.canNext = false;

    if (step.type === 'birthday'){
      const card = `
        <div class="trivia-step">
          <div class="trivia-q">
            <div class="trivia-q__title">${step.text}</div>
          </div>
          <div class="bday-wheels">
            <div class="bday-wheel" data-bday-wheel="day">
              <div class="bday-wheel-mask"></div>
              <div class="bday-wheel-scroll" data-bday-scroll="day">
                ${renderDayItems()}
              </div>
            </div>
            <div class="bday-wheel" data-bday-wheel="month">
              <div class="bday-wheel-mask"></div>
              <div class="bday-wheel-scroll" data-bday-scroll="month">
                ${renderMonthItems()}
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-primary trivia-next trivia-next--bday"
            data-action="trivia-save-bday"
          >
            Указать дату и забрать монеты
          </button>
        </div>
      `;
      body.innerHTML = card;
      setTimeout(()=>initBdayWheels(), 30);
      return;
    }

    const total = STEPS.filter(s => s.type === 'q').length;
    const passed = Math.min(
      S.earned.filter(Boolean).length,
      total
    );

    const progress = total>0 ? Math.round(passed / total * 100) : 0;

    const html = `
      <div class="trivia-step">
        <div class="trivia-progress">
          <div class="trivia-progress__bar">
            <div class="trivia-progress__fill" style="width:${progress}%;"></div>
          </div>
        </div>
        <div class="trivia-q">
          <div class="trivia-q__title">${step.text}</div>
        </div>
        <div class="trivia-options">
          ${renderOptions(step)}
        </div>
        <button
          type="button"
          class="btn btn-primary trivia-next"
          data-action="trivia-next"
          disabled
        >
          Далее
        </button>
      </div>
    `;
    body.innerHTML = html;
  }

  function renderDayItems(){
    const items = [];
    for (let d=1; d<=31; d++){
      items.push(`
        <div class="bday-wheel-item" data-day="${d}">
          ${String(d).padStart(2,'0')}
        </div>
      `);
    }
    return items.join('');
  }

  function renderMonthItems(){
    const months = [
      '01','02','03','04','05','06',
      '07','08','09','10','11','12'
    ];
    return months.map((m,idx)=>`
      <div class="bday-wheel-item" data-month="${idx+1}">
        ${m}
      </div>
    `).join('');
  }

  function initBdayWheels(){
    const dayScroll   = document.querySelector('[data-bday-scroll="day"]');
    const monthScroll = document.querySelector('[data-bday-scroll="month"]');

    if (dayScroll){
      const items = Array.from(dayScroll.querySelectorAll('.bday-wheel-item'));
      const itemH = items[0]?.offsetHeight || 24;
      const targetIndex = Math.max(0, Math.min(30, (S.birthdayDay-1)));
      const offset = itemH * targetIndex;
      dayScroll.scrollTop = offset;
      bindWheelScroll(dayScroll, 'day', items);
    }

    if (monthScroll){
      const items = Array.from(monthScroll.querySelectorAll('.bday-wheel-item'));
      const itemH = items[0]?.offsetHeight || 24;
      const targetIndex = Math.max(0, Math.min(11, (S.birthdayMonth-1)));
      const offset = itemH * targetIndex;
      monthScroll.scrollTop = offset;
      bindWheelScroll(monthScroll, 'month', items);
    }

    const btn = document.querySelector('[data-action="trivia-save-bday"]');
    if (btn){
      btn.disabled = false;
      btn.classList.add('is-active');
    }
  }

  function bindWheelScroll(scrollEl, type, items){
    let scrollingTimeout = null;
    const itemH = items[0]?.offsetHeight || 24;

    function onScroll(){
      if (scrollingTimeout) window.clearTimeout(scrollingTimeout);
      scrollingTimeout = window.setTimeout(()=>{
        const st = scrollEl.scrollTop;
        const index = Math.round(st / itemH);
        const clampedIndex = Math.max(0, Math.min(items.length-1, index));
        const target = clampedIndex * itemH;

        try{
          scrollEl.scrollTo({ top: target, behavior:'smooth' });
        }catch(_){
          scrollEl.scrollTop = target;
        }

        const el = items[clampedIndex];
        if (!el) return;
        if (type === 'day'){
          const d = Number(el.dataset.day||'1');
          S.birthdayDay = d;
        } else if (type === 'month'){
          const m = Number(el.dataset.month||'1');
          S.birthdayMonth = m;
        }

        S.birthdayTouched = true;
        haptic('light');
      }, 80);
    }

    scrollEl.addEventListener('scroll', onScroll, {passive:true});
  }

  function renderStartRow(){
    const start = elStart();
    const hint  = elHint();
    const btn   = start?.querySelector('[data-action="trivia-start"]');
    if (!start || !btn) return;

    if (hasCompleted()){
      if (hint){
        hint.textContent = 'Анкету можно пройти один раз. Спасибо, что заполнил профиль 🙌';
      }
      btn.disabled = true;
      btn.classList.add('is-done');
      btn.textContent = 'Квиз пройден';
    } else {
      if (hint){
        hint.textContent = '';
      }
      btn.disabled = false;
      btn.classList.remove('is-done');
      btn.textContent = 'Начать';
    }
  }

  function renderFinish(){
    const body = elBody();
    if (!body) return;
    const total = S.score;
    body.innerHTML = `
      <div class="trivia-step">
        <div class="trivia-final">
          <div class="trivia-final__title">Готово! Мы сохранили твой вкус 😎</div>
          <div class="trivia-final__coins">+${total} монет за честные ответы</div>
          <div class="trivia-final__text">
            Теперь можем звать на релизы и акции, которые ближе именно тебе — без спама и «мимо вкуса».
          </div>
        </div>
      </div>
    `;
  }

  // ===== Стили =====
  let stylesInjected = false;
  function ensureStyles(){
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement('style');
    style.innerHTML = `
      .trivia-card{
        display:flex;
        flex-direction:column;
        gap:12px;
      }
      .trivia-start{
        display:flex;
        flex-direction:column;
        gap:10px;
      }
      .trivia-start-inner{
        display:flex;
        gap:12px;
        align-items:flex-start;
      }
      .trivia-start-icon{
        flex:0 0 auto;
        width:40px;
        height:40px;
        border-radius:999px;
        overflow:hidden;
      }
      .trivia-start-icon img{
        display:block;
        width:100%;
        height:100%;
        object-fit:contain;
      }
      .trivia-start-copy{
        flex:1 1 auto;
      }
      .trivia-title{
        font-size:15px;
        font-weight:600;
        line-height:1.35;
      }
      .trivia-start__hint{
        margin-top:4px;
        font-size:12px;
        opacity:0.75;
      }
      .trivia-start-btn{
        margin-top:8px;
        width:100%;
        display:block;
      }
      .trivia-start-btn.is-done{
        opacity:0.7;
        pointer-events:none;
        background:transparent !important;
        border:1px solid rgba(255,255,255,0.35);
        color:#aaaaaa !important;
      }

      .trivia-step{
        display:flex;
        flex-direction:column;
        gap:12px;
      }
      .trivia-progress{
        margin-bottom:4px;
      }
      .trivia-progress__bar{
        position:relative;
        width:100%;
        height:6px;
        border-radius:999px;
        background:rgba(255,255,255,0.08);
        overflow:hidden;
      }
      .trivia-progress__fill{
        position:absolute;
        left:0;
        top:0;
        bottom:0;
        width:0;
        border-radius:999px;
        background:linear-gradient(90deg,#ff9800,#ffc107);
        transition:width .25s ease-out;
      }
      .trivia-q__title{
        font-size:14px;
        font-weight:500;
        line-height:1.35;
      }
      .trivia-options{
        display:flex;
        flex-direction:column;
        gap:8px;
        margin-top:8px;
      }
      .trivia-opt{
        position:relative;
        width:100%;
        text-align:left;
        padding:10px 12px;
        border-radius:999px;
        border:1px solid rgba(255,255,255,0.16);
        background:rgba(0,0,0,0.25);
        color:#fff;
        font-size:13px;
        line-height:1.3;
        cursor:pointer;
        transition:background .15s ease-out,border-color .15s ease-out,transform .08s ease-out;
      }
      .trivia-opt__label{
        display:block;
        pointer-events:none;
      }
      .trivia-opt:active{
        transform:scale(.98);
      }
      .trivia-opt.is-selected{
        border-color:#ff9800;
        background:rgba(255,152,0,0.12);
      }
      .trivia-next{
        margin-top:10px;
        width:100%;
      }
      .trivia-next[disabled]{
        opacity:0.5;
        pointer-events:none;
      }
      .trivia-next.is-active{
        opacity:1;
        pointer-events:auto;
        background:#ff9800 !important;
        border-color:#ff9800;
        color:#000 !important;
      }
      .bday-wheels{
        display:flex;
        gap:16px;
        justify-content:center;
        margin:16px 0 8px;
      }
      .bday-wheel{
        position:relative;
        width:80px;
        height:140px;
        overflow:hidden;
      }
      .bday-wheel-mask{
        position:absolute;
        inset:0;
        background:linear-gradient(to bottom,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0) 25%,rgba(0,0,0,0) 75%,rgba(0,0,0,0.9) 100%);
        pointer-events:none;
        z-index:2;
      }
      .bday-wheel-scroll{
        position:absolute;
        inset:0;
        overflow-y:auto;
        scrollbar-width:none;
      }
      .bday-wheel-scroll::-webkit-scrollbar{
        display:none;
      }
      .bday-wheel-item{
        height:28px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:16px;
        font-weight:600;
      }
      .trivia-final{
        display:flex;
        flex-direction:column;
        gap:6px;
      }
      .trivia-final__title{
        font-size:15px;
        font-weight:600;
      }
      .trivia-final__coins{
        font-size:14px;
        font-weight:500;
        color:#ffeb3b;
      }
      .trivia-final__text{
        font-size:12px;
        opacity:0.8;
      }

      @media (min-width:640px){
        .trivia-card{
          max-width:420px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ===== Отрисовка старта =====
  function initStartCard(){
    const tpl = document.getElementById('tpl-trivia');
    if (!tpl) return;
    const host = tpl.content?.cloneNode(true) || null;
    if (!host) return;
    const wrap = host.querySelector('.trivia-card');
    if (!wrap) return;

    const iconEl = wrap.querySelector('.trivia-start-icon img');
    if (iconEl && !iconEl.src){
      iconEl.src = 'img/casino-chips.png';
    }

    const target = document.querySelector('[data-block="profile-trivia"]');
    if (!target) return;
    target.innerHTML = '';
    target.appendChild(host);
  }

  function resetState(){
    S.i = 0;
    S.canNext = false;
    S.score = 0;
    S.earned = new Array(STEPS.length).fill(false);
    S.profile = {};
    S.birthdayTouched = false;

    try{
      const raw = localStorage.getItem(BDAY_KEY);
      if (raw && /^\d{2}-\d{2}$/.test(raw)){
        const [dd,mm] = raw.split('-');
        S.birthdayDay = Number(dd||'1') || 1;
        S.birthdayMonth = Number(mm||'1') || 1;
      }
    }catch(_){}
  }

  // ===== Старт / Квиз =====
  function startQuiz(){
    const body = elBody();
    const start = elStart();
    if (!body || !start) return;
    resetState();
    start.classList.add('is-hidden');
    rootCard()?.classList.add('is-running');
    renderStep();
    haptic('impact');
  }

  function finishQuiz(){
    logPrize(`+${S.score}🪙 за викторину вкуса`);

    // оптимистично считаем, что квиз пройден
    S.completed = true;

    haptic('light');
    renderFinish();
    rootCard()?.classList.remove('is-running');

    // отправляем результат на бэкенд (GAS через воркер)
    sendProfileQuizFinishToServer();

    setTimeout(renderStartRow, 1400);
  }

  // ===== Слушатель кликов =====
  document.addEventListener('click', (e)=>{
    const body = elBody();
    const step = currentStep();

    // старт
    if (e.target.closest?.('[data-action="trivia-start"]')){
      e.preventDefault();
      if (hasCompleted()) return;
      startQuiz();
      return;
    }

    if (!body || !body.contains(e.target)) return;

    // выбор варианта
    const opt = e.target.closest?.('.trivia-opt');
    if (opt && step && step.type === 'q' && body.contains(opt)){
      const value = opt.dataset.val;

      body.querySelectorAll('.trivia-opt').forEach(el => el.classList.remove('is-selected'));
      opt.classList.add('is-selected');

      if (step.id){
        S.profile[step.id] = value;
      }

      const nextBtn = body.querySelector('.trivia-next');
      if (nextBtn){
        nextBtn.disabled = false;
        nextBtn.classList.add('is-active');
      }
      S.canNext = true;
      haptic('light');
      return;
    }

    // далее
    if (e.target.closest?.('[data-action="trivia-next"]')){
      e.preventDefault();
      if (!S.canNext) return;
      const curStep = STEPS[S.i];
      if (curStep && curStep.type === 'q' && !S.earned[S.i]){
        S.score += curStep.coins || 0;
        S.earned[S.i] = true;
      }
      if (S.i < STEPS.length - 1){
        S.i++;
        S.canNext = false;
        renderStep();
      }else{
        finishQuiz();
      }
      return;
    }

    // тап по элементу барабана — докрутить до него
    const wheelItem = e.target.closest?.('.bday-wheel-item');
    if (wheelItem && step && step.type === 'birthday'){
      e.preventDefault();
      const scrollEl = wheelItem.closest('.bday-wheel-scroll');
      if (scrollEl){
        const container = scrollEl;
        const itemOffset = wheelItem.offsetTop;
        const containerHeight = container.clientHeight;
        const itemHeight = wheelItem.offsetHeight;
        const scrollTop = itemOffset - (containerHeight/2 - itemHeight/2);
        try{
          container.scrollTo({ top: scrollTop, behavior:'smooth' });
        }catch(_){
          container.scrollTop = scrollTop;
        }
      }
      return;
    }

    // сохранение ДР
    if (e.target.closest?.('[data-action="trivia-save-bday"]') && step && step.type === 'birthday'){
      e.preventDefault();
      const day = S.birthdayDay || 1;
      const month = S.birthdayMonth || 1;

      if (!(day >= 1 && day <= 31 && month >= 1 && month <= 12)){
        alert('Укажи реальную дату — день от 1 до 31 и месяц 😉');
        return;
      }

      try{
        const payload = `${String(day).padStart(2,'0')}-${String(month).padStart(2,'0')}`;
        localStorage.setItem(BDAY_KEY, payload);
        try{
          window.onBeerBirthdaySaved?.({ day, month, score: S.score, profile: S.profile });
        }catch(_){}
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
      renderStartRow();
      body.innerHTML = '';

      // при авто-монтаже тоже попробуем подтянуть состояние квиза с сервера
      fetchProfileQuizStateFromServer();

      return true;
    }
    return false;
  }

  if (!mountIfReady()){
    const mo = new MutationObserver(()=>{ if (mountIfReady()) mo.disconnect(); });
    mo.observe(document.body, {childList:true, subtree:true});
  }

  // экспорт, если нужно дернуть вручную
  window.mountTrivia = function(){
    ensureStyles();

    // сбрасываем внутренний контент квиза
    const body = elBody();
    if (body) body.innerHTML = '';

    // показываем стартовый экран
    const start = elStart();
    if (start) start.classList.remove('is-hidden');

    // сбрасываем временное состояние (без отметки "квиз пройден")
    S.i = 0;
    S.canNext = false;
    S.score = 0;
    S.earned = new Array(STEPS.length).fill(false);
    S.profile = {};
    S.birthdayTouched = false;

    // синхронизируем кнопку с фактом прохождения:
    //  - если квиз не проходили → жёлтая "Начать"
    //  - если уже проходили → "Квиз пройден" и неактивна
    renderStartRow();

    // дополнительно синхронизируемся с сервером (GAS через воркер),
    // чтобы узнать, проходил ли пользователь анкету и есть ли дата ДР
    fetchProfileQuizStateFromServer();
  };

})();
