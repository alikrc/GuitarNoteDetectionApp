// Sekmeler: adres çubuğundaki #kimlik ile açılır (#nota=67 sap sekmesini açar); son açılan sekme saklanır.
// Telefonda alt çubukta dört ana sekme ve "Daha" düğmesi vardır; diğer sekmeler "Daha" menüsünde (#tabmore) açılır.
// Tablette ve masaüstünde hepsi yan menüde görünür (css/app.css).
const Tabs = (() => {
  const nav = $("nav"), list = $("tabs"), moreBtn = $("morebtn"), more = $("tabmore"), titleEl = $("viewtitle");
  const btns = [...list.querySelectorAll("[role=tab]")];
  // Panel id'leri "panel-<ad>", adres #<ad>: id ile adres ayrı olunca tarayıcı açılışta panele kaydırmaz
  const ids = btns.map(b => b.getAttribute("aria-controls").replace("panel-", ""));
  let cur = null;

  function closeMore(){
    nav.classList.remove("open");
    moreBtn.setAttribute("aria-expanded", "false");
    Layer.done(closeMore);
  }
  function openMore(){
    nav.classList.add("open");
    moreBtn.setAttribute("aria-expanded", "true");
    Layer.open(closeMore);
    (more.querySelector("[aria-selected=true]") || more.querySelector("[role=tab]")).focus();
  }
  moreBtn.addEventListener("click", () => nav.classList.contains("open") ? closeMore() : openMore());

  function setTitle(){
    const b = btns[ids.indexOf(cur)];
    if(b) titleEl.textContent = b.querySelector(".tl").textContent;
  }
  function show(id, { focus = false } = {}){
    if(!ids.includes(id)) id = "dersler";
    const changed = cur !== null && cur !== id;
    cur = id;
    btns.forEach(b => {
      const on = b.getAttribute("aria-controls") === "panel-" + id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if(on && focus) b.focus();
    });
    moreBtn.classList.toggle("active", more.contains(btns[ids.indexOf(id)]));
    ids.forEach(p => { $("panel-" + p).hidden = p !== id; });
    setTitle();
    closeMore();
    if(changed) window.scrollTo(0, 0);
    store.set("tab", id);
    if(!/nota=\d+/.test(location.hash) && location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    Bus.emit("tab", id);
  }
  btns.forEach(b => b.addEventListener("click", () => show(b.getAttribute("aria-controls").replace("panel-", ""))));
  // Ok tuşları: alt çubukta sağ/sol, yan menüde yukarı/aşağı
  list.addEventListener("keydown", e => {
    const step = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1}[e.key];
    let i = ids.indexOf(cur);
    if(step) i = (i + step + ids.length) % ids.length;
    else if(e.key === "Home") i = 0;
    else if(e.key === "End") i = ids.length - 1;
    else return;
    e.preventDefault();
    show(ids[i], { focus:true });
  });
  function fromHash(){
    const h = location.hash.slice(1);
    if(/nota=\d+/.test(h)) return "sap";
    return ids.includes(h) ? h : null;
  }
  window.addEventListener("hashchange", () => { const id = fromHash(); if(id && id !== cur) show(id); });
  // Logo ana sayfaya (Dersler) döner
  $("brand").addEventListener("click", e => { e.preventDefault(); show("dersler"); window.scrollTo(0, 0); });
  Bus.on("lang", setTitle);
  // main.js bütün modüller yüklendikten sonra çağırır
  function init(){ show(fromHash() || store.get("tab", "dersler")); }
  return { show, init, get current(){ return cur; } };
})();
