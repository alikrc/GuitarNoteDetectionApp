// Dil desteği (Türkçe / İngilizce). İlk yüklenen çekirdek dosya.
// Metinler kullanıldıkları dosyada defStr({ anahtar: { tr, en } }) ile tanımlanır; t("anahtar", { değişken }) seçili dildeki metni verir.
// Veri tablolarında (akor türleri, ritimler, dersler…) İngilizce alanlar "_en" ekiyle durur: L(kayıt, "name").

let LANG = "tr";
const LANGS = ["tr", "en"];
function setLang(l){ LANG = LANGS.includes(l) ? l : "tr"; }
function getLang(){ return LANG; }

const STR = {};
function defStr(obj){
  for(const k in obj){
    if(STR[k]) throw new Error("metin anahtarı iki kez tanımlandı: " + k);
    STR[k] = obj[k];
  }
}
function t(key, vars){
  const e = STR[key];
  let s = e ? (e[LANG] !== undefined ? e[LANG] : e.tr) : key;
  if(vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : "");
  return s;
}
function L(o, f){ return LANG === "en" && o[f + "_en"] !== undefined ? o[f + "_en"] : o[f]; }
// Sayı yazımı: Türkçede ondalık virgül
function num(x, d = 1){ const s = x.toFixed(d); return LANG === "tr" ? s.replace(".", ",") : s; }
