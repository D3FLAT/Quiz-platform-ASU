/**
 * question-types.js
 * Новые типы вопросов: text_input, sequence, matching
 */

// ─────────────────────────────────────────────────────────
//  РЕНДЕР ВОПРОСА (патч поверх showQuestion из index.html)
// ─────────────────────────────────────────────────────────

const _origShowQuestion = typeof showQuestion === 'function' ? showQuestion : null;

function showQuestion() {
  if (currentQuestionIndex >= currentQuiz.questions.length) {
    finishQuiz();
    return;
  }

  const question = currentQuiz.questions[currentQuestionIndex];
  const type = question.type || 'multiple_choice';

  document.getElementById('questionText').textContent = question.question;
  const optionsContainer = document.getElementById('optionsContainer');
  optionsContainer.innerHTML = '';

  const progress = (currentQuestionIndex / currentQuiz.questions.length) * 100;
  document.getElementById('quizProgress').style.width = `${progress}%`;
  document.getElementById('nextQuestionBtn').style.display = 'none';
  document.getElementById('finishQuizBtn').style.display = 'none';
  document.getElementById('resultContainer').style.display = 'none';

  if (type === 'text_input') {
    renderTextInput(question, optionsContainer);
  } else if (type === 'sequence') {
    renderSequence(question, optionsContainer);
  } else if (type === 'matching') {
    renderMatching(question, optionsContainer);
  } else {
    renderMultipleChoice(question, optionsContainer);
  }
}

// ─────────────────────────────────────────────────────────
//  MULTIPLE CHOICE (старый тип, перенесён сюда)
// ─────────────────────────────────────────────────────────

function renderMultipleChoice(question, container) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  (question.options || []).forEach((option, index) => {
    const el = document.createElement('div');
    el.className = 'option';
    el.setAttribute('data-letter', letters[index] || String(index + 1));
    el.textContent = option;
    el.onclick = () => selectAnswer(option);
    container.appendChild(el);
  });
}

// ─────────────────────────────────────────────────────────
//  TEXT INPUT
// ─────────────────────────────────────────────────────────

function renderTextInput(question, container) {
  container.innerHTML = `
    <div class="qt-text-input">
      <input type="text" id="textAnswerInput" placeholder="Введите ваш ответ…" autocomplete="off"
             onkeydown="if(event.key==='Enter') checkTextAnswer()">
      <button class="btn qt-submit-btn" onclick="checkTextAnswer()">Проверить</button>
    </div>
  `;
  setTimeout(() => document.getElementById('textAnswerInput')?.focus(), 50);
}

function checkTextAnswer() {
  const input = document.getElementById('textAnswerInput');
  if (!input) return;
  const userAnswer = input.value.trim();
  if (!userAnswer) return;

  const question = currentQuiz.questions[currentQuestionIndex];
  const correct = (question.correct_answer || question.answer || '').trim();

  const isCorrect = userAnswer.toLowerCase() === correct.toLowerCase();

  input.disabled = true;
  input.style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';
  input.style.boxShadow = isCorrect
    ? '0 0 0 3px rgba(52,211,153,.2)'
    : '0 0 0 3px rgba(248,113,113,.2)';

  document.querySelector('.qt-submit-btn').disabled = true;

  recordAndShowResult(userAnswer, correct, isCorrect);
}

// ─────────────────────────────────────────────────────────
//  SEQUENCE
// ─────────────────────────────────────────────────────────

