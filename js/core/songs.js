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
// group: "turku" anonim türküler, "pd" telif süresi dolmuş yabancı eserler, "ex" alıştırmalar. Uygulama hiçbir şarkının
// sözünü içermez (lyricsNote ekranda yazar); kullanıcı sözleri kendisi ekleyebilir (mergeLyrics), bunlar yalnız tarayıcıda kalır.
// capo: şarkı yüklenince Akorlar sekmesindeki capo bu değere ayarlanır.
const SONGS = [
  { id:"gulpembe", title:"Gülpembe", artist:"Barış Manço", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"sekizlik", bpm:76, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1471214",
    meta:"Barış Manço · Em, Am, D, G, F · basitleştirilmiş", meta_en:"Barış Manço · Em, Am, D, G, F · simplified",
    text:"Giriş: [Em*2] [Am] [Em] [D] [G] [F] [Em]\nKıta: [Em] [Am]\n[Em] [D] [G] [F] [Em]\n[Em] [Am]\n[Em] [D] [G] [F] [Em]\nNakarat: [D] [Em] [D] [Em]\n[D] [Em] [D] [Em]\nKıta: [Em] [Am]\n[Em] [D] [G] [F] [Em]\nNakarat: [D] [Em] [D] [Em]\n[D] [Em] [D] [Em*2]" },
  { id:"istanbulda-sonbahar", title:"İstanbul'da Sonbahar", artist:"Teoman", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"pop", bpm:72, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/teoman/istanbulda-sonbahar-chords-1091109",
    meta:"Teoman · Am, Dm, G, C, F · basitleştirilmiş (Amadd4/B geçişi atlandı, Fdim7 yerine F)", meta_en:"Teoman · Am, Dm, G, C, F · simplified (Amadd4/B passing chord omitted, F instead of Fdim7)",
    text:"Kıta: [Am] [Dm]\n[Am] [G]\n[Am*2]\n[Am] [Dm]\n[Am] [G]\n[Am] [C]\nNakarat: [Dm] [Am]\n[Dm] [Am]\n[Dm] [Am]\n[F*2] [Am]\n[Dm] [Am]\n[Dm] [Am]\n[Dm] [Am]\n[F*2] [Am*2]" },
  { id:"bu-aksam", title:"Bu Akşam", artist:"Duman", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"sekizlik", bpm:88, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/duman/bu-aksam-chords-3596183",
    meta:"Duman · Bm, G, A, Em, F♯ · basitleştirilmiş", meta_en:"Duman · Bm, G, A, Em, F♯ · simplified",
    text:"Giriş: [Bm] [G] [A] [Em] [Bm] [G] [A*2]\n[Bm] [G] [A] [Em] [G] [A] [Bm*2]\nKıta: [Bm] [G] [A] [Em]\n[Bm] [G] [A*2]\n[Bm] [G] [A] [Em]\n[G] [A] [Bm*2]\nNakarat: [Bm] [G] [Em*2]\n[F#] [Bm] [G] [Em]\n[F#] [Bm] [G] [Em]\n[F#] [G] [A*2]\nKıta: [Bm] [G] [A] [Em]\n[Bm] [G] [A*2]\n[Bm] [G] [A] [Em]\n[G] [A] [Bm*2]\nNakarat: [Bm] [G] [Em*2]\n[F#] [Bm] [G] [Em]\n[F#] [Bm] [G] [Em]\n[F#] [G] [A*2]\nBitiş: [Bm*2]" },
  { id:"senden-daha-guzel", title:"Senden Daha Güzel", artist:"Duman", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"sekizlik", bpm:96, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/duman/senden-daha-guzel-chords-2445059",
    meta:"Duman · Am, B · basitleştirilmiş", meta_en:"Duman · Am, B · simplified",
    text:"Kıta: [Am] [B]\n[Am*2] [B*2]\n[Am*2] [B*2]\n[Am*2] [B*2]\nNakarat: [Am] [B] [Am] [B]\n[Am] [B] [Am] [B]\nKıta: [Am] [B]\n[Am*2] [B*2]\n[Am*2] [B*2]\n[Am*2] [B*2]\nNakarat: [Am] [B] [Am] [B]\n[Am] [B] [Am] [B*2]" },
  { id:"ele-gune-karsi", title:"Ele Güne Karşı", artist:"MFÖ", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"pop", bpm:92, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1407012",
    meta:"MFÖ · Em, Am, G, D, B7, C · basitleştirilmiş (nakarattaki Em – Em/F♯ – Em/G bas yürüyüşü Em olarak yazıldı)", meta_en:"MFÖ · Em, Am, G, D, B7, C · simplified (the Em – Em/F♯ – Em/G bass walk in the chorus is written as Em)",
    text:"Kıta: [Em*2]\n[Am] [Em]\n[G] [Am]\n[D] [B7]\nKıta: [Em*2]\n[Am] [Em]\n[G] [Am]\n[D] [B7]\nNakarat: [C] [D] [Am] [Em*2]\n[C] [D] [Am] [Em*2]\n[Am] [Em]\n[C] [B7]\nKıta: [Em*2]\n[Am] [Em]\n[G] [Am]\n[D] [B7]\nNakarat: [C] [D] [Am] [Em*2]\n[C] [D] [Am] [Em*2]\n[Am] [Em]\n[C] [B7] [Em*2]" },
  { id:"bir-derdim-var", title:"Bir Derdim Var", artist:"Mor ve Ötesi", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"sekizlik", bpm:90, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1471202",
    meta:"Mor ve Ötesi · Bm, A, Em, G, D, F♯ · basitleştirilmiş (kaynakta bölüm adı yok; bölümler sırayla verildi)", meta_en:"Mor ve Ötesi · Bm, A, Em, G, D, F♯ · simplified (no section names in the source; sections given in order)",
    text:"1. bölüm: [Bm*2] [A*2] [Em*2]\n[Bm*2] [A*2] [Em] [G] [A]\nAra: [Bm] [G] [Bm] [G]\n2. bölüm: [Bm*2] [A*2] [Em*2]\n[D] [F#]\n[Bm] [G]\n[Em] [G] [Em] [G] [A] [Bm*2]" },
  { id:"resimdeki-gozyaslari", title:"Resimdeki Gözyaşları", artist:"Cem Karaca", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"dortluk", bpm:70, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/2616474",
    meta:"Cem Karaca · Am, Dm, B, E, G · basitleştirilmiş", meta_en:"Cem Karaca · Am, Dm, B, E, G · simplified",
    text:"Nakarat: [Am*2] [Dm*2] [B*2] [E*2]\nKöprü: [Am] [Dm] [Am] [Dm] [G] [Am]\nNakarat: [Am*2] [Dm*2] [B*2] [E*2]\nKıta: [Dm] [Am]\n[E] [Am]\n[Dm] [Am]\n[E] [Am*2]\nNakarat: [Am*2] [Dm*2] [B*2] [E*2]\nKöprü: [Am] [Dm] [Am] [Dm]" },
  { id:"belki-ustumuzden", title:"Belki Üstümüzden Bir Kuş Geçer", artist:"Yüksek Sadakat", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"pop", bpm:78, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1845925",
    meta:"Yüksek Sadakat · Fmaj7, G, Em, Am, Dm, C, F · basitleştirilmiş (G6 yerine G; Fdim geçişi atlandı)", meta_en:"Yüksek Sadakat · Fmaj7, G, Em, Am, Dm, C, F · simplified (G instead of G6; Fdim passing chord omitted)",
    text:"Giriş: [Fmaj7] [G] [Em*2]\nKıta: [Em] [G]\n[G] [Em]\n[Em] [G]\n[G] [Em]\nÖn nakarat: [Am] [Fmaj7]\n[G*2]\n[Am] [Fmaj7]\n[G*2]\nNakarat: [Fmaj7] [Em]\n[Dm] [Em]\n[Am] [Fmaj7] [Em]\n[Dm] [Em]\n[Fmaj7] [Em]\n[Dm] [Em]\n[Am] [Fmaj7] [G]\n[Dm] [G]\nBitiş: [Am] [C] [G] [Dm] [F] [G] [Em*2]" },
  { id:"degmesin-ellerimiz", title:"Değmesin Ellerimiz", artist:"Model", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"pop", bpm:80, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/1748383",
    meta:"Model · Dm, A, Gm, B♭, F, C · basitleştirilmiş (kaynakta bölüm adı yok; bölüm adları akor dizisine göre verildi)", meta_en:"Model · Dm, A, Gm, B♭, F, C · simplified (no section names in the source; names assigned from the chord sequence)",
    text:"Kıta: [Dm] [A] [Dm] [A]\n[Gm] [Dm] [Gm] [A]\n[Dm] [A] [Dm] [A]\n[Gm] [Dm] [Gm] [A]\nÖn nakarat: [Gm] [Bb] [Dm*2]\n[Gm] [Bb] [Dm*2]\nNakarat: [Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C]\nKıta: [Dm] [A] [Dm] [A]\n[Gm] [Dm] [Gm] [A]\nÖn nakarat: [Gm] [Bb] [Dm*2]\n[Gm] [Bb] [Dm*2]\nNakarat: [Gm] [Dm] [F] [C]\n[Gm] [Dm] [F] [C] [Dm*2]" },
  { id:"paramparca", title:"Paramparça", artist:"Teoman", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"sekizlik", bpm:80, capo:0,
    source:"https://tabs.ultimate-guitar.com/tab/2491125",
    meta:"Teoman · Bm, Em, F♯ · basitleştirilmiş", meta_en:"Teoman · Bm, Em, F♯ · simplified",
    text:"Kıta: [Bm*2] [Em*2] [Bm*2] [F#] [Bm]\n[Bm*2] [Em*2] [Bm*2] [F#] [Bm]\nNakarat: [Em*2] [Bm*2] [F#*2] [Bm*2]\n[Em*2] [Bm*2] [F#] [Bm]\n[Bm] [F#] [Bm]\nKıta: [Bm*2] [Em*2] [Bm*2] [F#] [Bm]" },
  { id:"kum-gibi", title:"Kum Gibi", artist:"Ahmet Kaya", group:"tr", lyricsNote:"Sözler telifli olduğu için eklenmedi.", lyricsNote_en:"Lyrics are not included because they are copyrighted.", rhythm:"dortluk", bpm:76, capo:3,
    source:"https://tabs.ultimate-guitar.com/tab/ahmet-kaya/kum-gibi-chords-3168728",
    meta:"Ahmet Kaya · E, Am, F, Dm · capo 3 · basitleştirilmiş (aslı Do minör (Cm, G, A♭, Fm); capo 3 ile Am, E, F, Dm şekilleriyle çalınır; A♭/E♭, A♭/C, A♭7 yerine F, Fm7 yerine Dm, Gmaj7 yerine E)", meta_en:"Ahmet Kaya · E, Am, F, Dm · capo 3 · simplified (original key C minor (Cm, G, A♭, Fm); played with capo 3 using Am, E, F, Dm shapes; F instead of A♭/E♭, A♭/C, A♭7, Dm instead of Fm7, E instead of Gmaj7)",
    text:"Giriş: [E*2] [Am] [E]\n[E] [F] [F] [Dm]\n[F] [Dm] [F] [E]\nKıta: [Am] [E] [Am]\n[E] [Am] [E]\n[Am] [E] [F]\n[Dm] [F] [E]\nNakarat: [Am] [F] [E]\n[E] [Am] [F]\n[F*2] [Dm]\n[F] [Dm] [F] [E]\nKıta: [Am] [E] [Am]\n[E] [Am] [E]\n[Am] [E] [F]\n[Dm] [F] [E]\nNakarat: [Am] [F] [E]\n[E] [Am] [F]\n[F*2] [Dm]\n[F] [Dm] [F] [E] [Am*2]" },
  { id:"katibim", title:"Üsküdar'a Gider İken (Kâtibim)", artist:"Anonim türkü", artist_en:"Traditional", group:"turku", lyricsNote:"Sözler eklenmedi: uygulama şarkı sözü içermiyor.", lyricsNote_en:"Lyrics are not included: the app contains no song lyrics.",
    rhythm:"aksak", bpm:100, capo:5, source:"https://tabs.ultimate-guitar.com/tab/3496994",
    meta:"Anonim türkü · 9/8 aksak · Am, Dm, G, E, E7 · capo 5 (Re minör) · Müfit Erdağ düzenlemesi, basitleştirilmiş", meta_en:"Turkish folk song (anonymous) · 9/8 aksak · Am, Dm, G, E, E7 · capo 5 (D minor) · Müfit Erdağ arrangement, simplified",
    text:"Giriş: [Am] [Am] [Am] [Am]\n[Am] [Am] [E] [Am]\nKıta: [Am] [Dm] [Am] [G] [Am]\n[Am] [Dm] [Am] [G] [Am]\n[Am] [Am] [G] [E] [E]\n[Am] [Am] [E7] [Am]\nKıta: [Am] [Dm] [Am] [G] [Am]\n[Am] [Dm] [Am] [G] [Am]\n[Am] [Am] [G] [E] [E]\n[Am] [Am] [E7] [Am]\nAra: [Am] [Am] [Am] [Am]\n[Am] [Am] [E] [Am]" },
  { id:"sari-gelin", title:"Sarı Gelin", artist:"Anonim türkü", artist_en:"Traditional", group:"turku", lyricsNote:"Sözler eklenmedi: uygulama şarkı sözü içermiyor.", lyricsNote_en:"Lyrics are not included: the app contains no song lyrics.",
    rhythm:"dortluk", bpm:72, capo:0, source:"https://tabs.ultimate-guitar.com/tab/misc-traditional/sari-gelin-chords-1686319",
    meta:"Anonim türkü · Dm, C, Am, G · kaynak sayfa oylanmamış, doğrulanmamış; bölüm adı yok", meta_en:"Turkish folk song (anonymous) · Dm, C, Am, G · source page unrated, unverified; no section names",
    text:"Giriş: [Dm] [C] [Am] [C] [Dm] [C] [G] [Am]\n[Dm] [C] [Am] [C] [Dm] [C] [G] [Am]\n1. bölüm: [Am] [C] [Am]\n[Dm] [C] [G] [Am]\n2. bölüm: [Dm] [C] [Am] [C]\n[Dm] [C] [G] [Am]\n1. bölüm: [Am] [C] [Am]\n[Dm] [C] [G] [Am]\n2. bölüm: [Dm] [C] [Am] [C]\n[Dm] [C] [G] [Am*2]" },
  { id:"yemen-turkusu", title:"Yemen Türküsü", artist:"Anonim türkü", artist_en:"Traditional", group:"turku", lyricsNote:"Sözler eklenmedi: uygulama şarkı sözü içermiyor.", lyricsNote_en:"Lyrics are not included: the app contains no song lyrics.",
    rhythm:"dortluk", bpm:76, capo:0, source:"https://tabs.ultimate-guitar.com/tab/misc-traditional/yemen-turkusu-chords-3168806",
    meta:"Anonim türkü · Re minör · Dm, F, C, Gm, B♭ · kaynak sayfa oylanmamış, doğrulanmamış", meta_en:"Turkish folk song (anonymous) · D minor · Dm, F, C, Gm, B♭ · source page unrated, unverified",
    text:"Kıta: [Dm] [F] [C] [Dm]\n[F] [C] [Dm]\n[F] [C] [Dm]\nNakarat: [Dm] [Gm] [C] [F]\n[Bb] [C] [Dm]\n[Dm] [Gm] [C] [F]\n[Bb] [C] [Dm]\nKıta: [Dm] [F] [C] [Dm]\n[F] [C] [Dm]\n[F] [C] [Dm]\nNakarat: [Dm] [Gm] [C] [F]\n[Bb] [C] [Dm]\n[Dm] [Gm] [C] [F]\n[Bb] [C] [Dm*2]" },
  { id:"amazing-grace", title:"Amazing Grace", artist:"Geleneksel", artist_en:"Traditional", group:"pd", lyricsNote:"Sözler eklenmedi: uygulama şarkı sözü içermiyor.", lyricsNote_en:"Lyrics are not included: the app contains no song lyrics.", capo:0, rhythm:"vals", bpm:90,
    meta:"Geleneksel İngiliz ilahisi (1779) · 3/4 · G, C, D, Em · basitleştirilmiş", meta_en:"Traditional English hymn (1779) · 3/4 · G, C, D, Em · simplified",
    text:"1. satır: [G*2] [C] [G*2]\n2. satır: [D*2]\n3. satır: [G*2] [C] [G*2]\n4. satır: [Em] [D] [G*2]" },
  { id:"happy-birthday", title:"Happy Birthday to You", artist:"Geleneksel", artist_en:"Traditional", group:"pd", lyricsNote:"Sözler eklenmedi: uygulama şarkı sözü içermiyor.", lyricsNote_en:"Lyrics are not included: the app contains no song lyrics.", capo:0, rhythm:"vals", bpm:100,
    meta:"Geleneksel · 3/4 · G, C, D · basitleştirilmiş", meta_en:"Traditional · 3/4 · G, C, D · simplified",
    text:"1. satır: [G] [D*2]\n2. satır: [G*2]\n3. satır: [C*2]\n4. satır: [G] [D] [G]" },
  { id:"alistirma-am-f-c-g", title:"Alıştırma: Am – F – C – G", title_en:"Exercise: Am – F – C – G", group:"ex", capo:0, rhythm:"pop", bpm:80,
    meta:"Sözsüz akor alıştırması · 4/4 · en yaygın pop dizilişi", meta_en:"Chord exercise · 4/4 · the most common pop progression",
    text:"[Am]1 2 3 4   [F]1 2 3 4   [C]1 2 3 4   [G]1 2 3 4\n[Am]1 2 3 4   [F]1 2 3 4   [C]1 2 3 4   [G]1 2 3 4" },
  { id:"alistirma-g-d-em-c", title:"Alıştırma: G – D – Em – C", title_en:"Exercise: G – D – Em – C", group:"ex", capo:0, rhythm:"sekizlik", bpm:80,
    meta:"Sözsüz akor alıştırması · 4/4", meta_en:"Chord exercise · 4/4",
    text:"[G]1 2 3 4   [D]1 2 3 4   [Em]1 2 3 4   [C]1 2 3 4\n[G]1 2 3 4   [D]1 2 3 4   [Em]1 2 3 4   [C]1 2 3 4" }
];
function songById(id){ return SONGS.find(s => s.id === id) || null; }
// Hazır akor şemalarındaki bölüm adları (satır başında "Kıta:" gibi) İngilizcede çevrilerek gösterilir
const SECTION_EN = { "Giriş":"Intro", "Kıta":"Verse", "Nakarat":"Chorus", "Ön nakarat":"Pre-chorus", "Köprü":"Bridge",
                     "Ara":"Interlude", "Bitiş":"Outro", "Solo":"Solo", "bölüm":"Part", "satır":"Line" };
