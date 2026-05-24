(function () {
  // Injecter le CSS
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/chat.css';
  document.head.appendChild(link);

  // Injecter le HTML
  document.body.insertAdjacentHTML('beforeend', `
    <button id="vr-chat-bubble" aria-label="Ouvrir le chat">
      <span id="vr-chat-badge"></span>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111110" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div id="vr-chat-panel" role="dialog" aria-label="Chat Vinyl Run">
      <div id="vr-chat-header">
        <div>
          <div id="vr-chat-header-title">Vinyl Run</div>
          <div id="vr-chat-header-sub">On vous répond dès que possible</div>
        </div>
        <button id="vr-chat-close" aria-label="Fermer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form id="vr-chat-form" novalidate>
        <p>Posez-nous votre question — laissez votre nom et téléphone pour qu'on puisse vous rappeler si besoin.</p>
        <input class="vr-chat-input" id="vr-chat-name" type="text" placeholder="Votre prénom" autocomplete="given-name" />
        <input class="vr-chat-input" id="vr-chat-phone" type="tel" placeholder="Votre téléphone" autocomplete="tel" />
        <textarea class="vr-chat-input" id="vr-chat-first-msg" placeholder="Votre message…"></textarea>
        <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
        <button type="submit" id="vr-chat-start-btn">Envoyer</button>
      </form>

      <div id="vr-chat-messages"></div>
      <div id="vr-chat-typing">Vinyl Run est en train d'écrire…</div>

      <div id="vr-chat-inputzone">
        <textarea id="vr-chat-text" placeholder="Votre message…" rows="1"></textarea>
        <button id="vr-chat-send" aria-label="Envoyer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111110" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `);

  var convId = localStorage.getItem('vr_chat_conv');
  var pollInterval = null;
  var lastMsgId = null;
  var unread = 0;

  var bubble   = document.getElementById('vr-chat-bubble');
  var badge    = document.getElementById('vr-chat-badge');
  var panel    = document.getElementById('vr-chat-panel');
  var closeBtn = document.getElementById('vr-chat-close');
  var form     = document.getElementById('vr-chat-form');
  var msgBox   = document.getElementById('vr-chat-messages');
  var inputZone= document.getElementById('vr-chat-inputzone');
  var textarea = document.getElementById('vr-chat-text');
  var sendBtn  = document.getElementById('vr-chat-send');

  function openPanel() {
    panel.classList.add('open');
    unread = 0;
    badge.style.display = 'none';
    if (convId) {
      showConversation();
      startPolling();
    }
  }

  function closePanel() {
    panel.classList.remove('open');
    stopPolling();
  }

  bubble.addEventListener('click', function () {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  // Si conversation existante, passer direct en mode messages
  if (convId) {
    form.style.display = 'none';
    showConversation();
  }

  // Soumission formulaire initial
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var name  = document.getElementById('vr-chat-name').value.trim();
    var phone = document.getElementById('vr-chat-phone').value.trim();
    var msg   = document.getElementById('vr-chat-first-msg').value.trim();

    var valid = true;
    [['vr-chat-name', name], ['vr-chat-phone', phone], ['vr-chat-first-msg', msg]].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!pair[1]) { el.classList.add('error'); valid = false; }
      else el.classList.remove('error');
    });
    if (!valid) return;

    var btn = document.getElementById('vr-chat-start-btn');
    btn.disabled = true;
    btn.textContent = 'Envoi…';

    try {
      var res = await fetch('/api/chat-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, message: msg }),
      });
      if (!res.ok) throw new Error();
      var data = await res.json();
      convId = data.conversation_id;
      localStorage.setItem('vr_chat_conv', convId);
      showConversation();
      loadMessages();
      startPolling();
    } catch (_) {
      btn.disabled = false;
      btn.textContent = 'Envoyer';
    }
  });

  // Envoi message suivant
  sendBtn.addEventListener('click', sendMessage);
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  async function sendMessage() {
    var msg = textarea.value.trim();
    if (!msg || !convId) return;
    textarea.value = '';
    appendMessage({ body: msg, sender: 'visitor', created_at: new Date().toISOString() });

    await fetch('/api/chat-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId, message: msg, sender: 'visitor' }),
    });
  }

  function showConversation() {
    form.style.display = 'none';
    msgBox.classList.add('active');
    inputZone.classList.add('active');
  }

  async function loadMessages() {
    if (!convId) return;
    try {
      var res = await fetch('/api/chat-messages?conversation_id=' + convId);
      if (!res.ok) return;
      var msgs = await res.json();
      msgBox.innerHTML = '';
      lastMsgId = null;
      msgs.forEach(function (m) { appendMessage(m); });
    } catch (_) {}
  }

  function appendMessage(m) {
    if (lastMsgId === m.id) return;
    lastMsgId = m.id || null;
    var el = document.createElement('div');
    el.className = 'vr-msg vr-msg--' + m.sender;
    var time = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = '<span>' + escHtml(m.body) + '</span><span class="vr-msg__time">' + time + '</span>';
    msgBox.appendChild(el);
    msgBox.scrollTop = msgBox.scrollHeight;

    if (m.sender === 'admin' && !panel.classList.contains('open')) {
      unread++;
      badge.style.display = 'flex';
      badge.textContent = unread;
    }
  }

  function startPolling() {
    if (pollInterval) return;
    loadMessages();
    pollInterval = setInterval(pollNew, 4000);
  }

  function stopPolling() {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  var knownIds = new Set();

  async function pollNew() {
    if (!convId) return;
    try {
      var res = await fetch('/api/chat-messages?conversation_id=' + convId);
      if (!res.ok) return;
      var msgs = await res.json();
      msgs.forEach(function (m) {
        if (!knownIds.has(m.id)) {
          knownIds.add(m.id);
          appendMessage(m);
        }
      });
    } catch (_) {}
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Auto-resize textarea
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  // Si conversation existante, charger les messages au démarrage
  if (convId) loadMessages();
})();
