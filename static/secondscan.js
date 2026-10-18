const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 L9 17 L4 12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.5 18a1.5 1.5 0 0 0 1.3 2.3h16.4a1.5 1.5 0 0 0 1.3-2.3L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z"/></svg>',
  danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.9-1L3 20l1.2-4.5A8.4 8.4 0 1 1 21 11.5Z"/></svg>',
  sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12H7l-3 3z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10.1a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  caller: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
};

const EXAMPLES = {
  bank: "Dear Customer, your account will be temporarily blocked within 24 hours due to pending KYC verification. Please share your OTP and account number immediately to avoid suspension. - Bank Security Team",
  delivery: "Your parcel is held at customs. Pay a refundable processing fee of Rs 199 within 1 hour to release your delivery. Track and pay here: http://bit.ly/delivery-release",
  job: "Congratulations! You've been selected for a part-time job earning Rs 5000/day. A registration fee of Rs 499 is required today to confirm your slot. Limited seats, act now!",
  safe: "Hey, are we still meeting for lunch tomorrow at 1pm? Let me know if you'd rather change the place."
};

const GALLERY = [
  {
    id: 'bank', kind: 'sms', title: 'Fake KYC / account-block alert', sender: 'AD-ALERTS',
    photo: 'https://d8j0ntlcm91z4.cloudfront.net/user_38HhQhbOAlRVssHeu2gMBnp2AGw/hf_20260904_202924_4d3c30f4-1b90-43e6-9cbc-7a46a2d6504d.png',
    segments: [
      { text: "Dear Customer, " },
      { text: "your account will be blocked within 24 hours", reason: "Real banks don't threaten to block your account by text within hours — this urgency is designed to stop you thinking clearly." },
      { text: " due to pending KYC verification. Please " },
      { text: "share your OTP and account number", reason: "No bank, ever, asks you to share an OTP. Doing so hands over full access to your account." },
      { text: " immediately to avoid suspension. - Bank Security Team" }
    ]
  },
  {
    id: 'delivery', kind: 'sms', title: 'Fake courier / customs fee', sender: 'VK-COURIER',
    photo: 'https://d8j0ntlcm91z4.cloudfront.net/user_38HhQhbOAlRVssHeu2gMBnp2AGw/hf_20260904_202934_735bfb7e-76d9-4a49-bb57-7ea7fb4e7088.png',
    segments: [
      { text: "Your parcel is held at customs. " },
      { text: "Pay a refundable processing fee of Rs 199 within 1 hour", reason: "Customs and courier fees are never collected through a text link, and a genuinely 'refundable' fee wouldn't need to be paid under a deadline." },
      { text: " to release your delivery. Track and pay here: " },
      { text: "http://bit.ly/delivery-release", reason: "Shortened links hide the real destination site — legitimate couriers link to their own named domain, not a link shortener." }
    ]
  },
  {
    id: 'job', kind: 'whatsapp', title: 'Fake part-time job offer', sender: 'Unknown number',
    photo: 'https://d8j0ntlcm91z4.cloudfront.net/user_38HhQhbOAlRVssHeu2gMBnp2AGw/hf_20260904_203222_f841adc0-2f3c-45ee-9433-89532a609667.png',
    segments: [
      { text: "Congratulations! " },
      { text: "You've been selected for a part-time job earning Rs 5000/day", reason: "A job that pays far above market rate for no stated skill or interview is the classic hook of a job scam." },
      { text: ". A " },
      { text: "registration fee of Rs 499 is required today to confirm your slot", reason: "Genuine employers never charge you to be hired — a fee to 'confirm a slot' is the actual scam." },
      { text: ". Limited seats, " },
      { text: "act now!", reason: "Manufactured scarcity and urgency push you to pay before you've had time to check if the offer is real." }
    ]
  },
  {
    id: 'arrest', kind: 'call', title: '"Digital arrest" impersonation call', sender: 'Unknown Caller',
    photo: 'https://d8j0ntlcm91z4.cloudfront.net/user_38HhQhbOAlRVssHeu2gMBnp2AGw/hf_20260904_202939_15581caa-b383-4bef-acee-57616d1570d5.png',
    segments: [
      { text: "This is an officer from the Cyber Crime Cell. " },
      { text: "Your Aadhaar number has been used in a money laundering case", reason: "Impersonating a police or government body by phone is a fast way to borrow authority and trigger fear before you can verify anything." },
      { text: " and " },
      { text: "you are under digital arrest — stay on this video call and do not tell anyone", reason: "There is no such thing as a 'digital arrest.' Real police never conduct arrests over a call or demand isolation from family." },
      { text: ", until you transfer " },
      { text: "the full amount to a 'verification account' to clear your name", reason: "No government process is ever resolved by transferring money to a personal or unnamed account over a call." }
    ]
  }
];

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function segmentsToHtml(card){
  return card.segments.map((seg, i) => {
    if (!seg.reason) return escapeHtml(seg.text);
    const num = card.segments.slice(0, i + 1).filter(s => s.reason).length;
    return '<span class="flag" tabindex="0" role="button" data-card="' + card.id + '" data-legend="' + card.id + '-' + i + '">' +
      escapeHtml(seg.text) + '<sup>' + num + '</sup></span>';
  }).join('');
}