function renderSequence(question, container) {
  // correct_answer — массив строк в правильном порядке
  // options — те же строки, перемешанные
  const shuffled = [...(question.options || question.correct_answer || [])].sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <p class="qt-hint">Перетащите элементы в правильном порядке:</p>
    <div class="qt-sequence" id="sequenceList"></div>
    <button class="btn qt-submit-btn" onclick="checkSequence()">Проверить порядок</button>
  `;

  const list = document.getElementById('sequenceList');
  shuffled.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'qt-seq-item';
    el.draggable = true;
    el.dataset.value = item;
    el.innerHTML = `<span class="qt-seq-handle">⠿</span><span>${item}</span>`;
    list.appendChild(el);
  });

  initDragDrop(list);
}

function initDragDrop(list) {
  let dragEl = null;

  list.addEventListener('dragstart', e => {
    dragEl = e.target.closest('.qt-seq-item');
    dragEl.classList.add('dragging');
  });
  list.addEventListener('dragend', e => {
    dragEl?.classList.remove('dragging');
    dragEl = null;
  });
  list.addEventListener('dragover', e => {
    e.preventDefault();
    const afterEl = getDragAfterElement(list, e.clientY);
    if (afterEl == null) list.appendChild(dragEl);
    else list.insertBefore(dragEl, afterEl);
  });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.qt-seq-item:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function checkSequence() {
  const question = currentQuiz.questions[currentQuestionIndex];
  const correct = question.correct_answer; // массив
  const items = [...document.querySelectorAll('#sequenceList .qt-seq-item')];
  const userOrder = items.map(el => el.dataset.value);

  const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correct);

  // Подсветка
  items.forEach((el, i) => {
    el.classList.add(userOrder[i] === correct[i] ? 'seq-correct' : 'seq-wrong');
    el.draggable = false;
  });

  // Показать правильный порядок если ошибка
  if (!isCorrect) {
    const hint = document.createElement('div');
    hint.className = 'qt-correct-order';
    hint.innerHTML = `<strong>Правильный порядок:</strong><ol>${correct.map(c => `<li>${c}</li>`).join('')}</ol>`;
    document.getElementById('sequenceList').after(hint);
  }

  document.querySelector('.qt-submit-btn').disabled = true;
  recordAndShowResult(userOrder.join(' → '), correct.join(' → '), isCorrect);
}

// ─────────────────────────────────────────────────────────
//  MATCHING
// ─────────────────────────────────────────────────────────

function renderMatching(question, container) {
  // correct_answer — объект {left: right} или массив [{left, right}]
  // pairs: [{left, right}, ...]
  const pairs = question.pairs || [];
  const lefts = pairs.map(p => p.left);
  const rights = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <p class="qt-hint">Соедините элементы левого и правого столбца:</p>
    <div class="qt-matching" id="matchingArea">
      <div class="qt-match-col" id="matchLeft">
        ${lefts.map((l, i) => `
          <div class="qt-match-left" data-index="${i}">
            <span>${l}</span>
            <div class="qt-match-slot" data-for="${i}">
              <span class="slot-placeholder">Перетащите сюда…</span>
            </div>
          </div>`).join('')}
      </div>
      <div class="qt-match-col" id="matchRight">
        ${rights.map((r, i) => `
          <div class="qt-match-chip" draggable="true" data-value="${r}">${r}</div>`).join('')}
      </div>
    </div>
    <button class="btn qt-submit-btn" onclick="checkMatching()">Проверить</button>
  `;

  initMatchingDrag();
}

function initMatchingDrag() {
  let dragChip = null;

  document.querySelectorAll('.qt-match-chip').forEach(chip => {
    chip.addEventListener('dragstart', e => {
      dragChip = chip;
      chip.classList.add('dragging');
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging');
      dragChip = null;
    });
  });

  document.querySelectorAll('.qt-match-slot').forEach(slot => {
    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragChip) return;

      // Вернуть чип, который уже лежал в слоте, обратно в правый столбец
      const existing = slot.querySelector('.qt-match-chip');
      if (existing) {
        document.getElementById('matchRight').appendChild(existing);
      }

      // Если этот чип уже лежал в другом слоте — убрать его оттуда
      const prevSlot = dragChip.closest('.qt-match-slot');
      if (prevSlot) {
        prevSlot.innerHTML = '<span class="slot-placeholder">Перетащите сюда…</span>';
      }

      slot.innerHTML = '';
      slot.appendChild(dragChip);
    });
  });
}

function checkMatching() {
  const question = currentQuiz.questions[currentQuestionIndex];
  const pairs = question.pairs || [];
  const correct = {};
  pairs.forEach(p => correct[p.left] = p.right);

  let allCorrect = true;
  let matched = 0;

  document.querySelectorAll('.qt-match-left').forEach(row => {
    const leftLabel = row.querySelector('span').textContent;
    const slot = row.querySelector('.qt-match-slot');
    const chip = slot.querySelector('.qt-match-chip');

    if (!chip) {
      allCorrect = false;
      slot.classList.add('slot-wrong');
      return;
    }

    const userRight = chip.dataset.value;
    const isOk = userRight === correct[leftLabel];

    chip.classList.add(isOk ? 'match-correct' : 'match-wrong');
    slot.classList.add(isOk ? 'slot-ok' : 'slot-wrong');

    if (!isOk) {
      allCorrect = false;
      // показать правильный вариант
      const hint = document.createElement('span');
      hint.className = 'match-hint';
      hint.textContent = ' ✓ ' + correct[leftLabel];
      slot.appendChild(hint);
    } else {
      matched++;
    }
  });

  // Заблокировать чипы
  document.querySelectorAll('.qt-match-chip').forEach(c => c.draggable = false);
  document.querySelector('.qt-submit-btn').disabled = true;

  const userSummary = [...document.querySelectorAll('.qt-match-left')].map(row => {
    const l = row.querySelector('span').textContent;
    const chip = row.querySelector('.qt-match-chip');
    return `${l} → ${chip ? chip.dataset.value : '?'}`;
  }).join(', ');

  const correctSummary = pairs.map(p => `${p.left} → ${p.right}`).join(', ');

  recordAndShowResult(userSummary, correctSummary, allCorrect);
}

