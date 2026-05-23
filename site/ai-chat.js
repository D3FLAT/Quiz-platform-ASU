
(function () {
  const API_BASE = 'http://127.0.0.1:5000/api';
  const STORAGE_KEY = 'ai_chats_v2';

  // ── State ───────────────────────────────────────────
  let isOpen = false;
  let chats = loadChats();       // { id, title, messages[] }[]
  let activeChatId = null;

  function loadChats() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveChats() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }

  function getActiveChat() {
    return chats.find(c => c.id === activeChatId) || null;
  }

  function createChat(firstMessage) {
    const id = Date.now().toString();
    const title = firstMessage.slice(0, 42) + (firstMessage.length > 42 ? '…' : '');
    const chat = { id, title, messages: [] };
    chats.unshift(chat);
    saveChats();
    return chat;
  }

  // ── Styles ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
  /* ─── Trigger button ─── */
  #ai-trigger {
    position: fixed; bottom: 28px; right: 28px;
    width: 56px; height: 56px; border-radius: 50%;
    background: linear-gradient(135deg, #4361EE, #7C3AED);
    border: none; cursor: pointer; z-index: 9990;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(67,97,238,.45);
    transition: transform .2s, box-shadow .2s;
    font-size: 24px;
  }
  #ai-trigger:hover {
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 8px 28px rgba(67,97,238,.5);
  }
  #ai-trigger.open { transform: rotate(90deg); }

  /* ─── Backdrop ─── */
  #ai-backdrop {
    position: fixed; inset: 0; z-index: 9991;
    background: rgba(13,27,42,.55);
    backdrop-filter: blur(6px);
    opacity: 0; pointer-events: none;
    transition: opacity .25s ease;
  }
  #ai-backdrop.show { opacity: 1; pointer-events: all; }

  /* ─── Modal ─── */
  #ai-modal {
    position: fixed; z-index: 9992;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%) scale(.95);
    width: min(900px, calc(100vw - 32px));
    height: min(620px, calc(100vh - 48px));
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 24px 80px rgba(13,27,42,.22);
    display: flex; overflow: hidden;
    opacity: 0; pointer-events: none;
    transition: opacity .25s ease, transform .25s ease;
  }
  #ai-modal.show {
    opacity: 1; pointer-events: all;
    transform: translate(-50%,-50%) scale(1);
  }

  /* ─── Sidebar ─── */
  #ai-sidebar {
    width: 248px; flex-shrink: 0;
    background: #0D1B2A;
    display: flex; flex-direction: column;
    overflow: hidden;
  }

  #ai-sidebar-header {
    padding: 20px 16px 12px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    flex-shrink: 0;
  }

  #ai-sidebar-title {
    display: flex; align-items: center; gap: 8px;
    color: #fff; font-weight: 700; font-size: 15px;
    margin-bottom: 12px;
  }

  #ai-new-chat {
    width: 100%; padding: 9px 14px;
    background: rgba(67,97,238,.25);
    border: 1px solid rgba(67,97,238,.4);
    border-radius: 9px; color: #93B4FF;
    font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer;
    display: flex; align-items: center; gap: 7px;
    transition: background .15s;
  }
  #ai-new-chat:hover { background: rgba(67,97,238,.4); color: #fff; }

  #ai-chat-list {
    flex: 1; overflow-y: auto; padding: 8px;
  }

  .ai-chat-item {
    padding: 10px 12px; border-radius: 9px;
    cursor: pointer; color: rgba(255,255,255,.65);
    font-size: 13px; font-weight: 500;
    margin-bottom: 2px;
    display: flex; align-items: center; gap: 8px;
    transition: background .15s, color .15s;
    white-space: nowrap; overflow: hidden;
  }
  .ai-chat-item span { overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .ai-chat-item .ai-del {
    opacity: 0; flex-shrink: 0;
    background: none; border: none;
    color: rgba(255,255,255,.4); cursor: pointer;
    font-size: 14px; padding: 2px 4px; border-radius: 4px;
  }
  .ai-chat-item:hover .ai-del { opacity: 1; }
  .ai-chat-item:hover .ai-del:hover { color: #EF4444; }
  .ai-chat-item:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); }
  .ai-chat-item.active { background: rgba(67,97,238,.3); color: #fff; }

  #ai-sidebar-footer {
    padding: 12px 14px;
    border-top: 1px solid rgba(255,255,255,.07);
    color: rgba(255,255,255,.3);
    font-size: 11px; flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
  }

  /* ─── Main ─── */
  #ai-main {
    flex: 1; display: flex; flex-direction: column;
    overflow: hidden; background: #F8FAFF;
  }

  #ai-main-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid #E2E8F4;
    flex-shrink: 0;
  }

  #ai-main-title {
    font-weight: 700; font-size: 15px; color: #1E293B;
    display: flex; align-items: center; gap: 9px;
  }

  .ai-model-badge {
    font-size: 11px; font-weight: 600;
    background: #EEF1FD; color: #4361EE;
    padding: 3px 8px; border-radius: 99px;
  }

  #ai-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: none; border: none;
    color: #94A3B8; cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, color .15s;
  }
  #ai-close:hover { background: #F1F5FB; color: #1E293B; }

  /* ─── Messages ─── */
  #ai-messages {
    flex: 1; overflow-y: auto;
    padding: 20px; display: flex;
    flex-direction: column; gap: 14px;
  }

  .ai-msg-wrap {
    display: flex; gap: 10px;
    animation: msgIn .2s ease;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ai-msg-wrap.user { flex-direction: row-reverse; }

  .ai-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    flex-shrink: 0; display: flex;
    align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700;
  }
  .ai-avatar.bot {
    background: linear-gradient(135deg, #4361EE, #7C3AED); color: #fff;
  }
  .ai-avatar.user {
    background: linear-gradient(135deg, #0D1B2A, #1E3A5F); color: #fff;
    font-size: 13px;
  }

  .ai-bubble {
    max-width: 72%; padding: 11px 15px;
    border-radius: 14px; font-size: 14px;
    line-height: 1.55; word-break: break-word;
  }
  .ai-msg-wrap.user .ai-bubble {
    background: linear-gradient(135deg, #4361EE, #7C3AED);
    color: #fff; border-bottom-right-radius: 4px;
  }
  .ai-msg-wrap.bot .ai-bubble {
    background: #fff; color: #1E293B;
    border: 1px solid #E2E8F4;
    border-bottom-left-radius: 4px;
    box-shadow: 0 2px 8px rgba(30,41,59,.06);
  }
  .ai-bubble.error { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }

  /* quiz preview */
  .ai-quiz-card {
    background: linear-gradient(135deg, #EEF1FD, #F5F0FF);
    border: 1px solid #C7D2FE;
    border-radius: 12px; padding: 14px;
    margin-top: 8px;
  }
  .ai-quiz-card strong { color: #3730A3; font-size: 14px; }
  .ai-quiz-card .aqc-meta { color: #6366F1; font-size: 12px; margin: 5px 0 10px; }
  .ai-create-btn {
    width: 100%; padding: 9px;
    background: linear-gradient(135deg, #4361EE, #7C3AED);
    color: #fff; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer;
    transition: opacity .15s, transform .15s;
  }
  .ai-create-btn:hover { opacity: .9; transform: translateY(-1px); }
  .ai-create-btn:disabled { opacity: .5; cursor: default; transform: none; }

  /* typing indicator */
  .ai-typing-wrap { display: flex; gap: 10px; }
  .ai-typing {
    background: #fff; border: 1px solid #E2E8F4;
    border-radius: 14px; border-bottom-left-radius: 4px;
    padding: 12px 16px; display: flex; gap: 5px;
  }
  .ai-typing span {
    width: 7px; height: 7px; border-radius: 50%;
    background: #94A3B8;
    animation: typeDot 1.2s infinite;
  }
  .ai-typing span:nth-child(2) { animation-delay: .2s; }
  .ai-typing span:nth-child(3) { animation-delay: .4s; }
  @keyframes typeDot {
    0%,80%,100% { transform: scale(.6); opacity:.4; }
    40% { transform: scale(1); opacity:1; }
  }

  /* ─── Hints ─── */
  #ai-hints {
    padding: 8px 16px 4px;
    display: flex; gap: 6px; flex-wrap: wrap;
    background: #F8FAFF; flex-shrink: 0;
  }
  .ai-hint {
    background: #fff; color: #4361EE;
    border: 1px solid #C7D2FE; border-radius: 99px;
    padding: 5px 12px; font-size: 12px; font-weight: 500;
    font-family: inherit; cursor: pointer;
    transition: background .15s, border-color .15s;
  }
  .ai-hint:hover { background: #EEF1FD; border-color: #4361EE; }

  /* ─── Input row ─── */
  #ai-input-row {
    display: flex; align-items: flex-end;
    gap: 10px; padding: 12px 16px;
    background: #fff;
    border-top: 1px solid #E2E8F4; flex-shrink: 0;
  }
  #ai-input {
    flex: 1; border: 1.5px solid #E2E8F4;
    border-radius: 12px; padding: 10px 14px;
    font-size: 14px; font-family: inherit;
    color: #1E293B; resize: none; outline: none;
    line-height: 1.5; max-height: 120px;
    transition: border-color .15s, box-shadow .15s;
    background: #F8FAFF;
  }
  #ai-input:focus {
    border-color: #4361EE;
    box-shadow: 0 0 0 3px rgba(67,97,238,.1);
    background: #fff;
  }
  #ai-send {
    width: 40px; height: 40px; flex-shrink: 0;
    background: linear-gradient(135deg, #4361EE, #7C3AED);
    border: none; border-radius: 10px; color: #fff;
    cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: opacity .15s, transform .15s;
    box-shadow: 0 2px 8px rgba(67,97,238,.35);
  }
  #ai-send:hover { opacity: .9; transform: scale(1.05); }
  #ai-send:disabled { opacity: .4; cursor: default; transform: none; }

  /* ─── Empty chat ─── */
  #ai-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; color: #94A3B8; text-align: center; padding: 24px;
  }
  #ai-empty .ai-empty-icon { font-size: 44px; margin-bottom: 6px; }
  #ai-empty h3 { color: #64748B; font-size: 17px; font-weight: 700; }
  #ai-empty p { font-size: 13px; max-width: 260px; line-height: 1.5; }

  /* scrollbar inside modal */
  #ai-messages::-webkit-scrollbar,
  #ai-chat-list::-webkit-scrollbar { width: 4px; }
  #ai-messages::-webkit-scrollbar-thumb { background: #E2E8F4; border-radius: 99px; }
  #ai-chat-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }

  @media (max-width: 600px) {
    #ai-sidebar { display: none; }
    #ai-modal { width: calc(100vw - 16px); height: calc(100vh - 60px); border-radius: 16px; }
  }
  `;
  document.head.appendChild(style);

  // ── HTML ────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
  <button id="ai-trigger" title="AI-помощник">🤖</button>
  <div id="ai-backdrop"></div>
  <div id="ai-modal">
    <div id="ai-sidebar">
      <div id="ai-sidebar-header">
        <div id="ai-sidebar-title">🤖 AI-помощник</div>
        <button id="ai-new-chat">＋ Новый диалог</button>
      </div>
      <div id="ai-chat-list"></div>
      <div id="ai-sidebar-footer">⚡ Llama 3.1 · Groq</div>
    </div>
    <div id="ai-main">
      <div id="ai-main-header">
        <div id="ai-main-title">
          Чат
          <span class="ai-model-badge">Llama 3.1</span>
        </div>
        <button id="ai-close">✕</button>
      </div>
      <div id="ai-messages"></div>
      <div id="ai-hints">
        <button class="ai-hint" data-hint="Создай квиз по основам JavaScript с 5 вопросами">JS квиз</button>
        <button class="ai-hint" data-hint="Создай квиз по истории России с 6 вопросами">История</button>
        <button class="ai-hint" data-hint="Создай квиз по математике для школьников">Математика</button>
        <button class="ai-hint" data-hint="Что такое рекурсия? Объясни просто">Что такое рекурсия?</button>
      </div>
      <div id="ai-input-row">
        <textarea id="ai-input" rows="1" placeholder="Спроси что-нибудь или попроси создать квиз…"></textarea>
        <button id="ai-send">➤</button>
      </div>
    </div>
  </div>
  `);

  // ── Elements ────────────────────────────────────────
  const trigger   = document.getElementById('ai-trigger');
  const backdrop  = document.getElementById('ai-backdrop');
  const modal     = document.getElementById('ai-modal');
  const chatList  = document.getElementById('ai-chat-list');
  const messages  = document.getElementById('ai-messages');
  const inputEl   = document.getElementById('ai-input');
  const sendBtn   = document.getElementById('ai-send');

  // ── Open / Close ────────────────────────────────────
  function openModal() {
    isOpen = true;
    trigger.classList.add('open');
    backdrop.classList.add('show');
    modal.classList.add('show');
    renderChatList();
    if (!activeChatId && chats.length > 0) switchChat(chats[0].id);
    else if (!activeChatId) showEmpty();
    setTimeout(() => inputEl.focus(), 200);
  }

  function closeModal() {
    isOpen = false;
    trigger.classList.remove('open');
    backdrop.classList.remove('show');
    modal.classList.remove('show');
  }

  trigger.addEventListener('click', () => isOpen ? closeModal() : openModal());
  backdrop.addEventListener('click', closeModal);
  document.getElementById('ai-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) closeModal(); });

  // ── New chat ────────────────────────────────────────
  document.getElementById('ai-new-chat').addEventListener('click', () => {
    activeChatId = null;
    showEmpty();
    renderChatList();
    inputEl.focus();
  });

  // ── Sidebar render ──────────────────────────────────
  function renderChatList() {
    chatList.innerHTML = '';
    if (chats.length === 0) {
      chatList.innerHTML = '<div style="color:rgba(255,255,255,.3);font-size:12px;padding:12px;text-align:center">Диалогов пока нет</div>';
      return;
    }
    chats.forEach(chat => {
      const el = document.createElement('div');
      el.className = 'ai-chat-item' + (chat.id === activeChatId ? ' active' : '');
      el.innerHTML = `<span title="${escHtml(chat.title)}">💬 ${escHtml(chat.title)}</span>
        <button class="ai-del" title="Удалить">🗑</button>`;
      el.addEventListener('click', e => {
        if (e.target.classList.contains('ai-del')) { deleteChat(chat.id); return; }
        switchChat(chat.id);
      });
      chatList.appendChild(el);
    });
  }

  function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    saveChats();
    if (activeChatId === id) {
      activeChatId = chats.length ? chats[0].id : null;
      activeChatId ? switchChat(activeChatId) : showEmpty();
    }
    renderChatList();
  }

  function switchChat(id) {
    activeChatId = id;
    renderChatList();
    renderMessages();
    document.getElementById('ai-main-title').childNodes[0].textContent =
      getActiveChat()?.title || 'Чат ';
  }

  // ── Messages render ─────────────────────────────────
  function renderMessages() {
    messages.innerHTML = '';
    const chat = getActiveChat();
    if (!chat || chat.messages.length === 0) {
      showEmpty(); return;
    }
    // hide empty
    const empty = document.getElementById('ai-empty');
    if (empty) empty.remove();

    chat.messages.forEach(msg => {
      if (msg.role === 'user') appendUserBubble(msg.content, false);
      else if (msg.role === 'assistant') {
        if (msg.quizData) appendQuizPreview(msg.quizData, false);
        else appendBotBubble(msg.content, false);
      }
    });
    scrollBottom();
  }

  function showEmpty() {
    messages.innerHTML = `
      <div id="ai-empty">
        <div class="ai-empty-icon">🤖</div>
        <h3>Привет! Я AI-помощник</h3>
        <p>Задай вопрос по теме квиза или попроси создать квиз по любой теме</p>
      </div>`;
  }

  // ── Bubble helpers ──────────────────────────────────
  function userInitial() {
    try { return (localStorage.getItem('currentUser') || 'U')[0].toUpperCase(); } catch { return 'U'; }
  }

  function appendUserBubble(text, scroll = true) {
    const empty = document.getElementById('ai-empty');
    if (empty) empty.remove();
    messages.insertAdjacentHTML('beforeend', `
      <div class="ai-msg-wrap user">
        <div class="ai-avatar user">${userInitial()}</div>
        <div class="ai-bubble">${escHtml(text)}</div>
      </div>`);
    if (scroll) scrollBottom();
  }

  function appendBotBubble(text, scroll = true) {
    const empty = document.getElementById('ai-empty');
    if (empty) empty.remove();
    messages.insertAdjacentHTML('beforeend', `
      <div class="ai-msg-wrap bot">
        <div class="ai-avatar bot">AI</div>
        <div class="ai-bubble">${escHtml(text)}</div>
      </div>`);
    if (scroll) scrollBottom();
  }

  function appendErrorBubble(text) {
    messages.insertAdjacentHTML('beforeend', `
      <div class="ai-msg-wrap bot">
        <div class="ai-avatar bot">AI</div>
        <div class="ai-bubble error">⚠ ${escHtml(text)}</div>
      </div>`);
    scrollBottom();
  }

  function appendQuizPreview(quiz, scroll = true) {
    const empty = document.getElementById('ai-empty');
    if (empty) empty.remove();
    const wrap = document.createElement('div');
    wrap.className = 'ai-msg-wrap bot';
    wrap.innerHTML = `
      <div class="ai-avatar bot">AI</div>
      <div class="ai-bubble">
        Готово! Составил квиз для тебя:
        <div class="ai-quiz-card">
          <strong>${escHtml(quiz.title)}</strong>
          <div class="aqc-meta">${quiz.questions.length} вопросов · ${escHtml(quiz.category || 'other')}</div>
          <button class="ai-create-btn">Создать квиз на платформе</button>
        </div>
      </div>`;
    wrap.querySelector('.ai-create-btn').addEventListener('click', async function () {
      this.disabled = true; this.textContent = 'Создаём…';
      await createQuizFromAI(quiz, this);
    });
    messages.appendChild(wrap);
    if (scroll) scrollBottom();
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'ai-typing-wrap'; el.id = 'ai-typing';
    el.innerHTML = `<div class="ai-avatar bot">AI</div>
      <div class="ai-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(el);
    scrollBottom();
  }

  function removeTyping() { document.getElementById('ai-typing')?.remove(); }
  function scrollBottom() { messages.scrollTop = messages.scrollHeight; }

  // ── Send ────────────────────────────────────────────
  let isLoading = false;

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // auto-resize textarea
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  });

  document.querySelectorAll('.ai-hint').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!isOpen) openModal();
      inputEl.value = btn.dataset.hint;
      sendMessage();
    });
  });

  async function sendMessage() {
    if (isLoading) return;
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = ''; inputEl.style.height = 'auto';

    // создаём новый чат если нет активного
    if (!activeChatId) {
      const chat = createChat(text);
      activeChatId = chat.id;
      renderChatList();
      document.getElementById('ai-main-title').childNodes[0].textContent = chat.title + ' ';
    }

    const chat = getActiveChat();
    chat.messages.push({ role: 'user', content: text });
    saveChats();
    appendUserBubble(text);

    isLoading = true;
    sendBtn.disabled = true;
    addTyping();

    // history для API (только role+content, без quizData)
    const history = chat.messages
      .slice(-10)
      .filter(m => m.role !== 'assistant' || !m.quizData)
      .map(m => ({ role: m.role, content: m.content || '' }));

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1), page: getCurrentPage() })
      });
      const data = await res.json();
      removeTyping();

      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      if (data.action === 'create_quiz' && data.quiz) {
        chat.messages.push({ role: 'assistant', content: `Квиз: ${data.quiz.title}`, quizData: data.quiz });
        saveChats();
        appendQuizPreview(data.quiz);
      } else {
        const answer = data.text || JSON.stringify(data);
        chat.messages.push({ role: 'assistant', content: answer });
        saveChats();
        appendBotBubble(answer);
      }
    } catch (err) {
      removeTyping();
      appendErrorBubble(err.message);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // ── Create quiz via API ─────────────────────────────
  async function createQuizFromAI(quiz, btn) {
    const token = localStorage.getItem('token');
    if (!token) {
      btn.textContent = 'Войдите в аккаунт';
      appendErrorBubble('Для создания квиза нужно войти в аккаунт.'); return;
    }
    try {
      const res = await fetch(`${API_BASE}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(quiz)
      });
      if (!res.ok) throw new Error('Ошибка создания');
      btn.textContent = '✓ Квиз создан!';
      btn.style.background = '#10B981';
      appendBotBubble(`Квиз "${quiz.title}" создан! Обнови страницу чтобы увидеть его.`);
      if (typeof loadQuizzes === 'function') loadQuizzes();
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Попробовать снова';
      appendErrorBubble('Не удалось создать квиз: ' + err.message);
    }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Определение текущей страницы ────────────────────
function getCurrentPage() {
  const pages = {
    'home':        'Главная страница',
    'quizzes':     'Список квизов',
    'play-quiz':   'Прохождение квиза',
    'create-quiz': 'Создание квиза',
    'login':       'Страница входа',
    'register':    'Страница регистрации'
  };
  for (const [id, name] of Object.entries(pages)) {
    if (document.getElementById(id)?.classList.contains('active')) return name;
  }
  return 'Неизвестная страница';
}

// Авто-скрытие кнопки AI во время прохождения квиза
const observer = new MutationObserver(() => {
  const onQuiz = document.getElementById('play-quiz')?.classList.contains('active');
  const btn = document.getElementById('ai-trigger');
  if (!btn) return;
  btn.style.display = onQuiz ? 'none' : 'flex';
  if (onQuiz && isOpen) closeModal();
});

observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

})();
