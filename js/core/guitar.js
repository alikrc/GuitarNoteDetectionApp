// Gitar: çalgı türleri, akortlar, sapta konumlar, talimat, tab, analiz.
// Tarayıcıda <script> ile sırayla yüklenir (music → guitar → chords → rhythm → …); Node testleri vm ile aynı sırada yükler.

const GUITAR_TRANSPOSE = 12;      // gitar yazıldığından bir oktav pes duyulur: yazılı = duyulan + 12

// Çalgı türü: perde sayısı ve tını. Perde sayıları tipik değerler; modele göre değişebilir.
const INSTRUMENTS = {
  klasik:    { name:"Klasik gitar (naylon tel) · 19 perde", name_en:"Classical guitar (nylon) · 19 frets", short:"Klasik",  short_en:"Classical", frets:19 },
  akustik:   { name:"Akustik gitar (çelik tel) · 20 perde", name_en:"Acoustic guitar (steel) · 20 frets",  short:"Akustik", short_en:"Acoustic",  frets:20 },
  elektro22: { name:"Elektro gitar · 22 perde",             name_en:"Electric guitar · 22 frets",          short:"Elektro", short_en:"Electric",  frets:22 },
  elektro24: { name:"Elektro gitar · 24 perde",             name_en:"Electric guitar · 24 frets",          short:"Elektro", short_en:"Electric",  frets:24 }
};
let INSTRUMENT = "akustik", FRETS = 20;      // sapta 0 (açık tel) – FRETS. perde
function setInstrument(k){
  if(!INSTRUMENTS[k]) throw new Error("bilinmeyen çalgı: " + k);
  INSTRUMENT = k; FRETS = INSTRUMENTS[k].frets;
}
function getInstrument(){ return INSTRUMENT; }
function getFrets(){ return FRETS; }
// Akortlar: kalın telden (6.) inceye (1.) açık tel sesleri, duyulan MIDI.
const TUNINGS = {
  standart: { name:"Standart · Mi La Re Sol Si Mi",  name_en:"Standard · E A D G B E",  strings:[40,45,50,55,59,64] },
  dropd:    { name:"Drop D · Re La Re Sol Si Mi",    name_en:"Drop D · D A D G B E",    strings:[38,45,50,55,59,64] },
  yarim:    { name:"Yarım ses pes · Mi♭",            name_en:"Half step down · E♭",     strings:[39,44,49,54,58,63] },
  dadgad:   { name:"DADGAD · Re La Re Sol La Re",    name_en:"DADGAD · D A D G A D",    strings:[38,45,50,55,57,62] },
  openg:    { name:"Açık Sol · Re Sol Re Sol Si Re", name_en:"Open G · D G D G B D",    strings:[38,43,50,55,59,62] },
  opend:    { name:"Açık Re · Re La Re Fa♯ La Re",   name_en:"Open D · D A D F♯ A D",   strings:[38,45,50,54,57,62] }
};
let TUNING = "standart";
function setTuning(k){
  if(!TUNINGS[k]) throw new Error("bilinmeyen akort: " + k);
  TUNING = k;
}
function getTuning(){ return TUNING; }
// s: 1 (en ince) – 6 (en kalın) → o telin açık sesi (duyulan MIDI)
function stringOpen(s){ return TUNINGS[TUNING].strings[6-s]; }
// Seçili akortta sapta çalınabilen yazılı nota aralığı
function writtenRange(){
  const s = TUNINGS[TUNING].strings;
  return { low: Math.min(...s) + GUITAR_TRANSPOSE, high: Math.max(...s) + FRETS + GUITAR_TRANSPOSE };
}

// Yazılı notanın sapta çalındığı tüm konumlar: [{string, fret}], ilki temel (en alçak perde).
// Aynı perdedeyse kalın tel önce gelir.
function positionsFor(written){
  const sounding = written - GUITAR_TRANSPOSE, out = [];
  for(let s=6; s>=1; s--){
    const fret = sounding - stringOpen(s);
    if(fret>=0 && fret<=FRETS) out.push({ string:s, fret });
  }
  return out.sort((a,b) => a.fret - b.fret || b.string - a.string);
}
// Sapta basılan konumun yazılı notası
function positionNote(string, fret){ return stringOpen(string) + fret + GUITAR_TRANSPOSE; }

