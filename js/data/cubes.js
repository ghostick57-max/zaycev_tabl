/**
 * «Склад кубиков» — палитра цветных блоков для 3D-конструктора.
 * Данные — из раздаточного комплекта Н.А. Зайцева (104 слова) + кубики (рис. 12–15).
 * Каждый кубик: { en, ru, hint? }.
 *
 * Цвет = роль в предложении:
 *   red    — кто/что      (подлежащее, Subject)
 *   blue   — глагол        (смысловые и вспомогательные формы)
 *   green  — остальное     (объект, обстоятельство места/времени/образа действия, полные формы to be)
 *   black  — отрицание     (not / n't / no)
 *   yellow — служебное     (вопросительные слова, артикли, предлоги, частица to, знаки)
 */

const CUBES = {
  red: [
    // Местоимения
    { en: "I", ru: "я" }, { en: "you", ru: "ты/вы" }, { en: "he", ru: "он" },
    { en: "she", ru: "она" }, { en: "it", ru: "оно" }, { en: "we", ru: "мы" },
    { en: "they", ru: "они" },
    // Существительные
    { en: "The house", ru: "дом" }, { en: "My brother", ru: "мой брат" },
    { en: "The children", ru: "дети" }, { en: "Mr. Smith", ru: "мистер Смит" },
    { en: "The chairman", ru: "председатель" }, { en: "Ann", ru: "Энн" },
    { en: "The finder", ru: "нашедший" }, { en: "This knife", ru: "этот нож" },
    { en: "These shoes", ru: "эти туфли" }, { en: "The news", ru: "новости" },
    { en: "Telegraph cables", ru: "телеграфные кабели" },
    { en: "The policeman", ru: "полицейский" },
    { en: "A new theatre", ru: "новый театр" },
    { en: "The room", ru: "комната" },
    { en: "The film", ru: "фильм" },
    { en: "The sofa", ru: "диван" },
    { en: "Her jacket", ru: "её куртка" },
    { en: "The money", ru: "деньги" },
    { en: "The workers", ru: "рабочие" }
  ],
  blue: [
    // To Be — Present
    { en: "am", ru: "есть (я)" }, { en: "is", ru: "есть (он/она/оно)" },
    { en: "are", ru: "есть (мы/вы/они)" },
    // To Be — Past
    { en: "was", ru: "был" }, { en: "were", ru: "были" },
    // To Be — Future
    { en: "will be", ru: "будет" }, { en: "shall be", ru: "будет" },
    // Indefinite Active
    { en: "V1", ru: "делаю" }, { en: "V2", ru: "делал" },
    { en: "will V1", ru: "буду делать" },
    { en: "do", ru: "вспом. (наст.)" }, { en: "does", ru: "вспом. (наст. 3л.)" },
    { en: "did", ru: "вспом. (прош.)" },
    // Continuous
    { en: "am V-ing", ru: "делаю сейчас" }, { en: "is V-ing", ru: "делает сейчас" },
    { en: "are V-ing", ru: "делаем сейчас" },
    { en: "was V-ing", ru: "делал тогда" }, { en: "were V-ing", ru: "делали тогда" },
    { en: "will be V-ing", ru: "буду делать тогда" },
    // Perfect
    { en: "have V3", ru: "сделал (уже)" }, { en: "has V3", ru: "сделал (уже)" },
    { en: "had V3", ru: "сделал (до того)" },
    { en: "will have V3", ru: "сделаю (к тому)" },
    // Perfect Continuous
    { en: "have been V-ing", ru: "делаю уже" },
    { en: "has been V-ing", ru: "делает уже" },
    { en: "had been V-ing", ru: "делал уже" },
    { en: "will have been V-ing", ru: "буду делать уже" },
    // Passive
    { en: "am V3", ru: "меня делают" }, { en: "is V3", ru: "его делают" },
    { en: "are V3", ru: "их делают" },
    { en: "was V3", ru: "меня сделали" }, { en: "were V3", ru: "их сделали" },
    { en: "will be V3", ru: "меня сделают" },
    { en: "is being V3", ru: "его делают сейчас" },
    { en: "was being V3", ru: "его делали тогда" },
    { en: "has been V3", ru: "его уже сделали" },
    { en: "had been V3", ru: "его уже сделали (до того)" },
    { en: "will have been V3", ru: "его сделают (к тому)" },
    // Modal
    { en: "can V1", ru: "могу делать" }, { en: "could V1", ru: "мог делать" },
    { en: "may V1", ru: "можно делать" }, { en: "might V1", ru: "возможно делать" },
    { en: "must V1", ru: "должен делать" }, { en: "should V1", ru: "следует делать" },
    { en: "would V1", ru: "бы делал" }, { en: "need V1", ru: "нужно делать" },
    { en: "ought to V1", ru: "следует делать" }
  ],
  green: [
    // Объекты
    { en: "a book", ru: "книгу" }, { en: "the book", ru: "книгу" },
    { en: "a letter", ru: "письмо" }, { en: "the letter", ru: "письмо" },
    { en: "this story", ru: "эту историю" }, { en: "his present", ru: "его подарок" },
    { en: "the speaker", ru: "выступающего" }, { en: "to the audience", ru: "аудитории" },
    { en: "her name", ru: "её имя" }, { en: "the bills", ru: "счета" },
    { en: "any good music", ru: "хорошую музыку" },
    { en: "these expressions", ru: "эти выражения" },
    { en: "our documents", ru: "наши документы" },
    // Обстоятельства места
    { en: "in the garden", ru: "в саду" },
    { en: "at school", ru: "в школе" },
    { en: "at home", ru: "дома" },
    { en: "in Moscow", ru: "в Москве" },
    { en: "under the ground", ru: "под землёй" },
    { en: "on the table", ru: "на столе" },
    { en: "on the highway", ru: "на шоссе" },
    { en: "to the railway station", ru: "на вокзал" },
    { en: "to hospital", ru: "в больницу" },
    { en: "to bed", ru: "в постель" },
    { en: "upstairs", ru: "наверху" },
    { en: "in the nearest cinema", ru: "в ближайшем кинотеатре" },
    // Обстоятельства времени
    { en: "yesterday", ru: "вчера" },
    { en: "today", ru: "сегодня" },
    { en: "tomorrow", ru: "завтра" },
    { en: "every day", ru: "каждый день" },
    { en: "every morning", ru: "каждое утро" },
    { en: "on Sunday", ru: "в воскресенье" },
    { en: "next week", ru: "на следующей неделе" },
    { en: "two years ago", ru: "два года назад" },
    { en: "since childhood", ru: "с детства" },
    { en: "since 1648", ru: "с 1648 года" },
    { en: "by this time tomorrow", ru: "к этому времени завтра" },
    { en: "by the end of the week", ru: "к концу недели" },
    { en: "by 2002", ru: "к 2002 году" },
    { en: "for two years", ru: "в течение двух лет" },
    { en: "for three hours already", ru: "уже три часа" },
    { en: "at eight o'clock as a rule", ru: "в 8 часов, как правило" },
    { en: "before breakfast", ru: "перед завтраком" },
    { en: "before you went to school", ru: "перед тем, как ты пошёл в школу" },
    { en: "when their friends came", ru: "когда пришли друзья" },
    { en: "when you come home", ru: "когда ты придёшь домой" },
    { en: "in five minutes", ru: "через пять минут" },
    { en: "tomorrow", ru: "завтра" },
    { en: "yet", ru: "ещё" },
    { en: "already", ru: "уже" },
    { en: "just", ru: "только что" },
    { en: "lately", ru: "недавно" },
    { en: "recently", ru: "недавно" },
    { en: "ever", ru: "когда-либо" },
    { en: "never", ru: "никогда" },
    // Обстоятельства образа действия
    { en: "slowly", ru: "медленно" },
    { en: "well", ru: "хорошо" },
    { en: "badly", ru: "плохо" },
    { en: "suddenly", ru: "внезапно" },
    { en: "probably", ru: "вероятно" },
    { en: "really", ru: "действительно" },
    { en: "seldom", ru: "редко" },
    { en: "often", ru: "часто" },
    { en: "usually", ru: "обычно" },
    { en: "always", ru: "всегда" },
    { en: "sometimes", ru: "иногда" },
    { en: "soon", ru: "скоро" },
    { en: "still", ru: "всё ещё" },
    { en: "only", ru: "только" },
    { en: "even", ru: "даже" },
    { en: "too", ru: "слишком" },
    { en: "enough", ru: "достаточно" },
    { en: "at a loss", ru: "в растерянности" },
    { en: "proud of their success", ru: "гордятся успехом" },
    { en: "ready", ru: "готов" },
    { en: "late", ru: "поздно" },
    { en: "nice", ru: "приятно" },
    { en: "soft and comfortable", ru: "мягкий и удобный" },
    { en: "very sharp", ru: "очень острый" },
    { en: "expensive", ru: "дорогой" },
    { en: "interesting", ru: "интересный" },
    { en: "dangerous", ru: "опасный" },
    { en: "painful", ru: "болезненный" },
    { en: "profitable", ru: "прибыльный" },
    { en: "high enough", ru: "достаточно высокий" },
    { en: "too young", ru: "слишком молодой" },
    { en: "too expensive", ru: "слишком дорогой" },
    { en: "afraid", ru: "бояться" },
    { en: "about twenty-six", ru: "около двадцати шести" },
    { en: "the right size", ru: "нужный размер" },
    { en: "a picture of a very famous artist", ru: "картина очень известного художника" },
    { en: "the best way out", ru: "лучший выход" },
    { en: "on his guard", ru: "настороже" },
    { en: "over", ru: "закончен" },
    { en: "a bit cold", ru: "немного холодно" },
    { en: "a great success", ru: "большой успех" },
    { en: "too far away to see anything", ru: "слишком далеко, чтобы что-то увидеть" },
    { en: "a reward of five pounds", ru: "вознаграждение в 5 фунтов" },
    { en: "to keep silence", ru: "чтобы молчать" },
    { en: "to speak to", ru: "поговорить с" },
    { en: "to get that job", ru: "получить ту работу" },
    { en: "to spend your vacation", ru: "провести отпуск" },
    { en: "to take all the responsibility", ru: "взять всю ответственность" },
    { en: "to ask him this question", ru: "задать ему этот вопрос" },
    { en: "to cross the river", ru: "переправиться через реку" },
    { en: "to correspond to his income", ru: "соответствовать доходу" },
    { en: "to pay so much", ru: "платить так много" },
    { en: "to see you again", ru: "увидеть вас снова" },
    { en: "to buy a new house", ru: "купить новый дом" },
    { en: "to become acquainted with the plan", ru: "ознакомиться с планом" },
    { en: "to succeed", ru: "добиться успеха" },
    { en: "to be over", ru: "закончиться" },
    { en: "to be painful", ru: "быть болезненным" },
    { en: "to be profitable", ru: "быть прибыльным" },
    { en: "to be proud", ru: "гордиться" },
    { en: "to be ready", ru: "быть готовым" },
    { en: "to be at a loss", ru: "быть в растерянности" },
    { en: "to be on his guard", ru: "быть настороже" },
    { en: "to be a bit cold", ru: "быть немного холодным" },
    { en: "to be a great success", ru: "иметь большой успех" },
    { en: "to be too far away", ru: "быть слишком далеко" },
    { en: "to be soft and comfortable", ru: "быть мягким и удобным" },
    { en: "to be very sharp", ru: "быть очень острым" },
    { en: "to be expensive", ru: "быть дорогим" },
    { en: "to be interesting", ru: "быть интересным" },
    { en: "to be dangerous", ru: "быть опасным" },
    { en: "to be too young", ru: "быть слишком молодым" },
    { en: "to be too expensive", ru: "быть слишком дорогим" },
    { en: "to be afraid", ru: "бояться" },
    { en: "to be about twenty-six", ru: "быть около двадцати шести" },
    { en: "to be the right size", ru: "быть нужного размера" },
    { en: "to be a picture of a very famous artist", ru: "быть картиной известного художника" },
    { en: "to be the best way out", ru: "быть лучшим выходом" },
    { en: "to be over", ru: "быть законченным" },
    { en: "to be a bit cold", ru: "быть немного холодным" },
    { en: "to be a great success", ru: "иметь большой успех" }
  ],
  black: [
    { en: "not", ru: "не" },
    { en: "n't", ru: "не (сокр.)" },
    { en: "no", ru: "нет / никакой" }
  ],
  yellow: [
    // Вопросительные слова
    { en: "Where", ru: "где" },
    { en: "When", ru: "когда" },
    { en: "Why", ru: "почему" },
    { en: "What", ru: "что" },
    { en: "Which", ru: "который" },
    { en: "Who", ru: "кто" },
    { en: "Whom", ru: "кого" },
    { en: "Whose", ru: "чей" },
    { en: "How", ru: "как" },
    { en: "How long", ru: "как долго" },
    { en: "How much", ru: "сколько" },
    { en: "How many", ru: "сколько" },
    // Знаки
    { en: "?", ru: "вопрос" },
    { en: ".", ru: "точка" },
    { en: "!", ru: "восклицание" },
    // Артикли и частицы
    { en: "a", ru: "артикль" },
    { en: "an", ru: "артикль" },
    { en: "the", ru: "артикль" },
    { en: "to", ru: "частица / предлог" },
    { en: "there", ru: "там / вводное" },
    // Предлоги
    { en: "in", ru: "в" },
    { en: "on", ru: "на" },
    { en: "at", ru: "в / у" },
    { en: "by", ru: "к / посредством" },
    { en: "for", ru: "для / в течение" },
    { en: "with", ru: "с" },
    { en: "without", ru: "без" },
    { en: "about", ru: "о / около" },
    { en: "from", ru: "из / от" },
    { en: "to", ru: "к / в" },
    { en: "of", ru: "из / о" },
    { en: "under", ru: "под" },
    { en: "over", ru: "над" },
    { en: "before", ru: "перед" },
    { en: "after", ru: "после" },
    { en: "till", ru: "до" },
    { en: "since", ru: "с" },
    { en: "during", ru: "во время" },
    { en: "between", ru: "между" },
    { en: "among", ru: "среди" },
    { en: "through", ru: "через" },
    { en: "across", ru: "через" },
    { en: "along", ru: "вдоль" },
    { en: "behind", ru: "за" },
    { en: "in front of", ru: "перед" },
    { en: "near", ru: "около" },
    { en: "next to", ru: "рядом с" },
    { en: "opposite", ru: "напротив" }
  ]
};

/* ------------------------------------------------------------------ */
/* Производные структуры (единый интерфейс для конструктора)           */
/* ------------------------------------------------------------------ */

const CUBE_STOCK = {};
COLOR_ORDER.forEach(function (c) {
  CUBE_STOCK[c] = (CUBES[c] || []).map(function (item, i) {
    return {
      id: c + "-" + i,
      en: item.en,
      ru: item.ru || "",
      hint: item.hint || item.ru || "",
      color: c
    };
  });
});

// Быстрый доступ ко всем кубикам по id.
const ALL_CUBES = {};
COLOR_ORDER.forEach(function (c) {
  (CUBE_STOCK[c] || []).forEach(function (cube) {
    ALL_CUBES[cube.id] = cube;
  });
});

function getCube(id) {
  return ALL_CUBES[id] || null;
}