(function(){
  if (window.__REFS_HOOK_MIN__) return; window.__REFS_HOOK_MIN__ = true;
  function applyRefsFromState(s){
    try{
      var refs = (s && (s.ref_total!=null ? s.ref_total : s.ref_count));
      if (refs == null){
        try{
          var raw = localStorage.getItem('beer_refs_v1');
          if (raw){ var arr = JSON.parse(raw); refs = Array.isArray(arr) ? arr.length : 0; }
        }catch(_){}
      }
      if (refs == null){
        try{ refs = +(localStorage.getItem('beer_refs_total')||'0'); }catch(_){}
      }
      refs = Number(refs||0);
      var el = document.getElementById('pf-refs-count');
      if (el) el.textContent = String(refs);
      try{ localStorage.setItem('beer_refs_total', String(refs)); }catch(_){}
    }catch(_){}
  }
  // hook both state appliers
  var _a = window.applyServerState;
  window.applyServerState = function(s){ try{ _a && _a(s); } finally { applyRefsFromState(s); } };
  var _b = window.applyIfNew;
  window.applyIfNew = function(s){ try{ _b && _b(s); } finally { applyRefsFromState(s); } };
  // paint from cache on boot
  try{
    var cached = +(localStorage.getItem('beer_refs_total')||'0');
    var el = document.getElementById('pf-refs-count');
    if (el && cached) el.textContent = String(cached);
  }catch(_){}
})();