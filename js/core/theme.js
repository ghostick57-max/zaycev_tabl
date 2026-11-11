/**
 * Тёмная тема (macOS). Переключатель в dock, выбор сохраняется в localStorage.
 * Селектор `data-theme="dark"` вешается на <html>.
 */

const Theme = {
  KEY: "zaytsev:theme",

  get current() {
    return (document.documentElement.getAttribute("data-theme") || "light");
  },

  init: function () {
    var saved = Store.get(this.KEY, null);
    if (saved == null) {
      // Первый запуск: подстраиваемся под системную тему.
      saved = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
      Store.set(this.KEY, saved);
    }
    if (saved !== "light" && saved !== "dark") saved = "light";
    this.set(saved, false);
  },

  set: function (mode, persist) {
    document.documentElement.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
    if (persist !== false) Store.set(this.KEY, mode === "dark" ? "dark" : "light");
    this.syncButton();
  },

  toggle: function () {
    this.set(this.current === "dark" ? "light" : "dark", true);
    return this.current;
  },

  /** Оформляет кнопку темы в dock. */
  syncButton: function () {
    var btn = $("#theme-toggle");
    if (!btn) return;
    var dark = this.current === "dark";
    btn.textContent = dark ? "☀️" : "🌙";
    btn.title = dark ? "Светлая тема" : "Тёмная тема";
  }
};