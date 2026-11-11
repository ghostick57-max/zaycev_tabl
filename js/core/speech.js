/**
 * Озвучка английских предложений через SpeechSynthesis API (опционально).
 */
const Speech = {
  supported: typeof window !== "undefined" && "speechSynthesis" in window,

  /** Произносит текст по-английски. */
  say: function (text, lang) {
    if (!this.supported || !AppState.speechEnabled || !text) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang || "en-US";
      u.rate = 0.9;
      u.pitch = 1;
      var voices = window.speechSynthesis.getVoices();
      for (var i = 0; i < voices.length; i++) {
        if (/^en(-|$)/i.test(voices[i].lang)) { u.voice = voices[i]; break; }
      }
      window.speechSynthesis.speak(u);
    } catch (e) { /* тихо игнорируем */ }
  },

  /** Переключает озвучку и запоминает выбор. */
  toggle: function () {
    AppState.speechEnabled = !AppState.speechEnabled;
    Store.set("speech", AppState.speechEnabled);
    if (!AppState.speechEnabled && this.supported) window.speechSynthesis.cancel();
    return AppState.speechEnabled;
  }
};

// Некоторые браузеры подгружают голоса асинхронно — прогреваем список.
if (Speech.supported) {
  try { window.speechSynthesis.getVoices(); } catch (e) { /* ignore */ }
}
