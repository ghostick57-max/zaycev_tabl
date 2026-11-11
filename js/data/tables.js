/**
 * ТАБЛИЦЫ ЗАЙЦЕВА — структурированные данные.
 *
 * Ключевая идея: цвет = член предложения.
 * Каждая клетка (cell) описывает один «адрес» в таблице:
 *   num    — номер клетки (как в бумажном комплекте: «клетка 25»)
 *   voice  — active (действительный залог) | passive (страдательный залог)
 *   form   — statement | optional_not | negative | question | negative_question
 *   time   — past | present | future
 *   colors — какие члены предложения участвуют (для цветовой схемы)
 *   template — цветной шаблон предложения (массив отрезков {c, t})
 *   en/ru  — пример предложения и перевод
 *
 * Нумерация клеток непрерывна по комплекту: таблица 2 — 1…14,
 * таблица 3 — 15…43 и т.д. (правило «угадай номер клетки»).
 */

/* ------------------------------------------------------------------ */
/* Справочники                                                         */
/* ------------------------------------------------------------------ */

const TIMES = [
  { key: "past", label: "Прошедшее", short: "Past", ru: "вчера" },
  { key: "present", label: "Настоящее", short: "Present", ru: "сегодня" },
  { key: "future", label: "Будущее", short: "Future", ru: "завтра" }
];

const FORMS = [
  { key: "statement", label: "Утверждение", sign: ".", negative: false, question: false },
  { key: "optional_not", label: "Утверждение с not", sign: ".", negative: true, question: false },
  { key: "negative", label: "Отрицание", sign: ".", negative: true, question: false },
  { key: "question", label: "Вопрос", sign: "?", negative: false, question: true },
  { key: "negative_question", label: "Вопрос с отрицанием", sign: "?", negative: true, question: true }
];

function formDef(key) {
  for (var i = 0; i < FORMS.length; i++) if (FORMS[i].key === key) return FORMS[i];
  return null;
}
function timeDef(key) {
  for (var i = 0; i < TIMES.length; i++) if (TIMES[i].key === key) return TIMES[i];
  return null;
}

/* ------------------------------------------------------------------ */
/* Цветные шаблоны предложений                                         */
/* ------------------------------------------------------------------ */

function seg(c, t) {
  return { c: c, t: t };
}

// Дополнение/обстоятельство по времени.
function greenTail(time) {
  var where = time === "past" ? "yesterday" : time === "present" ? "every day" : "tomorrow";
  return seg("green", "in the garden " + where);
}

