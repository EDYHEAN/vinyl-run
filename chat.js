(function () {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/chat.css';
  document.head.appendChild(link);

  var _siteLang = (typeof localStorage !== 'undefined' && localStorage.getItem('vr_lang')) || 'fr';
  var _isEn = _siteLang === 'en';

  document.body.insertAdjacentHTML('beforeend', `
    <button id="vr-chat-bubble" aria-label="Ouvrir le chat">
      <span id="vr-chat-badge"></span>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111110" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div id="vr-chat-panel" role="dialog" aria-label="Chat Vinyl Run">
      <div id="vr-chat-header">
        <div class="vr-chat-avatar">
          <img src="/assets/titote.jpg" alt="Christophe" />
          <span class="vr-chat-online"></span>
        </div>
        <div class="vr-chat-header-info">
          <div class="vr-chat-header-name">Christophe</div>
          <div class="vr-chat-header-status">En ligne</div>
        </div>
        <button id="vr-chat-close" aria-label="Fermer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div id="vr-chat-messages"></div>
      <div id="vr-chat-inputzone">
        <textarea id="vr-chat-text" placeholder="Votre message…" rows="1"></textarea>
        <button id="vr-chat-send" aria-label="Envoyer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111110" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>

    <div id="vr-chat-mobilebar" role="button" aria-label="Ouvrir le chat">
      <div class="vr-chat-mobilebar__avatar">
        <img src="/assets/titote.jpg" alt="Christophe" />
        <span class="vr-chat-online"></span>
      </div>
      <div class="vr-chat-mobilebar__info">
        <span class="vr-chat-mobilebar__name">${_isEn ? 'Chat with Christophe' : 'Chat avec Christophe'}</span>
        <span class="vr-chat-mobilebar__sub">${_isEn ? 'Online · Reply within 24h' : 'En ligne · Répondre sous 24h'}</span>
      </div>
      <span id="vr-chat-mobilebadge"></span>
      <span class="vr-chat-mobilebar__chevron">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </span>
    </div>
  `);

  var convId       = localStorage.getItem('vr_chat_conv');
  var pollInterval = null;
  var serverMsgs   = [];
  var pendingMsgs  = [];
  var prevAdminCount = 0;
  var unread       = 0;
  var adminIsTyping     = false;
  var lastTypingSignal  = 0;

  var bubble      = document.getElementById('vr-chat-bubble');
  var badge       = document.getElementById('vr-chat-badge');
  var panel       = document.getElementById('vr-chat-panel');
  var closeBtn    = document.getElementById('vr-chat-close');
  var msgBox      = document.getElementById('vr-chat-messages');
  var textarea    = document.getElementById('vr-chat-text');
  var sendBtn     = document.getElementById('vr-chat-send');
  var mobilebar   = document.getElementById('vr-chat-mobilebar');
  var mobileBadge = document.getElementById('vr-chat-mobilebadge');

  // ── Render ──────────────────────────────────────────────────
  function renderMessages() {
    var scrolledToBottom = msgBox.scrollHeight - msgBox.scrollTop - msgBox.clientHeight < 40;
    var siteLang = (typeof localStorage !== 'undefined' && localStorage.getItem('vr_lang')) || navigator.language || 'fr';
    var isEn = siteLang.startsWith('en');
    var welcomeText = isEn
      ? "Hello! Got a question about a vinyl, an artist, or availability? I'm here."
      : "Bonjour ! Une question sur un vinyle, un artiste, une disponibilité ? Je suis là.";
    msgBox.innerHTML = '<div class="vr-msg-welcome">' + welcomeText + '</div>';
    serverMsgs.forEach(function (m) { addBubble(m.body, m.sender, m.created_at, false); });
    pendingMsgs.forEach(function (m) { addBubble(m.body, 'visitor', m.created_at, true); });
    if (adminIsTyping) addTypingDots();
    if (scrolledToBottom || pendingMsgs.length || adminIsTyping) msgBox.scrollTop = msgBox.scrollHeight;
  }

  function addTypingDots() {
    var el = document.createElement('div');
    el.className = 'vr-msg-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgBox.appendChild(el);
  }

  function addBubble(body, sender, ts, isPending) {
    var el = document.createElement('div');
    el.className = 'vr-msg vr-msg--' + sender;
    if (isPending) el.style.opacity = '0.6';
    var time = new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = '<span>' + escHtml(body) + '</span><span class="vr-msg__time">' + time + '</span>';
    msgBox.appendChild(el);
  }

  // ── Typing status ────────────────────────────────────────────
  async function checkTypingStatus() {
    if (!convId) return;
    try {
      var r = await fetch('/api/chat-typing-status?conversation_id=' + convId + '&_t=' + Date.now());
      if (!r.ok) return;
      var data = await r.json();
      var prev = adminIsTyping;
      adminIsTyping = !!data.admin_typing;
      if (adminIsTyping !== prev) renderMessages();
    } catch(_) {}
  }

  function sendTypingSignal() {
    if (!convId) return;
    var now = Date.now();
    if (now - lastTypingSignal < 2000) return;
    lastTypingSignal = now;
    fetch('/api/chat-typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId, sender: 'visitor' }),
    }).catch(function(){});
  }

  // ── Load from server ─────────────────────────────────────────
  async function loadMessages() {
    if (!convId) return;
    try {
      var res = await fetch('/api/chat-messages?conversation_id=' + convId + '&_t=' + Date.now());
      if (!res.ok) return;
      var msgs = await res.json();
      serverMsgs = msgs;
      // Remove pending confirmed by server (match body + visitor)
      pendingMsgs = pendingMsgs.filter(function (pm) {
        return !msgs.some(function (sm) { return sm.sender === 'visitor' && sm.body === pm.body; });
      });
      // Badge for new admin messages
      var adminCount = msgs.filter(function (m) { return m.sender === 'admin'; }).length;
      if (adminCount > prevAdminCount && !panel.classList.contains('open')) {
        unread += adminCount - prevAdminCount;
        badge.style.display = 'flex';
        badge.textContent = unread;
        mobileBadge.style.display = 'flex';
        mobileBadge.textContent = unread;

      }
      prevAdminCount = adminCount;
      renderMessages();
    } catch (_) {}
  }

  // ── Panel open/close ─────────────────────────────────────────
  function openPanel() {
    var navMobile = document.getElementById('navMobile');
    var navBurger = document.getElementById('navBurger');
    if (navMobile) { navMobile.classList.remove('open'); document.body.style.overflow = ''; }
    if (navBurger) { navBurger.classList.remove('open'); navBurger.setAttribute('aria-expanded', 'false'); }

    if (window.innerWidth <= 999) {
      var nav = document.querySelector('.nav') || document.querySelector('nav');
      var navH = nav ? Math.round(nav.getBoundingClientRect().bottom) : 72;
      panel.style.top = navH + 'px';
      document.documentElement.style.setProperty('--vr-nav-h', navH + 'px');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
    panel.classList.add('open');
    mobilebar.classList.add('open');
    unread = 0;
    badge.style.display = 'none';
    mobileBadge.style.display = 'none';
    if (window.innerWidth > 999) textarea.focus();
    if (convId) {
      loadMessages();
    } else {
      renderMessages();
    }
    startPolling();
  }

  function closePanel() {
    panel.classList.remove('open');
    mobilebar.classList.remove('open');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    setTimeout(function() { panel.style.top = ''; }, 380);
    stopPolling();
    startBgPoll();
  }

  window.vrChat = { open: openPanel, close: closePanel };

  bubble.addEventListener('click', function () {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  mobilebar.addEventListener('click', function () {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  if (convId) { loadMessages(); startBgPoll(); }

  // ── Send ─────────────────────────────────────────────────────
  sendBtn.addEventListener('click', sendMessage);
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    sendTypingSignal();
  });

  async function sendMessage() {
    var msg = textarea.value.trim();
    if (!msg) return;
    textarea.value = '';
    textarea.style.height = 'auto';

    var pending = { body: msg, created_at: new Date().toISOString() };
    pendingMsgs.push(pending);
    renderMessages();

    try {
      if (!convId) {
        var res = await fetch('/api/chat-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        });
        if (!res.ok) { pendingMsgs = pendingMsgs.filter(function (p) { return p !== pending; }); renderMessages(); return; }
        var data = await res.json();
        convId = data.conversation_id;
        localStorage.setItem('vr_chat_conv', convId);
        startPolling();
      } else {
        var r = await fetch('/api/chat-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: convId, message: msg, sender: 'visitor' }),
        });
        if (!r.ok) {
          // Conversation introuvable — reset et relance via chat-new avec le même message
          convId = null;
          localStorage.removeItem('vr_chat_conv');
          stopPolling();
          serverMsgs = [];
          var res2 = await fetch('/api/chat-new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg }),
          });
          if (!res2.ok) {
            pendingMsgs = pendingMsgs.filter(function (p) { return p !== pending; });
            renderMessages();
            return;
          }
          var data2 = await res2.json();
          convId = data2.conversation_id;
          localStorage.setItem('vr_chat_conv', convId);
          startPolling();
        }
      }
      // Rafraîchir depuis le serveur pour confirmer
      await loadMessages();
    } catch (_) {
      pendingMsgs = pendingMsgs.filter(function (p) { return p !== pending; });
      renderMessages();
    }
  }

  function startPolling() {
    if (pollInterval || !convId) return;
    stopBgPoll();
    pollInterval = setInterval(function() {
      loadMessages();
      checkTypingStatus();
    }, 3000);
  }
  function stopPolling() { clearInterval(pollInterval); pollInterval = null; }

  var bgPollInterval = null;
  function startBgPoll() {
    if (bgPollInterval || !convId) return;
    bgPollInterval = setInterval(loadMessages, 10000);
  }
  function stopBgPoll() { clearInterval(bgPollInterval); bgPollInterval = null; }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
