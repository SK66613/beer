// PATCH: click on stamp card -> collect (case-insensitive code)
document.addEventListener('click', async function(e){
  var card = e.target.closest('#passport-grid .pslot');
  if (!card) return;
  var code = String(card.getAttribute('data-code')||'').trim();
  if (!code) return;
  try {
    await (window.api ? window.api('style.collect', { style_id: code.toLowerCase(), status:'collected' }) : Promise.resolve());
  } catch(_) {}
}, { passive:true });