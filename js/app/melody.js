// Ezgiler sekmesi: nota kartları (tel · perde · parmak), tab, dinleme ve mikrofonla nota nota çalma.
const Melody = (() => {
  const selEl=$("melsel"), bpmEl=$("melbpm"), metaEl=$("melmeta"), notesEl=$("melnotes"), nextEl=$("melnext"),
        resEl=$("melres"), tabEl=$("meltab"), stopBtn=$("melstop"), textEl=$("meltext"), errEl=$("melerr"),
        RES_HINT = resEl.innerHTML;
  const FINGER = ["açık", "1 işaret", "2 orta", "3 yüzük", "4 serçe"];
  let mel = null, notes = [], plan = [];
  let demo = null;                  // { voices, timers }
  let listen = null;                // { idx, attackAt, lastAccept, unsub }

  for(const m of MELODIES) selEl.appendChild(new Option(m.title, m.id));
  selEl.appendChild(new Option("Kendi ezgim", "custom"));
  textEl.value = store.get("melCustom", "Mi4 Re4 Do4 Re4 Mi4 Mi4 Mi4:2");

  function load(id){
    stopAll();
    if(id === "custom"){
      const p = parseMelody(textEl.value);
      mel = { id:"custom", title:"Kendi ezgim", bpm: 90, meta:"Kendi yazdığın ezgi", text: textEl.value };
      errEl.textContent = p.errors.length ? "Tanınmayan: " + p.errors.join(", ") : "";
    }else mel = melodyById(id) || MELODIES[0];
    selEl.value = mel.id; store.set("melody", mel.id);
    bpmEl.value = mel.bpm; metaEl.textContent = mel.meta;
    notes = parseMelody(mel.text).notes;
    plan = planFingering(notes.map(n => n.written));
    render(); resEl.innerHTML = RES_HINT; nextEl.textContent = "";
  }
  selEl.addEventListener("change", () => load(selEl.value));
  $("meluse").addEventListener("click", () => {
    const p = parseMelody(textEl.value);
    if(p.errors.length){ errEl.textContent = "Tanınmayan: " + p.errors.join(", "); return; }
    if(!p.notes.length){ errEl.textContent = "En az bir nota yaz."; return; }
    store.set("melCustom", textEl.value); load("custom");
  });
  textEl.addEventListener("input", () => {
    const p = parseMelody(textEl.value);
    errEl.textContent = p.errors.length ? "Tanınmayan: " + p.errors.join(", ") : p.notes.length + " nota.";
  });

  const posText = p => p.string === null ? "sapta yok" : p.string + ". tel · " + (p.fret === 0 ? "açık" : p.fret);
  function render(){
    notesEl.replaceChildren(...notes.map((n, i) => {
      const p = plan[i], c = document.createElement("div");
      c.className = "mnote";
      c.innerHTML = '<span class="nn"></span><span class="tb"></span><span class="fg"></span>';
      c.children[0].textContent = noteName(n.written).tr + (n.beats !== 1 ? " ·" + String(n.beats).replace(".", ",") : "");
      c.children[1].textContent = posText(p);
      c.children[2].textContent = p.finger === null ? "" : p.fret === 0 ? "açık tel" : FINGER[p.finger] + " · " + p.pos + ". poz.";
      c.title = noteName(n.written).tr + ", " + n.beats + " vuruş";
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
    let t = a.currentTime + 0.1;
    demo = { voices: [], timers: [] };
    notes.forEach((n, i) => {
      const at = t;
      demo.timers.push(setTimeout(() => {
        if(!demo) return;
        demo.voices.forEach(v => Snd.fadeOut(v));
        demo.voices = [Snd.pluck(perdeFreq(n.written, T), Snd.ctx().currentTime, 0.3)];
        clearMarks(); mark(i, "now");
        nextEl.textContent = noteName(n.written).tr + " — " + posText(plan[i]);
      }, (at - a.currentTime)*1000));
      t += n.beats * beat;
    });
    demo.timers.push(setTimeout(() => { stopAll(); resEl.textContent = "Bitti. Şimdi “Çal” ile sen çal."; }, (t - a.currentTime + 0.6)*1000));
    stopBtn.disabled = false;
  }
  $("meldemo").addEventListener("click", playDemo);

  // ---- Mikrofonla nota nota çal ----
  // Doğru nota duyulunca sıradakine geçilir. Aynı nota üst üste geliyorsa yeni bir çekiş (vuruş) beklenir.
  async function startListen(){
    stopAll(); Bus.emit("stopall");
    if(!Mic.running && !(await Mic.start())){ resEl.textContent = "Mikrofon açılamadı; bu alıştırma mikrofonla dinler."; return; }
    listen = { idx: 0, attackAt: -1, lastAccept: -1, wrong: 0 };
    listen.unsub = Mic.onOnset(t => { if(listen) listen.attackAt = t; });
    stopBtn.disabled = false;
    clearMarks(); showNext();
    resEl.textContent = "Dinliyorum: ilk notayı çal.";
  }
  function showNext(){
    const i = listen.idx;
    [...notesEl.children].forEach((c, k) => c.classList.toggle("cur", k === i));
    if(i < notes.length){
      nextEl.textContent = "Sıradaki: " + noteName(notes[i].written).tr + " — " + posText(plan[i]) +
        (plan[i].finger ? ", " + FINGER[plan[i].finger].split(" ")[1] + " parmağı" : "");
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
        resEl.innerHTML = '<span class="ok">Ezgi bitti ✓</span> ' + (w ? w + " yanlış nota vardı; bir daha dene." : "Hiç yanlış yok!");
        nextEl.textContent = "";
        Bus.emit("achieve", { type:"melody", id: mel.id });
        return;
      }
      resEl.textContent = "✓ " + noteName(want).tr;
      showNext();
    }else if(isNew && !same){
      listen.wrong++;
      mark(i, "wrong");
      resEl.innerHTML = '<span class="no">' + noteName(r.written).tr + " duydum</span>, " + noteName(want).tr +
        " bekleniyor (" + posText(plan[i]) + "). " + (r.written > want ? "Daha pes" : "Daha tiz") + " bir ses olmalı.";
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

  load(store.get("melody", MELODIES[0].id));
  return { open(id){ load(id); } };
})();
