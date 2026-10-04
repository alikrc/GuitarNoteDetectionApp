// Sap ve notalar sekmesi: duyulan nota ve sapma göstergesi, gitar sapı, konum talimatı, dizek, nota şeridi,
// klavyeden çalma, entonasyon izi.
const Sap = (() => {
  const noteEl=$("perde"), subEl=$("koma"), needle=$("needle"), centtxt=$("centtxt"), track=$("track");
  const writtenEl=$("written"), soundEl=$("sounding"), hzEl=$("hz"),
        fcode=$("fcode"), regEl=$("reg"), fnote=$("fnote"), stepsEl=$("steps"), announce=$("announce");

  const tr1 = x => x.toFixed(1).replace(".", ",");

  // ---- Gösterge ölçeği: tampere notadan sapma, ±50 sent; ±5 sent yeşil ----
  const SCALE = { max:50, ticks:[-50,-25,0,25,50], ok:5 };
  (function drawScale(){
    const zone = document.createElement("div");
    zone.className = "zone";
    zone.style.left = (50 - SCALE.ok/SCALE.max*50) + "%"; zone.style.width = (SCALE.ok/SCALE.max*100) + "%";
    track.insertBefore(zone, needle);
    SCALE.ticks.forEach(v => {
      const pos = 50 + v/SCALE.max*50;
      const t = document.createElement("div");
      t.className = "tick" + (v===0 ? " mid" : ""); t.style.left = pos + "%";
      const l = document.createElement("div");
      l.className = "ticklab"; l.style.left = Math.min(94, Math.max(6, pos)) + "%";
      l.textContent = (v>0 ? "+" : v<0 ? "−" : "") + Math.abs(v);
      track.insertBefore(t, needle); track.insertBefore(l, needle);
    });
  })();

  // ---- Gitar sapı ----
  const neck = $("neck");
  const NUT_Y = 58, BOARD_L = 57, BOARD_R = 273;
  // Sap boyu perde sayısıyla uzar (20 perdede 640). Gerçek sapta perde aralığı 2^(-1/12) oranında daralır;
  // burada yarı oranla daralıyor ki tiz perdeler de dokunulabilir kalsın.
  let END_Y = 640, SCALE_L = 1;
  const fretY = n => NUT_Y + SCALE_L * (1 - Math.pow(2, -n/24));
  const posY = f => f===0 ? 30 : (fretY(f-1) + fretY(f)) / 2;
  const strX = s => 75 + (6-s)*36;                       // 6. tel solda
  const posEls = new Map();                              // "s-f" → <g>
  let focusS = 3, focusF = 0;                            // klavyeyle sapta gezinmede odaktaki konum
  function buildNeck(){
    END_Y = NUT_Y + 29.1*FRETS;
    SCALE_L = (END_Y - NUT_Y) / (1 - Math.pow(2, -FRETS/24));
    neck.replaceChildren(); posEls.clear();
    neck.setAttribute("viewBox", "0 0 320 " + Math.round(END_Y + 20));
    neck.appendChild(svgEl("rect", {class:"board", x:BOARD_L, y:NUT_Y, width:BOARD_R-BOARD_L, height:END_Y-NUT_Y+10, rx:3}));
    for(const n of [3,5,7,9,15,17,19,21].filter(n => n <= FRETS))
      neck.appendChild(svgEl("circle", {class:"inlay", cx:165, cy:posY(n), r:5}));
    for(const n of [12,24].filter(n => n <= FRETS)){
      neck.appendChild(svgEl("circle", {class:"inlay", cx:129, cy:posY(n), r:5}));
      neck.appendChild(svgEl("circle", {class:"inlay", cx:201, cy:posY(n), r:5}));
    }
    for(let n=1; n<=FRETS; n++){
      neck.appendChild(svgEl("line", {class:"fret", x1:BOARD_L, x2:BOARD_R, y1:fretY(n), y2:fretY(n)}));
      neck.appendChild(svgEl("text", {class:"fnum", x:BOARD_L-8, y:posY(n)+3.5}, String(n)));
    }
    neck.appendChild(svgEl("rect", {class:"nut", x:BOARD_L, y:NUT_Y-6, width:BOARD_R-BOARD_L, height:7, rx:1.5}));
    for(let s=1; s<=6; s++){
      neck.appendChild(svgEl("line", {class:"str", x1:strX(s), x2:strX(s), y1:NUT_Y-6, y2:END_Y+10,
        "stroke-width": (0.9 + (s-1)*0.32).toFixed(2)}));
      neck.appendChild(svgEl("text", {class:"slab", x:strX(s), y:12}, s + "."));
    }
    for(let s=6; s>=1; s--) for(let f=0; f<=FRETS; f++){
      const top = f===0 ? 16 : fretY(f-1), bot = f===0 ? 46 : fretY(f);
      const g = svgEl("g", {class:"pos" + (f===0 ? " open" : ""), id:"p-"+s+"-"+f,
        role:"button", tabindex:"-1", "aria-pressed":"false"});
      g.appendChild(svgEl("rect", {class:"hit", x:strX(s)-18, y:top, width:36, height:bot-top}));
      g.appendChild(svgEl("circle", {cx:strX(s), cy:posY(f), r: f===0 ? 11 : 10.5}));
      g.appendChild(svgEl("text", {x:strX(s), y:posY(f)+3.4}));
      g.addEventListener("click", () => { focusPos(s, f, false); chartPress(s, f); });
      neck.appendChild(g);
      posEls.set(s+"-"+f, g);
    }
    // Klavye odağı yeni sapta da geçerli bir konumda kalsın
    focusF = Math.min(focusF, FRETS);
    posEls.get(focusS+"-"+focusF).setAttribute("tabindex", "0");
  }
  // Açık tel dairelerinde telin akort notası, diğer konumlarda (seçilince görünen) nota adı
  function labelOpenStrings(){
    posEls.forEach((g, key) => {
      const [s, f] = key.split("-").map(Number);
      const w = positionNote(s, f);
      g.querySelector("text").textContent = shortName(w);
      g.setAttribute("aria-label", s + ". tel, " + (f===0 ? "açık" : f + ". perde") + ": " + noteName(w).tr + " (yazılı)");
    });
  }
  // Klavyeyle sapta gezinme: tek bir konum sekme sırasında; oklar tel/perde değiştirir
  function focusPos(s, f, move=true){
    const old = posEls.get(focusS+"-"+focusF);
    if(old) old.setAttribute("tabindex", "-1");
    focusS = s; focusF = f;
    const g = posEls.get(s+"-"+f);
    g.setAttribute("tabindex", "0");
    if(move) g.focus();
  }
  neck.addEventListener("keydown", e => {
    const mv = {ArrowLeft:[1,0], ArrowRight:[-1,0], ArrowUp:[0,-1], ArrowDown:[0,1]}[e.key];
    if(mv){
      e.preventDefault(); e.stopPropagation();
      focusPos(Math.min(6, Math.max(1, focusS+mv[0])), Math.min(FRETS, Math.max(0, focusF+mv[1])));
    }else if(e.key === "Enter" || e.key === " "){
      e.preventDefault(); e.stopPropagation();
      chartPress(focusS, focusF);
    }
  });
  // Seçili konum dolu, aynı sesin diğer konumları kesik çizgili
  function paint(sel, others){
    posEls.forEach(g => { g.classList.remove("on", "alt"); g.setAttribute("aria-pressed", "false"); });
    for(const p of others){ posEls.get(p.string+"-"+p.fret).classList.add("alt"); }
    if(sel){
      const g = posEls.get(sel.string+"-"+sel.fret);
      g.classList.remove("alt"); g.classList.add("on"); g.setAttribute("aria-pressed", "true");
    }
  }

  // ---- Saptan çal: bir konuma dokun ----
  const manualMsg = $("manualmsg"), MANUAL_HINT = manualMsg.textContent;
  function chartPress(s, f){
    const w = positionNote(s, f);
    const cur = fingerList[fingerIdx];
    if(current === w && cur && cur.string === s && cur.fret === f){ stopNote(); return; }
    play(w);
    show(analyze(writtenFreq(w, T), T));
    selectFingering(fingerList.findIndex(p => p.string === s && p.fret === f));
    manualMsg.textContent = s + ". tel, " + (f===0 ? "açık" : f + ". perde") + " — " + noteName(w).tr + " yazılı";
  }

  // Notanın konumları arasında seçim: her konum bir düğme
  const altsEl = $("alts"), altNoteEl = $("altnote");
  let fingerList = [], fingerIdx = 0, fingerWritten = null;
  // Talimat bölümü açılıp kapanabilir; tercih tarayıcıda saklanır
  const detailEl = $("fingerdetail"), altCountEl = $("altcount");
  detailEl.open = store.get("detailOpen", true);
  detailEl.addEventListener("toggle", () => store.set("detailOpen", detailEl.open));

  const posLabel = p => p.string + ". tel · " + (p.fret===0 ? "açık" : p.fret);
  function showFingerings(list, written){
    fingerList = list; fingerWritten = written; fingerIdx = 0;
    altCountEl.textContent = list.length > 1 ? "· " + list.length + " konum" : "";
    manualMsg.textContent = MANUAL_HINT;
    altsEl.innerHTML = "";
    if(list.length > 1) list.forEach((p, i) => {
      const b = radioBtn(posLabel(p), false, () => selectFingering(i));
      b.setAttribute("aria-label", p.string + ". tel, " + (p.fret===0 ? "açık tel" : p.fret + ". perde") + (i===0 ? ", temel konum" : ""));
      altsEl.appendChild(b);
    });
    selectFingering(0);
  }
  function altNote(i){
    const p = fingerList[i];
    if(!p) return "";
    if(i===0) return fingerList.length > 1 ? "Temel konum: en alçak perde." : "";
    return p.fret >= 12
      ? "Aynı ses, kalın telde ve sapın tiz bölgesinde: daha koyu, yumuşak tını."
      : "Aynı ses, kalın telde: biraz daha koyu tını; pozisyon değiştirmeden çalmak için.";
  }
  function selectFingering(i){
    if(i < 0) i = 0;
    fingerIdx = i;
    [...altsEl.children].forEach((b, k) => {
      b.setAttribute("aria-checked", k===i ? "true" : "false");
      b.tabIndex = k===i ? 0 : -1;
    });
    altNoteEl.textContent = altNote(i);
    drawFingering(fingerList[i] || null, fingerWritten);
  }
  radioArrows(altsEl);

  // ---- Dizek: yazılı notanın gitar anahtarlı porte üzerindeki yeri ----
  // Yükseklik sabit (Re3'ün altından Sol6'ya kadar yer var) ki nota değişince sap oynamasın.
  const staffEl = $("staff");
  const STEP = 4, BASE = 72, NOTE_X = 104;          // alt çizgi (Mi4) y=72, adım başına 4 birim
  const sy = s => BASE - s*STEP;
  function drawStaff(written){
    staffEl.replaceChildren();
    for(let s = 0; s <= 8; s += 2) staffEl.appendChild(svgEl("line", {class:"sl", x1:4, x2:146, y1:sy(s), y2:sy(s)}));
    staffEl.appendChild(svgEl("text", {class:"clef", x:6, y:sy(-1.5)}, "𝄞"));
    staffEl.appendChild(svgEl("text", {class:"c8", x:19, y:sy(-5.5)}, "8"));
    if(written == null){ staffEl.setAttribute("aria-label", "Dizek: nota yok"); return; }
    const p = staffPos(written);
    for(let s = -2; s >= p.step; s -= 2)
      staffEl.appendChild(svgEl("line", {class:"ledger", x1:NOTE_X-11, x2:NOTE_X+11, y1:sy(s), y2:sy(s)}));
    for(let s = 10; s <= p.step; s += 2)
      staffEl.appendChild(svgEl("line", {class:"ledger", x1:NOTE_X-11, x2:NOTE_X+11, y1:sy(s), y2:sy(s)}));
    staffEl.appendChild(svgEl("ellipse", {class:"head", cx:NOTE_X, cy:sy(p.step), rx:5.6, ry:4,
      transform:"rotate(-20 " + NOTE_X + " " + sy(p.step) + ")"}));
    if(p.acc) staffEl.appendChild(svgEl("text", {class:"acc", x:NOTE_X-17, y:sy(p.step)+5}, p.acc));
    if(p.ottava) staffEl.appendChild(svgEl("text", {class:"va", x:NOTE_X-12, y:Math.min(sy(p.step), sy(10))-10}, "8va"));
    staffEl.setAttribute("aria-label", "Dizekte yazılı " + noteName(written).tr + (p.ottava ? ", 8va ile bir oktav aşağı yazılmış" : ""));
  }

  function drawFingering(pos, written){
    drawStaff(written);
    stepsEl.innerHTML = "";
    fnote.innerHTML = written!=null ? noteName(written).tr + " <em>yazılı</em>" : "—";
    paint(pos, fingerList);
    if(!pos){
      fcode.textContent = "—";
      const li = document.createElement("li"); li.className = "idle";
      const r = writtenRange();
      li.innerHTML = '<span class="part">—</span><span>Bu nota seçili akortta sapta yok (yazılı ' +
        noteName(r.low).tr + '–' + noteName(r.high).tr + ' arası).</span>';
      stepsEl.appendChild(li);
      return;
    }
    fcode.textContent = tabFor(pos);
    for(const r of describePosition(pos)){
      const li = document.createElement("li");
      if(!r.active) li.className = "idle";
      const part = document.createElement("span"); part.className = "part"; part.textContent = r.part;
      const body = document.createElement("span"); body.textContent = r.text;
      li.append(part, body);
      stepsEl.appendChild(li);
    }
  }

  // ---- Gösterim ----
  let lastShown = null, lastFingerKey = null;
  function show(r){
    lastShown = r;
    noteEl.textContent = r.writtenName.tr;
    subEl.textContent = r.inRange ? "duyulan " + r.soundingName.tr : "yazılı " + r.writtenName.tr + " — seçili akortta sapta yok";
    writtenEl.innerHTML = r.writtenName.tr + " <em>" + r.writtenName.en + "</em>";
    soundEl.innerHTML  = r.soundingName.tr + " <em>" + r.soundingName.en + "</em>";
    hzEl.innerHTML     = tr1(r.freq) + " <em>Hz</em>";
    const openTxt = r.openString ? " · açık " + r.openString + ". tel" : "";
    centtxt.textContent = "tampere notadan sapma: " + (r.cents>0?"+":"") + r.cents + " sent" + openTxt;
    needle.style.left = Math.max(0, Math.min(100, 50 + r.cents/SCALE.max*50)) + "%";
    needle.classList.toggle("good", Math.abs(r.cents) <= SCALE.ok);

    // Henüz iz yokken grafik ızgarasını gösterilen notaya ortala
    if(!trace.length){ traceCenter = r.pitch; drawTrace(); }

    regEl.textContent = r.inRange ? (r.positions.length === 1 ? "tek konum" : r.positions.length + " konumda çalınır") : "";
    const fk = r.inRange ? r.written : null;
    if(fk !== lastFingerKey){
      lastFingerKey = fk;
      showFingerings(r.positions, r.written);
    }
    markActive(fk);
  }
  const sample = () => analyze(writtenFreq(67, T), T);   // yazılı Sol4 = açık 3. tel

  // ---- Nota şeridi: tıkla / klavyeden çal ----
  const KEYCODES = [
    "KeyZ","KeyX","KeyC","KeyV","KeyB","KeyN","KeyM","Comma","Period","Slash",
    "KeyA","KeyS","KeyD","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL","Semicolon","Quote",
    "KeyQ","KeyW","KeyE","KeyR","KeyT","KeyY","KeyU","KeyI","KeyO","KeyP","BracketLeft","BracketRight",
    "Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9","Digit0","Minus","Equal"];
  const KEYLABEL = [
    "Z","X","C","V","B","N","M","Ö","Ç",".",
    "A","S","D","F","G","H","J","K","L","Ş","İ",
    "Q","W","E","R","T","Y","U","I","O","P","Ğ","Ü",
    "1","2","3","4","5","6","7","8","9","0","*","-"];
  const cells = new Map();
  let LOW = 0, HIGH = 0, layoutMap = null;

  // Şerit seçili akordun tüm aralığını kapsar; en tiz birkaç notanın klavye tuşu yok, yalnızca tıklanır.
  function buildStrip(){
    const r = writtenRange();
    LOW = r.low; HIGH = r.high;
    cells.clear(); $("rail").replaceChildren();
    for(let i = 0; i <= HIGH - LOW; i++){
      const w = LOW + i, p = positionsFor(w)[0];
      const key = layoutMap && layoutMap.get(KEYCODES[i]) ? layoutMap.get(KEYCODES[i]).toLocaleUpperCase("tr") : KEYLABEL[i];
      const el = document.createElement("button");
      el.className = "note"; el.type = "button";
      el.setAttribute("aria-label", "yazılı " + noteName(w).tr + " çal");
      // Kartın üstünde notanın temel konumu: tel · perde
      el.innerHTML = '<span class="pn">' + (p ? p.string + ". tel · " + (p.fret === 0 ? "açık" : p.fret) : "—") + '</span>' +
                     '<span class="nn">' + noteName(w).tr + '</span>' +
                     (key ? '<span class="kk">' + key + '</span>' : '');
      el.setAttribute("aria-pressed", "false");
      el.addEventListener("click", () => toggleNote(w));
      $("rail").appendChild(el);
      cells.set(w, el);
    }
    const keyed = Math.min(KEYCODES.length, HIGH - LOW + 1), extra = HIGH - LOW + 1 - keyed;
    $("striplegend").innerHTML = "Alt sıra <strong>Z…</strong> kalın teller, orta sıra <strong>A…</strong>, üst sıra <strong>Q…</strong>, rakam sırası <strong>1…</strong> tiz bölge — yazılı " +
      noteName(LOW).tr + "’ten " + noteName(HIGH).tr + "’ya " + (HIGH-LOW+1) + " nota" + (extra ? " (en tiz " + extra + " tanesi yalnızca tıklanır)" : "") +
      ". Kartın üstünde notanın temel konumu (tel · perde) yazar. Tuşlar klavyedeki fiziksel konuma göre çalışır; aynı tuş ya da Esc sesi durdurur.";
    if(lastShown) markActive(lastShown.inRange ? lastShown.written : null);
    markPlaying();
  }
  // Klavye düzeni Chrome'da okunabiliyorsa etiketleri gerçek harflerle değiştir
  if(navigator.keyboard && navigator.keyboard.getLayoutMap){
    navigator.keyboard.getLayoutMap().then(map => { layoutMap = map; buildStrip(); }).catch(() => {});
  }
  function markActive(w){ cells.forEach((el,k) => el.classList.toggle("on", k===w)); }

  // ---- Ses: aynı anda tek nota, aç/kapa; tel sesi kendiliğinden söner ----
  let current = null, voice = null, voiceTimer = null;       // çalan yazılı nota ve sesi
  const stopBtn = $("stopbtn");
  function markPlaying(){
    cells.forEach((el,k) => {
      el.classList.toggle("playing", k===current);
      el.setAttribute("aria-pressed", k===current ? "true" : "false");
    });
    stopBtn.disabled = current === null;
  }
  function play(w){
    Bus.emit("stopall");
    const a = Snd.ctx();
    voice = Snd.pluck(writtenFreq(w, T), a.currentTime, 0.32);
    current = w; markPlaying();
    const v = voice;
    voiceTimer = setTimeout(() => { if(voice === v){ voice = null; current = null; markPlaying(); } }, (v.end - a.currentTime)*1000);
  }
  function stopNote(){
    if(voice){ Snd.fadeOut(voice); clearTimeout(voiceTimer); voice = null; }
    current = null; markPlaying();
  }
  // Şeritten: çalmıyorsa başlat ve göster, aynı nota çalıyorsa durdur
  function toggleNote(w){
    if(current === w){ stopNote(); return; }
    play(w);
    show(analyze(writtenFreq(w, T), T));
  }
  stopBtn.addEventListener("click", stopNote);

  // Klavye yalnızca bu sekme açıkken nota çalar
  window.addEventListener("keydown", e => {
    if(Tabs.current !== "sap" || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if(tag === "select" || tag === "input" || tag === "textarea") return;
    const i = KEYCODES.indexOf(e.code);
    if(i < 0 || LOW + i > HIGH) return;
    e.preventDefault();
    toggleNote(LOW + i);
    cells.get(LOW + i).scrollIntoView({block:"nearest", inline:"nearest"});
  });

  // ---- Entonasyon izi: son 8 saniyede yazılı perde (yarım ses birimi); yatay çizgiler tampere notalar ----
  const canvas = $("trace"), TRACE_MS = 8000;
  const trace = [];          // {t, pitch} ya da {t, pitch:null} (sessizlik)
  let traceCenter = 67;
  function drawTrace(){
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if(!W || !H) return;
    if(canvas.width !== Math.round(W*dpr) || canvas.height !== Math.round(H*dpr)){
      canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    }
    const g = canvas.getContext("2d");
    g.setTransform(dpr,0,0,dpr,0,0);
    g.clearRect(0,0,W,H);
    const cs = getComputedStyle(document.documentElement);
    const col = n => cs.getPropertyValue(n).trim();
    const now = performance.now();
    while(trace.length && now - trace[0].t > TRACE_MS) trace.shift();
    const last = [...trace].reverse().find(p => p.pitch!==null);
    if(last) traceCenter += (last.pitch - traceCenter) * 0.25;
    const span = 2.5;                                 // görünen aralık: ±2,5 yarım ses
    const y = c => H/2 - (c - traceCenter)/span * (H/2 - 10);
    const LEFT = 52;
    g.font = "500 10px " + col("--ui");
    g.textBaseline = "middle";
    for(let n = Math.ceil(traceCenter - span); n <= traceCenter + span; n++){
      const yy = y(n);
      g.strokeStyle = col("--line"); g.lineWidth = 1;
      g.beginPath(); g.moveTo(LEFT, yy); g.lineTo(W, yy); g.stroke();
      g.fillStyle = col("--muted");
      g.fillText(noteName(n).tr, 8, yy);
    }
    g.strokeStyle = col("--accent"); g.lineWidth = 2; g.lineJoin = "round";
    g.beginPath();
    let pen = false;
    for(const p of trace){
      if(p.pitch===null){ pen = false; continue; }
      const x = LEFT + (1 - (now - p.t)/TRACE_MS) * (W - LEFT);
      const yy = Math.max(2, Math.min(H-2, y(p.pitch)));
      if(pen) g.lineTo(x, yy); else { g.moveTo(x, yy); pen = true; }
    }
    g.stroke();
  }
  window.addEventListener("resize", drawTrace);

  // Bağlantıyla belirli bir notayı aç: #nota=67 (yazılı MIDI numarası, seçili akordun aralığında)
  function fromHash(){
    const m = /nota=(\d+)/.exec(location.hash);
    const w = m ? +m[1] : NaN;
    return w>=LOW && w<=HIGH ? analyze(writtenFreq(w, T), T) : null;
  }
  window.addEventListener("hashchange", () => { const r = fromHash(); if(r && !Mic.running) show(r); });

  // ---- Mikrofon ve ayar olayları ----
  Bus.on("note", ({ r, now, isNew }) => {
    show(r);
    noteEl.style.opacity = 1;
    trace.push({ t: now, pitch: r.pitch });
    if(isNew) announce.textContent = "yazılı " + r.writtenName.tr;
    if(Tabs.current === "sap") drawTrace();
  });
  Bus.on("silence", () => {
    noteEl.style.opacity = .45;
    if(trace.length && trace[trace.length-1].pitch !== null) trace.push({ t: performance.now(), pitch: null });
    if(Tabs.current === "sap") drawTrace();
  });
  Bus.on("mic", on => { noteEl.classList.toggle("resting", !on); noteEl.style.opacity = 1; });
  Bus.on("stopall", stopNote);
  Bus.on("range", ev => {
    if(ev.instrument) buildNeck();
    labelOpenStrings(); buildStrip();
    lastFingerKey = null;
    const w = lastShown ? lastShown.written : null;
    show(w !== null && positionsFor(w).length ? analyze(writtenFreq(w, T), T) : sample());
  });
  Bus.on("a4", () => { trace.length = 0; if(!Mic.running) show(lastShown ? analyze(writtenFreq(lastShown.written, T), T) : sample()); });
  Bus.on("tab", id => { if(id === "sap") drawTrace(); });

  buildNeck(); labelOpenStrings(); focusPos(3, 0, false);
  buildStrip();
  show(fromHash() || sample());
  return { show };
})();
