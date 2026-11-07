/**
 * РАЗДЕЛ 1. КАРТА ТАБЛИЦ.
 *
 * Показывает таблицы методики как сетки клеток с номерами.
 * Клик по клетке → номер, цветовая схема и примеры предложений.
 */

const TableMap = {
  root: null,

  init: function (root) {
    this.root = root;
    this.render();
    Bus.on("filter", this.render.bind(this));
  },

  render: function () {
    var self = this;
    clear(this.root);

    this.root.appendChild(el("div", { class: "section-head" }, [
      el("h2", { text: "Карта таблиц" }),
      el("p", { class: "muted", text: "Каждая клетка — это адрес предложения. Кликните по клетке, чтобы увидеть номер, цветовую схему и примеры." })
    ]));

    this.root.appendChild(this.renderLegend());

    var layout = el("div", { class: "table-layout" });
    layout.appendChild(this.renderTableList());
    var stage = el("div", { class: "table-stage" });
    stage.id = "table-stage";
    layout.appendChild(stage);
    this.root.appendChild(layout);

    this.renderStage();
  },

  renderLegend: function () {
    var wrap = el("div", { class: "legend" });
    wrap.appendChild(el("span", { class: "legend-title", text: "Цвет = член предложения:" }));
    COLOR_ORDER.forEach(function (key) {
      if (key === "gray") return;
      wrap.appendChild(colorChip(key));
    });
    return wrap;
  },

  renderTableList: function () {
    var self = this;
    var list = el("div", { class: "table-list" });
    list.appendChild(el("div", { class: "list-title", text: "Таблицы" }));
    TABLE_ORDER.forEach(function (id) {
      var t = TABLES[id];
      var card = el("button", {
        class: "table-card" + (AppState.selectedTable === id ? " active" : ""),
        onclick: function () { self.selectTable(id); }
      }, [
        el("span", { class: "tc-num", text: "Т" + t.num }),
        el("span", { class: "tc-body" }, [
          el("span", { class: "tc-name", text: t.name }),
          el("span", { class: "tc-sub", text: t.subtitle })
        ])
      ]);
      list.appendChild(card);
    });
    return list;
  },

  selectTable: function (id) {
    AppState.selectedTable = id;
    AppState.selectedCell = null;
    this.render();
  },

  renderStage: function () {
    var stage = $("#table-stage");
    if (!stage) return;
    clear(stage);
    var table = TABLES[AppState.selectedTable];
    if (!table) return;

    var head = el("div", { class: "stage-head" }, [
      el("div", {}, [
        el("h3", {}, [
          el("span", { class: "badge-num", text: "Таблица " + table.num }),
          el("span", { text: " " + table.name })
        ]),
        el("p", { class: "muted", text: table.description })
      ]),
      el("div", { class: "stage-actions" }, [
        el("div", { class: "find-cell" }, [
          el("input", {
            id: "find-cell-input",
            type: "number",
            min: "1",
            placeholder: "№ клетки",
            title: "Найти клетку по номеру (Enter)",
            onkeydown: function (e) { if (e.key === "Enter") TableMap.gotoNumber(parseInt(e.target.value, 10)); }
          }),
          el("button", {
            class: "btn tiny",
            text: "Найти",
            onclick: function () {
              var inp = $("#find-cell-input");
              TableMap.gotoNumber(inp ? parseInt(inp.value, 10) : 0);
            }
          }),
          el("span", { class: "find-cell-note muted small", id: "find-cell-note" })
        ]),
        el("button", {
          class: "btn ghost small",
          text: "Оригинал таблицы",
          onclick: function () { TableMap.openOriginal(table); }
        })
      ])
    ]);
    stage.appendChild(head);

    if (table.notes && table.notes.length) {
      var notes = el("ul", { class: "notes" });
      table.notes.forEach(function (n) { notes.appendChild(el("li", { text: n })); });
      stage.appendChild(notes);
    }

    if (table.kind === "pronouns") {
      stage.appendChild(this.renderPronouns(table));
    } else {
      var voices = table.voices && table.voices.length ? table.voices : ["active"];
      voices.forEach(function (voice) {
        if (voices.length > 1) {
          stage.appendChild(el("h4", { class: "voice-title" },
            voice === "passive" ? "Страдательный залог (Passive)" : "Действительный залог (Active)"));
        }
        stage.appendChild(TableMap.renderVoiceGrid(table, voice));
      });
    }

    // Сводка по клетке.
    var detail = el("div", { class: "cell-detail", id: "cell-detail" });
    stage.appendChild(detail);
    if (AppState.selectedCell && AppState.selectedCell.table.id === table.id) {
      this.renderDetail(AppState.selectedCell.table, AppState.selectedCell.cell);
    } else {
      detail.appendChild(el("p", { class: "muted", text: "Выберите клетку, чтобы увидеть разбор." }));
    }
  },

  /** Таблица 1. Местоимения — 5 столбцов. */
  renderPronouns: function (table) {
    var wrap = el("div", { class: "pronoun-wrap" });
    var grid = el("table", { class: "pronoun-grid" });

    var thead = el("thead");
    var hr = el("tr");
    hr.appendChild(el("th", { class: "corner", text: "Лицо" }));
    table.columns.forEach(function (col) {
      hr.appendChild(el("th", { class: "pronoun-head", style: { "--c": COLORS[col.color].hex } }, [
        el("span", { class: "ph-title", text: col.title }),
        el("span", { class: "ph-role", text: col.role })
      ]));
    });
    thead.appendChild(hr);
    grid.appendChild(thead);

    var tbody = el("tbody");
    var rows = table.columns[0].items.length;
    for (var i = 0; i < rows; i++) {
      var tr = el("tr");
      tr.appendChild(el("th", { class: "pronoun-row", text: String(i + 1) }));
      table.columns.forEach(function (col) {
        var info = COLORS[col.color];
        var cell = el("td", { class: "pronoun-cell", style: { "--c": info.hex } }, [
          el("span", { class: "pc-word", text: col.items[i] }),
          el("span", { class: "pc-role", text: info.short })
        ]);
        if (col.rim) cell.classList.add("rim-" + col.rim);
        tr.appendChild(cell);
      });
      tbody.appendChild(tr);
    }
    grid.appendChild(tbody);
    wrap.appendChild(grid);

    if (table.questions && table.questions.length) {
      wrap.appendChild(el("div", { class: "pronoun-questions" }, [
        el("strong", { text: "Вопросительные слова: " }),
        el("span", { text: table.questions.join(", ") })
      ]));
    }
    return wrap;
  },

  renderVoiceGrid: function (table, voice) {
    var cells = cellsByVoice(table, voice);
    var formsPresent = [];
    FORMS.forEach(function (f) {
      if (cells.some(function (c) { return c.form === f.key; })) formsPresent.push(f);
    });
    var rowDefs = gridRows(table, voice);
    var rowClass = table.kind === "modal" ? "time-row modal-row" : "time-row";

    var grid = el("table", { class: "cell-grid" });
    var thead = el("thead");
    var hrow = el("tr");
    hrow.appendChild(el("th", { class: "corner", text: "Время" }));
    formsPresent.forEach(function (f) {
      hrow.appendChild(el("th", { class: "form-col" }, [
        el("span", { class: "form-name", text: f.label }),
        el("span", { class: "form-sign", text: f.sign })
      ]));
    });
    thead.appendChild(hrow);
    grid.appendChild(thead);

    var tbody = el("tbody");
    rowDefs.forEach(function (r) {
      var row = el("tr");
      row.appendChild(el("th", { class: rowClass, text: r.label }));
      formsPresent.forEach(function (f) {
        var found = cellAtRowForm(table, voice, r.key, f.key);
        var td = el("td");
        if (found) td.appendChild(TableMap.cellTile(table, found));
        else td.appendChild(el("div", { class: "cell-empty", text: "—" }));
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    grid.appendChild(tbody);
    return grid;
  },

  cellTile: function (table, cell) {
    var tile = el("button", {
      class: "cell-tile" + (AppState.selectedCell && AppState.selectedCell.cell.num === cell.num ? " active" : ""),
      style: { "--accent": COLORS[cell.colors[0]].hex },
      onclick: function () {
        AppState.selectedCell = { table: table, cell: cell };
        TableMap.renderStage();
        TableMap.renderDetail(table, cell);
      }
    }, [
      el("span", { class: "cell-num", text: cell.num }),
      el("span", { class: "cell-bars" }, cell.colors.map(function (c) {
        return el("i", { class: "bar bar-" + c, style: { background: COLORS[c].hex } });
      })),
      el("span", { class: "cell-text", text: templateText(cell.template) })
    ]);
    return tile;
  },

  renderDetail: function (table, cell) {
    var detail = $("#cell-detail");
    if (!detail) return;
    clear(detail);

    var f = formDef(cell.form);
    var t = timeDef(cell.time);

    detail.appendChild(el("div", { class: "detail-head" }, [
      el("span", { class: "big-num", text: cell.num }),
      el("div", {}, [
        el("div", { class: "detail-title", text: "Клетка " + cell.num + " · " + table.name }),
        el("div", { class: "muted", text: [t && t.label, f && f.label, cell.voice === "passive" ? "Passive" : "Active"].filter(Boolean).join(" · ") })
      ])
    ]));

    // Цветовая схема.
    var scheme = el("div", { class: "detail-block" }, [el("h5", { text: "Цветовая схема" })]);
    var chips = el("div", { class: "chips" });
    cell.colors.forEach(function (c) {
      var info = COLORS[c];
      chips.appendChild(el("span", { class: "chip chip-" + c, title: info.role }, [
        el("span", { class: "chip-dot", style: { background: info.hex } }),
        el("span", { text: info.label + " — " + info.role })
      ]));
    });
    scheme.appendChild(chips);
    detail.appendChild(scheme);

    // Цветной шаблон.
    var tpl = el("div", { class: "detail-block" }, [el("h5", { text: "Цветной шаблон" })]);
    tpl.appendChild(renderTemplate(cell.template, "template-line"));
    detail.appendChild(tpl);

    // Примеры.
    var ex = el("div", { class: "detail-block" }, [el("h5", { text: cell.kit ? "Пример из комплекта" : "Пример по шаблону" })]);
    var enLine = el("div", { class: "example-en" }, [
      el("span", { text: cell.en }),
      el("button", { class: "btn tiny", title: "Прослушать", text: "▶", onclick: function () { Speech.say(cell.en); } })
    ]);
    ex.appendChild(enLine);
    if (cell.ru) ex.appendChild(el("div", { class: "example-ru", text: cell.ru }));
    if (cell.kit) {
      ex.appendChild(el("div", { class: "muted small", text: "Пример соответствует номеру клетки в комплекте." }));
    } else {
      ex.appendChild(el("div", { class: "muted small", text: "Предложение построено по цветовому шаблону клетки." }));
    }
    detail.appendChild(ex);

    // Кнопки действий.
    var actions = el("div", { class: "detail-actions" });
    actions.appendChild(el("button", {
      class: "btn primary",
      text: "Собрать в конструкторе",
      onclick: function () { openBuilder(table, cell); }
    }));
    actions.appendChild(el("button", {
      class: "btn",
      text: "К упражнениям по клетке",
      onclick: function () { Generator.setTable(table.id); Generator.loadCell(cell.num); App.switchView("generator"); }
    }));
    detail.appendChild(actions);

    scrollToEl(detail);
  },

  /** Переход к клетке по номеру (правило «угадай номер клетки»). */
  gotoNumber: function (num) {
    var note = $("#find-cell-note");
    var input = $("#find-cell-input");
    if (!num || isNaN(num) || num < 1) {
      if (input) input.value = "";
      if (note) note.textContent = "Введите номер клетки";
      return;
    }
    var found = cellByNumber(num);
    if (!found) {
      if (note) note.textContent = "Клетка " + num + " не найдена (в комплекте 1–137)";
      return;
    }
    if (note) note.textContent = "";
    AppState.selectedTable = found.table.id;
    AppState.selectedCell = found;
    this.renderStage();
    this.renderDetail(found.table, found.cell);
  },

  openOriginal: function (table) {
    showModal("Оригинал таблицы " + table.num + ". " + table.name,
      el("div", { class: "original-wrap" }, [
        el("img", { class: "original-img", src: table.image, alt: "Таблица " + table.num })
      ]),
      "Загружено из комплекта «Таблицы Зайцева. Английский язык» (материалы).");
  }
};

/** Рисует цветную строку шаблона как набор сегментов. */
function renderTemplate(template, className) {
  var line = el("div", { class: className || "template-line" });
  template.forEach(function (s) {
    var info = COLORS[s.c];
    line.appendChild(el("span", {
      class: "seg seg-" + s.c,
      style: { "--c": info.hex },
      title: info.label + " — " + info.role
    }, [s.t]));
  });
  return line;
}
