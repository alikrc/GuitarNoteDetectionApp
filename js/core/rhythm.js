// Ritim: vuruş kalıpları, zamanlama puanı, mikrofondan vuruş yakalama.
// Tarayıcıda <script> ile sırayla yüklenir (music → guitar → chords → rhythm → …); Node testleri vm ile aynı sırada yükler.

// ---- Ritim: vuruş kalıpları, zamanlama, mikrofondan vuruş yakalama ----
// slots: her hücre bir sekizlik; D aşağı, U yukarı, - boş (el tele değmeden geçer).
// accents: hücre → vurgu (2 kuvvetli, 1 yarı kuvvetli). beats: metronomun tıkladığı hücreler (ilki kuvvetli).
// Tempo (BPM) dörtlük nota içindir: bir hücre = 30/BPM saniye.
// Kaynaklar: 4/4 kalıplar — tabs4acoustic.com "Strumming patterns for beginners", guitarworld.com "pendulum strumming";
// Aksak 9/8 = 2+2+2+3 — en.wikipedia.org/wiki/Aksak; Türk aksağı 5/8 = 2+3, üç vuruş — islamansiklopedisi.org.tr/turk-aksagi.
// Gitar vuruş yönleri (aşağı/yukarı) usul gruplarına göre bizim uyarlamamız.
const RHYTHMS = [
  { id:"dortluk",  name:"Dörtlük vuruş",          meter:"4/4", slots:"D-D-D-D-", accents:{0:2},
    beats:[0,2,4,6], counts:["1","&","2","&","3","&","4","&"],
    desc:"Her vuruşta bir aşağı vuruş. Tempoya oturmanın ilk adımı; akor değiştirmeye de bol zaman kalır." },
  { id:"sekizlik", name:"Sekizlik aşağı-yukarı",  meter:"4/4", slots:"DUDUDUDU", accents:{0:2,4:1},
    beats:[0,2,4,6], counts:["1","&","2","&","3","&","4","&"],
    desc:"El sarkaç gibi hiç durmadan sallanır: sayılarda aşağı, “ve”lerde yukarı. Yukarı vuruş hafif ve ince tellerde." },
  { id:"pop",      name:"Pop / folk",             meter:"4/4", slots:"D-DU-UDU", accents:{0:2},
    beats:[0,2,4,6], counts:["1","&","2","&","3","&","4","&"],
    desc:"Aşağı, aşağı-yukarı, yukarı-aşağı-yukarı: en yaygın başlangıç kalıbı. El sekizlikteki gibi sallanmaya devam eder; boş hücrelerde tele değmeden geçer." },
  { id:"vals",     name:"Vals",                   meter:"3/4", slots:"D-DUDU", accents:{0:2},
    beats:[0,2,4], counts:["1","&","2","&","3","&"],
    desc:"Üç vuruşlu: 1'de kuvvetli aşağı, 2 ve 3'te aşağı-yukarı." },
  { id:"turkaksagi", name:"Türk aksağı",          meter:"5/8 (2+3)", slots:"D-D-U", accents:{0:2,2:1},
    beats:[0,2], counts:["1","2","1","2","3"],
    desc:"Beş zaman: bir 2'li ve bir 3'lü grup. İlk vuruş kuvvetli (düm), ikinci grubun başı yarı kuvvetli, üçüncü vuruş zayıf." },
  { id:"aksak",    name:"Aksak",                  meter:"9/8 (2+2+2+3)", slots:"DUDUDUD-U", accents:{0:2,2:1,4:1,6:1},
    beats:[0,2,4,6], counts:["1","2","1","2","1","2","1","2","3"],
    desc:"Dokuz zaman, dört grup: üç kısa (2) ve bir uzun (3). Grup başlarını vurgula; son grubun bir zaman uzun olduğunu hisset." }
];
function rhythmById(id){ return RHYTHMS.find(r => r.id === id) || null; }
function slotDur(bpm){ return 30 / bpm; }
// Bir ölçüdeki vuruşların zamanları (t0: ölçü başı, saniye)
function rhythmBar(r, bpm, t0){
  const dt = slotDur(bpm), out = [];
  for(let i=0; i<r.slots.length; i++){
    const ch = r.slots[i];
    if(ch === "-") continue;
    out.push({ t: t0 + i*dt, slot: i, dir: ch === "D" ? "down" : "up", accent: r.accents[i] || 0 });
  }
  return out;
}
// Beklenen vuruşlarla yakalanan vuruşları eşleştirir. Her beklenen vuruş, ±yarım hücre içindeki en yakın
// kullanılmamış vuruşla eşleşir. tol: "zamanında" sayılan sapma (saniye).
function scoreTiming(expected, onsets, dt, tol){
  const used = new Set();
  const hits = expected.map(e => {
    let best = -1, bd = dt/2;
    onsets.forEach((t, i) => { const d = Math.abs(t - e.t); if(!used.has(i) && d < bd){ bd = d; best = i; } });
    if(best < 0) return { ...e, offset: null, verdict: "miss" };
    used.add(best);
    const off = onsets[best] - e.t;
    return { ...e, offset: off, verdict: Math.abs(off) <= tol ? "ok" : off < 0 ? "early" : "late" };
  });
  return { hits, extra: onsets.length - used.size, extraTimes: onsets.filter((_, i) => !used.has(i)) };
}