function localizeSections(text){
  if(LANG !== "en") return text;
  return text.split("\n").map(l => l
    .replace(/^(Giriş|Kıta|Nakarat|Ön nakarat|Köprü|Ara|Bitiş|Solo):/, (_, k) => SECTION_EN[k] + ":")
    .replace(/^(\d+)\. (bölüm|satır):/, (_, n, k) => SECTION_EN[k] + " " + n + ":")).join("\n");
}

// Kullanıcının yapıştırdığı sözleri akor satırlarıyla eşleştirir: boş olmayan her söz satırı sıradaki akorlu satıra gider,
// satırdaki akorlar sözcüklere eşit aralıkla dağıtılır (k. akor, floor(k·sözcük/akor). sözcüğün önüne). Satır başındaki
// "Kıta:" gibi etiketler korunur. Söz satırı biterse akor satırı olduğu gibi kalır; artan söz satırları akorsuz eklenir.
function mergeLyrics(chordText, lyricsText){
  const lyr = String(lyricsText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let j = 0;
  const out = String(chordText || "").split(/\r?\n/).map(line => {
    const chords = line.match(/\[[^\]]+\]/g);
    if(!chords || j >= lyr.length) return line;
    const first = line.indexOf("["), label = line.slice(0, first).trim();
    const words = lyr[j++].split(/\s+/), slots = words.map(() => "");
    chords.forEach((c, k) => { slots[Math.floor(k*words.length/chords.length)] += c; });
    return (label ? label + " " : "") + words.map((w, i) => slots[i] + w).join(" ");
  });
  while(j < lyr.length) out.push(lyr[j++]);
  return out.join("\n");
}