function deviceChrome(card){
  if (card.kind === 'whatsapp') {
    return '<div class="device-status"><span>9:41</span><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>' +
      '<div class="app-bar whatsapp">' + ICONS.chat + '<span>WhatsApp</span></div>';
  }
  if (card.kind === 'sms') {
    return '<div class="device-status"><span>9:41</span><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>' +
      '<div class="app-bar sms">' + ICONS.sms + '<span>Messages</span></div>';
  }
  return '<div class="device-status"><span>9:41</span><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>' +
    '<div class="app-bar call">' + ICONS.phone + '<span>Phone</span></div>';
}

function deviceBody(card){
  const bubbleHtml = segmentsToHtml(card);
  if (card.kind === 'call') {
    return '<div class="call-screen">' +
      '<div class="call-avatar">' + ICONS.caller + '</div>' +
      '<p class="call-name">' + escapeHtml(card.sender) + '</p>' +
      '<p class="call-meta">Spoofed caller ID · 03:42</p>' +
      '<div class="call-live"><span class="pulse-dot"></span>Live captions</div>' +
      '<div class="caption-box">' + bubbleHtml + '</div>' +
    '</div>';
  }
  return '<div class="msg-row"><div class="avatar">' + ICONS.person + '</div><div class="bubble">' + bubbleHtml + '</div></div>';
}

function renderGallery(){
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  GALLERY.forEach(card => {
    const el = document.createElement('div');
    el.className = 'scam-card reveal';

    const legendHtml = card.segments.map((seg, i) => ({ seg, i }))
      .filter(x => x.seg.reason)
      .map((x, idx) => (
        '<div class="legend-item" id="' + card.id + '-' + x.i + '-row">' +
          '<span class="legend-num">' + (idx + 1) + '</span>' +
          '<p class="legend-text">' + escapeHtml(x.seg.reason) + '</p>' +
        '</div>'
      )).join('');

    el.innerHTML =
      '<span class="scam-title">' + escapeHtml(card.title) + '</span>' +
      (card.photo ? '<img class="scam-photo" src="' + card.photo + '" alt="' + escapeHtml(card.title) + ' example" loading="lazy">' : '') +
      '<div class="device">' + deviceChrome(card) + '<div class="device-body">' + deviceBody(card) + '</div></div>' +
      '<div class="legend">' + legendHtml + '</div>' +
      '<button class="try-btn" data-tryid="' + card.id + '">Test this in the scanner</button>';

    gallery.appendChild(el);
  });

  gallery.querySelectorAll('.flag').forEach(flag => {
    flag.addEventListener('click', () => {
      const row = document.getElementById(flag.dataset.legend + '-row');
      if (!row) return;
      row.classList.add('pulse');
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => row.classList.remove('pulse'), 1400);
    });
  });

  gallery.querySelectorAll('.try-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = GALLERY.find(c => c.id === btn.dataset.tryid);
      if (!card) return;
      tabTextBtn.click();
      input.value = card.segments.map(s => s.text).join('');
      document.querySelector('.console').scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    });
  });
}

// Verified as of research done Sept 2026 - one representative country per
// language (a language often covers many countries; this picks one clearly
// and does not claim universal coverage).
const INDIA_REPORT = { country: 'India', phone: '1930', site: 'cybercrime.gov.in', url: 'https://cybercrime.gov.in' };
const USA_REPORT = { country: 'USA (FTC)', phone: '1-877-382-4357', site: 'reportfraud.ftc.gov', url: 'https://reportfraud.ftc.gov' };

