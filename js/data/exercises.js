/**
 * Банк упражнений и проверка перевода.
 *
 * База упражнений собирается из примеров комплекта (клетки таблиц 2–6, 11),
 * к которым добавлены классические предложения методики.
 */

/* --- Сбор упражнений из клеток таблиц ----------------------------- */

function buildExercisesFromTables() {
  var out = [];
  TABLE_ORDER.forEach(function (id) {
    var t = TABLES[id];
    if (!t || !t.cells) return;
    t.cells.forEach(function (c) {
      if (c.ru && c.en && c.kit) {
        out.push({
          ru: c.ru,
          en: c.en,
          tableId: t.id,
          tableNum: t.num,
          tableName: t.name,
          cellNum: c.num,
          voice: c.voice,
          form: c.form,
          time: c.time,
          hint: buildHint(c)
        });
      }
    });
  });
  return out;
}

/** Подсказка: цветовая схема предложения. */
function buildHint(cell) {
  var f = formDef(cell.form);
  var t = timeDef(cell.time);
  var parts = [];
  if (cell.voice) parts.push(cell.voice === "passive" ? "Пассив (страдательный залог)" : "Актив (действительный залог)");
  parts.push(f && f.question ? "ВОПРОС" : "Утверждение");
  if (f && f.negative) parts.push("с отрицанием (not / n't)");
  if (t) parts.push(t.label + " время");
  parts.push("Цвета: " + cell.colors.map(function (c) { return COLORS[c].short; }).join(" → "));
  return parts.join(". ");
}

/* --- Курированные упражнения (методика Зайцева) ------------------ */

const EXTRA_EXERCISES = [
  { ru: "Где работает твой отец?", en: "Where does your father work?", tableId: "indefinite", cellNum: 25 },
  { ru: "Я студент.", en: "I am a student.", tableId: "to_be", cellNum: 2 },
  { ru: "Он был студентом.", en: "He was a student.", tableId: "to_be", cellNum: 1 },
  { ru: "Она будет студенткой.", en: "She will be a student.", tableId: "to_be", cellNum: 3 },
  { ru: "Они не студенты.", en: "They are not students.", tableId: "to_be", cellNum: 6 },
  { ru: "Мы будем студентами.", en: "We will be students.", tableId: "to_be", cellNum: 3 },
  { ru: "Ученым показали новый исследовательский центр.", en: "The new research centre has been shown to the scientists.", tableId: "perfect", cellNum: 83 },
  { ru: "Наверху накрывали столы.", en: "The tables were being laid upstairs.", tableId: "continuous", cellNum: 61 },
  { ru: "Ты уже сделал домашнее задание?", en: "Have you done your home-work yet?", tableId: "perfect", cellNum: 77 },
  { ru: "Что ты читаешь?", en: "What are you reading?", tableId: "continuous", cellNum: 53 },
  { ru: "Этот дом построили в 1990 году.", en: "This house was built in 1990.", tableId: "indefinite", cellNum: 30 },
  { ru: "Дом не строят.", en: "The house isn't being built.", tableId: "continuous", cellNum: 62 },
  { ru: "Он не придет завтра.", en: "He won't come tomorrow.", tableId: "indefinite", cellNum: 23 },
  { ru: "Ты можешь мне помочь?", en: "Can you help me?", tableId: "modal", cellNum: 124 },
  { ru: "На столе лежит книга.", en: "There is a book on the table.", tableId: "there", cellNum: 134 }
];

/* --- Итоговый банк ------------------------------------------------ */

const EXERCISES = buildExercisesFromTables().concat(EXTRA_EXERCISES.map(function (e) {
  e.tableName = TABLES[e.tableId] ? TABLES[e.tableId].name : "";
  e.tableNum = TABLES[e.tableId] ? TABLES[e.tableId].num : "";
  var t = TABLES[e.tableId];
  if (t && t.cells) {
    t.cells.forEach(function (c) {
      if (c.num === e.cellNum && !e.hint) {
        e.voice = c.voice; e.form = c.form; e.time = c.time; e.hint = buildHint(c);
      }
    });
  }
  return e;
}));

/* ------------------------------------------------------------------ */
/* Проверка перевода                                                   */
/* ------------------------------------------------------------------ */