// ─────────────────────────────────────────────────────────
//  ОБЩИЙ РЕЗУЛЬТАТ
// ─────────────────────────────────────────────────────────

function recordAndShowResult(userAnswer, correctAnswer, isCorrect) {
  const question = currentQuiz.questions[currentQuestionIndex];

  userAnswers.push({
    question: question.question,
    userAnswer,
    correctAnswer,
    isCorrect
  });

  if (isCorrect) {
    score++;
    document.getElementById('scoreValue').textContent = score;
  }

  const rc = document.getElementById('resultContainer');
  rc.style.display = 'block';
  rc.className = `alert alert-${isCorrect ? 'success' : 'danger'}`;
  rc.textContent = isCorrect
    ? '✓ Правильно!'
    : `✗ Неверно! Правильный ответ: ${correctAnswer}`;

  if (currentQuestionIndex === currentQuiz.questions.length - 1) {
    document.getElementById('finishQuizBtn').style.display = 'inline-block';
  } else {
    document.getElementById('nextQuestionBtn').style.display = 'inline-block';
  }
}

// ─────────────────────────────────────────────────────────
//  ПОСТРОИТЕЛЬ ВОПРОСОВ (для страницы создания)
// ─────────────────────────────────────────────────────────

// Переопределяем addQuestion из index.html
function addQuestion() {
  const container = document.getElementById('questionsContainer');
  const idx = container.children.length;

  const div = document.createElement('div');
  div.className = 'question-item';
  div.innerHTML = `
    <div class="qt-builder-header">
      <h3>Вопрос ${idx + 1}</h3>
      <select class="qt-type-select" onchange="onQTypeChange(this)">
        <option value="multiple_choice">Выбор ответа</option>
        <option value="text_input">Ввод текста</option>
        <option value="sequence">Последовательность</option>
        <option value="matching">Сопоставление</option>
      </select>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.question-item').remove()">✕ Удалить</button>
    </div>
    <input type="text" placeholder="Текст вопроса" class="question-text" required>
    <div class="qt-type-fields"></div>
  `;
  container.appendChild(div);
  renderTypeFields(div.querySelector('.qt-type-select'));
}

function onQTypeChange(select) {
  renderTypeFields(select);
}

function renderTypeFields(select) {
  const item = select.closest('.question-item');
  const type = select.value;
  const fields = item.querySelector('.qt-type-fields');

  if (type === 'multiple_choice') {
    fields.innerHTML = `
      <div class="qt-mc-options">
        <p class="qt-field-label">Варианты ответов:</p>
        ${[1,2,3,4].map(i => `<input type="text" placeholder="Вариант ${i}" class="mc-option" required>`).join('')}
        <p class="qt-field-label">Правильный ответ:</p>
        <select class="correct-answer">
          <option value="0">Вариант 1</option>
          <option value="1">Вариант 2</option>
          <option value="2">Вариант 3</option>
          <option value="3">Вариант 4</option>
        </select>
      </div>`;

  } else if (type === 'text_input') {
    fields.innerHTML = `
      <p class="qt-field-label">Правильный ответ (точная строка):</p>
      <input type="text" placeholder="Правильный ответ" class="ti-correct" required>
      <p class="text-muted" style="font-size:12px;margin-top:4px;">Проверка без учёта регистра</p>`;

  } else if (type === 'sequence') {
    fields.innerHTML = `
      <p class="qt-field-label">Элементы в правильном порядке:</p>
      <div class="seq-inputs">
        ${[1,2,3,4].map(i => `<input type="text" placeholder="Элемент ${i}" class="seq-item" required>`).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addSeqItem(this)" style="margin-top:6px">+ Добавить элемент</button>`;

  } else if (type === 'matching') {
    fields.innerHTML = `
      <p class="qt-field-label">Пары для сопоставления:</p>
      <div class="match-pairs">
        ${[1,2,3].map(i => `
          <div class="match-pair-row">
            <input type="text" placeholder="Левый ${i}" class="match-left" required>
            <span class="match-arrow">↔</span>
            <input type="text" placeholder="Правый ${i}" class="match-right" required>
          </div>`).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addMatchPair(this)" style="margin-top:6px">+ Добавить пару</button>`;
  }
}

