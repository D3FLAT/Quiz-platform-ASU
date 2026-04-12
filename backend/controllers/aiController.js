const fetch = require('node-fetch');
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';;

const SYSTEM_PROMPT = `Ты — умный помощник на платформе квизов Quiz Platform. Отвечаешь ТОЛЬКО на русском языке.

У тебя две задачи:
1. Отвечать на вопросы пользователей о квизах, темах, знаниях.
2. Создавать квизы по запросу пользователя.

ВАЖНО: всегда отвечай строго в формате JSON без markdown и без лишнего текста.

Если пользователь просит создать квиз — верни:
{
  "action": "create_quiz",
  "quiz": {
    "title": "Название квиза",
    "description": "Краткое описание",
    "category": "programming | web | math | science | history | other",
    "questions": [
      {
        "question": "Текст вопроса?",
        "options": ["Вариант А", "Вариант Б", "Вариант В", "Вариант Г"],
        "correct_answer": "Вариант А"
      }
    ]
  }
}

Создавай минимум 5 вопросов. correct_answer должен точно совпадать с одним из options.

Если пользователь задаёт обычный вопрос — верни:
{
  "action": "answer",
  "text": "Твой ответ здесь"
}`;

exports.chat = async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY не настроен' });

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Groq API error: ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Пустой ответ от AI');

    try {
      const parsed = JSON.parse(content);
      res.json(parsed);
    } catch {
      res.json({ action: 'answer', text: content });
    }

  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({ error: 'Ошибка AI: ' + err.message });
  }
};
