// Sekmeler: adres çubuğundaki #kimlik ile açılır (#nota=67 sap sekmesini açar); son açılan sekme saklanır.
const Tabs = (() => {
  const nav = $("tabs");
  const btns = [...nav.querySelectorAll("[role=tab]")];
  // Panel id'leri "panel-<ad>", adres #<ad>: id ile adres ayrı olunca tarayıcı açılışta panele kaydırmaz
  const ids = btns.map(b => b.getAttribute("aria-controls").replace("panel-", ""));
  let cur = null;
  function show(id, { focus = false } = {}){
    if(!ids.includes(id)) id = "dersler";
    cur = id;
    btns.forEach(b => {
      const on = b.getAttribute("aria-controls") === "panel-" + id;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if(on && focus) b.focus();
      if(on) b.scrollIntoView({ block:"nearest", inline:"nearest" });
    });
    ids.forEach(p => { $("panel-" + p).hidden = p !== id; });
    store.set("tab", id);
    if(!/nota=\d+/.test(location.hash) && location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    Bus.emit("tab", id);
  }
  btns.forEach(b => b.addEventListener("click", () => show(b.getAttribute("aria-controls").replace("panel-", ""))));
  nav.addEventListener("keydown", e => {
    const step = {ArrowRight:1, ArrowLeft:-1}[e.key];
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
  // main.js bütün modüller yüklendikten sonra çağırır
  function init(){ show(fromHash() || store.get("tab", "dersler")); }
  return { show, init, get current(){ return cur; } };
})();
