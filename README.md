# Gitar Dinleyici

**Uygulamayı aç: https://alikrc.github.io/GuitarNoteDetectionApp/**

Tarayıcıda çalışan gitar öğrenme ve akort aracı ([Sol Klarnet Dinleyici](https://github.com/alikrc/ClarinetNoteDetectionApp)'nin gitar sürümü).
Mikrofondan çaldığını dinler ve geri bildirim verir. Ses cihazda işlenir, hiçbir yere gönderilmez. Sekmeler:

- **Dersler**: 16 adımlı başlangıç kursu (akort → Em, Am → dörtlük vuruş → akor geçişleri → kulak → C, G → … → ilk şarkı → F).
  Her dersin hedefi mikrofonla kontrol edilir; hedefe ulaşınca ders kendiliğinden tamamlanır, ilerleme tarayıcıda saklanır.
- **Akort**: altı tel, hangi telin çalındığını kendisi bulur; ibre, sent sapması ve “burguyu sık / gevşet” talimatı,
  referans sesi. Altı tel de ±5 sent içinde kalınca tamam.
- **Sap ve notalar**: duyulan nota, sent (ya da AEU koma) sapması, tıklanabilir sap (eşik + çalgıya göre 19–24 perde), aynı sesin
  diğer konumları, adım adım talimat, dizek, tab, entonasyon izi, klavyeden çalınan nota şeridi.
- **Akorlar**: 31 akor kutu şemasıyla (parmak numaraları, tel tel talimat, akor formülü, ipuçları), dinleme, **capo** (0–7),
  mikrofonla tel tel ya da tümü kontrolü, **akor değiştirme alıştırması** (1 dakikada iki akor arası temiz geçiş sayısı, rekor), sık dizilişler.
- **Ritim**: 6 vuruş kalıbı (dörtlük, sekizlik, pop/folk, vals, Türk aksağı, Aksak), tempo, metronom, seçili akor ya da dizilişle
  çalma; *birlikte çal* modunda her vuruşun zamanlaması (erken/geç ms, kaçan, fazla), gecikme ölçümü.
- **Şarkılar**: akorlu söz sayfası; çalan akor sözlerin üstünde yanar, sıradaki akor gösterilir. Dinle ya da mikrofonla birlikte çal
  (sonunda zamanlama yüzdesi). Kendi şarkını `[Am]söz [G*2]söz` biçiminde yazıp kaydedebilirsin.
- **Ezgiler**: nota nota çalma; her notanın teli, perdesi ve parmağı komşu notalara göre seçilir (pozisyon planı), tab. Doğru notayı
  duyunca sıradakine geçer, yanlışta ne duyduğunu söyler. Kendi ezgini `Mi4 Re4 Do4:2` biçiminde yazabilirsin.
- **Kulak**: majör/minör, majör/minör/yedili, aralıklar, hangi açık tel; 10 soruluk turlar, en iyi puan.

Ayarlar (tarayıcıda saklanır): çalgı (klasik 19, akustik 20, elektro 22/24 perde; örnek sesin tınısı da değişir), akort
(Standart, Drop D, Yarım ses pes, DADGAD, Açık Sol, Açık Re), diyapazon (La = 430–450 Hz), mikrofon hassasiyeti.

## Çalıştırma

Mikrofon yalnızca `https://` ya da `localhost` üzerinden açılır:

```bash
npm start
```

Sonra http://localhost:8080 adresini aç. Uygulama bir kez açıldıktan sonra çevrimdışı da çalışır
ve telefonda “Ana ekrana ekle” ile uygulama gibi kurulabilir.

Belirli bir notayı bağlantıyla açmak için: `index.html#nota=67` (yazılı MIDI numarası; standart akortta 52 = Mi3 … 96 = Do7).

## Test

```bash
npm test
```

Testler `js/core/` altındaki saf mantığı (nota/perde, sap konumları ve parmak planı, akorlar ve akor dinleme, capo, akor
değiştirme sayacı, ritim ve vuruş yakalama, şarkı/ezgi ayrıştırma, kulak soruları, ders hedefleri) ve uygulama dosyalarının
tutarlılığını (betik sırası, ad çakışması, çevrimdışı önbellek listesi) doğrular. GitHub Actions her push'ta testleri çalıştırır.

## Kaynaklar

- Standart akort (Mi2 La2 Re3 Sol3 Si3 Mi4) ve gitarın duyulduğundan bir oktav yukarı yazılması:
  [Wikipedia — Standard tuning](https://en.wikipedia.org/wiki/Standard_tuning)
- Drop D, yarım ses pes, DADGAD, Açık Sol, Açık Re: [Wikipedia — List of guitar tunings](https://en.wikipedia.org/wiki/List_of_guitar_tunings)
  (kaynak oktav vermiyor; oktavlar en kalın telin standarttan en az gevşetilmesiyle seçildi)
- Pozisyon ve "her perdeye bir parmak" kuralı (1. pozisyonda 1–4. perde işaret–serçe):
  [Classical Guitar Corner — Playing in positions](https://classicalguitarcorner.com/playing-in-positions-on-the-guitar),
  [Dummies — Left-hand fingering in tab](https://www.dummies.com/article/academics-the-arts/music/instruments/guitar/how-to-understand-left-hand-fingering-in-guitar-tablature-198033/)
- Açık akor perde dizilimleri: [Wikipedia — Guitar chord](https://en.wikipedia.org/wiki/Guitar_chord);
  Am, C, D, Dm, Em parmak numaraları başlangıç rehberleriyle karşılaştırıldı (ör. [skillnation.in](https://skillnation.in/posts/guitar-chords-to-learn/));
  diğer akorların parmakları yaygın kullanımdır, bir kaynakla tek tek doğrulanmadı.
  Barre akorlar E ve A kalıbıdır. Testler her şeklin tel tel gerçekten o akorun seslerini verdiğini hesapla doğrular.
- Vuruş kalıpları: 4/4 kalıplar [tabs4acoustic — Strumming patterns for beginners](https://tabs4acoustic.com/en/guitar-lessons/strumming-patterns-for-beginners-87.html)
  ve [Guitar World — pendulum strumming](https://www.guitarworld.com/lessons/beginner-lessons/pendulum-strumming);
  Aksak 9/8 = 2+2+2+3 [Wikipedia — Aksak](https://en.wikipedia.org/wiki/Aksak); Türk aksağı 5/8 = 2+3, üç vuruşlu
  [TDV İslâm Ansiklopedisi](https://islamansiklopedisi.org.tr/turk-aksagi). Usullerin gitar vuruş yönlerine çevrilmesi bizim uyarlamamızdır.
- Perde sayıları tipik değerlerdir; çalgı modeline göre değişebilir.
- AEU perde listesi Sol Klarnet Dinleyici'den alındı.
- Hazır şarkı ve ezgiler kamu malı eserlerdir (Amazing Grace, Happy Birthday to You, Neşeye Övgü, Twinkle Twinkle, Frère Jacques);
  akorlar basitleştirilmiştir.

## Dosyalar

| Yol | İçerik |
|---|---|
| `index.html` | Yalnızca işaretleme: ayar çubuğu, sekmeler, paneller |
| `css/app.css` | Stiller (açık/koyu tema) |
| `js/core/` | Saf mantık, tarayıcı ve Node testleri ortak: `music` (nota, perde bulucu, FFT), `guitar` (akort, sap, parmak planı), `chords`, `rhythm`, `songs`, `ear`, `lessons` |
| `js/app/` | Arayüz modülleri: `base` (ayarlar, olay yolu, ses üretimi, mikrofon), `tabs`, `settings`, `sap`, `tuner`, `chords`, `rhythm`, `songs`, `melody`, `ear`, `lessons`, `main` |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | Çevrimdışı kullanım ve ana ekrana ekleme |
| `test.js` | Testler |

Betikler klasik `<script>` olarak sırayla yüklenir (derleme adımı yok). Her uygulama dosyası tek bir genel modül nesnesi
tanımlar; modüller birbirine `Bus` olaylarıyla haber verir.

## Yayınlama (GitHub Pages)

Depo ayarlarında **Settings → Pages → Deploy from a branch → `main` / root**; derleme adımı yoktur.
