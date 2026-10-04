# Play Store'a yayın: yapılacaklar

Uygulama bir PWA; Android'e **TWA** (Trusted Web Activity) olarak paketlenir. Paket, siteyi tam ekran açan ince bir
Android kabuğudur: site güncellenince uygulama da güncellenir, mağazaya yeniden paket yüklemek gerekmez.

## Hazır olanlar (depoda)

- [x] Manifest: `id`, `start_url`, `scope`, `display: standalone`, tema ve arka plan rengi, kategoriler
- [x] Simgeler: 192 ve 512 px PNG, kenarı kırpılabilen (maskable) 192 ve 512 px, iOS için `apple-touch-icon`
- [x] Ekran görüntüleri: 3 telefon (824×1830) ve 1 geniş (1280×800), `screenshots/` (mağaza girişinde de kullanılabilir)
- [x] Kısayollar: Akort, Akorlar, Şarkılar, Dersler
- [x] Çevrimdışı çalışma (service worker), fontlar uygulamanın içinde
- [x] Gizlilik politikası: `privacy.html` (Türkçe + İngilizce) — mikrofon izni isteyen uygulamalar için zorunlu

## Senin yapacakların

1. **Alan adı kararı.** TWA'nın adres çubuğunu gizleyebilmesi için alan adının **kökünde**
   `/.well-known/assetlinks.json` olmalı. `alikrc.github.io/GuitarNoteDetectionApp/` alt dizinde olduğu için bu dosya
   oraya konamaz. Seçenekler:
   - Kendi alan adı (önerilen; ör. `gitardinleyici.com`): GitHub Pages ayarlarında *Custom domain* olarak bağlanır.
   - `alikrc.github.io` kullanıcı sitesi deposunun köküne `assetlinks.json` koymak (diğer projelerle aynı alan adını paylaşır).
2. **Geliştirici hesabı:** Play Console, bir kerelik 25 dolar ve kimlik doğrulaması.
3. **Paketi üret** (Node gerekir):
   ```bash
   npx @bubblewrap/cli init --manifest https://ALAN-ADI/manifest.webmanifest
   npx @bubblewrap/cli build
   ```
   - Paket adı önerisi: `com.alikrc.gitardinleyici`
   - Bubblewrap bir **imzalama anahtarı** üretir: kaybolursa güncelleme yayınlanamaz, güvenli bir yerde yedekle.
   - Mikrofon izni: TWA, sitenin istediği izinleri Chrome üzerinden sorar; ayrıca `RECORD_AUDIO` gerekmez
     (Bubblewrap sorarsa ekle).
4. **assetlinks.json:** Bubblewrap'in verdiği SHA-256 parmak iziyle `/.well-known/assetlinks.json` dosyasını alan adının
   köküne koy. (Play App Signing kullanılırsa Play Console'daki uygulama imzalama anahtarının parmak izi de eklenir.)
5. **Mağaza kaydı:** kısa ve uzun açıklama, `screenshots/` altındaki görüntüler, 1024×500 tanıtım görseli (henüz yok),
   gizlilik politikası adresi (`https://ALAN-ADI/privacy.html`).
6. **Formlar:** içerik derecelendirme anketi; veri güvenliği formunda “veri toplanmaz, paylaşılmaz; mikrofon sesi yalnızca
   cihazda işlenir”.
7. **Kapalı test:** yeni kişisel hesaplarda üretime çıkmadan önce kapalı test şartı var (yazıldığı tarihte 12 test
   kullanıcısı, 14 gün); Play Console'daki güncel kuralı kontrol et.

## Notlar

- Şarkı akorları Ultimate Guitar kullanıcı sayfalarından alındı, sözler uygulamada yok. Ücretli yayın düşünülürse akor
  kaynaklarının kullanım koşullarına yeniden bakılmalı.
- Fontlar SIL Open Font License ile dağıtılıyor; lisans metinleri `fonts/` klasöründe.
