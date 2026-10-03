// Şarkılar (akor + söz) ve ezgiler (nota dizisi).
// Tarayıcıda <script> ile sırayla yüklenir (music → guitar → chords → rhythm → songs …); Node testleri vm ile aynı sırada yükler.

// ---- Şarkı ----
// Metin: köşeli parantez içinde akor, isteğe bağlı *N ile kaç ölçü sürdüğü: "A[G*2]mazing grace".
// Klavye yazımı da olur: [F#m], [Bb]. Akordan önceki söz (ön vuruş) akorsuz parça olarak gösterilir.
// Döner: { lines: [[{ chord, raw, bars, bar, lyric }]], bars: [akor sembolü, ölçü başına], errors: [tanınmayan akorlar] }
function parseSong(text){
  const lines = [], bars = [], errors = [];
  for(const raw of String(text || "").split(/\r?\n/)){
    const line = [], re = /\[([^\]*]+)(?:\*(\d+))?\]/g;
    let last = 0, cur = null, m;
    while((m = re.exec(raw))){
      const before = raw.slice(last, m.index);
      if(cur) cur.lyric += before;
      else if(before) line.push({ chord:null, raw:null, bars:0, bar:null, lyric:before });
      const c = chordBySymbol(m[1]), n = Math.max(1, Math.min(16, +(m[2] || 1)));
      if(!c) errors.push(m[1].trim());
      cur = { chord: c ? c.symbol : null, raw: m[1].trim(), bars: c ? n : 0, bar: c ? bars.length : null, lyric: "" };
      if(c) for(let k = 0; k < n; k++) bars.push(c.symbol);
      line.push(cur);
      last = re.lastIndex;
    }
    const rest = raw.slice(last);
    if(cur) cur.lyric += rest;
    else line.push({ chord:null, raw:null, bars:0, bar:null, lyric:rest });
    lines.push(line);
  }
  return { lines, bars, errors: [...new Set(errors)] };
}

// Hazır şarkılar: telif süresi dolmuş (kamu malı) eserler ve sözsüz alıştırmalar. Akorlar basitleştirilmiştir.
const SONGS = [
  { id:"amazing-grace", title:"Amazing Grace", rhythm:"vals", bpm:90,
    meta:"Geleneksel İngiliz ilahisi, söz John Newton (1779) · 3/4 · G, C, D, Em",
    text:"A[G*2]mazing grace, how [C]sweet the [G*2]sound\nthat saved a [D*2]wretch like me.\nI [G*2]once was lost, but [C]now am [G*2]found,\nwas [Em]blind but [D]now I [G*2]see." },
  { id:"happy-birthday", title:"Happy Birthday to You", rhythm:"vals", bpm:100,
    meta:"Geleneksel · 3/4 · G, C, D",
    text:"Happy [G]birthday to [D*2]you,\nhappy birthday to [G*2]you,\nhappy birthday dear [C*2]friend,\nhappy [G]birthday [D]to [G]you." },
  { id:"alistirma-am-f-c-g", title:"Alıştırma: Am – F – C – G", rhythm:"pop", bpm:80,
    meta:"Sözsüz akor alıştırması · 4/4 · en yaygın pop dizilişi",
    text:"[Am]1 2 3 4   [F]1 2 3 4   [C]1 2 3 4   [G]1 2 3 4\n[Am]1 2 3 4   [F]1 2 3 4   [C]1 2 3 4   [G]1 2 3 4" },
  { id:"alistirma-g-d-em-c", title:"Alıştırma: G – D – Em – C", rhythm:"sekizlik", bpm:80,
    meta:"Sözsüz akor alıştırması · 4/4",
    text:"[G]1 2 3 4   [D]1 2 3 4   [Em]1 2 3 4   [C]1 2 3 4\n[G]1 2 3 4   [D]1 2 3 4   [Em]1 2 3 4   [C]1 2 3 4" }
];
function songById(id){ return SONGS.find(s => s.id === id) || null; }

// ---- Ezgi ----
// Türkçe nota adı + oktav (yazılı, gitar yazımı): "Mi4", "Fa♯4", "Sib3". Döner: yazılı MIDI ya da null.
const NOTE_BASE = { do:0, re:2, mi:4, fa:5, sol:7, la:9, si:11 };
function parseNoteName(s){
  const m = /^(do|re|mi|fa|sol|la|si)([#♯b♭]?)(-?\d)$/i.exec(String(s).trim());
  if(!m) return null;
  const acc = m[2] === "#" || m[2] === "♯" ? 1 : m[2] === "b" || m[2] === "♭" ? -1 : 0;
  return (+m[3] + 1)*12 + NOTE_BASE[m[1].toLowerCase()] + acc;
}
// Ezgi metni: boşlukla ayrılmış notalar, isteğe bağlı ":süre" (vuruş; varsayılan 1): "Mi4 Mi4 Fa4 Sol4:2".
// Döner: { notes: [{ written, beats }], errors: [tanınmayan parçalar] }
function parseMelody(text){
  const notes = [], errors = [];
  for(const tok of String(text || "").split(/\s+/).filter(Boolean)){
    const [n, d] = tok.split(":");
    const w = parseNoteName(n), beats = d === undefined ? 1 : parseFloat(d.replace(",", "."));
    if(w === null || !(beats > 0 && beats <= 8)) errors.push(tok);
    else notes.push({ written: w, beats });
  }
  return { notes, errors };
}
// Hazır ezgiler: kamu malı ezgiler, 1. pozisyonda çalınabilir.
const MELODIES = [
  { id:"nese", title:"Neşeye Övgü", bpm:90, meta:"Beethoven, 9. Senfoni (1824)",
    text:"Mi4 Mi4 Fa4 Sol4 Sol4 Fa4 Mi4 Re4 Do4 Do4 Re4 Mi4 Mi4:1.5 Re4:0.5 Re4:2 " +
         "Mi4 Mi4 Fa4 Sol4 Sol4 Fa4 Mi4 Re4 Do4 Do4 Re4 Mi4 Re4:1.5 Do4:0.5 Do4:2" },
  { id:"twinkle", title:"Twinkle Twinkle Little Star", bpm:100, meta:"Geleneksel Fransız ezgisi (Ah! vous dirai-je, maman)",
    text:"Do4 Do4 Sol4 Sol4 La4 La4 Sol4:2 Fa4 Fa4 Mi4 Mi4 Re4 Re4 Do4:2 " +
         "Sol4 Sol4 Fa4 Fa4 Mi4 Mi4 Re4:2 Sol4 Sol4 Fa4 Fa4 Mi4 Mi4 Re4:2 " +
         "Do4 Do4 Sol4 Sol4 La4 La4 Sol4:2 Fa4 Fa4 Mi4 Mi4 Re4 Re4 Do4:2" },
  { id:"frere-jacques", title:"Frère Jacques", bpm:100, meta:"Geleneksel Fransız ezgisi",
    text:"Do4 Re4 Mi4 Do4 Do4 Re4 Mi4 Do4 Mi4 Fa4 Sol4:2 Mi4 Fa4 Sol4:2 " +
         "Sol4:0.5 La4:0.5 Sol4:0.5 Fa4:0.5 Mi4 Do4 Sol4:0.5 La4:0.5 Sol4:0.5 Fa4:0.5 Mi4 Do4 " +
         "Do4 Sol3 Do4:2 Do4 Sol3 Do4:2" }
];
function melodyById(id){ return MELODIES.find(m => m.id === id) || null; }
