// Dersler: sıralı başlangıç kursu. Her dersin bir hedefi var; arayüzün yaydığı başarı olayları hedefle
// karşılaştırılır. Bir ders, bir öncekiler tamamlanınca açılır.
// Tarayıcıda <script> ile sırayla yüklenir; Node testleri vm ile aynı sırada yükler.

// goal.type ve arayüzün yaydığı olaylar:
//   tuned                         ← { type:"tuned" }                         (altı tel ±5 sent içinde)
//   chord   { chord }             ← { type:"chordClean", chord }             (tel tel kontrolde bütün teller doğru)
//   rhythm  { id, bpm, pct }      ← { type:"rhythm", id, bpm, pct, bars }    (birlikte çal, son 4 ölçü)
//   changes { pair, min }         ← { type:"changes", pair, perMin }         (1 dakikalık akor değiştirme)
//   ear     { mode, min }         ← { type:"ear", mode, correct, total }     (10 soruluk tur)
//   melody  { id }                ← { type:"melody", id }                    (ezgi baştan sona doğru çalındı)
//   song    { id, pct }           ← { type:"song", id, pct }                 (şarkı birlikte çalındı)
const LESSONS = [
  { id:"akort", title:"Gitarı akort et", title_en:"Tune your guitar", goal:{ type:"tuned" },
    text:"Önce akort: Akort sekmesinde telleri tek tek çal, ibre ortaya gelene kadar burguyu sık ya da gevşet. Altı tel de ✓ olunca ders tamamlanır.",
    text_en:"First, tuning: in the Tuner tab play each string and turn the peg tighter or looser until the needle is centred. When all six strings show ✓ the lesson is complete." },
  { id:"em", title:"İlk akor: Em", title_en:"First chord: Em", goal:{ type:"chord", chord:"Em" },
    text:"Em, yalnızca iki parmakla basılır: orta parmak 5. telde, yüzük parmağı 4. telde, ikisi de 2. perdede. Tel tel kontrolde altı tel de doğru çıkınca geçersin.",
    text_en:"Em needs only two fingers: middle finger on the 5th string, ring finger on the 4th string, both on the 2nd fret. You pass when all six strings come out right in the string-by-string check." },
  { id:"am", title:"Am akoru", title_en:"Am chord", goal:{ type:"chord", chord:"Am" },
    text:"Am, Em'in şekline benzer ama bir tel aşağı kayar ve işaret parmağı 2. telde 1. perdeye basar. 6. tel çalınmaz.",
    text_en:"Am looks like Em moved one string down, and the index finger presses the 2nd string at the 1st fret. Don't play the 6th string." },
  { id:"dortluk", title:"Dörtlük vuruş", title_en:"Quarter-note strum", goal:{ type:"rhythm", id:"dortluk", bpm:60, pct:80 },
    text:"Her vuruşta bir aşağı vuruş, 60 BPM'de. Birlikte çal modunda son 4 ölçünün %80'i zamanında olunca geçersin. Önce Ayarlar’dan “Gecikmeyi ölç”.",
    text_en:"One downstroke on every beat at 60 BPM. You pass when 80% of your strokes over the last 4 bars are on time in Play along. Use “Measure latency” in Settings first." },
  { id:"em-am", title:"Em ↔ Am geçişi", title_en:"Em ↔ Am change", goal:{ type:"changes", pair:["Em","Am"], min:15 },
    text:"Akor değiştirme alıştırması: bir dakikada Em ile Am arasında en az 15 temiz geçiş. Parmakları tek tek değil, şekil olarak birlikte taşı.",
    text_en:"Chord change exercise: at least 15 clean changes between Em and Am in one minute. Move your fingers together as a shape, not one by one." },
  { id:"kulak-kalite", title:"Kulak: majör mü minör mü", title_en:"Ear: major or minor", goal:{ type:"ear", mode:"kalite2", min:8 },
    text:"Kulak sekmesinde 10 sorudan en az 8'ini bil. Majör parlak, minör karanlık duyulur.",
    text_en:"Get at least 8 of 10 right in the Ear tab. Major sounds bright, minor dark." },
  { id:"c", title:"C akoru", title_en:"C chord", goal:{ type:"chord", chord:"C" },
    text:"C üç parmakla basılır: yüzük 5. telde 3. perde, orta 4. telde 2. perde, işaret 2. telde 1. perde. 6. tel çalınmaz.",
    text_en:"C uses three fingers: ring on the 5th string, 3rd fret; middle on the 4th string, 2nd fret; index on the 2nd string, 1st fret. Don't play the 6th string." },
  { id:"g", title:"G akoru", title_en:"G chord", goal:{ type:"chord", chord:"G" },
    text:"G: orta parmak 6. telde 3. perde, işaret 5. telde 2. perde, yüzük 1. telde 3. perde. Altı tel de çalınır.",
    text_en:"G: middle finger on the 6th string, 3rd fret; index on the 5th string, 2nd fret; ring on the 1st string, 3rd fret. All six strings are played." },
  { id:"sekizlik", title:"Sekizlik aşağı-yukarı", title_en:"Eighth-note down-up", goal:{ type:"rhythm", id:"sekizlik", bpm:70, pct:80 },
    text:"El sarkaç gibi sallanır: sayılarda aşağı, “ve”lerde yukarı. 70 BPM'de son 4 ölçünün %80'i zamanında olmalı.",
    text_en:"The hand swings like a pendulum: down on the numbers, up on the “ands”. At 70 BPM, 80% of the last 4 bars must be on time." },
  { id:"g-c", title:"G ↔ C geçişi", title_en:"G ↔ C change", goal:{ type:"changes", pair:["G","C"], min:20 },
    text:"Bir dakikada G ile C arasında en az 20 temiz geçiş. G'den C'ye giderken işaret parmağı 5. telden 2. tele iner.",
    text_en:"At least 20 clean changes between G and C in one minute. Going from G to C, the index finger moves from the 5th string to the 2nd." },
  { id:"ezgi", title:"İlk ezgi: Neşeye Övgü", title_en:"First melody: Ode to Joy", goal:{ type:"melody", id:"nese" },
    text:"Ezgiler sekmesinde Neşeye Övgü'yü notaları sırayla çalarak bitir. Hepsi 1. pozisyonda; parmak numaraları tabın altında yazar.",
    text_en:"In the Melodies tab, finish Ode to Joy by playing the notes in order. Everything is in the 1st position; the finger numbers are under each note." },
  { id:"d", title:"D akoru", title_en:"D chord", goal:{ type:"chord", chord:"D" },
    text:"D yalnızca dört tel: işaret 3. telde 2. perde, yüzük 2. telde 3. perde, orta 1. telde 2. perde. 5. ve 6. teller çalınmaz.",
    text_en:"D uses only four strings: index on the 3rd string, 2nd fret; ring on the 2nd string, 3rd fret; middle on the 1st string, 2nd fret. Don't play the 5th and 6th strings." },
  { id:"pop", title:"Pop / folk kalıbı", title_en:"Pop / folk pattern", goal:{ type:"rhythm", id:"pop", bpm:70, pct:80 },
    text:"Aşağı, aşağı-yukarı, yukarı-aşağı-yukarı. El sekizlikteki gibi sallanmaya devam eder; boş hücrelerde tele değmez.",
    text_en:"Down, down-up, up-down-up. The hand keeps swinging as in eighths; on empty cells it doesn't touch the strings." },
  { id:"sarki", title:"İlk şarkı: Amazing Grace", title_en:"First song: Amazing Grace", goal:{ type:"song", id:"amazing-grace", pct:70 },
    text:"Şarkılar sekmesinde Amazing Grace'i birlikte çal (G, C, D, Em; 3/4 vals). Vuruşların %70'i zamanında olunca tamamlanır.",
    text_en:"In the Songs tab, play along with Amazing Grace (G, C, D, Em; 3/4 waltz). It is complete when 70% of your strokes are on time." },
  { id:"kulak-aralik", title:"Kulak: aralıklar", title_en:"Ear: intervals", goal:{ type:"ear", mode:"aralik", min:8 },
    text:"İki nota arasındaki aralığı bil: küçük/büyük üçlü, tam dörtlü, tam beşli, oktav. 10 sorudan en az 8'i.",
    text_en:"Name the interval between two notes: minor/major third, perfect fourth, perfect fifth, octave. At least 8 of 10." },
  { id:"f", title:"Barre'ye giriş: F", title_en:"Into barre: F", goal:{ type:"chord", chord:"F" },
    text:"F, ilk barre akoru: işaret parmağı 1. perdede altı teli birden bastırır. Zorsa önce yalnız ince üç teli (küçük barre) dene.",
    text_en:"F is the first barre chord: the index finger presses all six strings at the 1st fret. If it's hard, start with only the three thin strings (small barre)." }
];

