const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 L9 17 L4 12"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.5 18a1.5 1.5 0 0 0 1.3 2.3h16.4a1.5 1.5 0 0 0 1.3-2.3L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z"/></svg>',
  danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>'
};

const EXAMPLES = {
  bank: "Dear Customer, your account will be temporarily blocked within 24 hours due to pending KYC verification. Please share your OTP and account number immediately to avoid suspension. - Bank Security Team",
  delivery: "Your parcel is held at customs. Pay a refundable processing fee of Rs 199 within 1 hour to release your delivery. Track and pay here: http://bit.ly/delivery-release",
  job: "Congratulations! You've been selected for a part-time job earning Rs 5000/day. A registration fee of Rs 499 is required today to confirm your slot. Limited seats, act now!",
  safe: "Hey, are we still meeting for lunch tomorrow at 1pm? Let me know if you'd rather change the place."
};

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
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
  tabPhoneBtn.textContent = t('tab_phone', 'Phone number scan');
  phoneInput.placeholder = t('placeholder_phone', 'Phone number, e.g. (206) 555-0123');
  phoneContext.placeholder = t('placeholder_phone_context', 'Optional: what did they say or ask for?');
  scanPhoneBtn.textContent = t('scan_phone_btn', 'Scan number');
  document.getElementById('phoneHint').textContent = t('phone_hint', "US numbers work without +1. For other countries, start with + and the country code. The number's owner is never contacted.");
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
const tabPhoneBtn = document.getElementById('tabPhoneBtn');
const tabPhonePanel = document.getElementById('tabPhonePanel');
const phoneInput = document.getElementById('phoneInput');
const phoneContext = document.getElementById('phoneContext');
const scanPhoneBtn = document.getElementById('scanPhoneBtn');
const phoneDetails = document.getElementById('phoneDetails');

let currentImageBase64 = null;
let currentScanId = null;

const TABS = {
  text: [tabTextBtn, tabTextPanel],
  image: [tabImageBtn, tabImagePanel],
  phone: [tabPhoneBtn, tabPhonePanel],
};
let activeTab = 'text';

function showTab(name){
  activeTab = name;
  Object.entries(TABS).forEach(([key, [btn, panel]]) => {
    btn.classList.toggle('active', key === name);
    panel.classList.toggle('active', key === name);
  });
  result.classList.remove('active');
}
tabTextBtn.addEventListener('click', () => showTab('text'));
tabImageBtn.addEventListener('click', () => showTab('image'));
tabPhoneBtn.addEventListener('click', () => showTab('phone'));

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
  const field = { text: input, phone: phoneInput }[activeTab];
  if (field) { field.focus(); field.select(); }
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

scanPhoneBtn.addEventListener('click', () => {
  const number = phoneInput.value.trim();
  if (!number) { phoneInput.focus(); return; }
  scanPhoneBtn.disabled = true;
  scanPhoneBtn.textContent = t('scanning', 'Scanning…');
  progress.classList.add('active');
  result.classList.remove('active');
  runPhoneScan(number, phoneContext.value.trim());
});
phoneInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') scanPhoneBtn.click();
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

async function runPhoneScan(number, context){
  try {
    const res = await fetch('/api/scan-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, context, language: currentLanguage, reading_level: simpleMode ? 'simple' : 'normal' })
    });
    const data = await res.json();
    if (res.status === 400) { renderError(data.error || 'Check the number and try again.', false); return; }
    if (!res.ok || data.error) throw new Error(data.error || 'Scan failed.');
    renderResult(data);
    loadHistory();
    loadStats();
  } catch (err) {
    renderError(err.message || 'Something went wrong checking that number.');
  } finally {
    progress.classList.remove('active');
    scanPhoneBtn.disabled = false;
    scanPhoneBtn.textContent = t('scan_phone_btn', 'Scan number');
  }
}

