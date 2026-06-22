document$.subscribe(() => {
  setTimeout(() => {
    if (typeof pseudocode === 'undefined') return;
    document.querySelectorAll('.pseudocode').forEach(el => {
      try {
        pseudocode.renderElement(el, { lineNumber: false });
      } catch (e) {
        console.error('pseudocode error:', e, el);
      }
    });
  }, 600);
});
