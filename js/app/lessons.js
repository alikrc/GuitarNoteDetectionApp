// Dersler sekmesi: sıralı kurs. "Başla" ilgili sekmeyi açıp alıştırmayı hazırlar; başarı olayları (Bus "achieve")
// açık dersin hedefini karşılarsa ders tamamlanır. Başlatılan dersin hedefi, ilgili sekmenin üstündeki şeritte
// (#lessonbar) durur; ders bitince aynı şeritte "Sıradaki derse geç" çıkar.
const Lessons = (() => {
  defStr({
    "les.count":   { tr:"{done} / {all} ders", en:"{done} / {all} lessons" },
    "les.start":   { tr:"Başla", en:"Start" },
    "les.skip":    { tr:"Atla", en:"Skip" },
    "les.again":   { tr:"Tekrar", en:"Again" },
    "les.done":    { tr:"Ders tamamlandı ✓ {title}", en:"Lesson complete ✓ {title}" },
    "les.skipped": { tr:"Atlandı: {title}", en:"Skipped: {title}" },
    "les.next":    { tr:" · Sıradaki: {title}", en:" · Next: {title}" },
    "les.finished":{ tr:" · Kurs bitti!", en:" · Course finished!" },
    "les.reset":   { tr:"Bütün ders ilerlemesi silinsin mi?", en:"Delete all lesson progress?" },
    "les.kicker":  { tr:"Ders {n} / {all}", en:"Lesson {n} / {all}" },
    "les.doneKick":{ tr:"✓ Ders tamamlandı", en:"✓ Lesson complete" },
    "les.nextIs":  { tr:"Sıradaki: {title}", en:"Next: {title}" },
    "les.allDone": { tr:"Başlangıç kursunu bitirdin. Şarkılar sekmesinde öğrendiğin akorlarla çalmaya devam et!",
                     en:"You've finished the beginner course. Keep playing the chords you know in the Songs tab!" },
    "les.goNext":  { tr:"Sıradaki derse geç", en:"Next lesson" },
    "les.toList":  { tr:"Derslere dön", en:"Back to lessons" },
    "les.close":   { tr:"Şeridi kapat", en:"Close" }
  });
  const listEl = $("llist"), barEl = $("lbar"), countEl = $("lcount"), lbEl = $("lessonbar");
  let progress = store.get("lessons", {});
  let active = LESSONS.find(l => l.id === store.get("activeLesson", null)) || null;   // başlatılan ders
  let justDone = null;                                                                   // { lesson, next }

  const TAB = { tuned:"akort", chord:"akorlar", changes:"akorlar", rhythm:"ritim", ear:"kulak", melody:"ezgiler", song:"sarkilar" };
  const tabOf = l => TAB[l.goal.type];
  const numOf = l => LESSONS.indexOf(l) + 1;

  // Hedef türüne göre dersi başlatma: sekmeyi aç ve alıştırmayı hazırla
  function begin(l){
    active = l; justDone = null; store.set("activeLesson", l.id);
    const g = l.goal;
    Tabs.show(tabOf(l));
    switch(g.type){
      case "tuned":   if(!Mic.running) Mic.start(); break;
      case "chord":   Chords.openCheck(g.chord, "strings"); break;
      case "changes": Chords.openChanges(g.pair[0], g.pair[1]); break;
      case "rhythm":  Rhythm.open(g.id, g.bpm); break;
      case "ear":     Ear.open(g.mode); break;
      case "melody":  Melody.open(g.id); break;
      case "song":    Songs.open(g.id); break;
    }
    renderBar();
  }
  function render(){
    const st = lessonStatus(progress), done = st.filter(s => s === "done").length;
    barEl.style.width = (100*done/LESSONS.length) + "%";
    countEl.textContent = t("les.count", { done, all: LESSONS.length });
    listEl.replaceChildren(...LESSONS.map((l, i) => {
      const li = document.createElement("li");
      li.className = "lesson " + st[i];
      li.innerHTML = '<span class="num"></span><div><h3></h3><p></p></div><div class="acts"></div>';
      li.querySelector(".num").textContent = st[i] === "done" ? "✓" : i + 1;
      li.querySelector("h3").textContent = L(l, "title");
      li.querySelector("p").textContent = L(l, "text");
      const acts = li.querySelector(".acts");
      const btn = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label; b.addEventListener("click", fn); acts.appendChild(b); };
      if(st[i] === "open"){
        btn(t("les.start"), "primary small", () => begin(l));
        btn(t("les.skip"), "stopbtn", () => complete(l.id, true));
      }else if(st[i] === "done") btn(t("les.again"), "stopbtn", () => begin(l));
      else li.setAttribute("aria-disabled", "true");
      return li;
    }));
  }

  // Sekmenin üstündeki ders şeridi: başlatılan dersin hedefi ya da biten dersin tebriği
  function renderBar(){
    const tab = Tabs.current;
    const btn = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label; b.addEventListener("click", fn); return b; };
    const close = btn("", "iconbtn small lbclose", () => { justDone = null; active = null; store.set("activeLesson", null); renderBar(); });
    close.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-close"/></svg>';
    close.setAttribute("aria-label", t("les.close"));
    const toList = () => btn(t("les.toList"), "stopbtn", () => { justDone = null; Tabs.show("dersler"); });
    if(justDone && tab !== "dersler"){
      const { lesson, next } = justDone;
      lbEl.className = "lessonbar done";
      $("lbkicker").textContent = t("les.doneKick");
      $("lbtitle").textContent = L(lesson, "title");
      $("lbgoal").textContent = next ? t("les.nextIs", { title: L(next, "title") }) : t("les.allDone");
      $("lbacts").replaceChildren(...(next ? [btn(t("les.goNext"), "primary small", () => begin(next))] : []), toList(), close);
      lbEl.hidden = false;
      return;
    }
    if(active && !progress[active.id] && tab === tabOf(active)){
      lbEl.className = "lessonbar";
      $("lbkicker").textContent = t("les.kicker", { n: numOf(active), all: LESSONS.length });
      $("lbtitle").textContent = L(active, "title");
      $("lbgoal").textContent = L(active, "text");
      $("lbacts").replaceChildren(toList(), close);
      lbEl.hidden = false;
      return;
    }
    lbEl.hidden = true;
  }

  function complete(id, skipped){
    progress[id] = true; store.set("lessons", progress);
    render();
    const l = LESSONS.find(x => x.id === id), next = LESSONS[lessonStatus(progress).indexOf("open")];
    if(active && active.id === id){ active = null; store.set("activeLesson", null); }
    if(skipped || Tabs.current === "dersler"){
      toast(t(skipped ? "les.skipped" : "les.done", { title: L(l, "title") }) + (next ? t("les.next", { title: L(next, "title") }) : t("les.finished")));
    }else{
      justDone = { lesson: l, next };
      buzz([60, 40, 120]);
    }
    renderBar();
  }
  Bus.on("achieve", ev => {
    const id = lessonCompletedBy(progress, ev);
    if(id) complete(id, false);
  });
  $("lreset").addEventListener("click", () => {
    if(!confirm(t("les.reset"))) return;
    progress = {}; store.set("lessons", progress); active = null; justDone = null; store.set("activeLesson", null);
    render(); renderBar();
  });
  // İlk açılışta kısa tanıtım; "Anladım" deyince bir daha gösterilmez
  const welcome = $("welcome");
  welcome.hidden = store.get("welcomed", false);
  $("welcomeok").addEventListener("click", () => { welcome.hidden = true; store.set("welcomed", true); });
  Bus.on("tab", id => { if(id === "dersler") justDone = null; renderBar(); });
  Bus.on("lang", () => { render(); renderBar(); });
  render();
  return { get active(){ return active; } };
})();
