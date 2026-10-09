// Başlatma: bütün modüller yüklendikten sonra sekme açılır; Esc ve sekme arka plana geçince sesler susar.
window.addEventListener("keydown", e => { if(e.key === "Escape") Bus.emit("stopall", { all:true }); });
// Sekme arka plana geçince unutulan ses çalmaya devam etmesin
document.addEventListener("visibilitychange", () => { if(document.hidden) Bus.emit("stopall", { all:true }); });
Tabs.init();

// Çevrimdışı kullanım (http/https üzerinden açıldığında)
// Yeni sürüm gelince (yeni hizmet çalışanı denetimi devralınca) açık sayfa eski kodla kalmasın: "Yenile" önerilir.
// İlk kurulumda da denetim değişir; o yüzden yalnızca sayfa zaten bir çalışanla açıldıysa bildirilir.
defStr({
  "app.update":  { tr:"Yeni sürüm hazır.", en:"A new version is ready." },
  "app.reload":  { tr:"Yenile", en:"Reload" }
});
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").then(reg => {
    // Uygulama uzun süre açık kalırsa güncellemeyi sekmeye dönüldüğünde de denetle
    document.addEventListener("visibilitychange", () => { if(!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if(hadController) toast(t("app.update"), { label: t("app.reload"), fn: () => location.reload(), sticky:true });
  });
}
