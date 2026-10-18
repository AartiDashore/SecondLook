(function () {
  const CIRCUMFERENCE = 2 * Math.PI * 52; // matches r=52 in the SVG
  const CONFIDENCE_COLORS = {
    low: { accent: '#b42318', soft: '#fee4e2' },
    moderate: { accent: '#b88200', soft: '#f7e7a6' },
    high: { accent: '#157347', soft: '#d9f2e6' }
  };

  const scoreEl = document.getElementById('score');
  const progress = document.getElementById('progress');
  const badge = document.getElementById('badge');
  const toast = document.getElementById('toast');
  const riskHeading = document.getElementById('riskHeading');
  const riskList = document.getElementById('riskList');

  function recommendationFor(tier) {
    if (tier === 'Stop') return 'Do not proceed';
    if (tier === 'Pause') return 'Review recommended';
    if (tier === 'Nudge') return 'Proceed with caution';
    return 'No additional review recommended';
  }

  function colorsFor(score) {
    if (score <= 39) return CONFIDENCE_COLORS.low;
    if (score <= 69) return CONFIDENCE_COLORS.moderate;
    return CONFIDENCE_COLORS.high;
  }

  function applyConfidenceColors(score) {
    const colors = colorsFor(score);
    progress.style.stroke = colors.accent;
    scoreEl.style.color = colors.accent;
    badge.style.color = colors.accent;
    badge.style.backgroundColor = colors.soft;
  }

  function animateScore(target, duration = 1200) {
    applyConfidenceColors(target);
    progress.style.strokeDasharray = CIRCUMFERENCE;
    progress.style.strokeDashoffset = CIRCUMFERENCE;
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
  }

  function renderRiskFactors(factors) {
    riskList.replaceChildren();
    riskHeading.textContent = `${factors.length} risk factor${factors.length === 1 ? '' : 's'}`;
    factors.forEach((factor, index) => {
      const item = document.createElement('li');
      const content = document.createElement('div');
      const title = document.createElement('strong');
      const description = document.createElement('p');
      item.id = `risk${index + 1}`;
      title.textContent = factor.title;
      description.textContent = factor.description;
      content.append(title, description);
      item.appendChild(content);
      riskList.appendChild(item);
    });
  }

  function showUnavailable(message) {
    scoreEl.textContent = '--';
    progress.style.strokeDasharray = CIRCUMFERENCE;
    progress.style.strokeDashoffset = CIRCUMFERENCE;
    progress.style.stroke = '#6b7190';
    scoreEl.style.color = '#6b7190';
    badge.textContent = 'Confidence unavailable';
    badge.style.color = '#6b7190';
    badge.style.backgroundColor = '#ececf3';
    riskHeading.textContent = 'Risk factors unavailable';
    riskList.replaceChildren();
    const item = document.createElement('li');
    const text = document.createElement('p');
    text.textContent = message;
    item.appendChild(text);
    riskList.appendChild(item);
  }

  function validateResponse(payload) {
    const score = Number(payload.confidence_percentage);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error('The confidence service returned an invalid score.');
    }
    if (!Array.isArray(payload.top_risk_factors) || typeof payload.risk_tier !== 'string') {
      throw new Error('The confidence service returned incomplete results.');
    }
    return score;
  }

  async function loadConfidence() {
    try {
      const response = await fetch('/api/demo/michael', {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('The confidence service is currently unavailable.');
      const payload = await response.json();
      const score = validateResponse(payload);
      badge.textContent = recommendationFor(payload.risk_tier);
      renderRiskFactors(payload.top_risk_factors);
      animateScore(score);
    } catch (error) {
      showUnavailable(error.message || 'Please try again later.');
    }
  }

  // Toast helper
  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

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

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadConfidence);
  } else {
    loadConfidence();
  }
})();
