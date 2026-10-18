const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.9-1L3 20l1.2-4.5A8.4 8.4 0 1 1 21 11.5Z"/></svg>',
  sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12H7l-3 3z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10.1a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  caller: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'
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
      '<a class="try-btn" href="/secondscan?example=' + encodeURIComponent(card.segments.map(s => s.text).join('')) + '">Test this in the scanner</a>';

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
}

renderGallery();

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
