// Kulak eğitimi: soru üretme. Ses çalma arayüzde; burada yalnızca hangi seslerin çalınacağı ve doğru cevap.
// Tarayıcıda <script> ile sırayla yüklenir; Node testleri vm ile aynı sırada yükler.

// Tekrarlanabilir rastgele sayı (testler için tohumlanabilir): 0 ≤ x < 1
function makeRng(seed = Date.now()){
  let s = seed >>> 0;
  return () => { s = (s*1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// answers: [cevap kimliği, görünen ad, İngilizce ad]. Notalar duyulan MIDI.
const EAR_MODES = {
  kalite2: { name:"Majör mü minör mü?", name_en:"Major or minor?",
             hint:"Majör daha parlak ve “mutlu”, minör daha karanlık ve “hüzünlü” duyulur.",
             hint_en:"Major sounds brighter and “happy”, minor darker and “sad”.",
             answers:[["", "Majör", "Major"], ["m", "Minör", "Minor"]] },
  kalite3: { name:"Majör, minör ya da yedili?", name_en:"Major, minor or seventh?",
             hint:"Dominant yedili majör gibidir ama gergin, çözülmek ister.",
             hint_en:"A dominant seventh is like major but tense; it wants to resolve.",
             answers:[["", "Majör", "Major"], ["m", "Minör", "Minor"], ["7", "Dominant yedili", "Dominant seventh"]] },
  aralik:  { name:"Aralık (iki nota arası)", name_en:"Interval (distance between two notes)",
             hint:"Önce pes, sonra tiz nota çalar. Tam beşli “boş” ve güçlü, oktav aynı notanın tizi gibi duyulur.",
             hint_en:"The low note plays first, then the high one. A perfect fifth sounds “open” and strong, an octave like the same note higher up.",
             answers:[[3, "Küçük üçlü", "Minor third"], [4, "Büyük üçlü", "Major third"], [5, "Tam dörtlü", "Perfect fourth"], [7, "Tam beşli", "Perfect fifth"], [12, "Oktav", "Octave"]] },
  tel:     { name:"Hangi açık tel?", name_en:"Which open string?",
             hint:"Standart akortta açık teller: 6. Mi, 5. La, 4. Re, 3. Sol, 2. Si, 1. Mi.",
             hint_en:"Open strings in standard tuning: 6th E, 5th A, 4th D, 3rd G, 2nd B, 1st E.",
             answers:[[6, "6. tel · Mi", "6th string · E"], [5, "5. tel · La", "5th string · A"], [4, "4. tel · Re", "4th string · D"],
                      [3, "3. tel · Sol", "3rd string · G"], [2, "2. tel · Si", "2nd string · B"], [1, "1. tel · Mi", "1st string · E"]] }
};
const EAR_ROUND = 10;   // bir turdaki soru sayısı

// Soru: { mode, answer, notes: [duyulan MIDI], arpeggio (akor önce birlikte, sonra tek tek) }
function earQuestion(mode, rng){
  const m = EAR_MODES[mode];
  if(!m) throw new Error("bilinmeyen kulak modu: " + mode);
  const pick = m.answers[Math.floor(rng()*m.answers.length)][0];
  if(mode === "kalite2" || mode === "kalite3"){
    const root = 48 + Math.floor(rng()*12);                 // Do3 – Si3
    return { mode, answer: pick, notes: CHORD_TYPES[pick].iv.map(i => root + i), arpeggio: true };
  }
  if(mode === "aralik"){
    const low = 48 + Math.floor(rng()*12);
    return { mode, answer: pick, notes: [low, low + pick], arpeggio: false };
  }
  return { mode, answer: pick, notes: [TUNINGS.standart.strings[6 - pick]], arpeggio: false };
}
function earAnswerName(mode, answer){
  const a = EAR_MODES[mode].answers.find(x => x[0] === answer);
  return a ? (LANG === "en" ? a[2] : a[1]) : "?";
}
