/**
 * РАЗДЕЛ 5. КАРТА МИРА МЕТОДИКИ.
 *
 * Панорамный игровой мир: 9 земель (таблиц), 134 клетки-адреса и
 * маршруты перехода между ними. Карту можно перетаскивать, приближать,
 * фильтровать по времени / залогу / цвету, искать клетку по номеру и
 * открывать её в остальных разделах тренажёра.
 */

var WM_SVG_NS = "http://www.w3.org/2000/svg";

/** Создаёт SVG-элемент. */
function wmEl(tag, attrs, children) {
  var node = document.createElementNS(WM_SVG_NS, tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") node.setAttribute("class", v);
      else if (k === "text") node.textContent = v;
      else if (k === "dataset") {
        Object.keys(v).forEach(function (d) { node.setAttribute("data-" + d, v[d]); });
      } else if (k === "style" && typeof v === "object") {
        Object.keys(v).forEach(function (s) { node.style.setProperty(s, v[s]); });
      } else if (k.indexOf("on") === 0 && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, v);
    });
  }
  if (children != null) {
    (Array.isArray(children) ? children : [children]).forEach(function (ch) {
      if (ch == null || ch === false) return;
      if (typeof ch === "string" || typeof ch === "number") {
        node.appendChild(document.createTextNode(String(ch)));
      } else {
        node.appendChild(ch);
      }
    });
  }
  return node;
}

