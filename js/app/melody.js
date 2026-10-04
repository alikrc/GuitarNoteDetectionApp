// Ezgiler sekmesi: nota kartları (tel · perde · parmak), tab, dinleme ve mikrofonla nota nota çalma.
const Melody = (() => {
  const selEl=$("melsel"), bpmEl=$("melbpm"), metaEl=$("melmeta"), notesEl=$("melnotes"), nextEl=$("melnext"),
        resEl=$("melres"), tabEl=$("meltab"), stopBtn=$("melstop"), textEl=$("meltext"), errEl=$("melerr"),
        RES_HINT = () => t("h.melres");
  defStr({
    "mel.custom":     { tr:"Kendi ezgim", en:"My melody" },
    "mel.customMeta": { tr:"Kendi yazdığın ezgi", en:"A melody you wrote" },
    "mel.unknown":    { tr:"Tanınmayan: {list}", en:"Not recognised: {list}" },
    "mel.empty":      { tr:"En az bir nota yaz.", en:"Write at least one note." },
    "mel.count":      { tr:"{n} nota.", en:"{n} notes." },
    "mel.noPos":      { tr:"sapta yok", en:"not on the neck" },
    "mel.pos":        { tr:"{s}. tel · {f}", en:"string {s} · {f}" },
    "mel.open":       { tr:"açık", en:"open" },
    "mel.openString": { tr:"açık tel", en:"open string" },
    "mel.finger":     { tr:"{n} {name} · {p}. poz.", en:"{n} {name} · pos. {p}" },
    "mel.beats":      { tr:"{note}, {b} vuruş", en:"{note}, {b} beats" },
    "mel.demoDone":   { tr:"Bitti. Şimdi “Çal” ile sen çal.", en:"Done. Now play it yourself with “Play”." },
    "mel.noMic":      { tr:"Mikrofon açılamadı; bu alıştırma mikrofonla dinler.", en:"Microphone failed; this exercise listens through the microphone." },
    "mel.listening":  { tr:"Dinliyorum: ilk notayı çal.", en:"Listening: play the first note." },
    "mel.next":       { tr:"Sıradaki: {note} — {pos}", en:"Next: {note} — {pos}" },
    "mel.nextFinger": { tr:", {name} parmağı", en:", {name} finger" },
    "mel.finished":   { tr:"Ezgi bitti ✓", en:"Melody finished ✓" },
    "mel.someWrong":  { tr:"{n} yanlış nota vardı; bir daha dene.", en:"{n} wrong notes; try again." },
    "mel.noWrong":    { tr:"Hiç yanlış yok!", en:"No mistakes!" },
    "mel.heard":      { tr:"{heard} duydum", en:"I heard {heard}" },
    "mel.expected":   { tr:", {want} bekleniyor ({pos}). ", en:", expecting {want} ({pos}). " },
    "mel.lower":      { tr:"Daha pes bir ses olmalı.", en:"It should be lower." },
    "mel.higher":     { tr:"Daha tiz bir ses olmalı.", en:"It should be higher." }
  });
  const fingerText = (n, p) => t("mel.finger", { n, name: fingerName(n), p });
  let mel = null, notes = [], plan = [];
  let demo = null;                  // { voices, timers }
  let listen = null;                // { idx, attackAt, lastAccept, unsub }

  function fillSelect(){
    const v = selEl.value;
    selEl.replaceChildren(...MELODIES.map(m => new Option(L(m, "title"), m.id)), new Option(t("mel.custom"), "custom"));
    if(v) selEl.value = v;
  }
  fillSelect();
  textEl.value = store.get("melCustom", "Mi4 Re4 Do4 Re4 Mi4 Mi4 Mi4:2");

  function load(id){
    stopAll();
    if(id === "custom"){
      const p = parseMelody(textEl.value);
      mel = { id:"custom", bpm: 90, text: textEl.value };
      errEl.textContent = p.errors.length ? t("mel.unknown", { list: p.errors.join(", ") }) : "";
    }else mel = melodyById(id) || MELODIES[0];
    selEl.value = mel.id; store.set("melody", mel.id);
    bpmEl.value = mel.bpm; metaEl.textContent = mel.id === "custom" ? t("mel.customMeta") : L(mel, "meta");
    notes = parseMelody(mel.text).notes;
    plan = planFingering(notes.map(n => n.written));
    render(); resEl.innerHTML = RES_HINT(); nextEl.textContent = "";
  }
  selEl.addEventListener("change", () => load(selEl.value));
  $("meluse").addEventListener("click", () => {
    const p = parseMelody(textEl.value);
    if(p.errors.length){ errEl.textContent = t("mel.unknown", { list: p.errors.join(", ") }); return; }
    if(!p.notes.length){ errEl.textContent = t("mel.empty"); return; }
    store.set("melCustom", textEl.value); load("custom");
  });
  textEl.addEventListener("input", () => {
    const p = parseMelody(textEl.value);
    errEl.textContent = p.errors.length ? t("mel.unknown", { list: p.errors.join(", ") }) : t("mel.count", { n: p.notes.length });
  });

  const posText = p => p.string === null ? t("mel.noPos") : t("mel.pos", { s: p.string, f: p.fret === 0 ? t("mel.open") : p.fret });
  function render(){
    notesEl.replaceChildren(...notes.map((n, i) => {
      const p = plan[i], c = document.createElement("div");
      c.className = "mnote";
      c.innerHTML = '<span class="nn"></span><span class="tb"></span><span class="fg"></span>';
      c.children[0].textContent = noteLabel(n.written) + (n.beats !== 1 ? " ·" + num(n.beats, n.beats % 1 ? 1 : 0) : "");
      c.children[1].textContent = posText(p);
      c.children[2].textContent = p.finger === null ? "" : p.fret === 0 ? t("mel.openString") : fingerText(p.finger, p.pos);
      c.title = t("mel.beats", { note: noteLabel(n.written), b: n.beats });
      return c;
    }));
    // Tab: notalar sırayla, her biri kendi sütununda
    const lines = [1,2,3,4,5,6].map(s => { const o = stringOpen(s); return (s === 1 ? NOTE_EN[o%12].toLowerCase() : NOTE_EN[o%12]).padEnd(2) + "|-"; });
    plan.forEach(p => {
      const w = p.fret === null ? 1 : String(p.fret).length;
      for(let s = 1; s <= 6; s++) lines[s-1] += (p.string === s ? String(p.fret) : "-".repeat(w)) + "-";
    });
    tabEl.textContent = lines.map(l => l + "|").join("\n");
  }
  function mark(i, cls){ const c = notesEl.children[i]; if(c){ c.classList.add(cls); } }
  function clearMarks(){ [...notesEl.children].forEach(c => c.classList.remove("cur", "done", "wrong", "now")); }

  // ---- Dinle ----
  function playDemo(){
    stopAll(); Bus.emit("stopall");
    const a = Snd.ctx(), beat = 60 / Math.min(160, Math.max(40, +bpmEl.value || mel.bpm));
    let at = a.currentTime + 0.1;
    demo = { voices: [], timers: [] };
    notes.forEach((n, i) => {
      const when = at;
      demo.timers.push(setTimeout(() => {
        if(!demo) return;
        demo.voices.forEach(v => Snd.fadeOut(v));
        demo.voices = [Snd.pluck(writtenFreq(n.written, T), Snd.ctx().currentTime, 0.3)];
        clearMarks(); mark(i, "now");
        nextEl.textContent = noteLabel(n.written) + " — " + posText(plan[i]);
      }, (when - a.currentTime)*1000));
      at += n.beats * beat;
    });
    demo.timers.push(setTimeout(() => { stopAll(); resEl.textContent = t("mel.demoDone"); }, (at - a.currentTime + 0.6)*1000));
    stopBtn.disabled = false;
  }
  $("meldemo").addEventListener("click", playDemo);

  // ---- Mikrofonla nota nota çal ----
  // Doğru nota duyulunca sıradakine geçilir. Aynı nota üst üste geliyorsa yeni bir çekiş (vuruş) beklenir.
  async function startListen(){
    stopAll(); Bus.emit("stopall");
    if(!Mic.running && !(await Mic.start())){ resEl.textContent = t("mel.noMic"); return; }
    listen = { idx: 0, attackAt: -1, lastAccept: -1, wrong: 0 };
    listen.unsub = Mic.onOnset(t => { if(listen) listen.attackAt = t; });
    stopBtn.disabled = false;
    clearMarks(); showNext();
    resEl.textContent = t("mel.listening");
  }
  function showNext(){
    const i = listen.idx;
    [...notesEl.children].forEach((c, k) => c.classList.toggle("cur", k === i));
    if(i < notes.length){
      nextEl.textContent = t("mel.next", { note: noteLabel(notes[i].written), pos: posText(plan[i]) }) +
        (plan[i].finger ? t("mel.nextFinger", { name: fingerName(plan[i].finger) }) : "");
      notesEl.children[i].scrollIntoView({ block:"nearest", inline:"nearest" });
    }
  }
  $("melplay").addEventListener("click", startListen);
  Bus.on("note", ({ r, isNew }) => {
    if(!listen || listen.idx >= notes.length) return;
    const i = listen.idx, want = notes[i].written, ctxT = Snd.ctx().currentTime;
    const freshAttack = listen.attackAt > listen.lastAccept;
    const same = r.written === want || Math.abs(r.written - want) === 12;      // oktav kayması: perde bulucu hatası olabilir
    // Yeni nota (perde değişti ya da araya sessizlik girdi) ya da son kabulden sonra yeni bir çekiş
    if(same && (isNew || freshAttack)){
      listen.lastAccept = Math.max(listen.attackAt, ctxT - 0.05);
      notesEl.children[i].classList.remove("wrong", "cur"); mark(i, "done");
      listen.idx++;
      if(listen.idx >= notes.length){
        const w = listen.wrong;
        stopAll();
        resEl.innerHTML = '<span class="ok">' + t("mel.finished") + '</span> ' + (w ? t("mel.someWrong", { n: w }) : t("mel.noWrong"));
        nextEl.textContent = "";
        Bus.emit("achieve", { type:"melody", id: mel.id });
        return;
      }
      resEl.textContent = "✓ " + noteLabel(want);
      showNext();
    }else if(isNew && !same){
      listen.wrong++;
      mark(i, "wrong");
      resEl.innerHTML = '<span class="no">' + t("mel.heard", { heard: noteLabel(r.written) }) + "</span>" +
        t("mel.expected", { want: noteLabel(want), pos: posText(plan[i]) }) + t(r.written > want ? "mel.lower" : "mel.higher");
    }
  });

  function stopAll(){
    if(demo){ demo.timers.forEach(clearTimeout); demo.voices.forEach(v => Snd.fadeOut(v)); demo = null; }
    if(listen){ listen.unsub(); listen = null; }
    stopBtn.disabled = true;
    [...notesEl.children].forEach(c => c.classList.remove("now", "cur"));
  }
  stopBtn.addEventListener("click", () => { stopAll(); nextEl.textContent = ""; });
  Bus.on("stopall", () => { if(demo) stopAll(); });
  Bus.on("range", () => load(mel ? mel.id : "nese"));
  Bus.on("lang", () => { fillSelect(); if(mel){ const id = mel.id; selEl.value = id; metaEl.textContent = id === "custom" ? t("mel.customMeta") : L(mel, "meta"); render(); } });

  load(store.get("melody", MELODIES[0].id));
  return { open(id){ load(id); } };
})();
