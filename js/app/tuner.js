// Akort sekmesi: altı tel, ibre, "sık / gevşet" talimatı, referans sesi. Altı tel de akortlu olunca ders olayı yayılır.
const Tuner = (() => {
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
    $("tuningname").textContent = TUNINGS[getTuning()].name;
    stringsEl.replaceChildren();
    for(let s = 6; s >= 1; s--){
      const b = document.createElement("button");
      b.type = "button"; b.dataset.s = s;
      b.innerHTML = noteName(stringOpen(s)).tr + "<small>" + s + ". tel</small>";
      b.setAttribute("aria-pressed", selected === s ? "true" : "false");
      b.classList.toggle("tuned", tuned.has(s));
      b.setAttribute("aria-label", s + ". tel, " + noteName(stringOpen(s)).tr + (tuned.has(s) ? ", akortlu" : ""));
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
    adviceEl.textContent = s + ". tel referans sesi: " + noteName(stringOpen(s)).tr + " (" + midiToFreq(stringOpen(s)).toFixed(1).replace(".", ",") + " Hz)";
    adviceEl.className = "tadvice";
  });
  micBtn.addEventListener("click", () => Mic.running ? Mic.stop() : Mic.start());
  Bus.on("mic", on => { micBtn.textContent = on ? "Mikrofonu durdur" : "Mikrofonu başlat"; micBtn.classList.toggle("listening", on); });

  Bus.on("frame", ({ d, now }) => {
    if(Tabs.current !== "akort") return;
    if(!(d.freq > 0)){ fh.length = 0; goodSince = null; return; }
    fh.push(d.freq); if(fh.length > 5) fh.shift();
    const f = median(fh), rd = tunerReading(f, selected);
    // Otomatik modda en yakın tel bile çok uzaksa (bir yarım sesten fazla) yanlış tele bakıyor olabiliriz
    const far = Math.abs(rd.cents) > 100;
    noteEl.textContent = rd.string + ". tel · " + noteName(rd.target).tr;
    centsEl.textContent = far ? "" : (rd.cents > 0 ? "+" : rd.cents < 0 ? "−" : "±") + Math.abs(rd.cents) + " sent";
    centsEl.className = "tcents " + (rd.advice === "tamam" ? "good" : "bad");
    freqEl.textContent = f.toFixed(1).replace(".", ",") + " Hz · hedef " + midiToFreq(rd.target).toFixed(1).replace(".", ",") + " Hz";
    needle.style.left = Math.max(0, Math.min(100, 50 + rd.cents)) + "%";
    needle.classList.toggle("good", rd.advice === "tamam");
    [...stringsEl.children].forEach(b => b.classList.toggle("hear", +b.dataset.s === rd.string));
    if(far){
      adviceEl.textContent = "Çok uzak: duyulan " + noteName(Math.round(freqToMidi(f))).tr + ". Doğru teli çaldığından emin ol" +
        (selected ? " ya da “Teli kendisi bulsun”u aç." : ".");
      adviceEl.className = "tadvice bad"; goodSince = null; return;
    }
    if(rd.advice === "tamam"){
      adviceEl.textContent = "✓ " + rd.string + ". tel akortlu";
      adviceEl.className = "tadvice good";
      if(goodString !== rd.string){ goodString = rd.string; goodSince = now; }
      // 0,8 saniye boyunca akortlu kalınca ✓ işaretlenir
      if(now - goodSince > 800 && !tuned.has(rd.string)){ tuned.add(rd.string); build(); checkAll(); }
    }else{
      adviceEl.textContent = rd.advice === "sık"
        ? "Ses pes (" + Math.abs(rd.cents) + " sent): burguyu sık ↑"
        : "Ses tiz (" + rd.cents + " sent): burguyu gevşet ↓";
      adviceEl.className = "tadvice bad";
      goodSince = null; goodString = null;
      if(Math.abs(rd.cents) > 10 && tuned.has(rd.string)){ tuned.delete(rd.string); build(); }
    }
  });
  function checkAll(){
    if(tuned.size === 6 && !announced){
      announced = true;
      toast("Altı tel de akortlu ✓");
      Bus.emit("achieve", { type:"tuned" });
    }
  }
  Bus.on("range", () => { tuned.clear(); announced = false; build(); });
  Bus.on("a4", () => { tuned.clear(); announced = false; build(); });
  build();
  return { open(){ /* sekme açılınca kendiliğinden dinler */ } };
})();