// ---- Ezgi ----
// Türkçe nota adı + oktav (yazılı, gitar yazımı): "Mi4", "Fa♯4", "Sib3". Döner: yazılı MIDI ya da null.
const NOTE_BASE = { do:0, re:2, mi:4, fa:5, sol:7, la:9, si:11 };
const LETTER_BASE = { c:0, d:2, e:4, f:5, g:7, a:9, b:11 };
function parseNoteName(s){
  const str = String(s).trim();
  let m = /^(do|re|mi|fa|sol|la|si)([#♯b♭]?)(-?\d)$/i.exec(str), base;
  if(m) base = NOTE_BASE[m[1].toLowerCase()];
  else{
    // İngilizce harf adı da olur: C4, F#4, Bb3
    m = /^([a-g])([#♯b♭]?)(-?\d)$/i.exec(str);
    if(!m) return null;
    base = LETTER_BASE[m[1].toLowerCase()];
  }
  const acc = m[2] === "#" || m[2] === "♯" ? 1 : m[2] === "b" || m[2] === "♭" ? -1 : 0;
  return (+m[3] + 1)*12 + base + acc;
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
  { id:"nese", title:"Neşeye Övgü", title_en:"Ode to Joy", bpm:90, meta:"Beethoven, 9. Senfoni (1824)", meta_en:"Beethoven, Symphony No. 9 (1824)",
    text:"Mi4 Mi4 Fa4 Sol4 Sol4 Fa4 Mi4 Re4 Do4 Do4 Re4 Mi4 Mi4:1.5 Re4:0.5 Re4:2 " +
         "Mi4 Mi4 Fa4 Sol4 Sol4 Fa4 Mi4 Re4 Do4 Do4 Re4 Mi4 Re4:1.5 Do4:0.5 Do4:2" },
  { id:"twinkle", title:"Twinkle Twinkle Little Star", bpm:100, meta:"Geleneksel Fransız ezgisi (Ah! vous dirai-je, maman)", meta_en:"Traditional French melody (Ah! vous dirai-je, maman)",
    text:"Do4 Do4 Sol4 Sol4 La4 La4 Sol4:2 Fa4 Fa4 Mi4 Mi4 Re4 Re4 Do4:2 " +
         "Sol4 Sol4 Fa4 Fa4 Mi4 Mi4 Re4:2 Sol4 Sol4 Fa4 Fa4 Mi4 Mi4 Re4:2 " +
         "Do4 Do4 Sol4 Sol4 La4 La4 Sol4:2 Fa4 Fa4 Mi4 Mi4 Re4 Re4 Do4:2" },
  { id:"frere-jacques", title:"Frère Jacques", bpm:100, meta:"Geleneksel Fransız ezgisi", meta_en:"Traditional French melody",
    text:"Do4 Re4 Mi4 Do4 Do4 Re4 Mi4 Do4 Mi4 Fa4 Sol4:2 Mi4 Fa4 Sol4:2 " +
         "Sol4:0.5 La4:0.5 Sol4:0.5 Fa4:0.5 Mi4 Do4 Sol4:0.5 La4:0.5 Sol4:0.5 Fa4:0.5 Mi4 Do4 " +
         "Do4 Sol3 Do4:2 Do4 Sol3 Do4:2" }
];
function melodyById(id){ return MELODIES.find(m => m.id === id) || null; }