const OWNER_LOOKUP_SITES = [
  { name: 'TruePeopleSearch', url: 'https://www.truepeoplesearch.com/' },
  { name: 'FastPeopleSearch', url: 'https://www.fastpeoplesearch.com/reverse-phone-lookup' },
];

function phoneCardHtml(p){
  const esc = s => escapeHtml(String(s));
  const unknown = '<span class="phone-muted">' + esc(t('phone_unknown', 'Unknown')) + '</span>';
  const row = (label, valueHtml) => '<div class="phone-fact"><dt>' + esc(label) + '</dt><dd>' + valueHtml + '</dd></div>';

  const rows = [
    row(t('phone_number', 'Number'), esc(p.display)),
    row(t('phone_real', 'Real number?'), p.valid
      ? esc(t('phone_real_yes', 'Yes, a valid number'))
      : '<span class="phone-bad">' + esc(t('phone_real_no', 'No, not a valid number')) + '</span>'),
    row(t('phone_location', 'Location'), [p.location, p.country].filter(Boolean).map(esc).join(', ') || unknown),
    row(t('phone_line_type', 'Line type'), p.line_type
      ? esc(p.line_type) + (p.voip_app ? ' · <strong>' + esc(p.voip_app) + '</strong>' : '')
      : unknown),
    row(t('phone_carrier', 'Carrier'), p.carrier
      ? esc(p.carrier) + (p.carrier_is_original ? ' <span class="phone-muted">(' + esc(t('phone_carrier_original', 'original carrier; the number may have moved since')) + ')</span>' : '')
      : unknown),
  ];
  if (p.caller_name) {
    const kind = { CONSUMER: t('phone_owner_person', 'person'), BUSINESS: t('phone_owner_business', 'business') }[p.caller_type];
    rows.push(row(t('phone_owner', 'Registered name'), esc(p.caller_name) + (kind ? ' <span class="phone-muted">(' + esc(kind) + ')</span>' : '')));
  } else if (p.live_lookup === 'done' && p.owner_lookup) {
    rows.push(row(t('phone_owner', 'Registered name'), '<span class="phone-muted">' + esc(t('phone_owner_none', 'No name registered')) + '</span>'));
  }

  const note = {
    off: t('phone_live_off', "Live carrier lookup isn't set up, so line type comes from the numbering plan and apps like Google Voice can't be detected."),
    failed: t('phone_live_failed', "The live carrier lookup didn't respond, so line type and carrier come from the numbering plan only."),
  }[p.live_lookup];

  const ownerLookup = p.owner_lookup
    ? '<div class="owner-lookup">' +
        '<p class="owner-lookup-head">' + esc(t('owner_lookup_head', 'Look up who owns it yourself')) + '</p>' +
        '<p class="owner-lookup-body">' + esc(t('owner_lookup_body', 'Copy the number and search it on either site:')) + '</p>' +
        '<div class="owner-lookup-actions">' +
          '<button type="button" class="copy-number-btn" data-number="' + esc(p.display) + '">' + esc(t('copy_number', 'Copy number')) + '</button>' +
          OWNER_LOOKUP_SITES.map(site => '<a class="owner-link" href="' + site.url + '" target="_blank" rel="noopener noreferrer">' + site.name + '</a>').join('') +
        '</div>' +
        '<p class="owner-lookup-warning">' + esc(t('owner_lookup_warning', "Scammers often fake (spoof) real people's numbers, so whoever is listed may not be who contacted you. Don't call, text, or confront them.")) + '</p>' +
      '</div>'
    : '';

  return '<div class="phone-card">' +
      '<p class="phone-card-head">' + esc(t('phone_head', 'About this number')) + '</p>' +
      '<dl class="phone-facts">' + rows.join('') + '</dl>' +
      (note ? '<p class="phone-card-note">' + esc(note) + '</p>' : '') +
      ownerLookup +
    '</div>';
}

phoneDetails.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-number-btn');
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(btn.dataset.number);
    btn.textContent = t('copied', 'Copied');
    setTimeout(() => { btn.textContent = t('copy_number', 'Copy number'); }, 1600);
  } catch (err) { /* clipboard blocked; the number is shown in the card to copy by hand */ }
});

