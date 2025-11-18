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
      type: 'q',
      id: 'birthday_vibes',
      coins: 10,
      text: 'Как относишься к поздравлениям и спецпредложениям на день рождения?',
      options: [
        { value: 'love',    label: 'Обожаю, когда про меня помнят и поздравляют' },
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

// Хелпер: общий вызов мини-событий через воркер (как у колеса / штампов)
// Если в глобале уже есть window.callMiniEvent, мы его не трогаем.
// Если нет, но есть getTgInit + jpost, собираем его здесь.
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

  function haptic(level){
    try{
      TG?.HapticFeedback?.impactOccurred(level || 'light');
    }catch(_){
      navigator.vibrate?.(10);
    }
  }

  // ===== Баланс / призы (локальный фолбэк, основной — через GAS) =====
  const COIN_KEY = 'beer_coins';
  function getCoins(){ return +(localStorage.getItem(COIN_KEY) || 0); }
  function setCoins(v){
    localStorage.setItem(COIN_KEY, String(Math.max(0, v|0)))
  }
  function addCoins(delta){
    if (!delta) return;
    setCoins(getCoins() + (delta|0));
  }

  // Локальный лог последнего приза (чтобы подсветить «Последний приз»)
  const PRIZE_KEY = 'beer_last_prize';
  function setLastPrize(label){
    try{
      localStorage.setItem(PRIZE_KEY, label || '');
    }catch(_){}
  }

  // ===== Ключи прохождения =====
  const UID = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.id) || 'anon';
  const QUIZ_ID = 'beer_profile_quiz_v1';
  const LAST_KEY = `${QUIZ_ID}_last_finish_${UID}`;
  const BDAY_KEY = `${QUIZ_ID}_bday_${UID}`;

  // сейчас getLast / setLast используются только как мягкий кэш,
  // но НЕ решают, пускать ли в квиз (это делает только S.completed из GAS)
  const getLast = () => +(localStorage.getItem(LAST_KEY) || 0);
  const setLast = (ts = Date.now()) => localStorage.setItem(LAST_KEY, String(ts));

  // ===== Состояние квиза =====
  const S = {
    i: 0,
    canNext: false,
    score: 0,
    earned: new Array(STEPS.length).fill(false),
    profile: {},
    birthdayDay: null,
    birthdayMonth: null,
    birthdayTouched: false,
    completed: false
  };

  // решаем, пройден ли квиз, только по флагу в состоянии,
  // который ставится из profile_quiz.state / profile_quiz.finish
  const hasCompleted = () => !!S.completed;


  // ===== DOM =====
  const elBody  = () => document.getElementById('trivia-body');
  const elStart = () => document.getElementById('trivia-start');
  const elHint  = () => document.getElementById('trivia-start-hint');
  const rootCard = () => document.querySelector('[data-app-block="profile_quiz"]');

  // ===== Стили =====
  function ensureStyles(){
    if (document.getElementById('profile-quiz-styles')) return;

    const css = `
      #trivia-body{
        margin-top:12px;
      }
      .trivia-card{
        border-radius:16px;
        padding:12px 12px 14px;
        background:rgba(0,0,0,0.35);
        border:1px solid rgba(255,255,255,0.08);
      }
      .trivia-title{
        font-size:15px;
        font-weight:600;
        margin-bottom:8px;
      }
      .trivia-options{
        display:flex;
        flex-direction:column;
        gap:8px;
        margin-bottom:10px;
      }
      .trivia-option{
        display:flex;
        align-items:flex-start;
        gap:8px;
        padding:8px 10px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(0,0,0,0.25);
        cursor:pointer;
        transition:background 0.15s ease,border-color 0.15s ease,transform 0.15s ease;
      }
      .trivia-option:hover{
        border-color:rgba(255,255,255,0.35);
        transform:translateY(-1px);
      }
      .trivia-option__radio{
        width:16px;
        height:16px;
        border-radius:999px;
        border:2px solid rgba(255,255,255,0.45);
        margin-top:3px;
        flex-shrink:0;
        position:relative;
      }
      .trivia-option__radio::after{
        content:'';
        position:absolute;
        inset:3px;
        border-radius:inherit;
        background:transparent;
        transition:background 0.15s ease;
      }
      .trivia-option__label{
        font-size:14px;
        line-height:1.3;
      }
      .trivia-option.is-active{
        border-color:#FFC107;
        background:linear-gradient(135deg,rgba(255,193,7,0.18),rgba(0,0,0,0.25));
      }
      .trivia-option.is-active .trivia-option__radio::after{
        background:#FFC107;
      }

      .trivia-footer{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-top:4px;
      }
      .trivia-progress{
        font-size:12px;
        opacity:0.8;
      }
      .trivia-next{
        min-width:120px;
      }

      .trivia-start{
        display:flex;
        gap:10px;
        align-items:flex-start;
      }
      .trivia-start-icon{
        flex-shrink:0;
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
      .trivia-start__title{
        font-size:14px;
        font-weight:600;
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
        opacity:0.7;
        pointer-events:none;
        background:transparent !important;
        border:1px solid rgba(255,255,255,0.35);
        color:#aaaaaa !important;
      }

      .trivia-bday{
        margin-top:6px;
      }
      .trivia-bday-title{
        font-size:14px;
        font-weight:600;
        margin-bottom:6px;
      }
      .trivia-bday-row{
        display:flex;
        gap:8px;
      }
      .trivia-bday-field{
        flex:1 1 0;
      }
      .trivia-bday-label{
        font-size:12px;
        margin-bottom:2px;
        opacity:0.8;
      }
      .trivia-bday-input,
      .trivia-bday-select{
        width:100%;
        border-radius:10px;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(0,0,0,0.35);
        color:#fff;
        padding:6px 8px;
        font-size:14px;
      }
      .trivia-bday-hint{
        margin-top:6px;
        font-size:11px;
        opacity:0.7;
      }

      @media (max-width:480px){
        .trivia-card{
          padding:10px 10px 12px;
        }
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'profile-quiz-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // ===== Состояние из GAS (profile_quiz.state) =====
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

  // ===== Рендер стартовой строки =====
  function renderStartRow(){
    const btn  = elStart();
    const hint = elHint();
    const root = rootCard();
    if (!btn || !root) return;

    ensureStyles();

    const last = getLast();
    const completed = hasCompleted();

    // Блок с иконкой и текстом
    const container = root.querySelector('.trivia-start');
    if (!container){
      root.insertAdjacentHTML('afterbegin', `
        <div class="trivia-start">
          <div class="trivia-start-icon">
            <img src="./img/beer_passport.png" alt="">
          </div>
          <div class="trivia-start-copy">
            <div class="trivia-start__title">
              Ответь на 4 простых вопроса и получи 100 монет
            </div>
            <div id="trivia-start-hint" class="trivia-start__hint" style="display:none;"></div>
          </div>
        </div>
      `);
    }

    btn.classList.add('trivia-start-btn');

    if (completed){
      // Квиз уже пройден
      btn.disabled = true;
      btn.classList.remove('is-active');
      btn.classList.add('is-done');
      btn.textContent = 'Квиз пройден';

      if (hint){
        hint.style.display = 'block';
        hint.textContent = 'Анкету можно пройти один раз. Спасибо, что заполнил профиль 🙌';
      }
    } else {
      // Квиз ещё не проходили
      btn.disabled = false;
      btn.classList.remove('is-done');
      btn.classList.add('is-active'); // делаем кнопку оранжевой, как "Далее"
      btn.textContent = 'Начать';

      if (hint){
        hint.style.display = 'none';
        hint.textContent = '';
      }
    }
  }

  // ===== Прогресс: номер вопроса среди type="q" =====
  function getQuestionIndex(stepIndex){
    let idx = 0;
    for (let i = 0; i < STEPS.length && i <= stepIndex; i++){
      if (STEPS[i].type === 'q') idx++;
    }
    return idx;
  }

  // ===== Рендер шага-вопроса =====
  function renderQuestionStep(stepIndex){
    const body = elBody();
    if (!body) return;
    ensureStyles();

    const step = STEPS[stepIndex];
    if (!step || step.type !== 'q') return;

    const qIndex = getQuestionIndex(stepIndex);

    const optionsHtml = step.options.map((opt, idx)=>{
      const active = S.profile[step.id] === opt.value;
      return `
        <button class="trivia-option ${active ? 'is-active':''}" data-opt="${opt.value}">
          <div class="trivia-option__radio"></div>
          <div class="trivia-option__label">${opt.label}</div>
        </button>
      `;
    }).join('');

    body.innerHTML = `
      <div class="trivia-card">
        <div class="trivia-title">${step.text}</div>
        <div class="trivia-options">
          ${optionsHtml}
        </div>
        <div class="trivia-footer">
          <div class="trivia-progress">
            Вопрос ${qIndex} из ${TOTAL_QUESTIONS}
          </div>
          <button class="btn btn-primary trivia-next" disabled>Далее</button>
        </div>
      </div>
    `;

    const optButtons = Array.from(body.querySelectorAll('.trivia-option'));
    const nextBtn = body.querySelector('.trivia-next');

    function updateNextEnabled(){
      const hasValue = !!S.profile[step.id];
      S.canNext = hasValue;
      if (nextBtn) nextBtn.disabled = !hasValue;
    }

    optButtons.forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-opt');
        S.profile[step.id] = val;
        S.earned[stepIndex] = true;

        optButtons.forEach(b=>b.classList.remove('is-active'));
        btn.classList.add('is-active');

        haptic('light');
        updateNextEnabled();
      });
    });

    if (nextBtn){
      nextBtn.addEventListener('click', ()=>{
        if (!S.canNext) return;
        haptic('medium');

        S.score += step.coins || 0;

        goNextStep();
      });
    }

    updateNextEnabled();
  }

  // ===== Колёсики для выбора дня/месяца =====
  function createWheel(container, kind){
    const max = kind === 'day' ? 31 : 12;
    const values = [];
    for (let i=1;i<=max;i++) values.push(i);

    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.alignItems = 'stretch';
    list.style.maxHeight = '160px';
    list.style.overflowY = 'auto';
    list.style.scrollSnapType = 'y mandatory';
    list.style.paddingRight = '4px';

    values.forEach((val)=>{
      const row = document.createElement('div');
      row.textContent = val;
      row.style.padding = '4px 6px';
      row.style.fontSize = '14px';
      row.style.borderRadius = '8px';
      row.style.marginBottom = '2px';
      row.style.scrollSnapAlign = 'start';
      row.dataset.value = String(val);
      list.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(list);

    let current = kind === 'day' ? (S.birthdayDay || 1) : (S.birthdayMonth || 1);
    if (current < 1 || current > max) current = 1;

    function applyHighlight(){
      Array.from(list.children).forEach((row)=>{
        const isActive = Number(row.dataset.value) === current;
        row.style.background = isActive ? 'rgba(255,193,7,0.25)' : 'transparent';
      });
    }

    function centerOn(val, opts){
      const rows = Array.from(list.children);
      const target = rows.find(r => Number(r.dataset.value) === val);
      if (!target) return;
      const top = target.offsetTop - 40;
      list.scrollTo({top, behavior: opts && opts.smooth === false ? 'auto' : 'smooth'});
    }

    list.addEventListener('scroll', ()=>{
      const rows = Array.from(list.children);
      let best = current;
      let bestDiff = Infinity;
      const mid = list.scrollTop + list.clientHeight/2;
      rows.forEach((row)=>{
        const center = row.offsetTop + row.clientHeight/2;
        const diff = Math.abs(center - mid);
        if (diff < bestDiff){
          bestDiff = diff;
          best = Number(row.dataset.value);
        }
      });
      if (best !== current){
        current = best;
        applyHighlight();
      }
    });

    list.addEventListener('click', (e)=>{
      const row = e.target.closest('[data-value]');
      if (!row) return;
      current = Number(row.dataset.value);
      applyHighlight();
      centerOn(current);
      if (kind === 'day'){
        S.birthdayDay = current;
      }else{
        S.birthdayMonth = current;
      }
      S.birthdayTouched = true;
      haptic('light');
    });

    current = current;
    applyHighlight();
    centerOn(current, {silent:true, smooth:false});

    return {
      get value(){
        return current;
      }
    };
  }

  function renderBirthdayStep(stepIndex){
    const body = elBody(); if (!body) return;
    ensureStyles();

    const saved = (()=>{ try{ return localStorage.getItem(BDAY_KEY); }catch(_){ return null; } })();
    if (saved && !S.birthdayTouched && !S.birthdayDay && !S.birthdayMonth){
      const parts = saved.split('-');
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (d >= 1 && d <= 31) S.birthdayDay = d;
      if (m >= 1 && m <= 12) S.birthdayMonth = m;
    }

    const score = S.score || 0;

    body.innerHTML = `
      <div class="trivia-card">
        <div class="trivia-bday">
          <div class="trivia-bday-title">${STEPS[stepIndex].text}</div>
          <div class="trivia-bday-row">
            <div class="trivia-bday-field">
              <div class="trivia-bday-label">День</div>
              <div id="bday-day-wheel"></div>
            </div>
            <div class="trivia-bday-field">
              <div class="trivia-bday-label">Месяц</div>
              <div id="bday-month-wheel"></div>
            </div>
          </div>
          <div class="trivia-bday-hint">
            Мы не спрашиваем год и никому не передаём дату. Это нужно только, чтобы вовремя радовать тебя бонусами.
          </div>
        </div>
        <div class="trivia-footer" style="margin-top:10px;">
          <div class="trivia-progress">
            За прохождение анкеты ты получишь <b>${score + 50}</b> монет
          </div>
          <button class="btn btn-primary trivia-next">Сохранить</button>
        </div>
      </div>
    `;

    const dayWrap   = body.querySelector('#bday-day-wheel');
    const monthWrap = body.querySelector('#bday-month-wheel');
    const nextBtn   = body.querySelector('.trivia-next');

    const dayWheel   = createWheel(dayWrap,'day');
    const monthWheel = createWheel(monthWrap,'month');

    function syncFromWheels(){
      S.birthdayDay   = dayWheel.value;
      S.birthdayMonth = monthWheel.value;
      S.birthdayTouched = true;
    }

    syncFromWheels();

    if (nextBtn){
      nextBtn.addEventListener('click', ()=>{
        syncFromWheels();
        if (!S.birthdayDay || !S.birthdayMonth){
          haptic('light');
          return;
        }
        haptic('medium');

        S.score += 50;

        try{
          localStorage.setItem(BDAY_KEY, `${S.birthdayDay}-${S.birthdayMonth}`);
        }catch(_){}

        try{
          addCoins(S.score);
          setLastPrize(`Паспорт вкуса: +${S.score} монет`);
        }catch(_){}

        try{
          sendProfileQuizFinishToServer();
        }catch(_){}

        finishQuiz();
        return;
      });
    }
  }

  // ===== Переход вперёд =====
  function goNextStep(){
    const nextIndex = S.i + 1;
    if (nextIndex >= STEPS.length){
      finishQuiz();
      return;
    }
    S.i = nextIndex;

    const step = STEPS[S.i];
    if (step.type === 'q'){
      renderQuestionStep(S.i);
    }else if (step.type === 'birthday'){
      renderBirthdayStep(S.i);
    }
  }

  // ===== Отправка результата квиза в GAS =====
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

  // ===== Завершение квиза (UI) =====
  function finishQuiz(){
    const body = elBody();
    if (!body) return;

    ensureStyles();

    body.innerHTML = `
      <div class="trivia-card">
        <div class="trivia-title">Готово! 🎉</div>
        <p style="margin-top:4px;font-size:14px;opacity:0.9;">
          Мы сохранили твой «паспорт вкуса» и дату рождения. Монеты уже на счёте — загляни в профиль.
        </p>
      </div>
    `;

    renderStartRow();
  }

  // ===== Обработчик клика по "Начать" =====
  function bindStartButton(){
    const btn = elStart();
    if (!btn) return;
    btn.addEventListener('click', ()=>{
      if (hasCompleted()) return;
      haptic('light');

      S.i = 0;
      S.canNext = false;
      S.score = 0;
      S.earned = new Array(STEPS.length).fill(false);
      S.profile = {};
      S.birthdayTouched = false;

      renderQuestionStep(0);
    });
  }

  // ===== Монтаж при появлении в шторке =====
  function mountIfReady(){
    const body = elBody(), start = elStart();
    if (body && start){
      ensureStyles();
      renderStartRow();
      body.innerHTML = '';

      // пробуем подтянуть состояние квиза/ДР с сервера
      fetchProfileQuizStateFromServer();

      bindStartButton();
      return true;
    }
    return false;
  }

  if (!mountIfReady()){
    const mo = new MutationObserver(()=>{ if (mountIfReady()) mo.disconnect(); });
    mo.observe(document.body, {childList:true, subtree:true});
  }

  // экспорт, если нужно дернуть вручную
  window.resetProfileQuizState = function(){
    S.i = 0;
    S.canNext = false;
    S.score = 0;
    S.earned = new Array(STEPS.length).fill(false);
    S.profile = {};
    S.birthdayTouched = false;

    // синхронизируем кнопку
    renderStartRow();

    // и ещё раз стучимся в GAS, чтобы узнать статус и ДР
    fetchProfileQuizStateFromServer();
  };

})();
