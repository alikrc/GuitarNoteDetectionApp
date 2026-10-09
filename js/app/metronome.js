// Metronom: her sekmede açık kalabilen küçük panel. Tıklar ses saatine göre ileriye dönük zamanlanır (ritim motoruyla aynı yöntem).
// Tık sesi dar bantlı ve tiz olduğu için mikrofon dinlerken de çalışır; vuruş yakalayıcı onu yok sayar.
// Esc, sekme arka plana geçişi ve ritim/şarkı çalma (kendi metronomları var) bunu durdurur: Bus "stopall" { all:true }.
const Metronome = (() => {
  const panel = $("metro"), toggle = $("metrobtn"), runBtn = $("mrun"), bpmIn = $("mbpm"), bpmVal = $("mbpmv"),
        beatsEl = $("mbeats"), accentIn = $("maccent"), dotsEl = $("mdots"), tapBtn = $("mtap");
  let bpm = Math.round(Math.min(220, Math.max(30, +store.get("mBpm", 80) || 80)));
  let beats = Math.min(9, Math.max(1, +store.get("mBeats", 4) || 4));
  let run = null;            // { t0, next, timer, raf }
  const taps = [];

  defStr({
    "metro.noAccent": { tr:"vurgusuz", en:"no accent" },
    "metro.beats":    { tr:"{n} vuruş", en:"{n} beats" },
    "metro.start":    { tr:"Başlat", en:"Start" },
    "metro.stop":     { tr:"Durdur", en:"Stop" }
  });
  function fillBeats(){
    beatsEl.replaceChildren(...[1,2,3,4,5,6,7,9].map(n => new Option(n === 1 ? t("metro.noAccent") : t("metro.beats", { n }), n)));
    beatsEl.value = beats;
  }
  fillBeats();
  Bus.on("lang", () => { fillBeats(); runBtn.textContent = t(run ? "metro.stop" : "metro.start"); });
  beatsEl.value = beats; accentIn.checked = store.get("mAccent", true);
  function setBpm(v){
    bpm = Math.round(Math.min(220, Math.max(30, v)));
    bpmIn.value = bpm; bpmVal.textContent = bpm; store.set("mBpm", bpm);
    if(run) restart();
  }
  function drawDots(){
    dotsEl.replaceChildren(...Array.from({ length: beats }, (_, i) => {
      const d = document.createElement("i"); if(i === 0 && accentIn.checked && beats > 1) d.className = "acc"; return d;
    }));
  }
  bpmIn.addEventListener("input", () => setBpm(+bpmIn.value));
  $("mdn").addEventListener("click", () => setBpm(bpm - 1));
  $("mup").addEventListener("click", () => setBpm(bpm + 1));
  beatsEl.addEventListener("change", () => { beats = +beatsEl.value; store.set("mBeats", beats); drawDots(); if(run) restart(); });
  accentIn.addEventListener("change", () => { store.set("mAccent", accentIn.checked); drawDots(); });
  tapBtn.addEventListener("click", () => {
    const now = performance.now();
    taps.push(now); while(taps.length > 8) taps.shift();
    const b = tapTempo(taps);
    if(b) setBpm(b);
  });

  function start(){
    Bus.emit("stopall", { all:true, keep:"metronome" });     // ritim motoru kendi tıklarını çalmasın
    const a = Snd.ctx();
    run = { t0: a.currentTime + 0.1, next: 0 };
    run.timer = setInterval(schedule, 25); schedule();
    run.raf = requestAnimationFrame(frame);
    runBtn.textContent = t("metro.stop"); runBtn.classList.add("listening");
    toggle.classList.add("on");
  }
  function stop(){
    if(!run) return;
    clearInterval(run.timer); cancelAnimationFrame(run.raf); run = null;
    runBtn.textContent = t("metro.start"); runBtn.classList.remove("listening");
    toggle.classList.remove("on", "beat");
    [...dotsEl.children].forEach(d => d.classList.remove("now"));
  }
  function restart(){ stop(); start(); }
  function schedule(){
    const a = Snd.ctx(), dt = 60 / bpm;
    while(run.t0 + run.next*dt < a.currentTime + 0.15){
      const i = run.next % beats;
      Snd.click(run.t0 + run.next*dt, i === 0 && accentIn.checked && beats > 1);
      run.next++;
    }
  }
  function frame(){
    if(!run) return;
    run.raf = requestAnimationFrame(frame);
    const a = Snd.ctx(), k = Math.floor((a.currentTime - (a.outputLatency || 0) - run.t0) / (60 / bpm));
    [...dotsEl.children].forEach((d, i) => d.classList.toggle("now", k >= 0 && i === k % beats));
    toggle.classList.toggle("beat", k >= 0 && (a.currentTime - (a.outputLatency || 0) - run.t0) % (60 / bpm) < 0.1);
  }
  runBtn.addEventListener("click", () => run ? stop() : start());
  // Panel üst çubuktaki düğmeyle açılıp kapanır; kapatınca metronom çalmaya devam eder (düğme vuruşta yanıp söner)
  function setOpen(open){
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    store.set("mOpen", open);
  }
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  $("mclose").addEventListener("click", () => { setOpen(false); toggle.focus(); });
  Bus.on("stopall", ev => { if(ev && ev.all && ev.keep !== "metronome") stop(); });

  setOpen(store.get("mOpen", false));
  bpmIn.value = bpm; bpmVal.textContent = bpm; drawDots();
  runBtn.textContent = t("metro.start");
  return { start, stop, get running(){ return !!run; } };
})();
