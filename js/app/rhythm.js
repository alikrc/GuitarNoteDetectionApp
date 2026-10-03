// Ritim: vuruş kalıbı çalma motoru (Ritim ve Şarkılar sekmeleri ortak kullanır) ve Ritim sekmesinin arayüzü.
// Motor: metronom ve vuruşları ses saatine göre ileriye dönük zamanlar; "play" modunda mikrofondan vuruşları
// yakalar, her ölçüyü puanlar. Gecikme ölçümü ve ayarı da burada.
const Rhythm = (() => {
  // ---- Gecikme: mikrofon + hoparlör. Ölçülmediyse kaba tahmin ----
  let latency = store.get("latency", null);
  const estLatency = () => { const a = Snd.ctx(); return (a.outputLatency || 0) + (a.baseLatency || 0) + 0.02; };
  const curLatency = () => latency !== null ? latency : estLatency();

  // ---- Motor ----
  let rs = null;
  // opts: { mode: "demo" | "play", rhythm, bpm, chordAt(bar), maxBars?, click (bool), onSlot(k), onBar(bar),
  //         onEval(res, bar), onEnd(), countIn (bool) }
  async function start(opts){
    Bus.emit("stopall");
    if(opts.mode === "play" && !Mic.running && !(await Mic.start())) return false;
    const a = Snd.ctx(), r = opts.rhythm, n = r.slots.length, dt = slotDur(opts.bpm);
    const countIn = opts.mode === "play" || opts.countIn ? n : 0;
    rs = { ...opts, n, dt, t0: a.currentTime + 0.12 + countIn*dt, next: -countIn, timeouts: [], onsets: [],
           evalBar: 0, voices: [], ended: false };
    if(opts.mode === "play") rs.unsub = Mic.onOnset(t => rs && rs.onsets.push(t));
    rs.timer = setInterval(schedule, 25); schedule();
    rs.raf = requestAnimationFrame(frame);
    return true;
  }
  function stop(){
    if(!rs) return;
    const s = rs; rs = null;
    clearInterval(s.timer); cancelAnimationFrame(s.raf); s.timeouts.forEach(clearTimeout);
    s.voices.forEach(v => Snd.fadeOut(v));
    if(s.unsub) s.unsub();
    if(s.onStop) s.onStop();
  }
  // Vuruş: aşağı = kalından inceye tüm çalınan teller, yukarı = inceden kalına ince 4 tel, daha hafif.
  // Yeni vuruş önceki vuruşun tellerini susturur (gerçekte de pena teli yeniden başlatır).
  function strumAt(t, down, accent, c){
    rs.voices.forEach(v => Snd.fadeOut(v, t));
    const strs = Chords.voicing(c).filter(x => !x.muted).map(x => x.midi);
    const list = down ? strs : strs.slice(-4).reverse();
    const amp = (down ? 0.12 : 0.075) * (accent === 2 ? 1.35 : accent === 1 ? 1.15 : 1);
    rs.voices = Snd.strum(list, t, down ? 0.012 : 0.009, amp);
  }
  // İleriye dönük zamanlama: 150 ms içindeki hücreler ses saatine göre şimdiden kurulur
  function schedule(){
    const a = Snd.ctx(), { n, dt } = rs, r = rs.rhythm;
    while(rs.t0 + rs.next*dt < a.currentTime + 0.15){
      const k = rs.next, t = rs.t0 + k*dt, i = ((k % n) + n) % n, bar = Math.floor(k / n);
      if(rs.maxBars && bar >= rs.maxBars){
        if(!rs.ended){
          rs.ended = true;
          const s = rs;
          rs.timeouts.push(setTimeout(() => { if(rs === s){ finishEval(); const f = s.onEnd; stop(); if(f) f(); } },
            (t - a.currentTime + curLatency() + 0.4)*1000));
        }
        break;
      }
      if(r.beats.includes(i) && (rs.click || bar < 0)) Snd.click(t, i === 0);
      if(bar >= 0 && r.slots[i] !== "-" && rs.mode === "demo") strumAt(t, r.slots[i] === "D", r.accents[i] || 0, rs.chordAt(bar));
      if(bar >= 0 && i === 0 && rs.onBar){
        const s = rs, b = bar;
        rs.timeouts.push(setTimeout(() => { if(rs === s) s.onBar(b); }, Math.max(0, (t - a.currentTime)*1000)));
      }
      rs.next++;
    }
  }
  function frame(){
    if(!rs) return;
    rs.raf = requestAnimationFrame(frame);
    const a = Snd.ctx(), { n, dt } = rs;
    const k = Math.floor((a.currentTime - (a.outputLatency || 0) - rs.t0) / dt);
    if(rs.onSlot) rs.onSlot(k);
    if(rs.mode === "play"){
      const lat = curLatency();
      while(a.currentTime > rs.t0 + (rs.evalBar + 1)*n*dt + dt/2 + lat + 0.05 && (!rs.maxBars || rs.evalBar < rs.maxBars))
        evalBar(rs.evalBar++, lat);
    }
  }
  function finishEval(){
    if(!rs || rs.mode !== "play") return;
    const lat = curLatency();
    while(rs.evalBar < rs.maxBars) evalBar(rs.evalBar++, lat);
  }
  // Bir ölçüyü puanla: yakalanan vuruşlardan gecikme çıkarılır, beklenen vuruşlarla eşlenir
  function evalBar(b, lat){
    const { n, dt } = rs, start = rs.t0 + b*n*dt;
    const expected = rhythmBar(rs.rhythm, rs.bpm, start);
    const ons = rs.onsets.map(t => t - lat).filter(t => t >= start - dt/2 && t < start + n*dt - dt/2);
    const res = scoreTiming(expected, ons, dt, Math.min(0.04, dt*0.3));
    if(rs.onEval) rs.onEval(res, b, start);
  }

  // ---- Ritim sekmesi arayüzü ----
  const rlistEl=$("rlist"), rgridEl=$("rgrid"), rnameEl=$("rname"), rmeterEl=$("rmeter"), rdescEl=$("rdesc"),
        bpmIn=$("bpm"), bpmVal=$("bpmv"), rclickIn=$("rclick"), rsrcSel=$("rsrc"), rresEl=$("rresult"), rnowEl=$("rnow"),
        rstopBtn=$("rstop"), RRES_HINT = rresEl.innerHTML;
  const ARROW = { D:"↓", U:"↑", "-":"·" };
  let rhythm = rhythmById(store.get("rhythm", "pop")) || rhythmById("pop");
  let bpm = Math.round(Math.min(160, Math.max(40, +store.get("bpm", 80) || 80)));
  let mine = false, results = [], calib = null;       // mine: motor şu an bu sekme için mi çalışıyor
  rclickIn.checked = store.get("rclick", true);
  bpmIn.value = bpm; bpmVal.textContent = bpm;

  rsrcSel.appendChild(new Option("Seçili akor (Akorlar sekmesi)", "sel"));
  Chords.PROGS.forEach((p, i) => rsrcSel.appendChild(new Option("Diziliş: " + p.join(" – ") + " (ölçü başına bir akor)", "p" + i)));
  rsrcSel.value = store.get("rsrc", "sel");
  if(rsrcSel.selectedIndex < 0) rsrcSel.value = "sel";
  rsrcSel.addEventListener("change", () => { store.set("rsrc", rsrcSel.value); restartIfPlaying(); });
  const chordForBar = b => {
    if(rsrcSel.value === "sel") return Chords.current;
    const p = Chords.PROGS[+rsrcSel.value.slice(1)];
    return chordBySymbol(p[((b % p.length) + p.length) % p.length]);
  };

  function buildRhythmList(){
    rlistEl.replaceChildren(...RHYTHMS.map(r => {
      const b = radioBtn(r.name + " · " + r.meter.split(" ")[0], r === rhythm, () => selectRhythm(r));
      b.setAttribute("aria-label", r.name + ", " + r.meter);
      return b;
    }));
  }
  radioArrows(rlistEl);
  function selectRhythm(r){
    rhythm = r; store.set("rhythm", r.id);
    buildRhythmList(); drawRhythm(); restartIfPlaying();
  }
  function drawRhythm(){
    const r = rhythm;
    rnameEl.textContent = r.name; rmeterEl.textContent = r.meter;
    rdescEl.textContent = r.desc;
    rgridEl.style.gridTemplateColumns = "repeat(" + r.slots.length + ", minmax(0, 1fr))";
    rgridEl.replaceChildren(...[...r.slots].map((ch, i) => {
      const c = document.createElement("div");
      c.className = "rcell" + (ch === "-" ? " rest" : "") + (r.accents[i] ? " acc" + r.accents[i] : "") +
                    (i > 0 && r.beats.includes(i) ? " gstart" : "");
      c.innerHTML = '<span class="rcount">' + r.counts[i] + '</span><span class="rarrow">' + ARROW[ch] + '</span><span class="rmark"></span>';
      return c;
    }));
    rgridEl.setAttribute("aria-label", r.name + " kalıbı: " + [...r.slots].map((ch, i) =>
      r.counts[i] + " " + (ch === "D" ? "aşağı" : ch === "U" ? "yukarı" : "boş")).join(", "));
  }
  function setBpm(v){
    bpm = Math.round(Math.min(160, Math.max(40, v)));
    bpmIn.value = bpm; bpmVal.textContent = bpm; store.set("bpm", bpm);
  }
  bpmIn.addEventListener("input", () => setBpm(+bpmIn.value));
  bpmIn.addEventListener("change", restartIfPlaying);
  $("bpmdn").addEventListener("click", () => { setBpm(bpm - 5); restartIfPlaying(); });
  $("bpmup").addEventListener("click", () => { setBpm(bpm + 5); restartIfPlaying(); });
  rclickIn.addEventListener("change", () => store.set("rclick", rclickIn.checked));

  function clearMarks(){ [...rgridEl.children].forEach(c => { c.classList.remove("now"); const m = c.querySelector(".rmark"); m.textContent = ""; m.className = "rmark"; }); }
  function restartIfPlaying(){ if(mine && rs) cardStart(rs.mode); }
  async function cardStart(mode){
    clearMarks(); results = [];
    if(mode === "play") rresEl.innerHTML = "Bir ölçü sayıyorum, sonra çal." + (latency === null
      ? ' <span class="warn">Gecikme ölçülmedi; sonuçlarda sabit bir kayma olabilir. Önce “Gecikmeyi ölç”e bas.</span>' : "");
    else rresEl.innerHTML = RRES_HINT;
    const ok = await start({ mode, rhythm, bpm, chordAt: chordForBar, click: rclickIn.checked,
      onSlot: cardSlot, onBar: b => { if(rsrcSel.value !== "sel") Chords.select(chordForBar(b)); }, onEval: cardEval,
      onStop: () => { mine = false; rstopBtn.disabled = true; clearNow(); } });
    if(!ok){ rresEl.textContent = "Mikrofon açılamadı; birlikte çalmak için mikrofon izni gerekir."; return; }
    mine = true; rstopBtn.disabled = false;
  }
  function clearNow(){ [...rgridEl.children].forEach(c => c.classList.remove("now")); rnowEl.textContent = ""; }
  function cardSlot(k){
    const n = rhythm.slots.length, cells = rgridEl.children;
    for(let i = 0; i < cells.length; i++) cells[i].classList.toggle("now", k >= 0 && i === k % n);
    if(k < 0) rnowEl.textContent = "Hazır… " + rhythm.beats.filter(b => b <= k + n).map((_, j) => j+1).join(" ");
    else{
      const bar = Math.floor(k / n);
      rnowEl.textContent = rsrcSel.value === "sel" ? "Akor: " + Chords.current.symbol
        : "Şimdi: " + chordForBar(bar).symbol + " · sonra: " + chordForBar(bar+1).symbol;
    }
  }
  function cardEval(res, b, start){
    const n = rhythm.slots.length, dt = slotDur(bpm), cells = rgridEl.children;
    results.push(res); if(results.length > 4) results.shift();
    for(let i = 0; i < n; i++){ const m = cells[i].querySelector(".rmark"); m.textContent = ""; m.className = "rmark"; }
    for(const h of res.hits){
      const m = cells[h.slot].querySelector(".rmark");
      m.className = "rmark " + h.verdict;
      m.textContent = h.verdict === "ok" ? "✓" : h.verdict === "miss" ? "✗" : (h.offset < 0 ? "−" : "+") + Math.round(Math.abs(h.offset)*1000);
    }
    for(const t of res.extraTimes){
      const i = Math.round((t - start)/dt);
      if(i >= 0 && i < n && !cells[i].querySelector(".rmark").textContent){
        const m = cells[i].querySelector(".rmark"); m.className = "rmark extra"; m.textContent = "fazla";
      }
    }
    const s = summarize(results);
    rresEl.innerHTML = "Son " + results.length + " ölçü: " + s.html + (latency === null ? '<br><span class="warn">Gecikme ölçülmedi; tahmini değer kullanılıyor.</span>' : "") +
      '<br><small>Hücre altı: ✓ zamanında · −erken / +geç (ms) · ✗ kaçan. Yön (aşağı/yukarı) mikrofonla ayırt edilmez.</small>';
    if(results.length >= 4) Bus.emit("achieve", { type:"rhythm", id: rhythm.id, bpm, pct: s.pct, bars: results.length });
  }
  rstopBtn.addEventListener("click", () => { stop(); stopCal(); });
  $("rdemo").addEventListener("click", () => cardStart("demo"));
  $("rplay").addEventListener("click", () => cardStart("play"));
  $("rcal").addEventListener("click", calStart);

  // Ölçü sonuçlarının özeti: zamanında yüzdesi, ortalama kayma, kaçan, fazla ve bir ipucu
  function summarize(list){
    const all = list.flatMap(r => r.hits), matched = all.filter(h => h.offset !== null);
    const okN = all.filter(h => h.verdict === "ok").length, miss = all.length - matched.length;
    const extra = list.reduce((s, r) => s + r.extra, 0);
    const mean = matched.length ? matched.reduce((s, h) => s + h.offset, 0) / matched.length : 0;
    const ms = Math.round(Math.abs(mean)*1000), pct = all.length ? Math.round(100*okN/all.length) : 0;
    let tip = "";
    if(matched.length >= 3 && mean > 0.025) tip = "Geride kalıyorsun: vuruşu tıkı duyunca değil, tıkla aynı anda yap.";
    else if(matched.length >= 3 && mean < -0.025) tip = "Acele ediyorsun: tıkı bekle, el sarkaç gibi eşit sallansın.";
    else if(miss > all.length/4) tip = "Kaçan vuruşlar var: boş hücrelerde de el sallanmaya devam etsin, yalnızca tele değmesin.";
    else if(extra > 1) tip = "Fazla vuruşlar var: boş hücrelerde el teli geçmeli, değmemeli.";
    else if(all.length && okN === all.length) tip = "Çok iyi! Tempoyu 5 BPM artırmayı dene.";
    return { pct, html: "<b>%" + pct + "</b> zamanında · ortalama " + (ms < 5 ? "tam üstünde" : ms + " ms " + (mean > 0 ? "geç" : "erken")) +
      " · " + miss + " kaçan · " + extra + " fazla" + (tip ? "<br>" + tip : "") };
  }

  // Gecikme ölçümü: 4 tık say, sonraki 8 tıkın her birinde bir kez aşağı çal; ortanca sapma gecikme olur.
  async function calStart(){
    Bus.emit("stopall");
    if(!Mic.running && !(await Mic.start())){ rresEl.textContent = "Mikrofon açılamadı; gecikme ölçümü mikrofon ister."; return; }
    const a = Snd.ctx(), dt = 0.75, t0 = a.currentTime + 0.3, targets = [], onsets = [];
    for(let i = 0; i < 12; i++){ Snd.click(t0 + i*dt, i % 4 === 0); if(i >= 4) targets.push(t0 + i*dt); }
    calib = { unsub: Mic.onOnset(t => onsets.push(t)), raf: 0, timer: 0 };
    rstopBtn.disabled = false;
    rresEl.textContent = "Gecikme ölçülüyor: 4 tık say, sonraki 8 tıkın her birinde akoru bir kez aşağı çal.";
    const tick = () => {
      if(!calib) return;
      const k = Math.floor((a.currentTime - t0) / dt);
      rnowEl.textContent = k < 0 ? "Hazır…" : k < 4 ? "Say: " + (k+1) : k < 12 ? "Çal! " + (k-3) + "/8" : "Hesaplanıyor…";
      calib.raf = requestAnimationFrame(tick);
    };
    calib.raf = requestAnimationFrame(tick);
    calib.timer = setTimeout(() => {
      const offs = targets.map(t => { const m = onsets.filter(o => o > t - 0.2 && o < t + 0.45);
                                      return m.length ? m.reduce((x, y) => Math.abs(x-t) < Math.abs(y-t) ? x : y) - t : null; })
                          .filter(x => x !== null);
      stopCal();
      if(offs.length < 5){
        rresEl.textContent = "Yeterli vuruş duyulmadı (" + offs.length + "/8). Mikrofon hassasiyetini artırıp yeniden dene.";
        return;
      }
      latency = Math.min(0.4, Math.max(0, median(offs)));
      store.set("latency", latency);
      const spread = Math.round((Math.max(...offs) - Math.min(...offs))*1000);
      rresEl.innerHTML = "Gecikme: <b>" + Math.round(latency*1000) + " ms</b> (" + offs.length + "/8 vuruş, yayılım " + spread + " ms). " +
        "Birlikte çalarken bu gecikme düşülür. Kulaklık ya da hoparlör değişirse yeniden ölç.";
    }, (t0 + 12*dt + 0.6 - a.currentTime)*1000);
  }
  function stopCal(){
    if(!calib) return;
    calib.unsub(); cancelAnimationFrame(calib.raf); clearTimeout(calib.timer); calib = null;
    rnowEl.textContent = ""; if(!rs) rstopBtn.disabled = true;
  }

  Bus.on("stopall", () => { stop(); stopCal(); });
  Bus.on("mic", on => { if(!on && rs && rs.mode === "play") stop(); });
  buildRhythmList(); drawRhythm();
  return {
    start, stop, summarize,
    get latencyMeasured(){ return latency !== null; },
    open(id, b){ const r = rhythmById(id); if(r) selectRhythm(r); if(b) setBpm(b); }
  };
})();
