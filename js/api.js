// === 1:1 extracted from REF_index_refs_clean.html ===
function jpost(path, body){
  return (async ()=>{
    try{
      const res = await fetch((API_BASE||'') + path, {
        method:'POST', headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
