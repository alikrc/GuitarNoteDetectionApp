// Başlatma: bütün modüller yüklendikten sonra sekme açılır; Esc ve sekme arka plana geçince sesler susar.
window.addEventListener("keydown", e => { if(e.key === "Escape") Bus.emit("stopall"); });
// Sekme arka plana geçince unutulan ses çalmaya devam etmesin
document.addEventListener("visibilitychange", () => { if(document.hidden) Bus.emit("stopall"); });
Tabs.init();

// Çevrimdışı kullanım (http/https üzerinden açıldığında)
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
