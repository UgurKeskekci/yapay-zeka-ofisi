# 05: Hazır kullanım senaryoları

[Önceki: Uyarlama](04-uyarlama.md) · [Başlangıç](../README.md) · [Sonraki: Sorun giderme](06-sorun-giderme.md)

Her senaryo ortak dosyalar ve gerektiğinde rol değiştiren SOUL dosyaları içerir. Kişiler kurgusaldır;
aşağıdaki konuşmalar ve çıktılar **temsili** örneklerdir. Hiçbiri gerçek sonuç veya performans vaadi değildir.

## Bir senaryoyu uygulama

1. Kendi sunucunuzda mevcut özel ayarlarınızı ve canlı `~/ofis/ortak/` içeriğini yedekleyin.
2. Repo kökünde seçtiğiniz senaryoyu kopyalayın. Örneğin:

   ```bash
   mkdir -p ozel
   cp -r ornekler/ogrenci/* ozel/
   ```

   Bu komut aynı adlı özel kaynakları ezer. Eski senaryodan kalan `ozel/botlar/` rollerini yedekleyip kaldırın;
   kopyalama artık kullanılmayan dosyaları temizlemez. Özellikle içerik üreticisine dönerken eski özel SOUL'ları bırakmayın.
3. `ozel/ortak/` içindeki yer tutucuları doldurun. Kullanılmayan hesap ve kaynakları boşaltın.
   Değişen roller `ozel/botlar/<ad>/SOUL.md` yoluna gelir. `kur.sh` ortakları en son kopyalar, özel SOUL'u rol kaynağı olarak seçer.
