// === 1:1 extracted from REF_index_refs_clean.html ===
function initSheet(title){
  if (/паспорт/i.test(title)) {
    // при открытии шторки всегда красим из актуального источника:
    // 1) свежий серверный state, 2) локальный кэш (v1 или legacy)
    let st = window.MiniState || {}

function openSheet({title='', html='', from='bottom'} = {}){
      if (!sheetRoot) return;
      sheetRoot.classList.toggle('sheet-bottom', from==='bottom');
      if (sheetTitle) sheetTitle.textContent = title || '';
      if (sheetBody && html != null) sheetBody.innerHTML = html;
      sheetRoot.classList.add('is-open'); document.body.classList.add('sheet-open');
      
try{
  var __st = (window.MiniState || (window.SWR && SWR.get()) || {}

function closeSheet(){ if (!sheetRoot) return; sheetRoot.classList.remove('is-open'); document.body.classList.remove('sheet-open'); 
try{ var __st = (window.MiniState||(window.SWR&&SWR.get())||{}