// Mikrofondan vuruş (tel çekme anı) yakalama: spektral akı. 1024 örneklik pencere 256 örnekte bir kaydırılır;
// her adımda log-genlik spektrumunun artışları toplanır. Akı, son adımların ortancasının k katını ve delta'yı
// aşan bir tepe yaptığında vuruş sayılır. Metronom tıkı 4 kHz civarında tek ses olduğu için `notch` bandı
// hesaba katılmaz; çentik dışındaki bant enerjisi `minRms`'ten türetilen eşiği aşmayan pencereler de yok sayılır.
// bias: tepenin pencere içindeki yerinden gelen sabit gecikme (sentetik testte ölçüldü).
class OnsetDetector{
  constructor(sampleRate, { frame=1024, hop=256, notch=[2500,7000], maxHz=9000, k=2, delta=0.02,
                            refractory=0.06, minRms=0.008, bias=0.008 } = {}){
    Object.assign(this, { sr:sampleRate, frame, hop, k, delta, refractory, bias });
    const df = sampleRate/frame;
    this.bins = [];
    for(let b = Math.ceil(70/df); b < Math.min(frame/2, maxHz/df); b++){
      const f = b*df;
      if(f < notch[0] || f > notch[1]) this.bins.push(b);
    }
    this.gate = 2e5 * minRms * minRms;          // sinüs için ölçüldü: bant enerjisi ≈ 2·10⁵ × RMS²
    this.ring = new Float32Array(frame); this.ord = new Float32Array(frame);
    this.pos = 0; this.n = 0; this.since = 0;
    this.prev = null; this.hist = []; this.f1 = 0; this.f2 = 0; this.e1 = 0; this.last = -1e9;
  }
  // chunk: yeni örnekler, t0: ilk örneğin zamanı (saniye). Döner: yakalanan vuruş zamanları.
  push(chunk, t0){
    const out = [], F = this.frame;
    for(let i=0; i<chunk.length; i++){
      this.ring[this.pos] = chunk[i]; this.pos = (this.pos + 1) % F; this.n++; this.since++;
      if(this.n < F || this.since < this.hop) continue;
      this.since = 0;
      this.ord.set(this.ring.subarray(this.pos), 0); this.ord.set(this.ring.subarray(0, this.pos), F - this.pos);
      const t = this.step(t0 + (i+1)/this.sr);
      if(t !== null) out.push(t);
    }
    return out;
  }
  step(end){
    const { mag } = fftMag(this.ord), l = new Float64Array(mag.length);
    let flux = 0, e = 0;
    for(const b of this.bins){
      l[b] = Math.log(1 + 100*mag[b]);
      e += mag[b]*mag[b];
      if(this.prev){ const d = l[b] - this.prev[b]; if(d > 0) flux += d; }
    }
    flux = this.prev ? flux / this.bins.length : 0;
    this.prev = l;
    const h = [...this.hist].sort((a, b) => a - b), thr = h.length ? this.k*h[h.length >> 1] + this.delta : Infinity;
    const t1 = end - this.hop/this.sr;                       // bir önceki adımın zamanı
    let hit = null;
    if(this.f1 > this.f2 && this.f1 >= flux && this.f1 > thr && Math.max(this.e1, e) > this.gate && t1 - this.last > this.refractory){
      hit = t1 - this.bias; this.last = t1;
    }
    this.hist.push(flux); if(this.hist.length > 20) this.hist.shift();
    this.f2 = this.f1; this.f1 = flux; this.e1 = e;
    return hit;
  }
}

// Dokunarak tempo: dokunuş zamanlarından (ms) BPM. Son 2 saniyeden eski dokunuşlar ve aradaki çok uzun boşluklar
// yeni bir dizi başlatır; aralıkların ortancası tek tük kaçan dokunuşa dayanıklıdır. Döner: BPM ya da null.
function tapTempo(times){
  const t = [];
  for(const x of times){ if(t.length && x - t[t.length-1] > 2000) t.length = 0; t.push(x); }
  if(t.length < 2) return null;
  const iv = []; for(let i = 1; i < t.length; i++) iv.push(t[i] - t[i-1]);
  const bpm = Math.round(60000 / median(iv.slice(-6)));
  return Math.min(240, Math.max(30, bpm));
}
