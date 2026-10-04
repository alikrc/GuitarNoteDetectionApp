// Tema (otomatik / açık / koyu) ve dil (Türkçe / İngilizce) düğmeleri.
// Tema <html data-theme> ile uygulanır (css/app.css açık ve koyu renkleri tanımlar); "otomatik" sistemin ayarını izler.
// Sayfa açılırken tema ve dil, index.html'in başındaki küçük betikle boyamadan önce ayarlanır.
const Prefs = (() => {
  const langBtn = $("langbtn"), themeBtn = $("themebtn");
  const THEMES = ["auto", "light", "dark"];
  function applyTheme(){
    if(settings.theme === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = settings.theme;
    themeBtn.textContent = t("pref.theme." + settings.theme);
    themeBtn.setAttribute("aria-label", t("pref.themeAria"));
    Bus.emit("theme", settings.theme);
  }
  function applyLangButton(){
    langBtn.textContent = t("pref.lang");
    langBtn.setAttribute("aria-label", t("pref.langAria"));
    langBtn.setAttribute("lang", getLang() === "tr" ? "en" : "tr");      // düğme diğer dilin adını o dilde yazar
  }
  themeBtn.addEventListener("click", () => {
    settings.theme = THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length];
    store.set("theme", settings.theme);
    applyTheme();
  });
  langBtn.addEventListener("click", () => {
    settings.lang = getLang() === "tr" ? "en" : "tr";
    store.set("lang", settings.lang);
    setLang(settings.lang);
    UiText.apply();
    applyLangButton(); applyTheme();
    Bus.emit("lang", settings.lang);
  });
  // Otomatik temada sistem teması değişince çizimler (entonasyon izi) yeni renklerle yenilensin
  if(window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => Bus.emit("theme", settings.theme));
  applyLangButton(); applyTheme();
  return {};
})();
