/**
 * Мелкие утилиты (без зависимостей).
 */

/** Создаёт DOM-элемент: el('div', {class:'x', dataset:{a:1}}, [child, 'text']) */
function el(tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k === "dataset") { Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; }); }
      else if (k === "style" && typeof v === "object") { Object.keys(v).forEach(function (s) { node.style[s] = v[s]; }); }
      else if (k.indexOf("on") === 0 && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    });
  }
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  if (children == null) return;
  if (!Array.isArray(children)) children = [children];
  children.forEach(function (ch) {
    if (ch == null || ch === false) return;
    if (typeof ch === "string" || typeof ch === "number") node.appendChild(document.createTextNode(String(ch)));
    else node.appendChild(ch);
  });
}

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

/** Экранирование HTML. */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Плавная прокрутка к элементу. */
function scrollToEl(node) {
  if (node && node.scrollIntoView) node.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Простое хранилище в localStorage (с защитой от ошибок). */
var Store = {
  get: function (key, fallback) {
    try {
      var v = localStorage.getItem("zaytsev:" + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set: function (key, value) {
    try { localStorage.setItem("zaytsev:" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
};

/** Задержка с debounce. */
function debounce(fn, ms) {
  var t = null;
  return function () {
    var args = arguments, ctx = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(ctx, args); }, ms || 200);
  };
}

/** Цветной чип-подпись (используется в легендах). */
function colorChip(colorKey, label) {
  var c = COLORS[colorKey];
  return el("span", { class: "chip chip-" + colorKey }, [
    el("span", { class: "chip-dot", style: { background: c.hex } }),
    el("span", { class: "chip-label", text: label || c.short })
  ]);
}
