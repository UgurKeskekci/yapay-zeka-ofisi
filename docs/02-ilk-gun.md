# 02: İlk gün

[Önceki: Kurulum](01-kurulum.md) · [Başlangıç](../README.md) · [Sonraki: Kullanım](03-kullanim.md)

İlk hedefiniz çok rapor toplamak değil, verdiğiniz küçük bir görevin doğru dosyaya ve Telegram'a ulaştığını görmek.
Önce kapsayıcıda `bash kurulum/kontrol.sh` çalıştırın. Ardından Telegram'daki Müdür'e yazın:

> Ofisin ortak dosyalarını kontrol edin. Yer tutucu kalan alanları söyleyin. Şimdilik dış kaynak taraması yapmayın.

## Rutini beklemeden her çalışanı deneyin

Aşağıdaki mesajları Telegram'da **Müdür'e** yazın. Müdür tek seferlik görevi `in 1m` zamanlamasıyla oluşturur;
bu tamamlanma süresi değildir. Yanıt ve dosya gelmeden hepsini birden göndermeyin.

| Çalışan | Örnek mesaj |
|---|---|
| Müdür | “Bugünkü işleri ve onay bekleyenleri dosyaya yazın. Henüz yapılmayanı yapılmış saymayın.” |
| Gündem | “Gündem resmi bloglardan yeni bir model duyurusu arasın. Tarihi ve kaynağıyla raporlasın, X yoksa yedek yolu kullansın.” |
| Analist | “Analist ortak dosyalarda tanımlı kanalları tarasın. Kanal kimlikleri eksikse durup eksikleri söylesin.” |
| Oyun Stüdyosu | “Oyun Stüdyosu öncelikli projenin kod yollarını ve kontrol komutlarını kontrol etsin. Bu ilk turda kod değiştirmesin.” |
| Stajyer | “Stajyer takip listesindeki ilk ürünün fiyatını okusun. Geçmiş yoksa bugün başladığını yazsın; satın almasın.” |

Kod deposu bağlamadıysanız Oyun Stüdyosu'nun eksik bildirmesi beklenir. Sahte proje verisiyle geliştirme başlatmayın.
Analist için doldurulmuş kanal kimliği, Stajyer için gerçek ürün bağlantısı gerekir.

**Kontrol:** `~/ofis/ciktilar/<çalışan>/` altında tarihli bir Markdown raporu bulunmalıdır.
İlk satır ekranda görünen sonuçtur. Acil özet ayrıca `~/ofis/ilet/` kuyruğuna girer;
Müdür'ün iletim betiği bu kuyruğu beş dakikada bir alır. Gönderilen dosya `ilet/gonderildi/` altına taşınır.
Her yerel rapor Telegram'a gitmez. İlk mesaj yanıtıyla kuyruk teslimi farklı akışlardır.

## İlk 24 saatin takvimi

Kurulum varsayılan olarak [rutinler.md](../botlar/rutinler.md) içindeki **normal** sütununu kurar (`OFIS_RUTIN=yogun` verilirse yoğun sütunu).
Saatler `Europe/Istanbul`. Kurduğunuz saatten sonraki ilk eşleşme beklenir; kaçırılan sabah işleri geriye dönük çalışmaz.

| Saat (normal) | Ne olur | Nereden bakarsınız |
|---|---|---|
| 02:00 | Oyun Stüdyosu hata veya sıradaki küçük işi alır. | `ciktilar/oyun/`, hazır dal varsa Telegram |
| 07:30 | Analist rakipleri tarar. | `ciktilar/analist/` |
| 08:30 | Müdür günün planını yazar. | Telegram, `ciktilar/mudur/` |
| 09:00-21:00, 3 saatte bir | Gündem yeni duyuru arar. Yenilik yoksa dosya ve bildirim üretmez. | Yeni haber varsa `ciktilar/gundem/` |
| 10:00 | Stajyer skill kullanmadan fiyat turu yapar. | `ciktilar/stajyer/`, `fiyatlar/` |
| 14:30 | Müdür sabahki fiyat turundan bir skill çıkarır. | Stajyer profilinin `skills/fiyat-takip/SKILL.md` dosyası |
| 16:00 | Stajyer varsa fiyat-takip skill'iyle tekrar bakar. | `ciktilar/stajyer/` |
| 18:00 | Oyun Stüdyosu not ve devlog taslağı hazırlar. | `ciktilar/oyun/`, `onay/` |
| 19:30 | Gündem akşam özeti ve X taslağı hazırlar. | `ciktilar/gundem/`, `onay/` |
| 20:00 | Müdür brifingi birleştirir. | Telegram, `ciktilar/mudur/` |
| Ayın 20'si 10:00 | Stajyer aylık işaretli ürünleri karşılaştırır. | `ciktilar/stajyer/`, Telegram |
| Her 5 dakikada | Müdür acil iletim kuyruğunu okur. | `ilet/gonderildi/` |
| Her dakika | Yükseltme kuyruğu işlenir ve günün durum kaydı alınır. | `yukselt/`, `gecmis/` |

Aylık iş, `bitis_gunu` alanına göre otomatik yeniden zamanlanmaz; sabit ayın 20'si işidir.
`rutinler.md` içindeki “Normal” sütunu öneridir. Geçmek için [rutin düzenleme adımlarını](03-kullanim.md) uygulayın.
Ölçülmeyen süre ve maliyet karşılaştırmasını Müdür'den de istemeyin; veri yoksa “ölçülmedi” yazmalıdır.

## Ofis ekranında ne görürsünüz

Kendi bilgisayarınızda [canlı ekranı](01-kurulum.md) açın. Çalışanın odasını veya listedeki adını seçin.
Durum, son iş, geçmiş ve ürettiği raporlar görünür. Beklerken “Sırada” bilgisi normaldir.
`/pano/` raporları toplar. `/telefon/` bir telefon görünümüdür, Telegram uygulamasının kendisi değildir.

Canlı modda maliyet Hermes oturumlarındaki **tahmini** değerlerden gelir; sağlayıcı faturası veya kesin kota değildir.
Kalan kredi bilinmiyorsa boş gösterilir. Demo sayıları ve olayları temsilidir.
Günün kaydı oluştuktan sonra `/ofis/?tekrar=1&hiz=60` ile kayıtlı akışı izleyebilirsiniz.

## Yükseltmeyi nasıl anlarsınız

Çalışan kendi yedek yolunu da denediğinde takılırsa `~/ofis/yukselt/<çalışan>-<zaman>.md` notunu bırakır.
Müdür'ün dakikalık betiği notu `yukselt/calisiyor/` altına taşır ve Claude Code'u başlatır.
Ekranda Müdür için “Claude Code çözüyor” görünür. Başarılı rapor `ciktilar/mudur/*-cozum.md` dosyasına,
özet Telegram'a gelir. İş kaydı `yukselt/bitti/` altına taşınır. Başarısızsa çözülmüş rapor yerine hata mesajı gelir;
`bitti/` tek başına başarı kanıtı değildir. Akış etiketi yerine rapor ve çıkış sonucunu esas alın.

Sırf animasyonu görmek için ücretli bir yükseltme başlatmayın. Gerçek bir iş takıldıysa şunu yazabilirsiniz:

> Analist'in takıldığı iş için denenen yolu ve hatayı yükseltme notuna yazın. Aynı yolu tekrar etmeyin. Çözüm yoksa benden ne gerektiğini söyleyin.

Claude Code girişi yoksa [sorun gidermeye](06-sorun-giderme.md) bakın.
