// ai-chat.js — AI-чат на базе Groq / Llama
// Подключается отдельно, не зависит от script.js

(function () {
  const API_BASE = 'http://127.0.0.1:5000/api';
  let chatHistory = [];
  let isOpen = false;
  let isLoading = false;

  // ── Стили ──────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #ai-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #1F4E79;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 22px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.2s;
    }
    #ai-toggle:hover { background: #2E74B5; transform: scale(1.08); }

    #ai-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 340px;
      height: 480px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      overflow: hidden;
      transition: opacity 0.2s, transform 0.2s;
      opacity: 0;
      transform: translateY(16px) scale(0.97);
      pointer-events: none;
    }
    #ai-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    #ai-header {
      background: #1F4E79;
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #ai-header-title {
      font-weight: 600;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #ai-header-subtitle {
      font-size: 11px;
      opacity: 0.75;
      margin-top: 2px;
    }
    #ai-clear {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    #ai-clear:hover { background: rgba(255,255,255,0.15); color: #fff; }

    #ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #F7F9FC;
    }

    .ai-msg {
      max-width: 85%;
      padding: 9px 13px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .ai-msg.user {
      align-self: flex-end;
      background: #1F4E79;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .ai-msg.bot {
      align-self: flex-start;
      background: #fff;
      color: #222;
      border: 1px solid #E0E7EF;
      border-bottom-left-radius: 4px;
    }
    .ai-msg.bot.error {
      background: #FFF0F0;
      border-color: #FFCCCC;
      color: #C00;
    }

    .ai-quiz-preview {
      background: #EAF3FF;
      border: 1px solid #B5D4F4;
      border-radius: 10px;
      padding: 10px 12px;
      margin-top: 6px;
      font-size: 12px;
    }
    .ai-quiz-preview strong { color: #0C447C; font-size: 13px; }
    .ai-quiz-preview .q-count { color: #555; margin: 4px 0 8px; }
    .ai-create-btn {
      width: 100%;
      padding: 7px;
      background: #1F4E79;
      color: #fff;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s;
    }
    .ai-create-btn:hover { background: #2E74B5; }
    .ai-create-btn:disabled { background: #aaa; cursor: default; }

    .ai-typing {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
      align-self: flex-start;
      background: #fff;
      border: 1px solid #E0E7EF;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
    }
    .ai-typing span {
      width: 7px; height: 7px;
      background: #B0BEC5;
      border-radius: 50%;
      animation: aiDot 1.2s infinite;
    }
    .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
    .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes aiDot {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    #ai-hints {
      padding: 8px 12px 4px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      background: #F7F9FC;
      flex-shrink: 0;
    }
    .ai-hint {
      background: #E6F1FB;
      color: #0C447C;
      border: none;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .ai-hint:hover { background: #B5D4F4; }

    #ai-input-row {
      display: flex;
      padding: 10px 12px;
      gap: 8px;
      background: #fff;
      border-top: 1px solid #E0E7EF;
      flex-shrink: 0;
    }
    #ai-input {
      flex: 1;
      border: 1px solid #D0DBE8;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
      resize: none;
      height: 36px;
      line-height: 1.4;
      transition: border-color 0.15s;
      font-family: inherit;
    }
    #ai-input:focus { border-color: #1F4E79; }
    #ai-send {
      width: 36px;
      height: 36px;
      background: #1F4E79;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    #ai-send:hover { background: #2E74B5; }
    #ai-send:disabled { background: #aaa; cursor: default; }
  `;
  document.head.appendChild(style);

  // ── HTML ───────────────────────────────────────────────
  const toggle = document.createElement('button');
  toggle.id = 'ai-toggle';
  toggle.title = 'AI-помощник';
  toggle.innerHTML = '🤖';

  const panel = document.createElement('div');
  panel.id = 'ai-panel';
  panel.innerHTML = `
    <div id="ai-header">
      <div>
        <div id="ai-header-title">🤖 AI-помощник</div>
        <div id="ai-header-subtitle">Llama 3 · Groq</div>
      </div>
      <button id="ai-clear" title="Очистить чат">Очистить</button>
    </div>
    <div id="ai-messages"></div>
    <div id="ai-hints">
      <button class="ai-hint" data-hint="Создай квиз по основам JavaScript с 5 вопросами">Создать квиз по JS</button>
      <button class="ai-hint" data-hint="Создай квиз по истории России">Квиз по истории</button>
      <button class="ai-hint" data-hint="Что такое алгоритм?">Что такое алгоритм?</button>
    </div>
    <div id="ai-input-row">
      <textarea id="ai-input" placeholder="Спроси что-нибудь или попроси создать квиз..." rows="1"></textarea>
      <button id="ai-send">➤</button>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  // ── Логика ─────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    toggle.innerHTML = '✕';
    if (getMessages().children.length === 0) {
      addBotMessage('Привет! Я помогу тебе разобраться с квизами или создам новый по нужной теме. Просто напиши что нужно 😊');
    }
    setTimeout(() => document.getElementById('ai-input')?.focus(), 200);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    toggle.innerHTML = '🤖';
  }

  toggle.addEventListener('click', () => isOpen ? closePanel() : openPanel());

  document.getElementById('ai-clear').addEventListener('click', () => {
    chatHistory = [];
    getMessages().innerHTML = '';
    addBotMessage('Чат очищен. Чем могу помочь?');
  });

  document.getElementById('ai-send').addEventListener('click', sendMessage);

  document.getElementById('ai-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.querySelectorAll('.ai-hint').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!isOpen) openPanel();
      document.getElementById('ai-input').value = btn.dataset.hint;
      sendMessage();
    });
  });

  // ── Helpers ────────────────────────────────────────────
  function getMessages() {
    return document.getElementById('ai-messages');
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'ai-msg user';
    div.textContent = text;
    getMessages().appendChild(div);
    scrollBottom();
  }

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.textContent = text;
    getMessages().appendChild(div);
    scrollBottom();
    return div;
  }

  function addErrorMessage(text) {
    const div = document.createElement('div');
    div.className = 'ai-msg bot error';
    div.textContent = text;
    getMessages().appendChild(div);
    scrollBottom();
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'ai-typing';
    div.id = 'ai-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    getMessages().appendChild(div);
    scrollBottom();
  }

  function removeTyping() {
    document.getElementById('ai-typing-indicator')?.remove();
  }

  function scrollBottom() {
    const msgs = getMessages();
    msgs.scrollTop = msgs.scrollHeight;
  }

  function setLoading(val) {
    isLoading = val;
    document.getElementById('ai-send').disabled = val;
    document.getElementById('ai-input').disabled = val;
  }

  // ── Отображение квиза от AI ────────────────────────────
  function showQuizPreview(quiz) {
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.innerHTML = `
      <div>Готово! Вот квиз который я составил:</div>
      <div class="ai-quiz-preview">
        <strong>${escapeHtml(quiz.title)}</strong>
        <div class="q-count">${quiz.questions.length} вопросов · ${escapeHtml(quiz.category || 'other')}</div>
        <button class="ai-create-btn" id="ai-do-create">Создать квиз на платформе</button>
      </div>
    `;
    getMessages().appendChild(div);
    scrollBottom();

    document.getElementById('ai-do-create').addEventListener('click', async function () {
      this.disabled = true;
      this.textContent = 'Создаём...';
      await createQuizFromAI(quiz, this);
    });
  }

  // ── Создание квиза через API ───────────────────────────
  async function createQuizFromAI(quiz, btn) {
    const token = localStorage.getItem('token');
    if (!token) {
      btn.textContent = 'Войдите в аккаунт';
      addErrorMessage('Чтобы создать квиз нужно войти в аккаунт.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quiz)
      });

      if (!res.ok) throw new Error('Ошибка создания квиза');

      const created = await res.json();
      btn.textContent = '✓ Квиз создан!';
      btn.style.background = '#27AE60';
      addBotMessage(`Квиз "${quiz.title}" успешно создан! Обнови страницу чтобы увидеть его в списке.`);

      if (typeof loadQuizzes === 'function') loadQuizzes();

    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Попробовать снова';
      addErrorMessage('Не удалось создать квиз: ' + err.message);
    }
  }

  // ── Отправка сообщения ─────────────────────────────────
  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addUserMessage(text);
    setLoading(true);
    addTyping();

    chatHistory.push({ role: 'user', content: text });

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory.slice(-6) })
      });

      const data = await res.json();
      removeTyping();

      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      if (data.action === 'create_quiz' && data.quiz) {
        chatHistory.push({ role: 'assistant', content: `Создаю квиз: ${data.quiz.title}` });
        showQuizPreview(data.quiz);
      } else {
        const answer = data.text || JSON.stringify(data);
        chatHistory.push({ role: 'assistant', content: answer });
        addBotMessage(answer);
      }

    } catch (err) {
      removeTyping();
      addErrorMessage('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
      input.focus();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();
