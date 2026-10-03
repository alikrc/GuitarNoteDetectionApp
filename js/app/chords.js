// Akorlar sekmesi: kutu şeması, tel tel talimat, çalma, capo, mikrofonla kontrol, akor değiştirme alıştırması, dizilişler.
const Chords = (() => {
  const cgroupsEl=$("cgroups"), clistEl=$("clist"), cdiag=$("cdiag"), cnameEl=$("cname"), cformEl=$("cformula"),
        cstepsEl=$("csteps"), ctipEl=$("ctip"), cresEl=$("cresult"), capoEl=$("capo"), capoTag=$("capotag"),
        CRES_HINT = cresEl.innerHTML;
  const FINGER_NAME = ["", "işaret", "orta", "yüzük", "serçe"];
  // Şemanın altında yer dar: görevler kısaltılır (k. = küçük, b. = büyük); tam adlar talimat listesinde
  const ROLE_SHORT = {"küçük üçlü":"k.3", "büyük üçlü":"b.3", "beşli":"5", "küçük yedili":"k.7", "büyük yedili":"b.7", "ikili":"2", "dörtlü":"4"};
  let chord = chordBySymbol(store.get("chord", "Am")) || chordBySymbol("Am");
  let cgroup = chord.group;
  let capo = Math.max(0, Math.min(7, store.get("capo", 0) | 0));
  for(let i = 0; i <= 7; i++) capoEl.appendChild(new Option(i === 0 ? "yok" : i + ". perde", i));
  capoEl.value = capo;
  capoEl.addEventListener("change", () => { capo = +capoEl.value; store.set("capo", capo); drawChord(); resetCheck(); Bus.emit("capo", capo); });
  const voicing = c => chordStrings(c, capo);

  function buildChordList(){
    cgroupsEl.replaceChildren(...CHORD_GROUPS.map((name, i) =>
      radioBtn(name, i===cgroup, () => { cgroup = i; buildChordList(); })));
    const list = CHORDS.filter(c => c.group === cgroup);
    clistEl.replaceChildren(...list.map(c => {
      const b = radioBtn(c.symbol, c===chord, () => select(c));
      b.title = c.name; b.setAttribute("aria-label", c.name + " (" + c.symbol + ")");
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
        svg.appendChild(svgEl("text", {class:"cd-role", x, y:CY0+5*CROW+32}, ROLE_SHORT[r.role] || r.role));
      }
    }
    svg.setAttribute("aria-label", c.name + " akor şeması: " + rows.map(r => r.string + ". tel " +
      (r.muted ? "çalınmaz" : r.fret===0 ? "açık" : r.fret + ". perde " + FINGER_NAME[r.finger] + " parmağı")).join(", "));
  }
  function drawChord(){
    const c = chord, rows = voicing(c);
    diagram(cdiag, c);
    cnameEl.innerHTML = c.name + " <em>" + c.symbol + "</em>";
    capoTag.textContent = capo ? "Capo " + capo + ". perdede: bu şekil " + soundingName(c, capo) + " (" + soundingSymbol(c, capo) + ") olarak duyulur" : "";
    const t = CHORD_TYPES[c.type], pcs = chordPcs(c, capo), sounded = new Set(rows.filter(r => !r.muted).map(r => r.midi % 12));
    cformEl.innerHTML = t.formula + " → " + pcs.map((pc, i) =>
      "<b>" + shortName(pc) + "</b> (" + INTERVAL_TR[t.iv[i]] + (sounded.has(pc) ? "" : ", bu şekilde yok") + ")").join(" · ");

    cstepsEl.replaceChildren(...rows.map(r => {
      const li = document.createElement("li");
      if(r.muted) li.className = "idle";
      const part = document.createElement("span"); part.className = "part"; part.textContent = r.string + ". tel";
      const body = document.createElement("span");
      body.textContent = r.muted ? "çalma ✕"
        : r.fret === 0 ? "açık · " + shortName(r.midi) + " (" + r.role + ")"
        : r.fret + ". perde, " + FINGER_NAME[r.finger] + " parmağı" + (inBarre(c, r) ? " (barre)" : "") +
          " · " + shortName(r.midi) + " (" + r.role + ")";
      li.append(part, body);
      return li;
    }));

    const tips = [];
    if(getTuning() !== "standart")
      tips.push('<span class="warn">Seçili akort “' + TUNINGS[getTuning()].name + '”: bu şekiller standart akort içindir, farklı ses verir.</span>');
    if(c.barre){
      const b = c.barre, who = FINGER_NAME[c.fingers[6-b.from]];
      tips.push(b.from - b.to >= 4
        ? "Barre: " + who + " parmağını düz tutup kemik tarafıyla " + b.fret + ". perdede " + b.from + "–" + b.to + ". telleri birden bastır; başparmak sapın arkasında, orta parmak hizasında dursun."
        : "Küçük barre: " + who + " parmağı " + b.fret + ". perdede " + b.from + " ve " + b.to + ". telleri birden bastırır.");
    }
    const first = rows.find(r => !r.muted);
    if(first.string < 6) tips.push("× olan telleri çalma; vuruşa " + first.string + ". telden başla.");
    tips.push("Parmak uçlarıyla, perde telinin hemen gerisine bas; komşu tele değmesin. Tel tel çalıp her telin net çıktığını dinle.");
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
    if(checkMode === "off") cresEl.innerHTML = CRES_HINT;
    else if(checkMode === "strings") renderStringCheck("");
    else cresEl.innerHTML = "Akoru bir kerede çal; duyulan sesleri burada göstereceğim.";
    markRings();
  }
  cresEl.addEventListener("click", e => { if(e.target.closest("[data-act=reset]")) resetCheck(); });
  function markRings(){
    cdiag.querySelectorAll(".cd-ring").forEach(e => e.classList.remove("next"));
    cdiag.querySelectorAll(".cd-note").forEach(e => e.classList.remove("good", "bad"));
    if(checkMode !== "strings") return;
    const ps = playedStrings();
    ps.forEach((r, i) => {
      const n = cdiag.querySelector("#cn-" + r.string);
      if(n && chkStatus[i]) n.classList.add(chkStatus[i]==="ok" ? "good" : "bad");
    });
    if(chkIdx < ps.length){ const ring = cdiag.querySelector("#cr-" + ps[chkIdx].string); if(ring) ring.classList.add("next"); }
  }
  function renderStringCheck(msg){
    const ps = playedStrings();
    cresEl.innerHTML = (msg ? msg + "<br>" : "") + (chkIdx >= ps.length
      ? '<span class="ok">Tüm teller doğru ✓</span> Şimdi akoru bir kerede çal. <button type="button" class="stopbtn" data-act="reset">Baştan</button>'
      : "Sıradaki: <b>" + ps[chkIdx].string + ". tel</b> → " + shortName(ps[chkIdx].midi) +
        (Mic.running ? "" : " · mikrofon kapalı"));
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
      renderStringCheck('<span class="ok">' + exp.string + ". tel doğru ✓</span>");
      // Sıra yalnızca doğru telde ilerler: sona varıldıysa bütün teller doğru çıkmıştır
      if(chkIdx >= ps.length) Bus.emit("achieve", { type:"chordClean", chord: chord.symbol });
    }else{
      chkStatus[chkIdx] = "bad";
      renderStringCheck('<span class="no">' + exp.string + ". tel: " + shortName(exp.midi) + " bekleniyordu, " +
        shortName(heard) + " duyuldu.</span> Doğru teli ve perdeyi kontrol et; parmak komşu tele değiyorsa tel boğuk çıkar.");
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
      " " + shortName(x.pc) + " <small>(" + x.role + ")</small></span>").join("");
    let verdict = res.ok ? '<span class="ok">' + chord.symbol + " temiz çıkıyor ✓</span>" : '<span class="no">Tam değil</span>';
    const missing = res.tones.filter(x => !x.heard && !x.optional);
    if(missing.length) verdict += " — duyulmayan: " + missing.map(x => shortName(x.pc)).join(", ") + " (o sesi veren tel boğuk olabilir)";
    if(res.extra.length) verdict += " — akorda olmayan: " + res.extra.map(shortName).join(", ") + " (yanlış perde ya da susturulmamış tel)";
    if(!res.ok && !capo && best.chord !== chord && best.score > 0.85) verdict += "<br>Duyulan daha çok " + best.chord.symbol + " akoruna benziyor.";
    cresEl.innerHTML = tones + "<br>" + verdict;
  }

  // ---- Akor değiştirme alıştırması: 60 saniyede iki akor arasında temiz geçiş sayısı ----
  const chaEl = $("cha"), chbEl = $("chb"), chStart = $("chstart"), chCount = $("chcount"), chTime = $("chtime"),
        chNow = $("chnow"), chBest = $("chbest"), chMsg = $("chmsg"), CH_HINT = chMsg.innerHTML;
  for(const c of CHORDS){ chaEl.appendChild(new Option(c.symbol, c.symbol)); chbEl.appendChild(new Option(c.symbol, c.symbol)); }
  const pair0 = store.get("changePair", ["Em", "Am"]);
  chaEl.value = pair0[0]; chbEl.value = pair0[1];
  let ch = null;            // { counter, end, timer }
  const pairKey = () => [chaEl.value, chbEl.value].sort().join("-");
  function showBest(){ const b = store.get("changeBest", {})[pairKey()]; chBest.textContent = b ? b + " /dk" : "—"; }
  [chaEl, chbEl].forEach(el => el.addEventListener("change", () => { stopChange(); store.set("changePair", [chaEl.value, chbEl.value]); showBest(); }));
  chStart.addEventListener("click", () => ch ? stopChange("Durduruldu.") : startChange());
  async function startChange(){
    if(chaEl.value === chbEl.value){ chMsg.textContent = "İki farklı akor seç."; return; }
    Bus.emit("stopall");
    if(!Mic.running && !(await Mic.start())){ chMsg.textContent = "Mikrofon açılamadı; alıştırma mikrofonla sayar."; return; }
    const a = chordBySymbol(chaEl.value), b = chordBySymbol(chbEl.value);
    ch = { counter: new ChangeCounter(a, b, { capo }), end: performance.now() + 60000, last: 0 };
    chCount.textContent = "0"; chStart.textContent = "Durdur"; chNow.textContent = "—";
    chMsg.textContent = a.symbol + " ile başla, sonra " + b.symbol + "'ye geç ve böyle devam et.";
    ch.timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((ch.end - performance.now())/1000));
      chTime.textContent = left + " s";
      if(left === 0) finishChange();
    }, 200);
  }
  function stopChange(msg){
    if(!ch) return;
    clearInterval(ch.timer); ch = null;
    chStart.textContent = "Başlat"; chTime.textContent = "60 s";
    if(msg) chMsg.textContent = msg;
  }
  function finishChange(){
    const n = ch.counter.changes, a = chaEl.value, b = chbEl.value;
    stopChange();
    const best = store.get("changeBest", {}), k = pairKey(), rec = n > (best[k] || 0);
    if(rec){ best[k] = n; store.set("changeBest", best); }
    showBest();
    chMsg.innerHTML = "<b>" + n + " geçiş / dakika</b>" + (rec && n ? " — yeni rekor!" : "") + ". " +
      (n < 10 ? "Yavaş ve temiz çal; hız sonra gelir. Parmakları şekil olarak birlikte taşı." :
       n < 25 ? "İyi gidiyor. Ortak parmakları (iki akorda aynı yerde olanları) kaldırmadan geçmeyi dene." :
       "Çok iyi! Şimdi bu iki akoru bir vuruş kalıbıyla çal (Ritim sekmesi).");
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
    b.type = "button"; b.setAttribute("aria-label", p.join(", ") + " dizilişini çal");
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

  buildChordList(); drawChord(); renderProgs();
  return {
    get current(){ return chord; },
    get capo(){ return capo; },
    voicing, diagram, PROGS, select,
    openCheck(sym, mode){ const c = chordBySymbol(sym); if(c) select(c); setCheck(mode); },
    openChanges(a, b){ chaEl.value = a; chbEl.value = b; store.set("changePair", [a, b]); showBest();
                       $("change").scrollIntoView({ block:"start" }); chMsg.innerHTML = CH_HINT; }
  };
})();
