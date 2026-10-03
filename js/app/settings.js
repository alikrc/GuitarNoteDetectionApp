// Ayar çubuğu: çalgı, akort, diyapazon, hassasiyet. Değişince Bus ile duyurulur (range, a4, sens).
const SettingsBar = (() => {
  const a4In = $("a4"), sensIn = $("sens"), tuningIn = $("tuning"), instIn = $("instrument");
  a4In.value = settings.a4; sensIn.value = settings.sens;
  for(const k in TUNINGS) tuningIn.appendChild(new Option(TUNINGS[k].name, k));
  for(const k in INSTRUMENTS) instIn.appendChild(new Option(INSTRUMENTS[k].name, k));
  tuningIn.value = settings.tuning; instIn.value = settings.instrument;

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
  return {};
})();