4. `bash kurulum/kur.sh` ve `bash kurulum/kontrol.sh` çalıştırın.
5. **Kopyalama cron saat ve istemlerini değiştirmez.** Her profilin `cron list --all` sonucundan eski içerik görevlerini
   belirleyin ve [03'teki yöntemle](03-kullanim.md) duraklatın. Müdür'ün anlık iletme, yükseltme ve günün kaydı işlerini koruyun.
   Diğer Müdür plan/skill/brifing işleri de senaryoya göre değişmelidir. Yanlış görev gelirse örnek SOUL bunu reddeder.
6. Aşağıdaki saat önerilerini kurun. Her senaryoda bir tam `cron create` örneği var. Diğer satırları da aynı biçimle
   veya Telegram'da profil, görev ve saati açıkça vererek planlayın. `--timezone Europe/Istanbul` kullanın;
   `--deliver local` raporu dosyada tutar, acil özet `ilet/` kuyruğundan gider. Müdür brifingini `telegram` teslimiyle planlayın.
7. Her çalışana küçük bir elle görev verin, raporu ve yeni zamanlamayı doğrulayın. Ekrandaki beş oda ve ad sabit kalır;
   yeni görevler aynı profil kimliği altında çalışır.

Burada fiyat, ilan, PDF veya mağaza için ayrı bir veri entegrasyonu kurulmaz. Erişebildiğiniz gerçek kaynakları vermeniz gerekir.

## İçerik üreticisi

**Kim için:** Kanalı için kaynaklı video önerisi ve taslak isteyen kişi.

**Ekip:** Müdür kalır. Varsayılan beş rol korunur. Kod deposu yoksa Oyun Stüdyosu görevlerini duraklatın.

**Hazır dosyalar:** [ornekler/icerik-ureticisi/](../ornekler/icerik-ureticisi/). Ortak dosyaların tamamı vardır; varsayılan SOUL dosyaları kullanılır.

| Saat (öneri) | Profil | İş |
|---|---|---|
| 08:30 | `mudur` | Bugünkü yayın hazırlığını ve ekip görevlerini kısa bir plana yaz. |
| 09:00 | `gundem` | Resmi kaynaklarda yeni duyuru ara, kaynağı ve tarihiyle raporla. |
| 10:00 | `analist` | Tanımlı kanalları rakip-tarama skill ile incele, kaynaklı içerik öner. |
| 16:00 | `stajyer` | sosyal.md biçiminde bir fikir taslağı hazırla, onay masasına koy. |
| 19:00 | `mudur` | Günün çıktılarını özetle ve onay bekleyenleri listele. |

**Temsili Telegram konuşması:**

> Siz: Analist tanımlı kanallardan bir konu önersin. Stajyer bu konunun açıklama taslağını onaya koysun.
>
> Müdür: Kanal kimliklerini kontrol edip araştırmayı Analist’e vereceğim. Kaynağı olmayan sayı eklenmeyecek.
>
> Siz: Konu önerisinin gerekçesini gösterin, başlığı daha sade yazın.

**Temsili çıktı:**

```text
Taslak konu: Bir işi yapay zeka ekibine bölmek.
Gerekçe: Gerçek kullanımda doğrulanmış kanal verisi burada yer alır.
Eksik: Bu temsili örnekte canlı veri yok.
Onay: Başlık ve açıklama paylaşılmadan bekliyor.
```

Eski ilgili işler duraklatıldıktan sonra bu senaryonun ilk rutini:

```bash
hermes -p default cron create "30 8 * * *" "Bugünkü yayın hazırlığını ve ekip görevlerini kısa bir plana yaz. SOUL.md ve el kitabındaki teslim biçimini kullan; kendi çıktı klasörüne yaz." --name "[bot:mudur] Günün planı (senaryo)" --deliver telegram --timezone Europe/Istanbul
```

## E-ticaret satıcısı

**Kim için:** Rakip fiyat ve stok değişimini izleyip ürün açıklaması hazırlamak isteyen satıcı.

**Ekip:** Müdür kalır. Profil kimlikleri korunur, görevler şöyle değişir:

- `gundem`: **Pazar Takibi**. Yalnız kaynaklar.md içindeki resmi satıcı ve pazar duyurularını izler.
- `analist`: **Rakip Analisti**. fiyat-takip.json içindeki tam ürün eşleşmelerinde rakip fiyat ve stok durumunu karşılaştırır. Kanal taramaz.
- `oyun`: **Katalog Masası**. Ürün bilgisinden açıklama taslağı çıkarır. Kod değiştirmez; tanımlanmayan özellik ve sertifika eklemez.
- `stajyer`: **Stok ve Fiyat Asistanı**. Ürün sayfasındaki fiyat ve stok ibaresini tarih ve URL ile kaydeder. Sayfa açılmazsa bilinmiyor yazar.

**Hazır dosyalar:** [ornekler/e-ticaret/](../ornekler/e-ticaret/). Ortak dosyaların tamamı vardır; Müdür ve değişen dört çalışanın SOUL dosyaları da bulunur.

| Saat (öneri) | Profil | İş |
|---|---|---|
| 08:30 | `stajyer` | Listedeki ürünlerin fiyat ve stok ibaresini kaydet. Aynı model değilse karşılaştırma. |
| 10:00 | `analist` | Kaydedilen rakip fiyat ve stoklarını tam model eşleşmesiyle karşılaştır. |
| 14:00 | `oyun` | Patronun verdiği ürün bilgisinden kaynaklı açıklama taslağı hazırla, onay masasına koy. |
| 18:00 | `mudur` | Doğrulanan fiyat ve stok değişikliklerini, erişilemeyen kaynakları ve taslakları özetle. |

**Temsili Telegram konuşması:**

> Siz: Stajyer listedeki aynı model ürünlerin fiyat ve stok durumunu kontrol etsin. Katalog masası verdiğim özelliklerden açıklama yazsın.
>
> Müdür: Rakip sayfalarındaki görünür stok ibaresi kaydedilecek. Satıcıya mesaj veya mağaza paneline giriş yapılmayacak.
>
> Siz: Stok görünmüyorsa yok saymayın, bilinmiyor yazın. Açıklamaya ölçmediğimiz performans iddiası eklemeyin.

**Temsili çıktı:**

```text
Ürün: Tanımlanacak tam model.
Fiyat: Bu temsili örnekte canlı fiyat okunmadı.
Stok: Bilinmiyor, sayfa doğrulaması gerekli.
Açıklama taslağı: Yalnız sağlanan malzeme ve ölçü bilgileri kullanılır.
Durum: Onay bekliyor.
```

Eski ilgili işler duraklatıldıktan sonra bu senaryonun ilk rutini:

```bash
hermes -p stajyer cron create "30 8 * * *" "Listedeki ürünlerin fiyat ve stok ibaresini kaydet. Aynı model değilse karşılaştırma. SOUL.md ve el kitabındaki teslim biçimini kullan; kendi çıktı klasörüne yaz." --name "[bot:stajyer] Fiyat ve stok (senaryo)" --deliver local --timezone Europe/Istanbul
```

Fiyat ve stok takibi yalnız ürün sayfasında görünen bilgiye dayanır. Paket veya varyant eşleşmezse karşılaştırma yapılmaz; stok okunamıyorsa “bilinmiyor” kalır. Hesap içi envantere erişim kurulmaz.

## Bağımsız geliştirici / küçük SaaS

**Kim için:** Küçük kod işleri, sürüm notları ve herkese açık kullanıcı yorumlarıyla çalışan geliştirici.

**Ekip:** Müdür kalır. Profil kimlikleri korunur, görevler şöyle değişir:

- `gundem`: **Teknoloji Takibi**. Yalnız kaynaklar.md içinde tanımlı bağımlılıkların resmi sürüm notlarını izler.
- `analist`: **Kullanıcı Geri Bildirimi**. Patronun sağladığı anonim yorum dosyalarını veya herkese açık bağlantıları inceler, yinelenen sorunları kanıtla gruplar. Kanal taramaz.
- `oyun`: **Geliştirme Masası**. oyunlar.json içindeki öncelikli uygulamanın küçük hatasını kontrol betiğiyle yeniden üretir, ofis/ dalında doğrular. Claude Code ve el kitabındaki geliştirme sınırlarını izler.
- `stajyer`: **Sürüm Notu Asistanı**. Yalnız doğrulanmış ve taban dala alınmış değişikliklerden sürüm notu taslağı çıkarır; hazır ofis/ dalını yayımlanmış saymaz.

**Hazır dosyalar:** [ornekler/bagimsiz-gelistirici/](../ornekler/bagimsiz-gelistirici/). Ortak dosyaların tamamı vardır; Müdür ve değişen dört çalışanın SOUL dosyaları da bulunur.

| Saat (öneri) | Profil | İş |
|---|---|---|
| 09:00 | `analist` | Sağlanan kullanıcı yorumlarını kaynak ve yeniden üretme bilgisiyle grupla. |
| 11:00 | `oyun` | Öncelikli uygulamanın iş listesindeki ilk küçük hatayı yeniden üret, ofis/ dalında düzelt ve tanımlı komutlarla doğrula. |
| 16:00 | `stajyer` | Taban dala alınmış doğrulanmış değişikliklerden sürüm notu taslağı hazırla, onay masasına koy. |
| 18:00 | `mudur` | Hazır dalları, doğrulamayı ve onay bekleyen sürüm notlarını özetle. |

**Temsili Telegram konuşması:**

> Siz: Analist gönderdiğim anonim yorumları gruplasın. Geliştirme masası iş listesindeki ilk hatayı önce yeniden üretsin.
>
> Müdür: Yorum kaynakları ayrı raporlanacak. Düzeltme yalnız ofis/ dalında yapılacak; PR açma ve birleştirme sizde.
>
> Siz: Cihazda denenmeyen davranışı doğrulanmış saymayın. Sürüm notuna birleştirilmemiş dalı koymayın.

**Temsili çıktı:**

```text
İş: İş listesinde tanımlanacak hata.
Durum: Bu temsili örnekte kod çalıştırılmadı.
Doğrulama: Kontrol betiği ve proje testi bekleniyor.
Sürüm notu: Taban dala alınmış değişiklikler doğrulanınca hazırlanacak.
```

Eski ilgili işler duraklatıldıktan sonra bu senaryonun ilk rutini:

```bash
hermes -p analist cron create "0 9 * * *" "Sağlanan kullanıcı yorumlarını kaynak ve yeniden üretme bilgisiyle grupla. SOUL.md ve el kitabındaki teslim biçimini kullan; kendi çıktı klasörüne yaz." --name "[bot:analist] Yorum taraması (senaryo)" --deliver local --timezone Europe/Istanbul
```

Hazır `oyunlar.json` Node/TypeScript örneğidir. [Python ve Expo komutları](04-uyarlama.md) ile değiştirilebilir. Depoyu bağlamadan hata rutinini açmayın.

## Üniversite öğrencisi

**Kim için:** Kendi ders notlarından sınav özeti ve haftalık çalışma planı isteyen öğrenci.

**Ekip:** Müdür kalır. Profil kimlikleri korunur, görevler şöyle değişir:

- `gundem`: **Ders Takvimi**. kaynaklar.md içindeki ders ve sınav tarihlerini izler. Tarih verilmediyse sorar; okul hesabına girmez.
- `analist`: **Not Analisti**. Patronun gönderdiği ders notlarını konu ve kaynak sayfasıyla düzenler. Kanal ve fiyat taramaz.
- `oyun`: **Çalışma Planı Masası**. Dersler, sınav tarihleri ve patronun uygun saatlerinden haftalık çalışma planı taslağı hazırlar. Kod deposu kullanmaz.
- `stajyer`: **Ders Asistanı**. Telegram ile gelen PDF ders notundan sayfa numaralı sınav özeti ve tekrar soruları hazırlar. PDF aracı yoksa eksikliği açıkça söyler; yanıt uydurmaz.

**Hazır dosyalar:** [ornekler/ogrenci/](../ornekler/ogrenci/). Ortak dosyaların tamamı vardır; Müdür ve değişen dört çalışanın SOUL dosyaları da bulunur.

| Saat (öneri) | Profil | İş |
|---|---|---|
| 09:00 | `gundem` | Verilen ders takvimindeki yaklaşan sınavları bildir; tarih yoksa belirt. |
| 18:00 | `stajyer` | Bugün sağlanan notlardan sayfa numaralı kısa tekrar özeti hazırla. Yeni dosya yoksa sessiz kal. |
| 20:00 | `mudur` | Bugünkü özetleri ve açık soruları listele; yarının çalışma önerisini ver. |

Haftalık plan için pazar 19:00 önerilir. Ders ve sınav tarihleri `ortak/kaynaklar.md` içinde tutulur.

**Temsili Telegram konuşması:**

> Siz: Bu PDF benim ders notum. Stajyer sayfa numaralarıyla sınav özeti ve tekrar soruları hazırlasın. Plan masası da verdiğim uygun saatlere göre haftalık plan çıkarsın.
>
> Müdür: Dosyanın gerçekten okunabildiğini kontrol edeceğim. Okunmayan sayfaları belirteceğim, notta olmayan cevap eklenmeyecek.
>
> Siz: Özette her başlığın sayfası olsun. Sınav tarihini ben söylemeden tahmin etmeyin.

**Temsili çıktı:**

```text
Ders özeti: Bu temsili örnekte PDF içeriği yok.
Kaynak: Gerçek çalışmada dosya adı ve sayfa numarası.
Açık nokta: Okunamayan sayfalar varsa ayrı listelenir.
Plan: Sınav tarihi ve uygun saatler verilince günlere bölünür.
```

Eski ilgili işler duraklatıldıktan sonra bu senaryonun ilk rutini:

```bash
hermes -p gundem cron create "0 9 * * *" "Verilen ders takvimindeki yaklaşan sınavları bildir; tarih yoksa belirt. SOUL.md ve el kitabındaki teslim biçimini kullan; kendi çıktı klasörüne yaz." --name "[bot:gundem] Takvim kontrolü (senaryo)" --deliver local --timezone Europe/Istanbul
```

PDF'yi Telegram'daki kendi botunuza belge olarak ekleyin ve hemen ardından görevi yazın.
Hermes'in kurulu sürümünde dosya alma ve PDF okuma aracı bulunmalıdır. Müdür'den dosyanın gerçek yolunu ve
okunabilen ilk sayfayı doğrulamasını isteyin. Stajyer'e erişilebilir dosya yoluyla görev verilsin; ekin otomatik
olarak diğer profile geçtiği varsayılmasın. Taranmış PDF'de OCR aracı yoksa aranabilir PDF veya metin sağlayın.
Bot dosyayı okuyamıyorsa özet uydurmak yerine bunu söylemelidir. Yalnız paylaşmaya yetkili olduğunuz notları kullanın.

Haftalık planın ayrı rutini:

```bash
hermes -p oyun cron create "0 19 * * 0" "Verilen sınav tarihleri ve uygun saatlerden haftalık çalışma planı taslağı hazırla. Bilinmeyen tarihi sor. Sonucu ~/ofis/ciktilar/oyun/ altına yaz, özeti ~/ofis/ilet/ kuyruğuna koy." --name "[bot:oyun] Haftalık çalışma planı" --deliver local --timezone Europe/Istanbul
```

## Serbest çalışan / küçük ajans

**Kim için:** İş ilanlarını izleyip teklif ve müşteri raporu taslağı hazırlamak isteyen ekip.

**Ekip:** Müdür kalır. Profil kimlikleri korunur, görevler şöyle değişir:

- `gundem`: **İlan Takibi**. Yalnız kaynaklar.md içindeki herkese açık ilan sayfalarını takip eder. Giriş yapmaz ve başvuru göndermez.
- `analist`: **İş Uygunluğu Analisti**. İlanları sahip.md içindeki beceri, kapsam ve çalışma tercihlerine göre değerlendirir. Bütçe belirtilmemişse bilinmiyor yazar.
- `oyun`: **Teklif Masası**. Patronun sağladığı kapsam ve koşullardan teklif taslağı hazırlar. Fiyat, teslim tarihi ve referans uydurmaz; kod değiştirmez.
- `stajyer`: **Müşteri Raporu Asistanı**. Sağlanan iş kaydından müşteri raporu taslağı hazırlar. Ölçülmeyen ilerleme yüzdesi veya müşteri verisi eklemez.

**Hazır dosyalar:** [ornekler/serbest-calisan/](../ornekler/serbest-calisan/). Ortak dosyaların tamamı vardır; Müdür ve değişen dört çalışanın SOUL dosyaları da bulunur.

| Saat (öneri) | Profil | İş |
|---|---|---|
| 09:00 | `gundem` | Tanımlı açık ilan kaynaklarını tara, yeni olanları kaynak ve tarihle kaydet. |
| 10:00 | `analist` | Yeni ilanları belirtilen beceri ve kapsam koşullarına göre değerlendir. |
| 14:00 | `oyun` | Seçilen ilan için patronun verdiği koşullardan teklif taslağı çıkar; eksik fiyat ve tarihi boş bırak. |
| 17:00 | `stajyer` | Sağlanan anonim iş kaydından yapılanlar ve sıradaki işler raporu hazırla, onay masasına koy. |
| 18:00 | `mudur` | Uygun işleri ve onay bekleyen teklif ve raporları özetle. |

**Temsili Telegram konuşması:**

> Siz: Gündem verdiğim herkese açık ilanları izlesin. Analist uygun olanları ayırsın, teklif masası seçtiğim iş için taslak hazırlasın.
>
> Müdür: Başvuru gönderilmeyecek. Bütçe, tarih ve referans yalnız sağladığınız bilgilere dayanacak.
>
> Siz: Bu teklifin ücretini ve teslim tarihini henüz yazmayın. Müşteri raporunda yalnız tamamlandığını doğruladığım işler olsun.

**Temsili çıktı:**

```text
İlan: Gerçek bağlantı eklenecek.
Uygunluk: Beceri ve kapsam eşleşmesi doğrulanacak.
Teklif: Kapsam taslağı hazır, ücret ve teslim tarihi patronu bekliyor.
Müşteri raporu: Yalnız doğrulanan işler, onay bekliyor.
```

Eski ilgili işler duraklatıldıktan sonra bu senaryonun ilk rutini:

```bash
hermes -p gundem cron create "0 9 * * *" "Tanımlı açık ilan kaynaklarını tara, yeni olanları kaynak ve tarihle kaydet. SOUL.md ve el kitabındaki teslim biçimini kullan; kendi çıktı klasörüne yaz." --name "[bot:gundem] İlan turu (senaryo)" --deliver local --timezone Europe/Istanbul
```

İlan bağlantılarını ve anonim iş kayıtlarını `ortak/kaynaklar.md` içine yazın. Teklif ücretini ve teslim tarihini siz belirlersiniz. Raporlar müşteriye otomatik gönderilmez.