/** Строит цветной шаблон для клетки. */
function makeTemplate(kind, voice, form, time) {
  var S_of = seg("red", "The children");
  var S_house = seg("red", "The house");
  var obj = greenTail(time);
  var dot = seg("yellow", ".");
  var q = seg("yellow", "?");
  var not = seg("black", "not");
  var nt = seg("black", "n't");

  var vPast = "worked", vPres = "work", vFut = "will work";
  var V = time === "past" ? vPast : time === "present" ? vPres : vFut;
  var auxLow = time === "past" ? "did" : time === "present" ? "do" : "will";
  var auxCap = time === "past" ? "Did" : time === "present" ? "Do" : "Will";

  switch (kind) {
    /* ---------------------------- TO BE --------------------------- */
    case "tobe": {
      var be = time === "past" ? "was" : time === "present" ? "is" : "will be";
      var comp = seg("green", "soft and comfortable");
      if (form === "statement") return [S_of, seg("blue", be), comp, dot];
      if (form === "optional_not") return [S_of, seg("blue", be), not, comp, dot];
      if (form === "negative") return [S_of, seg("blue", be), nt, comp, dot];
      if (form === "question") return [seg("blue", be.charAt(0).toUpperCase() + be.slice(1)), S_of, comp, q];
      return [seg("blue", be.charAt(0).toUpperCase() + be.slice(1)), nt, S_of, comp, q];
    }

    /* -------------------------- INDEFINITE ------------------------ */
    case "indefinite": {
      if (voice === "passive") {
        var bep = time === "past" ? "was" : time === "present" ? "is" : "will be";
        var v3 = "built";
        if (form === "statement") return [S_house, seg("blue", bep + " " + v3), obj, dot];
        if (form === "optional_not") return [S_house, seg("blue", bep), not, seg("blue", v3), obj, dot];
        if (form === "negative") return [S_house, seg("blue", bep), nt, seg("blue", v3), obj, dot];
        if (form === "question") return [seg("blue", bep.charAt(0).toUpperCase() + bep.slice(1)), S_house, seg("blue", v3), obj, q];
        return [seg("blue", bep.charAt(0).toUpperCase() + bep.slice(1)), nt, S_house, seg("blue", v3), obj, q];
      }
      if (form === "statement") return [S_of, seg("blue", V), obj, dot];
      if (form === "optional_not") return [S_of, seg("blue", auxLow), not, seg("blue", "work"), obj, dot];
      if (form === "negative") return [S_of, seg("blue", time === "past" ? "did" : time === "present" ? "does" : "will"), time === "future" ? not : nt, seg("blue", "work"), obj, dot];
      if (form === "question") return [seg("blue", auxCap), S_of, seg("blue", "work"), obj, q];
      return [seg("blue", auxCap), nt, S_of, seg("blue", "work"), obj, q];
    }

    /* -------------------------- CONTINUOUS ------------------------ */
    case "continuous": {
      var bec = time === "past" ? "was" : time === "present" ? "is" : "will be";
      if (voice === "passive") {
        if (form === "statement") return [S_house, seg("blue", bec + " being built"), obj, dot];
        if (form === "negative") return [S_house, seg("blue", bec), nt, seg("blue", "being built"), obj, dot];
        if (form === "question") return [seg("blue", bec.charAt(0).toUpperCase() + bec.slice(1)), S_house, seg("blue", "being built"), obj, q];
        return [seg("blue", bec.charAt(0).toUpperCase() + bec.slice(1)), nt, S_house, seg("blue", "being built"), obj, q];
      }
      if (form === "statement") return [S_of, seg("blue", time === "past" ? "were working" : time === "present" ? "are working" : "will be working"), obj, dot];
      if (form === "optional_not") return [S_of, seg("blue", time === "past" ? "were" : time === "present" ? "are" : "will be"), not, seg("blue", "working"), obj, dot];
      if (form === "negative") return [S_of, seg("blue", time === "past" ? "were" : time === "present" ? "are" : "will"), nt, seg("blue", "working"), obj, dot];
      if (form === "question") return [seg("blue", time === "past" ? "Were" : time === "present" ? "Are" : "Will"), S_of, seg("blue", "working"), obj, q];
      return [seg("blue", time === "past" ? "Weren't" : time === "present" ? "Aren't" : "Won't"), S_of, seg("blue", "working"), obj, q];
    }

    /* ---------------------------- PERFECT ------------------------- */
    case "perfect": {
      if (voice === "passive") {
        var havep = time === "past" ? "had" : time === "present" ? "have" : "will have";
        if (form === "statement") return [S_house, seg("blue", havep + " been built"), obj, dot];
        if (form === "optional_not") return [S_house, seg("blue", havep), not, seg("blue", "been built"), obj, dot];
        if (form === "negative") return [S_house, seg("blue", havep), nt, seg("blue", "been built"), obj, dot];
        if (form === "question") return [seg("blue", havep.charAt(0).toUpperCase() + havep.slice(1)), S_house, seg("blue", "been built"), obj, q];
        return [seg("blue", havep.charAt(0).toUpperCase() + havep.slice(1)), nt, S_house, seg("blue", "been built"), obj, q];
      }
      var have = time === "past" ? "had" : time === "present" ? "have" : "will have";
      if (form === "statement") return [S_of, seg("blue", have + " worked"), obj, dot];
      if (form === "optional_not") return [S_of, seg("blue", have), not, seg("blue", "worked"), obj, dot];
      if (form === "negative") return [S_of, seg("blue", have), nt, seg("blue", "worked"), obj, dot];
      if (form === "question") return [seg("blue", have.charAt(0).toUpperCase() + have.slice(1)), S_of, seg("blue", "worked"), obj, q];
      return [seg("blue", have.charAt(0).toUpperCase() + have.slice(1)), nt, S_of, seg("blue", "worked"), obj, q];
    }

    /* ---------------------- PERFECT CONTINUOUS -------------------- */
    case "perfect_continuous": {
      var havec = time === "past" ? "had" : time === "present" ? "have" : "will have";
      if (form === "statement") return [S_of, seg("blue", havec + " been working"), obj, dot];
      if (form === "optional_not") return [S_of, seg("blue", havec), not, seg("blue", "been working"), obj, dot];
      if (form === "negative") return [S_of, seg("blue", havec), nt, seg("blue", "been working"), obj, dot];
      if (form === "question") return [seg("blue", havec.charAt(0).toUpperCase() + havec.slice(1)), S_of, seg("blue", "been working"), obj, q];
      return [seg("blue", havec.charAt(0).toUpperCase() + havec.slice(1)), nt, S_of, seg("blue", "been working"), obj, q];
    }

    /* --------------------------- IMPERATIVE ----------------------- */
    case "imperative": {
      if (form === "negative") return [seg("blue", "Don't"), seg("blue", "work"), obj, dot];
      if (form === "question") return [seg("blue", "Will you"), seg("blue", "work"), obj, q];
      return [seg("blue", "Work"), obj, dot];
    }

    /* ----------------------------- MODAL -------------------------- */
    case "modal": {
      var m = "can";
      if (form === "statement") return [S_of, seg("blue", m), seg("blue", "work"), obj, dot];
      if (form === "negative") return [S_of, seg("blue", m), not, seg("blue", "work"), obj, dot];
      if (form === "optional_not") return [S_of, seg("blue", m), nt, seg("blue", "work"), obj, dot];
      if (form === "question") return [seg("blue", m.charAt(0).toUpperCase() + m.slice(1)), S_of, seg("blue", "work"), obj, q];
      return [seg("blue", m.charAt(0).toUpperCase() + m.slice(1) + "n't"), S_of, seg("blue", "work"), obj, q];
    }

    /* ----------------------------- THERE -------------------------- */
    case "there": {
      var bet = time === "past" ? "was" : time === "present" ? "is" : "will be";
      if (form === "negative") return [seg("red", "There"), seg("blue", bet), seg("black", "no"), seg("green", "books on the table"), dot];
      if (form === "question") return [seg("blue", bet.charAt(0).toUpperCase() + bet.slice(1)), seg("red", "there"), seg("green", "any books on the table"), q];
      return [seg("red", "There"), seg("blue", bet), seg("green", "a book on the table"), dot];
    }
  }
  return [seg("gray", "—")];
}

