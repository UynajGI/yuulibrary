MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]]
  }
};

document$.subscribe(() => {
  MathJax.typesetPromise();
});
