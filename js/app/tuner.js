// Akort sekmesi: altı tel, ibre, "sık / gevşet" talimatı, referans sesi. Altı tel de akortlu olunca ders olayı yayılır.
const Tuner = (() => {
  defStr({
    "tuner.string":   { tr:"{s}. tel", en:"string {s}" },
    "tuner.stringAria": { tr:"{s}. tel, {note}", en:"string {s}, {note}" },
    "tuner.tunedAria": { tr:", akortlu", en:", in tune" },
    "tuner.ref":      { tr:"{s}. tel referans sesi: {note} ({hz} Hz)", en:"String {s} reference: {note} ({hz} Hz)" },
    "tuner.cents":    { tr:"{v} sent", en:"{v} cents" },
    "tuner.freq":     { tr:"{f} Hz · hedef {t} Hz", en:"{f} Hz · target {t} Hz" },
    "tuner.far":      { tr:"Çok uzak: duyulan {note}. Doğru teli çaldığından emin ol.", en:"Too far: heard {note}. Make sure you're playing the right string." },
    "tuner.farSel":   { tr:"Çok uzak: duyulan {note}. Doğru teli çaldığından emin ol ya da “Teli kendisi bulsun”u aç.",
                        en:"Too far: heard {note}. Make sure you're playing the right string, or turn on “Detect the string”." },
    "tuner.ok":       { tr:"✓ {s}. tel akortlu", en:"✓ string {s} is in tune" },
    "tuner.low":      { tr:"Ses pes ({c} sent): burguyu sık ↑", en:"Too low ({c} cents): tighten the peg ↑" },
    "tuner.high":     { tr:"Ses tiz ({c} sent): burguyu gevşet ↓", en:"Too high ({c} cents): loosen the peg ↓" },
    "tuner.all":      { tr:"Altı tel de akortlu ✓", en:"All six strings in tune ✓" },
    "tuner.play":     { tr:"Bir tel çal.", en:"Play a string." }
  });
  const stringsEl = $("tstrings"), autoIn = $("tauto"), noteEl = $("tnote"), centsEl = $("tcents"), freqEl = $("tfreq"),
        adviceEl = $("tadvice"), track = $("ttrack"), needle = $("tneedle"), micBtn = $("tmic");
  let selected = null;                 // elle seçilen tel (otomatik kapalıyken)
  const tuned = new Set();             // akortlu bulunan teller
  let goodSince = null, goodString = null, announced = false;
  const fh = [];                       // son frekanslar: ortanca ile titreme azalır

  // Ölçek: ±50 sent, ±5 sent yeşil bölge (sap sekmesindeki gösterge ile aynı çizim)
  (function scale(){
    const zone = document.createElement("div"); zone.className = "zone";
    zone.style.left = "45%"; zone.style.width = "10%";
    track.insertBefore(zone, needle);
    for(const v of [-50,-25,0,25,50]){
      const pos = 50 + v; const t = document.createElement("div");
      t.className = "tick" + (v===0 ? " mid" : ""); t.style.left = pos + "%";
      const l = document.createElement("div"); l.className = "ticklab"; l.style.left = Math.min(94, Math.max(6, pos)) + "%";
      l.textContent = (v>0 ? "+" : v<0 ? "−" : "") + Math.abs(v);
      track.insertBefore(t, needle); track.insertBefore(l, needle);
    }
  })();

  function build(){
    $("tuningname").textContent = L(TUNINGS[getTuning()], "name");
    stringsEl.replaceChildren();
    for(let s = 6; s >= 1; s--){
      const b = document.createElement("button");
      b.type = "button"; b.dataset.s = s;
      b.innerHTML = noteLabel(stringOpen(s)) + "<small>" + t("tuner.string", { s }) + "</small>";
      b.setAttribute("aria-pressed", selected === s ? "true" : "false");
      b.classList.toggle("tuned", tuned.has(s));
      b.setAttribute("aria-label", t("tuner.stringAria", { s, note: noteLabel(stringOpen(s)) }) + (tuned.has(s) ? t("tuner.tunedAria") : ""));
      b.addEventListener("click", () => {
        selected = selected === s ? null : s;
        autoIn.checked = selected === null;
        build();
      });
      stringsEl.appendChild(b);
    }
  }
  autoIn.addEventListener("change", () => { if(autoIn.checked) selected = null; else if(selected === null) selected = 6; build(); });
  $("tref").addEventListener("click", () => {
    const s = selected ?? goodString ?? 6;
    Bus.emit("stopall");
    Snd.pluck(midiToFreq(stringOpen(s)), Snd.ctx().currentTime, 0.32);
    adviceEl.textContent = t("tuner.ref", { s, note: noteLabel(stringOpen(s)), hz: num(midiToFreq(stringOpen(s))) });
    adviceEl.className = "tadvice";
  });
  micBtn.addEventListener("click", () => Mic.running ? Mic.stop() : Mic.start());
  Bus.on("mic", on => { micBtn.textContent = t(on ? "mic.stop" : "mic.start"); micBtn.classList.toggle("listening", on); });
  Bus.on("lang", () => { micBtn.textContent = t(Mic.running ? "mic.stop" : "mic.start"); build(); if(!goodString) { adviceEl.textContent = t("tuner.play"); } });

  Bus.on("frame", ({ d, now }) => {
    if(Tabs.current !== "akort") return;
    if(!(d.freq > 0)){ fh.length = 0; goodSince = null; return; }
    fh.push(d.freq); if(fh.length > 5) fh.shift();
    const f = median(fh), rd = tunerReading(f, selected);
    // Otomatik modda en yakın tel bile çok uzaksa (bir yarım sesten fazla) yanlış tele bakıyor olabiliriz
    const far = Math.abs(rd.cents) > 100;
    noteEl.textContent = t("tuner.string", { s: rd.string }) + " · " + noteLabel(rd.target);
    centsEl.textContent = far ? "" : t("tuner.cents", { v: (rd.cents > 0 ? "+" : rd.cents < 0 ? "−" : "±") + Math.abs(rd.cents) });
    centsEl.className = "tcents " + (rd.advice === "tamam" ? "good" : "bad");
    freqEl.textContent = t("tuner.freq", { f: num(f), t: num(midiToFreq(rd.target)) });
    needle.style.left = Math.max(0, Math.min(100, 50 + rd.cents)) + "%";
    needle.classList.toggle("good", rd.advice === "tamam");
    [...stringsEl.children].forEach(b => b.classList.toggle("hear", +b.dataset.s === rd.string));
    if(far){
      adviceEl.textContent = t(selected ? "tuner.farSel" : "tuner.far", { note: noteLabel(Math.round(freqToMidi(f))) });
      adviceEl.className = "tadvice bad"; goodSince = null; return;
    }
    if(rd.advice === "tamam"){
      adviceEl.textContent = t("tuner.ok", { s: rd.string });
      adviceEl.className = "tadvice good";
      if(goodString !== rd.string){ goodString = rd.string; goodSince = now; }
      // 0,8 saniye boyunca akortlu kalınca ✓ işaretlenir
      if(now - goodSince > 800 && !tuned.has(rd.string)){ tuned.add(rd.string); build(); checkAll(); }
    }else{
      adviceEl.textContent = rd.advice === "sık" ? t("tuner.low", { c: Math.abs(rd.cents) }) : t("tuner.high", { c: rd.cents });
      adviceEl.className = "tadvice bad";
      goodSince = null; goodString = null;
      if(Math.abs(rd.cents) > 10 && tuned.has(rd.string)){ tuned.delete(rd.string); build(); }
    }
  });
  function checkAll(){
    if(tuned.size === 6 && !announced){
      announced = true;
      toast(t("tuner.all"));
      Bus.emit("achieve", { type:"tuned" });
    }
  }
  Bus.on("range", () => { tuned.clear(); announced = false; build(); });
  Bus.on("a4", () => { tuned.clear(); announced = false; build(); });
  build();
  micBtn.textContent = t("mic.start"); adviceEl.textContent = t("tuner.play");
  return { open(){ /* sekme açılınca kendiliğinden dinler */ } };
})();
