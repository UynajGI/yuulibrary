document$.subscribe(() => {
  setTimeout(() => {
    const elements = document.getElementsByClassName("pseudocode");
    for (let i = 0; i < elements.length; i++) {
      if (typeof pseudocode !== 'undefined') {
        pseudocode.renderElement(elements[i], { lineNumber: false });
      }
    }
  }, 300);
});