function colorsOf(template) {
  var seen = {}, out = [];
  template.forEach(function (s) {
    if (!seen[s.c]) { seen[s.c] = 1; out.push(s.c); }
  });
  return out;
}

function templateText(template) {
  return template.map(function (s) { return s.t; }).join(" ");
}

function plainExample(template) {
  return template.map(function (s) { return s.t; }).join(" ")
    .replace(/\s+([?.])/g, "$1").replace(/\s+'/g, "'");
}

/* ------------------------------------------------------------------ */
/* Конструкторы клеток                                                 */
/* ------------------------------------------------------------------ */

function makeCell(num, kind, voice, form, time, en, ru, kit) {
  var template = makeTemplate(kind, voice, form, time);
  return {
    num: num,
    kind: kind,
    voice: voice || null,
    form: form,
    time: time,
    colors: colorsOf(template),
    template: template,
    en: en || plainExample(template),
    ru: ru || "",
    kit: !!kit
  };
}

/* Номера клеток по «блочной» формуле комплекта. */
function numberBlocks(base, blocks) {
  // blocks: [{form, times:[...]}] — номер растёт по времени, блоки идут по 3.
  var num = base, out = [];
  blocks.forEach(function (b) {
    b.times.forEach(function (t) {
      out.push({ num: num++, form: b.form, time: t });
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Таблица 2. TO BE                                                    */
/* ------------------------------------------------------------------ */

function buildToBe() {
  var blocks = [
    { form: "statement", times: ["past", "present", "future"] },
    { form: "optional_not", times: ["present", "future"] },
    { form: "negative", times: ["past", "present", "future"] },
    { form: "question", times: ["past", "present", "future"] },
    { form: "negative_question", times: ["past", "present", "future"] }
  ];
  var nums = numberBlocks(1, blocks);
  var kit = {
    1: { en: "The sofa was soft and comfortable.", ru: "Диван был мягким и удобным." },
    2: { en: "She is about twenty-six.", ru: "Ей около двадцати шести." },
    3: { en: "It will be nice to see you again.", ru: "Приятно будет снова с вами увидеться." },
    4: { en: "The policeman's name's John Nox.", ru: "Полицейского зовут Джон Нокс." },
    5: { en: "The policeman'll be on his guard.", ru: "Полицейский будет на своем посту." },
    6: { en: "The news wasn't interesting.", ru: "Новости были неинтересны." },
    7: { en: "You aren't ready yet, Jim.", ru: "Ты еще не готов, Джим." },
    8: { en: "I shan't be in town on Sunday.", ru: "В воскресенье меня не будет в городе." },
    9: { en: "What colour was her jacket?", ru: "Какого цвета была ее куртка?" },
    10: { en: "Is fruit expensive in Moscow?", ru: "Фрукты дороги в Москве?" },
    11: { en: "Will it be possible to speak to him tomorrow?", ru: "Можно ли будет поговорить с ним завтра?" },
    12: { en: "Wasn't the voltage high enough for the TV set?", ru: "Разве напряжение было недостаточно высоким для телевизора?" },
    13: { en: "Aren't they too young for the army?", ru: "Не слишком ли они молоды для службы в армии?" },
    14: { en: "Won't it be too expensive for us?", ru: "Не будет ли это слишком дорого для нас?" }
  };
  var cells = nums.map(function (n) {
    var k = kit[n.num] || {};
    return makeCell(n.num, "tobe", "active", n.form, n.time, k.en, k.ru, !!k.en);
  });
  return {
    id: "to_be",
    num: 2,
    name: "TO BE",
    subtitle: "Глагол «быть»: am / is / are, was / were, will be",
    description: "Утвердительные, отрицательные, вопросительные и вопросительно-отрицательные предложения в прошедшем, настоящем и будущем времени.",
    image: "assets/tables/table02.jpg",
    kind: "tobe",
    voices: ["active"],
    cells: cells,
    notes: [
      "Was not = wasn't, were not = weren't.",
      "I am (not) → I'm (not); he is (not) → he's (not).",
      "Вопрос: am I (not)? is he (not)? isn't he?"
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблица 3. INDEFINITE (Active / Passive)                            */
/* ------------------------------------------------------------------ */

function buildIndefinite() {
  var activeNums = numberBlocks(15, [
    { form: "statement", times: ["past", "present", "future"] },
    { form: "optional_not", times: ["past", "present", "future"] },
    { form: "negative", times: ["past", "present", "future"] },
    { form: "question", times: ["past", "present", "future"] },
    { form: "negative_question", times: ["past", "present", "future"] }
  ]);
  var passiveNums = numberBlocks(30, [
    { form: "statement", times: ["past", "present", "future"] },
    { form: "optional_not", times: ["present", "future"] },
    { form: "negative", times: ["past", "present", "future"] },
    { form: "question", times: ["past", "present", "future"] },
    { form: "negative_question", times: ["past", "present", "future"] }
  ]);

  var kit = {
    15: { en: "They went to bed late yesterday. Mr. Smith worked in the garden on Sunday.", ru: "Вчера они поздно легли спать. В воскресенье мистер Смит работал в саду." },
    16: { en: "I have breakfast at eight o'clock as a rule.", ru: "Как правило, я завтракаю в 8 часов." },
    17: { en: "After the lecture you will understand everything.", ru: "После этой лекции вы всё поймете." },
    18: { en: "The chairman did not introduce the speaker to the audience.", ru: "Председатель не представил выступающего аудитории." },
    19: { en: "His expenses do not correspond to his income.", ru: "Его расходы не соответствуют доходам." },
    20: { en: "You will not hear any good music there.", ru: "Вы не услышите там хорошей музыки." },
    21: { en: "You didn't thank him for his present.", ru: "Ты не поблагодарил его за подарок." },
    22: { en: "Mr. Black doesn't smoke before breakfast.", ru: "Мистер Блэк не курит перед завтраком." },
    23: { en: "We shan't see you till next week.", ru: "Мы не увидимся с вами до следующей недели." },
    24: { en: "Where did you buy this nice dress? Did Ann not tell you about her trip?", ru: "Где ты купила это красивое платье? Анна не рассказала вам о своем путешествии?" },
    25: { en: "Which of these boys do you want to speak to?", ru: "С кем из этих ребят вы хотите поговорить?" },
    26: { en: "Shall I drive you to the railway station?", ru: "Тебя отвезти на станцию?" },
    27: { en: "Didn't the noise frighten you?", ru: "Неужели этот шум не напугал тебя?" },
    28: { en: "Why don't you take music lessons?", ru: "Почему ты не занимаешься музыкой?" },
    29: { en: "Why won't you accept his offer?", ru: "Почему ты не примешь его предложения?" },
    30: { en: "The house was built two years ago. He was bribed to keep silence.", ru: "Дом построили два года назад. Его подкупили, чтобы молчал." },
    31: { en: "Telegraph cables are usually laid under the ground.", ru: "Телеграфный кабель обычно прокладывают под землей." },
    32: { en: "The finder will be given a reward of 5 pounds.", ru: "Нашедший получит вознаграждение в 5 фунтов." },
    33: { en: "I'm assisted by Mr. King.", ru: "Мне помогает мистер Кинг." },
    34: { en: "She will be taken to hospital tomorrow.", ru: "Завтра ее заберут в больницу." },
    35: { en: "Her name wasn't crossed out.", ru: "Ее фамилию не вычеркнули." },
    36: { en: "His garden isn't looked after.", ru: "За его садом не ухаживают." },
    37: { en: "Your decision won't be approved by the authority.", ru: "Руководство не одобрит вашего решения." },
    38: { en: "When was John Kennedy elected President of the USA?", ru: "Когда Джона Кеннеди выбирали президентом США?" },
    39: { en: "Are these expressions used in common speech?", ru: "Употребляются ли эти выражения в обыденной речи?" },
    40: { en: "When will the money be collected?", ru: "Когда соберут деньги?" },
    41: { en: "Why wasn't she appointed secretary?", ru: "Почему ее не назначили секретарем?" },
    42: { en: "Aren't the words in this dictionary arranged in alphabetical order?", ru: "Разве слова в этом словаре расположены не в алфавитном порядке?" },
    43: { en: "Why won't the workers be paid for their job?", ru: "Почему рабочим не заплатят за работу?" }
  };

  var cells = [];
  activeNums.forEach(function (n) {
    var k = kit[n.num] || {};
    cells.push(makeCell(n.num, "indefinite", "active", n.form, n.time, k.en, k.ru, !!k.en));
  });
  passiveNums.forEach(function (n) {
    var k = kit[n.num] || {};
    cells.push(makeCell(n.num, "indefinite", "passive", n.form, n.time, k.en, k.ru, !!k.en));
  });

  return {
    id: "indefinite",
    num: 3,
    name: "INDEFINITE",
    subtitle: "Простое время: V1 / V2 / will V1, Passive: be + V3",
    description: "Верхняя половина — Active (действительный залог), нижняя — Passive (страдательный залог). Пять блоков: утверждение, утверждение с not, отрицание, вопрос, вопрос с отрицанием.",
    image: "assets/tables/table03.jpg",
    kind: "indefinite",
    voices: ["active", "passive"],
    cells: cells,
    notes: [
      "1, 2, 3 — первая, вторая, третья форма глагола; 1s — первая форма с -s.",
      "TO 1 — формула 1 инфинитива (Active); TO BE 3 — инфинитив Passive (be + V3).",
      "Клетки в полосочку — элемент может быть, а может и не быть.",
      "«Отвязанные» слова (already, always, never, often, just…) пристраиваются к глаголу."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Помощник: блоки по формуле для Continuous / Perfect / Perf. Cont.   */
/* ------------------------------------------------------------------ */

function standardActiveBlocks() {
  return [
    { form: "statement", times: ["past", "present", "future"] },
    { form: "optional_not", times: ["past", "present", "future"] },
    { form: "negative", times: ["past", "present", "future"] },
    { form: "question", times: ["past", "present", "future"] },
    { form: "negative_question", times: ["past", "present", "future"] }
  ];
}

/* ------------------------------------------------------------------ */
/* Таблица 4. CONTINUOUS                                               */
/* ------------------------------------------------------------------ */

function buildContinuous() {
  // Active: 44…58 (15). Passive (без Future — редко): 6 клеток.
  var activeNums = numberBlocks(44, standardActiveBlocks());
  var passiveNums = numberBlocks(59, [
    { form: "statement", times: ["present"] },
    { form: "negative", times: ["past", "present"] },
    { form: "question", times: ["past", "present"] },
    { form: "negative_question", times: ["past", "present"] }
  ]);

  var kit = {
    44: { en: "I was watching TV yesterday from seven to nine.", ru: "Вчера вечером я с 7 до 9 смотрел телевизор." },
    45: { en: "The lesson is going on. I am sitting on a chair and eating a banana.", ru: "Урок продолжается. Я сейчас сижу на стуле и ем банан." },
    46: { en: "We shall not be playing football next week.", ru: "На следующей неделе мы не будем играть в футбол." },
    49: { en: "We weren't having English at ten o'clock.", ru: "У нас не было английского в 10 часов." },
    50: { en: "He isn't building a house, he is building a garage.", ru: "Он строит не дом, он строит гараж." },
    51: { en: "We shan't be playing chess here.", ru: "Мы не будем здесь играть в шахматы." },
    52: { en: "What were you looking for when I came in?", ru: "Что ты искал, когда я вошел?" },
    53: { en: "Is he wearing dark glasses now?", ru: "Он сейчас в темных очках?" },
    54: { en: "For how long will you be staying here?", ru: "Как долго вы здесь пробудете?" },
    55: { en: "Weren't you having a lesson at this time yesterday?", ru: "Разве у тебя вчера в это время не было уроков?" },
    56: { en: "Isn't Bob doing his home-work?", ru: "Разве Боб не делает сейчас домашнее задание?" },
    57: { en: "Won't she be taking her exams next week?", ru: "Неужели она не будет сдавать экзаменов на следующей неделе?" },
    59: { en: "Now this job is being offered to me.", ru: "Теперь эту работу предлагают мне." },
    60: { en: "This newspaper's being read everywhere.", ru: "Эту газету читают везде." },
    61: { en: "The room wasn't being cleaned when we came.", ru: "Комнату не убирали, когда мы пришли." },
    62: { en: "The room isn't being cleaned, you may come in.", ru: "Комнату не убирают, вы можете войти." },
    63: { en: "Were these toys being sold at the shop?", ru: "Продавали эти игрушки в магазине?" },
    64: { en: "What film is being shown in the nearest cinema?", ru: "Какой фильм идет в ближайшем кинотеатре?" },
    65: { en: "Weren't we being made fun of all the evening?", ru: "Разве над нами не смеялись весь вечер?" },
    66: { en: "Isn't a new theatre being built?", ru: "Новый театр разве не строят?" }
  };

  var cells = [];
  activeNums.forEach(function (n) {
    var k = kit[n.num] || {};
    cells.push(makeCell(n.num, "continuous", "active", n.form, n.time, k.en, k.ru, !!k.en));
  });
  passiveNums.forEach(function (n) {
    var k = kit[n.num] || {};
    cells.push(makeCell(n.num, "continuous", "passive", n.form, n.time, k.en, k.ru, !!k.en));
  });

  return {
    id: "continuous",
    num: 4,
    name: "CONTINUOUS",
    subtitle: "be + V-ing (действие в момент речи)",
    description: "Active и Passive. Future Continuous Passive чрезвычайно редок, поэтому нижний ряд клеток отсутствует.",
    image: "assets/tables/table04.jpg",
    kind: "continuous",
    voices: ["active", "passive"],
    cells: cells,
    notes: [
      "Active: am / is / are + V-ing; was / were + V-ing; will be + V-ing.",
      "Passive: am / is / are + being + V3; was / were + being + V3.",
      "4-я форма глагола (V-ing) — причастие I / герундий."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблица 5. PERFECT                                                  */
/* ------------------------------------------------------------------ */

function buildPerfect() {
  var activeNums = numberBlocks(67, standardActiveBlocks());
  var passiveNums = numberBlocks(82, standardActiveBlocks());

  var kit = {
    67: { en: "The poor woman had seen happier days before she married.", ru: "Бедняжка до замужества знавала более счастливые дни." },
    68: { en: "Ann has already had her dinner. Thirty five countries have signed the Helsinki agreement.", ru: "Энн уже пообедала. Хельсинские соглашения подписали 35 стран." },
    69: { en: "By this time tomorrow I shall have reached my house.", ru: "Завтра к этому времени я уже доберусь до дома." },
    70: { en: "John and Mary'd eaten the pie when their friends came.", ru: "Когда пришли друзья, Джон и Мэри уже съели пирог." },
    71: { en: "I'm afraid I've got rather a bad cold.", ru: "Боюсь, что я сильно простудился." },
    72: { en: "By the end of the week he'll have consulted the doctor.", ru: "К концу недели он проконсультируется у врача." },
    73: { en: "She hadn't read that book since childhood.", ru: "Она не перечитывала этой книги с детства." },
    74: { en: "They haven't bought new furniture yet.", ru: "Они еще не купили новую мебель." },
    75: { en: "I shan't have finished my dinner by two o'clock.", ru: "В два часа я еще не пообедаю." },
    76: { en: "Why had you not drunk the milk before you went to school?", ru: "Почему ты не выпил молоко перед тем, как идти в школу?" },
    77: { en: "Have you had much experience in teaching English?", ru: "У вас уже достаточный опыт преподавания английского?" },
    78: { en: "Shall we have returned home by the end of this week?", ru: "Мы вернемся домой к концу этой недели?" },
    79: { en: "Hadn't he bought tickets by the beginning of the film?", ru: "Разве он не купил билетов к началу фильма?" },
    80: { en: "Why haven't you cut your hair?", ru: "Почему ты не подстригся?" },
    81: { en: "Won't you have called him by tomorrow?", ru: "Разве вы не позвоните ему до завтра?" },
    82: { en: "Most of the old houses had been pulled down before the new construction was started.", ru: "Перед началом строительства большая часть старых домов была снесена." },
    83: { en: "My books have been stolen recently.", ru: "У меня недавно украли книги." },
    84: { en: "The factory will have been rebuilt by 2002.", ru: "Фабрика будет перестроена к 2002 году." },
    85: { en: "All the things and furniture'd been put in order by the time their parents came back.", ru: "К приезду родителей все вещи и мебель привели в порядок." },
    86: { en: "My brother's never been beaten at tennis.", ru: "У моего брата в теннис никто не выигрывал." },
    87: { en: "By the time the captain arrives at the port all the cargo'll have been registered.", ru: "Ко времени прибытия капитана в порт весь груз будет зарегистрирован." },
    88: { en: "We received a telegram that Dr. Spenser hadn't been elected President of the firm.", ru: "Мы получили телеграмму, что доктора Спенсера не избрали президентом фирмы." },
    89: { en: "We haven't been written about it yet.", ru: "Нам об этом еще не писали." },
    91: { en: "Had he been informed about the misfortune?", ru: "Ему сообщили о несчастье?" },
    92: { en: "Has he ever been invited to the Buckingham Palace?", ru: "Его приглашали когда-нибудь в Букингемский дворец?" },
    95: { en: "Why haven't these details been taken into account?", ru: "Почему не учли эти детали?" }
  };

  var cells = [];
  activeNums.forEach(function (n) {
    var k = kit[n.num] || {};
    cells.push(makeCell(n.num, "perfect", "active", n.form, n.time, k.en, k.ru, !!k.en));
  });
  passiveNums.forEach(function (n) {
    var k = kit[n.num] || {};
    cells.push(makeCell(n.num, "perfect", "passive", n.form, n.time, k.en, k.ru, !!k.en));
  });

  return {
    id: "perfect",
    num: 5,
    name: "PERFECT",
    subtitle: "have + V3 (результат к моменту речи)",
    description: "Active и Passive. Perfect показывает результат действия к определённому моменту. Passive: have / has / had / will have + been + V3.",
    image: "assets/tables/table05.jpg",
    kind: "perfect",
    voices: ["active", "passive"],
    cells: cells,
    notes: [
      "Active: have / has / had / will have + V3.",
      "Passive: have / has / had / will have + been + V3.",
      "PI&G having 3 — having + V3; PI&G having been 3 — having been + V3."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблица 6. PERFECT CONTINUOUS                                       */
/* ------------------------------------------------------------------ */

function buildPerfectContinuous() {
  var nums = numberBlocks(97, [
    { form: "statement", times: ["past", "present", "future"] },
    { form: "optional_not", times: ["present", "future"] },
    { form: "negative", times: ["past", "present", "future"] },
    { form: "question", times: ["past", "present", "future"] },
    { form: "negative_question", times: ["present", "future"] }
  ]);

  var kit = {
    97: { en: "He had been studying English for two years before he came to work here.", ru: "Он изучал английский два года до того, как пришел сюда работать." },
    98: { en: "This monument has been standing here since 1648.", ru: "Этот памятник стоит здесь с 1648 года." },
    99: { en: "You will have been discussing this problem for an hour by the time I get there.", ru: "К тому времени, когда я туда доберусь, вы уже в течение часа будете обсуждать этот вопрос." },
    100: { en: "I'd been looking for my dog the whole morning before I finally found it.", ru: "Всё утро я искал свою собаку, пока, наконец, не нашел ее." },
    101: { en: "Mary's been skating since then.", ru: "Мэри с тех пор так и катается на коньках." },
    102: { en: "I'll have been typing for several hours when you come home.", ru: "Когда придешь домой, я уж несколько часов буду печатать." },
    103: { en: "My friend hadn't been serving in the army for a month when his girl-friend got married.", ru: "Мой друг и месяца в армии не прослужил, как его девушка вышла замуж." },
    104: { en: "For two years John hasn't been learning French.", ru: "Джон уже два года не изучает французский язык." },
    105: { en: "They won't have been sitting in the cafe long by the time you arrive.", ru: "До вашего прихода они совсем недолго просидят в кафе." },
    106: { en: "How long had you been waiting before she came home?", ru: "Долго ждал, пока она пришла домой?" },
    107: { en: "How long have you been doing this exercise?", ru: "Сколько времени ты уже делаешь это упражнение?" },
    110: { en: "Haven't they been watching TV for three hours already?", ru: "Разве они уже три часа не смотрят телевизор?" }
  };

  var cells = nums.map(function (n) {
    var k = kit[n.num] || {};
    return makeCell(n.num, "perfect_continuous", "active", n.form, n.time, k.en, k.ru, !!k.en);
  });

  return {
    id: "perfect_continuous",
    num: 6,
    name: "PERFECT CONTINUOUS",
    subtitle: "have been + V-ing (действие длится до момента речи)",
    description: "Только Active. Future Perfect Continuous Passive практически не употребляется.",
    image: "assets/tables/table06.jpg",
    kind: "perfect_continuous",
    voices: ["active"],
    cells: cells,
    notes: [
      "Active: have / has / had / will have + been + V-ing.",
      "Подчёркивает длительность действия вплоть до момента речи."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблица 7. IMPERATIVE                                               */
/* ------------------------------------------------------------------ */

function buildImperative() {
  var defs = [
    ["statement", "past"],
    ["negative", "past"],
    ["statement", "present"],
    ["negative", "present"],
    ["question", "present"],
    ["negative_question", "present"]
  ];
  var cells = defs.map(function (d, i) {
    var num = 111 + i;
    return makeCell(num, "imperative", "active", d[0], d[1], "", "", false);
  });
  return {
    id: "imperative",
    num: 7,
    name: "IMPERATIVE",
    subtitle: "Повелительное наклонение: Work! Don't work!",
    description: "Побуждение к действию. Утверждение и отрицание. Служебные слова (please, do) — жёлтые.",
    image: "assets/tables/table07.jpg",
    kind: "imperative",
    voices: ["active"],
    cells: cells,
    notes: [
      "Утверждение: Work! Read the book!",
      "Отрицание: Don't work! Never do it!",
      "Вежливость: Please, come in."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблицы 8–10. МОДАЛЬНЫЕ ГЛАГОЛЫ                                     */
/* ------------------------------------------------------------------ */

function buildModal() {
  var modals = [
    { m: "can", ru: "мочь / уметь" },
    { m: "may", ru: "можно / возможно" },
    { m: "must", ru: "должен" },
    { m: "should", ru: "следует" }
  ];
  var cells = [];
  var num = 118;
  modals.forEach(function (item) {
    ["statement", "negative", "question", "negative_question"].forEach(function (form) {
      var tpl = makeTemplate("modal", "active", form, "present");
      tpl.forEach(function (s) { if (s.c === "blue" && s.t === "can") s.t = item.m; });
      tpl.forEach(function (s) { if (s.c === "blue" && s.t === "can't") s.t = item.m + "n't"; });
      tpl.forEach(function (s) { if (s.c === "blue" && s.t === "Can") s.t = item.m.charAt(0).toUpperCase() + item.m.slice(1); });
      cells.push({
        num: num++,
        kind: "modal",
        voice: "active",
        form: form,
        time: "present",
        colors: colorsOf(tpl),
        template: tpl,
        en: plainExample(tpl),
        ru: "",
        modal: item.m,
        kit: false
      });
    });
  });
  return {
    id: "modal",
    num: 8,
    name: "МОДАЛЬНЫЕ ГЛАГОЛЫ",
    subtitle: "can, may, must, should, could, might, would…",
    description: "Модальные глаголы не изменяются по лицам и числам и не требуют -s в 3 лице. После них — инфинитив без to.",
    image: "assets/tables/table08.jpg",
    kind: "modal",
    voices: ["active"],
    cells: cells,
    notes: [
      "Отрицание: cannot = can't, must not = mustn't, need not = needn't.",
      "Вопрос: Can you…? May I…? Must he…?",
      "Всего в таблицах 8–10 около 30 модальных и служебных форм."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблица 11. THERE                                                   */
/* ------------------------------------------------------------------ */

function buildThere() {
  var defs = ["statement", "negative", "question", "negative_question"];
  var kit = {
    "statement": { en: "There is a book on the table.", ru: "На столе книга." },
    "negative": { en: "There were no cars on the highway.", ru: "На шоссе не было машин." },
    "question": { en: "Is there any milk in the fridge?", ru: "В холодильнике есть молоко?" },
    "negative_question": { en: "Why is there no spoons on the table?", ru: "Почему на столе нет ложек?" }
  };
  var cells = defs.map(function (form, i) {
    var k = kit[form] || {};
    // THERE идёт сразу после клеток модальных таблиц (118–133).
    return makeCell(134 + i, "there", "active", form, "present", k.en, k.ru, true);
  });
  return {
    id: "there",
    num: 11,
    name: "THERE",
    subtitle: "Предложения с вводным there",
    description: "Красное there — формальное подлежащее. Отрицание через no (чёрное) или not. Смысловое «кто/что» — тоже красное.",
    image: "assets/tables/table11.jpg",
    kind: "there",
    voices: ["active"],
    cells: cells,
    notes: [
      "There is / There are — есть, имеется.",
      "Отрицание: there is no… / there isn't any…",
      "there — красное (подлежащее), как в кубиках Зайцева (кубик 2)."
    ]
  };
}

/* ------------------------------------------------------------------ */
/* Таблица 1. МЕСТОИМЕНИЯ                                              */
/* ------------------------------------------------------------------ */

const PRONOUN_TABLE = {
  id: "pronouns",
  num: 1,
  name: "МЕСТОИМЕНИЯ",
  subtitle: "5 столбцов: субъект, объект, -self, притяжательные",
  description: "Первый столбец — красный (подлежащее). Второй и третий — зелёные (объект). Четвёртый и пятый — зелёные с красной оторочкой (и туда, и сюда годятся).",
  image: "assets/tables/table01.jpg",
  kind: "pronouns",
  voices: [],
  columns: [
    { key: "subj", title: "Кто", role: "Именительный", color: "red", items: ["I", "you", "he", "she", "it", "we", "you", "they"] },
    { key: "obj", title: "Объект", role: "Род. / Дат. / Вин. / Тв. / Пр.", color: "green", items: ["me", "you", "him", "her", "it", "us", "you", "them"] },
    { key: "self", title: "Сам / себя", role: "-self", color: "green", items: ["myself", "yourself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves"] },
    { key: "adj", title: "Чей (перед сущ.)", role: "Притяж. прилаг.", color: "green", rim: "red", items: ["my", "your", "his", "her", "its", "our", "your", "their"] },
    { key: "poss", title: "Чей (самост.)", role: "Притяж. местоим.", color: "green", rim: "red", items: ["mine", "yours", "his", "hers", "its", "ours", "yours", "theirs"] }
  ],
  questions: ["who / whom", "what", "which", "whose"],
  notes: [
    "I, me, myself — местоимения-существительные.",
    "Четвёртый столбец требует существительного: my brother's new jacket.",
    "Значения столбцов 2–5 выводятся из первого: they → them → themselves → their → theirs."
  ]
};

/* ------------------------------------------------------------------ */
/* Сборка                                                              */
/* ------------------------------------------------------------------ */

const TABLES = {
  pronouns: PRONOUN_TABLE,
  to_be: buildToBe(),
  indefinite: buildIndefinite(),
  continuous: buildContinuous(),
  perfect: buildPerfect(),
  perfect_continuous: buildPerfectContinuous(),
  imperative: buildImperative(),
  modal: buildModal(),
  there: buildThere()
};

// Порядок карточек в «Карте таблиц».
const TABLE_ORDER = [
  "pronouns",
  "to_be",
  "indefinite",
  "continuous",
  "perfect",
  "perfect_continuous",
  "imperative",
  "modal",
  "there"
];

/* ------------------------------------------------------------------ */
/* Инструменты поиска                                                  */
/* ------------------------------------------------------------------ */

/** Находит клетку по таблице, залогу, форме и времени. */
function findCell(tableId, voice, form, time) {
  var table = TABLES[tableId];
  if (!table || !table.cells) return null;
  var found = null;
  table.cells.forEach(function (c) {
    if (c.form === form && c.time === time && (!voice || c.voice === voice)) {
      if (!found) found = c;
    }
  });
  return found;
}

/** Все клетки таблицы, сгруппированные по залогу, форме и времени. */
function cellsByVoice(table, voice) {
  return table.cells.filter(function (c) { return !voice || c.voice === voice; });
}

/**
 * Строки сетки таблицы. Обычно это времена (Past / Present / Future),
 * но у модальных таблиц все клетки в настоящем времени, поэтому строками
 * служат сами модальные глаголы (can / may / must / should).
 */
function gridRows(table, voice) {
  var cells = cellsByVoice(table, voice);
  if (table.kind === "modal") {
    var order = [];
    cells.forEach(function (c) {
      if (c.modal && order.indexOf(c.modal) === -1) order.push(c.modal);
    });
    return order.map(function (m) { return { key: m, label: m, short: m }; });
  }
  return TIMES.filter(function (t) {
    return cells.some(function (c) { return c.time === t.key; });
  }).map(function (t) { return { key: t.key, label: t.label, short: t.short }; });
}

/** Клетка на пересечении строки сетки (время или модальный глагол) и формы. */
function cellAtRowForm(table, voice, rowKey, formKey) {
  var found = null;
  cellsByVoice(table, voice).forEach(function (c) {
    if (c.form !== formKey) return;
    if (table.kind === "modal") { if (c.modal === rowKey) found = c; }
    else if (c.time === rowKey) found = c;
  });
  return found;
}

/** Клетка по номеру (сквозная нумерация по всему комплекту). */
function cellByNumber(num) {
  for (var i = 0; i < TABLE_ORDER.length; i++) {
    var t = TABLES[TABLE_ORDER[i]];
    if (!t.cells) continue;
    for (var j = 0; j < t.cells.length; j++) {
      if (t.cells[j].num === num) return { table: t, cell: t.cells[j] };
    }
  }
  return null;
}