/** Сокращения ↔ полные формы (допустимые вариации). */
const CONTRACTIONS = [
  ["isn't", "is not"], ["aren't", "are not"], ["wasn't", "was not"], ["weren't", "were not"],
  ["don't", "do not"], ["doesn't", "does not"], ["didn't", "did not"],
  ["won't", "will not"], ["shan't", "shall not"],
  ["haven't", "have not"], ["hasn't", "has not"], ["hadn't", "had not"],
  ["can't", "cannot"], ["can't", "can not"], ["mustn't", "must not"], ["needn't", "need not"],
  ["couldn't", "could not"], ["wouldn't", "would not"], ["shouldn't", "should not"], ["mightn't", "might not"],
  ["let's", "let us"],
  ["I'm", "I am"], ["you're", "you are"], ["we're", "we are"], ["they're", "they are"],
  ["he's", "he is"], ["she's", "she is"], ["it's", "it is"],
  ["that's", "that is"], ["there's", "there is"], ["what's", "what is"],
  ["I'll", "I will"], ["you'll", "you will"], ["he'll", "he will"], ["she'll", "she will"],
  ["we'll", "we will"], ["they'll", "they will"], ["it'll", "it will"],
  ["I've", "I have"], ["you've", "you have"], ["we've", "we have"], ["they've", "they have"],
  ["I'd", "I would"], ["I'd", "I had"], ["he'd", "he would"], ["he'd", "he had"],
  ["she'd", "she would"], ["she'd", "she had"], ["we'd", "we would"], ["they'd", "they would"]
];

/**
 * Приводит предложение к «нормальной» форме:
 *  - убирает лишние пробелы, приводит к нижнему регистру;
 *  - отделяет знаки препинания;
 *  - раскрывает сокращения.
 */
function normalizeAnswer(str) {
  var s = (str || "").toString().toLowerCase().trim();
  s = s.replace(/[’`]/g, "'");
  s = s.replace(/\s+/g, " ");
  // Раскрываем сокращения (итеративно, чтобы учесть несколько).
  // Внимание: строка уже в нижнем регистре, поэтому и шаблоны, и замены
  // приводим к нижнему регистру — иначе «I'm» никогда не совпадёт.
  var changed = true;
  var guard = 0;
  while (changed && guard < 10) {
    changed = false;
    guard++;
    CONTRACTIONS.forEach(function (pair) {
      var from = pair[0].toLowerCase();
      var to = pair[1].toLowerCase();
      var re = new RegExp(escapeRegExp(from) + "(?![a-z])", "g");
      if (re.test(s)) {
        s = s.replace(re, to);
        changed = true;
      }
    });
  }
  // Отделяем знаки препинания пробелом и схлопываем пробелы.
  s = s.replace(/([?!.,;:])/g, " $1 ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Разбивает нормализованную строку на токены. */
function tokenize(str) {
  return normalizeAnswer(str).split(" ").filter(Boolean);
}

/** Завершающий знак препинания (если есть) — как отдельный токен. */
function trailingPunct(arr) {
  var t = arr[arr.length - 1];
  return t && /^[?!.,;:]+$/.test(t) ? t : null;
}

/** Есть ли массив needle подряд (без разрывов) внутри массива hay. */
function containsRun(hay, needle) {
  if (!needle.length || needle.length > hay.length) return false;
  for (var i = 0; i + needle.length <= hay.length; i++) {
    var ok = true;
    for (var j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

/** Сравнивает ответ пользователя с эталоном (с учётом сокращений). */
function checkAnswer(user, reference) {
  var a = tokenize(user);
  var b = tokenize(reference);
  // Завершающую точку / вопросительный знак считаем необязательными.
  var ac = trailingPunct(a) ? a.slice(0, -1) : a;
  var bc = trailingPunct(b) ? b.slice(0, -1) : b;

  var max = Math.max(ac.length, bc.length);
  if (max === 0) return { correct: false, score: 0, diff: [] };

  // Сравнение по позициям (простая, но наглядная метрика).
  var same = 0;
  var diff = [];
  for (var i = 0; i < max; i++) {
    if (ac[i] && bc[i] && ac[i] === bc[i]) same++;
    else diff.push({ i: i, got: ac[i] || "", want: bc[i] || "" });
  }
  var score = Math.round((same / max) * 100);

  // В эталоне бывает два предложения: засчитываем совпадение с любым
  // из них (достаточно 3+ слов, чтобы не ловить случайные короткие совпадения).
  var contained = false;
  if (ac.length >= 3 && containsRun(bc, ac)) contained = true;
  if (bc.length >= 3 && containsRun(ac, bc)) contained = true;
  if (contained && score < 100) { score = 100; diff = []; }

  return { correct: score === 100, score: score, diff: diff };
}

/** Ближайшее упражнение по номеру клетки. */
function exercisesForCell(num) {
  return EXERCISES.filter(function (e) { return e.cellNum === num; });
}

/** Случайное упражнение, по возможности из указанной таблицы. */
function randomExercise(tableId) {
  var pool = EXERCISES;
  if (tableId) {
    var filtered = EXERCISES.filter(function (e) { return e.tableId === tableId; });
    if (filtered.length) pool = filtered;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
