// Dersler sekmesi: sıralı kurs. "Başla" ilgili sekmeyi açıp alıştırmayı hazırlar; başarı olayları (Bus "achieve")
// açık dersin hedefini karşılarsa ders tamamlanır.
const Lessons = (() => {
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
    countEl.textContent = done + " / " + LESSONS.length + " ders";
    listEl.replaceChildren(...LESSONS.map((l, i) => {
      const li = document.createElement("li");
      li.className = "lesson " + st[i];
      li.innerHTML = '<span class="num"></span><div><h3></h3><p></p></div><div class="acts"></div>';
      li.querySelector(".num").textContent = st[i] === "done" ? "✓" : i + 1;
      li.querySelector("h3").textContent = l.title;
      li.querySelector("p").textContent = l.text;
      const acts = li.querySelector(".acts");
      const btn = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label; b.addEventListener("click", fn); acts.appendChild(b); };
      if(st[i] === "open"){
        btn("Başla", "primary small", () => begin(l));
        btn("Atla", "stopbtn", () => complete(l.id, true));
      }else if(st[i] === "done") btn("Tekrar", "stopbtn", () => begin(l));
      else li.setAttribute("aria-disabled", "true");
      return li;
    }));
  }
  function complete(id, skipped){
    progress[id] = true; store.set("lessons", progress);
    render();
    const l = LESSONS.find(x => x.id === id), next = LESSONS[lessonStatus(progress).indexOf("open")];
    toast((skipped ? "Atlandı: " : "Ders tamamlandı ✓ ") + l.title + (next ? " · Sıradaki: " + next.title : " · Kurs bitti!"));
  }
  Bus.on("achieve", ev => {
    const id = lessonCompletedBy(progress, ev);
    if(id) complete(id, false);
  });
  $("lreset").addEventListener("click", () => {
    if(!confirm("Bütün ders ilerlemesi silinsin mi?")) return;
    progress = {}; store.set("lessons", progress); render();
  });
  render();
  return {};
})();
