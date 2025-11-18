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
      id: 'vibes',
      coins: 10,
      text: 'Какой вайб бара твой по умолчанию?',
      options: [
        { value: 'calm',   label: 'Тихо, лампово, чтобы можно было нормально поговорить' },
        { value: 'mix',    label: 'Чуть шума, чуть музыки, но без тотальной мясорубки' },
        { value: 'loud',   label: 'Чем громче и динамичнее, тем лучше — люблю движ' },
        { value: 'sports', label: 'Спорт-бар вайб: матчи, эмоции, комментируем всё подряд' }
      ]
    },
    {
      type: 'q',
      id: 'company',
      coins: 10,
      text: 'С кем чаще всего заходишь?',
      options: [
        { value: 'solo',  label: 'Часто один: перезагрузиться, подумать, выдохнуть' },
        { value: 'duo',   label: 'С одним-двумя близкими людьми' },
        { value: 'squad', label: 'С компанией: друзья, коллеги, «наши в сборе»' },
        { value: 'mix',   label: 'Как пойдёт: иногда один, иногда с разными компаниями' }
      ]
    },
    {
      type: 'q',
      id: 'first_order',
      coins: 15,
      text: 'Вот ты сел за стол/стойку. Что заказываешь первым делом?',
      options: [
        { value: 'beer',   label: 'Сразу пиво. Без долгих раздумий' },
        { value: 'check',  label: 'Спрашиваю, что сегодня интересного по крану и бутылкам' },
        { value: 'taster', label: 'Прошу попробовать пару вариантов, прежде чем выбрать' },
        { value: 'other',  label: 'Иногда беру сидр/коктейль/что-то ещё, не только пиво' }
      ]
    },
    {
      type: 'q',
      id: 'tempo',
      coins: 15,
      text: 'Как ты обычно пьёшь?',
      options: [
        { value: 'slow',  label: 'Медленно, смакуя каждый глоток' },
        { value: 'middle',label: 'В умеренном темпе, общаясь и не считая глотки' },
        { value: 'fast',  label: 'Быстро, особенно если день был тяжёлый' },
        { value: 'shift', label: 'Зависит от компании и настроения' }
      ]
    },
    {
      type: 'q',
      id: 'role',
      coins: 15,
      text: 'Какую роль чаще всего берёшь на себя за столом?',
      options: [
        { value: 'story',   label: 'Рассказчик: истории, шутки, тосты — это ко мне' },
        { value: 'listener',label: 'Слушатель: люблю слушать, задавать вопросы, поддерживать' },
        { value: 'leader',  label: 'Организатор: «кто что пьёт?», «поехали дальше вот туда»' },
        { value: 'observer',label: 'Наблюдатель: смотрю на людей, атмосферу, ловлю моменты' }
      ]
    },
    {
      type: 'q',
      id: 'mood',
      coins: 15,
      text: 'С каким настроением чаще всего выходишь из бара?',
      options: [
        { value: 'recharged', label: 'Перезагруженный и спокойный, как после хорошей бани' },
        { value: 'inspired',  label: 'Воодушевлённый новыми идеями и разговорами' },
        { value: 'chill',     label: 'Приятно уставший, но по-хорошему' },
        { value: 'onfire',    label: 'Заряженный, хочется продолжения банкета' }
      ]
    },
    {
      type: 'q',
      id: 'knowledge',
      coins: 15,
      text: 'Как ты сейчас разбираешься в пиве?',
      options: [
        { value: 'newbie',   label: 'Я скорее новичок: знаю базовые стили и пару любимых' },
        { value: 'curious',  label: 'Читаю, пробую, но ещё не считаю себя экспертом' },
        { value: 'geek',     label: 'Разбираюсь довольно неплохо, могу спорить про стили' },
        { value: 'pro',      label: 'Я тот самый человек, к которому все идут за советом' }
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
      text: 'Что для тебя важнее всего в пиве?',
      options: [
        { value: 'taste',     label: 'Вкус и баланс — чтобы каждая нота была на своём месте' },
        { value: 'aroma',     label: 'Аромат: люблю нюхать бокал не меньше, чем пить' },
        { value: 'strength',  label: 'Градусы и плотность' },
        { value: 'uniqueness',label: 'Необычность: чтобы было «вау, такого ещё не пил»' }
      ]
    },
    {
      type: 'q',
      id: 'food',
      coins: 15,
      text: 'Как ты относишься к еде с пивом?',
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
        { value: 'normal',  label: 'Нормально посидеть: пару часов, несколько бокалов' },
        { value: 'long',    label: 'Долгие посиделки до закрытия или почти' },
        { value: 'special', label: 'Редко, но если уж выбрался — хочу максимум впечатлений' }
      ]
    },
    {
      type: 'q',
      id: 'priority',
      coins: 20,
      text: 'Что для тебя важнее всего при выборе бара?',
      options: [
        { value: 'beer',    label: 'Линейка пива: редкие стили, интересные позиции' },
        { value: 'atmos',   label: 'Атмосфера: музыка, свет, интерьер, люди вокруг' },
        { value: 'service', label: 'Бармены и отношение: важно, как со мной общаются' },
        { value: 'combo',   label: 'Хочу всё сразу: и пиво, и атмосферу, и заботу' }
      ]
    },
    {
      type: 'q',
      id: 'schedule',
      coins: 15,
      text: 'Как часто ты примерно выбираешься в бар?',
      options: [
        { value: 'rare',   label: 'Раз в месяц или реже' },
        { value: 'month',  label: 'Пару раз в месяц' },
        { value: 'week',   label: 'Раз в неделю или около того' },
        { value: 'often',  label: 'Чаще раза в неделю' }
      ]
    },
    {
      type: 'q',
      id: 'openness',
      coins: 20,
      text: 'Насколько ты открыт к новым стилям и вкусам?',
      options: [
        { value: 'very',  label: 'Максимально: люблю эксперименты и необычные штуки' },
        { value: 'medium',label: 'Готов пробовать, но опираюсь на проверенную базу' },
        { value: 'low',   label: 'Свой любимый стиль/пара стилей — и мне этого достаточно' }
      ]
    },
    {
      type: 'q',
      id: 'format',
      coins: 15,
      text: 'Какой формат подачи тебе ближе?',
      options: [
        { value: 'tap',     label: 'Разливное — люблю свежесть и ощущение бара' },
        { value: 'bottle',  label: 'Бутылки/банки — удобно пробовать редкие штуки' },
        { value: 'mix',     label: 'Миксую: смотрю по конкретным позициям' }
      ]
    },
    {
      type: 'q',
      id: 'education',
      coins: 20,
      text: 'Насколько тебе интересно прокачивать знания о пиве?',
      options: [
        { value: 'high',  label: 'Очень! Готов смотреть гайды, участвовать в дегустациях' },
        { value: 'mid',   label: 'Интересно, но в лайтовом формате, без учебников' },
        { value: 'low',   label: 'Хочу просто вкусное пиво без сложных разборов' }
      ]
    },
    {
      type: 'q',
      id: 'gifts',
      coins: 20,
      text: 'Какой формат бонусов и активности тебе ближе всего?',
      options: [
        { value: 'discounts', label: 'Скидки и бонусы за визиты/покупки' },
        { value: 'merch',     label: 'Мерч и подарки: бокалы, футболки, открывашки' },
        { value: 'events',    label: 'Спецвечера, дегустации, закрытые мероприятия' },
        { value: 'game',      label: 'Игровая механика: квесты, уровни, достижения' }
      ]
    },
    {
      type: 'q',
      id: 'communication',
      coins: 20,
      text: 'Как тебе удобнее всего получать новости и предложения от бара?',
      options: [
        { value: 'tg',    label: 'Телеграм: бот, канал, личные сообщения' },
        { value: 'social',label: 'Соцсети: лента, сторис и т.п.' },
        { value: 'push',  label: 'Уведомления в приложении / мини-приложении' },
        { value: 'silent',label: 'Минимум уведомлений, только что-то реально важное' }
      ]
    },
    {
      type: 'birthday',
      id: 'birthday',
      coins: 30,
      text: 'И последний штрих: давай сохраним твой месяц и день рождения, чтобы в нужный момент прилетел подарок 🎁',
      hint: 'Мы не спрашиваем год и не передаём дату третьим лицам. Это нужно только, чтобы вовремя радовать тебя бонусами.',
      fields: {
        day:   'День',
        month: 'Месяц'
      }
    }
  ];

  const TOTAL_QUESTIONS = STEPS.filter(s => s.type === 'q').length;
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  // ===== Telegram / haptic =====
  const TG = window.Telegram && window.Telegram.WebApp;
  function haptic(level){
    try{
      TG?.HapticFeedback?.impactOccurred(level || 'light');
    }catch(_){
      navigator.vibrate?.(10);
    }
  }

  // ===== Хелпер для мини-событий через воркер (фолбэк) =====
  if (!window.callMiniEvent &&
      typeof window.getTgInit === 'function' &&
      typeof window.jpost === 'function') {

    window.callMiniEvent = function(type, data) {
      const tg_init = window.getTgInit();
      return window.jpost('/api/mini/event', {
        tg_init,
        type,
        data
      });
    };
  }

  // ===== Баланс / призы (локальный фолбэк, основной — через GAS) =====
  const COIN_KEY = 'beer_coins';
  function getCoins(){ return +(localStorage.getItem(COIN_KEY) || 0); }
  function setCoins(v){
    localStorage.setItem(COIN_KEY, String(v|0));
    try{ window.syncCoinsUI?.(); }catch(_){}
  }
  function addCoins(n){
    if (!n) return;
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

  // сейчас getLast / setLast используются только как мягкий кэш,
  // но НЕ решают, пускать ли в квиз (это делает только S.completed из GAS)
  const getLast = () => +(localStorage.getItem(LAST_KEY) || 0);
  const setLast = (ts = Date.now()) => localStorage.setItem(LAST_KEY, String(ts));

  // ===== Состояние =====
  const S = {
    i: 0,
    canNext: false,
    score: 0,
    earned: [],
    profile: {},
    birthdayDay: null,
    birthdayMonth: null,
    completed: false,
    isSubmitting: false
  };

  // ===== Элементы =====
  function elRoot(){ return document.querySelector('[data-profile-quiz-root]'); }
  function elStart(){ return document.querySelector('[data-profile-quiz-start]'); }
  function elHint(){ return document.querySelector('[data-profile-quiz-hint]'); }
  function elBody(){ return document.querySelector('[data-profile-quiz-body]'); }
  function elProg(){ return document.querySelector('[data-profile-quiz-progress]'); }

  // ===== Инициализация =====
  function initProfileQuiz(){
    const root = elRoot();
    if (!root) return;

    ensureStyles();
    renderStartRow();
    fetchProfileQuizStateFromServer();
  }

  // ===== Стили =====
  function ensureStyles(){
    if (document.getElementById('profile-quiz-styles')) return;

    const css = `
      [data-profile-quiz-root]{
        border-radius:16px;
        padding:16px;
        background:linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
        border:1px solid rgba(255,255,255,0.1);
        backdrop-filter:blur(16px);
      }
      .trivia-start{
        display:flex;
        gap:12px;
        align-items:flex-start;
      }
      .trivia-start-icon{
        width:52px;
        height:52px;
        border-radius:16px;
        background:radial-gradient(circle at 0 0,#FFD54F,#FFA726);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:26px;
        box-shadow:0 8px 18px rgba(0,0,0,0.35);
        flex-shrink:0;
      }
      .trivia-start-icon img{
        max-width:70%;
        max-height:70%;
        object-fit:contain;
      }
      .trivia-start-copy{
        flex:1 1 auto;
      }
      .trivia-start__hint{
        margin-top:4px;
        font-size:12px;
        opacity:0.75;
      }
      .trivia-start-btn{
        margin-top:4px;
        width:100%;
        display:block;
      }
      .trivia-start-btn.is-done{
        background:transparent !important;
        border:1px solid rgba(255,255,255,0.35);
        color:#aaaaaa !important;
      }

      .trivia-step{
        display:flex;
        flex-direction:column;
        gap:12px;
      }
      .trivia-title{
        font-size:16px;
        font-weight:600;
      }
      .trivia-options{
        display:flex;
        flex-direction:column;
        gap:8px;
      }
      .trivia-option{
        border-radius:12px;
        padding:10px 12px;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(0,0,0,0.25);
        display:flex;
        align-items:flex-start;
        gap:8px;
        cursor:pointer;
        transition:background 0.15s ease,border-color 0.15s ease,transform 0.15s ease;
      }
      .trivia-option:hover{
        border-color:rgba(255,255,255,0.35);
        transform:translateY(-1px);
      }
      .trivia-option__radio{
        width:18px;
        height:18px;
        border-radius:999px;
        border:2px solid rgba(255,255,255,0.45);
        margin-top:2px;
        flex-shrink:0;
        position:relative;
      }
      .trivia-option__radio::after{
        content:'';
        position:absolute;
        inset:3px;
        border-radius:inherit;
        background:rgba(255,255,255,0.0);
        transition:background 0.15s ease;
      }
      .trivia-option__label{
        font-size:14px;
        line-height:1.3;
      }
      .trivia-option.is-active{
        border-color:#FFC107;
        background:linear-gradient(135deg,rgba(255,193,7,0.2),rgba(255,255,255,0.02));
      }
      .trivia-option.is-active .trivia-option__radio::after{
        background:#FFC107;
      }

      .trivia-footer{
        display:flex;
        flex-direction:column;
        gap:8px;
        margin-top:10px;
      }
      .trivia-progress{
        font-size:12px;
        opacity:0.8;
      }
      .trivia-btn-next{
        width:100%;
      }

      .trivia-birthday-row{
        display:flex;
        gap:8px;
        margin-top:8px;
      }
      .trivia-birthday-field{
        flex:1 1 0;
      }
      .trivia-birthday-label{
        font-size:12px;
        margin-bottom:4px;
        opacity:0.8;
      }
      .trivia-birthday-input,
      .trivia-birthday-select{
        width:100%;
        border-radius:10px;
        border:1px solid rgba(255,255,255,0.15);
        background:rgba(0,0,0,0.3);
        color:#fff;
        padding:8px 10px;
        font-size:14px;
        outline:none;
      }
      .trivia-birthday-hint{
        margin-top:6px;
        font-size:11px;
        opacity:0.7;
      }

      @media (max-width:480px){
        [data-profile-quiz-root]{
          padding:12px;
        }
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'profile-quiz-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ===== Работа с GAS / воркером: profile_quiz.state / finish =====
  function fetchProfileQuizStateFromServer(){
    // 1) Основной путь — через общий хелпер, как колесо / штампы
    if (typeof window.callMiniEvent === 'function'){
      window.callMiniEvent('profile_quiz.state', { quiz_id: QUIZ_ID })
        .then(function(res){
          console.log('[quiz.state] response', res);
          if (!res || !res.ok) return;

          S.completed = res.status === 'completed';

          if (res.bday_day != null){
            var d = Number(res.bday_day);
            if (d >= 1 && d <= 31) S.birthdayDay = d;
          }
          if (res.bday_month != null){
            var m = Number(res.bday_month);
            if (m >= 1 && m <= 12) S.birthdayMonth = m;
          }

          if (S.completed){
            try { setLast(Date.now()); } catch(_) {}
          }

          renderStartRow();
        })
        .catch(function(err){
          console.warn('profile_quiz.state error', err);
        });

      return;
    }

    // 2) Фолбэк — старый вариант через getTgInit/jpost (на будущее, если откроешь страницу без воркера)
    if (typeof window.getTgInit !== 'function' || typeof window.jpost !== 'function'){
      console.log('[quiz.state] нет callMiniEvent и getTgInit/jpost — работаем без сервера');
      return;
    }

    try{
      var tg_init = window.getTgInit();
      window.jpost('/api/mini/event', {
        tg_init: tg_init,
        type: 'profile_quiz.state',
        data: { quiz_id: QUIZ_ID }
      })
        .then(function(res){
          console.log('[quiz.state] response (legacy)', res);
          if (!res || !res.ok) return;

          S.completed = res.status === 'completed';

          if (res.bday_day != null){
            var d2 = Number(res.bday_day);
            if (d2 >= 1 && d2 <= 31) S.birthdayDay = d2;
          }
          if (res.bday_month != null){
            var m2 = Number(res.bday_month);
            if (m2 >= 1 && m2 <= 12) S.birthdayMonth = m2;
          }

          if (S.completed){
            try { setLast(Date.now()); } catch(_) {}
          }

          renderStartRow();
        })
        .catch(function(err){
          console.warn('profile_quiz.state legacy error', err);
        });
    }catch(e){
      console.warn('profile_quiz.state legacy error', e);
    }
  }

  function sendProfileQuizFinishToServer(){
    var data = {
      quiz_id: QUIZ_ID,
      score: S.score,
      bday_day: S.birthdayDay,
      bday_month: S.birthdayMonth,
      profile: S.profile,
      answers_json: JSON.stringify(S.profile || {})
    };

    // 1) Основной путь — через callMiniEvent (как колесо)
    if (typeof window.callMiniEvent === 'function'){
      console.log('[quiz.finish] via callMiniEvent', data);
      window.callMiniEvent('profile_quiz.finish', data)
        .then(function(res){
          console.log('[quiz.finish] response', res);
          if (!res || !res.ok) return;

          S.completed = res.status === 'completed';

          if (S.completed){
            try { setLast(Date.now()); } catch(_) {}
          }

          try{
            if (res.fresh_state && typeof window.applyFreshState === 'function'){
              window.applyFreshState(res.fresh_state);
            }else if (typeof window.syncCoinsUI === 'function'){
              window.syncCoinsUI();
            }
          }catch(e){
            console.warn('quiz.finish applyFreshState error', e);
          }
        })
        .catch(function(err){
          console.warn('profile_quiz.finish error', err);
        });

      return;
    }

    // 2) Фолбэк — старый путь через getTgInit/jpost, если вдруг нет callMiniEvent
    if (typeof window.getTgInit !== 'function' || typeof window.jpost !== 'function'){
      console.log('[quiz.finish] нет callMiniEvent и getTgInit/jpost — работаем локально');
      try{
        setLast(Date.now());
        addCoins(S.score);
      }catch(_){}
      return;
    }

    try{
      var tg_init = window.getTgInit();
      var payload = {
        tg_init: tg_init,
        type: 'profile_quiz.finish',
        data: data
      };

      console.log('[quiz.finish] legacy payload', payload);

      window.jpost('/api/mini/event', payload)
        .then(function(res){
          console.log('[quiz.finish] legacy response', res);
          if (!res || !res.ok) return;

          S.completed = res.status === 'completed';

          if (S.completed){
            try { setLast(Date.now()); } catch(_) {}
          }

          try{
            if (res.fresh_state && typeof window.applyFreshState === 'function'){
              window.applyFreshState(res.fresh_state);
            }else if (typeof window.syncCoinsUI === 'function'){
              window.syncCoinsUI();
            }
          }catch(e){
            console.warn('quiz.finish legacy applyFreshState error', e);
          }
        })
        .catch(function(err){
          console.warn('profile_quiz.finish legacy error', err);
        });
    }catch(e){
      console.warn('profile_quiz.finish legacy error', e);
    }
  }

  // ===== Стартовая плашка =====
  function renderStartRow(){
    const start = elStart(), hint = elHint();
    if (!start) return;

    const last = getLast();
    const completed = !!S.completed;

    if (completed){
      start.textContent = 'Квиз пройден';
      start.classList.add('btn-secondary');
      start.classList.add('is-done');
      start.disabled = false;
      if (hint){
        hint.textContent = 'Готово! Мы сохранили твой «паспорт вкуса» и дату. На счёт зачислено 200 монет.';
      }
      start.onclick = function(){
        haptic('light');
        openQuizModal(true);
      };
    }else{
      start.textContent = 'Ответь на 4 простых вопроса и получи 100 монет';
      start.classList.remove('is-done');
      start.disabled = false;
      if (hint){
        hint.textContent = 'Анкету можно пройти один раз. Спасибо, что заполнили профиль 🙌';
      }
      start.onclick = function(){
        haptic('light');
        openQuizModal(false);
      };
    }
  }

  // ===== Модалка квиза =====
  function openQuizModal(isRepeat){
    const root = elRoot();
    if (!root) return;

    S.i = 0;
    S.score = 0;
    S.earned = [];
    S.canNext = false;

    renderStep();
  }

  function getQuestionIndex(i){
    let index = 0;
    for (let k = 0; k <= i && k < STEPS.length; k++){
      if (STEPS[k].type === 'q') index++;
    }
    return index;
  }

  function renderStep(){
    const step = STEPS[S.i];
    if (!step) return;
    ensureStyles();

    if (step.type === 'q'){
      renderQuestionStep(step);
    }else if (step.type === 'birthday'){
      renderBirthdayStep(step);
    }
  }

  function renderQuestionStep(step){
    const box = elBody(); if (!box) return;
    const qIndex = getQuestionIndex(S.i);
    const totalQ = TOTAL_QUESTIONS;
    const answered = Math.max(0, qIndex - 1);
    const progress = Math.round((answered / totalQ) * 100);

    const optionsHtml = step.options.map(function(opt){
      const active = S.profile[step.id] === opt.value;
      return `
        <button type="button"
          class="trivia-option ${active ? 'is-active' : ''}"
          data-opt="${step.id}:${opt.value}">
          <div class="trivia-option__radio"></div>
          <div class="trivia-option__label">${opt.label}</div>
        </button>
      `;
    }).join('');

    box.innerHTML = `
      <div class="trivia-step">
        <div class="trivia-title">${step.text}</div>
        <div class="trivia-options">
          ${optionsHtml}
        </div>
        <div class="trivia-footer">
          <div class="trivia-progress">
            Вопрос ${qIndex} из ${totalQ}
          </div>
          <button type="button" class="btn btn-primary trivia-btn-next" disabled>Дальше</button>
        </div>
      </div>
    `;

    const opts = box.querySelectorAll('.trivia-option');
    opts.forEach(function(btn){
      btn.addEventListener('click', function(){
        const val = btn.getAttribute('data-opt').split(':')[1];
        S.profile[step.id] = val;
        S.canNext = true;

        opts.forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        const nextBtn = box.querySelector('.trivia-btn-next');
        if (nextBtn){
          nextBtn.disabled = false;
        }

        haptic('light');
      });
    });

    const nextBtn = box.querySelector('.trivia-btn-next');
    if (nextBtn){
      nextBtn.addEventListener('click', function(){
        if (!S.canNext) return;
        haptic('light');
        S.score += step.coins || 0;
        S.earned.push(step.id);

        goNextStep();
      });
    }

    const prog = elProg();
    if (prog){
      prog.style.width = progress + '%';
    }
  }

  function renderBirthdayStep(step){
    const box = elBody(); if (!box) return;

    const monthsOptions = MONTHS.map(function(name, index){
      const mVal = index + 1;
      const selected = S.birthdayMonth === mVal ? 'selected' : '';
      return `<option value="${mVal}" ${selected}>${name}</option>`;
    }).join('');

    const dayVal = S.birthdayDay || '';

    box.innerHTML = `
      <div class="trivia-step">
        <div class="trivia-title">${step.text}</div>
        <div class="trivia-birthday-row">
          <div class="trivia-birthday-field">
            <div class="trivia-birthday-label">${step.fields.day}</div>
            <input type="number" min="1" max="31" inputmode="numeric"
              class="trivia-birthday-input" value="${dayVal}" />
          </div>
          <div class="trivia-birthday-field">
            <div class="trivia-birthday-label">${step.fields.month}</div>
            <select class="trivia-birthday-select">
              <option value="">Месяц</option>
              ${monthsOptions}
            </select>
          </div>
        </div>
        <div class="trivia-birthday-hint">${step.hint}</div>
        <div class="trivia-footer">
          <button type="button" class="btn btn-primary trivia-btn-next" disabled>Сохранить и получить монеты</button>
        </div>
      </div>
    `;

    const dayInput = box.querySelector('.trivia-birthday-input');
    const monthSelect = box.querySelector('.trivia-birthday-select');
    const nextBtn = box.querySelector('.trivia-btn-next');

    function validate(){
      const day = Number(dayInput.value);
      const month = Number(monthSelect.value);
      const ok = day >= 1 && day <= 31 && month >= 1 && month <= 12;
      S.canNext = ok;
      if (nextBtn) nextBtn.disabled = !ok;
    }

    dayInput.addEventListener('input', function(){
      S.birthdayDay = Number(dayInput.value) || null;
      validate();
    });

    monthSelect.addEventListener('change', function(){
      S.birthdayMonth = Number(monthSelect.value) || null;
      validate();
    });

    if (S.birthdayDay && S.birthdayMonth){
      validate();
    }

    if (nextBtn){
      nextBtn.addEventListener('click', function(){
        if (!S.canNext) return;
        haptic('light');

        S.score += step.coins || 0;
        S.earned.push(step.id);

        try{
          if (S.birthdayDay && S.birthdayMonth){
            localStorage.setItem(BDAY_KEY, JSON.stringify({
              day: S.birthdayDay,
              month: S.birthdayMonth
            }));
          }
        }catch(_){}

        finishQuiz();
      });
    }
  }

  function goNextStep(){
    if (S.i < STEPS.length - 1){
      S.i++;
      S.canNext = false;
      renderStep();
    }else{
      finishQuiz();
    }
  }

  function finishQuiz(){
    if (S.isSubmitting) return;
    S.isSubmitting = true;

    try{
      addCoins(S.score);
      logPrize(`Паспорт вкуса: +${S.score} монет`);
    }catch(_){}

    sendProfileQuizFinishToServer();

    S.isSubmitting = false;
    S.completed = true;
    setLast(Date.now());
    renderStartRow();

    const box = elBody();
    if (box){
      box.innerHTML = `
        <div class="trivia-step">
          <div class="trivia-title">Квиз пройден 🎉</div>
          <p>Мы сохранили твой «паспорт вкуса» и дату. Монеты уже на счёте — загляни в профиль.</p>
        </div>
      `;
    }
  }

  // ===== Запуск =====
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initProfileQuiz);
  }else{
    initProfileQuiz();
  }

})();
