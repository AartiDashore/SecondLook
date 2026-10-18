(function () {
  const SCORE = 55;
  const CIRCUMFERENCE = 2 * Math.PI * 52; // matches r=52 in the SVG

  const scoreEl = document.getElementById('score');
  const progress = document.getElementById('progress');
  const badge = document.getElementById('badge');
  const toast = document.getElementById('toast');

  // Label thresholds
  function labelFor(score) {
    if (score >= 80) return 'Looks good';
    if (score >= 50) return 'Review recommended';
    return 'High risk';
  }

  // Animate gauge and counter
  function animateScore(target, duration = 1200) {
    progress.style.strokeDasharray = CIRCUMFERENCE;
    progress.style.strokeDashoffset = CIRCUMFERENCE;
    // force reflow so the transition runs
    void progress.getBoundingClientRect();
    progress.style.strokeDashoffset = CIRCUMFERENCE * (1 - target / 100);

    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      scoreEl.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    badge.textContent = labelFor(target);
  }

  // Toast helper
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // Button handlers (replace with real navigation / API calls)
  document.getElementById('contactBtn').addEventListener('click', () => {
    showToast('Connecting you to a representative…');
  });
  document.getElementById('thinkBtn').addEventListener('click', () => {
    showToast('No problem. Your transaction has been saved.');
  });
  document.getElementById('continueBtn').addEventListener('click', () => {
    if (window.confirm('Are you sure you want to continue with this transaction?')) {
      showToast('Continuing with transaction…');
    }
  });
  document.getElementById('backBtn').addEventListener('click', () => {
    showToast('Going back…');
  });

  window.addEventListener('DOMContentLoaded', () => animateScore(SCORE));
  if (document.readyState !== 'loading') animateScore(SCORE);
})();
