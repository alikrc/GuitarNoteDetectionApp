// Kulak eğitimi: soru üretme. Ses çalma arayüzde; burada yalnızca hangi seslerin çalınacağı ve doğru cevap.
// Tarayıcıda <script> ile sırayla yüklenir; Node testleri vm ile aynı sırada yükler.

// Tekrarlanabilir rastgele sayı (testler için tohumlanabilir): 0 ≤ x < 1
function makeRng(seed = Date.now()){
  let s = seed >>> 0;
  return () => { s = (s*1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// answers: [cevap kimliği, görünen ad]. Notalar duyulan MIDI.
const EAR_MODES = {
  kalite2: { name:"Majör mü minör mü?", hint:"Majör daha parlak ve “mutlu”, minör daha karanlık ve “hüzünlü” duyulur.",
             answers:[["", "Majör"], ["m", "Minör"]] },
  kalite3: { name:"Majör, minör ya da yedili?", hint:"Dominant yedili majör gibidir ama gergin, çözülmek ister.",
             answers:[["", "Majör"], ["m", "Minör"], ["7", "Dominant yedili"]] },
  aralik:  { name:"Aralık (iki nota arası)", hint:"Önce pes, sonra tiz nota çalar. Tam beşli “boş” ve güçlü, oktav aynı notanın tizi gibi duyulur.",
             answers:[[3, "Küçük üçlü"], [4, "Büyük üçlü"], [5, "Tam dörtlü"], [7, "Tam beşli"], [12, "Oktav"]] },
  tel:     { name:"Hangi açık tel?", hint:"Standart akortta açık teller: 6. Mi, 5. La, 4. Re, 3. Sol, 2. Si, 1. Mi.",
             answers:[[6, "6. tel · Mi"], [5, "5. tel · La"], [4, "4. tel · Re"], [3, "3. tel · Sol"], [2, "2. tel · Si"], [1, "1. tel · Mi"]] }
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
  return a ? a[1] : "?";
}