const REPORT_INFO = {
  'English':               [ INDIA_REPORT, USA_REPORT ],
  'Hindi':                 [ INDIA_REPORT ],
  'Bengali':               [ INDIA_REPORT ],
  'Tamil':                 [ INDIA_REPORT ],
  'Telugu':                [ INDIA_REPORT ],
  'Marathi':               [ INDIA_REPORT ],
  'Spanish':               [ { country: 'Spain',   phone: '017',             site: 'incibe.es',                    url: 'https://www.incibe.es' } ],
  'French':                [ { country: 'France',  phone: '0805 805 817',    site: 'cybermalveillance.gouv.fr',    url: 'https://www.cybermalveillance.gouv.fr' } ],
  'German':                [ { country: 'Germany', phone: '0800 274 1000',   site: 'bsi.bund.de',                  url: 'https://www.bsi.bund.de' } ],
  'Portuguese':            [ { country: 'Brazil',  phone: '190',             site: 'safernet.org.br/denuncie',     url: 'https://new.safernet.org.br/denuncie' } ],
  'Arabic':                [ { country: 'UAE',     phone: '800-29237',       site: 'ecrime.ae',                    url: 'https://www.ecrime.ae' } ],
  'Chinese (Simplified)':  [ { country: 'China',   phone: '96110',           site: 'mps.gov.cn',                   url: 'https://www.mps.gov.cn' } ],
  'Russian':               [ { country: 'Russia',  phone: '102',             site: 'gosuslugi.ru',                 url: 'https://www.gosuslugi.ru' } ],
};

const LANG_TO_BCP47 = {
  'English': 'en-US', 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN',
  'Telugu': 'te-IN', 'Marathi': 'mr-IN', 'Spanish': 'es-ES', 'French': 'fr-FR',
  'German': 'de-DE', 'Portuguese': 'pt-PT', 'Arabic': 'ar-SA',
  'Chinese (Simplified)': 'zh-CN', 'Russian': 'ru-RU',
};

let currentLanguage = localStorage.getItem('secondscan_lang') || 'English';
let simpleMode = localStorage.getItem('secondscan_simple') === 'true';
let uiStrings = {};
let lastScanForSpeech = null;

const langSelect = document.getElementById('langSelect');
const simpleModeToggle = document.getElementById('simpleModeToggle');
const readAloudBtn = document.getElementById('readAloudBtn');

async function loadLanguages(){
  try {
    const res = await fetch('/api/languages');
    const langs = await res.json();
    langSelect.innerHTML = langs.map(l => '<option value="' + l + '"' + (l === currentLanguage ? ' selected' : '') + '>' + l + '</option>').join('');
  } catch (e) { /* best-effort */ }
}

async function loadUiStrings(lang){
  try {
    const res = await fetch('/api/ui-strings?lang=' + encodeURIComponent(lang));
    uiStrings = await res.json();
    applyUiStrings();
  } catch (e) { /* best-effort, keep English defaults in markup */ }
}

function t(key, fallback){ return (uiStrings && uiStrings[key]) || fallback; }

function applyUiStrings(){
  tabTextBtn.textContent = t('tab_text', 'Paste text');
  tabImageBtn.textContent = t('tab_image', 'Upload screenshot');
  input.placeholder = t('placeholder_text', 'Paste the suspicious message here…');
  scanBtn.textContent = t('scan_text_btn', 'Scan message');
  scanImageBtn.textContent = t('scan_image_btn', 'Scan screenshot');
  document.querySelector('.dropzone-text').innerHTML = '<b>' + t('dropzone_main', 'Drop a screenshot here or tap to browse') + '</b>';
  document.querySelector('.dropzone-sub').textContent = t('dropzone_sub', 'PNG or JPG · SMS, WhatsApp, email, or call screen');
  clearImageBtn.textContent = t('remove_image', 'Remove image');
  document.querySelector('.privacy-note').innerHTML = t('privacy_note', 'Messages are analyzed by AI and saved only to your local scan history. Never shared elsewhere.');
  findingsHead.textContent = t('findings_head', 'What we found');
  document.getElementById('actionHead').textContent = t('action_head', 'What to do');
  document.getElementById('feedbackQLabel').textContent = t('feedback_q', 'Was this right?');
  fbYes.textContent = t('yes', 'Yes');
  fbNo.textContent = t('no', 'No');
  rescanBtn.textContent = t('rescan', 'Scan another message');
  document.getElementById('historyHeadLabel').textContent = t('history_head', 'Recent scans');
  historyList.textContent = t('history_empty', 'No scans yet.');
  document.getElementById('simpleModeLabel').textContent = t('reading_simple', 'Explain simply');
  document.getElementById('readAloudLabel').textContent = t('read_aloud', 'Read aloud');
  document.querySelector('[data-ex="bank"]').textContent = t('ex_bank', 'Try: bank alert');
  document.querySelector('[data-ex="delivery"]').textContent = t('ex_delivery', 'Try: delivery link');
  document.querySelector('[data-ex="job"]').textContent = t('ex_job', 'Try: job offer');
  document.querySelector('[data-ex="safe"]').textContent = t('ex_safe', 'Try: a normal text');
  loadHistory();
  loadStats();
}

