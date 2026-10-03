// Akorlar: şekiller, tel tel döküm, kromagramla akor dinleme.
// Tarayıcıda <script> ile sırayla yüklenir (music → guitar → chords → rhythm → …); Node testleri vm ile aynı sırada yükler.

// ---- Akorlar ----
// Akor türleri: kökten yarım ses aralıkları. omit: şekilde eksik olabilen ses (yedili akorlarda beşli).
const CHORD_TYPES = {
  "":     { tr:"majör",           iv:[0,4,7],    formula:"kök + büyük üçlü + tam beşli" },
  "m":    { tr:"minör",           iv:[0,3,7],    formula:"kök + küçük üçlü + tam beşli" },
  "7":    { tr:"dominant yedili", iv:[0,4,7,10], formula:"majör akor + küçük yedili", omit:7 },
  "m7":   { tr:"minör yedili",    iv:[0,3,7,10], formula:"minör akor + küçük yedili", omit:7 },
  "maj7": { tr:"majör yedili",    iv:[0,4,7,11], formula:"majör akor + büyük yedili", omit:7 },
  "sus2": { tr:"sus2",            iv:[0,2,7],    formula:"kök + büyük ikili + tam beşli (üçlü yok)" },
  "sus4": { tr:"sus4",            iv:[0,5,7],    formula:"kök + tam dörtlü + tam beşli (üçlü yok)" }
};
const INTERVAL_TR = {0:"kök",2:"ikili",3:"küçük üçlü",4:"büyük üçlü",5:"dörtlü",7:"beşli",10:"küçük yedili",11:"büyük yedili"};
const ROOT_SYM = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const CHORD_GROUPS = ["Açık majör","Açık minör","Yedili","Sus ve maj7","Barre"];
// Standart akort şekilleri. frets/fingers 6. telden 1. tele; -1 çalınmaz, parmak 0 = basılmaz.
// barre: işaret (ya da yüzük) parmağının birden çok teli birden bastırdığı perde ve tel aralığı.
// Perde dizilimleri: https://en.wikipedia.org/wiki/Guitar_chord (açık akorlar); barre şekilleri E ve A kalıbı.
const CHORDS = [
  { root:0,  type:"",     frets:[-1,3,2,0,1,0],  fingers:[0,3,2,0,1,0], group:0 },              // C
  { root:2,  type:"",     frets:[-1,-1,0,2,3,2], fingers:[0,0,0,1,3,2], group:0 },              // D
  { root:4,  type:"",     frets:[0,2,2,1,0,0],   fingers:[0,2,3,1,0,0], group:0 },              // E
  { root:7,  type:"",     frets:[3,2,0,0,0,3],   fingers:[2,1,0,0,0,3], group:0 },              // G
  { root:9,  type:"",     frets:[-1,0,2,2,2,0],  fingers:[0,0,1,2,3,0], group:0 },              // A
  { root:9,  type:"m",    frets:[-1,0,2,2,1,0],  fingers:[0,0,2,3,1,0], group:1 },              // Am
  { root:2,  type:"m",    frets:[-1,-1,0,2,3,1], fingers:[0,0,0,2,3,1], group:1 },              // Dm
  { root:4,  type:"m",    frets:[0,2,2,0,0,0],   fingers:[0,2,3,0,0,0], group:1 },              // Em
  { root:0,  type:"7",    frets:[-1,3,2,3,1,0],  fingers:[0,3,2,4,1,0], group:2 },              // C7
  { root:2,  type:"7",    frets:[-1,-1,0,2,1,2], fingers:[0,0,0,2,1,3], group:2 },              // D7
  { root:4,  type:"7",    frets:[0,2,0,1,0,0],   fingers:[0,2,0,1,0,0], group:2 },              // E7
  { root:7,  type:"7",    frets:[3,2,0,0,0,1],   fingers:[3,2,0,0,0,1], group:2 },              // G7
  { root:9,  type:"7",    frets:[-1,0,2,0,2,0],  fingers:[0,0,2,0,3,0], group:2 },              // A7
  { root:11, type:"7",    frets:[-1,2,1,2,0,2],  fingers:[0,2,1,3,0,4], group:2 },              // B7
  { root:9,  type:"m7",   frets:[-1,0,2,0,1,0],  fingers:[0,0,2,0,1,0], group:2 },              // Am7
  { root:2,  type:"m7",   frets:[-1,-1,0,2,1,1], fingers:[0,0,0,2,1,1], group:2,
    barre:{ fret:1, from:2, to:1 } },                                                         // Dm7
  { root:4,  type:"m7",   frets:[0,2,0,0,0,0],   fingers:[0,2,0,0,0,0], group:2 },              // Em7
  { root:0,  type:"maj7", frets:[-1,3,2,0,0,0],  fingers:[0,3,2,0,0,0], group:3 },              // Cmaj7
  { root:5,  type:"maj7", frets:[-1,-1,3,2,1,0], fingers:[0,0,3,2,1,0], group:3 },              // Fmaj7
  { root:9,  type:"sus2", frets:[-1,0,2,2,0,0],  fingers:[0,0,1,2,0,0], group:3 },              // Asus2
  { root:9,  type:"sus4", frets:[-1,0,2,2,3,0],  fingers:[0,0,1,2,3,0], group:3 },              // Asus4
  { root:2,  type:"sus2", frets:[-1,-1,0,2,3,0], fingers:[0,0,0,1,3,0], group:3 },              // Dsus2
  { root:2,  type:"sus4", frets:[-1,-1,0,2,3,3], fingers:[0,0,0,1,3,4], group:3 },              // Dsus4
  { root:4,  type:"sus4", frets:[0,2,2,2,0,0],   fingers:[0,2,3,4,0,0], group:3 },              // Esus4
  { root:5,  type:"",     frets:[1,3,3,2,1,1],   fingers:[1,3,4,2,1,1], group:4,
    barre:{ fret:1, from:6, to:1 } },                                                         // F
  { root:10, type:"",     frets:[-1,1,3,3,3,1],  fingers:[0,1,3,3,3,1], group:4,
    barre:{ fret:1, from:5, to:1 } },                                                         // B♭
  { root:11, type:"",     frets:[-1,2,4,4,4,2],  fingers:[0,1,3,3,3,1], group:4,
    barre:{ fret:2, from:5, to:1 } },                                                         // B
  { root:6,  type:"",     frets:[2,4,4,3,2,2],   fingers:[1,3,4,2,1,1], group:4,
    barre:{ fret:2, from:6, to:1 } },                                                         // F♯
  { root:11, type:"m",    frets:[-1,2,4,4,3,2],  fingers:[0,1,3,4,2,1], group:4,
    barre:{ fret:2, from:5, to:1 } },                                                         // Bm
  { root:6,  type:"m",    frets:[2,4,4,2,2,2],   fingers:[1,3,4,1,1,1], group:4,
    barre:{ fret:2, from:6, to:1 } },                                                         // F♯m
  { root:7,  type:"m",    frets:[3,5,5,3,3,3],   fingers:[1,3,4,1,1,1], group:4,
    barre:{ fret:3, from:6, to:1 } },                                                         // Gm
  { root:0,  type:"m",    frets:[-1,3,5,5,4,3],  fingers:[0,1,3,4,2,1], group:4,
    barre:{ fret:3, from:5, to:1 } }                                                          // Cm
].map(c => ({ ...c, symbol: ROOT_SYM[c.root] + c.type,
                    name: NOTE_TR[c.root] + " " + CHORD_TYPES[c.type].tr }));