function goalMet(goal, ev){
  if(!goal || !ev) return false;
  switch(goal.type){
    case "tuned":   return ev.type === "tuned";
    case "chord":   return ev.type === "chordClean" && ev.chord === goal.chord;
    case "rhythm":  return ev.type === "rhythm" && ev.id === goal.id && ev.bpm >= goal.bpm && ev.pct >= goal.pct && ev.bars >= 4;
    case "changes": return ev.type === "changes" && ev.perMin >= goal.min && Array.isArray(ev.pair) &&
                           ev.pair.length === 2 && goal.pair.every(c => ev.pair.includes(c));
    case "ear":     return ev.type === "ear" && ev.mode === goal.mode && ev.correct >= goal.min;
    case "melody":  return ev.type === "melody" && ev.id === goal.id;
    case "song":    return ev.type === "song" && ev.id === goal.id && ev.pct >= goal.pct;
  }
  return false;
}
// progress: { [ders kimliği]: true }. Döner: her ders için "done" | "open" | "locked".
// Bir ders, kendinden önceki tüm dersler bitince açılır.
function lessonStatus(progress){
  let blocked = false;
  return LESSONS.map(l => {
    if(progress[l.id]) return "done";
    if(blocked) return "locked";
    blocked = true;
    return "open";
  });
}
// Olay hangi açık dersi tamamlıyor? Döner: ders kimliği ya da null. Kilitli dersler olaydan tamamlanmaz.
function lessonCompletedBy(progress, ev){
  const st = lessonStatus(progress);
  const i = LESSONS.findIndex((l, k) => st[k] === "open" && goalMet(l.goal, ev));
  return i >= 0 ? LESSONS[i].id : null;
}
