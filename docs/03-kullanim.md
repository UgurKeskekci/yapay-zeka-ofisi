# 03: Günlük kullanım

[Önceki: İlk gün](02-ilk-gun.md) · [Başlangıç](../README.md) · [Sonraki: Uyarlama](04-uyarlama.md)

Telegram'da Müdür'e işin amacını, kapsamını, kaynaklarını ve teslim biçimini söyleyin.
“Bana bir şeyler bul” yerine neyin kararını vereceğinizi yazın. Şu mesajlar örnektir:

| Tür | Müdür'e mesaj |
|---|---|
| Araştırma | “Gündem, verdiğim resmi duyuru bağlantısını sürüm notuyla karşılaştırsın. Değişenleri kaynaklı kısa bir rapora yazsın.” |
| Araştırma | “Analist, tanımlı rakiplerin son videolarından henüz işlemediğim bir konu önersin. İzlenme yoksa tahmin etmesin.” |
| Takip | “Stajyer, gönderdiğim ürün bağlantısını mevcut ürün listesine eklesin. Marka ve modeli korusun, hedef fiyatı henüz boş bıraksın.” |
| Takip | “Oyun Stüdyosu, tanımlı projenin yeni yorumlarına baksın. Cevap göndermeden sorunları gruplasın.” |
| Taslak | “Stajyer, sosyal.md formatına göre bir içerik fikri ve açıklama taslağı hazırlasın. Onay masasına koysun.” |
| Taslak | “Gündem, doğrulanmış duyurudan kısa bir X taslağı hazırlasın. Denemediğim şeyi denedim diye yazmasın.” |
| Kod | “Oyun Stüdyosu, iş listesinin ilk maddesini yeniden üretsin. Düzeltmeyi ayrı ofis/ dalında doğrulasın. PR'ı ben açacağım.” |

Müdür yeni işi tek seferlik planlar. “Başladı” yanıtı işin bittiği anlamına gelmez. Sonuç dosyasını isteyin.

## Geri bildirim ve öğrenilen tercihler

> Bu taslak fazla uzun. Bundan sonra açıklamaları kısa tutun, kaynağı sona koyun. Bu tercihi tarihle ortak/tercihler.md dosyasına işleyin.

Müdür canlı ofisin `~/ofis/ortak/tercihler.md` dosyasına tarihli satır ekler. Sonraki işten önce çalışanlar okur.
“Kaydettim” mesajıyla yetinmeyin, ilk kez uygularken eklenen satırı göstermesini isteyin.
Tercihler işin üslubunu değiştirir; onay, anahtar ve dışarı gönderim sınırlarını kaldırmaz.
Tekrar kurulumdan önce öğrenilen canlı tercihleri `ozel/ortak/tercihler.md` kaynağına da aktarın.

## Onay masası

Taslaklar hem ilgili çalışanın çıktısında hem `~/ofis/onay/<çalışan>-<kisa-ad>.md` içinde durur.
Ofis ekranı onay listesini bu klasörden okur. Dosyanın ilk satırı başlıktır.

> Gündem'in taslağını bu haliyle kabul ediyorum. Onay dosyasını bitti klasörüne taşıyın. Paylaşımı ben yapacağım.

veya:

> Taslağı reddediyorum. Kaynakta olmayan iddiayı çıkarıp yeniden hazırlayın, nedenini tercihlere ekleyin.

Karardan sonra Müdür dosyayı `onay/bitti/` altına taşır. Buradaki onay otomatik paylaşım izni değildir.
Mesajı gönderme, satın alma, PR açma, birleştirme ve yayınlama size aittir.

## Fiyat listesine ürün ekleme

Telegram'dan ürünün **tam modelini**, gerçek bağlantısını, varsa hedef fiyatınızı ve aylık bitiş gününü verin.
Elle düzenlemek isterseniz canlı `~/ofis/ortak/fiyat-takip.json` dosyasındaki `urunler` listesine aynı biçimde ekleyin.
Aşağıdaki kayıt temsilidir; fiyat ve URL verilmediği için araştırmaya hazır değildir:

```json
{
  "kimlik": "kulaklik",
  "ad": "Takip edilecek kulaklık",
  "ayrinti": "Tam marka ve model burada yazılacak",
  "linkler": [],
  "hedef_tl": null,
  "acil": false,
  "aylik": {"bitis_gunu": null, "adet": 1},
  "not": "Temsili kayıt, kullanmadan önce doldurun."
}
```

| Alan | Anlamı |
|---|---|
| `kimlik` | Benzersiz dosya anahtarı; kısa ASCII ad kullanın, yol ayırıcı yazmayın. Geçmiş `fiyatlar/<kimlik>.json` olur. |
| `ad` | Okunacak ürün adı. |
| `ayrinti` | Marka, model, boyut, paket veya varyant. Yanlış ürünü karşılaştırmayı önler. |
| `linkler` | Doğrulanmış ürün ve fiyat geçmişi URL'lerinin listesi. Boşsa önce bağlantı istenir. |
| `hedef_tl` | Sizin belirlediğiniz sayısal TL hedefi; `null` hedef belirlenmedi demektir. Gerçek fiyat diye kullanılmaz. |
| `acil` | Sizin öncelik notunuz. Betik bunu ayrı bir sıklığa otomatik dönüştürmez. |
| `aylik` | Yalnız düzenli alınan üründe kullanın. Diğer ürünlerden bu alanı çıkarın. |
| `aylik.bitis_gunu` | Stokunuzun biteceği ayın günü, 1-31; bilinmiyorsa `null`. Otomatik cron oluşturmaz. |
| `aylik.adet` | Karşılaştırılacak miktar. Paket boyutunu `ayrinti` içinde de belirtin. |
| `not` | Kargo, tercih edilen satıcı veya kaçınılacak varyant gibi ek koşullar. |
| `siteler.fiyat_gecmisi` | Hangi kaynak sırasının izleneceği. |
| `siteler.siklik` | Çalışana verilen sıklık sınırı; gerçek çalışma saatleri cron ile belirlenir. |

