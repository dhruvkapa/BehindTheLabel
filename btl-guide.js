/**
 * Behind The Label — Ada AI Guide
 * Avatar: Isometric Ethics Gem
 * Animations: floating bob + eye blink
 * Position: bottom-right, above camera + search FABs
 */
(function () {
  'use strict';

  const GROQ_KEY = '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';
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const SITE_BASE = 'https://behindthelabel.page.gd';

  const SYSTEM_PROMPT = `You are Ada, the friendly AI guide for "Behind The Label" — a Canadian student-led project fighting forced labour in global fashion supply chains.

SITE PAGES (always use the full URL when linking):
- Home: ${SITE_BASE}/index.html — Stats, browser extension info, team, live forced-labour map, brand ethics search (🔍 button), camera brand scanner
- Ethical Swap: ${SITE_BASE}/swap.html — Type any brand → get 3 ethical alternatives with ethics scores, certifications, price comparisons
- Rewards: ${SITE_BASE}/rewards.html — Ethical brands offering discounts to conscious shoppers — interest registration form
- Petition: ${SITE_BASE}/petition.html — Sign and demand supply chain transparency from fashion brands
- Learn More: ${SITE_BASE}/forced-labour.html — Deep dive into ILO data, Walk Free Foundation stats, US DOL TVPRA list

KEY FACTS:
- 27.6 million people in forced labour globally (ILO 2022)
- 160 million children in child labour worldwide
- Fashion is one of the worst offending industries
- The BTL browser extension gives real-time ethics ratings while you shop online

PERSONALITY: Warm, concise (2–4 sentences), action-oriented. Never preachy. Always suggest what the user can DO next.

NAVIGATION: When directing users to a page, ALWAYS format links as markdown: [Page Name](full_url). For example: [Petition page](https://behindthelabel.page.gd/petition.html) or [Learn More](https://behindthelabel.page.gd/forced-labour.html). Never write out a raw URL on its own. Always wrap every link in markdown format so it becomes a clickable hyperlink.`;

  const QUICK_PROMPTS = [
    'What is Behind The Label?',
    'How do I find ethical brands?',
    'Show me the petition',
    'What is the Ethical Swap?',
    'How bad is fast fashion?',
  ];

  const GREETINGS = [
    "Hi! I'm Ada 💎 I help you navigate Behind The Label. Want to search a brand, find ethical alternatives, or learn about forced labour in fashion?",
    "Hey! I'm Ada — your ethical guide. Ask me anything about the site, or let me find you ethical brands. 💎",
    "Hello! I'm Ada 💎 Behind The Label fights forced labour in fashion. Want me to show you around?",
  ];

  /* ── STYLES ─────────────────────────────────────────────────── */
  const css = `
    /* Wrap — bottom-right, above the camera + search FABs */
    #ada-wrap {
      position: fixed;
      bottom: calc(2rem + 50px + 0.8rem + 50px + 1.2rem);
      right: 2rem;
      z-index: 8000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.6rem;
      pointer-events: none;
    }

    /* ── Gem button ──────────────────────────────────────────── */
    #ada-gem-btn {
      width: 58px;
      height: 58px;
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      pointer-events: all;
      position: relative;
      animation: adaBob 3s ease-in-out infinite;
      filter: drop-shadow(0 6px 16px rgba(192,57,43,0.5));
      transition: filter 0.25s;
      -webkit-tap-highlight-color: transparent;
    }
    #ada-gem-btn:hover {
      filter: drop-shadow(0 10px 28px rgba(231,76,60,0.85));
      animation-play-state: paused;
    }
    #ada-gem-btn.chat-open {
      filter: drop-shadow(0 10px 28px rgba(231,76,60,0.85));
      animation-play-state: paused;
    }
    @keyframes adaBob {
      0%,100% { transform: translateY(0px)   rotate(-1.5deg); }
      50%      { transform: translateY(-9px)  rotate(1.5deg);  }
    }

    /* notification dot */
    #ada-notif-dot {
      display: none;
      position: absolute;
      top: -2px; right: -2px;
      width: 12px; height: 12px;
      background: #e74c3c;
      border: 2px solid #080808;
      border-radius: 50%;
      animation: adaNotifPop 1.8s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes adaNotifPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }

    /* ── Teaser bubble ───────────────────────────────────────── */
    #ada-teaser {
      background: #111;
      border: 1px solid #2c2c2c;
      border-top: 2px solid #c0392b;
      padding: 0.65rem 1.9rem 0.65rem 0.9rem;
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 0.74rem;
      color: #d9d0bc;
      line-height: 1.55;
      max-width: 210px;
      pointer-events: all;
      cursor: pointer;
      box-shadow: 0 8px 28px rgba(0,0,0,0.75);
      position: relative;
      /* enter animation */
      animation: adaTeaserIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    /* speech-bubble tail */
    #ada-teaser::after {
      content: '';
      position: absolute;
      bottom: -8px; right: 18px;
      border-left: 8px solid transparent;
      border-top: 8px solid #2c2c2c;
    }
    #ada-teaser:hover { border-color: #c0392b; }
    #ada-teaser:hover::after { border-top-color: #c0392b; }

    /* progress bar that drains over 30 s */
    #ada-teaser-bar {
      position: absolute;
      bottom: 0; left: 0;
      height: 2px;
      background: #c0392b;
      width: 100%;
      transform-origin: left center;
      animation: adaBarDrain 30s linear forwards;
    }
    @keyframes adaBarDrain { to { transform: scaleX(0); } }

    /* subtle attention-wiggle that runs every ~4 s */
    #ada-teaser.wiggle {
      animation: adaTeaserWiggle 0.5s ease;
    }
    @keyframes adaTeaserWiggle {
      0%,100% { transform: rotate(0deg); }
      20%      { transform: rotate(-3deg); }
      40%      { transform: rotate(3deg); }
      60%      { transform: rotate(-2deg); }
      80%      { transform: rotate(2deg); }
    }

    @keyframes adaTeaserIn {
      from { opacity:0; transform:translateY(10px) scale(0.88); }
      to   { opacity:1; transform:translateY(0)    scale(1);    }
    }
    /* fade-out before removal */
    #ada-teaser.fade-out {
      animation: adaTeaserOut 0.35s ease forwards;
    }
    @keyframes adaTeaserOut {
      to { opacity:0; transform:translateY(6px) scale(0.92); }
    }

    #ada-teaser-close {
      position: absolute; top: 5px; right: 8px;
      background: none; border: none;
      color: #5a5a5a; font-size: 0.65rem;
      cursor: pointer; padding: 2px; line-height:1;
    }
    #ada-teaser-close:hover { color: #f0ebe0; }

    /* ── Chat panel ──────────────────────────────────────────── */
    #ada-chat {
      width: 300px;
      background: #111;
      border: 1px solid #2c2c2c;
      border-top: 2px solid #c0392b;
      box-shadow: 0 20px 60px rgba(0,0,0,0.9);
      display: none;
      flex-direction: column;
      max-height: 440px;
      pointer-events: all;
    }
    #ada-chat.open {
      display: flex;
      animation: adaChatIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    @keyframes adaChatIn {
      from { opacity:0; transform:scale(0.9) translateY(10px); }
      to   { opacity:1; transform:scale(1)   translateY(0);    }
    }

    /* header */
    #ada-chat-header {
      display:flex; align-items:center; gap:0.55rem;
      padding: 0.65rem 0.9rem;
      background: #191919;
      border-bottom: 1px solid #222;
      flex-shrink:0;
    }
    .ada-hdr-gem { width:22px; height:22px; flex-shrink:0; }
    .ada-hdr-name {
      font-family:'DM Mono',monospace;
      font-size:0.58rem; letter-spacing:0.2em;
      text-transform:uppercase; color:#f0ebe0; flex:1;
    }
    .ada-hdr-status {
      font-family:'DM Mono',monospace;
      font-size:0.48rem; letter-spacing:0.1em;
      text-transform:uppercase; color:#c0392b;
      display:flex; align-items:center; gap:0.3rem;
    }
    .ada-hdr-status::before {
      content:''; width:5px; height:5px;
      background:#c0392b; border-radius:50%;
      animation: adaPulse 2s ease-in-out infinite;
    }
    @keyframes adaPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
    #ada-chat-x {
      background:none; border:none; color:#5a5a5a;
      font-size:1rem; cursor:pointer; padding:0 0.2rem;
      transition:color 0.2s;
    }
    #ada-chat-x:hover { color:#f0ebe0; }

    /* messages */
    #ada-messages {
      flex:1; overflow-y:auto;
      padding: 0.9rem; display:flex;
      flex-direction:column; gap:0.75rem;
      scroll-behavior:smooth;
    }
    #ada-messages::-webkit-scrollbar { width:3px; }
    #ada-messages::-webkit-scrollbar-thumb { background:#2a2a2a; }

    .ada-row { display:flex; gap:0.45rem; align-items:flex-start; animation:adaMsgIn 0.2s ease forwards; }
    @keyframes adaMsgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
    .ada-row.user-row { flex-direction:row-reverse; }
    .ada-bubble {
      max-width:84%; padding:0.55rem 0.75rem;
      font-family:'Libre Baskerville',Georgia,serif;
      font-size:0.76rem; line-height:1.65; color:#d9d0bc;
    }
    .ada-row .ada-bubble { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:0 8px 8px 8px; }
    .ada-row.user-row .ada-bubble { background:#c0392b; color:#f0ebe0; border:none; border-radius:8px 0 8px 8px; }
    .ada-row-icon { width:18px; height:18px; flex-shrink:0; margin-top:3px; }

    .ada-typing-row .ada-bubble { display:flex; gap:4px; align-items:center; padding:0.7rem 0.9rem; }
    .ada-dot { width:5px; height:5px; background:#5a5a5a; border-radius:50%; animation:adaDot 1.2s infinite; }
    .ada-dot:nth-child(2){animation-delay:.2s}
    .ada-dot:nth-child(3){animation-delay:.4s}
    @keyframes adaDot { 0%,60%,100%{transform:translateY(0);opacity:0.35} 30%{transform:translateY(-5px);opacity:1} }

    /* quick chips */
    #ada-chips {
      padding:0.45rem 0.7rem; display:flex; flex-wrap:wrap; gap:0.3rem;
      border-top:1px solid #1c1c1c; flex-shrink:0;
    }
    .ada-chip {
      font-family:'DM Mono',monospace; font-size:0.48rem;
      letter-spacing:0.08em; text-transform:uppercase;
      color:#5a5a5a; border:1px solid #2a2a2a;
      padding:0.2rem 0.5rem; background:none; cursor:pointer;
      transition:border-color 0.2s, color 0.2s; white-space:nowrap;
    }
    .ada-chip:hover { border-color:#c0392b; color:#f0ebe0; }

    /* input */
    #ada-input-row { display:flex; border-top:1px solid #222; flex-shrink:0; }
    #ada-input {
      flex:1; background:#0d0d0d; border:none;
      padding:0.65rem 0.8rem; color:#f0ebe0;
      font-family:'Libre Baskerville',Georgia,serif;
      font-size:0.76rem; outline:none;
    }
    #ada-input::placeholder { color:#333; }
    #ada-send {
      background:#c0392b; border:none; color:#f0ebe0;
      padding:0 1rem; font-size:1rem; cursor:pointer;
      transition:background 0.2s; flex-shrink:0;
    }
    #ada-send:hover { background:#e74c3c; }

    @media(max-width:480px){
      #ada-wrap {
        bottom: calc(1rem + 44px + 0.8rem + 44px + 1rem);
        right: 1rem;
      }
      #ada-chat { width:calc(100vw - 2.2rem); }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── GEM SVG ─────────────────────────────────────────────────
     Two states: eyes open vs closed (blink)
     Left-eye and right-eye <g> tags have stable IDs so we can
     swap their content without re-rendering the whole SVG.
  ─────────────────────────────────────────────────────────────── */
  const GEM_OPEN = `
<svg id="ada-gem-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="58" height="58">
  <!-- bottom tip -->
  <path d="M50 95 L26 66 L50 76 Z" fill="#7b1e14"/>
  <path d="M50 95 L50 76 L74 66 Z" fill="#a52a1e"/>
  <!-- mid left -->
  <path d="M26 66 L18 42 L50 54 L50 76 Z" fill="#c0392b"/>
  <!-- mid right -->
  <path d="M50 76 L50 54 L82 42 L74 66 Z" fill="#9b2c1e"/>
  <!-- upper left -->
  <path d="M18 42 L36 20 L50 54 Z" fill="#e74c3c"/>
  <!-- upper right -->
  <path d="M50 54 L64 20 L82 42 Z" fill="#b03020"/>
  <!-- top-left facet -->
  <path d="M36 20 L50 11 L50 54 Z" fill="#f05040"/>
  <!-- top-right facet -->
  <path d="M50 11 L64 20 L50 54 Z" fill="#d04030"/>
  <!-- crown -->
  <path d="M36 20 L50 11 L64 20 L50 15 Z" fill="#ff7060"/>
  <!-- inner glints -->
  <path d="M50 54 L36 20 L44 37 Z" fill="white" opacity="0.07"/>
  <path d="M50 54 L50 11 L54 33 Z" fill="white" opacity="0.05"/>
  <!-- left eye open -->
  <g id="gem-eye-L">
    <ellipse cx="34" cy="66" rx="4.5" ry="3.8" fill="white" opacity="0.92"/>
    <ellipse cx="34" cy="66" rx="2.6" ry="2.4" fill="#c0392b"/>
    <circle  cx="34" cy="66" r="1.3"  fill="#0a0000"/>
    <circle  cx="35" cy="64.8" r="0.7" fill="white"/>
  </g>
  <!-- right eye open -->
  <g id="gem-eye-R">
    <ellipse cx="48" cy="72" rx="4.5" ry="3.8" fill="white" opacity="0.92"/>
    <ellipse cx="48" cy="72" rx="2.6" ry="2.4" fill="#c0392b"/>
    <circle  cx="48" cy="72" r="1.3"  fill="#0a0000"/>
    <circle  cx="49" cy="70.8" r="0.7" fill="white"/>
  </g>
  <!-- smile -->
  <path d="M30 78 Q41 84.5 52 79" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.85"/>
  <!-- sparkles -->
  <path d="M82 28 L84 22 L86 28 L84 34 Z" fill="#e74c3c" opacity="0.85"/>
  <path d="M79 26 L84 22 L89 26 L84 30 Z" fill="#e74c3c" opacity="0.85"/>
  <path d="M10 40 L12 34 L14 40 L12 46 Z" fill="#b8923a" opacity="0.75"/>
  <path d="M7 38 L12 34 L17 38 L12 42 Z" fill="#b8923a" opacity="0.75"/>
</svg>`;

  /* closed-eye replacement HTML (just the two <g> contents) */
  const EYE_CLOSED_L = `<path d="M30 65.5 Q34 62.5 38 65.5" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.9"/>`;
  const EYE_CLOSED_R = `<path d="M44 71.5 Q48 68.5 52 71.5" stroke="white" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.9"/>`;

  /* tiny gem for chat header / message icon */
  const GEM_MINI = `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <path d="M50 95 L26 66 L50 76 Z" fill="#7b1e14"/>
  <path d="M50 95 L50 76 L74 66 Z" fill="#a52a1e"/>
  <path d="M26 66 L18 42 L50 54 L50 76 Z" fill="#c0392b"/>
  <path d="M50 76 L50 54 L82 42 L74 66 Z" fill="#9b2c1e"/>
  <path d="M18 42 L36 20 L50 54 Z" fill="#e74c3c"/>
  <path d="M50 54 L64 20 L82 42 Z" fill="#b03020"/>
  <path d="M36 20 L50 11 L50 54 Z" fill="#f05040"/>
  <path d="M50 11 L64 20 L50 54 Z" fill="#d04030"/>
  <path d="M36 20 L50 11 L64 20 L50 15 Z" fill="#ff7060"/>
</svg>`;

  /* ── BUILD DOM ───────────────────────────────────────────────── */
  const wrap = document.createElement('div');
  wrap.id = 'ada-wrap';
  wrap.innerHTML = `
    <!-- Chat panel -->
    <div id="ada-chat">
      <div id="ada-chat-header">
        <div class="ada-hdr-gem">${GEM_MINI}</div>
        <span class="ada-hdr-name">Ada — BTL Guide</span>
        <span class="ada-hdr-status">Online</span>
        <button id="ada-chat-x">✕</button>
      </div>
      <div id="ada-messages"></div>
      <div id="ada-chips"></div>
      <div id="ada-input-row">
        <input id="ada-input" type="text" placeholder="Ask me anything…" autocomplete="off"/>
        <button id="ada-send">→</button>
      </div>
    </div>

    <!-- Gem avatar button -->
    <div style="position:relative;pointer-events:all;align-self:flex-end;">
      <button id="ada-gem-btn" aria-label="Chat with Ada">${GEM_OPEN}</button>
      <div id="ada-notif-dot"></div>
    </div>
  `;
  document.body.appendChild(wrap);

  /* ── REFS ────────────────────────────────────────────────────── */
  const chatEl   = wrap.querySelector('#ada-chat');
  const msgsEl   = wrap.querySelector('#ada-messages');
  const inputEl  = wrap.querySelector('#ada-input');
  const sendBtn  = wrap.querySelector('#ada-send');
  const closeBtn = wrap.querySelector('#ada-chat-x');
  const gemBtn   = wrap.querySelector('#ada-gem-btn');
  const notifDot = wrap.querySelector('#ada-notif-dot');
  const chipsEl  = wrap.querySelector('#ada-chips');

  let isOpen   = false;
  let isBusy   = false;
  let greeted  = false;
  let history  = [];

  /* ── BLINK ───────────────────────────────────────────────────── */
  function blink () {
    const svg  = document.getElementById('ada-gem-svg');
    if (!svg) return;
    const eyeL = svg.querySelector('#gem-eye-L');
    const eyeR = svg.querySelector('#gem-eye-R');
    if (!eyeL || !eyeR) return;
    // close eyes
    eyeL.innerHTML = EYE_CLOSED_L;
    eyeR.innerHTML = EYE_CLOSED_R;
    // reopen after 150 ms
    setTimeout(() => {
      const s2 = document.getElementById('ada-gem-svg');
      if (!s2) return;
      const l2 = s2.querySelector('#gem-eye-L');
      const r2 = s2.querySelector('#gem-eye-R');
      if (l2) l2.innerHTML = `
        <ellipse cx="34" cy="66" rx="4.5" ry="3.8" fill="white" opacity="0.92"/>
        <ellipse cx="34" cy="66" rx="2.6" ry="2.4" fill="#c0392b"/>
        <circle  cx="34" cy="66" r="1.3"  fill="#0a0000"/>
        <circle  cx="35" cy="64.8" r="0.7" fill="white"/>`;
      if (r2) r2.innerHTML = `
        <ellipse cx="48" cy="72" rx="4.5" ry="3.8" fill="white" opacity="0.92"/>
        <ellipse cx="48" cy="72" rx="2.6" ry="2.4" fill="#c0392b"/>
        <circle  cx="48" cy="72" r="1.3"  fill="#0a0000"/>
        <circle  cx="49" cy="70.8" r="0.7" fill="white"/>`;
    }, 150);
  }

  function scheduleBlink () {
    setTimeout(() => { blink(); scheduleBlink(); }, 2800 + Math.random() * 3400);
  }
  scheduleBlink();

  /* ── QUICK CHIPS ─────────────────────────────────────────────── */
  QUICK_PROMPTS.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'ada-chip';
    btn.textContent = q;
    btn.addEventListener('click', () => send(q));
    chipsEl.appendChild(btn);
  });

  /* ── OPEN / CLOSE ────────────────────────────────────────────── */
  function open () {
    isOpen = true;
    chatEl.classList.add('open');
    gemBtn.classList.add('chat-open');
    notifDot.style.display = 'none';
    removeTeaserEl();
    if (!greeted) {
      greeted = true;
      const g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setTimeout(() => addMsg('ada', g), 260);
    }
    setTimeout(() => inputEl.focus(), 360);
  }

  function close () {
    isOpen = false;
    chatEl.classList.remove('open');
    gemBtn.classList.remove('chat-open');
  }

  gemBtn.addEventListener('click', () => isOpen ? close() : open());
  closeBtn.addEventListener('click', close);

  /* ── TEASER (shows immediately, lives for 30 s) ─────────────── */
  const TEASER_MSGS = [
    "👋 Click me — I can help you find ethical brands!",
    "💎 Hi! Ask me anything about fashion & forced labour.",
    "🔍 Want to know if your brand is ethical? Ask Ada!",
    "💬 Tap me — I'm Ada, your ethical shopping guide.",
    "⚡ I can find ethical swaps for any brand — click me!",
  ];
  let teaserMsgIndex = 0;
  let teaserWiggleTimer = null;
  let teaserAutoClose = null;

  function removeTeaserEl () {
    const t = document.getElementById('ada-teaser');
    if (!t) return;
    clearInterval(teaserWiggleTimer);
    clearTimeout(teaserAutoClose);
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 360);
    notifDot.style.display = 'none';
  }

  setTimeout(() => {
    if (isOpen || greeted) return;

    const t = document.createElement('div');
    t.id = 'ada-teaser';

    const msgSpan = document.createElement('span');
    msgSpan.id = 'ada-teaser-msg';
    msgSpan.textContent = TEASER_MSGS[0];

    const closeX = document.createElement('button');
    closeX.id = 'ada-teaser-close';
    closeX.setAttribute('aria-label', 'Dismiss');
    closeX.textContent = '✕';

    const bar = document.createElement('div');
    bar.id = 'ada-teaser-bar';

    t.appendChild(closeX);
    t.appendChild(msgSpan);
    t.appendChild(bar);

    // click bubble → open chat
    t.addEventListener('click', e => {
      if (e.target === closeX) { removeTeaserEl(); return; }
      removeTeaserEl();
      open();
    });

    wrap.insertBefore(t, wrap.children[1]);
    notifDot.style.display = 'block';

    // Rotate message text every 6 s
    const msgTimer = setInterval(() => {
      if (!document.getElementById('ada-teaser')) { clearInterval(msgTimer); return; }
      teaserMsgIndex = (teaserMsgIndex + 1) % TEASER_MSGS.length;
      const span = document.getElementById('ada-teaser-msg');
      if (span) {
        span.style.opacity = '0';
        span.style.transition = 'opacity 0.25s';
        setTimeout(() => {
          if (span) { span.textContent = TEASER_MSGS[teaserMsgIndex]; span.style.opacity = '1'; }
        }, 260);
      }
    }, 6000);

    // Wiggle every ~5 s to draw attention
    teaserWiggleTimer = setInterval(() => {
      const el = document.getElementById('ada-teaser');
      if (!el) { clearInterval(teaserWiggleTimer); return; }
      el.classList.remove('wiggle');
      void el.offsetWidth; // reflow to restart animation
      el.classList.add('wiggle');
    }, 5000);

    // Auto-dismiss after 30 s
    teaserAutoClose = setTimeout(() => removeTeaserEl(), 30000);

  }, 1200); // show quickly — 1.2 s after page load

  /* ── MESSAGES ────────────────────────────────────────────────── */
  function parseMarkdown (text) {
    // 1. Convert markdown [label](url) → clickable <a>
    let html = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" style="color:#c0392b;text-decoration:underline;font-weight:600;">$1</a>');
    // 2. Convert any remaining bare https:// URLs → clickable <a> (fallback)
    html = html.replace(/(?<!['"=])(https?:\/\/[^\s<)"]+)/g,
      '<a href="$1" target="_blank" rel="noopener" style="color:#c0392b;text-decoration:underline;font-weight:600;">$1</a>');
    return html;
  }

  function addMsg (role, text) {
    const row = document.createElement('div');
    row.className = `ada-row ${role === 'user' ? 'user-row' : ''}`;
    const html = role === 'ada' ? parseMarkdown(text) : text;
    if (role === 'ada') {
      row.innerHTML = `<div class="ada-row-icon">${GEM_MINI}</div><div class="ada-bubble">${html}</div>`;
    } else {
      row.innerHTML = `<div class="ada-bubble">${html}</div>`;
    }
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function showTyping () {
    const row = document.createElement('div');
    row.className = 'ada-row ada-typing-row';
    row.id = 'ada-typing';
    row.innerHTML = `<div class="ada-row-icon">${GEM_MINI}</div>
      <div class="ada-bubble">
        <span class="ada-dot"></span>
        <span class="ada-dot"></span>
        <span class="ada-dot"></span>
      </div>`;
    msgsEl.appendChild(row);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function hideTyping () {
    const t = document.getElementById('ada-typing');
    if (t) t.remove();
  }

  /* ── SEND ────────────────────────────────────────────────────── */
  async function send (text) {
    text = (text || inputEl.value).trim();
    if (!text || isBusy) return;
    inputEl.value = '';
    addMsg('user', text);
    history.push({ role: 'user', content: text });
    isBusy = true;
    sendBtn.disabled = true;
    showTyping();

    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastErr = null;

    while (attempt <= MAX_RETRIES) {
      try {
        const res = await fetch(GROQ_URL, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
          body   : JSON.stringify({
            model      : 'llama-3.3-70b-versatile',
            max_tokens : 300,
            temperature: 0.7,
            messages   : [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          }),
        });
        const data = await res.json();
        if (data.error) {
          // Auth error — don't retry
          if (res.status === 401 || res.status === 403) {
            throw new Error('__auth__');
          }
          // Rate limit — wait then retry
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            attempt++;
            continue;
          }
          throw new Error(data.error.message);
        }
        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Please try again!";
        history.push({ role: 'assistant', content: reply });
        hideTyping();
        addMsg('ada', reply);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        if (err.message === '__auth__' || attempt >= MAX_RETRIES) break;
        attempt++;
        await new Promise(r => setTimeout(r, 800));
      }
    }

    if (lastErr) {
      hideTyping();
      const msg = lastErr.message === '__auth__'
        ? "I'm having a connection issue right now. In the meantime — you can [explore the site](index.html), [read the evidence](forced-labour.html), or [sign the petition](petition.html)! 💎"
        : "I'm having trouble connecting right now. Please try again in a moment, or explore the site yourself! 💎";
      addMsg('ada', msg);
      console.warn('[Ada]', lastErr);
    }

    isBusy = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  sendBtn.addEventListener('click', () => send());
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

})();
