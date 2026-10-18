const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.9-1L3 20l1.2-4.5A8.4 8.4 0 1 1 21 11.5Z"/></svg>',
  sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v12H7l-3 3z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10.1a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.4 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  caller: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>'
};

// Most common first, from 2025 FTC (US) and I4C (India) data: bank/government impersonation
// is the most reported scam; investment scams, which the 'wrong number' romance leads to, cause
// the biggest losses; romance scam losses are rising; digital arrest complaints are falling.
// Photos live in static/img, resized for the cards; romance.jpg and wrong-number.jpg are CC0
// public domain, from StockSnap.
const GALLERY = [
  {
    id: 'bank', kind: 'sms', title: 'Fake KYC / account-block alert', sender: 'AD-ALERTS',
    teaser: "“Your account will be blocked within 24 hours… share your OTP and account number.”",
    photo: '/static/img/bank.jpg',
    segments: [
      { text: "Dear Customer, " },
      { text: "your account will be blocked within 24 hours", reason: "Real banks don't threaten to block your account by text within hours — this urgency is designed to stop you thinking clearly." },
      { text: " due to pending KYC verification. Please " },
      { text: "share your OTP and account number", reason: "No bank, ever, asks you to share an OTP. Doing so hands over full access to your account." },
      { text: " immediately to avoid suspension. - Bank Security Team" }
    ]
  },
  {
    id: 'wrongnumber', kind: 'sms', title: '"Wrong number" text that turns into romance', sender: 'Unknown number',
    teaser: "“Sorry, wrong number!” Three weeks later: “I've made thousands trading crypto. Just send $500 to start.”",
    photo: '/static/img/wrong-number.jpg',
    messages: [
      { from: 'them', segments: [
        { text: "Mary, it's Janey! Are you ready for the class reunion tomorrow?", reason: "Scammers text random numbers with a believable 'wrong number' message, hoping a polite reply starts a conversation." }
      ] },
      { from: 'you', text: "Sorry, wrong number." },
      { from: 'them', segments: [
        { text: "Oh, how embarrassing! " },
        { text: "You seem so kind though, maybe it was fate", reason: "Instead of ending the chat, they keep it going with flattery. The wrong number was the hook." },
        { text: " 😊" }
      ] },
      { divider: 'Three weeks later' },
      { from: 'them', segments: [
        { text: "Babe, I want a future with you. " },
        { text: "I've made thousands trading crypto and I can show you how", reason: "Once they have your trust, they pitch an investment on a platform they control. The profits you see are fake, and these \"pig butchering\" scams take everything you put in." },
        { text: ". " },
        { text: "Just send $500 to start, it's not risky at all", reason: "Every real investment carries risk. Promised easy returns from someone you've never met in person is a scam." }
      ] }
    ]
  },
  {
    id: 'romance', kind: 'dating', title: 'Romance scam: the sudden emergency', sender: 'Tom · 83 miles away',
    teaser: "“My car broke down and the repair is $1,200. Could you send it as gift cards?”",
    photo: '/static/img/romance.jpg',
    messages: [
      { from: 'them', segments: [
        { text: "I know we only matched last week, but " },
        { text: "I've never felt this way about anyone before", reason: "Intense declarations of love within days of matching, known as love bombing, are how romance scammers build trust fast." },
        { text: " ❤️" }
      ] },
      { from: 'them', segments: [
        { text: "I was finally driving to see you, but " },
        { text: "my car broke down and the repair is $1,200", reason: "A sudden emergency that only money can fix, right before you'd finally meet, is the turning point of nearly every romance scam." },
        { text: ". I can't afford it." }
      ] },
      { from: 'you', text: "Oh no! Could you take an Uber?" },
      { from: 'them', segments: [
        { text: "They don't come out this far 😔 " },
        { text: "Could you send it as gift cards or by Zelle?", reason: "Gift cards, wire transfers, crypto and payment apps are hard to trace and almost impossible to reverse. Someone who cares about you won't ask for money this way." },
        { text: " " },
        { text: "I'll pay you back the moment we meet", reason: "The meeting keeps slipping. There's always another reason they can't show up or video call, and another bill to pay first." },
        { text: "." }
      ] }
    ]
  },
  {
    id: 'delivery', kind: 'sms', title: 'Fake courier / customs fee', sender: 'VK-COURIER',
    teaser: "“Pay a refundable processing fee of Rs 199 within 1 hour to release your delivery.”",
    photo: '/static/img/delivery.jpg',
    segments: [
      { text: "Your parcel is held at customs. " },
      { text: "Pay a refundable processing fee of Rs 199 within 1 hour", reason: "Customs and courier fees are never collected through a text link, and a genuinely 'refundable' fee wouldn't need to be paid under a deadline." },
      { text: " to release your delivery. Track and pay here: " },
      { text: "http://bit.ly/delivery-release", reason: "Shortened links hide the real destination site — legitimate couriers link to their own named domain, not a link shortener." }
    ]
  },
  {
    id: 'job', kind: 'whatsapp', title: 'Fake part-time job offer', sender: 'Unknown number',
    teaser: "“Earn Rs 5000/day! A registration fee of Rs 499 confirms your slot.”",
    photo: '/static/img/job.jpg',
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
    teaser: "“You are under digital arrest. Stay on this video call and do not tell anyone.”",
    photo: '/static/img/arrest.jpg',
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

const CHANNELS = {
  sms: ['Text message', ICONS.sms],
  whatsapp: ['WhatsApp', ICONS.chat],
  dating: ['Dating app', ICONS.heart],
  call: ['Phone call', ICONS.phone],
};

function escapeHtml(str){
  return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// A card shows one message (`segments`) or a conversation (`messages`): each message is
// { from: 'them' | 'you', segments } (or `text` when nothing in it is flagged), or a
// { divider } line marking time passing.
function cardMessages(card){
  return (card.messages || [{ from: 'them', segments: card.segments }])
    .map(msg => msg.divider ? msg : { from: msg.from, segments: msg.segments || [{ text: msg.text }] });
}

// Flagged phrases, numbered in reading order across the whole card.
function flaggedSegments(card){
  const flags = [];
  cardMessages(card).forEach((msg, m) => (msg.segments || []).forEach((seg, i) => {
    if (seg.reason) flags.push({ key: card.id + '-' + m + '-' + i, reason: seg.reason });
  }));
  return flags;
}

function segmentsToHtml(card, m, segments, numbers){
  return segments.map((seg, i) => {
    if (!seg.reason) return escapeHtml(seg.text);
    const key = card.id + '-' + m + '-' + i;
    return '<span class="flag" tabindex="0" role="button" data-card="' + card.id + '" data-legend="' + key + '">' +
      escapeHtml(seg.text) + '<sup>' + numbers[key] + '</sup></span>';
  }).join('');
}

function deviceChrome(card){
  if (card.kind === 'dating') {
    return '<div class="device-status"><span>9:41</span><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>' +
      '<div class="app-bar dating">' + ICONS.heart + '<span>Dating app</span><span class="app-bar-meta">' + escapeHtml(card.sender) + '</span></div>';
  }
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
  const numbers = Object.fromEntries(flaggedSegments(card).map((f, idx) => [f.key, idx + 1]));
  const messages = cardMessages(card);
  if (card.kind === 'call') {
    return '<div class="call-screen">' +
      '<div class="call-avatar">' + ICONS.caller + '</div>' +
      '<p class="call-name">' + escapeHtml(card.sender) + '</p>' +
      '<p class="call-meta">Spoofed caller ID · 03:42</p>' +
      '<div class="call-live"><span class="pulse-dot"></span>Live captions</div>' +
      '<div class="caption-box">' + segmentsToHtml(card, 0, messages[0].segments, numbers) + '</div>' +
    '</div>';
  }
  return '<div class="thread">' + messages.map((msg, m) => {
    if (msg.divider) return '<p class="thread-divider">' + escapeHtml(msg.divider) + '</p>';
    const bubbleHtml = segmentsToHtml(card, m, msg.segments, numbers);
    return msg.from === 'you'
      ? '<div class="msg-row you"><div class="bubble you">' + bubbleHtml + '</div></div>'
      : '<div class="msg-row"><div class="avatar">' + ICONS.person + '</div><div class="bubble">' + bubbleHtml + '</div></div>';
  }).join('') + '</div>';
}

function renderGallery(){
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  GALLERY.forEach(card => {
    const el = document.createElement('article');
    el.className = 'scam-card reveal';

    const flags = flaggedSegments(card);
    const legendHtml = flags.map((flag, idx) => (
      '<div class="legend-item" id="' + flag.key + '-row">' +
        '<span class="legend-num">' + (idx + 1) + '</span>' +
        '<p class="legend-text">' + escapeHtml(flag.reason) + '</p>' +
      '</div>'
    )).join('');
    const [channel, channelIcon] = CHANNELS[card.kind];

    el.innerHTML =
      '<div class="scam-cover">' +
        '<img src="' + card.photo + '" alt="" loading="lazy">' +
        '<span class="scam-channel">' + channelIcon + escapeHtml(channel) + '</span>' +
      '</div>' +
      '<div class="scam-body">' +
        '<h2 class="scam-title">' + escapeHtml(card.title) + '</h2>' +
        '<p class="scam-teaser">' + escapeHtml(card.teaser) + '</p>' +
      '</div>' +
      '<details class="scam-more">' +
        '<summary>' +
          '<span class="more-closed">Learn more</span><span class="more-open">Show less</span>' +
          '<span class="more-count">' + flags.length + ' red flags</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
        '</summary>' +
        '<div class="scam-full">' +
          '<div class="device">' + deviceChrome(card) + '<div class="device-body">' + deviceBody(card) + '</div></div>' +
          '<div class="legend">' + legendHtml + '</div>' +
        '</div>' +
      '</details>';

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
    flag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flag.click(); }
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
