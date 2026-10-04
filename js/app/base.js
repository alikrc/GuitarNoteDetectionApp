// Ortak altyapı: DOM yardımcıları, saklanan ayarlar, olay yolu (Bus), ses üretimi (Snd), mikrofon (Mic).
// Uygulama dosyaları klasik betik; her biri tek bir genel ad (modül nesnesi) tanımlar, gerisi kendi kapsamında.

const $ = id => document.getElementById(id);
const T = GUITAR_TRANSPOSE;
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs, text){
  const e = document.createElementNS(SVGNS, tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(text) e.textContent = text;
  return e;
}
const shortName = w => NOTE_TR[((w % 12) + 12) % 12];

// Tarayıcıda saklanan ayarlar; klarnet uygulamasıyla aynı sitede çakışmasın diye "gt." önekli
const store = {
  get(k, d){ try{ const v = localStorage.getItem("gt." + k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("gt." + k, JSON.stringify(v)); }catch(e){} }
};
const settings = {
  a4: store.get("a4", 440),
  sens: store.get("sens", 5),
  tuning: store.get("tuning", "standart"),
  instrument: store.get("instrument", "akustik")
};
if(!(settings.a4 >= 430 && settings.a4 <= 450)) settings.a4 = 440;
if(!(settings.sens >= 1 && settings.sens <= 10)) settings.sens = 5;
if(!TUNINGS[settings.tuning]) settings.tuning = "standart";
if(!INSTRUMENTS[settings.instrument]) settings.instrument = "akustik";
setA4(settings.a4); setTuning(settings.tuning); setInstrument(settings.instrument);

// Olay yolu. Olaylar: frame, note, silence, muted (mikrofon); mic (açıldı/kapandı); stopall (bütün sesler sussun);
// range (akort/çalgı değişti); a4; mode; tab; achieve (ders hedefleri için başarı olayı).
const Bus = (() => {
  const h = {};
  return {
    on(t, f){ (h[t] = h[t] || []).push(f); },
    emit(t, d){ (h[t] || []).slice().forEach(f => f(d)); }
  };
})();

// Ok tuşlarıyla gezilen radyo düğmesi
function radioBtn(text, checked, onClick){
  const b = document.createElement("button");
  b.type = "button"; b.setAttribute("role", "radio");
  b.setAttribute("aria-checked", checked ? "true" : "false");
  b.tabIndex = checked ? 0 : -1;
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}
// Radyo grubunda ok tuşları: seçili düğmeden önceki/sonrakine tıklar ve odaklar
function radioArrows(group){
  group.addEventListener("keydown", e => {
    const step = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1}[e.key];
    if(!step) return;
    const btns = [...group.querySelectorAll("[role=radio]")];
    const i = btns.indexOf(document.activeElement);
    if(i < 0) return;
    e.preventDefault(); e.stopPropagation();
    const j = (i + step + btns.length) % btns.length;
    btns[j].click();
    const again = [...group.querySelectorAll("[role=radio]")][j];
    if(again) again.focus();
  });
}
let toastTimer = null;
function toast(msg){
  const el = $("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
}

// ---- Ses üretimi ----
const Snd = (() => {
  let actx = null, wave = null, driveCurve = null, tailUntil = 0;
  const live = new Set();                     // çalan ya da zamanlanmış tel sesleri: mikrofon bunlar sürerken susar
  // Çalgıya göre tını: klasik (naylon) yumuşak ve kısa, akustik (çelik) parlak, elektro uzun tınlar ve hafif kirli
  const TIMBRE = {
    klasik:    { bright:5,  soft:1.6, sustain:0.8, drive:false },
    akustik:   { bright:12, soft:2.2, sustain:1.0, drive:false },
    elektro22: { bright:8,  soft:3.0, sustain:1.7, drive:true },
    elektro24: { bright:8,  soft:3.0, sustain:1.7, drive:true }
  };
  function ctx(){
    if(!actx){
      actx = new (window.AudioContext || window.webkitAudioContext)();
      // tel tınısı: tüm harmonikler, tize doğru azalan
      const n = 16, real = new Float32Array(n), imag = new Float32Array(n);
      for(let k = 1; k < n; k++) imag[k] = Math.pow(k, -1.25) * (k % 5 === 0 ? 0.4 : 1);
      wave = actx.createPeriodicWave(real, imag);
      driveCurve = new Float32Array(1024);
      for(let i = 0; i < 1024; i++){ const x = i/511.5 - 1; driveCurve[i] = Math.tanh(2.2*x) / Math.tanh(2.2); }
    }
    if(actx.state === "suspended") actx.resume();
    return actx;
  }
  const forget = v => { if(live.delete(v)) tailUntil = performance.now() + 250; };
  // Tek tel sesi: t anında çekilir, kendiliğinden söner. Döner: { osc, g, cut, end }
  function pluck(freq, t, peak){
    const a = ctx(), tb = TIMBRE[settings.instrument];
    t = Math.max(t, a.currentTime);
    const dur = Math.max(1.2, 3.6 - (freqToMidi(freq) - 38)*0.045) * tb.sustain;   // kalın teller daha uzun tınlar
    const osc = a.createOscillator(), lp = a.createBiquadFilter(), g = a.createGain();
    osc.setPeriodicWave(wave);
    osc.frequency.value = freq;
    // Teli çekince parlak başlar, sonra yumuşar
    lp.type = "lowpass"; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(Math.min(14000, freq*tb.bright), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(300, freq*tb.soft), t + 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc.connect(lp);
    if(tb.drive){
      const ws = a.createWaveShaper(); ws.curve = driveCurve; ws.oversample = "2x";
      node = node.connect(ws);
    }
    const cut = a.createGain();                 // susturmak için ayrı kazanç: g'nin sönüm eğrisine dokunmadan kesilir
    node.connect(g).connect(cut).connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
    const v = { osc, g, cut, end: t + dur };
    live.add(v);
    osc.onended = () => forget(v);
    // onended zamanlanmış ama hiç başlamamış seste gelmeyebilir: yedek temizlik
    setTimeout(() => forget(v), (t + dur + 0.5 - a.currentTime)*1000);
    return v;
  }
  // Sesi t anında (varsayılan: şimdi) kısa bir sönümle susturur
  function fadeOut(v, t){
    const a = ctx();
    t = Math.max(t ?? a.currentTime, a.currentTime);
    v.cut.gain.setTargetAtTime(0, t, 0.015);
    try{ v.osc.stop(t + 0.15); }catch(e){}
    setTimeout(() => forget(v), (t + 0.3 - a.currentTime)*1000);
  }
  // Metronom tıkı: 25 ms Hann pencereli 4 kHz (kuvvetli vuruşta 4,8 kHz). Tiz ve dar bantlı olduğu için
  // vuruş yakalayıcı onu yok sayar (core/rhythm.js OnsetDetector, test 16). Enerjisinin ortası vuruş anına denk gelsin diye erken başlar.
  const clickBufs = {};
  function click(t, strong){
    const a = ctx(), key = strong ? "s" : "w";
    if(!clickBufs[key]){
      const L = Math.round(0.025*a.sampleRate), b = a.createBuffer(1, L, a.sampleRate), d = b.getChannelData(0);
      const f = strong ? 4800 : 4000, amp = strong ? 0.5 : 0.32;
      for(let i = 0; i < L; i++) d[i] = amp*(0.5 - 0.5*Math.cos(2*Math.PI*i/L))*Math.sin(2*Math.PI*f*i/a.sampleRate);
      clickBufs[key] = b;
    }
    const s = a.createBufferSource(); s.buffer = clickBufs[key]; s.connect(a.destination);
    s.start(Math.max(a.currentTime, t - 0.0125));
  }
  // Akor sesleri (duyulan MIDI listesi): gap saniye arayla çekilir. Döner: ses listesi
  function strum(midis, t, gap, peak){
    return midis.map((m, i) => pluck(midiToFreq(m), t + i*gap, peak));
  }
  return {
    ctx, pluck, fadeOut, click, strum,
    busy: () => live.size > 0 || performance.now() < tailUntil,
    get latencyOut(){ return actx ? (actx.outputLatency || 0) : 0; }
  };
})();

// ---- Mikrofon ----
// Döngü her karede çalışır: ritim için vuruş yakalama her karede, perde bulma 45 ms'de bir. Sonuçlar Bus ile yayılır:
// frame {now, d (perde bulucu sonucu), buf, sr, loud}, note {r (analyze), now, isNew}, silence {now}, muted.
const Mic = (() => {
  const btn = $("btn"), chip = $("chip"), lvbar = $("lvbar");
  let ctx = null, stream = null, source = null, analyser = null, buf = null;
  let running = false, starting = false, raf = null, lastT = 0;
  const hist = [], stab = new NoteStabilizer(3);
  const onsetSubs = new Set();
  let onsetDet = null, lastFeedT = null;

  // Seviye çubuğu -60…0 dBFS
  const dbPos = rms => Math.max(0, Math.min(100, (20*Math.log10(Math.max(rms, 1e-6)) + 60) / 60 * 100));

  // Dinlerken ekranın uykuya geçmesini engelle (Screen Wake Lock API).
  // Sekme arka plana gidince tarayıcı kilidi otomatik bırakır; geri gelince yeniden alınır.
  let wakeLock = null;
  async function keepAwake(){
    if(!("wakeLock" in navigator) || wakeLock) return;
    try{
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => { wakeLock = null; });
    }catch(e){ wakeLock = null; }
  }
  document.addEventListener("visibilitychange", () => {
    if(running && document.visibilityState === "visible") keepAwake();
  });

  async function start(){
    if(running || starting) return running;
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      chip.textContent = "bu ortamda mikrofon açılamıyor (https gerekli)"; return false;
    }
    starting = true; btn.disabled = true; chip.textContent = "izin bekleniyor";
    try{
      stream = await navigator.mediaDevices.getUserMedia({ audio:{
        echoCancellation:false, noiseSuppression:false, autoGainControl:false }});
    }catch(e){
      chip.textContent = "mikrofon açılamadı (" + e.name + ")";
      starting = false; btn.disabled = false;
      return false;
    }
    ctx = Snd.ctx();                      // ses üretimiyle aynı bağlam: metronom ve vuruşlar tek saatle ölçülür
    await ctx.resume();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 8192;              // akor dinleme için ince frekans çözünürlüğü; perde bulucu son 4096 örneği kullanır
    source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    buf = new Float32Array(analyser.fftSize);
    resetNote(); lastFeedT = null; onsetDet = null;
    running = true; starting = false; btn.disabled = false;
    btn.textContent = "Mikrofonu durdur"; btn.classList.add("listening");
    chip.textContent = "dinliyor"; chip.classList.add("live");
    keepAwake();
    Bus.emit("mic", true);
    loop();
    return true;
  }
  function stop(){
    if(!running) return;
    running = false;
    if(wakeLock){ wakeLock.release(); wakeLock = null; }
    if(raf) cancelAnimationFrame(raf);
    if(stream) stream.getTracks().forEach(t => t.stop());
    if(source) source.disconnect();       // ses bağlamı örnek seslerle ortak, kapatılmaz
    stream = source = analyser = null;
    resetNote();
    lvbar.style.width = "0"; lvbar.classList.remove("hot");
    btn.textContent = "Mikrofonu başlat"; btn.classList.remove("listening");
    chip.textContent = "durdu"; chip.classList.remove("live");
    Bus.emit("mic", false);
  }
  function resetNote(){ hist.length = 0; stab.reset(); }

  // Son kareden bu yana analyser'a giren örnekler (ses saatine göre sayılır) vuruş yakalayıcıya verilir
  function feedOnsets(){
    const ct = ctx.currentTime, sr = ctx.sampleRate;
    if(lastFeedT === null || !onsetDet){
      lastFeedT = ct;
      onsetDet = new OnsetDetector(sr, { minRms: sensitivityToRms(settings.sens) });
      return;
    }
    const n = Math.min(buf.length, Math.round((ct - lastFeedT) * sr));
    if(n <= 0) return;
    lastFeedT = ct;
    analyser.getFloatTimeDomainData(buf);
    for(const t of onsetDet.push(buf.subarray(buf.length - n), ct - n/sr)) onsetSubs.forEach(f => f(t));
  }
  function loop(){
    if(!running) return;
    raf = requestAnimationFrame(loop);
    if(onsetSubs.size) feedOnsets();
    const now = performance.now();
    if(now - lastT < 45) return;
    lastT = now;
    analyser.getFloatTimeDomainData(buf);
    // Uygulamanın çaldığı ses hoparlörden mikrofona girmesin
    if(Snd.busy()){
      chip.textContent = "örnek ses çalıyor";
      resetNote();
      Bus.emit("muted");
      return;
    }
    const minRms = sensitivityToRms(settings.sens);
    const d = detectPitch(buf.subarray(buf.length - 4096), ctx.sampleRate, 60, 1400, minRms);
    lvbar.style.width = dbPos(d.rms) + "%";
    lvbar.classList.toggle("hot", d.rms >= minRms);
    Bus.emit("frame", { now, d, buf, sr: ctx.sampleRate, loud: d.rms >= minRms });
    if(d.freq > 0){
      hist.push(d.freq); if(hist.length > 5) hist.shift();
      const med = [...hist].sort((a, b) => a - b)[Math.floor(hist.length/2)];
      const r = analyze(med, T);
      const prev = stab.shown;
      if(stab.push(noteKey(r))){
        chip.textContent = "dinliyor";
        Bus.emit("note", { r, now, isNew: stab.shown !== prev });
      }
    }else{
      resetNote();
      chip.textContent = "sessiz";
      Bus.emit("silence", { now });
    }
  }
  // Vuruş yakalama aboneliği; dönen işlev aboneliği bırakır
  function onOnset(fn){
    onsetSubs.add(fn); onsetDet = null; lastFeedT = null;
    return () => onsetSubs.delete(fn);
  }
  btn.addEventListener("click", () => running ? stop() : start());
  return {
    start, stop, onOnset, resetNote, dbPos,
    get running(){ return running; },
    get ctx(){ return ctx; }
  };
})();
