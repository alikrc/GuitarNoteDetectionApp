// Tema (otomatik / açık / koyu) ve dil (Türkçe / İngilizce) seçimleri: ayarlar panelindeki iki parçalı düğme grubu.
// Tema <html data-theme> ile uygulanır (css/app.css açık ve koyu renkleri tanımlar); "otomatik" sistemin ayarını izler.
// Sayfa açılırken tema ve dil, index.html'in başındaki küçük betikle boyamadan önce ayarlanır.
const Prefs = (() => {
  // Dil ayarlar panelinde; tablet ve masaüstünde üst çubukta da tek dokunuşla değişir (#langbtn: öbür dilin kısaltması)
  const themeSeg = $("themeseg"), langSeg = $("langseg"), langBtn = $("langbtn");
  function labelLangBtn(){
    const other = getLang() === "tr" ? "en" : "tr";
    langBtn.textContent = other.toUpperCase();
    langBtn.setAttribute("lang", other);
    langBtn.setAttribute("aria-label", t("pref.langAria"));
  }
  function mark(seg, attr, v){
    seg.querySelectorAll("[role=radio]").forEach(b => {
      const on = b.dataset[attr] === v;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
  }
  function applyTheme(){
    if(settings.theme === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = settings.theme;
    mark(themeSeg, "theme", settings.theme);
    // Tarayıcı çubuğunun rengi seçili temaya uysun
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      const dark = settings.theme === "auto" ? /dark/.test(m.media) : settings.theme === "dark";
      m.setAttribute("content", dark ? "#0E1413" : "#ECEFEE");
    });
    Bus.emit("theme", settings.theme);
  }
  function setLanguage(lang){
    if(lang === getLang()) return;
    settings.lang = lang;
    store.set("lang", lang);
    setLang(lang);
    UiText.apply();
    mark(langSeg, "lang", lang); labelLangBtn();
    Bus.emit("lang", lang);
  }
  themeSeg.addEventListener("click", e => {
    const b = e.target.closest("[data-theme]"); if(!b) return;
    settings.theme = b.dataset.theme;
    store.set("theme", settings.theme);
    applyTheme();
  });
  langSeg.addEventListener("click", e => {
    const b = e.target.closest("[data-lang]"); if(b) setLanguage(b.dataset.lang);
  });
  langBtn.addEventListener("click", () => setLanguage(getLang() === "tr" ? "en" : "tr"));
  radioArrows(themeSeg); radioArrows(langSeg);
  // Otomatik temada sistem teması değişince çizimler (entonasyon izi) yeni renklerle yenilensin
  if(window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => Bus.emit("theme", settings.theme));
  mark(langSeg, "lang", getLang()); labelLangBtn(); applyTheme();
  return {};
})();