// Klavyeyle yazılan sembolü (F#m, Bb, Amaj7) uygulamadaki yazıma (F♯m, B♭) çevirir
function normalizeSymbol(sym){
  const m = /^\s*([A-Ga-g])([#♯b♭]?)(.*?)\s*$/.exec(sym || "");
  if(!m) return null;
  const acc = m[2] === "#" ? "♯" : m[2] === "b" ? "♭" : m[2];
  return m[1].toUpperCase() + acc + m[3];
}
// Enharmonik yazımlar da bulunur (A♯ → B♭, D♭ → C♯ …)
const ENHARMONIC = {"A♯":"B♭","D♭":"C♯","G♭":"F♯","D♯":"E♭","G♯":"A♭"};
function chordBySymbol(sym){
  let s = normalizeSymbol(sym);
  if(!s) return null;
  for(const k in ENHARMONIC) if(s.startsWith(k)){ s = ENHARMONIC[k] + s.slice(k.length); break; }
  return CHORDS.find(c => c.symbol === s) || null;
}
// Capo: şekil aynı kalır, ses capo perdesi kadar yarım ses tizleşir.
function soundingSymbol(c, capo = 0){ return ROOT_SYM[(c.root + capo) % 12] + c.type; }
function soundingName(c, capo = 0){ return NOTE_TR[(c.root + capo) % 12] + " " + CHORD_TYPES[c.type].tr; }
// Akorun perde sınıfları (0 = Do), kök önce
function chordPcs(c, capo = 0){ return CHORD_TYPES[c.type].iv.map(i => (c.root + capo + i) % 12); }
// Akorun tel tel dökümü (standart akortta; capo varsa sesler tizleşir): 6. telden 1. tele
function chordStrings(c, capo = 0){
  const std = TUNINGS.standart.strings;
  return c.frets.map((f, i) => {
    const string = 6 - i;
    if(f < 0) return { string, fret:-1, muted:true };
    const midi = std[i] + f + capo, iv = ((midi - c.root - capo) % 12 + 12) % 12;
    return { string, fret:f, finger:c.fingers[i], muted:false, midi, role: INTERVAL_TR[iv] || "?" };
  });
}
// Kutu şemasında gösterilecek ilk perde: şekil 4. perdeyi aşıyorsa en alçak basılı perdeden başlar.
function chordBaseFret(c){
  const fr = c.frets.filter(f => f > 0);
  return fr.length && Math.max(...fr) > 4 ? Math.min(...fr) : 1;
}

// ---- Akor dinleme: sesin spektrumundan 12 perde sınıfının enerjisi (kromagram) ----
// Spektrumdaki tepeler perde sınıflarına toplanır. Daha pes güçlü bir tepenin tek sayılı (3, 5, 7) ya da
// 4'ten büyük harmoniği olan tepeler zayıflatılır (ör. La2'nin 5. harmoniği Do♯) ki akorda olmayan ses görünmesin.
// 2. ve 4. harmonik aynı perde sınıfında olduğu için dokunulmaz.
function chroma(buf, sampleRate, minHz=70, maxHz=2000){
  const { mag, n } = fftMag(buf), df = sampleRate/n;
  const k0 = Math.max(2, Math.floor(minHz/df)), k1 = Math.min(mag.length-2, Math.ceil(maxHz/df));
  let peakMax = 0;
  for(let k=k0;k<=k1;k++) if(mag[k] > peakMax) peakMax = mag[k];
  const peaks = [];
  for(let k=k0;k<=k1;k++){
    const m = mag[k];
    if(m < peakMax*0.04 || m < mag[k-1] || m <= mag[k+1]) continue;
    const a = mag[k-1], c = mag[k+1], den = a - 2*m + c;
    peaks.push({ f: (k + (den ? 0.5*(a-c)/den : 0)) * df, m });
  }
  const out = new Array(12).fill(0);
  peaks.forEach((p, i) => {
    let w = 1;
    for(let j=0; j<i; j++){
      const h = p.f / peaks[j].f, r = Math.round(h);
      if(r >= 3 && r <= 8 && r !== 4 && Math.abs(h - r) < 0.015*r && peaks[j].m > p.m*0.5){ w = 0.25; break; }
    }
    const pc = ((Math.round(freqToMidi(p.f)) % 12) + 12) % 12;
    out[pc] += w * p.m;
  });
  const mx = Math.max(...out);
  return mx > 0 ? out.map(v => v/mx) : out;
}
// Çalınan akor hedef akorla uyuşuyor mu: her akor sesi duyuluyor mu, akorda olmayan güçlü ses var mı.
function chordCheck(chr, c, capo = 0){
  const t = CHORD_TYPES[c.type], pcs = chordPcs(c, capo);
  const tones = pcs.map((pc, i) => ({ pc, role: INTERVAL_TR[t.iv[i]], level: chr[pc],
    heard: chr[pc] >= 0.2, optional: t.iv[i] === t.omit }));
  const extra = [];
  for(let pc=0; pc<12; pc++) if(!pcs.includes(pc) && chr[pc] >= 0.45) extra.push(pc);
  return { tones, extra, ok: tones.every(x => x.heard || x.optional) && extra.length === 0 };
}
// Kromagrama en çok benzeyen akorlar (kosinüs benzerliği), en iyisi önce.
function matchChords(chr){
  const norm = v => Math.sqrt(v.reduce((s, x) => s + x*x, 0)) || 1;
  const cn = norm(chr);
  return CHORDS.map(c => {
    const t = new Array(12).fill(0);
    chordPcs(c).forEach((pc, i) => { t[pc] = i === 0 ? 1.2 : 1; });
    return { chord: c, score: chr.reduce((s, x, i) => s + x*t[i], 0) / (cn * norm(t)) };
  }).sort((a, b) => b.score - a.score);
}

// Akor değiştirme alıştırması: iki akor arasındaki temiz geçişleri sayar. Her kromagram karesinde iki akordan
// hangisinin çalındığına bakılır: akor kontrolü geçiyorsa ya da o akora benzerlik yüksek ve diğerinden belirgin
// fazlaysa o akor sayılır. Aynı akor art arda `hold` karede görülünce "oturmuş" kabul edilir; oturan akor
// öncekinden farklıysa bir geçiş sayılır. Sessiz kareler (null) durumu bozmaz.
class ChangeCounter{
  constructor(a, b, { capo = 0, hold = 2 } = {}){
    Object.assign(this, { a, b, capo, hold });
    this.current = null; this.cand = null; this.count = 0; this.changes = 0;
  }
  cosine(chr, c){
    const t = new Array(12).fill(0);
    chordPcs(c, this.capo).forEach((pc, i) => { t[pc] = i === 0 ? 1.2 : 1; });
    const n = v => Math.sqrt(v.reduce((s, x) => s + x*x, 0)) || 1;
    return chr.reduce((s, x, i) => s + x*t[i], 0) / (n(chr)*n(t));
  }
  // Bir kare: o an hangi akor duyuluyor (a, b ya da null)
  classify(chr){
    const sa = this.cosine(chr, this.a), sb = this.cosine(chr, this.b);
    const okA = chordCheck(chr, this.a, this.capo).ok, okB = chordCheck(chr, this.b, this.capo).ok;
    if(okA && !okB) return "a";
    if(okB && !okA) return "b";
    if(sa >= 0.88 && sa - sb >= 0.04) return "a";
    if(sb >= 0.88 && sb - sa >= 0.04) return "b";
    return null;
  }
  // chr: kromagram ya da sessizlikte null. Döner: bu karede yeni geçiş sayıldı mı
  push(chr){
    if(!chr) return false;
    const k = this.classify(chr);
    if(k === null){ this.cand = null; this.count = 0; return false; }
    if(k === this.current){ this.cand = null; this.count = 0; return false; }
    if(k === this.cand) this.count++; else { this.cand = k; this.count = 1; }
    if(this.count < this.hold) return false;
    const changed = this.current !== null;
    this.current = k; this.cand = null; this.count = 0;
    if(changed) this.changes++;
    return changed;
  }
}
