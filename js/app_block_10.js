// Открыть шторку «Последние призы» и подлить содержимое из профиля
  window.openLastPrizesSheet = function(){
    const tpl  = document.getElementById('tpl-lastpriz');
    const html = tpl ? tpl.innerHTML : '<div class="card"><div class="h1">Последние призы</div><div id="pf-prizes-sheet"></div></div>';

    window.openSheet({ title: 'Последние призы', html, from: 'bottom' });

    // Бережно копируем готовый список призов из профиля
    const src = document.getElementById('pf-prizes');
    const dst = document.getElementById('pf-prizes-sheet');
    if (src && dst) dst.innerHTML = src.innerHTML;
  };