langSelect.addEventListener('change', () => {
  currentLanguage = langSelect.value;
  localStorage.setItem('secondscan_lang', currentLanguage);
  loadUiStrings(currentLanguage);
});

simpleModeToggle.checked = simpleMode;
simpleModeToggle.addEventListener('change', () => {
  simpleMode = simpleModeToggle.checked;
  localStorage.setItem('secondscan_simple', simpleMode);
});

async function loadStats(){
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    const wrap = document.getElementById('protectedBadgeWrap');
    if (stats.protected_count > 0) {
      wrap.innerHTML = '<div class="protected-badge">🛡️ ' + stats.protected_count + ' ' + t('protected_label', 'scams caught for your family') + '</div>';
    } else {
      wrap.innerHTML = '';
    }
  } catch (e) { /* best-effort */ }
}

const input = document.getElementById('input');
const scanBtn = document.getElementById('scanBtn');
const progress = document.getElementById('progress');
const result = document.getElementById('result');
const verdict = document.getElementById('verdict');
const verdictIcon = document.getElementById('verdictIcon');
const verdictLabel = document.getElementById('verdictLabel');
const verdictMeta = document.getElementById('verdictMeta');
const findings = document.getElementById('findings');
const findingsHead = document.getElementById('findingsHead');
const rescanBtn = document.getElementById('rescanBtn');
const actionBox = document.getElementById('actionBox');
const actionText = document.getElementById('actionText');
const safetyBox = document.getElementById('safetyBox');
const fbYes = document.getElementById('fbYes');
const fbNo = document.getElementById('fbNo');
const fbThanks = document.getElementById('fbThanks');
const historyList = document.getElementById('historyList');

const tabTextBtn = document.getElementById('tabTextBtn');
const tabImageBtn = document.getElementById('tabImageBtn');
const tabTextPanel = document.getElementById('tabTextPanel');
const tabImagePanel = document.getElementById('tabImagePanel');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const imagePreviewWrap = document.getElementById('imagePreviewWrap');
const imagePreview = document.getElementById('imagePreview');
const clearImageBtn = document.getElementById('clearImageBtn');
const scanImageBtn = document.getElementById('scanImageBtn');

let currentImageBase64 = null;
let currentScanId = null;

tabTextBtn.addEventListener('click', () => {
  tabTextBtn.classList.add('active');
  tabImageBtn.classList.remove('active');
  tabTextPanel.classList.add('active');
  tabImagePanel.classList.remove('active');
  result.classList.remove('active');
});
tabImageBtn.addEventListener('click', () => {
  tabImageBtn.classList.add('active');
  tabTextBtn.classList.remove('active');
  tabImagePanel.classList.add('active');
  tabTextPanel.classList.remove('active');
  result.classList.remove('active');
});

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('hover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('hover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files[0]) handleImageFile(fileInput.files[0]);
});
clearImageBtn.addEventListener('click', () => {
  currentImageBase64 = null;
  imagePreviewWrap.style.display = 'none';
  scanImageBtn.disabled = true;
  fileInput.value = '';
});

function handleImageFile(file){
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentImageBase64 = reader.result;
    imagePreview.src = currentImageBase64;
    imagePreviewWrap.style.display = 'block';
    scanImageBtn.disabled = false;
    result.classList.remove('active');
  };
  reader.readAsDataURL(file);
}

document.querySelectorAll('.example-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = EXAMPLES[btn.dataset.ex];
    result.classList.remove('active');
    input.focus();
  });
});

rescanBtn.addEventListener('click', () => {
  result.classList.remove('active');
  input.focus();
  input.select();
});

scanBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanning…";
  progress.classList.add('active');
  result.classList.remove('active');
  runScan(text);
});

