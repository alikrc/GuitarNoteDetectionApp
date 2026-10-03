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

// Hazır şarkılar. group: "tr" Türkçe pop/rock — sözler telifli olduğu için yalnız bölüm adları ve akorlar, sözler için
// kaynak bağlantısı (akorlar Ultimate Guitar kullanıcı sayfalarından, uygulamadaki şekillere sadeleştirilmiş; süreler
// kaynakta yok: tek akorlu satır 2 ölçü, diğerleri akor başına 1 ölçü sayıldı, tempo ve vuruş önerisi yaklaşık).
// group: "pd" telif süresi dolmuş (kamu malı) eserler sözleriyle; group: "ex" sözsüz alıştırmalar.
// capo: şarkı yüklenince Akorlar sekmesindeki capo bu değere ayarlanır.
const SONGS = [
  { id:"gulpembe", title:"Gülpembe", artist:"Barış Manço", group:"tr", rhythm:"sekizlik", bpm:76, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1471214",
    meta:"Barış Manço · Em, Am, D, G, F · basitleştirilmiş",
    text:"Giriş: [Em*2] [Am] [Em] [D] [G] [F] [Em]\nKıta: [Em] [Am]\n[Em] [D] [G] [F] [Em]\n[Em] [Am]\n[Em] [D] [G] [F] [Em]\nNakarat: [D] [Em] [D] [Em]\n[D] [Em] [D] [Em]\nKıta: [Em] [Am]\n[Em] [D] [G] [F] [Em]\nNakarat: [D] [Em] [D] [Em]\n[D] [Em] [D] [Em*2]" },
  { id:"istanbulda-sonbahar", title:"İstanbul'da Sonbahar", artist:"Teoman", group:"tr", rhythm:"pop", bpm:72, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/teoman/istanbulda-sonbahar-chords-1091109",
    meta:"Teoman · Am, Dm, G, C, F · basitleştirilmiş (Amadd4/B geçişi atlandı, Fdim7 yerine F)",
    text:"Kıta: [Am] [Dm]\n[Am] [G]\n[Am*2]\n[Am] [Dm]\n[Am] [G]\n[Am] [C]\nNakarat: [Dm] [Am]\n[Dm] [Am]\n[Dm] [Am]\n[F*2] [Am]\n[Dm] [Am]\n[Dm] [Am]\n[Dm] [Am]\n[F*2] [Am*2]" },
  { id:"bu-aksam", title:"Bu Akşam", artist:"Duman", group:"tr", rhythm:"sekizlik", bpm:88, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/duman/bu-aksam-chords-3596183",
    meta:"Duman · Bm, G, A, Em, F♯ · basitleştirilmiş",
    text:"Giriş: [Bm] [G] [A] [Em] [Bm] [G] [A*2]\n[Bm] [G] [A] [Em] [G] [A] [Bm*2]\nKıta: [Bm] [G] [A] [Em]\n[Bm] [G] [A*2]\n[Bm] [G] [A] [Em]\n[G] [A] [Bm*2]\nNakarat: [Bm] [G] [Em*2]\n[F#] [Bm] [G] [Em]\n[F#] [Bm] [G] [Em]\n[F#] [G] [A*2]\nKıta: [Bm] [G] [A] [Em]\n[Bm] [G] [A*2]\n[Bm] [G] [A] [Em]\n[G] [A] [Bm*2]\nNakarat: [Bm] [G] [Em*2]\n[F#] [Bm] [G] [Em]\n[F#] [Bm] [G] [Em]\n[F#] [G] [A*2]\nBitiş: [Bm*2]" },
  { id:"senden-daha-guzel", title:"Senden Daha Güzel", artist:"Duman", group:"tr", rhythm:"sekizlik", bpm:96, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/duman/senden-daha-guzel-chords-2445059",
    meta:"Duman · Am, B · basitleştirilmiş",
    text:"Kıta: [Am] [B]\n[Am*2] [B*2]\n[Am*2] [B*2]\n[Am*2] [B*2]\nNakarat: [Am] [B] [Am] [B]\n[Am] [B] [Am] [B]\nKıta: [Am] [B]\n[Am*2] [B*2]\n[Am*2] [B*2]\n[Am*2] [B*2]\nNakarat: [Am] [B] [Am] [B]\n[Am] [B] [Am] [B*2]" },
  { id:"ele-gune-karsi", title:"Ele Güne Karşı", artist:"MFÖ", group:"tr", rhythm:"pop", bpm:92, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1407012",
    meta:"MFÖ · Em, Am, G, D, B7, C · basitleştirilmiş (nakarattaki Em – Em/F♯ – Em/G bas yürüyüşü Em olarak yazıldı)",
    text:"Kıta: [Em*2]\n[Am] [Em]\n[G] [Am]\n[D] [B7]\nKıta: [Em*2]\n[Am] [Em]\n[G] [Am]\n[D] [B7]\nNakarat: [C] [D] [Am] [Em*2]\n[C] [D] [Am] [Em*2]\n[Am] [Em]\n[C] [B7]\nKıta: [Em*2]\n[Am] [Em]\n[G] [Am]\n[D] [B7]\nNakarat: [C] [D] [Am] [Em*2]\n[C] [D] [Am] [Em*2]\n[Am] [Em]\n[C] [B7] [Em*2]" },
  { id:"bir-derdim-var", title:"Bir Derdim Var", artist:"Mor ve Ötesi", group:"tr", rhythm:"sekizlik", bpm:90, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1471202",
    meta:"Mor ve Ötesi · Bm, A, Em, G, D, F♯ · basitleştirilmiş (kaynakta bölüm adı yok; bölümler sırayla verildi)",
    text:"1. bölüm: [Bm*2] [A*2] [Em*2]\n[Bm*2] [A*2] [Em] [G] [A]\nAra: [Bm] [G] [Bm] [G]\n2. bölüm: [Bm*2] [A*2] [Em*2]\n[D] [F#]\n[Bm] [G]\n[Em] [G] [Em] [G] [A] [Bm*2]" },
  { id:"resimdeki-gozyaslari", title:"Resimdeki Gözyaşları", artist:"Cem Karaca", group:"tr", rhythm:"dortluk", bpm:70, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/2616474",
    meta:"Cem Karaca · Am, Dm, B, E, G · basitleştirilmiş",
    text:"Nakarat: [Am*2] [Dm*2] [B*2] [E*2]\nKöprü: [Am] [Dm] [Am] [Dm] [G] [Am]\nNakarat: [Am*2] [Dm*2] [B*2] [E*2]\nKıta: [Dm] [Am]\n[E] [Am]\n[Dm] [Am]\n[E] [Am*2]\nNakarat: [Am*2] [Dm*2] [B*2] [E*2]\nKöprü: [Am] [Dm] [Am] [Dm]" },
  { id:"belki-ustumuzden", title:"Belki Üstümüzden Bir Kuş Geçer", artist:"Yüksek Sadakat", group:"tr", rhythm:"pop", bpm:78, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1845925",
    meta:"Yüksek Sadakat · Fmaj7, G, Em, Am, Dm, C, F · basitleştirilmiş (G6 yerine G; Fdim geçişi atlandı)",
    text:"Giriş: [Fmaj7] [G] [Em*2]\nKıta: [Em] [G]\n[G] [Em]\n[Em] [G]\n[G] [Em]\nÖn nakarat: [Am] [Fmaj7]\n[G*2]\n[Am] [Fmaj7]\n[G*2]\nNakarat: [Fmaj7] [Em]\n[Dm] [Em]\n[Am] [Fmaj7] [Em]\n[Dm] [Em]\n[Fmaj7] [Em]\n[Dm] [Em]\n[Am] [Fmaj7] [G]\n[Dm] [G]\nBitiş: [Am] [C] [G] [Dm] [F] [G] [Em*2]" },
  { id:"degmesin-ellerimiz", title:"Değmesin Ellerimiz", artist:"Model", group:"tr", rhythm:"pop", bpm:80, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1748383",
    meta:"Model · Dm, A, Gm, B♭, F, C · basitleştirilmiş (kaynakta bölüm adı yok; bölüm adları akor dizisine göre verildi)",
    text:"Kıta: [Dm] [A] [Dm] [A]\n[Gm] [Dm] [Gm] [A]\n[Dm] [A] [Dm] [A]\n[Gm] [Dm] [Gm] [A]\nÖn nakarat: [Gm] [Bb] [Dm*2]\n[Gm] [Bb] [Dm*2]\nNakarat: [Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C]\nKıta: [Dm] [A] [Dm] [A]\n[Gm] [Dm] [Gm] [A]\nÖn nakarat: [Gm] [Bb] [Dm*2]\n[Gm] [Bb] [Dm*2]\nNakarat: [Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C] [Dm*2]" },
  { id:"paramparca", title:"Paramparça", artist:"Teoman", group:"tr", rhythm:"sekizlik", bpm:80, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/2491125",
    meta:"Teoman · Bm, Em, F♯ · basitleştirilmiş",
    text:"Kıta: [Bm*2] [Em*2] [Bm*2] [F#] [Bm]\n[Bm*2] [Em*2] [Bm*2] [F#] [Bm]\nNakarat: [Em*2] [Bm*2] [F#*2] [Bm*2]\n[Em*2] [Bm*2] [F#] [Bm]\n[Bm] [F#] [Bm]\nKıta: [Bm*2] [Em*2] [Bm*2] [F#] [Bm]" },
  { id:"kum-gibi", title:"Kum Gibi", artist:"Ahmet Kaya", group:"tr", rhythm:"dortluk", bpm:76, capo:3,
    source:"https://tabs.ultimate-guitar.com/tab/ahmet-kaya/kum-gibi-chords-3168728",
    meta:"Ahmet Kaya · E, Am, F, Dm · capo 3 · basitleştirilmiş (aslı Do minör (Cm, G, A♭, Fm); capo 3 ile Am, E, F, Dm şekilleriyle çalınır; A♭/E♭, A♭/C, A♭7 yerine F, Fm7 yerine Dm, Gmaj7 yerine E)",
    text:"Giriş: [E*2] [Am] [E]\n[E] [F] [F] [Dm]\n[F] [Dm] [F] [E]\nKıta: [Am] [E] [Am]\n[E] [Am] [E]\n[Am] [E] [F]\n[Dm] [F] [E]\nNakarat: [Am] [F] [E]\n[E] [Am] [F]\n[F*2] [Dm]\n[F] [Dm] [F] [E]\nKıta: [Am] [E] [Am]\n[E] [Am] [E]\n[Am] [E] [F]\n[Dm] [F] [E]\nNakarat: [Am] [F] [E]\n[E] [Am] [F]\n[F*2] [Dm]\n[F] [Dm] [F] [E] [Am*2]" },
  { id:"amazing-grace", title:"Amazing Grace", group:"pd", capo:0, rhythm:"vals", bpm:90,
    meta:"Geleneksel İngiliz ilahisi, söz John Newton (1779) · 3/4 · G, C, D, Em",
    text:"A[G*2]mazing grace, how [C]sweet the [G*2]sound\nthat saved a [D*2]wretch like me.\nI [G*2]once was lost, but [C]now am [G*2]found,\nwas [Em]blind but [D]now I [G*2]see." },
  { id:"happy-birthday", title:"Happy Birthday to You", group:"pd", capo:0, rhythm:"vals", bpm:100,
    meta:"Geleneksel · 3/4 · G, C, D",
    text:"Happy [G]birthday to [D*2]you,\nhappy birthday to [G*2]you,\nhappy birthday dear [C*2]friend,\nhappy [G]birthday [D]to [G]you." },
  { id:"alistirma-am-f-c-g", title:"Alıştırma: Am – F – C – G", group:"ex", capo:0, rhythm:"pop", bpm:80,
    meta:"Sözsüz akor alıştırması · 4/4 · en yaygın pop dizilişi",
    text:"[Am]1 2 3 4   [F]1 2 3 4   [C]1 2 3 4   [G]1 2 3 4\n[Am]1 2 3 4   [F]1 2 3 4   [C]1 2 3 4   [G]1 2 3 4" },
  { id:"alistirma-g-d-em-c", title:"Alıştırma: G – D – Em – C", group:"ex", capo:0, rhythm:"sekizlik", bpm:80,
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
