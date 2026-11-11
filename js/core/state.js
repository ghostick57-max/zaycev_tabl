/**
 * Глобальное состояние приложения (разделяемое между модулями).
 */
const AppState = {
  view: "tables",           // активный раздел
  selectedTable: "indefinite",
  selectedCell: null,       // {table, cell}
  filter: { color: null, time: null, voice: null },

  // Мастер алгоритма
  wizard: {
    table: "indefinite",
    voice: null,
    sign: null,             // 'point' | 'question'
    negative: null,         // true | false
    time: null,
    result: null
  },

  // Конструктор
  builder: {
    slots: [],              // массив кубиков (id) или null
    lastSentence: null
  },

  // Упражнения
  exercise: {
    current: null,
    tableFilter: "",
    history: []             // {ru, ok}
  },

  speechEnabled: Store.get("speech", true)
};

/** Сообщает подписчикам об изменении состояния. */
const Bus = {
  handlers: {},
  on: function (evt, fn) {
    (this.handlers[evt] = this.handlers[evt] || []).push(fn);
  },
  emit: function (evt, data) {
    (this.handlers[evt] || []).forEach(function (fn) { fn(data); });
  }
};
