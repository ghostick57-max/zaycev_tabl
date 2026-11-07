/**
 * РАЗДЕЛ 3. КОНСТРУКТОР КУБИКОВ (главная фича).
 *
 * Аналог «кубиков Зайцева»: из цветных блоков собирается английское предложение.
 * Нижняя часть экрана — «склад кубиков», верхняя — «строка предложения» из слотов.
 * Слоты окрашены по членам предложения и принимают только «свои» цвета.
 */

const BUILDER_SLOTS = [
  { id: "pre", label: "Служебное слово", accept: ["yellow", "black"], optional: true },
  { id: "subject", label: "Кто / Что", accept: ["red"], optional: false },
  { id: "verb", label: "Глагол", accept: ["blue", "black"], optional: false },
  { id: "rest", label: "Остальное", accept: ["green", "yellow"], optional: true },
  { id: "place", label: "Обстоятельство", accept: ["green"], optional: true },
  { id: "end", label: "Знак", accept: ["yellow"], optional: true }
];

const CubeBuilder = {
  root: null,
  target: null,       // {table, cell} — к какому примеру собираем
  slots: {},          // id -> cube id
  activeColor: "red", // активная вкладка склада
  message: null,
  tone: null,         // "ok" | "warn" | "bad" — окраска сообщения
  mode: "2d",         // "2d" | "3d" — какой конструктор рисуем
  filterQuery: "",    // поиск по палитре

  init: function (root) {
    this.root = root;
    this.clear();
    this.render();
  },

  clear: function () {
    this.slots = {};
    this.message = null;
    this.tone = null;
  },

  loadFromCell: function (table, cell) {
    this.target = { table: table, cell: cell };
    this.clear();
    if (this.root) this.render();
  },

  loadRandom: function () {
    var ex = randomExercise(AppState.exercise.tableFilter);
    var found = cellByNumber(ex.cellNum);
    if (found) this.target = { table: found.table, cell: found.cell };
    this.clear();
    this.render();
  },

  place: function (slotId, cubeId) {
    var slot = null;
    BUILDER_SLOTS.forEach(function (s) { if (s.id === slotId) slot = s; });
    var cube = getCube(cubeId);
    if (!slot || !cube) return false;
    if (slot.accept.indexOf(cube.color) === -1) {
      this.flashError(slotId, "Кубик «" + cube.en + "» — " + COLORS[cube.color].label + ". В слот «" + slot.label + "» нужен " + slot.accept.map(function (c) { return COLORS[c].label; }).join(" / ") + ".");
      return false;
    }
    this.slots[slotId] = cubeId;
    this.message = null;
    this.tone = null;
    this.render();
    return true;
  },

  remove: function (slotId) {
    delete this.slots[slotId];
    this.render();
  },

  autoPlace: function (cubeId) {
    var cube = getCube(cubeId);
    if (!cube) return;
    // Ищем первый пустой подходящий слот в порядке следования.
    for (var i = 0; i < BUILDER_SLOTS.length; i++) {
      var s = BUILDER_SLOTS[i];
      if (!this.slots[s.id] && s.accept.indexOf(cube.color) !== -1) {
        this.slots[s.id] = cubeId;
        this.message = null;
        this.tone = null;
        this.render();
        return;
      }
    }
    this.message = "Нет подходящего пустого слота для «" + cube.en + "».";
    this.tone = "warn";
    this.render();
  },

  flashError: function (slotId, text) {
    this.message = text;
    this.tone = "bad";
    this.render();
    var node = $('.slot[data-slot="' + slotId + '"]');
    if (node) { node.classList.add("shake"); setTimeout(function () { node.classList.remove("shake"); }, 500); }
  },

  /** Собирает строку предложения из размещённых кубиков. */
  assemble: function () {
    var parts = [];
    BUILDER_SLOTS.forEach(function (s) {
      var id = CubeBuilder.slots[s.id];
      if (id) parts.push(getCube(id).en);
    });
    return joinSentence(parts);
  },

  assembleRu: function () {
    var parts = [];
    BUILDER_SLOTS.forEach(function (s) {
      var id = CubeBuilder.slots[s.id];
      if (id) { var c = getCube(id); if (c.ru) parts.push(c.ru); }
    });
    return parts.join(" ");
  },

  hasCore: function () {
    return !!(this.slots.subject && this.slots.verb);
  },

  check: function () {
    // Базовый критерий успеха — структурно полное предложение:
    // есть «кто/что» (красное) и «глагол» (синее). Это и есть логика цветов.
    if (!this.hasCore()) {
      this.message = "Нужны как минимум красный («кто / что») и синий («глагол») кубики.";
      this.tone = "bad";
      this.render();
      return;
    }

    var user = this.assemble();
    if (this.target) {
      var res = checkAnswer(user, this.target.cell.en);
      if (res.correct) {
        this.message = "Отлично! Предложение собрано и совпадает с эталоном.";
        this.tone = "ok";
        AppState.exercise.history.push({ ru: this.target.cell.ru, ok: true });
      } else {
        this.message = "Предложение собрано! С эталоном совпадает на " + res.score +
          "%. Эталон: " + this.target.cell.en;
        this.tone = "warn";
      }
    } else {
      this.message = "Предложение собрано!" + (Speech.supported && AppState.speechEnabled ? " Слушаем!" : "");
      this.tone = "ok";
    }
    Speech.say(user);
    this.render();
  },

  showTemplate: function () {
    if (!this.target) {
      this.message = "Свободная сборка: шаблон клетки не задан. Выберите пример из таблицы.";
      this.tone = "warn";
      this.render();
      return;
    }
    this.message = "Шаблон: " + templateText(this.target.cell.template);
    this.tone = "warn";
    this.render();
  },

  render: function () {
    // 3D-режим (конструктор с полкой) — если движок доступен.
    if (this.mode === "3d" && CubeBuilder.render3D) return CubeBuilder.render3D();
    var self = this;
    clear(this.root);

    this.root.appendChild(el("div", { class: "section-head" }, [
      el("h2", { text: "Конструктор кубиков" }),
      el("p", { class: "muted", text: "Соберите предложение из цветных кубиков. Красный — кто/что, синий — глагол, зелёный — всё остальное, чёрный — отрицание, жёлтый — служебные слова." })
    ]));

    this.root.appendChild(this.renderTarget());
    this.root.appendChild(this.renderSentenceLine());
    if (this.message) {
      this.root.appendChild(el("div", { class: "builder-message" + (this.tone ? " " + this.tone : ""), text: this.message }));
    }
    this.root.appendChild(this.renderPalette());
  },

  renderTarget: function () {
    var self = this;
    var wrap = el("div", { class: "builder-target" });
    if (!this.target) {
      wrap.appendChild(el("div", { class: "muted", text: "Свободная сборка. Или выберите пример из таблицы / случайное упражнение." }));
    } else {
      wrap.appendChild(el("div", { class: "target-ru" }, [
        el("span", { class: "target-label", text: "Переведите на английский:" }),
        el("span", { class: "target-text", text: this.target.cell.ru || this.target.cell.en })
      ]));
      wrap.appendChild(el("div", { class: "muted small", text: "Таблица " + this.target.table.num + ". " + this.target.table.name + ", клетка " + this.target.cell.num }));
    }
    var actions = el("div", { class: "builder-actions" });
    actions.appendChild(el("button", { class: "btn primary", text: "Проверить", onclick: function () { self.check(); } }));
    actions.appendChild(el("button", { class: "btn", text: "Показать шаблон", onclick: function () { self.showTemplate(); } }));
    actions.appendChild(el("button", { class: "btn", text: "Случайный пример", onclick: function () { self.loadRandom(); } }));
    actions.appendChild(el("button", { class: "btn ghost", text: "Очистить", onclick: function () { self.clear(); self.render(); } }));
    if (this.target && this.target.cell) {
      actions.appendChild(el("button", { class: "btn ghost", text: "Открыть клетку", onclick: function () { AppState.selectedTable = self.target.table.id; AppState.selectedCell = self.target; App.switchView("tables"); } }));
    }
    wrap.appendChild(actions);
    return wrap;
  },

  renderSentenceLine: function () {
    var self = this;
    var line = el("div", { class: "sentence-line" });
    line.appendChild(el("div", { class: "sentence-line-title", text: "Строка предложения" }));

    var slotsRow = el("div", { class: "slots-row" });
    BUILDER_SLOTS.forEach(function (slot) {
      var cubeId = self.slots[slot.id];
      var cube = cubeId ? getCube(cubeId) : null;
      var node = el("div", {
        class: "slot" + (cube ? " filled slot-" + cube.color : " empty") + (slot.optional ? " optional" : ""),
        dataset: { slot: slot.id },
        style: { "--c": COLORS[slot.accept[0]].hex }
      });

      node.appendChild(el("div", { class: "slot-label" }, [
        el("span", { text: slot.label }),
        el("span", { class: "slot-accept", text: slot.accept.map(function (c) { return COLORS[c].short; }).join(" / ") })
      ]));

      var body = el("div", { class: "slot-body" });
      if (cube) {
        body.appendChild(el("button", {
          class: "cube cube-" + cube.color + " placed",
          title: "Убрать кубик",
          onclick: function () { self.remove(slot.id); }
        }, [
          el("span", { class: "cube-en", text: cube.en }),
          cube.ru ? el("span", { class: "cube-ru", text: cube.ru }) : null
        ]));
      } else {
        body.appendChild(el("span", { class: "slot-hint", text: "перетащите кубик" }));
      }
      node.appendChild(body);

      // Приём drag-and-drop.
      node.addEventListener("dragover", function (e) { e.preventDefault(); node.classList.add("over"); });
      node.addEventListener("dragleave", function () { node.classList.remove("over"); });
      node.addEventListener("drop", function (e) {
        e.preventDefault();
        node.classList.remove("over");
        var id = e.dataTransfer.getData("text/plain");
        if (id) self.place(slot.id, id);
      });

      slotsRow.appendChild(node);
    });
    line.appendChild(slotsRow);

    // Итоговая строка.
    var preview = el("div", { class: "sentence-preview" });
    var en = this.assemble();
    preview.appendChild(el("div", { class: "preview-en" }, [
      el("span", { class: en ? "" : "muted", text: en || "…" }),
      en ? el("button", { class: "btn tiny", text: "▶", title: "Прослушать", onclick: function () { Speech.say(en); } }) : null
    ]));
    var ru = this.assembleRu();
    if (ru) preview.appendChild(el("div", { class: "preview-ru", text: "≈ " + ru }));
    line.appendChild(preview);
    return line;
  },

  renderPalette: function () {
    var self = this;
    var wrap = el("div", { class: "palette" });
    wrap.appendChild(el("div", { class: "palette-title", text: "Склад кубиков — кликните или перетащите" }));

    // Поиск + счётчик.
    var utils = el("div", { class: "palette-utils" });
    var search = el("input", {
      class: "palette-search",
      id: "palette-search",
      placeholder: "Поиск по кубикам…",
      value: this.filterQuery || ""
    });
    search.addEventListener("input", function (e) {
      self.filterQuery = e.target.value;
      var grid = $("#cube-grid");
      if (grid) { clear(grid); self.fillCubeGrid(grid); }
      var cnt = $("#palette-count");
      if (cnt) cnt.textContent = self.cubeCountText();
    });
    utils.appendChild(search);
    utils.appendChild(el("span", { class: "palette-count", id: "palette-count", text: this.cubeCountText() }));
    wrap.appendChild(utils);

    // Вкладки по цветам.
    var tabs = el("div", { class: "palette-tabs" });
    ["red", "blue", "green", "black", "yellow"].forEach(function (c) {
      tabs.appendChild(el("button", {
        class: "palette-tab" + (self.activeColor === c ? " active" : ""),
        style: { "--c": COLORS[c].hex },
        onclick: function () { self.activeColor = c; self.render(); }
      }, [
        el("span", { class: "ptab-dot", style: { background: COLORS[c].hex } }),
        el("span", { text: COLORS[c].label })
      ]));
    });
    wrap.appendChild(tabs);

    var grid = el("div", { class: "cube-grid", id: "cube-grid" });
    this.fillCubeGrid(grid);
    wrap.appendChild(grid);
    return wrap;
  },

  /** Отфильтрованный список кубиков активного цвета. */
  cubeList: function () {
    var list = CUBE_STOCK[this.activeColor] || [];
    var q = (this.filterQuery || "").toLowerCase().trim();
    if (!q) return list;
    return list.filter(function (c) {
      return (c.en + " " + c.ru).toLowerCase().indexOf(q) !== -1;
    });
  },

  cubeCountText: function () {
    var total = (CUBE_STOCK[this.activeColor] || []).length;
    var shown = this.cubeList().length;
    return shown === total ? total + " кубиков" : shown + " из " + total;
  },

  /** Заполняет сетку палитры кубиками. */
  fillCubeGrid: function (grid) {
    var self = this;
    this.cubeList().forEach(function (cube) {
      var node = el("button", {
        class: "cube cube-" + cube.color,
        draggable: "true",
        title: cube.hint,
        onclick: function () { self.autoPlace(cube.id); }
      }, [
        el("span", { class: "cube-en", text: cube.en }),
        cube.ru ? el("span", { class: "cube-ru", text: cube.ru }) : null
      ]);
      node.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", cube.id);
        e.dataTransfer.effectAllowed = "copy";
        node.classList.add("dragging");
      });
      node.addEventListener("dragend", function () { node.classList.remove("dragging"); });
      grid.appendChild(node);
    });
  }
};

/** Склеивает части предложения, поправляя пробелы перед знаками и сокращениями. */
function joinSentence(parts) {
  var s = parts.join(" ");
  s = s.replace(/\s+([?.!,;:])/g, "$1");
  s = s.replace(/\s+'(s|re|m|ll|d|ve|t)\b/g, "'$1");
  s = s.replace(/\bn't\b/g, "n't");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
