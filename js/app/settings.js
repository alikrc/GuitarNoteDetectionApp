// Ayar çubuğu: çalgı, akort, diyapazon, hassasiyet. Değişince Bus ile duyurulur (range, a4, sens).
const SettingsBar = (() => {
  const a4In = $("a4"), sensIn = $("sens"), tuningIn = $("tuning"), instIn = $("instrument");
  a4In.value = settings.a4; sensIn.value = settings.sens;
  function fillOptions(){
    tuningIn.replaceChildren(...Object.keys(TUNINGS).map(k => new Option(L(TUNINGS[k], "name"), k)));
    instIn.replaceChildren(...Object.keys(INSTRUMENTS).map(k => new Option(L(INSTRUMENTS[k], "name"), k)));
    tuningIn.value = settings.tuning; instIn.value = settings.instrument;
  }
  fillOptions();

  function applyA4(v){
    v = Math.round(Math.min(450, Math.max(430, v))*2)/2;
    if(!isFinite(v)) v = 440;
    settings.a4 = v; a4In.value = v; setA4(v); store.set("a4", v);
    Mic.resetNote();
    Bus.emit("a4", v);
  }
  a4In.addEventListener("change", () => applyA4(parseFloat(a4In.value)));
  $("a4dn").addEventListener("click", () => applyA4(settings.a4 - 0.5));
  $("a4up").addEventListener("click", () => applyA4(settings.a4 + 0.5));

  tuningIn.addEventListener("change", () => {
    settings.tuning = tuningIn.value; store.set("tuning", settings.tuning);
    setTuning(settings.tuning);
    Bus.emit("stopall");
    Bus.emit("range", { tuning:true });
  });
  // Çalgı değişince perde sayısı (sap) ve tını değişir
  instIn.addEventListener("change", () => {
    settings.instrument = instIn.value; store.set("instrument", settings.instrument);
    setInstrument(settings.instrument);
    Bus.emit("stopall");
    Bus.emit("range", { instrument:true });
  });

  function applySens(s){
    settings.sens = s; store.set("sens", s);
    $("lvthr").style.left = Mic.dbPos(sensitivityToRms(s)) + "%";
  }
  sensIn.addEventListener("input", () => applySens(+sensIn.value));
  applySens(settings.sens);

  // Ayarlar telefonda alttan açılan, geniş ekranda sağdan kayan bir panelde (#settings). Üst çubuktaki düğme
  // geniş ekranda seçili çalgı ve akortu özetler. Panel açıkken uygulamanın geri kalanı etkisizdir (Layer, modal).
  const drawer = $("settings"), setBtn = $("setbtn"), sumEl = $("setsum");
  function summary(){
    sumEl.textContent = L(INSTRUMENTS[settings.instrument], "short") + " · " + L(TUNINGS[settings.tuning], "name").split(" · ")[0] +
      (settings.a4 !== 440 ? " · " + pcName(9) + " " + settings.a4 : "");
  }
  function close(){
    if(drawer.hidden) return;
    drawer.hidden = true;
    setBtn.setAttribute("aria-expanded", "false");
    Layer.done(close);
    setBtn.focus();
  }
  function open(){
    drawer.hidden = false;
    setBtn.setAttribute("aria-expanded", "true");
    Layer.open(close, { modal:true, el: drawer });
    $("setclose").focus();
  }
  setBtn.addEventListener("click", () => drawer.hidden ? open() : close());
  $("setclose").addEventListener("click", close);
  Bus.on("range", summary); Bus.on("a4", summary);
  Bus.on("lang", () => { fillOptions(); summary(); });
  // Titreşim: yalnızca destekleyen cihazlarda gösterilir
  const vib = $("vibrate");
  $("vibrow").hidden = !("vibrate" in navigator);
  vib.checked = settings.vibrate;
  vib.addEventListener("change", () => { settings.vibrate = vib.checked; store.set("vibrate", vib.checked); buzz(30); });
  summary();
  return { open, close };
})();
