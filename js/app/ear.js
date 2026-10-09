// Kulak sekmesi: soruyu çal, cevabı seç; 10 soruluk tur sonunda puan ve ders olayı.
const Ear = (() => {
  defStr({
    "ear.best":     { tr:"en iyi: {n}/{all}", en:"best: {n}/{all}" },
    "ear.question": { tr:"Soru {i}/{all}: dinle ve seç.", en:"Question {i}/{all}: listen and choose." },
    "ear.play":     { tr:"Soruyu çal", en:"Play question" },
    "ear.again":    { tr:"Tekrar dinle", en:"Listen again" },
    "ear.right":    { tr:"Doğru ✓", en:"Correct ✓" },
    "ear.wrong":    { tr:"Yanlış", en:"Wrong" },
    "ear.answerIs": { tr:" — doğrusu {a}", en:" — it was {a}" },
    "ear.played":   { tr:" · çalınan: {notes}", en:" · played: {notes}" },
    "ear.end":      { tr:"Tur bitti: {c}/{all}", en:"Round over: {c}/{all}" },
    "ear.great":    { tr:"Harika kulak!", en:"Great ear!" },
    "ear.good":     { tr:"İyi! Bir tur daha yap.", en:"Good! Do another round." },
    "ear.hard":     { tr:"Zor bir alıştırma; ipucunu okuyup yeni tur dene.", en:"A hard one; read the hint and try a new round." }
  });
  const modesEl=$("earmodes"), hintEl=$("earhint"), dotsEl=$("eardots"), answersEl=$("earanswers"), msgEl=$("earmsg"),
        scoreEl=$("earscore"), playBtn=$("earplay");
  const rng = makeRng();
  let mode = store.get("earMode", "kalite2");
  if(!EAR_MODES[mode]) mode = "kalite2";
  let round = null, q = null, answered = false, voices = [];

  function buildModes(){
    modesEl.replaceChildren(...Object.keys(EAR_MODES).map(k =>
      radioBtn(L(EAR_MODES[k], "name"), k === mode, () => { mode = k; store.set("earMode", k); buildModes(); newRound(); })));
  }
  radioArrows(modesEl);
  function newRound(){
    round = { i: 0, correct: 0, marks: [] };
    hintEl.textContent = L(EAR_MODES[mode], "hint");
    const best = store.get("earBest", {})[mode];
    scoreEl.textContent = best !== undefined ? t("ear.best", { n: best, all: EAR_ROUND }) : "";
    nextQuestion(false);
  }
  function drawDots(){
    dotsEl.replaceChildren(...Array.from({ length: EAR_ROUND }, (_, i) => {
      const d = document.createElement("i");
      if(round.marks[i]) d.className = round.marks[i];
      return d;
    }));
  }
  function nextQuestion(autoplay){
    q = earQuestion(mode, rng); answered = false;
    answersEl.replaceChildren(...EAR_MODES[mode].answers.map(([id, label, labelEn]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = getLang() === "en" ? labelEn : label;
      b.addEventListener("click", () => answer(id, b));
      return b;
    }));
    drawDots();
    msgEl.textContent = t("ear.question", { i: round.i + 1, all: EAR_ROUND });
    playBtn.textContent = t("ear.play");
    if(autoplay) playQ();
  }
  function stopVoices(){ voices.forEach(v => Snd.fadeOut(v)); voices = []; }
  function playQ(){
    Bus.emit("stopall"); stopVoices();
    const t0 = Snd.ctx().currentTime + 0.05;
    if(q.arpeggio){
      voices = [...Snd.strum(q.notes, t0, 0.02, 0.16), ...Snd.strum(q.notes, t0 + 1.3, 0.45, 0.2)];
    }else if(q.notes.length === 2){
      voices = [Snd.pluck(midiToFreq(q.notes[0]), t0, 0.3), Snd.pluck(midiToFreq(q.notes[1]), t0 + 0.8, 0.3)];
    }else voices = [Snd.pluck(midiToFreq(q.notes[0]), t0, 0.32)];
    playBtn.textContent = t("ear.again");
  }
  playBtn.addEventListener("click", playQ);
  function answer(id, btn){
    if(answered) return;
    answered = true;
    const right = id === q.answer;
    if(right) round.correct++;
    buzz(right ? 30 : [40, 60, 40]);
    round.marks[round.i] = right ? "r" : "w";
    [...answersEl.children].forEach(b => { b.disabled = true; });
    btn.classList.add(right ? "right" : "wrong");
    if(!right){
      const k = EAR_MODES[mode].answers.findIndex(a => a[0] === q.answer);
      answersEl.children[k].classList.add("right");
    }
    msgEl.innerHTML = (right ? '<span class="ok">' + t("ear.right") + '</span>' : '<span class="no">' + t("ear.wrong") + '</span>' + t("ear.answerIs", { a: earAnswerName(mode, q.answer) })) +
      (q.notes.length > 1 ? t("ear.played", { notes: q.notes.map(noteLabel).join(" ") }) : "");
    round.i++;
    drawDots();
    if(round.i >= EAR_ROUND){
      const c = round.correct, best = store.get("earBest", {});
      if(!(best[mode] >= c)){ best[mode] = c; store.set("earBest", best); }
      msgEl.innerHTML += "<br><b>" + t("ear.end", { c, all: EAR_ROUND }) + "</b>. " + t(c >= 9 ? "ear.great" : c >= 7 ? "ear.good" : "ear.hard");
      scoreEl.textContent = t("ear.best", { n: best[mode], all: EAR_ROUND });
      Bus.emit("achieve", { type:"ear", mode, correct: c, total: EAR_ROUND });
      return;
    }
    setTimeout(() => { if(answered && round.i < EAR_ROUND) nextQuestion(true); }, right ? 900 : 2200);
  }
  $("earnew").addEventListener("click", newRound);
  Bus.on("stopall", stopVoices);

  Bus.on("lang", () => { buildModes(); newRound(); });
  buildModes(); newRound();
  return { open(m){ if(EAR_MODES[m]){ mode = m; store.set("earMode", m); buildModes(); newRound(); } } };
})();
