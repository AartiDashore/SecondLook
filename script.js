(function () {
  const member1002 = {
    "synthetic_member_id": "M1002",
    "anchor_persona": "Michael",
    "scenario_type": "Romance / Investment",
    "scenario_subtype": "Online partner / crypto 'investment'",
    "is_legitimate_lookalike": "No",
    "journey_summary": "Michael: P2P to an online partner grew for weeks, then moved to wire 'investments'. Continued through warnings; reported when the platform blocked withdrawals.",
    "incident_start": "9/8/2026 13:20",
    "first_intervention": "",
    "journey_outcome": "Loss",
    "scam_payment_ids": [
      "P1002-006",
      "P1002-007",
      "P1002-008",
      "P1002-009",
      "P1002-010",
      "P1002-011",
      "P1002-012"
    ],
    "dollars_attempted": 8487.77,
    "dollars_sent": 8487.77,
    "dollars_prevented": 0,
    "dollars_recovered": 0,
    "net_member_loss": 8487.77,
    "intervention_candidate": "Recipient-setup friction, pattern-aware warning, human outreach without blame, recovery help"
  }

  // TODO: API Call 

  const SCORE = 55;
  const CIRCUMFERENCE = 2 * Math.PI * 52; // matches r=52 in the SVG

  const RISKS = ["Increasing payments", "3x Higher than your usual total", "New recipient (added less than 30 days ago)"];

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

  // Populate risk list
  const riskList = document.getElementById('riskList');
  RISKS.forEach((risk, index) => {
    const li = document.createElement('li');
    li.id = `risk${index + 1}`;
    li.innerHTML = `<strong>${risk}</strong>`;
    riskList.appendChild(li);
  });

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
