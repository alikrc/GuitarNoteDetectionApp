// Dersler sekmesi: sıralı kurs. "Başla" ilgili sekmeyi açıp alıştırmayı hazırlar; başarı olayları (Bus "achieve")
// açık dersin hedefini karşılarsa ders tamamlanır.
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
    "les.reset":   { tr:"Bütün ders ilerlemesi silinsin mi?", en:"Delete all lesson progress?" }
  });
  const listEl = $("llist"), barEl = $("lbar"), countEl = $("lcount");
  let progress = store.get("lessons", {});

  // Hedef türüne göre dersi başlatma: sekmeyi aç ve alıştırmayı hazırla
  function begin(l){
    const g = l.goal;
    switch(g.type){
      case "tuned":   Tabs.show("akort"); if(!Mic.running) Mic.start(); break;
      case "chord":   Tabs.show("akorlar"); Chords.openCheck(g.chord, "strings"); break;
      case "changes": Tabs.show("akorlar"); Chords.openChanges(g.pair[0], g.pair[1]); break;
      case "rhythm":  Tabs.show("ritim"); Rhythm.open(g.id, g.bpm); break;
      case "ear":     Tabs.show("kulak"); Ear.open(g.mode); break;
      case "melody":  Tabs.show("ezgiler"); Melody.open(g.id); break;
      case "song":    Tabs.show("sarkilar"); Songs.open(g.id); break;
    }
    window.scrollTo({ top: $("tabs").offsetTop - 8, behavior: "smooth" });
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
  function complete(id, skipped){
    progress[id] = true; store.set("lessons", progress);
    render();
    const l = LESSONS.find(x => x.id === id), next = LESSONS[lessonStatus(progress).indexOf("open")];
    toast(t(skipped ? "les.skipped" : "les.done", { title: L(l, "title") }) + (next ? t("les.next", { title: L(next, "title") }) : t("les.finished")));
  }
  Bus.on("achieve", ev => {
    const id = lessonCompletedBy(progress, ev);
    if(id) complete(id, false);
  });
  $("lreset").addEventListener("click", () => {
    if(!confirm(t("les.reset"))) return;
    progress = {}; store.set("lessons", progress); render();
  });
  Bus.on("lang", render);
  render();
  return {};
})();
