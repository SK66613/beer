// === 1:1 extracted from REF_index_refs_clean.html ===
function initRef(){
  const TG = window.Telegram && window.Telegram.WebApp;
  const uid = TG && TG.initDataUnsafe && TG.initDataUnsafe.user && TG.initDataUnsafe.user.id
    ? String(TG.initDataUnsafe.user.id).trim()
    : "";

  // бот из конфигурации или жёстко наш
  const rawBot = (window.APP && (APP.BOT_USERNAME || APP.BOT)) || "CineCraft_robot";
  const bot = String(rawBot).replace(/^@/, ""); // убираем @ на всякий

  // мини-апп диплинк (НЕ bot ?start=)
  const link = uid
    ? `https://t.me/${bot}
