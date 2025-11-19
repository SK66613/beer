(function(){
  'use strict';

  // === Константы квиза ===
  const QUIZ_ID = 'beer_profile_quiz_v1';
  const UID = (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) || 'anon';
  const LAST_KEY = `${QUIZ_ID}_last_finish_${UID}`;
  const BDAY_KEY = `${QUIZ_ID}_bday_${UID}`;

  const STEPS = [
    { id:'scene', text:'Представь кадр из фильма: ты заходишь в бар. Какая сцена про тебя?', coins:10,
      options:[
        {value:'solo',label:'Один заходит, садится у стойки и просто выдыхает'},
        {value:'small_team',label:'Пара друзей: «ну что, как неделя?»'},
        {value:'party',label:'Шумная компания, смех, шутки бармену'},
        {value:'cowork',label:'С ноутом — это мой офис на вечер'}
      ]},
    { id:'company', text:'С кем чаще всего заходишь?', coins:10,
      options:[
        {value:'solo',label:'Часто один'},
        {value:'duo',label:'С одним-двумя близкими'},
        {value:'squad',label:'С компанией'},
        {value:'mix',label:'Как пойдёт'}
      ]},
    { id:'first_order', text:'Что заказываешь первым делом?', coins:15,
      options:[
        {value:'beer',label:'Сразу пиво'},
        {value:'check',label:'Спрашиваю, что сегодня интересного'},
        {value:'taster',label:'Прошу попробовать пару вариантов'},
        {value:'other',label:'Иногда сидр или коктейль'}
      ]},
    { id:'role', text:'Какую роль берёшь за столом?', coins:15,
      options:[
        {value:'story',label:'Рассказчик'},
        {value:'listener',label:'Слушатель'},
        {value:'leader',label:'Организатор'},
        {value:'observer',label:'Наблюдатель'}
      ]},
    { id:'birthday', text:'Укажи день и месяц рождения — чтобы получать персональные подарки 🎁', coins:50, type:'birthday' }
  ];

  // === Состояние ===
  const S = {i:0, score:0, profile:{}, completed:false, birthdayDay:null, birthdayMonth:null};

  const getLast = ()=>+localStorage.getItem(LAST_KEY)||0;
  const setLast = ts=>localStorage.setItem(LAST_KEY,String(ts||Date.now()));

  const hasCompleted = ()=> S.completed || !!getLast();

  // === Рендер стартовой кнопки ===
  function renderStart(){
    const btn=document.getElementById('trivia-start');
    const hint=document.getElementById('trivia-start-hint');
    if(!btn) return;
    if(hasCompleted()){
      btn.textContent='Квиз пройден';
      btn.disabled=true;
      hint.style.display='block';
      hint.textContent='Можно пройти только один раз 🙌';
    }else{
      btn.textContent='Начать';
      btn.disabled=false;
      hint.style.display='none';
    }
  }

  // === Получение состояния с сервера ===
  async function fetchState(){
    if(typeof window.api!=='function') return;
    try{
      const res=await window.api('profile_quiz.state',{quiz_id:QUIZ_ID});
      console.log('[quiz.state]',res);
      if(res?.ok){
        const done=res.status==='completed'||res.completed||res.done;
        if(done){S.completed=true;setLast();}
        S.birthdayDay=Number(res.bday_day)||null;
        S.birthdayMonth=Number(res.bday_month)||null;
      }
    }catch(e){console.warn(e);}
    renderStart();
  }

  // === Отправка финала ===
  async function sendFinish(){
    if(typeof window.api!=='function'){setLast();return;}
    try{
      const data={quiz_id:QUIZ_ID,score:S.score,bday_day:S.birthdayDay,bday_month:S.birthdayMonth,profile:S.profile};
      const res=await window.api('profile_quiz.finish',data);
      console.log('[quiz.finish]',res);
      if(res?.ok){S.completed=true;setLast();}
    }catch(e){console.error(e);}
  }

  // === Вопрос ===
  function renderQuestion(idx){
    const st=STEPS[idx]; const body=document.getElementById('trivia-body');
    if(!body) return;
    const opts=st.options.map(o=>`
      <button class="trivia-opt" data-val="${o.value}">${o.label}</button>`).join('');
    body.innerHTML=`
      <div class="trivia-card">
        <div class="trivia-title">${st.text}</div>
        <div class="trivia-opts">${opts}</div>
      </div>`;
    body.querySelectorAll('.trivia-opt').forEach(b=>{
      b.onclick=()=>{S.profile[st.id]=b.dataset.val;S.score+=st.coins;nextStep();}
    });
  }

  // === Колёсики (бесконечные) ===
  function createInfiniteWheel(container,kind,max){
    const total=max;
    const loopCount=5; // повторяем значения для эффекта кольца
    const values=[];for(let l=0;l<loopCount;l++)for(let i=1;i<=total;i++)values.push(i);
    container.innerHTML='';
    const list=document.createElement('div');
    list.className='wheel-list';
    list.style.overflowY='auto';list.style.maxHeight='160px';
    values.forEach(v=>{
      const r=document.createElement('div');
      r.textContent=v;
      r.className='wheel-row';
      list.appendChild(r);
    });
    container.appendChild(list);

    let cur=(kind==='day'?S.birthdayDay:S.birthdayMonth)||1;
    let offset=(loopCount/2|0)*total+cur-1;
    list.scrollTop=offset*26;

    list.addEventListener('scroll',()=>{
      const pos=Math.round(list.scrollTop/26);
      const val=(pos%total)+1;
      cur=val;
      if(list.scrollTop<26*total) list.scrollTop+=26*total*(loopCount-2);
      if(list.scrollTop>26*total*(loopCount-1)) list.scrollTop-=26*total*(loopCount-2);
    });
    return ()=>cur;
  }

  // === День рождения ===
  function renderBirthday(){
    const body=document.getElementById('trivia-body');
    body.innerHTML=`
      <div class="trivia-card">
        <div class="trivia-title">${STEPS.at(-1).text}</div>
        <div class="trivia-bday">
          <div class="wheel-wrap"><div id="w-day"></div><div class="label">День</div></div>
          <div class="wheel-wrap"><div id="w-month"></div><div class="label">Месяц</div></div>
        </div>
        <button id="save-bday" class="btn btn-primary" style="margin-top:10px;">Сохранить</button>
      </div>`;
    const getDay=createInfiniteWheel(document.getElementById('w-day'),'day',31);
    const getMon=createInfiniteWheel(document.getElementById('w-month'),'month',12);
    document.getElementById('save-bday').onclick=()=>{
      S.birthdayDay=getDay();
      S.birthdayMonth=getMon();
      finishQuiz();
    };
  }

  // === Навигация ===
  function nextStep(){
    S.i++;
    if(S.i>=STEPS.length){finishQuiz();return;}
    const st=STEPS[S.i];
    if(st.type==='birthday')renderBirthday();else renderQuestion(S.i);
  }

  // === Завершение ===
  async function finishQuiz(){
    S.completed=true;
    renderDone();
    await sendFinish();
  }

  function renderDone(){
    const body=document.getElementById('trivia-body');
    body.innerHTML=`
      <div class="trivia-card">
        <div class="trivia-title">Готово! 🎉</div>
        <p>Твой профиль сохранён, монеты начислены!</p>
      </div>`;
    renderStart();
  }

  // === Монтаж ===
  function mountTrivia(){
    renderStart();
    fetchState();
    const btn=document.getElementById('trivia-start');
    if(btn){
      btn.onclick=()=>{
        if(hasCompleted())return;
        S.i=0;S.score=0;S.profile={};
        renderQuestion(0);
      };
    }
  }
  window.mountTrivia=mountTrivia;

  // === Интеграция со шторкой ===
  const _openSheet=window.openSheet;
  window.openSheet=function(opts){
    _openSheet&&_openSheet(opts);
    const title=(opts&&opts.title)||'';
    if(/викторин/i.test(title)) mountTrivia();
  };

})();
