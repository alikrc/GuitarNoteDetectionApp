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
  { id:"akort", title:"Gitarı akort et", goal:{ type:"tuned" },
    text:"Önce akort: Akort sekmesinde telleri tek tek çal, ibre ortaya gelene kadar burguyu sık ya da gevşet. Altı tel de ✓ olunca ders tamamlanır." },
  { id:"em", title:"İlk akor: Em", goal:{ type:"chord", chord:"Em" },
    text:"Em, yalnızca iki parmakla basılır: orta parmak 5. telde, yüzük parmağı 4. telde, ikisi de 2. perdede. Tel tel kontrolde altı tel de doğru çıkınca geçersin." },
  { id:"am", title:"Am akoru", goal:{ type:"chord", chord:"Am" },
    text:"Am, Em'in şekline benzer ama bir tel aşağı kayar ve işaret parmağı 2. telde 1. perdeye basar. 6. tel çalınmaz." },
  { id:"dortluk", title:"Dörtlük vuruş", goal:{ type:"rhythm", id:"dortluk", bpm:60, pct:80 },
    text:"Her vuruşta bir aşağı vuruş, 60 BPM'de. Birlikte çal modunda son 4 ölçünün %80'i zamanında olunca geçersin. Önce “Gecikmeyi ölç”e bas." },
  { id:"em-am", title:"Em ↔ Am geçişi", goal:{ type:"changes", pair:["Em","Am"], min:15 },
    text:"Akor değiştirme alıştırması: bir dakikada Em ile Am arasında en az 15 temiz geçiş. Parmakları tek tek değil, şekil olarak birlikte taşı." },
  { id:"kulak-kalite", title:"Kulak: majör mü minör mü", goal:{ type:"ear", mode:"kalite2", min:8 },
    text:"Kulak sekmesinde 10 sorudan en az 8'ini bil. Majör parlak, minör karanlık duyulur." },
  { id:"c", title:"C akoru", goal:{ type:"chord", chord:"C" },
    text:"C üç parmakla basılır: yüzük 5. telde 3. perde, orta 4. telde 2. perde, işaret 2. telde 1. perde. 6. tel çalınmaz." },
  { id:"g", title:"G akoru", goal:{ type:"chord", chord:"G" },
    text:"G: orta parmak 6. telde 3. perde, işaret 5. telde 2. perde, yüzük 1. telde 3. perde. Altı tel de çalınır." },
  { id:"sekizlik", title:"Sekizlik aşağı-yukarı", goal:{ type:"rhythm", id:"sekizlik", bpm:70, pct:80 },
    text:"El sarkaç gibi sallanır: sayılarda aşağı, “ve”lerde yukarı. 70 BPM'de son 4 ölçünün %80'i zamanında olmalı." },
  { id:"g-c", title:"G ↔ C geçişi", goal:{ type:"changes", pair:["G","C"], min:20 },
    text:"Bir dakikada G ile C arasında en az 20 temiz geçiş. G'den C'ye giderken işaret parmağı 5. telden 2. tele iner." },
  { id:"ezgi", title:"İlk ezgi: Neşeye Övgü", goal:{ type:"melody", id:"nese" },
    text:"Ezgiler sekmesinde Neşeye Övgü'yü notaları sırayla çalarak bitir. Hepsi 1. pozisyonda; parmak numaraları tabın altında yazar." },
  { id:"d", title:"D akoru", goal:{ type:"chord", chord:"D" },
    text:"D yalnızca dört tel: işaret 3. telde 2. perde, yüzük 2. telde 3. perde, orta 1. telde 2. perde. 5. ve 6. teller çalınmaz." },
  { id:"pop", title:"Pop / folk kalıbı", goal:{ type:"rhythm", id:"pop", bpm:70, pct:80 },
    text:"Aşağı, aşağı-yukarı, yukarı-aşağı-yukarı. El sekizlikteki gibi sallanmaya devam eder; boş hücrelerde tele değmez." },
  { id:"sarki", title:"İlk şarkı: Amazing Grace", goal:{ type:"song", id:"amazing-grace", pct:70 },
    text:"Şarkılar sekmesinde Amazing Grace'i birlikte çal (G, C, D, Em; 3/4 vals). Vuruşların %70'i zamanında olunca tamamlanır." },
  { id:"kulak-aralik", title:"Kulak: aralıklar", goal:{ type:"ear", mode:"aralik", min:8 },
    text:"İki nota arasındaki aralığı bil: küçük/büyük üçlü, tam dörtlü, tam beşli, oktav. 10 sorudan en az 8'i." },
  { id:"f", title:"Barre'ye giriş: F", goal:{ type:"chord", chord:"F" },
    text:"F, ilk barre akoru: işaret parmağı 1. perdede altı teli birden bastırır. Zorsa önce yalnız ince üç teli (küçük barre) dene." }
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
