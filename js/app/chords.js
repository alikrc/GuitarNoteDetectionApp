// Akorlar sekmesi: kutu şeması, tel tel talimat, çalma, capo, mikrofonla kontrol, akor değiştirme alıştırması, dizilişler.
const Chords = (() => {
  defStr({
    "ch.capoNone":   { tr:"yok", en:"none" },
    "ch.capoFret":   { tr:"{n}. perde", en:"fret {n}" },
    "ch.diagAria":   { tr:"{name} akor şeması: {rows}", en:"{name} chord diagram: {rows}" },
    "ch.rowMuted":   { tr:"{s}. tel çalınmaz", en:"string {s} not played" },
    "ch.rowOpen":    { tr:"{s}. tel açık", en:"string {s} open" },
    "ch.rowFret":    { tr:"{s}. tel {f}. perde {finger} parmağı", en:"string {s} fret {f} {finger} finger" },
    "ch.capoTag":    { tr:"Capo {n}. perdede: bu şekil {name} ({sym}) olarak duyulur", en:"Capo at fret {n}: this shape sounds as {name} ({sym})" },
    "ch.notInShape": { tr:", bu şekilde yok", en:", not in this shape" },
    "ch.string":     { tr:"{s}. tel", en:"String {s}" },
    "ch.mute":       { tr:"çalma ✕", en:"don't play ✕" },
    "ch.open":       { tr:"açık · {note} ({role})", en:"open · {note} ({role})" },
    "ch.fretted":    { tr:"{f}. perde, {finger} parmağı{barre} · {note} ({role})", en:"fret {f}, {finger} finger{barre} · {note} ({role})" },
    "ch.barreTag":   { tr:" (barre)", en:" (barre)" },
    "ch.tuningWarn": { tr:"Seçili akort “{name}”: bu şekiller standart akort içindir, farklı ses verir.", en:"Selected tuning “{name}”: these shapes are for standard tuning and will sound different." },
    "ch.barre":      { tr:"Barre: {who} parmağını düz tutup kemik tarafıyla {f}. perdede {from}–{to}. telleri birden bastır; başparmak sapın arkasında, orta parmak hizasında dursun.",
                       en:"Barre: keep your {who} finger straight and press strings {from}–{to} at fret {f} with its bony side; your thumb stays behind the neck, level with the middle finger." },
    "ch.miniBarre":  { tr:"Küçük barre: {who} parmağı {f}. perdede {from} ve {to}. telleri birden bastırır.", en:"Small barre: the {who} finger presses strings {from} and {to} together at fret {f}." },
    "ch.mutedTip":   { tr:"× olan telleri çalma; vuruşa {s}. telden başla.", en:"Don't play the × strings; start the strum on string {s}." },
    "ch.generalTip": { tr:"Parmak uçlarıyla, perde telinin hemen gerisine bas; komşu tele değmesin. Tel tel çalıp her telin net çıktığını dinle.",
                       en:"Press with your fingertips just behind the fret wire without touching the neighbouring strings. Play string by string and listen that each one rings clearly." },
    "ch.strumHint":  { tr:"Akoru bir kerede çal; duyulan sesleri burada göstereceğim.", en:"Strum the chord once; I'll show the notes I hear here." },
    "ch.allOk":      { tr:"Tüm teller doğru ✓", en:"All strings correct ✓" },
    "ch.nowStrum":   { tr:" Şimdi akoru bir kerede çal. ", en:" Now strum the whole chord. " },
    "ch.again":      { tr:"Baştan", en:"Start over" },
    "ch.nextString": { tr:"Sıradaki: <b>{s}. tel</b> → {note}", en:"Next: <b>string {s}</b> → {note}" },
    "ch.micOff":     { tr:" · mikrofon kapalı", en:" · microphone off" },
    "ch.stringOk":   { tr:"{s}. tel doğru ✓", en:"string {s} correct ✓" },
    "ch.stringBad":  { tr:"{s}. tel: {want} bekleniyordu, {heard} duyuldu.", en:"string {s}: expected {want}, heard {heard}." },
    "ch.stringBadTip":{ tr:" Doğru teli ve perdeyi kontrol et; parmak komşu tele değiyorsa tel boğuk çıkar.", en:" Check the string and fret; a finger touching the next string makes it sound muffled." },
    "ch.clean":      { tr:"{c} temiz çıkıyor ✓", en:"{c} rings clean ✓" },
    "ch.notYet":     { tr:"Tam değil", en:"Not quite" },
    "ch.missing":    { tr:" — duyulmayan: {list} (o sesi veren tel boğuk olabilir)", en:" — not heard: {list} (the string giving it may be muffled)" },
    "ch.extraNotes": { tr:" — akorda olmayan: {list} (yanlış perde ya da susturulmamış tel)", en:" — not in the chord: {list} (wrong fret or an unmuted string)" },
    "ch.soundsLike": { tr:"Duyulan daha çok {c} akoruna benziyor.", en:"It sounds more like {c}." },
    "ch.perMin":     { tr:"{n} /dk", en:"{n} /min" },
    "ch.stopped":    { tr:"Durduruldu.", en:"Stopped." },
    "ch.twoChords":  { tr:"İki farklı akor seç.", en:"Choose two different chords." },
    "ch.noMic":      { tr:"Mikrofon açılamadı; alıştırma mikrofonla sayar.", en:"Microphone failed; this exercise counts with the microphone." },
    "ch.startWith":  { tr:"{a} ile başla, sonra {b} akoruna geç ve böyle devam et.", en:"Start with {a}, switch to {b}, and keep going." },
    "ch.start":      { tr:"Başlat", en:"Start" },
    "ch.stop":       { tr:"Durdur", en:"Stop" },
    "ch.result":     { tr:"<b>{n} geçiş / dakika</b>", en:"<b>{n} changes / minute</b>" },
    "ch.record":     { tr:" — yeni rekor!", en:" — new record!" },
    "ch.slow":       { tr:"Yavaş ve temiz çal; hız sonra gelir. Parmakları şekil olarak birlikte taşı.", en:"Play slowly and cleanly; speed comes later. Move your fingers together as a shape." },
    "ch.ok":         { tr:"İyi gidiyor. Ortak parmakları (iki akorda aynı yerde olanları) kaldırmadan geçmeyi dene.", en:"Going well. Try changing without lifting the shared fingers (the ones in the same place in both chords)." },
    "ch.great":      { tr:"Çok iyi! Şimdi bu iki akoru bir vuruş kalıbıyla çal (Ritim sekmesi).", en:"Very good! Now play these two chords with a strumming pattern (Rhythm tab)." },
    "ch.progAria":   { tr:"{p} dizilişini çal", en:"play the {p} progression" }
  });
  const cgroupsEl=$("cgroups"), clistEl=$("clist"), cdiag=$("cdiag"), cnameEl=$("cname"), cformEl=$("cformula"),
        cstepsEl=$("csteps"), ctipEl=$("ctip"), cresEl=$("cresult"), capoEl=$("capo"), capoTag=$("capotag"),
        CRES_HINT = () => "";              // açıklama "Nasıl çalışır?" bölümünde
  const FINGER_NAME = new Proxy({}, { get: (_, i) => fingerName(+i) });     // seçili dilde parmak adı
  // Şemanın altında yer dar: görevler kısaltılır (k. = küçük, b. = büyük); tam adlar talimat listesinde
  const ROLE_SHORT = {"küçük üçlü":"k.3", "büyük üçlü":"b.3", "beşli":"5", "küçük yedili":"k.7", "büyük yedili":"b.7", "ikili":"2", "dörtlü":"4"};
  const ROLE_SHORT_EN = {"kök":"R", "küçük üçlü":"♭3", "büyük üçlü":"3", "beşli":"5", "küçük yedili":"♭7", "büyük yedili":"7", "ikili":"2", "dörtlü":"4"};
  let chord = chordBySymbol(store.get("chord", "Am")) || chordBySymbol("Am");
  let cgroup = chord.group;
  let capo = Math.max(0, Math.min(7, store.get("capo", 0) | 0));
  function fillCapo(){ capoEl.replaceChildren(...[0,1,2,3,4,5,6,7].map(i => new Option(i === 0 ? t("ch.capoNone") : t("ch.capoFret", { n: i }), i))); capoEl.value = capo; }
  fillCapo();
  capoEl.addEventListener("change", () => { capo = +capoEl.value; store.set("capo", capo); drawChord(); resetCheck(); Bus.emit("capo", capo); });
  const voicing = c => chordStrings(c, capo);

  function buildChordList(){
    cgroupsEl.replaceChildren(...CHORD_GROUPS.map((_, i) =>
      radioBtn(chordGroupName(i), i===cgroup, () => { cgroup = i; buildChordList(); })));
    const list = CHORDS.filter(c => c.group === cgroup);
    clistEl.replaceChildren(...list.map(c => {
      const b = radioBtn(c.symbol, c===chord, () => select(c));
      b.title = chordName(c); b.setAttribute("aria-label", chordName(c) + " (" + c.symbol + ")");
      return b;
    }));
    // Seçili akor bu grupta değilse ilk akor sekme sırasına girsin
    if(!list.includes(chord) && clistEl.firstChild) clistEl.firstChild.tabIndex = 0;
  }
  radioArrows(cgroupsEl); radioArrows(clistEl);
  function select(c){
    chord = c; cgroup = c.group; store.set("chord", c.symbol);
    buildChordList(); drawChord(); resetCheck();
  }

  // Kutu şeması: dikey teller (6. solda), yatay perdeler, eşik üstte; × çalma, ○ açık tel, dolu daire parmak numarası.
  // Başka sekmeler de kullanır (şarkıdaki akorlar): compact = yalnızca şekil.
  const CX = s => 40 + (6-s)*28, CY0 = 46, CROW = 38;
  function inBarre(c, r){
    const b = c.barre;
    return b && r.fret===b.fret && r.string<=b.from && r.string>=b.to && r.finger===c.fingers[6-b.from];
  }
  function diagram(svg, c, { compact = false } = {}){
    const base = chordBaseFret(c), rows = voicing(c);
    const yOf = f => CY0 + (f - base + 0.5)*CROW;
    svg.replaceChildren();
    if(compact) svg.setAttribute("viewBox", "0 0 220 " + (CY0 + 5*CROW + 8));
    for(let i=0; i<=5; i++) svg.appendChild(svgEl("line", {class:"cd-grid", x1:CX(6), x2:CX(1), y1:CY0+i*CROW, y2:CY0+i*CROW}));
    for(let s=1; s<=6; s++) svg.appendChild(svgEl("line", {class:"cd-grid", x1:CX(s), x2:CX(s), y1:CY0, y2:CY0+5*CROW}));
    if(base === 1) svg.appendChild(svgEl("rect", {class:"cd-nut", x:CX(6)-1, y:CY0-6, width:CX(1)-CX(6)+2, height:7}));
    else svg.appendChild(svgEl("text", {class:"cd-base", x:CX(6)-14, y:yOf(base)+4}, base + ". p"));
    if(c.barre){
      const b = c.barre;
      svg.appendChild(svgEl("rect", {class:"cd-dot", x:CX(b.from)-12, y:yOf(b.fret)-12, width:CX(b.to)-CX(b.from)+24, height:24, rx:12}));
      svg.appendChild(svgEl("text", {class:"cd-fing", x:CX(b.from), y:yOf(b.fret)+4.5}, String(c.fingers[6-b.from])));
    }
    for(const r of rows){
      const x = CX(r.string);
      if(!compact) svg.appendChild(svgEl("circle", {class:"cd-ring", id:"cr-"+r.string, cx:x, cy:24, r:11}));
      if(r.muted){ svg.appendChild(svgEl("text", {class:"cd-mark", x, y:29}, "×")); continue; }
      if(r.fret === 0) svg.appendChild(svgEl("circle", {cx:x, cy:24, r:6.5, fill:"none", stroke:"currentColor", "stroke-width":1.8, class:"cd-open"}));
      else if(!inBarre(c, r)){
        svg.appendChild(svgEl("circle", {class:"cd-dot", cx:x, cy:yOf(r.fret), r:12}));
        svg.appendChild(svgEl("text", {class:"cd-fing", x, y:yOf(r.fret)+4.5}, String(r.finger)));
      }
      if(!compact){
        svg.appendChild(svgEl("text", {class:"cd-note", id:"cn-"+r.string, x, y:CY0+5*CROW+20}, shortName(r.midi)));
        svg.appendChild(svgEl("text", {class:"cd-role", x, y:CY0+5*CROW+32}, getLang() === "en" ? ROLE_SHORT_EN[r.role] || roleLabel(r.role) : ROLE_SHORT[r.role] || r.role));
      }
    }
    svg.setAttribute("aria-label", t("ch.diagAria", { name: chordName(c), rows: rows.map(r =>
      r.muted ? t("ch.rowMuted", { s: r.string }) : r.fret===0 ? t("ch.rowOpen", { s: r.string })
              : t("ch.rowFret", { s: r.string, f: r.fret, finger: FINGER_NAME[r.finger] })).join(", ") }));
  }
  function drawChord(){
    const c = chord, rows = voicing(c);
    diagram(cdiag, c);
    cnameEl.innerHTML = chordName(c) + " <em>" + c.symbol + "</em>";
    capoTag.textContent = capo ? t("ch.capoTag", { n: capo, name: soundingName(c, capo), sym: soundingSymbol(c, capo) }) : "";
    const ty = CHORD_TYPES[c.type], pcs = chordPcs(c, capo), sounded = new Set(rows.filter(r => !r.muted).map(r => r.midi % 12));
    cformEl.innerHTML = L(ty, "formula") + " → " + pcs.map((pc, i) =>
      "<b>" + shortName(pc) + "</b> (" + roleLabel(INTERVAL_TR[ty.iv[i]]) + (sounded.has(pc) ? "" : t("ch.notInShape")) + ")").join(" · ");

    cstepsEl.replaceChildren(...rows.map(r => {
      const li = document.createElement("li");
      if(r.muted) li.className = "idle";
      const part = document.createElement("span"); part.className = "part"; part.textContent = t("ch.string", { s: r.string });
      const body = document.createElement("span");
      body.textContent = r.muted ? t("ch.mute")
        : r.fret === 0 ? t("ch.open", { note: shortName(r.midi), role: roleLabel(r.role) })
        : t("ch.fretted", { f: r.fret, finger: FINGER_NAME[r.finger], barre: inBarre(c, r) ? t("ch.barreTag") : "", note: shortName(r.midi), role: roleLabel(r.role) });
      li.append(part, body);
      return li;
    }));

    const tips = [];
    if(getTuning() !== "standart")
      tips.push('<span class="warn">' + t("ch.tuningWarn", { name: L(TUNINGS[getTuning()], "name") }) + '</span>');
    if(c.barre){
      const b = c.barre, who = FINGER_NAME[c.fingers[6-b.from]];
      tips.push(t(b.from - b.to >= 4 ? "ch.barre" : "ch.miniBarre", { who, f: b.fret, from: b.from, to: b.to }));
    }
    const first = rows.find(r => !r.muted);
    if(first.string < 6) tips.push(t("ch.mutedTip", { s: first.string }));
    tips.push(t("ch.generalTip"));
    ctipEl.innerHTML = tips.join(" ");
    markRings();
  }

  // ---- Çalma ----
  let voices = [], vTimer = null;
  function stopVoices(){ voices.forEach(v => Snd.fadeOut(v)); voices = []; clearTimeout(vTimer); }
  // Çalınan teller kalından inceye gap saniye arayla çekilir (küçük gap tek vuruş, büyük gap arpej). Tampere çalar.
  function strum(c, gap){
    stopVoices();
    const a = Snd.ctx();
    voices = Snd.strum(voicing(c).filter(x => !x.muted).map(x => x.midi), a.currentTime + 0.02, gap, 0.14);
  }
  $("cstrum").addEventListener("click", () => { Bus.emit("stopall"); strum(chord, 0.03); });
  $("carp").addEventListener("click", () => { Bus.emit("stopall"); strum(chord, 0.45); });

  // ---- Alt bölümler: Öğren / Kontrol et / Alıştırma ----
  const subEl = $("csub"), subBtns = [...subEl.querySelectorAll("[role=tab]")];
  function pane(id){
    subBtns.forEach(b => {
      const on = b.id === "csub-" + id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      $(b.getAttribute("aria-controls")).hidden = !on;
    });
    store.set("chordPane", id);
  }
  subBtns.forEach(b => b.addEventListener("click", () => pane(b.id.slice(5))));
  subEl.addEventListener("keydown", e => {
    const step = {ArrowRight:1, ArrowLeft:-1}[e.key]; if(!step) return;
    const i = subBtns.findIndex(b => b.getAttribute("aria-selected") === "true");
    const b = subBtns[(i + step + subBtns.length) % subBtns.length];
    e.preventDefault(); b.click(); b.focus();
  });
  pane(["learn", "check", "practice"].includes(store.get("chordPane")) ? store.get("chordPane") : "learn");

  // ---- Mikrofonla kontrol ----
  // Tel tel: her teli sırayla dinler (tek ses, güvenilir). Tümü: akorun spektrumundan hangi seslerin duyulduğuna bakar.
  let checkMode = "off", chkIdx = 0, chkStatus = [], avgChroma = null, lastChromaT = 0;
  const chkBtns = document.querySelectorAll("#chkseg button");
  chkBtns.forEach(b => b.addEventListener("click", () => setCheck(b.dataset.chk)));
  function setCheck(m){
    checkMode = m;
    chkBtns.forEach(b => b.setAttribute("aria-checked", b.dataset.chk===m ? "true" : "false"));
    resetCheck();
    if(m !== "off" && !Mic.running) Mic.start();
  }
  const playedStrings = () => voicing(chord).filter(r => !r.muted);
  function resetCheck(){
    chkIdx = 0; chkStatus = []; avgChroma = null;
    if(checkMode === "off") cresEl.innerHTML = CRES_HINT();
    else if(checkMode === "strings") renderStringCheck("");
    else cresEl.innerHTML = t("ch.strumHint");
    markRings();
  }
  cresEl.addEventListener("click", e => { if(e.target.closest("[data-act=reset]")) resetCheck(); });
  function markRings(){
    cdiag.querySelectorAll(".cd-ring").forEach(e => e.classList.remove("next"));
    // Doğru/yanlış yalnızca renkle değil ✓ / ✗ işaretiyle de gösterilir
    cdiag.querySelectorAll(".cd-note").forEach(e => {
      e.classList.remove("good", "bad");
      if(e.dataset.name) e.textContent = e.dataset.name;
    });
    if(checkMode !== "strings") return;
    const ps = playedStrings();
    ps.forEach((r, i) => {
      const n = cdiag.querySelector("#cn-" + r.string);
      if(n && chkStatus[i]){
        n.classList.add(chkStatus[i]==="ok" ? "good" : "bad");
        n.dataset.name = n.dataset.name || n.textContent;
        n.textContent = n.dataset.name + (chkStatus[i]==="ok" ? "✓" : "✗");
      }
    });
    if(chkIdx < ps.length){ const ring = cdiag.querySelector("#cr-" + ps[chkIdx].string); if(ring) ring.classList.add("next"); }
  }
  function renderStringCheck(msg){
    const ps = playedStrings();
    cresEl.innerHTML = (msg ? msg + "<br>" : "") + (chkIdx >= ps.length
      ? '<span class="ok">' + t("ch.allOk") + '</span>' + t("ch.nowStrum") + '<button type="button" class="stopbtn" data-act="reset">' + t("ch.again") + '</button>'
      : t("ch.nextString", { s: ps[chkIdx].string, note: shortName(ps[chkIdx].midi) }) + (Mic.running ? "" : t("ch.micOff")));
    markRings();
  }
  // Yeni bir nota oturunca (tel tel modu). Oktav farkı kabul: perde bulucu bazen oktav kaçırır.
  function stringStep(r){
    const ps = playedStrings();
    if(chkIdx >= ps.length) return;
    const heard = r.written - T, exp = ps[chkIdx];
    if(chkIdx > 0 && (heard - ps[chkIdx-1].midi) % 12 === 0) return;      // önceki tel hâlâ tınlıyor
    if((heard - exp.midi) % 12 === 0){
      chkStatus[chkIdx] = "ok"; chkIdx++;
      renderStringCheck('<span class="ok">' + t("ch.stringOk", { s: exp.string }) + "</span>");
      // Sıra yalnızca doğru telde ilerler: sona varıldıysa bütün teller doğru çıkmıştır
      if(chkIdx >= ps.length) Bus.emit("achieve", { type:"chordClean", chord: chord.symbol });
    }else{
      chkStatus[chkIdx] = "bad";
      renderStringCheck('<span class="no">' + t("ch.stringBad", { s: exp.string, want: shortName(exp.midi), heard: shortName(heard) }) + "</span>" + t("ch.stringBadTip"));
    }
  }
  // Tümü modu: ~150 ms'de bir kromagram; sesler arası geçişte titremesin diye ortalanır
  function strumStep(now, loud, buf, sr){
    if(!loud){ avgChroma = null; return; }
    if(now - lastChromaT < 150) return;
    lastChromaT = now;
    const ch = chroma(buf, sr);
    avgChroma = avgChroma ? avgChroma.map((v, i) => 0.6*v + 0.4*ch[i]) : ch;
    const res = chordCheck(avgChroma, chord, capo), best = matchChords(avgChroma)[0];
    const tones = res.tones.map(x => '<span class="tone">' +
      (x.heard ? '<span class="ok">✓</span>' : x.optional ? "–" : '<span class="no">✗</span>') +
      " " + shortName(x.pc) + " <small>(" + roleLabel(x.role) + ")</small></span>").join("");
    let verdict = res.ok ? '<span class="ok">' + t("ch.clean", { c: chord.symbol }) + "</span>" : '<span class="no">' + t("ch.notYet") + '</span>';
    const missing = res.tones.filter(x => !x.heard && !x.optional);
    if(missing.length) verdict += t("ch.missing", { list: missing.map(x => shortName(x.pc)).join(", ") });
    if(res.extra.length) verdict += t("ch.extraNotes", { list: res.extra.map(shortName).join(", ") });
    if(!res.ok && !capo && best.chord !== chord && best.score > 0.85) verdict += "<br>" + t("ch.soundsLike", { c: best.chord.symbol });
    cresEl.innerHTML = tones + "<br>" + verdict;
  }

  // ---- Akor değiştirme alıştırması: 60 saniyede iki akor arasında temiz geçiş sayısı ----
  const chaEl = $("cha"), chbEl = $("chb"), chStart = $("chstart"), chCount = $("chcount"), chTime = $("chtime"),
        chNow = $("chnow"), chBest = $("chbest"), chMsg = $("chmsg"), CH_HINT = () => "";
  for(const c of CHORDS){ chaEl.appendChild(new Option(c.symbol, c.symbol)); chbEl.appendChild(new Option(c.symbol, c.symbol)); }
  const pair0 = store.get("changePair", ["Em", "Am"]);
  chaEl.value = pair0[0]; chbEl.value = pair0[1];
  let ch = null;            // { counter, end, timer }
  const pairKey = () => [chaEl.value, chbEl.value].sort().join("-");
  function showBest(){ const b = store.get("changeBest", {})[pairKey()]; chBest.textContent = b ? t("ch.perMin", { n: b }) : "—"; }
  [chaEl, chbEl].forEach(el => el.addEventListener("change", () => { stopChange(); store.set("changePair", [chaEl.value, chbEl.value]); showBest(); }));
  chStart.addEventListener("click", () => ch ? stopChange(t("ch.stopped")) : startChange());
  async function startChange(){
    if(chaEl.value === chbEl.value){ chMsg.textContent = t("ch.twoChords"); return; }
    Bus.emit("stopall");
    if(!Mic.running && !(await Mic.start())){ chMsg.textContent = t("ch.noMic"); return; }
    const a = chordBySymbol(chaEl.value), b = chordBySymbol(chbEl.value);
    ch = { counter: new ChangeCounter(a, b, { capo }), end: performance.now() + 60000, last: 0 };
    chCount.textContent = "0"; chStart.textContent = t("ch.stop"); chNow.textContent = "—";
    chMsg.textContent = t("ch.startWith", { a: a.symbol, b: b.symbol });
    ch.timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((ch.end - performance.now())/1000));
      chTime.textContent = left + " s";
      if(left === 0) finishChange();
    }, 200);
  }
  function stopChange(msg){
    if(!ch) return;
    clearInterval(ch.timer); ch = null;
    chStart.textContent = t("ch.start"); chTime.textContent = "60 s";
    if(msg) chMsg.textContent = msg;
  }
  function finishChange(){
    const n = ch.counter.changes, a = chaEl.value, b = chbEl.value;
    stopChange();
    const best = store.get("changeBest", {}), k = pairKey(), rec = n > (best[k] || 0);
    if(rec){ best[k] = n; store.set("changeBest", best); }
    showBest();
    chMsg.innerHTML = t("ch.result", { n }) + (rec && n ? t("ch.record") : "") + ". " + t(n < 10 ? "ch.slow" : n < 25 ? "ch.ok" : "ch.great");
    Bus.emit("achieve", { type:"changes", pair:[a, b], perMin:n });
  }
  showBest();

  // ---- Sık akor dizilişleri ----
  const PROGS = [["Am","F","C","G"], ["C","G","Am","F"], ["G","D","Em","C"], ["Em","C","G","D"],
                 ["A","D","E","A"], ["Am","Dm","E7","Am"], ["Dm7","G7","Cmaj7"]];
  const progsEl = $("progs");
  let progTimer = null, progIdx = -1, progStep = 0;
  PROGS.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", t("ch.progAria", { p: p.join(", ") }));
    b.addEventListener("click", () => toggleProg(i));
    progsEl.appendChild(b);
  });
  function renderProgs(){
    [...progsEl.children].forEach((b, i) => {
      b.innerHTML = PROGS[i].map((sym, k) => i===progIdx && k===progStep ? '<span class="cur">' + sym + "</span>" : sym).join(" – ");
      b.setAttribute("aria-pressed", i===progIdx ? "true" : "false");
    });
  }
  function toggleProg(i){
    const was = progIdx;
    Bus.emit("stopall");
    if(was === i) return;
    progIdx = i; progStep = 0; progTick();
  }
  function progTick(){
    const c = chordBySymbol(PROGS[progIdx][progStep]);
    select(c); strum(c, 0.03); renderProgs();
    progTimer = setTimeout(() => { progStep = (progStep + 1) % PROGS[progIdx].length; progTick(); }, 2000);
  }
  function stopProg(){
    if(progIdx < 0) return;
    clearTimeout(progTimer); progIdx = -1; progStep = 0; renderProgs();
  }

  // ---- Olaylar ----
  Bus.on("note", ({ r, isNew }) => { if(isNew && checkMode === "strings") stringStep(r); });
  Bus.on("frame", ({ now, loud, buf, sr }) => {
    if(checkMode === "strum") strumStep(now, loud, buf, sr);
    if(ch && now - ch.last >= 150){
      ch.last = now;
      const changed = ch.counter.push(loud ? chroma(buf, sr) : null);
      if(changed) chCount.textContent = ch.counter.changes;
      const cur = ch.counter.current;
      chNow.textContent = cur === "a" ? chaEl.value : cur === "b" ? chbEl.value : "—";
    }
  });
  Bus.on("mic", on => { if(!on) stopChange(); if(on && checkMode !== "off") resetCheck(); });
  Bus.on("stopall", () => { stopVoices(); stopProg(); });
  Bus.on("range", drawChord);
  Bus.on("lang", () => {
    fillCapo(); buildChordList(); drawChord();
    if(checkMode === "off") cresEl.innerHTML = CRES_HINT(); else resetCheck();
    if(!ch){ chMsg.innerHTML = CH_HINT(); chStart.textContent = t("ch.start"); }
    showBest();
    [...progsEl.children].forEach((b, i) => b.setAttribute("aria-label", t("ch.progAria", { p: PROGS[i].join(", ") })));
  });

  buildChordList(); drawChord(); renderProgs();
  chStart.textContent = t("ch.start"); chMsg.innerHTML = CH_HINT(); cresEl.innerHTML = CRES_HINT();
  return {
    get current(){ return chord; },
    get capo(){ return capo; },
    voicing, diagram, PROGS, select,
    setCapo(n){ capo = Math.max(0, Math.min(7, n | 0)); capoEl.value = capo; store.set("capo", capo); drawChord(); resetCheck(); Bus.emit("capo", capo); },
    pane,
    openCheck(sym, mode){ const c = chordBySymbol(sym); if(c) select(c); pane("check"); setCheck(mode); },
    openChanges(a, b){ chaEl.value = a; chbEl.value = b; store.set("changePair", [a, b]); showBest();
                       pane("practice"); chMsg.innerHTML = CH_HINT(); }
  };
})();
