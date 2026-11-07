/**
 * Точка входа приложения 2.0.
 * Навигация (dock), тёмная тема, маршрутизация конструктора (3D / 2D),
 * модальные окна, инициализация разделов.
 */

const App = {
  views: ["world", "tables", "cubes", "wizard", "generator"],

  init: function () {
    var self = this;

    Theme.init();

    // Навигация (кнопки в dock и в шапке).
    $all("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () { self.switchView(btn.dataset.nav); });
    });

    // Тема.
    var themeBtn = $("#theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", function () { Theme.toggle(); });

    // Кнопки в шапке.
    var speechBtn = $("#speech-toggle");
    if (speechBtn) {
      updateSpeechBtn();
      speechBtn.addEventListener("click", function () { Speech.toggle(); updateSpeechBtn(); });
    }
    var aboutBtn = $("#about-btn");
    if (aboutBtn) aboutBtn.addEventListener("click", function () { self.showAbout(); });
    var legendBtn = $("#legend-btn");
    if (legendBtn) legendBtn.addEventListener("click", function () { self.showLegend(); });

    // Инициализация разделов.
    WorldMap.init($("#view-world .view-root"));
    TableMap.init($("#view-tables .view-root"));
    Wizard.init($("#view-wizard .view-root"));
    Generator.init($("#view-generator .view-root"));
    CubeBuilder.init($("#view-cubes .view-root"));

    this.switchView("world");
  },

  switchView: function (view) {
    if (this.views.indexOf(view) === -1) view = "tables";
    AppState.view = view;
    this.views.forEach(function (v) {
      var sec = $("#view-" + v);
      if (sec) sec.classList.toggle("active", v === view);
    });
    $all("[data-nav]").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.nav === view);
    });
    // Обновляем соответствующее представление.
    if (view === "world") WorldMap.onShow();
    if (view === "tables") TableMap.render();
    if (view === "wizard") Wizard.render();
    if (view === "cubes") CubesView.render();
    if (view === "generator") Generator.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  showAbout: function () {
    showModal("О методике", el("div", { class: "prose" }, [
      el("p", { text: "Тренажёр переносит логику бумажных таблиц Н.А. Зайцева («Таблицы Зайцева. Английский язык», СПб, 1999) в цифровую среду." }),
      el("p", { class: "principle", text: "ЦВЕТ = ЧЛЕН ПРЕДЛОЖЕНИЯ, а не абстрактный термин." }),
      el("ul", { class: "legend-list" }, [
        el("li", {}, [colorChip("red"), document.createTextNode(" — кто / что (подлежащее, Subject)")]),
        el("li", {}, [colorChip("blue"), document.createTextNode(" — глагол (сказуемое и вспомогательные)")]),
        el("li", {}, [colorChip("green"), document.createTextNode(" — всё остальное (дополнение, место, время)")]),
        el("li", {}, [colorChip("black"), document.createTextNode(" — отрицание not / n't / no")]),
        el("li", {}, [colorChip("yellow"), document.createTextNode(" — служебные слова (вопросы, артикли, предлоги, to)")])
      ]),
      el("p", { class: "muted", text: "Алгоритм перевода повторяет рис. 5 комплекта: Актив/Пассив → точка/вопрос → есть ли отрицание → время → номер клетки." }),
      el("p", { class: "muted", text: "Карта мира показывает методику панорамно: девять земель-таблиц, 134 клетки-адреса и маршруты между ними. Срезы по времени, залогу и цвету позволяют увидеть, как одна и та же логика работает во всём комплекте." })
    ]));
  },

  showLegend: function () {
    var body = el("div", { class: "prose" });
    body.appendChild(el("p", { text: "Легенда цветов:" }));
    var ul = el("ul", { class: "legend-list" });
    COLOR_ORDER.forEach(function (k) {
      var info = COLORS[k];
      ul.appendChild(el("li", {}, [
        el("span", { class: "swatch", style: { background: info.hex } }),
        el("strong", { text: info.label + ": " }),
        el("span", { text: info.role })
      ]));
    });
    body.appendChild(ul);
    showModal("Легенда", body);
  }
};

/* --- Раздел «Кубики»: 3D или 2D ------------------------------------ */

const CubesView = {
  /** Рисует конструктор: 3D-полку, если Three.js готов, иначе 2D. */
  render: function () {
    CubeBuilder.mode = (typeof THREE !== "undefined") ? "3d" : "2d";
    if (CubeBuilder.mode === "3d") { CubeBuilder.render(); return; }
    // Three.js ещё грузится (или недоступен) — рисуем 2D и ждём апгрейд.
    CubeBuilder.render();
    if (typeof THREE === "undefined" && window.__threeReady) {
      window.__threeReady(function () {
        if (AppState.view === "cubes") { CubeBuilder.mode = "3d"; CubeBuilder.render(); }
      });
    }
  }
};

/** Открывает конструктор с конкретной клеткой (маршрутизация 3D/2D). */
function openBuilder(table, cell) {
  CubeBuilder.mode = (typeof THREE !== "undefined") ? "3d" : "2d";
  CubeBuilder.loadFromCell(table, cell);
  if (CubeBuilder.mode === "2d" && window.__threeReady) {
    window.__threeReady(function () {
      if (AppState.view === "cubes") { CubeBuilder.mode = "3d"; CubeBuilder.render(); }
    });
  }
  App.switchView("cubes");
}

/* --- Модальное окно -------------------------------------------------- */

function showModal(title, contentNode, note) {
  var overlay = $("#modal-overlay");
  var box = $("#modal-box");
  clear(box);
  box.appendChild(el("div", { class: "modal-head" }, [
    el("h3", { text: title }),
    el("button", { class: "modal-close", text: "×", onclick: closeModal })
  ]));
  var bodyNode = el("div", { class: "modal-body" });
  appendChildren(bodyNode, contentNode);
  box.appendChild(bodyNode);
  if (note) box.appendChild(el("div", { class: "modal-note", text: note }));
  overlay.classList.add("open");
}

function closeModal() {
  var overlay = $("#modal-overlay");
  if (overlay) overlay.classList.remove("open");
}

/* --- Вспомогательные элементы управления ----------------------------- */

function updateSpeechBtn() {
  var btn = $("#speech-toggle");
  if (!btn) return;
  var on = AppState.speechEnabled && Speech.supported;
  btn.classList.toggle("on", on);
  btn.textContent = on ? "🔊 Озвучка вкл" : "🔇 Озвучка выкл";
  if (!Speech.supported) {
    btn.classList.add("disabled");
    btn.textContent = "Озвучка недоступна";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  App.init();
  var overlay = $("#modal-overlay");
  if (overlay) overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
});