scanImageBtn.addEventListener('click', () => {
  if (!currentImageBase64) return;
  scanImageBtn.disabled = true;
  scanImageBtn.textContent = "Scanning…";
  progress.classList.add('active');
  result.classList.remove('active');
  runImageScan(currentImageBase64);
});

async function runScan(text){
  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: currentLanguage, reading_level: simpleMode ? 'simple' : 'normal' })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Scan failed.');
    renderResult(data);
    loadHistory();
    loadStats();
  } catch (err) {
    renderError(err.message || 'Something went wrong.');
  } finally {
    progress.classList.remove('active');
    scanBtn.disabled = false;
    scanBtn.textContent = t('scan_text_btn', 'Scan message');
  }
}

async function runImageScan(dataUrl){
  try {
    const res = await fetch('/api/scan-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, language: currentLanguage, reading_level: simpleMode ? 'simple' : 'normal' })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Scan failed.');
    renderResult(data);
    loadHistory();
    loadStats();
  } catch (err) {
    renderError(err.message || 'Something went wrong reading that screenshot.');
  } finally {
    progress.classList.remove('active');
    scanImageBtn.disabled = false;
    scanImageBtn.textContent = t('scan_image_btn', 'Scan screenshot');
  }
}

function renderResult(parsed){
  currentScanId = parsed.id ?? null;
  fbThanks.textContent = '';
  lastScanForSpeech = parsed;

  const state = ['safe', 'caution', 'danger'].includes(parsed.verdict) ? parsed.verdict : 'caution';
  const fallbackLabels = { safe: 'Looks safe', caution: 'Proceed with caution', danger: 'Likely a scam' };
  const iconMap = { safe: ICONS.check, caution: ICONS.alert, danger: ICONS.danger };
  const list = Array.isArray(parsed.findings) ? parsed.findings : [];
  const safety = parsed.safety_lines || {};

  verdict.className = 'verdict ' + state;
  verdictIcon.innerHTML = iconMap[state];
  verdictLabel.textContent = parsed.verdict_label || fallbackLabels[state];
  verdictMeta.textContent = parsed.summary || (list.length + ' signal(s) found');

  if (parsed.degraded) {
    document.getElementById('degradedBanner').innerHTML =
      '<div class="degraded-banner">⚠️ ' + t('degraded_note', 'AI analysis was unavailable for this scan - showing a lower-confidence, rule-based result only.') + '</div>';
  } else {
    document.getElementById('degradedBanner').innerHTML = '';
  }

  const knownMatchEl = document.getElementById('knownMatchBanner');
  if (parsed.known_matches === 1) {
    knownMatchEl.innerHTML = '<div class="known-match-banner">🔁 ' + t('known_match_one', 'This exact message has been flagged once before.') + '</div>';
  } else if (parsed.known_matches > 1) {
    const txt = t('known_match_many', "This exact message has been flagged {n} times before - it's a known circulating scam.").replace('{n}', parsed.known_matches);
    knownMatchEl.innerHTML = '<div class="known-match-banner">🔁 ' + txt + '</div>';
  } else {
    knownMatchEl.innerHTML = '';
  }

  findings.innerHTML = '';
  findingsHead.textContent = t('findings_head', 'What we found');
  if (list.length === 0) {
    findings.innerHTML = '<p class="empty-note">No manipulation tactics detected. That\'s a good sign, not a guarantee — if money, an OTP, or personal details are being asked for, confirm directly with the sender through a number or site you already trust before acting.</p>';
  } else {
    list.forEach(m => {
      const div = document.createElement('div');
      div.className = 'finding';
      div.innerHTML =
        '<span class="finding-tag">' + escapeHtml(m.tag || 'signal') + '</span>' +
        (m.quote ? '<p class="finding-quote' + (state === 'caution' ? ' caution-border' : '') + '">"' + escapeHtml(m.quote) + '"</p>' : '') +
        '<p class="finding-explain">' + escapeHtml(m.explain || '') + '</p>';
      findings.appendChild(div);
    });
  }

  if (parsed.recommended_action) {
    actionBox.style.display = 'block';
    actionText.textContent = parsed.recommended_action;
  } else {
    actionBox.style.display = 'none';
  }

  const infoList = REPORT_INFO[currentLanguage] || REPORT_INFO['English'];
  const reportBtn = state === 'danger'
    ? '<div class="report-box">' +
        infoList.map(info => (
          '<p class="report-box-head">' + t('report_btn', 'Report to Cyber Crime Helpline') + ' — ' + info.country + '</p>' +
          '<div class="report-box-actions">' +
            '<a class="report-btn" href="tel:' + info.phone.replace(/\s+/g, '') + '">' + t('report_call', 'Call') + ' ' + info.phone + '</a>' +
            '<a class="report-btn report-btn-secondary" href="' + info.url + '" target="_blank" rel="noopener">' + t('report_web', 'File online at') + ' ' + info.site + '</a>' +
          '</div>'
        )).join('<div style="height:10px"></div>') +
      '</div>'
    : '';

  if (state !== 'safe') {
    const clickLine = parsed.has_link
      ? '<li>' + escapeHtml(safety.no_click || 'Do not click the link in this message.') + '</li>'
      : '';
    const installLine = parsed.has_install_request
      ? '<li><strong>' + escapeHtml(safety.no_install || 'Do not install any app or file from this message — it could damage your device or steal your data.') + '</strong></li>'
      : '';
    safetyBox.innerHTML =
      '<div class="safety-box">' +
        '<h3>' + t('safety_head', 'Before you do anything else:') + '</h3>' +
        '<ul>' +
          '<li>' + escapeHtml(safety.never_share || 'Never share your OTP, PIN, password, or CVV with anyone — your bank will never ask for this.') + '</li>' +
          clickLine +
          installLine +
          '<li>' + escapeHtml(safety.verify_official || 'If you think it might be real, contact the company directly using a number from their official website or the back of your card — not from this message.') + '</li>' +
        '</ul>' +
        reportBtn +
      '</div>';
  } else {
    safetyBox.innerHTML = '';
  }

  result.classList.add('active');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

readAloudBtn.addEventListener('click', () => {
  if (!lastScanForSpeech || !('speechSynthesis' in window)) return;
  const p = lastScanForSpeech;
  const parts = [p.verdict_label, p.summary, p.recommended_action].filter(Boolean);
  const safety = p.safety_lines || {};
  if (p.has_link || p.has_install_request) {
    parts.push(safety.never_share, safety.no_click);
    if (p.has_install_request) parts.push(safety.no_install);
    parts.push(safety.verify_official);
  }
  const utterance = new SpeechSynthesisUtterance(parts.filter(Boolean).join('. '));
  utterance.lang = LANG_TO_BCP47[currentLanguage] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
});

function renderError(message){
  currentScanId = null;
  verdict.className = 'verdict caution';
  verdictIcon.innerHTML = ICONS.alert;
  verdictLabel.textContent = "Couldn't complete the scan";
  verdictMeta.textContent = message;
  findingsHead.textContent = '';
  findings.innerHTML = '<p class="empty-note">Check that the server is running and your Claude API key is set, then try again.</p>';
  actionBox.style.display = 'none';
  safetyBox.innerHTML = '';
  result.classList.add('active');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function sendFeedback(val){
  if (!currentScanId) return;
  const fd = new FormData();
  fd.append('scan_id', currentScanId);
  fd.append('was_correct', val);
  await fetch('/api/feedback', { method: 'POST', body: fd });
  fbThanks.textContent = 'Thanks, saved!';
  loadHistory();
}
fbYes.addEventListener('click', () => sendFeedback('yes'));
fbNo.addEventListener('click', () => sendFeedback('no'));

async function loadHistory(){
  try {
    const res = await fetch('/api/log');
    const rows = await res.json();
    if (!rows.length) { historyList.className = 'history-empty'; historyList.textContent = 'No scans yet.'; return; }
    historyList.className = '';
    historyList.innerHTML = rows.map(r => (
      '<div class="history-item">' +
        '<span class="history-badge ' + r.verdict + '">' + r.verdict + '</span>' +
        '<span class="history-text">' + escapeHtml((r.input_snippet || '').slice(0, 90)) + ((r.input_snippet || '').length > 90 ? '…' : '') +
          '<span class="history-meta">' + new Date(r.created_at).toLocaleString() + (r.feedback ? ' · feedback: ' + r.feedback : '') + '</span>' +
        '</span>' +
      '</div>'
    )).join('');
  } catch (e) { /* history is best-effort */ }
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) scanBtn.click();
});

renderGallery();
loadLanguages().then(() => loadUiStrings(currentLanguage));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('shown');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 2) * 0.09 + 's';
  revealObserver.observe(el);
});
