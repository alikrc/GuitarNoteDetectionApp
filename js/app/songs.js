// Şarkılar sekmesi: akorlu söz sayfası, ritim motoruyla dinleme ve birlikte çalma, kendi şarkını yazma.
const Songs = (() => {
  const selEl=$("songsel"), rhyEl=$("songrhy"), bpmEl=$("songbpm"), metaEl=$("songmeta"), sheetEl=$("songsheet"),
        chordsEl=$("songchords"), nowEl=$("songnow"), resEl=$("songres"), stopBtn=$("songstop"),
        titleEl=$("songtitle"), textEl=$("songtext"), errEl=$("songerr"), RES_HINT = resEl.innerHTML;
  let user = store.get("songs", []);            // [{ id, title, text, rhythm, bpm, capo?, source? }]
  let song = null, parsed = null, playing = null, totals = null;

  for(const r of RHYTHMS) rhyEl.appendChild(new Option(r.name + " · " + r.meter.split(" ")[0], r.id));
  function all(){ return [...SONGS, ...user]; }
  function buildSelect(){
    selEl.replaceChildren();
    for(const [g, label] of [["tr", "Türkçe pop / rock"], ["turku", "Türküler (anonim)"], ["pd", "Yabancı (kamu malı)"], ["ex", "Alıştırmalar"]]){
      const og = document.createElement("optgroup"); og.label = label;
      SONGS.filter(s => s.group === g).forEach(s => og.appendChild(new Option(s.artist ? s.artist + " — " + s.title : s.title, s.id)));
      selEl.appendChild(og);
    }
    if(user.length){
      const g2 = document.createElement("optgroup"); g2.label = "Benim şarkılarım";
      user.forEach(s => g2.appendChild(new Option(s.title, s.id)));
      selEl.appendChild(g2);
    }
  }
  function load(id){
    song = all().find(s => s.id === id) || SONGS[0];
    selEl.value = song.id; store.set("song", song.id);
    rhyEl.value = song.rhythm; bpmEl.value = song.bpm;
    metaEl.textContent = song.meta || "Kendi şarkın";
    if(song.source){
      const a = document.createElement("a");
      a.href = song.source; a.target = "_blank"; a.rel = "noopener"; a.textContent = "kaynak akor sayfası";
      metaEl.append(" · ", a);
    }
    // Hazır şarkının capo'su Akorlar sekmesindeki capo'ya uygulanır
    if(song.capo !== undefined && song.capo !== Chords.capo) Chords.setCapo(song.capo);
    $("songlyrnote").textContent = song.lyricsNote ? song.lyricsNote + " İstersen “Sözleri kendin ekle” ile kendi tarayıcında ekleyebilirsin." : "";
    $("songlyrbtn").hidden = !song.lyricsNote;
    titleEl.value = song.id.startsWith("u-") ? song.title : "";
    textEl.value = song.id.startsWith("u-") ? song.text : "";
    $("songdel").disabled = !song.id.startsWith("u-");
    render();
  }
  selEl.addEventListener("change", () => { Bus.emit("stopall"); load(selEl.value); });

  function render(){
    parsed = parseSong(song.text);
    sheetEl.replaceChildren(...parsed.lines.map(line => {
      const div = document.createElement("div"); div.className = "sline";
      for(const seg of line){
        const s = document.createElement("span");
        s.className = "sseg" + (seg.raw && !seg.chord ? " bad" : "");
        if(seg.bar !== null){ s.dataset.bar = seg.bar; s.dataset.bars = seg.bars; }
        const label = seg.raw ? (seg.chord || seg.raw) + (seg.bars > 1 ? " ×" + seg.bars : "") : "";
        s.innerHTML = '<b class="sch"></b><span class="sly"></span>';
        s.firstChild.textContent = label;
        s.lastChild.textContent = seg.lyric || (seg.raw ? " " : "");
        div.appendChild(s);
      }
      return div;
    }));
    // Şarkıdaki akorlar (capo hesaba katılmadan şekil olarak)
    const used = [...new Set(parsed.bars)];
    chordsEl.replaceChildren(...used.map(sym => {
      const c = chordBySymbol(sym), box = document.createElement("div");
      box.className = "mini-chord";
      const svg = svgEl("svg", { viewBox:"0 0 220 246", role:"img" });
      Chords.diagram(svg, c, { compact:true });
      box.append(svg, document.createTextNode(Chords.capo ? sym + " → " + soundingSymbol(c, Chords.capo) : sym));
      return box;
    }));
    errEl.textContent = parsed.errors.length ? "Tanınmayan akor: " + parsed.errors.join(", ") : "";
    nowEl.textContent = "";
  }
  function highlight(bar){
    sheetEl.querySelectorAll(".sseg").forEach(s => {
      const b = +s.dataset.bar, n = +s.dataset.bars;
      s.classList.toggle("now", s.dataset.bar !== undefined && bar >= b && bar < b + n);
    });
    const cur = sheetEl.querySelector(".sseg.now");
    if(cur) cur.scrollIntoView({ block:"nearest", inline:"nearest" });
  }

  async function play(mode){
    if(!parsed.bars.length){ resEl.textContent = "Bu şarkıda tanınan akor yok."; return; }
    const rhythm = rhythmById(rhyEl.value), bpm = Math.min(160, Math.max(40, +bpmEl.value || song.bpm));
    totals = { hits:0, ok:0, extra:0, list:[] };
    resEl.innerHTML = mode === "play" ? "Bir ölçü sayıyorum, sonra çal." + (Rhythm.latencyMeasured ? "" :
      ' <span class="warn">Gecikme ölçülmedi (Ritim sekmesi → “Gecikmeyi ölç”); sonuçlarda sabit bir kayma olabilir.</span>') : RES_HINT;
    const id = song.id, bars = parsed.bars;
    const ok = await Rhythm.start({
      mode, rhythm, bpm, click: mode === "play", countIn: true, maxBars: bars.length,
      chordAt: b => chordBySymbol(bars[b]),
      onSlot: k => {
        const n = rhythm.slots.length, bar = Math.floor(k / n);
        if(k < 0){ nowEl.textContent = "Hazır… " + rhythm.beats.filter(x => x <= k + n).map((_, j) => j+1).join(" "); return; }
        highlight(bar);
        nowEl.textContent = "Şimdi: " + bars[bar] + (bars[bar+1] ? " · sonra: " + bars[bar+1] : " · son ölçü");
      },
      onEval: res => {
        totals.list.push(res);
        totals.hits += res.hits.length; totals.ok += res.hits.filter(h => h.verdict === "ok").length; totals.extra += res.extra;
        resEl.innerHTML = "Şu ana kadar: " + Rhythm.summarize(totals.list).html;
      },
      onEnd: () => {
        if(mode === "play"){
          const s = Rhythm.summarize(totals.list);
          resEl.innerHTML = "Şarkı bitti. Bütün şarkı: " + s.html;
          Bus.emit("achieve", { type:"song", id, pct: s.pct });
        }else resEl.innerHTML = "Şarkı bitti. Şimdi “Birlikte çal” ile sen çal.";
      },
      onStop: () => { playing = null; stopBtn.disabled = true; highlight(-1); nowEl.textContent = ""; }
    });
    if(!ok){ resEl.textContent = "Mikrofon açılamadı; birlikte çalmak için mikrofon izni gerekir."; return; }
    playing = mode; stopBtn.disabled = false;
  }
  $("songdemo").addEventListener("click", () => play("demo"));
  $("songplay").addEventListener("click", () => play("play"));
  stopBtn.addEventListener("click", () => Rhythm.stop());

  // ---- Kendi şarkın ----
  textEl.addEventListener("input", () => {
    const p = parseSong(textEl.value);
    errEl.textContent = p.errors.length ? "Tanınmayan akor: " + p.errors.join(", ") : p.bars.length ? p.bars.length + " ölçü, akorlar tamam." : "";
  });
  $("songsave").addEventListener("click", () => {
    const p = parseSong(textEl.value);
    if(!p.bars.length){ errEl.textContent = "En az bir akor yaz: [Am] gibi."; return; }
    if(p.errors.length){ errEl.textContent = "Önce tanınmayan akorları düzelt: " + p.errors.join(", "); return; }
    const title = titleEl.value.trim() || "Adsız şarkı";
    let s = song && song.id.startsWith("u-") ? user.find(u => u.id === song.id) : null;
    if(!s){ s = { id: "u-" + Date.now() }; user.push(s); }
    Object.assign(s, { title, text: textEl.value, rhythm: rhyEl.value, bpm: Math.min(160, Math.max(40, +bpmEl.value || 80)) });
    if(draft){ if(draft.capo) s.capo = draft.capo; if(draft.source) s.source = draft.source; draft = null; }
    store.set("songs", user);
    buildSelect(); load(s.id);
    errEl.textContent = "Kaydedildi (yalnızca bu tarayıcıda).";
  });
  // Hazır şarkıyı sözlü kopyaya dönüştürmek: akorlar editöre gelir, sözleri kullanıcı yapıştırır
  let draft = null;
  $("songlyrbtn").addEventListener("click", () => {
    draft = { capo: song.capo || 0, source: song.source || null };
    const base = song;
    song = { id:"u-yeni", title:"", text:"", rhythm: base.rhythm, bpm: base.bpm };
    titleEl.value = (base.artist && !base.artist.startsWith("Anonim") && base.artist !== "Geleneksel" ? base.artist + " — " : "") + base.title + " (sözlü)";
    textEl.value = base.text; $("songlyrics").value = "";
    $("songdel").disabled = true;
    errEl.textContent = "Akorlar kopyalandı. Sözleri aşağıya yapıştırıp “Akorlarla eşleştir”e bas, sonra Kaydet.";
    $("songeditor").open = true;
    $("songlyrics").focus();
  });
  $("songmerge").addEventListener("click", () => {
    const lyr = $("songlyrics").value;
    if(!lyr.trim()){ errEl.textContent = "Önce sözleri yapıştır."; return; }
    textEl.value = mergeLyrics(textEl.value, lyr);
    textEl.dispatchEvent(new Event("input"));
  });
  $("songnew").addEventListener("click", () => {
    draft = null;
    song = { id:"u-yeni", title:"", text:"", rhythm:"pop", bpm:80 };
    titleEl.value = ""; textEl.value = "[Am]Birinci satır [F]sözleri\n[C]ikinci [G*2]satır";
    $("songdel").disabled = true; errEl.textContent = "";
    titleEl.focus();
  });
  $("songdel").addEventListener("click", () => {
    if(!song || !song.id.startsWith("u-") || !confirm("“" + song.title + "” silinsin mi?")) return;
    user = user.filter(u => u.id !== song.id); store.set("songs", user);
    buildSelect(); load(SONGS[0].id);
  });

  Bus.on("capo", () => render());
  buildSelect(); load(store.get("song", SONGS[0].id));
  return { open(id){ load(id); } };
})();
