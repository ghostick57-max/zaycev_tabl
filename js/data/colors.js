/**
 * Цветовая семантика методики Н.А. Зайцева.
 * ЦВЕТ = ЧЛЕН ПРЕДЛОЖЕНИЯ, а не абстрактный термин.
 *
 * red    — кто / что (подлежащее, Subject)
 * blue   — глагол (сказуемое, включая вспомогательные, Verb)
 * green  — всё остальное (дополнение, место, время; Object / Place / Time)
 * black  — отрицание (not / n't / no)
 * yellow — служебные элементы (вопросительные слова, артикли, предлоги, частица to)
 * gray   — нейтральные ячейки (шаблоны, номера клеток, рамки)
 */
const COLORS = {
  red: {
    key: "red",
    hex: "#E53E3E",
    label: "Кто / Что",
    short: "Кто/Что",
    role: "Подлежащее — Subject"
  },
  blue: {
    key: "blue",
    hex: "#3182CE",
    label: "Глагол",
    short: "Глагол",
    role: "Сказуемое и вспомогательные глаголы — Verb"
  },
  green: {
    key: "green",
    hex: "#38A169",
    label: "Остальное",
    short: "Остальное",
    role: "Дополнение, обстоятельство места и времени — Object / Place / Time"
  },
  black: {
    key: "black",
    hex: "#1A202C",
    label: "Отрицание",
    short: "Отрицание",
    role: "not / n't / no"
  },
  yellow: {
    key: "yellow",
    hex: "#D69E2E",
    label: "Служебное",
    short: "Служебное",
    role: "Вопросительные слова, артикли, предлоги, частица to"
  },
  gray: {
    key: "gray",
    hex: "#A0AEC0",
    label: "Нейтральное",
    short: "Нейтральное",
    role: "Шаблоны, номера клеток, рамки"
  }
};

// Порядок вывода цветов в интерфейсе.
const COLOR_ORDER = ["red", "blue", "green", "black", "yellow", "gray"];

// Подписи, которые показываются рядом с цветными блоками.
const COLOR_CAPTIONS = {
  1: { colors: ["red"], text: "Кто / Что" },
  2: { colors: ["blue"], text: "Глагол" },
  3: { colors: ["green"], text: "Всё остальное" },
  4: { colors: ["black"], text: "Отрицание" },
  5: { colors: ["yellow"], text: "Служебные слова" },
  6: { colors: ["gray"], text: "Номера клеток / рамки" }
};
