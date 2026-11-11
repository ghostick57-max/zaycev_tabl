/**
 * РАЗДЕЛ 4. ГЕНЕРАТОР УПРАЖНЕНИЙ.
 *
 * На основе таблицы/клетки выдаёт русские предложения для перевода.
 * Проверяет ответ с учётом допустимых вариаций (didn't = did not и т.п.).
 */

const Generator = {
  root: null,
  tableFilter: "",

  init: function (root) {
    this.root = root;
    this.render();
  },

  setTable: function (id) {
    this.tableFilter = id || "";
  },

  loadCell: function (num) {
    var list = exercisesForCell(num);
    var ex = list.length ? list[0] : null;
    AppState.exercise.current = ex || AppState.exercise.current;
    if (this.root) this.render();
  },

  next: function () {
    AppState.exercise.current = randomExercise(this.tableFilter);
    this.render();
  },

  check: function () {
    var cur = AppState.exercise.current;
    if (!cur) return;
    var input = $("#answer-input");
    var val = input ? input.value : "";
    var res = checkAnswer(val, cur.en);
    // Допускаем также совпадение с частью эталона (в эталоне бывает 2 предложения).
    var satisfied = res.correct || checkAnswer(cur.en, val).correct;
    var feedback = $("#answer-feedback");
    if (!feedback) return;
    clear(feedback);
    if (satisfied) {
      feedback.appendChild(el("div", { class: "feedback ok", text: "Верно! (" + res.score + "%)" }));
      Speech.say(cur.en);
      AppState.exercise.history.push({ ru: cur.ru, ok: true });
    } else if (res.score >= 70) {
      feedback.appendChild(el("div", { class: "feedback warn", text: "Почти! Совпадение " + res.score + "%. Сверьте порядок слов и формы глагола." }));
      AppState.exercise.history.push({ ru: cur.ru, ok: false });
    } else {
      var d = el("div", { class: "feedback bad", text: "Не совпадает (" + res.score + "%). Попробуйте ещё или посмотрите подсказку." });
      if (res.diff.length) {
        var table = el("table", { class: "diff-table" });
        res.diff.slice(0, 8).forEach(function (item) {
          table.appendChild(el("tr", {}, [
            el("td", { class: "diff-pos", text: "#" + (item.i + 1) }),
            el("td", { class: "diff-got", text: item.got || "—" }),
            el("td", { class: "diff-vs", text: "→" }),
            el("td", { class: "diff-want", text: item.want || "—" })
          ]));
        });
        d.appendChild(table);
      }
      feedback.appendChild(d);
      AppState.exercise.history.push({ ru: cur.ru, ok: false });
    }
  },

  showHint: function () {
    var cur = AppState.exercise.current;
    if (!cur) return;
    var box = $("#generator-hint");
    if (!box) return;
    clear(box);
    box.appendChild(el("div", { class: "hint-block" }, [
      el("strong", { text: "Подсказка. " }),
      el("span", { text: cur.hint || "" })
    ]));
    // Показать таблицу и клетку.
    var found = cellByNumber(cur.cellNum);
    if (found) {
      box.appendChild(el("div", { class: "hint-block" }, [
        el("span", { text: "Смотрите: таблица " + found.table.num + ". " + found.table.name + ", клетка " + found.cell.num + ". " }),
        el("button", { class: "btn tiny", text: "Открыть", onclick: function () {
          AppState.selectedTable = found.table.id; AppState.selectedCell = found; App.switchView("tables");
        } })
      ]));
      box.appendChild(renderTemplate(found.cell.template, "template-line"));
    }
  },

  showAnswer: function () {
    var cur = AppState.exercise.current;
    if (!cur) return;
    var box = $("#generator-answer");
    if (!box) return;
    clear(box);
    box.appendChild(el("div", { class: "example-en" }, [
      el("span", { text: cur.en }),
      el("button", { class: "btn tiny", text: "▶", onclick: function () { Speech.say(cur.en); } })
    ]));
  },

  toBuilder: function () {
    var cur = AppState.exercise.current;
    if (!cur) return;
    var found = cellByNumber(cur.cellNum);
    if (found) openBuilder(found.table, found.cell);
  },

  render: function () {
    var self = this;
    clear(this.root);

    this.root.appendChild(el("div", { class: "section-head" }, [
      el("h2", { text: "Генератор упражнений" }),
      el("p", { class: "muted", text: "Переведите русское предложение на английский. Проверка учитывает допустимые вариации: didn't = did not, isn't = is not и т.п." })
    ]));

    // Панель управления.
    var controls = el("div", { class: "generator-controls" });
    var sel = el("select", { class: "select", onchange: function (e) { self.tableFilter = e.target.value; } });
    sel.appendChild(el("option", { value: "", text: "Все таблицы" }));
    TABLE_ORDER.forEach(function (id) {
      var t = TABLES[id];
      sel.appendChild(el("option", { value: id, text: "Таблица " + t.num + ". " + t.name, selected: id === self.tableFilter }));
    });
    controls.appendChild(sel);
    controls.appendChild(el("button", { class: "btn primary", text: "Новое задание", onclick: function () { self.next(); } }));
    var stats = AppState.exercise.history.filter(function (h) { return h.ok; }).length;
    controls.appendChild(el("span", { class: "muted", text: "Верно: " + stats + " / " + AppState.exercise.history.length }));
    this.root.appendChild(controls);

    if (!AppState.exercise.current) AppState.exercise.current = randomExercise(this.tableFilter);
    var cur = AppState.exercise.current;

    var card = el("div", { class: "exercise-card" });
    card.appendChild(el("div", { class: "exercise-ru", text: cur.ru }));
    if (cur.tableNum) card.appendChild(el("div", { class: "muted small", text: "Таблица " + cur.tableNum + ". " + cur.tableName + (cur.cellNum ? ", клетка " + cur.cellNum : "") }));

    var input = el("textarea", {
      class: "answer-input",
      id: "answer-input",
      rows: "2",
      placeholder: "Напишите перевод по-английски…",
      onkeydown: function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); self.check(); } }
    });
    card.appendChild(input);

    var actions = el("div", { class: "exercise-actions" });
    actions.appendChild(el("button", { class: "btn primary", text: "Проверить", onclick: function () { self.check(); } }));
    actions.appendChild(el("button", { class: "btn", text: "Подсказка", onclick: function () { self.showHint(); } }));
    actions.appendChild(el("button", { class: "btn", text: "Показать ответ", onclick: function () { self.showAnswer(); } }));
    actions.appendChild(el("button", { class: "btn ghost", text: "Собрать в конструкторе", onclick: function () { self.toBuilder(); } }));
    card.appendChild(actions);

    card.appendChild(el("div", { class: "answer-feedback", id: "answer-feedback" }));
    card.appendChild(el("div", { class: "generator-hint", id: "generator-hint" }));
    card.appendChild(el("div", { class: "generator-answer", id: "generator-answer" }));

    this.root.appendChild(card);

    // Мини-история.
    if (AppState.exercise.history.length) {
      var hist = el("div", { class: "history" }, [el("h4", { text: "Журнал попыток" })]);
      AppState.exercise.history.slice(-8).reverse().forEach(function (h) {
        hist.appendChild(el("div", { class: "history-row " + (h.ok ? "ok" : "bad") }, [
          el("span", { class: "hist-mark", text: h.ok ? "✓" : "✗" }),
          el("span", { text: h.ru })
        ]));
      });
      this.root.appendChild(hist);
    }
  }
};
