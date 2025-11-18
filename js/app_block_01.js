// === KV-first: in-memory localStorage shim (no persistent cache) ===
(function(){
  try{
    const mem = new Map();
    const real = window.localStorage;
    const passthrough = new Set(["beer_state_v2", "beer_coins", "bonus_log_v1", "beer_rewards", "beer_passport", "beer_passport_v1", "leaderboard_cache", "beer_profile_cache_v1", "flappy_best", "beer_refs_v1", "beer_profile_cache_v1", "flappy_best", "beer_refs_v1"]); // add keys if you need persistence

    const _set = real.setItem.bind(real);
    const _get = real.getItem.bind(real);
    const _rem = real.removeItem.bind(real);
    const _clr = real.clear.bind(real);

    Object.defineProperties(window.localStorage, {
      setItem: { value: function(k,v){ if (passthrough.has(k)) return _set(k,v); mem.set(String(k), String(v)); } },
      getItem: { value: function(k){ if (passthrough.has(k)) return _get(k); return mem.has(String(k)) ? mem.get(String(k)) : null; } },
      removeItem: { value: function(k){ mem.delete(String(k)); if (passthrough.has(k)) _rem(k); } },
      clear: { value: function(){ mem.clear(); if (passthrough.size>0) _clr(); } }
    });
  }catch(_){}
})();

    // ====== ЛЁГКАЯ DEV-ПАНЕЛЬ СВЕРХУ ======
(function () {
  if (window.__TG_DEBUG_PANEL__) return; // чтобы не создалась дважды
  window.__TG_DEBUG_PANEL__ = true;

  let panel, inner;

  function ensurePanel() {
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.position = 'fixed';
    panel.style.left = '0';
    panel.style.top = '0';          // 🔥 панель сверху
    panel.style.bottom = '';        // ничего не прижимаем к низу
    panel.style.width = '100%';
    panel.style.maxHeight = '40%';
    panel.style.overflowY = 'auto';
    panel.style.fontSize = '11px';
    panel.style.fontFamily = 'monospace';
    panel.style.background = 'rgba(0,0,0,.85)';
    panel.style.color = '#0f0';
    panel.style.zIndex = '999999';
    panel.style.padding = '4px 6px';
    panel.style.boxSizing = 'border-box';
    panel.style.whiteSpace = 'pre-wrap';
    panel.style.wordBreak = 'break-word';

    inner = document.createElement('div');
    inner.textContent = '[debug] панель логов (тапни, чтобы скрыть)';
    panel.appendChild(inner);

    panel.addEventListener('click', () => {
      // по тапу просто скрываем/показываем
      if (panel.style.opacity === '0') {
        panel.style.opacity = '1';
        panel.style.pointerEvents = 'auto';
      } else {
        panel.style.opacity = '0';
        panel.style.pointerEvents = 'none';
      }
    });

    document.body.appendChild(panel);
    return panel;
  }

  function writeLine(text, type) {
    ensurePanel();
    const line = document.createElement('div');
    const ts = new Date().toISOString().substr(11, 8); // HH:MM:SS
    line.textContent = `[${ts}] ${text}`;

    if (type === 'err') line.style.color = '#f55';
    if (type === 'warn') line.style.color = '#ff0';

    inner.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  }

  // публичные хелперы
  window.dbg = function (...args) {
    writeLine(args.map(a => {
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch (e) { return String(a); }
    }).join(' '), 'log');
  };

  window.dbgTag = function (tag, ...args) {
    window.dbg(`[${tag}]`, ...args);
  };

  // перехватываем стандартный console.*
  const origLog = console.log;
  const origWarn = console.warn;
  const origErr = console.error;

  console.log = function (...args) {
    origLog.apply(console, args);
    writeLine(args.join(' '), 'log');
  };
  console.warn = function (...args) {
    origWarn.apply(console, args);
    writeLine(args.join(' '), 'warn');
  };
  console.error = function (...args) {
    origErr.apply(console, args);
    writeLine(args.join(' '), 'err');
  };

  // стартовое сообщение
  writeLine('Debug panel ready (tap to hide/show)', 'log');
})();
