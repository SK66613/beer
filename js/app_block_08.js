// ===== PROFILE QUIZ (via window.api) =====
(function () {
  'use strict';

  // ---- IDs / cache ----
  const QUIZ_ID  = 'beer_profile_quiz_v1';
  const UID      = (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) || 'anon';
  const LAST_KEY = `${QUIZ_ID}_last_finish_${UID}`;
  const BDAY_KEY = `${QUIZ_ID}_bday_${UID}`;

  // ---- steps (сокращённо: 4 Q + ДР) ----
  const STEPS = [
    { id:'scene',  text:'Представь кадр из фильма: ты заходишь в бар. Какая сцена про тебя?', coins:10,
      options:[
        {value:'solo',label:'Один заходит и выдыхает у стойки'},
        {value:'small_team',label:'Пара друзей: «ну что, как неделя?»'},
        {value:'party',label:'Шумная компания, шутки бармену'},
        {value:'cowork',label:'С ноутом — офис на вечер'}
      ]
    },
    { id:'company', text:'С кем чаще всего заходишь?', coins:10,
      options:[
        {value:'solo',label:'Часто один'},
        {value:'duo',label:'С одним-двумя'},
        {value:'squad',label:'С компанией'},
        {value:'mix',label:'Как пойдёт'}
      ]
    },
    { id:'first_order', text:'Что заказываешь первым делом?', coins:15,
      options:[
        {value:'beer',label:'Сразу пиво'},
        {value:'check',label:'Спрашиваю, что сегодня интересного'},
        {value:'taster',label:'Пробую пару вариантов'},
        {value:'other',label:'Иногда сидр/коктейль'}
      ]
    },
    { id:'role', text:'Какую роль берёшь за столом?', coins:15,
      options:[
        {value:'story',label:'Рассказчик'},
        {value:'listener',label:'Слушатель'},
        {value:'leader',label:'Организатор'},
        {value:'observer',label:'Наблюдатель'}
      ]
    },
    { id:'birthday', type:'birthday', text:'Укажи день и месяц рождения — чтобы прилетали персональные подарки 🎁', coins:50 }
  ];

  // ---- state ----
  const S = { i:0, score:0, profile:{}, completed:false, birthdayDay:null, birthdayMonth:null };

  // ---- cache helpers ----
  const getLast = () => +localStorage.getItem(LAST_KEY) || 0;
  const setLast = (ts) => localStorage.setItem(LAST_KEY, String(ts || Date.now()));
  const saveBDay = (d,m) => { try{ localStorage.setItem(BDAY_KEY, `${d}-${m}`); }catch(_){} };
  const loadBDay = () => {
    try{
      const s = localStorage.getItem(BDAY_KEY);
      if(!s) return null;
      const [d,m] = s.split('-').map(n=>+n||null);
      return {d,m};
    }catch(_){ return null; }
  };

  // ---- DOM getters (точно под твой index.html) ----
  const elStartWrap  = ()=> document.getElementById('trivia-start');         // div
  const elStartBtn   = ()=> elStartWrap()?.querySelector('[data-action="trivia-start"]'); // button
  const elStartHint  = ()=> document.getElementById('trivia-start-hint');    // span
  const elBody       = ()=> document.getElementById('trivia-body');          // content box
  const elRootCard   = ()=> elBody()?.closest('.trivia-card');

  // ---- styles (минимально, без ломания каркаса) ----
  function ensureStyles(){
    if (document.getElementById('pq-styles')) return;
    const css = `
      .trivia-card .pq-progress{height:4px;background:rgba(255,255,255,.1);border-radius:6px;overflow:hidden;margin:8px 0 6px}
      .trivia-card .pq-progress > i{display:block;height:100%;width:0;background:#ff9800}
      .trivia-card .pq-sub{opacity:.8;font-size:12px;margin:4px 0}
      .trivia-card .pq-opts{display:flex;flex-direction:column;gap:8px;margin-top:8px}
      .trivia-card .pq-opt{border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:10px 12px;cursor:pointer;background:rgba(0,0,0,.2)}
      .trivia-card .pq-opt.is-sel{border-color:#ff9800;background:linear-gradient(135deg,rgba(255,152,0,.25),rgba(255,255,255,.02))}
      .trivia-card .pq-cta{margin-top:10px;display:flex;justify-content:flex-end}
      .trivia-card .pq-cta .btn[disabled]{opacity:.5;pointer-events:none}
      /* birthday wheels */
      .trivia-card .pq-wheels{display:flex;gap:16px;justify-content:center;margin:14px 0 8px}
      .trivia-card .pq-wheel{position:relative;width:120px;max-width:46vw}
      .trivia-card .pq-wheel .pq-scroll{max-height:160px;overflow-y:auto;scrollbar-width:none;-ms-overflow-style:none;padding:18px 0}
      .trivia-card .pq-wheel .pq-scroll::-webkit-scrollbar{display:none}
      .trivia-card .pq-row{height:26px;display:flex;align-items:center;justify-content:center}
      .trivia-card .pq-hl{position:absolute;left:6px;right:6px;top:50%;height:26px;transform:translateY(-50%);border:1px dashed rgba(255,255,255,.35);border-radius:8px;pointer-events:none}
      .trivia-card .pq-lab{margin-top:6px;text-align:center;opacity:.8;font-size:12px}
    `;
    const style = document.createElement('style');
    style.id = 'pq-styles'; style.textContent = css;
    document.head.appendChild(style);
  }

  // ---- start row ----
  function renderStart(){
    const wrap = elStartWrap(); if(!wrap) return;
    const btn  = elStartBtn();  if(!btn) return;
    const hint = elStartHint();
    ensureStyles();

    if (hasCompleted()){
      btn.disabled = true;
      btn.textContent = 'Квиз пройден';
      hint && (hint.style.display='block', hint.textContent='Можно пройти только один раз 🙌');
    } else {
      btn.disabled = false;
      btn.textContent = 'Начать';
      hint && (hint.style.display='none', hint.textContent='');
    }
  }

  // ---- completed flag: устойчиво ----
  const hasCompleted = () => !!S.completed || !!getLast();

  // ---- server: state ----
  async function fetchState(){
    if (typeof window.api !== 'function'){ renderStart(); return; }
    try{
      const res = await window.api('profile_quiz.state', { quiz_id: QUIZ_ID });
      console.log('[quiz.state]', res);
      if(res?.ok){
        const done = res.status==='completed' || res.completed === true || res.done === true ||
                     res.bday_day != null || res.bday_month != null;
        if (done){ S.completed = true; setLast(); }

        const d = +res.bday_day   || null;
        const m = +res.bday_month || null;
        if (d && d>=1 && d<=31) S.birthdayDay = d;
        if (m && m>=1 && m<=12) S.birthdayMonth = m;
      }
    }catch(e){ console.warn('[quiz.state] error', e); }
    renderStart();
  }

  // ---- server: finish ----
  async function sendFinish(){
    if (typeof window.api !== 'function'){ setLast(); return; }
    try{
      const res = await window.api('profile_quiz.finish', {
        quiz_id: QUIZ_ID,
        score: S.score,
        bday_day: S.birthdayDay,
        bday_month: S.birthdayMonth,
        profile: S.profile
      });
      console.log('[quiz.finish]', res);
      if (res?.ok) { S.completed = true; setLast(); }
      // применим свежий стейт, если у тебя есть общий апдейтер
      if (res?.fresh_state && typeof window.applyServerState==='function'){
        window.applyServerState(res.fresh_state);
      } else if (typeof window.syncCoinsUI==='function'){
        window.syncCoinsUI();
      }
    }catch(e){ console.error('[quiz.finish] error', e); }
  }

  // ---- render question ----
  function renderQuestion(step){
    const box = elBody(); if(!box) return; ensureStyles();

    const iQ  = STEPS.slice(0, S.i+1).filter(s=>s.type!=='birthday').length;
    const tQ  = STEPS.filter(s=>s.type!=='birthday').length;
    const pct = Math.round(((iQ-1)/Math.max(1,tQ))*100);

    const opts = (step.options||[]).map(o=>(
      `<button class="pq-opt" data-val="${o.value}">${o.label}</button>`
    )).join('');

    box.innerHTML = `
      <div class="pq-progress"><i style="width:${pct}%"></i></div>
      <div class="pq-sub">Вопрос на ${step.coins} монет</div>
      <p>${step.text}</p>
      <div class="pq-opts">${opts}</div>
      <div class="pq-cta"><button class="btn btn-primary" id="pq-next" disabled>Далее</button></div>
    `;

    const next = box.querySelector('#pq-next');
    box.querySelectorAll('.pq-opt').forEach(btn=>{
      btn.onclick = ()=>{
        box.querySelectorAll('.pq-opt').forEach(b=>b.classList.remove('is-sel'));
        btn.classList.add('is-sel');
        S.profile[step.id] = btn.dataset.val;
        next.disabled = false;
      };
    });
    next.onclick = ()=>{
      S.score += step.coins || 0;
      nextStep();
    };
  }

  // ---- infinite wheel (бесконечная прокрутка) ----
  function createInfiniteWheel(container, total, initial){
    const loops = 7;                 // сколько раз повторяем 1..N
    const rows  = [];
    for(let k=0;k<loops;k++){
      for(let v=1; v<=total; v++){
        const row = document.createElement('div');
        row.className = 'pq-row';
        row.textContent = v;
        row.dataset.v = String(v);
        rows.push(row);
      }
    }
    const scroll = document.createElement('div');
    scroll.className = 'pq-scroll';
    rows.forEach(r=>scroll.appendChild(r));
    container.innerHTML = '';
    container.appendChild(scroll);

    const rowH = 26; // синхронно с CSS
    // ставим «центр»
    const middleLoop = Math.floor(loops/2);
    const startIndex = middleLoop*total + ((initial && initial>=1 && initial<=total)? (initial-1) : 0);
    scroll.scrollTop = startIndex * rowH;

    // текущее значение по scrollTop
    const getVal = ()=>{
      const idx = Math.round(scroll.scrollTop/rowH) % total;
      return idx + 1;
    };

    // петля: перекидываем к центру, когда подходим к краям
    scroll.addEventListener('scroll', ()=>{
      const maxTop = (loops*total-1) * rowH;
      if (scroll.scrollTop < total*rowH) {
        scroll.scrollTop += total*rowH*(loops-2);
      } else if (scroll.scrollTop > maxTop - total*rowH) {
        scroll.scrollTop -= total*rowH*(loops-2);
      }
    });

    // клики по строкам — центрируем
    scroll.addEventListener('click', (e)=>{
      const row = e.target.closest('.pq-row'); if(!row) return;
      const curTop = scroll.scrollTop;
      const curIdx = Math.round(curTop/rowH);
      const want   = Number(row.dataset.v);
      // сдвинем к ближайшему такому же «want» поблизости
      const curVal = (curIdx % total) + 1;
      let delta = want - curVal;
      // ограничим шаг, чтобы был «рядом»
      if (delta > total/2) delta -= total;
      if (delta < -total/2) delta += total;
      scroll.scrollTo({ top: curTop + delta*rowH, behavior:'smooth' });
    });

    return { get value(){ return getVal(); } };
  }

  // ---- render birthday step ----
  function renderBirthday(){
    const box = elBody(); if(!box) return; ensureStyles();

    // локальный фолбэк даты
    if (S.birthdayDay==null || S.birthdayMonth==null){
      const saved = loadBDay();
      if (saved){ S.birthdayDay = saved.d; S.birthdayMonth = saved.m; }
    }

    box.innerHTML = `
      <p>${STEPS[STEPS.length-1].text}</p>
      <div class="pq-wheels">
        <div class="pq-wheel">
          <div class="pq-hl"></div>
          <div id="pq-day"></div>
          <div class="pq-lab">День</div>
        </div>
        <div class="pq-wheel">
          <div class="pq-hl"></div>
          <div id="pq-mon"></div>
          <div class="pq-lab">Месяц</div>
        </div>
      </div>
      <div class="pq-cta"><button class="btn btn-primary" id="pq-save">Сохранить</button></div>
    `;

    const dayWheel = createInfiniteWheel(document.getElementById('pq-day'), 31, S.birthdayDay||1);
    const monWheel = createInfiniteWheel(document.getElementById('pq-mon'), 12, S.birthdayMonth||1);

    document.getElementById('pq-save').onclick = ()=>{
      S.birthdayDay   = dayWheel.value;
      S.birthdayMonth = monWheel.value;
      saveBDay(S.birthdayDay, S.birthdayMonth);
      S.score += (STEPS.find(s=>s.type==='birthday')?.coins||0);
      finishQuiz();
    };
  }

  // ---- navigation ----
  function nextStep(){
    S.i++;
    const step = STEPS[S.i];
    if (!step) { finishQuiz(); return; }
    if (step.type==='birthday') renderBirthday();
    else renderQuestion(step);
  }

  // ---- start flow ----
  function startQuiz(){
    const step = STEPS[0];
    S.i=0; S.score=0; S.profile={}; // reset
    if (step.type==='birthday') renderBirthday();
    else renderQuestion(step);
  }

  async function finishQuiz(){
    S.completed = true;
    setLast();
    // UI
    const box = elBody(); if (box) {
      box.innerHTML = `
        <div class="pq-sub">Готово! 🎉</div>
        <p>Мы сохранили «паспорт вкуса» и дату. Монеты уже на счёте.</p>
      `;
    }
    renderStart();
    await sendFinish();
  }

  // ---- mount trivia on sheet open ----
  function mountTrivia(){
    ensureStyles();
    renderStart();
    fetchState(); // подтянуть признак completed + дату с бэка

    // прямой клик по кнопке «Начать»
    const btn = elStartBtn();
    if (btn){
      btn.onclick = ()=>{
        if (hasCompleted()) return;
        startQuiz();
      };
    }
  }
  window.mountTrivia = mountTrivia;

  // открытие шторки: добавляем вызов mountTrivia при title ~ "Викторина"
  const __openSheet = window.openSheet;
  window.openSheet = function(opts){
    __openSheet && __openSheet(opts);
    const title = (opts && opts.title) || '';
    if (/викторин/i.test(title)) mountTrivia();
  };

  // Доп. делегирование (на случай динамики)
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest?.('[data-action="trivia-start"]');
    if (btn){
      e.preventDefault();
      if (hasCompleted()) return;
      startQuiz();
    }
  });

})();
