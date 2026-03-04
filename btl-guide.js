/**
 * Behind The Label — AI Guide "Ada"
 * A floating activist character that helps users navigate the site
 * and answers questions using Groq AI with site context.
 *
 * Usage: <script src="btl-guide.js"></script> at bottom of any page
 */

(function() {
  'use strict';

  const GROQ_KEY = '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';
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

  const SITE_CONTEXT = `You are Ada, the friendly AI guide for "Behind The Label" — a Canadian student-led awareness project fighting forced labour and child exploitation in global fashion supply chains.

SITE PAGES & WHAT THEY DO:
- Home (index.html): Main site with stats, how the browser extension works, team info, live map of forced labour hotspots, and a brand ethics search modal (🔍 button)
- Ethical Swap (swap.html): AI tool — user types any brand, gets 3 ethical alternatives with ethics scores, certifications, and price comparisons
- Rewards (rewards.html): Future program where ethical brands offer discounts to conscious shoppers. Has an interest registration form
- Petition (petition.html): Open petition for users to sign and demand supply chain transparency from brands
- Learn More (forced-labour.html): Deep dive into forced labour statistics, the ILO framework, Walk Free Foundation data, US DOL TVPRA list

KEY FACTS ABOUT THE PROJECT:
- 27.6 million people are in forced labour globally (ILO 2022)
- 160 million children are in child labour worldwide
- Fashion is one of the worst industries for forced labour
- The BTL browser extension scans brands as you shop online and gives real-time ethics ratings
- Users can sign the petition, use the Ethical Swap engine, or join the Rewards waitlist
- The project uses AI to analyse brand supply chains against ILO standards, Walk Free Foundation data, and the US DOL TVPRA list

YOUR PERSONALITY:
- Warm, passionate, and knowledgeable — like a smart friend who cares deeply about ethics
- Concise — keep responses to 2-4 sentences max unless asked for detail
- Action-oriented — always suggest what the user can DO next
- Never preachy — inform, don't lecture
- You can navigate users by saying things like "Head to our Ethical Swap page" or "Click the 🔍 button on the home page"

NAVIGATION YOU CAN SUGGEST:
- To search a brand: "click the 🔍 button floating on the home page"
- To find ethical alternatives: "try our Ethical Swap tool at swap.html"
- To sign the petition: "head to petition.html"
- To learn more: "check out our Learn More page at forced-labour.html"
- To join Rewards: "visit rewards.html and register your interest"

Always be helpful, brief, and guide users toward taking action.`;

  const QUICK_PROMPTS = [
    "What is Behind The Label?",
    "How do I find ethical brands?",
    "Show me the petition",
    "What's the Ethical Swap tool?",
    "How bad is fast fashion?",
  ];

  const GREETINGS = [
    "Hi! I'm Ada 👋 I help you navigate Behind The Label. Want to scan a brand, find ethical alternatives, or learn about forced labour in fashion?",
    "Hey there! I'm Ada, your guide here. Ask me anything — I can help you find ethical brands, sign the petition, or understand the issue. 👗",
    "Hello! I'm Ada 👋 Behind The Label is fighting forced labour in fashion. Want me to show you around?",
  ];

  // ── Inject styles ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    /* Ada avatar */
    #btl-ada-wrap {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 8000;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.8rem;
      pointer-events: none;
    }

    /* Chat panel */
    #btl-chat {
      width: 320px;
      background: #111;
      border: 1px solid #2c2c2c;
      border-top: 2px solid #e74c3c;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8);
      display: none;
      flex-direction: column;
      pointer-events: all;
      max-height: 480px;
      animation: adaChatIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    #btl-chat.open { display: flex; }
    @keyframes adaChatIn {
      from { opacity: 0; transform: translateY(16px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    #btl-chat-header {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.8rem 1rem;
      background: #1a1a1a;
      border-bottom: 1px solid #2c2c2c;
      flex-shrink: 0;
    }
    #btl-chat-header .ada-mini {
      width: 28px; height: 28px;
      background: #e74c3c;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; flex-shrink: 0;
    }
    #btl-chat-header .ada-name {
      font-family: 'DM Mono', monospace;
      font-size: 0.62rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #f0ebe0;
      flex: 1;
    }
    #btl-chat-header .ada-status {
      font-family: 'DM Mono', monospace;
      font-size: 0.5rem;
      letter-spacing: 0.1em;
      color: #27ae60;
      text-transform: uppercase;
      display: flex; align-items: center; gap: 0.3rem;
    }
    #btl-chat-header .ada-status::before {
      content: '';
      width: 5px; height: 5px;
      background: #27ae60;
      border-radius: 50%;
      animation: adaPulse 2s ease-in-out infinite;
    }
    @keyframes adaPulse {
      0%,100% { opacity: 1; } 50% { opacity: 0.3; }
    }
    #btl-chat-close {
      background: none; border: none;
      color: #5a5a5a; font-size: 1rem;
      padding: 0.2rem 0.4rem;
      transition: color 0.2s; cursor: pointer;
    }
    #btl-chat-close:hover { color: #f0ebe0; }

    #btl-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      scroll-behavior: smooth;
    }
    #btl-chat-messages::-webkit-scrollbar { width: 3px; }
    #btl-chat-messages::-webkit-scrollbar-track { background: #111; }
    #btl-chat-messages::-webkit-scrollbar-thumb { background: #2c2c2c; }

    .ada-msg {
      display: flex;
      gap: 0.6rem;
      align-items: flex-start;
      animation: adaMsgIn 0.25s ease forwards;
    }
    @keyframes adaMsgIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ada-msg.user { flex-direction: row-reverse; }

    .ada-msg .bubble {
      max-width: 80%;
      padding: 0.65rem 0.85rem;
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 0.78rem;
      line-height: 1.65;
      color: #d9d0bc;
    }
    .ada-msg.ada .bubble {
      background: #1a1a1a;
      border: 1px solid #2c2c2c;
      border-radius: 0 8px 8px 8px;
    }
    .ada-msg.user .bubble {
      background: #c0392b;
      color: #f0ebe0;
      border-radius: 8px 0 8px 8px;
    }
    .ada-msg .avatar {
      width: 22px; height: 22px;
      background: #e74c3c;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; flex-shrink: 0; margin-top: 2px;
    }

    /* Typing indicator */
    .ada-typing .bubble {
      display: flex; align-items: center; gap: 4px;
      padding: 0.75rem 1rem;
    }
    .ada-typing .dot {
      width: 5px; height: 5px;
      background: #5a5a5a;
      border-radius: 50%;
      animation: adaDot 1.2s ease-in-out infinite;
    }
    .ada-typing .dot:nth-child(2) { animation-delay: 0.2s; }
    .ada-typing .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes adaDot {
      0%,60%,100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    /* Quick prompts */
    #btl-quick-prompts {
      padding: 0.6rem 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      border-top: 1px solid #1a1a1a;
      flex-shrink: 0;
    }
    .ada-chip {
      font-family: 'DM Mono', monospace;
      font-size: 0.52rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #5a5a5a;
      border: 1px solid #2c2c2c;
      padding: 0.25rem 0.6rem;
      background: none;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
      white-space: nowrap;
    }
    .ada-chip:hover { border-color: #e74c3c; color: #f0ebe0; }

    /* Input row */
    #btl-chat-input-row {
      display: flex;
      border-top: 1px solid #2c2c2c;
      flex-shrink: 0;
    }
    #btl-chat-input {
      flex: 1;
      background: #0d0d0d;
      border: none;
      padding: 0.75rem 1rem;
      color: #f0ebe0;
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 0.78rem;
      outline: none;
    }
    #btl-chat-input::placeholder { color: #3a3a3a; }
    #btl-chat-send {
      background: #c0392b;
      border: none;
      color: #f0ebe0;
      padding: 0 1rem;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    #btl-chat-send:hover { background: #e74c3c; }

    /* Speech bubble teaser */
    #btl-ada-teaser {
      background: #111;
      border: 1px solid #2c2c2c;
      border-radius: 12px 12px 0 12px;
      padding: 0.7rem 1rem;
      font-family: 'Libre Baskerville', Georgia, serif;
      font-size: 0.75rem;
      color: #d9d0bc;
      line-height: 1.5;
      max-width: 220px;
      pointer-events: all;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(0,0,0,0.6);
      animation: adaTeaserIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
      position: relative;
    }
    #btl-ada-teaser::after {
      content: '';
      position: absolute;
      bottom: -8px; right: 14px;
      width: 0; height: 0;
      border-left: 8px solid transparent;
      border-right: 0px solid transparent;
      border-top: 8px solid #2c2c2c;
    }
    #btl-ada-teaser:hover { border-color: #e74c3c; }
    @keyframes adaTeaserIn {
      from { opacity: 0; transform: translateY(10px) scale(0.9); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    #btl-ada-teaser-dismiss {
      position: absolute; top: 4px; right: 8px;
      background: none; border: none; color: #5a5a5a;
      font-size: 0.7rem; cursor: pointer; padding: 2px;
      line-height: 1;
    }
    #btl-ada-teaser-dismiss:hover { color: #f0ebe0; }

    /* The character button */
    #btl-ada-btn {
      width: 56px; height: 56px;
      background: #1a1a1a;
      border: 2px solid #c0392b;
      border-radius: 50%;
      cursor: pointer;
      pointer-events: all;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 20px rgba(192,57,43,0.3);
      overflow: hidden;
      flex-shrink: 0;
    }
    #btl-ada-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(231,76,60,0.5);
    }
    #btl-ada-btn.open {
      border-color: #e74c3c;
      box-shadow: 0 6px 28px rgba(231,76,60,0.5);
    }
    #btl-ada-btn svg {
      width: 100%; height: 100%;
    }

    /* Notification dot */
    #btl-ada-notif {
      position: absolute;
      top: -2px; right: -2px;
      width: 14px; height: 14px;
      background: #e74c3c;
      border: 2px solid #080808;
      border-radius: 50%;
      animation: adaNotif 2s ease-in-out infinite;
    }
    @keyframes adaNotif {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }

    /* Idle bob animation on character */
    #btl-ada-btn:not(.open) svg {
      animation: adaBob 3s ease-in-out infinite;
    }
    @keyframes adaBob {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    @media (max-width: 480px) {
      #btl-ada-wrap { bottom: 1rem; right: 1rem; }
      #btl-chat { width: calc(100vw - 2rem); }
    }
  `;
  document.head.appendChild(style);

  // ── Build HTML ─────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.id = 'btl-ada-wrap';
  wrap.innerHTML = `
    <!-- Chat panel -->
    <div id="btl-chat">
      <div id="btl-chat-header">
        <div class="ada-mini">🏷</div>
        <div class="ada-name">Ada — BTL Guide</div>
        <div class="ada-status">Online</div>
        <button id="btl-chat-close">✕</button>
      </div>
      <div id="btl-chat-messages"></div>
      <div id="btl-quick-prompts"></div>
      <div id="btl-chat-input-row">
        <input id="btl-chat-input" type="text" placeholder="Ask me anything…" autocomplete="off">
        <button id="btl-chat-send">→</button>
      </div>
    </div>

    <!-- Avatar button -->
    <div style="position:relative; pointer-events:all;">
      <button id="btl-ada-btn" aria-label="Chat with Ada, your BTL guide">
        <!-- Character SVG — small activist with label tag -->
        <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Body -->
          <circle cx="28" cy="28" r="28" fill="#1a1a1a"/>
          <!-- Coat -->
          <path d="M16 36 C16 30 20 28 28 28 C36 28 40 30 40 36 L40 46 L16 46 Z" fill="#c0392b"/>
          <!-- Collar detail -->
          <path d="M24 28 L28 34 L32 28" fill="#e74c3c" opacity="0.6"/>
          <!-- Head -->
          <circle cx="28" cy="20" r="8" fill="#f0d5a0"/>
          <!-- Hair -->
          <path d="M20 18 Q20 11 28 11 Q36 11 36 18" fill="#2c1810"/>
          <!-- Eyes -->
          <circle cx="25" cy="20" r="1.2" fill="#2c1810"/>
          <circle cx="31" cy="20" r="1.2" fill="#2c1810"/>
          <!-- Smile -->
          <path d="M25 23 Q28 25.5 31 23" stroke="#c0392b" stroke-width="1" fill="none" stroke-linecap="round"/>
          <!-- Label tag hanging from neck -->
          <rect x="24" y="29" width="8" height="6" rx="1" fill="#f0ebe0" stroke="#9a9a9a" stroke-width="0.5"/>
          <line x1="28" y1="28" x2="28" y2="29" stroke="#9a9a9a" stroke-width="0.8"/>
          <line x1="25.5" y1="31" x2="30.5" y2="31" stroke="#c0392b" stroke-width="0.8"/>
          <line x1="25.5" y1="33" x2="29" y2="33" stroke="#9a9a9a" stroke-width="0.6"/>
        </svg>
      </button>
      <div id="btl-ada-notif"></div>
    </div>
  `;
  document.body.appendChild(wrap);

  // ── State ──────────────────────────────────────────────────────
  const chatEl      = document.getElementById('btl-chat');
  const messagesEl  = document.getElementById('btl-chat-messages');
  const inputEl     = document.getElementById('btl-chat-input');
  const sendBtn     = document.getElementById('btl-chat-send');
  const closeBtn    = document.getElementById('btl-chat-close');
  const adaBtn      = document.getElementById('btl-ada-btn');
  const notifDot    = document.getElementById('btl-ada-notif');
  const quickEl     = document.getElementById('btl-quick-prompts');

  let isOpen        = false;
  let isTyping      = false;
  let greeted       = false;
  let conversationHistory = [];

  // ── Quick prompt chips ─────────────────────────────────────────
  QUICK_PROMPTS.forEach(q => {
    const chip = document.createElement('button');
    chip.className = 'ada-chip';
    chip.textContent = q;
    chip.addEventListener('click', () => sendMessage(q));
    quickEl.appendChild(chip);
  });

  // ── Toggle chat ────────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    chatEl.classList.add('open');
    adaBtn.classList.add('open');
    notifDot.style.display = 'none';
    // Remove teaser if present
    const teaser = document.getElementById('btl-ada-teaser');
    if (teaser) teaser.remove();
    if (!greeted) {
      greeted = true;
      const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setTimeout(() => addMessage('ada', greeting), 300);
    }
    setTimeout(() => inputEl.focus(), 400);
  }

  function closeChat() {
    isOpen = false;
    chatEl.classList.remove('open');
    adaBtn.classList.remove('open');
  }

  adaBtn.addEventListener('click', () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);

  // ── Teaser bubble ──────────────────────────────────────────────
  setTimeout(() => {
    if (isOpen || greeted) return;
    const teaser = document.createElement('div');
    teaser.id = 'btl-ada-teaser';
    teaser.innerHTML = `
      <button id="btl-ada-teaser-dismiss">✕</button>
      Hi! I'm Ada 👋 I can help you navigate Behind The Label — ask me anything!
    `;
    teaser.addEventListener('click', (e) => {
      if (e.target.id === 'btl-ada-teaser-dismiss') {
        teaser.remove();
        return;
      }
      teaser.remove();
      openChat();
    });
    // Insert before the avatar button
    wrap.insertBefore(teaser, wrap.children[1]);
    notifDot.style.display = 'block';
  }, 4000);

  // ── Add message to chat ────────────────────────────────────────
  function addMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `ada-msg ${role}`;

    if (role === 'ada') {
      msg.innerHTML = `
        <div class="avatar">🏷</div>
        <div class="bubble">${text}</div>`;
    } else {
      msg.innerHTML = `<div class="bubble">${text}</div>`;
    }

    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msg;
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'ada-msg ada ada-typing';
    msg.id = 'btl-typing-indicator';
    msg.innerHTML = `
      <div class="avatar">🏷</div>
      <div class="bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>`;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('btl-typing-indicator');
    if (t) t.remove();
  }

  // ── Send message ───────────────────────────────────────────────
  async function sendMessage(text) {
    if (!text || !text.trim() || isTyping) return;
    text = text.trim();

    addMessage('user', text);
    inputEl.value = '';

    conversationHistory.push({ role: 'user', content: text });

    isTyping = true;
    sendBtn.disabled = true;
    addTyping();

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SITE_CONTEXT },
            ...conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const reply = data.choices?.[0]?.message?.content || "Sorry, I didn't catch that. Try again?";
      conversationHistory.push({ role: 'assistant', content: reply });

      removeTyping();
      addMessage('ada', reply);

    } catch (err) {
      removeTyping();
      addMessage('ada', "Hmm, I'm having trouble connecting. Try refreshing the page!");
      console.error('Ada error:', err);
    }

    isTyping = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  // ── Input listeners ────────────────────────────────────────────
  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage(inputEl.value);
  });

})();
