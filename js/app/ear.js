// Kulak sekmesi: soruyu çal, cevabı seç; 10 soruluk tur sonunda puan ve ders olayı.
const Ear = (() => {
  const modesEl=$("earmodes"), hintEl=$("earhint"), dotsEl=$("eardots"), answersEl=$("earanswers"), msgEl=$("earmsg"),
        scoreEl=$("earscore"), playBtn=$("earplay");
  const rng = makeRng();
  let mode = store.get("earMode", "kalite2");
  if(!EAR_MODES[mode]) mode = "kalite2";
  let round = null, q = null, answered = false, voices = [];

  function buildModes(){
    modesEl.replaceChildren(...Object.keys(EAR_MODES).map(k =>
      radioBtn(EAR_MODES[k].name, k === mode, () => { mode = k; store.set("earMode", k); buildModes(); newRound(); })));
  }
  radioArrows(modesEl);
  function newRound(){
    round = { i: 0, correct: 0, marks: [] };
    hintEl.textContent = EAR_MODES[mode].hint;
    const best = store.get("earBest", {})[mode];
    scoreEl.textContent = best !== undefined ? "en iyi: " + best + "/" + EAR_ROUND : "";
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
    answersEl.replaceChildren(...EAR_MODES[mode].answers.map(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.addEventListener("click", () => answer(id, b));
      return b;
    }));
    drawDots();
    msgEl.textContent = "Soru " + (round.i + 1) + "/" + EAR_ROUND + ": dinle ve seç.";
    playBtn.textContent = "Soruyu çal";
    if(autoplay) playQ();
  }
  function stopVoices(){ voices.forEach(v => Snd.fadeOut(v)); voices = []; }
  function playQ(){
    Bus.emit("stopall"); stopVoices();
    const t = Snd.ctx().currentTime + 0.05;
    if(q.arpeggio){
      voices = [...Snd.strum(q.notes, t, 0.02, 0.16), ...Snd.strum(q.notes, t + 1.3, 0.45, 0.2)];
    }else if(q.notes.length === 2){
      voices = [Snd.pluck(midiToFreq(q.notes[0]), t, 0.3), Snd.pluck(midiToFreq(q.notes[1]), t + 0.8, 0.3)];
    }else voices = [Snd.pluck(midiToFreq(q.notes[0]), t, 0.32)];
    playBtn.textContent = "Tekrar dinle";
  }
  playBtn.addEventListener("click", playQ);
  function answer(id, btn){
    if(answered) return;
    answered = true;
    const right = id === q.answer;
    if(right) round.correct++;
    round.marks[round.i] = right ? "r" : "w";
    [...answersEl.children].forEach(b => { b.disabled = true; });
    btn.classList.add(right ? "right" : "wrong");
    if(!right){
      const k = EAR_MODES[mode].answers.findIndex(a => a[0] === q.answer);
      answersEl.children[k].classList.add("right");
    }
    msgEl.innerHTML = (right ? '<span class="ok">Doğru ✓</span>' : '<span class="no">Yanlış</span> — doğrusu ' + earAnswerName(mode, q.answer)) +
      (q.notes.length > 1 ? " · çalınan: " + q.notes.map(m => noteName(m).tr).join(" ") : "");
    round.i++;
    drawDots();
    if(round.i >= EAR_ROUND){
      const c = round.correct, best = store.get("earBest", {});
      if(!(best[mode] >= c)){ best[mode] = c; store.set("earBest", best); }
      msgEl.innerHTML += "<br><b>Tur bitti: " + c + "/" + EAR_ROUND + "</b>. " +
        (c >= 9 ? "Harika kulak!" : c >= 7 ? "İyi! Bir tur daha yap." : "Zor bir alıştırma; ipucunu okuyup yeni tur dene.");
      scoreEl.textContent = "en iyi: " + best[mode] + "/" + EAR_ROUND;
      Bus.emit("achieve", { type:"ear", mode, correct: c, total: EAR_ROUND });
      return;
    }
    setTimeout(() => { if(answered && round.i < EAR_ROUND) nextQuestion(true); }, right ? 900 : 2200);
  }
  $("earnew").addEventListener("click", newRound);
  Bus.on("stopall", stopVoices);

  buildModes(); newRound();
  return { open(m){ if(EAR_MODES[m]){ mode = m; store.set("earMode", m); buildModes(); newRound(); } } };
})();
