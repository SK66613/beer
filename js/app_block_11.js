document.addEventListener('DOMContentLoaded', () => {
  const ALLOW = 'input, textarea, select, [contenteditable], .selectable, .allow-select';

  // Блокируем начало выделения за пределами разрешённых мест
  document.addEventListener('selectstart', (e) => {
    if (e.target.closest(ALLOW)) return;
    e.preventDefault();
  }, { passive:false });

  // Рубим системное меню по долгому тапу (iOS/Android)
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest(ALLOW)) return;
    e.preventDefault();
  }, { passive:false });

  // Если что-то всё же выделилось — снимаем выделение
  document.addEventListener('selectionchange', () => {
    const activeOk = document.activeElement && document.activeElement.matches(ALLOW);
    if (!activeOk) {
      const sel = window.getSelection && window.getSelection();
      if (sel && sel.rangeCount) sel.removeAllRanges();
    }
  });
});