function renderResult(parsed){
  currentScanId = parsed.id ?? null;
  fbThanks.textContent = '';
  lastScanForSpeech = parsed;

  const state = ['safe', 'caution', 'danger'].includes(parsed.verdict) ? parsed.verdict : 'caution';
  const fallbackLabels = { safe: 'Looks safe', caution: 'Proceed with caution', danger: 'Likely a scam' };
  const iconMap = { safe: ICONS.check, caution: ICONS.alert, danger: ICONS.danger };
  const list = Array.isArray(parsed.findings) ? parsed.findings : [];
  const safety = parsed.safety_lines || {};
  const isPhone = parsed.input_type === 'phone';

  phoneDetails.innerHTML = isPhone && parsed.phone ? phoneCardHtml(parsed.phone) : '';
  rescanBtn.textContent = isPhone ? t('rescan_phone', 'Scan another number') : t('rescan', 'Scan another message');

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
    const txt = isPhone
      ? t('known_phone_one', 'This number has been flagged once before.')
      : t('known_match_one', 'This exact message has been flagged once before.');
    knownMatchEl.innerHTML = '<div class="known-match-banner">🔁 ' + txt + '</div>';
  } else if (parsed.known_matches > 1) {
    const txt = (isPhone
      ? t('known_phone_many', 'This number has been flagged {n} times before.')
      : t('known_match_many', "This exact message has been flagged {n} times before - it's a known circulating scam.")
    ).replace('{n}', parsed.known_matches);
    knownMatchEl.innerHTML = '<div class="known-match-banner">🔁 ' + txt + '</div>';
  } else {
    knownMatchEl.innerHTML = '';
  }

  findings.innerHTML = '';
  findingsHead.textContent = t('findings_head', 'What we found');
  if (list.length === 0) {
    findings.innerHTML = isPhone
      ? '<p class="empty-note">' + escapeHtml(t('phone_empty_note', 'Nothing about this number itself looks suspicious. Caller ID can be faked, though, so judge the call or text by what they ask for: never share codes, PINs, or payment details with someone who contacted you first.')) + '</p>'
      : '<p class="empty-note">No manipulation tactics detected. That\'s a good sign, not a guarantee — if money, an OTP, or personal details are being asked for, confirm directly with the sender through a number or site you already trust before acting.</p>';
  } else {
    list.forEach(m => {
      const div = document.createElement('div');
      div.className = 'finding';
      // Phone findings quote a fact about the number, not words from a message.
      const quote = isPhone ? escapeHtml(m.quote) : '"' + escapeHtml(m.quote) + '"';
      div.innerHTML =
        '<span class="finding-tag">' + escapeHtml(m.tag || 'signal') + '</span>' +
        (m.quote ? '<p class="finding-quote' + (state === 'caution' ? ' caution-border' : '') + '">' + quote + '</p>' : '') +
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

function renderError(message, serverHint = true){
  currentScanId = null;
  verdict.className = 'verdict caution';
  verdictIcon.innerHTML = ICONS.alert;
  verdictLabel.textContent = "Couldn't complete the scan";
  verdictMeta.textContent = message;
  phoneDetails.innerHTML = '';
  document.getElementById('degradedBanner').innerHTML = '';
  document.getElementById('knownMatchBanner').innerHTML = '';
  findingsHead.textContent = '';
  findings.innerHTML = serverHint
    ? '<p class="empty-note">Check that the server is running and your Claude API key is set, then try again.</p>'
    : '';
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

loadLanguages().then(() => loadUiStrings(currentLanguage));

// "Test this in the scanner" on the patterns page links here with ?example=<message text>.
const exampleText = new URLSearchParams(location.search).get('example');
if (exampleText) {
  tabTextBtn.click();
  input.value = exampleText;
  history.replaceState(null, '', location.pathname);
  document.querySelector('.console').scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus();
}
