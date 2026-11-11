/**
 * РАЗДЕЛ 2. МАСТЕР АЛГОРИТМА (по рис. 5 комплекта).
 *
 * Шаги:
 *   1. Актив или Пассив?
 *   2. Точка или Вопрос?
 *   3. «Чёрное» есть или нет?
 *   4. Прошедшее / Настоящее / Будущее?
 * Результат: номер клетки + цветной шаблон предложения.
 * На каждом шаге зона поиска сужается и подсвечивается на схеме таблицы.
 */

const Wizard = {
  root: null,

  init: function (root) {
    this.root = root;
    this.reset();
    this.render();
  },

  reset: function () {
    AppState.wizard = { table: AppState.selectedTable || "indefinite", voice: null, sign: null, negative: null, time: null, result: null };
  },

  set: function (key, value) {
    AppState.wizard[key] = value;
    // Сброс зависимых шагов.
    if (key === "table") { AppState.wizard.voice = null; AppState.wizard.sign = null; AppState.wizard.negative = null; AppState.wizard.time = null; }
    if (key === "voice") { AppState.wizard.sign = null; AppState.wizard.negative = null; AppState.wizard.time = null; }
    if (key === "sign") { AppState.wizard.negative = null; AppState.wizard.time = null; }
    if (key === "negative") { AppState.wizard.time = null; }
    AppState.wizard.result = this.solve();
    this.render();
  },

  /** Определяет клетку(и) по ответам. */
  solve: function () {
    var w = AppState.wizard;
    var table = TABLES[w.table];
    if (!table || !w.voice || !w.sign || w.negative === null || !w.time) return null;

    var formKeys = [];
    if (w.sign === "point") {
      formKeys = w.negative ? ["negative", "optional_not"] : ["statement"];
    } else {
      formKeys = w.negative ? ["negative_question"] : ["question"];
    }

    var matches = [];
    formKeys.forEach(function (fk) {
      var c = findCell(w.table, w.voice, fk, w.time);
      if (c) matches.push(c);
    });

    // Если для выбранной формы/времени клетки нет — ищем любую в этом залоге/времени.
    if (!matches.length) {
      (table.cells || []).forEach(function (c) {
        if (c.voice === w.voice && c.time === w.time) matches.push(c);
      });
    }
    return matches;
  },

  render: function () {
    var self = this;
    clear(this.root);
    var w = AppState.wizard;
    var table = TABLES[w.table];

    this.root.appendChild(el("div", { class: "section-head" }, [
      el("h2", { text: "Мастер алгоритма" }),
      el("p", { class: "muted", text: "Шаг за шагом определите клетку таблицы так, как это делает методика Зайцева. Зона поиска сужается с каждым ответом." }),
      el("button", {
        class: "btn ghost small",
        text: "↺ Сбросить мастер",
        title: "Начать определение заново",
        onclick: function () { Wizard.reset(); Wizard.render(); }
      })
    ]));

    var layout = el("div", { class: "wizard-layout" });
    var steps = el("div", { class: "wizard-steps" });

    // Шаг 0. Таблица
    steps.appendChild(this.stepCard(0, "Таблица", w.table, function (container) {
      var sel = el("select", { class: "select", onchange: function (e) { self.set("table", e.target.value); } });
      TABLE_ORDER.forEach(function (id) {
        var t = TABLES[id];
        sel.appendChild(el("option", { value: id, text: "Таблица " + t.num + ". " + t.name, selected: id === w.table }));
      });
      container.appendChild(sel);
    }));

    // Шаг 1. Актив / Пассив
    if (table.voices && table.voices.length > 1) {
      steps.appendChild(this.stepCard(1, "Актив или Пассив?", w.voice, function (container) {
        container.appendChild(self.choiceRow([
          { key: "active", label: "Актив", hint: "Я побил / Рабочие строят дом" },
          { key: "passive", label: "Пассив", hint: "Меня побили / Дом строится" }
        ], "voice", w.voice));
      }));
    } else {
      AppState.wizard.voice = "active";
    }

    // Шаг 2. Точка / Вопрос
    if (AppState.wizard.voice) {
      steps.appendChild(this.stepCard(2, "Точка или Вопрос?", w.sign, function (container) {
        container.appendChild(self.choiceRow([
          { key: "point", label: "Точка  .", hint: "повествовательное предложение" },
          { key: "question", label: "Вопрос  ?", hint: "вопросительное предложение" }
        ], "sign", w.sign));
      }));
    }

    // Шаг 3. Отрицание
    if (w.sign) {
      steps.appendChild(this.stepCard(3, "«Чёрное» есть или нет?", w.negative, function (container) {
        container.appendChild(self.choiceRow([
          { key: "no", label: "Нет  not/n't", hint: "отрицания в предложении нет" },
          { key: "yes", label: "Да  not / n't", hint: "есть отрицание" }
        ], "negative", w.negative === null ? null : (w.negative ? "yes" : "no")));
      }));
    }

    // Шаг 4. Время
    if (w.negative !== null) {
      steps.appendChild(this.stepCard(4, "Прошедшее / Настоящее / Будущее?", w.time, function (container) {
        container.appendChild(self.choiceRow(TIMES.map(function (t) {
          return { key: t.key, label: t.label, hint: t.short + " (" + t.ru + ")" };
        }), "time", w.time));
      }));
    }

    layout.appendChild(steps);
    layout.appendChild(self.renderResult());
    this.root.appendChild(layout);
  },

  stepCard: function (num, title, value, buildBody) {
    var body = el("div", { class: "step-body" });
    buildBody(body);
    var answered = value !== null && value !== undefined && value !== "";
    return el("div", { class: "step-card" + (answered ? " done" : "") }, [
      el("div", { class: "step-head" }, [
        el("span", { class: "step-num", text: String(num) }),
        el("span", { class: "step-title", text: title })
      ]),
      body
    ]);
  },

  choiceRow: function (options, key, current) {
    var self = this;
    var row = el("div", { class: "choice-row" });
    options.forEach(function (opt) {
      row.appendChild(el("button", {
        class: "choice" + (current === opt.key ? " active" : ""),
        onclick: function () { self.set(key, opt.key); }
      }, [
        el("span", { class: "choice-label", text: opt.label }),
        opt.hint ? el("span", { class: "choice-hint", text: opt.hint }) : null
      ]));
    });
    return row;
  },

  renderResult: function () {
    var w = AppState.wizard;
    var box = el("div", { class: "wizard-result" });
    box.appendChild(el("h4", { text: "Результат" }));

    if (!w.result) {
      box.appendChild(el("p", { class: "muted", text: "Ответьте на вопросы — здесь появится номер клетки и цветной шаблон." }));
      box.appendChild(this.renderZone([]));
      return box;
    }

    var self = this;
    var table = TABLES[w.table];
    var primary = w.result[0];

    box.appendChild(el("div", { class: "result-num" }, [
      el("span", { class: "big-num", text: primary.num }),
      el("span", { class: "muted", text: "клетка таблицы " + table.num + ". " + table.name })
    ]));

    w.result.forEach(function (cell, i) {
      if (i > 0) box.appendChild(el("div", { class: "alt-note", text: "Допустим и другой вариант:" }));
      var block = el("div", { class: "result-cell" });
      block.appendChild(el("div", { class: "result-cell-head" }, [
        el("strong", { text: "Клетка " + cell.num }),
        el("span", { class: "muted", text: " " + (formDef(cell.form) ? formDef(cell.form).label : "") })
      ]));
      block.appendChild(renderTemplate(cell.template, "template-line big"));
      block.appendChild(el("div", { class: "example-en" }, [
        el("span", { text: cell.en }),
        el("button", { class: "btn tiny", text: "▶", onclick: function () { Speech.say(cell.en); } })
      ]));
      if (cell.ru) block.appendChild(el("div", { class: "example-ru", text: cell.ru }));
      block.appendChild(el("button", {
        class: "btn primary small",
        text: "Собрать в конструкторе",
        onclick: function () { openBuilder(table, cell); }
      }));
      box.appendChild(block);
    });

    box.appendChild(self.renderZone(w.result.map(function (c) { return c.num; })));
    return box;
  },

  /** Схема таблицы с подсветкой искомых клеток (зона поиска). */
  renderZone: function (highlightNums) {
    var w = AppState.wizard;
    var table = TABLES[w.table];
    if (!table || !table.cells) return el("div");
    var wrap = el("div", { class: "zone" });
    wrap.appendChild(el("div", { class: "zone-title", text: "Зона поиска в таблице:" }));

    var voices = table.voices && table.voices.length ? table.voices : ["active"];
    voices.forEach(function (voice) {
      if (w.voice && table.voices && table.voices.length > 1 && voice !== w.voice) return;
      var cells = cellsByVoice(table, voice);
      if (!cells.length) return;
      var formsPresent = FORMS.filter(function (f) { return cells.some(function (c) { return c.form === f.key; }); });
      var rowDefs = gridRows(table, voice);

      var grid = el("table", { class: "zone-grid" });
      var hr = el("tr");
      hr.appendChild(el("th", { text: "" }));
      formsPresent.forEach(function (f) { hr.appendChild(el("th", { text: f.sign + " " + f.label })); });
      grid.appendChild(el("thead", {}, [hr]));
      var tb = el("tbody");
      rowDefs.forEach(function (r) {
        var tr = el("tr");
        tr.appendChild(el("th", { text: r.short }));
        formsPresent.forEach(function (f) {
          var cell = cellAtRowForm(table, voice, r.key, f.key);
          var isHit = cell && highlightNums.indexOf(cell.num) !== -1;
          var isMiss = cell && highlightNums.length && !isHit;
          tr.appendChild(el("td", {
            class: "zone-cell" + (isHit ? " hit" : "") + (isMiss ? " dim" : ""),
            text: cell ? cell.num : "—"
          }));
        });
        tb.appendChild(tr);
      });
      grid.appendChild(tb);
      wrap.appendChild(grid);
    });
    return wrap;
  }
};