// Konumu adım adım okunur talimata çevirir.
defStr({
  "finger.1": { tr:"işaret", en:"index" }, "finger.2": { tr:"orta", en:"middle" },
  "finger.3": { tr:"yüzük", en:"ring" },   "finger.4": { tr:"serçe", en:"little" },
  "pos.part.string": { tr:"Tel", en:"String" }, "pos.part.fret": { tr:"Perde", en:"Fret" },
  "pos.part.left": { tr:"Sol el", en:"Left hand" }, "pos.part.right": { tr:"Sağ el", en:"Right hand" },
  "pos.stringName": { tr:"{note} teli", en:"{note} string" },
  "pos.string": { tr:"{s}. tel ({name})", en:"string {s} ({name})" },
  "pos.open": { tr:"açık tel, perdeye basma", en:"open string, don't fret" },
  "pos.press": { tr:"{f}. perdeye bas", en:"press fret {f}" },
  "pos.idle": { tr:"boşta", en:"free" },
  "pos.first": { tr:"{finger} parmağı (1. pozisyon)", en:"{finger} finger (1st position)" },
  "pos.high": { tr:"işaret parmağı ({p}. pozisyon) ya da serçe parmağı ({q}. pozisyon); ezgide komşu notalara göre seçilir",
                en:"index finger (position {p}) or little finger (position {q}); in melodies it depends on the neighbouring notes" },
  "pos.pluck": { tr:"{s}. teli çek", en:"pluck string {s}" }
});
const fingerName = i => t("finger." + i);
function stringName(s){ return t("pos.stringName", { note: pcName(stringOpen(s)) }); }
// Tek nota için sol el: 1–4. perde "her perdeye bir parmak" kuralıyla 1. pozisyonda çalınır. Daha tizde hangi
// parmağın basacağı komşu notalara bağlıdır; iki uç seçenek yazılır (işaret ya da serçe). Ezgilerde planFingering
// komşu notalara göre tek bir parmak seçer.
function describePosition(p){
  const left = p.fret===0 ? t("pos.idle")
             : p.fret<=4 ? t("pos.first", { finger: fingerName(p.fret) })
             : t("pos.high", { p: p.fret, q: p.fret - 3 });
  return [
    { part:t("pos.part.string"), text: t("pos.string", { s: p.string, name: stringName(p.string) }), active:true },
    { part:t("pos.part.fret"),   text: p.fret===0 ? t("pos.open") : t("pos.press", { f: p.fret }), active: p.fret>0 },
    { part:t("pos.part.left"),   text: left, active: p.fret>0 },
    { part:t("pos.part.right"),  text: t("pos.pluck", { s: p.string }), active:true }
  ];
}
// Konumun tab gösterimi: üstte 1. tel, altta 6. tel.
function tabFor(p){
  const w = String(p.fret).length;
  const lines = [];
  for(let s=1; s<=6; s++){
    const open = stringOpen(s);
    const lab = (s===1 ? NOTE_EN[open%12].toLowerCase() : NOTE_EN[open%12]).padEnd(2);
    lines.push(lab + "|--" + (s===p.string ? String(p.fret) : "-".repeat(w)) + "--|");
  }
  return lines.join("\n");
}

// Ezgi için parmak planı: her nota için tel, perde, parmak ve el pozisyonu seçer. Dinamik programlama:
// el pozisyonu p'de 1. parmak p. perdede, 4. parmak p+3'te (her perdeye bir parmak). Pozisyon değiştirmek
// pahalı, tiz perde ve tel atlamak biraz pahalı; açık tel her pozisyonda çalınır.
// notes: yazılı MIDI dizisi. Döner: [{ written, string, fret, finger, pos }] (çalınamayan notada string null).
function planFingering(notes, { maxFret = 12 } = {}){
  const P = Math.max(1, maxFret - 3), INF = 1e9;
  const cands = notes.map(w => {
    const all = positionsFor(w), low = all.filter(c => c.fret <= maxFret);
    return low.length ? low : all;
  });
  // dp[i][p] = { cost, c (aday), prev (önceki p) }
  const dp = [];
  for(let i = 0; i < notes.length; i++){
    const row = new Array(P + 1).fill(null);
    for(let p = 1; p <= P; p++){
      let best = null;
      for(const c of cands[i]){
        if(c.fret > 0 && (c.fret < p || c.fret > p + 3)) continue;
        const local = c.fret*0.05 + (c.fret === 0 ? 0 : 0.1);
        if(i === 0){
          const cost = local + (p - 1)*0.4;
          if(!best || cost < best.cost) best = { cost, c, prev: null };
          continue;
        }
        for(let q = 1; q <= P; q++){
          const pr = dp[i-1][q];
          if(!pr) continue;
          const shift = p === q ? 0 : 2 + Math.abs(p - q)*0.5;
          const jump = Math.abs(c.string - pr.c.string)*0.15;
          const cost = pr.cost + local + shift + jump;
          if(!best || cost < best.cost) best = { cost, c, prev: q };
        }
      }
      row[p] = best;
    }
    dp.push(row);
  }
  const out = new Array(notes.length);
  let p = null, bestCost = INF;
  if(notes.length) for(let q = 1; q <= P; q++) if(dp[notes.length-1][q] && dp[notes.length-1][q].cost < bestCost){ bestCost = dp[notes.length-1][q].cost; p = q; }
  for(let i = notes.length - 1; i >= 0; i--){
    const st = p !== null ? dp[i][p] : null;
    if(!st){ out[i] = { written: notes[i], string: null, fret: null, finger: null, pos: null }; p = null; continue; }
    out[i] = { written: notes[i], string: st.c.string, fret: st.c.fret, finger: st.c.fret === 0 ? 0 : st.c.fret - p + 1, pos: p };
    p = st.prev;
  }
  return out;
}

// Akort okuması: frekansın en yakın açık tele (ya da verilen tele) göre sapması.
// Döner: { string, target (duyulan MIDI), cents, advice: "tamam" | "sık" | "gevşet" }
function tunerReading(freq, string = null){
  const m = freqToMidi(freq);
  let s = string;
  if(s === null){
    let bd = Infinity;
    for(let k = 1; k <= 6; k++){ const d = Math.abs(m - stringOpen(k)); if(d < bd){ bd = d; s = k; } }
  }
  const target = stringOpen(s), cents = Math.round((m - target)*100);
  return { string: s, target, cents, advice: Math.abs(cents) <= 5 ? "tamam" : cents < 0 ? "sık" : "gevşet" };
}

function analyze(freq, transpose){
  const concertF = freqToMidi(freq);
  const writtenF = concertF + transpose;
  const written = Math.round(writtenF);
  const cents = Math.round((writtenF-written)*100);
  const positions = positionsFor(written);
  return {
    freq, cents, written, pitch: writtenF,     // pitch: kesirli yazılı MIDI (entonasyon izi için)
    writtenName: noteName(written),
    soundingName: noteName(written-transpose),
    positions,
    openString: (positions.find(p => p.fret===0) || {}).string || null,
    inRange: positions.length>0
  };
}
