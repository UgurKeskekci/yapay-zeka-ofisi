# Ofis arayüzü: tasarım kuralları

Hostinger VPS'te 7/24 çalışan 5 botluk yapay zeka ofisinin canlı ekranı. YouTube videosunda tam ekran kaydedilecek
(1920x1080 hedef, küçük ekranda orantılı küçülür). Oyun gibi görünür, ama sakin ve okunur.

## Veri

`ortak/ornek.js` örnek canlı akış verir (gerçekte aynı biçim Hermes eklentisinden gelir):

```js
OfisVeri.abone(durum => ...)   // her saniye tam durum
OfisVeri.olay(o => ...)        // {tur:"teslim", kimden:"analist", kime:"mudur"}: bir bot ötekine iş/kağıt gönderdi
OfisVeri.baslat(1000)          // akışı başlatır
```

`durum`: `saat`, `sunucu{ad,cpu,ram,acik}`, `harcama{bugun,kredi}` (USD), `skill` (öğrenilen skill sayısı),
`botlar[{id,ad,rol,model,renk,durum,eylem,is,maliyet,biten}]`, `akis[{t,metin,tur,kimden}]` (en yeni başta),
`onay[{bot,baslik}]`.

- `durum`: `calisiyor` | `dusunuyor` | `bosta` | `onay` (onay bekliyor)
- `eylem`: `yaziyor` | `okuyor` | `geziyor` (web) | `calistiriyor` (terminal) | `devrediyor` | `dusunuyor` | `onay`
- `akis.tur`: `is` | `teslim` | `onay` | `hata` | `skill`

Botlar: `mudur` Müdür (onay masası), `gundem` Gündem (haber, TV/ekranlar), `analist` Analist (grafik panosu),
`oyun` Oyun Stüdyosu (atari dolabı, konsol), `stajyer` Stajyer (küçük masa, deney).

## Ekranda olması gerekenler

1. Sahne (alanın çoğu): 5 oda, her odada bir karakter (botun rengiyle), odanın tabelası (bot adı). Her odanın eşyası
   farklı ve işini anlatır.
2. Karakterin başının üstünde ad + küçük model etiketi; yanında konuşma balonu: o anki `is` (en çok ~42 karakter,
   fazlası "..." ile kesilir). Boştayken balon yok ya da soluk.
3. Eyleme göre animasyon: yazıyor (klavye), okuyor (kağıt/kitap), geziyor (ekranda tarayıcı), çalıştırıyor (yeşil
   terminal ekranı), devrediyor (kağıt uzatır), düşünüyor (üç nokta). Onay bekleyen botun üstünde belirgin "!" işareti.
4. `teslim` olayında kağıt/zarf gönderenden alıcıya gider (yürüyerek ya da uçarak, ~1-1,5 sn).
5. Üst bar: saat, "Hostinger KVM 2" sunucu adı + CPU ve RAM çubuğu, bugünkü harcama ($), kalan kredi ($),
   öğrenilen skill sayısı.
6. Yan ya da alt panel: canlı akış (son 6-8 satır, saat + metin, tür rengiyle) ve "Onay masası" listesi.
7. Köşede küçük "ÖRNEK VERİ" etiketi.

## Görsel kurallar

- Oyun hissi: piksel ya da blok dünya, karakterler, eşyalar. Ama "AI slop" YOK: neon parlama, nabız atan halkalar,
  her yerde süzülen parçacık, altın parlama, kesik köşeli parlayan plakalar yok. Renkler doygun ama sakin.
- Videoda okunmalı: yazılar en az 16 px (1080p'de), kontrast yüksek, panel zeminleri düz ve koyu/açık net.
- Yazı tipi: oyun sürümlerinde Google Fonts "Pixelify Sans" (latin-ext, Türkçe ğ ş ı İ ç ö ü gösterir) ya da "Silkscreen"
  başlık + "Pixelify Sans" gövde. Türkçe karakterlerin düzgün göründüğünü kontrol et.
- Arayüz metni Türkçe, düzgün ve doğal. Uzun tire ve şapkalı harf yok.
- Her sürüm tek dosya: `taslaklar/<n-ad>/index.html`, vanilla JS, `../../ortak/ornek.js` yüklenir. Dış kütüphane
  gerekiyorsa yalnız jsDelivr'dan sabit sürüm (ör. three@0.160.0). Başka klasöre dokunma.
- 60 fps hafif çalışsın; canvas ya da SVG serbest. Pencere boyutu değişince sığsın.