function addSeqItem(btn) {
  const container = btn.previousElementSibling;
  const n = container.children.length + 1;
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.placeholder = `Элемент ${n}`;
  inp.className = 'seq-item';
  container.appendChild(inp);
}

function addMatchPair(btn) {
  const container = btn.previousElementSibling;
  const n = container.children.length + 1;
  const row = document.createElement('div');
  row.className = 'match-pair-row';
  row.innerHTML = `
    <input type="text" placeholder="Левый ${n}" class="match-left" required>
    <span class="match-arrow">↔</span>
    <input type="text" placeholder="Правый ${n}" class="match-right" required>`;
  container.appendChild(row);
}

// ─────────────────────────────────────────────────────────
//  СБОР ДАННЫХ ВОПРОСА ПРИ СОХРАНЕНИИ КВИЗА
// ─────────────────────────────────────────────────────────

// Переопределяем saveQuiz — добавляем поддержку новых типов
const _origSaveQuiz = typeof saveQuiz === 'function' ? saveQuiz : null;

saveQuiz = async function () {
  if (!currentUser) {
    showPage('login');
    showMessage('loginMessage', 'Для создания квиза необходимо войти', 'danger');
    return;
  }

  const title = document.getElementById('quizTitle').value.trim();
  const description = document.getElementById('quizDescription').value.trim();
  const category = document.getElementById('quizCategory').value;

  const questionItems = document.querySelectorAll('.question-item');
  if (questionItems.length === 0) {
    showMessage('quizMessage', 'Добавьте хотя бы один вопрос', 'danger');
    return;
  }

  const questions = [];
  let hasErrors = false;

  questionItems.forEach((item) => {
    const type = item.querySelector('.qt-type-select')?.value || 'multiple_choice';
    const questionText = item.querySelector('.question-text')?.value.trim();
    if (!questionText) { hasErrors = true; return; }

    if (type === 'multiple_choice') {
      const opts = [...item.querySelectorAll('.mc-option')].map(i => i.value.trim());
      const correctIdx = parseInt(item.querySelector('.correct-answer')?.value || '0');
      if (opts.some(o => !o)) { hasErrors = true; return; }
      questions.push({
        type,
        question: questionText,
        options: opts,
        correct_answer: opts[correctIdx],
        answer: opts[correctIdx]
      });

    } else if (type === 'text_input') {
      const correct = item.querySelector('.ti-correct')?.value.trim();
      if (!correct) { hasErrors = true; return; }
      questions.push({ type, question: questionText, correct_answer: correct, answer: correct });

    } else if (type === 'sequence') {
      const items2 = [...item.querySelectorAll('.seq-item')].map(i => i.value.trim()).filter(Boolean);
      if (items2.length < 2) { hasErrors = true; return; }
      questions.push({
        type,
        question: questionText,
        options: [...items2],
        correct_answer: items2
      });

    } else if (type === 'matching') {
      const lefts = [...item.querySelectorAll('.match-left')].map(i => i.value.trim());
      const rights = [...item.querySelectorAll('.match-right')].map(i => i.value.trim());
      if (lefts.some(l => !l) || rights.some(r => !r) || lefts.length < 2) { hasErrors = true; return; }
      const pairs = lefts.map((l, i) => ({ left: l, right: rights[i] }));
      questions.push({ type, question: questionText, pairs, correct_answer: pairs });
    }
  });

  if (hasErrors) {
    showMessage('quizMessage', 'Заполните все поля вопросов', 'danger');
    return;
  }

  const newQuiz = { title, description, category, questions };

  try {
    const res = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newQuiz)
    });
    const data = await res.json();
    if (res.ok) {
      showMessage('quizMessage', 'Квиз успешно сохранён!', 'success');
      document.getElementById('quizForm').reset();
      setTimeout(() => { showPage('quizzes'); loadQuizzes(); }, 1500);
    } else {
      showMessage('quizMessage', data.error || 'Ошибка при создании квиза', 'danger');
    }
  } catch (err) {
    showMessage('quizMessage', 'Ошибка соединения с сервером', 'danger');
  }
};