const WorldMap = {
  root: null,
  shell: null,
  stage: null,
  svg: null,
  camera: null,
  panel: null,
  tooltip: null,
  minimapSvg: null,
  minimapView: null,
  progressText: null,
  progressBar: null,
  visibleCount: null,

  state: { region: null, node: null, time: null, voice: null, color: null },
  cam: { x: 0, y: 0, k: 1 },
  minK: 0.14,
  maxK: 3.4,
  hasFit: false,
  drag: null,
  moved: false,
  justDragged: 0,
  mmDrag: false,
  anim: null,
  explored: {},
  nodeEls: {},
  regionEls: {},
  routeEls: [],

  /* ------------------------------------------------------------------ */
  /* Инициализация и каркас                                              */
  /* ------------------------------------------------------------------ */

  init: function (root) {
    this.root = root;
    this.explored = Store.get("worldExplored", {}) || {};
    this.render();

    var self = this;
    window.addEventListener("resize", debounce(function () {
      if (!self.svg) return;
      if (!self.hasFit) self.startView(false);
      else self.updateMinimap();
    }, 180));
  },

  onShow: function () {
    var self = this;
    requestAnimationFrame(function () {
      if (!self.svg) return;
      if (!self.hasFit) self.startView(false);
      else self.updateMinimap();
    });
  },

  /**
   * Первый показ карты. На узких экранах весь мир вписывается
   * микроскопически, поэтому стартуем с читаемого масштаба
   * в центре панорамы; кнопка «⛶» по-прежнему показывает весь мир.
   */
  startView: function (animate) {
    if (window.innerWidth < 560) {
      var focus = WORLD.regions.filter(function (r) { return r.id === "indefinite"; })[0] || WORLD.regions[0];
      this.focusPoint(focus.center.x, focus.center.y, 0.72, animate);
      this.hasFit = true;
      return;
    }
    this.fit(animate);
  },

  render: function () {
    var self = this;
    clear(this.root);

    this.root.appendChild(this.renderHead());
    this.root.appendChild(this.renderToolbar());
    this.root.appendChild(this.renderShell());
    this.root.appendChild(this.renderFooter());

    this.buildMap();
    this.applyFilters();
    this.updateProgress();
    this.markSelection();
  },

  renderHead: function () {
    var self = this;
    var head = el("div", { class: "world-head" });

    head.appendChild(el("div", { class: "world-head-main" }, [
      el("h2", { text: "Карта мира методики" }),
      el("p", { class: "muted", text:
        "Вся панорама Зайцева в одном взгляде: девять земель, 134 клетки-адреса и маршруты между ними. " +
        "Тяните карту, приближайте колёсиком и открывайте клетки — каждая ведёт в таблицу, мастер и конструктор." })
    ]));

    var stats = el("div", { class: "world-stats" });
    stats.appendChild(this.statBlock(WORLD.stats.regions, "земель"));
    stats.appendChild(this.statBlock(WORLD.stats.cells, "клеток"));
    stats.appendChild(this.statBlock(WORLD.stats.routes, "маршрутов"));

    var progress = el("div", { class: "world-progress" });
    var line = el("div", { class: "wp-line" });
    line.appendChild(el("span", { text: "Исследовано " }));
    this.progressText = el("strong", { id: "world-progress-text", text: "0" });
    line.appendChild(this.progressText);
    line.appendChild(el("span", { text: " / " + WORLD.stats.cells }));
    var reset = el("button", {
      class: "wp-reset",
      type: "button",
      title: "Сбросить прогресс исследования",
      text: "↺",
      onclick: function () { self.resetProgress(); }
    });
    line.appendChild(reset);
    progress.appendChild(line);

    var bar = el("div", { class: "wp-bar" });
    this.progressBar = el("i", { id: "world-progress-bar" });
    bar.appendChild(this.progressBar);
    progress.appendChild(bar);
    stats.appendChild(progress);

    head.appendChild(stats);
    return head;
  },

  statBlock: function (value, label) {
    return el("div", { class: "world-stat" }, [
      el("b", { text: String(value) }),
      el("span", { text: label })
    ]);
  },

  renderToolbar: function () {
    var self = this;
    var bar = el("div", { class: "world-toolbar" });

    var search = el("div", { class: "world-search" });
    search.appendChild(el("input", {
      id: "world-search-input",
      type: "number",
      min: "1",
      max: String(WORLD.stats.maxNumber),
      placeholder: "№ клетки",
      title: "Найти клетку по номеру",
      onkeydown: function (e) { if (e.key === "Enter") self.search(); }
    }));
    search.appendChild(el("button", {
      class: "btn primary small",
      type: "button",
      text: "Найти",
      onclick: function () { self.search(); }
    }));
    var note = el("span", { class: "world-search-note", id: "world-search-note" });
    search.appendChild(note);
    bar.appendChild(search);

    bar.appendChild(el("button", {
      class: "btn ghost small",
      type: "button",
      text: "🎲 Случайная клетка",
      title: "Открыть случайный адрес мира",
      onclick: function () { self.randomCell(); }
    }));

    var filters = el("div", { class: "world-filters" });

    filters.appendChild(this.filterGroup("Время", "time", TIMES.map(function (t) {
      return { value: t.key, label: t.short, title: t.label + " (" + t.ru + ")" };
    })));

    filters.appendChild(this.filterGroup("Залог", "voice", [
      { value: "active", label: "Active", title: "Действительный залог" },
      { value: "passive", label: "Passive", title: "Страдательный залог" }
    ]));

    var colorChips = COLOR_ORDER.filter(function (c) { return c !== "gray"; }).map(function (key) {
      return {
        value: key,
        label: COLORS[key].short,
        title: COLORS[key].label + " — " + COLORS[key].role,
        dot: COLORS[key].hex
      };
    });
    filters.appendChild(this.filterGroup("Цвет", "color", colorChips));

    filters.appendChild(el("button", {
      class: "btn ghost tiny world-filter-reset",
      type: "button",
      text: "Сбросить срез",
      onclick: function () { self.clearFilters(); }
    }));

    bar.appendChild(filters);

    bar.appendChild(el("div", { class: "world-visible" }, [
      el("span", { text: "В срезе: " }),
      this.visibleCount = el("b", { id: "world-visible-count", text: String(WORLD.stats.cells) })
    ]));

    return bar;
  },

  filterGroup: function (title, filter, items) {
    var group = el("div", { class: "wfilter-group" });
    group.appendChild(el("span", { class: "wfilter-label", text: title }));
    items.forEach(function (item) {
      var chip = el("button", {
        class: "wchip",
        type: "button",
        title: item.title || item.label,
        dataset: { filter: filter, value: item.value },
        onclick: function () { WorldMap.setFilter(filter, item.value); }
      });
      if (item.dot) {
        chip.appendChild(el("i", { class: "wchip-dot", style: { background: item.dot } }));
      }
      chip.appendChild(el("span", { text: item.label }));
      group.appendChild(chip);
    });
    return group;
  },

  renderShell: function () {
    var self = this;
    var shell = el("div", { class: "world-shell", id: "world-shell" });
    this.shell = shell;

    this.stage = el("div", { class: "world-stage", id: "world-stage" });
    shell.appendChild(this.stage);

    this.panel = el("aside", { class: "world-panel", id: "world-panel", "aria-live": "polite" });
    shell.appendChild(this.panel);

    this.tooltip = el("div", { class: "world-tooltip", id: "world-tooltip" });
    shell.appendChild(this.tooltip);

    var zoom = el("div", { class: "world-zoom" });
    zoom.appendChild(el("button", {
      type: "button", title: "Приблизить", text: "+",
      onclick: function () { self.zoomBy(1.28); }
    }));
    zoom.appendChild(el("button", {
      type: "button", title: "Отдалить", text: "−",
      onclick: function () { self.zoomBy(1 / 1.28); }
    }));
    zoom.appendChild(el("button", {
      type: "button", title: "Показать весь мир", text: "⛶",
      onclick: function () { self.fit(true); }
    }));
    shell.appendChild(zoom);

    var hint = el("div", { class: "world-hint" }, [
      el("span", { text: "Перетащите карту" }),
      el("i", {}),
      el("span", { text: "колесо — масштаб" }),
      el("i", {}),
      el("span", { text: "клик по земле — разбор" })
    ]);
    shell.appendChild(hint);

    return shell;
  },

  renderFooter: function () {
    var foot = el("div", { class: "world-footer" });

    var legend = el("div", { class: "world-legend" });
    legend.appendChild(el("span", { class: "world-legend-title", text: "Цвет клетки = член предложения:" }));
    COLOR_ORDER.forEach(function (key) {
      if (key === "gray") return;
      var info = COLORS[key];
      legend.appendChild(el("span", { class: "world-legend-item", title: info.role }, [
        el("i", { style: { background: info.hex } }),
        el("span", { text: info.short })
      ]));
    });

    foot.appendChild(legend);
    foot.appendChild(el("p", { class: "world-legend-note muted small", text:
      "Цвет земли — навигационный биом карты. Цвет клетки — грамматическая роль. " +
      "Номера совпадают с клетками бумажного комплекта (1–137)." }));

    return foot;
  },

  /* ------------------------------------------------------------------ */
  /* Построение карты                                                    */
  /* ------------------------------------------------------------------ */

  buildMap: function () {
    var self = this;
    this.nodeEls = {};
    this.regionEls = {};
    this.routeEls = [];

    var svg = wmEl("svg", {
      class: "world-svg",
      id: "world-svg",
      role: "img",
      "aria-label": "Панорамная карта мира методики Зайцева"
    });
    this.svg = svg;

    this.camera = wmEl("g", { class: "world-camera" });
    svg.appendChild(this.camera);

    var stars = wmEl("g", { class: "world-stars" });
    var rnd = worldRng("world-stars");
    var b = WORLD.bounds;
    for (var i = 0; i < 110; i++) {
      var sx = b.x + rnd() * b.w;
      var sy = b.y + rnd() * b.h;
      var sr = 0.7 + rnd() * 1.7;
      stars.appendChild(wmEl("circle", { cx: sx.toFixed(1), cy: sy.toFixed(1), r: sr.toFixed(1) }));
    }
    this.camera.appendChild(stars);

    // Маршруты — под землями.
    var routesG = wmEl("g", { class: "world-routes" });
    WORLD.routes.forEach(function (route) {
      var geo = self.routeGeometry(route);
      var g = wmEl("g", {
        class: "w-route",
        dataset: { from: route.from.id, to: route.to.id }
      });
      g.appendChild(wmEl("path", { class: "w-route-glow", d: geo.d }));
      g.appendChild(wmEl("path", { class: "w-route-line", d: geo.d }));
      g.appendChild(wmEl("text", {
        class: "w-route-label",
        x: (geo.mx + (route.labelDx || 0)).toFixed(1),
        y: (geo.my - 7 + (route.labelDy || 0)).toFixed(1),
        text: route.label
      }));
      routesG.appendChild(g);
      self.routeEls.push({ el: g, route: route });
    });
    this.camera.appendChild(routesG);

    // Земли.
    var regionsG = wmEl("g", { class: "world-regions" });
    WORLD.regions.forEach(function (region) {
      var g = wmEl("g", {
        class: "w-region",
        dataset: { id: region.id },
        style: { "--biome": region.biome }
      });
      g.appendChild(wmEl("path", { class: "w-contour w-contour-b", d: region.contourB }));
      g.appendChild(wmEl("path", { class: "w-contour", d: region.contourA }));
      g.appendChild(wmEl("path", { class: "w-land", d: region.path }));

      g.addEventListener("click", function (e) {
        if (self.isClickSuppressed()) return;
        if (e.target.closest && e.target.closest(".w-node")) return;
        self.selectRegion(region);
      });
      g.addEventListener("dblclick", function (e) {
        e.stopPropagation();
        self.selectRegion(region);
        self.focusRegion(region);
      });

      regionsG.appendChild(g);
      self.regionEls[region.id] = g;
    });
    this.camera.appendChild(regionsG);

    // Клетки.
    var nodesG = wmEl("g", { class: "world-nodes" });
    WORLD.nodes.forEach(function (node) {
      var g = self.buildNode(node);
      nodesG.appendChild(g);
      self.nodeEls[node.id] = g;
    });
    this.camera.appendChild(nodesG);

    // Названия земель поверх всего.
    var labelsG = wmEl("g", { class: "world-region-labels" });
    WORLD.regions.forEach(function (region) {
      var g = wmEl("g", {
        class: "w-region-label",
        dataset: { id: region.id },
        style: { "--biome": region.biome }
      });
      g.appendChild(wmEl("text", {
        class: "w-region-badge",
        x: region.center.x.toFixed(1),
        y: (region.label.nameY - 18).toFixed(1),
        text: "T" + region.table.num
      }));
      g.appendChild(wmEl("text", {
        class: "w-region-name",
        x: region.center.x.toFixed(1),
        y: region.label.nameY.toFixed(1),
        text: region.table.name
      }));
      g.appendChild(wmEl("text", {
        class: "w-region-sub",
        x: region.center.x.toFixed(1),
        y: region.label.subY.toFixed(1),
        text: region.epithet
      }));
      g.addEventListener("click", function () {
        if (self.isClickSuppressed()) return;
        self.selectRegion(region);
      });
      g.addEventListener("dblclick", function (e) {
        e.stopPropagation();
        self.selectRegion(region);
        self.focusRegion(region);
      });
      labelsG.appendChild(g);
    });
    this.camera.appendChild(labelsG);

    this.stage.appendChild(svg);
    this.buildMinimap();
    this.bindCamera();
  },

  buildNode: function (node) {
    var self = this;
    var colors = node.colors && node.colors.length ? node.colors : ["gray"];
    var label = node.kind === "cell" ? String(node.cell.num) : node.word;

    var g = wmEl("g", {
      class: "w-node" + (node.kind === "pronoun" ? " w-node-pronoun" : ""),
      transform: "translate(" + node.x.toFixed(2) + " " + node.y.toFixed(2) + ")",
      dataset: { id: node.id },
      role: "button",
      tabindex: "0",
      "aria-label": node.kind === "cell"
        ? ("Клетка " + node.cell.num + " — " + node.table.name)
        : (node.word + " — " + node.column.title)
    });
    if (node.kind === "cell" && this.explored[node.cell.num]) g.classList.add("is-visited");

    g.appendChild(wmEl("circle", { class: "w-node-hit", r: 16 }));

    var base = wmEl("rect", {
      class: "w-node-base",
      x: -11, y: -5.5, width: 22, height: 11, rx: 3.5
    });
    g.appendChild(base);

    var segW = 22 / colors.length;
    colors.forEach(function (key, i) {
      var info = COLORS[key] || COLORS.gray;
      g.appendChild(wmEl("rect", {
        class: "w-node-seg",
        x: (-11 + i * segW + 0.35).toFixed(2),
        y: -5,
        width: Math.max(1, segW - 0.7).toFixed(2),
        height: 10,
        rx: 1.4,
        fill: info.hex
      }));
    });

    g.appendChild(wmEl("rect", {
      class: "w-node-ring",
      x: -14, y: -8.5, width: 28, height: 17, rx: 6
    }));
    g.appendChild(wmEl("circle", { class: "w-visited-dot", cx: 12, cy: -7, r: 2.6 }));

    var text = wmEl("text", {
      class: "w-node-num" + (node.kind === "pronoun" ? " w-node-word" : ""),
      x: 0,
      y: 19,
      text: label
    });
    g.appendChild(text);

    var title = node.kind === "cell"
      ? ("Клетка " + node.cell.num + " · " + node.table.name + "\n" + templateText(node.cell.template))
      : (node.word + " · " + node.column.title + " · " + node.column.role);
    g.appendChild(wmEl("title", { text: title }));

    g.addEventListener("click", function (e) {
      e.stopPropagation();
      if (self.isClickSuppressed()) return;
      self.selectNode(node, true);
    });
    g.addEventListener("dblclick", function (e) {
      e.stopPropagation();
      self.selectNode(node, false);
    });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        self.selectNode(node, true);
      }
    });
    g.addEventListener("pointerenter", function (e) { self.showTooltip(node, e); });
    g.addEventListener("pointermove", function (e) { self.moveTooltip(e); });
    g.addEventListener("pointerleave", function () { self.hideTooltip(); });
    g.addEventListener("focus", function () {
      var r = self.stage.getBoundingClientRect();
      self.showTooltip(node, { clientX: r.left + r.width / 2, clientY: r.top + 30 });
    });
    g.addEventListener("blur", function () { self.hideTooltip(); });

    return g;
  },

  routeGeometry: function (route) {
    var p1 = this.edgePoint(route.from, route.to.center);
    var p2 = this.edgePoint(route.to, route.from.center);
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len;
    var ny = dx / len;
    var mx = (p1.x + p2.x) / 2 + nx * route.bend;
    var my = (p1.y + p2.y) / 2 + ny * route.bend;
    return {
      d: "M " + p1.x.toFixed(1) + " " + p1.y.toFixed(1) +
        " Q " + mx.toFixed(1) + " " + my.toFixed(1) +
        " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1),
      mx: mx,
      my: my
    };
  },

  edgePoint: function (region, toward) {
    var dx = toward.x - region.center.x;
    var dy = toward.y - region.center.y;
    var A = region.rect.w / 2;
    var B = region.rect.h / 2;
    var t = 1 / Math.sqrt((dx * dx) / (A * A) + (dy * dy) / (B * B));
    return {
      x: region.center.x + dx * t,
      y: region.center.y + dy * t
    };
  },

  /* ------------------------------------------------------------------ */
  /* Камера: перетаскивание, масштаб, миникарта                           */
  /* ------------------------------------------------------------------ */

  isClickSuppressed: function () {
    return this.justDragged && (performance.now() - this.justDragged) < 160;
  },

  bindCamera: function () {
    var self = this;

    this.svg.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (e.target.closest && e.target.closest(".w-node")) return;
      self.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: self.cam.x, oy: self.cam.y };
      self.moved = false;
      try { self.svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      self.svg.classList.add("is-panning");
    });

    this.svg.addEventListener("pointermove", function (e) {
      if (!self.drag || self.drag.id !== e.pointerId) return;
      var dx = e.clientX - self.drag.sx;
      var dy = e.clientY - self.drag.sy;
      if (!self.moved && Math.abs(dx) + Math.abs(dy) > 4) self.moved = true;
      if (!self.moved) return;
      self.setCam(self.drag.ox + dx, self.drag.oy + dy, self.cam.k);
    });

    function endDrag(e) {
      if (!self.drag) return;
      if (e && self.drag.id !== e.pointerId) return;
      try { self.svg.releasePointerCapture(self.drag.id); } catch (err) { /* ignore */ }
      if (self.moved) self.justDragged = performance.now();
      self.moved = false;
      self.drag = null;
      self.svg.classList.remove("is-panning");
    }
    this.svg.addEventListener("pointerup", endDrag);
    this.svg.addEventListener("pointercancel", endDrag);

    this.svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var r = self.svg.getBoundingClientRect();
      var factor = e.deltaY < 0 ? 1.16 : 1 / 1.16;
      self.zoomAt(e.clientX - r.left, e.clientY - r.top, factor);
    }, { passive: false });

    this.svg.addEventListener("dblclick", function (e) {
      if (e.target.closest && (e.target.closest(".w-node") || e.target.closest(".w-region") || e.target.closest(".w-region-label"))) return;
      var r = self.svg.getBoundingClientRect();
      self.zoomAt(e.clientX - r.left, e.clientY - r.top, 1.45);
    });
  },

  buildMinimap: function () {
    var self = this;
    var b = WORLD.bounds;
    var svg = wmEl("svg", {
      class: "world-minimap-svg",
      viewBox: b.x + " " + b.y + " " + b.w + " " + b.h,
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "Миникарта мира"
    });

    WORLD.regions.forEach(function (region) {
      svg.appendChild(wmEl("ellipse", {
        class: "mm-land",
        cx: region.center.x,
        cy: region.center.y,
        rx: region.rect.w / 2,
        ry: region.rect.h / 2,
        style: { "--biome": region.biome }
      }));
    });

    this.minimapView = wmEl("rect", { class: "mm-view", x: 0, y: 0, width: 0, height: 0 });
    svg.appendChild(this.minimapView);

    svg.addEventListener("pointerdown", function (e) {
      self.mmDrag = true;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      self.centerFromMinimap(e);
    });
    svg.addEventListener("pointermove", function (e) {
      if (self.mmDrag) self.centerFromMinimap(e);
    });
    function stop() { self.mmDrag = false; }
    svg.addEventListener("pointerup", stop);
    svg.addEventListener("pointercancel", stop);

    var wrap = el("div", { class: "world-minimap", title: "Обзор мира: кликните, чтобы переместиться" });
    wrap.appendChild(svg);
    this.shell.appendChild(wrap);
    this.minimapSvg = svg;
  },

  centerFromMinimap: function (e) {
    var r = this.minimapSvg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    var py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    var b = WORLD.bounds;
    this.focusPoint(b.x + px * b.w, b.y + py * b.h, this.cam.k, false);
  },

  fit: function (animate) {
    if (!this.svg) return;
    var r = this.svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var b = WORLD.bounds;
    var panelW = (this.shell && this.shell.classList.contains("has-panel") && window.innerWidth > 980) ? 400 : 0;
    var availW = Math.max(240, r.width - panelW);
    var k = Math.min(availW / b.w, r.height / b.h) * 0.94;
    k = Math.max(this.minK, Math.min(this.maxK, k));
    var tx = availW / 2 - (b.x + b.w / 2) * k;
    var ty = r.height / 2 - (b.y + b.h / 2) * k;
    if (animate) this.animateCam(tx, ty, k, 460);
    else this.setCam(tx, ty, k);
    this.hasFit = true;
  },

  setCam: function (x, y, k) {
    k = Math.max(this.minK, Math.min(this.maxK, k));
    this.cam = { x: x, y: y, k: k };
    if (this.camera) {
      this.camera.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + k.toFixed(4) + ")");
    }
    if (this.svg) {
      // Подписи карты держим читаемыми на любом масштабе:
      // размер шрифта компенсирует zoom камеры.
      this.svg.style.setProperty("--wm-inv", (1 / k).toFixed(4));
      this.svg.classList.toggle("w-labels", k >= 0.62);
      this.svg.classList.toggle("w-far", k < 0.28);
    }
    this.updateMinimap();
  },

  zoomAt: function (px, py, factor) {
    var k = Math.max(this.minK, Math.min(this.maxK, this.cam.k * factor));
    if (k === this.cam.k) return;
    var wx = (px - this.cam.x) / this.cam.k;
    var wy = (py - this.cam.y) / this.cam.k;
    this.setCam(px - wx * k, py - wy * k, k);
  },

  zoomBy: function (factor) {
    if (!this.svg) return;
    var r = this.svg.getBoundingClientRect();
    var panelW = (this.shell.classList.contains("has-panel") && window.innerWidth > 980) ? 400 : 0;
    this.zoomAt((r.width - panelW) / 2, r.height / 2, factor);
  },

  focusPoint: function (wx, wy, k, animate) {
    if (!this.svg) return;
    var r = this.svg.getBoundingClientRect();
    var panelW = (this.shell && this.shell.classList.contains("has-panel") && window.innerWidth > 980) ? 400 : 0;
    var cx = Math.max(120, (r.width - panelW) / 2);
    var cy = r.height / 2;
    var tx = cx - wx * k;
    var ty = cy - wy * k;
    if (animate) this.animateCam(tx, ty, k, 520);
    else this.setCam(tx, ty, k);
  },

  flyTo: function (wx, wy, k, duration) {
    this.focusPoint(wx, wy, k, true, duration);
  },

  animateCam: function (tx, ty, tk, duration) {
    var self = this;
    if (this.anim) cancelAnimationFrame(this.anim);
    var start = { x: this.cam.x, y: this.cam.y, k: this.cam.k };
    var t0 = performance.now();
    tk = Math.max(this.minK, Math.min(this.maxK, tk));
    function step(now) {
      var t = Math.min(1, (now - t0) / duration);
      var e = 1 - Math.pow(1 - t, 3);
      self.setCam(
        start.x + (tx - start.x) * e,
        start.y + (ty - start.y) * e,
        start.k + (tk - start.k) * e
      );
      if (t < 1) self.anim = requestAnimationFrame(step);
      else self.anim = null;
    }
    this.anim = requestAnimationFrame(step);
  },

  focusRegion: function (region) {
    if (!this.svg) return;
    var r = this.svg.getBoundingClientRect();
    var panelW = (this.shell.classList.contains("has-panel") && window.innerWidth > 980) ? 400 : 0;
    var availW = Math.max(240, r.width - panelW);
    var k = Math.min(availW / (region.rect.w * 1.35), r.height / (region.rect.h * 1.35));
    k = Math.max(0.55, Math.min(1.6, k));
    this.focusPoint(region.center.x, region.center.y, k, true);
  },

  updateMinimap: function () {
    if (!this.minimapView || !this.svg) return;
    var r = this.svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var k = this.cam.k;
    this.minimapView.setAttribute("x", (-this.cam.x / k).toFixed(1));
    this.minimapView.setAttribute("y", (-this.cam.y / k).toFixed(1));
    this.minimapView.setAttribute("width", (r.width / k).toFixed(1));
    this.minimapView.setAttribute("height", (r.height / k).toFixed(1));
  },

  /* ------------------------------------------------------------------ */
  /* Выбор, фильтры, поиск                                               */
  /* ------------------------------------------------------------------ */

  selectRegion: function (region) {
    this.state.region = region;
    this.state.node = null;
    this.markSelection();
    this.renderPanel();
  },

  selectNode: function (node, fly) {
    this.state.node = node;
    this.state.region = node.region;
    if (node.kind === "cell") {
      this._justDiscovered = !this.explored[node.cell.num];
      this.markExplored(node.cell.num);
    }
    this.markSelection();
    this.renderPanel();
    if (node.kind === "cell") {
      var note = $("#world-search-note");
      if (note) note.textContent = "Клетка " + node.cell.num + " · " + node.table.name;
    }
    if (fly && this.cam.k < 0.8) this.flyTo(node.x, node.y, 0.96, 520);
  },

  clearSelection: function () {
    this.state.region = null;
    this.state.node = null;
    this.markSelection();
    if (this.shell) this.shell.classList.remove("has-panel");
  },

  markSelection: function () {
    var state = this.state;
    Object.keys(this.regionEls).forEach(function (id) {
      WorldMap.regionEls[id].classList.toggle("is-active", !!(state.region && state.region.id === id));
    });
    Object.keys(this.nodeEls).forEach(function (id) {
      WorldMap.nodeEls[id].classList.toggle("is-selected", !!(state.node && state.node.id === id));
    });
    this.routeEls.forEach(function (item) {
      var active = state.region && (item.route.from.id === state.region.id || item.route.to.id === state.region.id);
      item.el.classList.toggle("is-active", !!active);
    });
  },

  setFilter: function (kind, value) {
    this.state[kind] = this.state[kind] === value ? null : value;
    this.syncFilterButtons();
    this.applyFilters();
    if (this.state.region) this.renderPanel();
  },

  clearFilters: function () {
    this.state.time = null;
    this.state.voice = null;
    this.state.color = null;
    this.syncFilterButtons();
    this.applyFilters();
    if (this.state.region) this.renderPanel();
  },

  syncFilterButtons: function () {
    var state = this.state;
    $all(".wchip[data-filter]", this.root).forEach(function (btn) {
      btn.classList.toggle("active", state[btn.dataset.filter] === btn.dataset.value);
    });
  },

  nodeMatches: function (node) {
    var state = this.state;
    if (node.kind === "pronoun") {
      if (state.time || state.voice) return false;
      if (state.color && node.column.color !== state.color) return false;
      return true;
    }
    var cell = node.cell;
    if (state.time && cell.time !== state.time) return false;
    if (state.voice && cell.voice !== state.voice) return false;
    if (state.color && cell.colors.indexOf(state.color) === -1) return false;
    return true;
  },

  applyFilters: function () {
    var self = this;
    var visible = 0;
    var regionHit = {};

    WORLD.nodes.forEach(function (node) {
      var ok = self.nodeMatches(node);
      var elem = self.nodeEls[node.id];
      if (elem) elem.classList.toggle("is-dim", !ok);
      if (ok) {
        regionHit[node.region.id] = true;
        if (node.kind === "cell") visible++;
      }
    });

    WORLD.regions.forEach(function (region) {
      var elem = self.regionEls[region.id];
      if (elem) elem.classList.toggle("is-filtered", !regionHit[region.id]);
    });

    if (this.visibleCount) this.visibleCount.textContent = String(visible);
  },

  search: function () {
    var input = $("#world-search-input");
    var note = $("#world-search-note");
    var num = input ? parseInt(input.value, 10) : NaN;
    if (!num || isNaN(num) || num < 1) {
      if (note) note.textContent = "Введите номер клетки";
      return;
    }
    var node = null;
    for (var i = 0; i < WORLD.cellNodes.length; i++) {
      if (WORLD.cellNodes[i].cell.num === num) { node = WORLD.cellNodes[i]; break; }
    }
    if (!node) {
      if (note) note.textContent = "Клетки " + num + " нет в комплекте";
      return;
    }
    this.selectNode(node, false);
    this.flyTo(node.x, node.y, 1.05, 620);
  },

  randomCell: function () {
    var nodes = WORLD.cellNodes;
    if (!nodes.length) return;
    var node = nodes[Math.floor(Math.random() * nodes.length)];
    this.selectNode(node, false);
    this.flyTo(node.x, node.y, 1.05, 620);
  },

  markExplored: function (num) {
    if (this.explored[num]) return;
    this.explored[num] = 1;
    Store.set("worldExplored", this.explored);
    var elem = this.nodeEls["c" + num];
    if (elem) elem.classList.add("is-visited");
    this.updateProgress();
  },

  updateProgress: function () {
    var done = 0;
    WORLD.cellNodes.forEach(function (node) {
      if (WorldMap.explored[node.cell.num]) done++;
    });
    if (this.progressText) this.progressText.textContent = String(done);
    if (this.progressBar) {
      var pct = WORLD.stats.cells ? (done / WORLD.stats.cells) * 100 : 0;
      this.progressBar.style.width = pct.toFixed(1) + "%";
    }
  },

  resetProgress: function () {
    this.explored = {};
    Store.set("worldExplored", {});
    Object.keys(this.nodeEls).forEach(function (id) {
      this.nodeEls[id].classList.remove("is-visited");
    }, this);
    this.updateProgress();
    if (this.state.region) this.renderPanel();
  },

  /* ------------------------------------------------------------------ */
  /* Подсказка                                                           */
  /* ------------------------------------------------------------------ */

  showTooltip: function (node, e) {
    if (!this.tooltip) return;
    clear(this.tooltip);
    if (node.kind === "cell") {
      this.tooltip.appendChild(el("div", { class: "wt-title", text:
        "Клетка " + node.cell.num + " · " + node.table.name }));
      this.tooltip.appendChild(el("div", { class: "wt-meta", text:
        [timeDef(node.cell.time) && timeDef(node.cell.time).label,
          formDef(node.cell.form) && formDef(node.cell.form).label,
          node.cell.voice === "passive" ? "Passive" : "Active"].filter(Boolean).join(" · ") }));
      this.tooltip.appendChild(el("div", { class: "wt-text", text: templateText(node.cell.template) }));
    } else {
      this.tooltip.appendChild(el("div", { class: "wt-title", text: node.word }));
      this.tooltip.appendChild(el("div", { class: "wt-meta", text: node.column.title + " · " + node.column.role }));
      this.tooltip.appendChild(el("div", { class: "wt-text", text: "Столбец «" + node.column.title + "», строка " + (node.rowIndex + 1) }));
    }
    this.tooltip.classList.add("show");
    this.moveTooltip(e);
  },

  moveTooltip: function (e) {
    if (!this.tooltip || !this.shell) return;
    var r = this.shell.getBoundingClientRect();
    var tip = this.tooltip;
    var x = e.clientX - r.left + 16;
    var y = e.clientY - r.top + 16;
    var maxX = r.width - (tip.offsetWidth || 260) - 14;
    var maxY = r.height - (tip.offsetHeight || 90) - 14;
    tip.style.left = Math.max(10, Math.min(x, Math.max(10, maxX))) + "px";
    tip.style.top = Math.max(10, Math.min(y, Math.max(10, maxY))) + "px";
  },

  hideTooltip: function () {
    if (this.tooltip) this.tooltip.classList.remove("show");
  },

  /* ------------------------------------------------------------------ */
  /* Панель разбора                                                      */
  /* ------------------------------------------------------------------ */

  renderPanel: function () {
    if (!this.panel) return;
    if (!this.state.region) {
      this.shell.classList.remove("has-panel");
      return;
    }
    clear(this.panel);
    this.shell.classList.add("has-panel");

    var head = el("div", { class: "world-panel-head" });
    var close = el("button", {
      class: "world-panel-close",
      type: "button",
      text: "×",
      title: "Закрыть",
      onclick: function () { WorldMap.clearSelection(); }
    });

    if (this.state.node) {
      var node = this.state.node;
      var isCell = node.kind === "cell";
      head.appendChild(el("span", {
        class: "wp-badge" + (isCell ? "" : " pronoun"),
        text: isCell ? String(node.cell.num) : "Aa"
      }));
      head.appendChild(el("div", { class: "wp-head-text" }, [
        el("div", { class: "wp-title", text: isCell ? ("Клетка " + node.cell.num) : node.word }),
        el("div", { class: "wp-sub", text: "T" + node.table.num + " · " + node.table.name + " · " + node.region.epithet })
      ]));
      head.appendChild(close);
      this.panel.appendChild(head);

      var body = el("div", { class: "world-panel-body" });
      if (isCell) this.fillCellPanel(body, node);
      else this.fillPronounPanel(body, node);
      this.panel.appendChild(body);
    } else {
      var region = this.state.region;
      head.appendChild(el("span", { class: "wp-badge", text: "T" + region.table.num }));
      head.appendChild(el("div", { class: "wp-head-text" }, [
        el("div", { class: "wp-title", text: region.table.name }),
        el("div", { class: "wp-sub", text: region.epithet + " · " + region.table.subtitle })
      ]));
      head.appendChild(close);
      this.panel.appendChild(head);

      var rbody = el("div", { class: "world-panel-body" });
      this.fillRegionPanel(rbody, region);
      this.panel.appendChild(rbody);
    }

    this.panel.scrollTop = 0;
  },

  fillRegionPanel: function (body, region) {
    var self = this;
    var table = region.table;
    var cellNodes = region.nodes.filter(function (n) { return n.kind === "cell"; });
    var visited = cellNodes.filter(function (n) { return self.explored[n.cell.num]; }).length;

    body.appendChild(el("p", { class: "muted", text: table.description }));

    if (table.notes && table.notes.length) {
      var notes = el("ul", { class: "world-notes" });
      table.notes.forEach(function (n) { notes.appendChild(el("li", { text: n })); });
      body.appendChild(notes);
    }

    var facts = el("div", { class: "wp-facts" });
    facts.appendChild(this.fact("Клетки", cellNodes.length || "—"));
    facts.appendChild(this.fact("Залоги", (table.voices && table.voices.length) || 1));
    facts.appendChild(this.fact("Формы", table.kind === "pronouns" ? 5 : FORMS.filter(function (f) {
      return cellNodes.some(function (n) { return n.cell.form === f.key; });
    }).length));
    if (table.kind !== "pronouns") {
      facts.appendChild(this.fact("Времена", TIMES.filter(function (t) {
        return cellNodes.some(function (n) { return n.cell.time === t.key; });
      }).length));
    }
    body.appendChild(facts);

    if (cellNodes.length) {
      var progress = el("div", { class: "wp-region-progress" });
      progress.appendChild(el("div", { class: "wp-line" }, [
        el("span", { text: "Исследовано в земле: " }),
        el("strong", { text: visited + " / " + cellNodes.length })
      ]));
      var bar = el("div", { class: "wp-bar" });
      var fill = el("i");
      fill.style.width = (cellNodes.length ? (visited / cellNodes.length) * 100 : 0).toFixed(1) + "%";
      bar.appendChild(fill);
      progress.appendChild(bar);
      body.appendChild(progress);

      body.appendChild(el("h5", { class: "wp-section-title", text: "Адреса земли" }));

      var voices = (table.voices && table.voices.length) ? table.voices : ["active"];
      voices.forEach(function (voice) {
        var group = cellNodes.filter(function (n) { return (n.cell.voice || "active") === voice; });
        if (!group.length) return;
        if (voices.length > 1) {
          body.appendChild(el("div", { class: "wp-group-title", text: voice === "passive" ? "Passive · страдательный" : "Active · действительный" }));
        }
        var grid = el("div", { class: "wp-cell-grid" });
        group.sort(function (a, b) { return a.cell.num - b.cell.num; }).forEach(function (n) {
          var chip = el("button", {
            class: "wp-cell" + (self.explored[n.cell.num] ? " is-visited" : "") +
              (self.state.node && self.state.node.id === n.id ? " is-selected" : ""),
            type: "button",
            style: { "--c": COLORS[n.cell.colors[0]].hex },
            title: "Клетка " + n.cell.num + " · " + templateText(n.cell.template),
            text: String(n.cell.num),
            onclick: function () {
              self.selectNode(n, false);
              self.flyTo(n.x, n.y, Math.max(0.95, self.cam.k), 540);
            }
          });
          grid.appendChild(chip);
        });
        body.appendChild(grid);
      });
    } else if (table.kind === "pronouns") {
      body.appendChild(el("h5", { class: "wp-section-title", text: "Столбцы таблицы" }));
      var cols = el("div", { class: "wp-pronoun-cols" });
      table.columns.forEach(function (col) {
        var info = COLORS[col.color];
        cols.appendChild(el("div", { class: "wp-pronoun-col", style: { "--c": info.hex } }, [
          el("strong", { text: col.title }),
          el("span", { class: "muted small", text: col.role }),
          el("span", { class: "wp-pronoun-items", text: col.items.join(" · ") })
        ]));
      });
      body.appendChild(cols);
    }

    var actions = el("div", { class: "wp-actions" });
    actions.appendChild(el("button", {
      class: "btn primary small", type: "button", text: "Открыть таблицу",
      onclick: function () { WorldMap.openTable(table, null); }
    }));
    if (table.kind !== "pronouns") {
      actions.appendChild(el("button", {
        class: "btn small", type: "button", text: "Мастер по земле",
        onclick: function () { WorldMap.openWizard(table); }
      }));
      actions.appendChild(el("button", {
        class: "btn ghost small", type: "button", text: "Упражнения",
        onclick: function () { WorldMap.openGenerator(table, null); }
      }));
    }
    body.appendChild(actions);

    body.appendChild(el("button", {
      class: "btn ghost small wp-focus-btn", type: "button",
      text: "Приблизить землю",
      onclick: function () { WorldMap.focusRegion(region); }
    }));
  },

  fillCellPanel: function (body, node) {
    var self = this;
    var cell = node.cell;
    var table = node.table;
    var t = timeDef(cell.time);
    var f = formDef(cell.form);

    body.appendChild(el("p", { class: "wp-meta-line", text:
      [t && t.label, f && f.label, cell.voice === "passive" ? "Passive" : "Active"].filter(Boolean).join(" · ") }));

    body.appendChild(el("h5", { class: "wp-section-title", text: "Цветной шаблон" }));
    body.appendChild(renderTemplate(cell.template, "template-line"));

    var colors = el("div", { class: "chips wp-chips" });
    cell.colors.forEach(function (key) {
      var info = COLORS[key];
      colors.appendChild(el("span", { class: "chip", title: info.role }, [
        el("span", { class: "chip-dot", style: { background: info.hex } }),
        el("span", { text: info.short })
      ]));
    });
    body.appendChild(colors);

    body.appendChild(el("h5", { class: "wp-section-title", text: cell.kit ? "Пример из комплекта" : "Пример по шаблону" }));

    var example = el("div", { class: "example-en" }, [
      el("span", { text: cell.en }),
      el("button", {
        class: "btn tiny", type: "button", title: "Прослушать", text: "▶",
        onclick: function () { Speech.say(cell.en); }
      })
    ]);
    body.appendChild(example);
    if (cell.ru) body.appendChild(el("div", { class: "example-ru", text: cell.ru }));

    var actions = el("div", { class: "wp-actions" });
    actions.appendChild(el("button", {
      class: "btn primary small", type: "button", text: "Открыть в таблице",
      onclick: function () { WorldMap.openTable(table, cell); }
    }));
    actions.appendChild(el("button", {
      class: "btn small", type: "button", text: "Собрать в конструкторе",
      onclick: function () { openBuilder(table, cell); }
    }));
    actions.appendChild(el("button", {
      class: "btn ghost small", type: "button", text: "К упражнениям",
      onclick: function () { WorldMap.openGenerator(table, cell); }
    }));
    body.appendChild(actions);

    var status = el("div", { class: "wp-status" });
    status.appendChild(el("span", { class: "wp-status-dot" }));
    var justDiscovered = this._justDiscovered;
    this._justDiscovered = false;
    status.appendChild(el("span", { text: justDiscovered ? "Адрес впервые открыт" : "Адрес уже исследован" }));
    body.appendChild(status);

    body.appendChild(el("button", {
      class: "btn ghost small wp-back", type: "button",
      text: "← К земле " + table.name,
      onclick: function () { self.selectRegion(node.region); }
    }));
  },

  fillPronounPanel: function (body, node) {
    var self = this;
    var col = node.column;
    var info = COLORS[col.color];

    body.appendChild(el("p", { class: "muted", text:
      "Столбец «" + col.title + "» · " + col.role + ". Строка " + (node.rowIndex + 1) + " из 8." }));

    body.appendChild(el("div", { class: "wp-pronoun-hero", style: { "--c": info.hex } }, [
      el("strong", { text: node.word }),
      el("span", { text: col.title })
    ]));

    var row = el("div", { class: "wp-pronoun-row" });
    node.region.table.columns.forEach(function (c, i) {
      row.appendChild(el("div", {
        class: "wp-pronoun-pair" + (i === node.columnIndex ? " is-current" : ""),
        style: { "--c": COLORS[c.color].hex }
      }, [
        el("span", { class: "wp-pair-title", text: c.title }),
        el("strong", { text: c.items[node.rowIndex] })
      ]));
    });
    body.appendChild(row);

    var actions = el("div", { class: "wp-actions" });
    actions.appendChild(el("button", {
      class: "btn primary small", type: "button", text: "Открыть таблицу",
      onclick: function () { WorldMap.openTable(node.table, null); }
    }));
    actions.appendChild(el("button", {
      class: "btn ghost small", type: "button", text: "← К земле",
      onclick: function () { self.selectRegion(node.region); }
    }));
    body.appendChild(actions);
  },

  fact: function (label, value) {
    return el("div", { class: "wp-fact" }, [
      el("b", { text: String(value) }),
      el("span", { text: label })
    ]);
  },

  /* ------------------------------------------------------------------ */
  /* Переходы в другие разделы                                           */
  /* ------------------------------------------------------------------ */

  openTable: function (table, cell) {
    AppState.selectedTable = table.id;
    AppState.selectedCell = cell ? { table: table, cell: cell } : null;
    App.switchView("tables");
  },

  openWizard: function (table) {
    AppState.selectedTable = table.id;
    Wizard.reset();
    AppState.wizard.table = table.id;
    App.switchView("wizard");
  },

  openGenerator: function (table, cell) {
    Generator.setTable(table.id);
    if (cell) Generator.loadCell(cell.num);
    App.switchView("generator");
  }
};