JSON söz dizimini `python3 -m json.tool ~/ofis/ortak/fiyat-takip.json` ile kontrol edin.
İlk gün kendi geçmişiniz yoktur; önceki fiyat veya indirim oranı uydurulmaz. Sitedeki stok okunamıyorsa “bilinmiyor” yazılır.
Listeyi kalıcı kaynak olarak kullanacaksanız canlı değişikliği kendi `ozel/ortak/` kopyanıza da alın.

## Rutin saatini değiştirme ve durdurma

Önce kapsayıcıda ilgili profilin kayıtlarını görün:

```bash
hermes -p stajyer cron list --all
```

İşin **kimliğini**, adını, saatini ve teslimini bulun. Sonra Telegram'dan Müdür'e kimliğiyle söyleyin:

> stajyer profilindeki KIMLIK yer tutucusu yerine verdiğim gerçek kimlikli fiyat işini duraklatın. Aynı adlı başka işleri değiştirmeyin. Son durumunu gösterin.

`KIMLIK` yerine listede gördüğünüz değeri gönderin. Hermes zamanlı işleri konuşma içinden düzenleyebilir;
kurulu sürüm bunu desteklemiyorsa ayrıntı: [Hermes belgesi](https://github.com/NousResearch/hermes-agent),
[resmi zamanlı iş rehberi](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron).
Burada sürüme bağlı bir durdurma komutu varsayılmıyor.

Duraklatılan işi `cron list --all` ile doğrulayın. Yalnız “tamam” yanıtını yeterli saymayın.
Çalışmakta olan turu durdurmak ayrı işlemdir; gerekiyorsa Müdür'den onu da isteyin.

Yeni saat için eski işi duraklattıktan sonra terminalde yeni bir iş oluşturabilirsiniz. Bu örnek her gün 18:00 içindir:

```bash
hermes -p stajyer cron create "0 18 * * *" "SOUL.md ve ortak/tercihler.md kurallarına göre fiyat listesini kontrol et. Sonucu ~/ofis/ciktilar/stajyer/ altına tarihli Markdown olarak yaz. Gerçek değişiklik varsa özetini ~/ofis/ilet/ kuyruğuna koy. Satın alma." --name "[bot:stajyer] Günlük fiyat kontrolü" --deliver local --timezone Europe/Istanbul
hermes -p stajyer cron list --all
```

Eski işi durdurmadan yeni iş eklemek aynı işi iki kez yaptırır. Yeni saati canlı `~/ofis/rutinler.md` notuna da işleyin.
`kur.sh` aynı adlı mevcut işi yeniden yazmaz, eksik varsayılan işleri yeniden ekler; bilinçli olarak durdurduğunuz
rutinleri silmek yerine duraklatmak tekrar kurulumda korunmalarını sağlar. Senaryo değişiminde eski istemleri de yenileyin.

## Model değiştirme

Kapsayıcıda, erişiminiz olan modelin gerçek adını kullanın:

```bash
hermes -p stajyer config get model.default
hermes -p stajyer config set model.default MODEL_ADI
hermes -p stajyer config get model.default
```

`MODEL_ADI` yer tutucudur. Sağlayıcı girişini değiştirmek için `hermes model` kullanın.
Bu ayar sonraki profil çağrılarına uygulanır; Hermes'te ayrıca işe özel model ayarı yaptıysanız onu da kontrol edin.
Varsayılan kurulum çalışanların modellerini yeniden ayarlar. Seçiminizi korumak için `ozel/ayar.sh` içinde
`OFIS_GUCLU_MODEL` ve `OFIS_UCUZ_MODEL` değerlerini güncelleyin. `ozel/ayar.sh` içindeki değerler aynı adlı ortam
değişkenlerinin üstüne yazılır. `YUKSELT_MODEL`, Hermes profilinden ayrı Claude Code modelidir.

## Çıktıları okuma

| Yol | İçerik |
|---|---|
| `~/ofis/ciktilar/<çalışan>/` | İşin raporu, görseli veya videosu. |
| `~/ofis/ortak/` | Canlı ortak bağlam, tercihler, listeler. |
| `~/ofis/fiyatlar/` | Tarihli fiyat geçmişi. |
| `~/ofis/gundem/verilenler.md` | Aynı duyuruyu tekrar göndermemek için kayıt. |
| `~/ofis/onay/` | Kararınızı bekleyen taslaklar. |
| `~/ofis/ilet/gonderildi/` | İletim betiğinin işlediği mesajlar; Telegram teslimini ayrıca doğrulayın. |
| `~/ofis/yukselt/` | Takılan iş, çalışan ve biten yükseltme kayıtları. |
| `~/ofis/gecmis/` | Günün tekrarını besleyen JSONL durum kaydı. |

Ofis ekranı Markdown ve desteklenen medya dosyalarını gösterir; ara JSON/CSV dosyaları çıktı kartı olmaz.
Veriler kapsayıcıda kalır. Panelden okuduğunuz dosya tek yedek değildir; kalıcı disk ve yedeklerinizi ayrıca yönetin.
