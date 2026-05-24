(function () {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/chat.css';
  document.head.appendChild(link);

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

      <div id="vr-chat-messages">
        <div class="vr-msg-welcome">Bonjour ! Une question sur un vinyle, un artiste, une disponibilité ? Je suis là.</div>
      </div>

      <div id="vr-chat-inputzone">
        <textarea id="vr-chat-text" placeholder="Votre message…" rows="1"></textarea>
        <button id="vr-chat-send" aria-label="Envoyer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111110" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `);

  var convId       = localStorage.getItem('vr_chat_conv');
  var pollInterval = null;
  var knownIds     = new Set();
  var unread       = 0;

  var bubble   = document.getElementById('vr-chat-bubble');
  var badge    = document.getElementById('vr-chat-badge');
  var panel    = document.getElementById('vr-chat-panel');
  var closeBtn = document.getElementById('vr-chat-close');
  var msgBox   = document.getElementById('vr-chat-messages');
  var textarea = document.getElementById('vr-chat-text');
  var sendBtn  = document.getElementById('vr-chat-send');

  function openPanel() {
    panel.classList.add('open');
    unread = 0;
    badge.style.display = 'none';
    textarea.focus();
    if (convId) loadMessages();
    startPolling();
  }

  function closePanel() {
    panel.classList.remove('open');
    stopPolling();
  }

  bubble.addEventListener('click', function () {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  if (convId) loadMessages();

  // Envoi
  sendBtn.addEventListener('click', sendMessage);
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  async function sendMessage() {
    var msg = textarea.value.trim();
    if (!msg) return;
    textarea.value = '';
    textarea.style.height = 'auto';

    // Affichage optimiste
    var tmpId = '_tmp_' + Date.now();
    appendMessage({ id: tmpId, body: msg, sender: 'visitor', created_at: new Date().toISOString() });

    try {
      if (!convId) {
        var res = await fetch('/api/chat-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        });
        if (!res.ok) { removeTmp(tmpId); return; }
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
        if (!r.ok) { removeTmp(tmpId); return; }
      }
      // Charger les messages réels pour remplacer le tmp
      loadMessages();
    } catch (_) { removeTmp(tmpId); }
  }

  function removeTmp(tmpId) {
    var el = msgBox.querySelector('[data-tmp-id="' + tmpId + '"]');
    if (el) el.remove();
  }

  async function loadMessages() {
    if (!convId) return;
    try {
      var res = await fetch('/api/chat-messages?conversation_id=' + convId);
      if (!res.ok) return;
      var msgs = await res.json();
      // Supprimer les messages tmp avant d'afficher les vrais
      msgBox.querySelectorAll('[data-tmp]').forEach(function (el) { el.remove(); });
      msgs.forEach(function (m) { appendMessage(m); });
    } catch (_) {}
  }

  function appendMessage(m) {
    var isTemp = String(m.id).startsWith('_tmp_');

    if (!isTemp) {
      if (knownIds.has(m.id)) return;
      knownIds.add(m.id);
    }

    var el = document.createElement('div');
    el.className = 'vr-msg vr-msg--' + m.sender;
    if (isTemp) {
      el.setAttribute('data-tmp', '1');
      el.setAttribute('data-tmp-id', m.id);
    }
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
    if (pollInterval || !convId) return;
    pollInterval = setInterval(loadMessages, 4000);
  }

  function stopPolling() {
    clearInterval(pollInterval);
    pollInterval = null;
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
