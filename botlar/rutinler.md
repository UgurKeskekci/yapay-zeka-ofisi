# Rutinler (zamanlı işler)

Saatler Türkiye saati (Europe/Istanbul). Kurulum iki sıklıktan birini Hermes cron işlerine çevirir:
**normal** (varsayılan) ya da **yoğun** (`OFIS_RUTIN=yogun bash kurulum/kur.sh`). Yoğun ayar daha çok model kullanır;
ofisin tanıtım videosu bu ayarla çekildi. Bu dosyayı düzenlemek mevcut işlerin saatini veya istemini değiştirmez,
[rutin değiştirme rehberi](../docs/03-kullanim.md) ile cron kayıtlarını ayrıca düzenleyin.

| Bot | Normal (varsayılan) | Yoğun | İş |
|---|---|---|---|
| Müdür | 08:30 | 09:30 | Günün planı: ekibe iş dağıt |
| Gündem | 3 saatte bir (09:00-21:00) | saat başı (09:00-23:00) | X'te model radarı, yenilik yoksa sessiz |
| Gündem | 19:30 | 18:30 | Akşam gündem özeti + X taslağı |
| Analist | 07:30 | 11:00, 17:00 | Rakip tarama + sıradaki video önerisi |
| Oyun Stüdyosu | 02:00 (gece) | 02:00, 12:00 | Öncelikli proje: iş, kontrol betiği, Claude Code ile düzeltme, PR'a hazır dal |
| Oyun Stüdyosu | 18:00 | 18:00 | Not (taban dal, açık PR, mağaza yorumu) + devlog taslağı |
| Stajyer | 10:00 (skill'siz), 16:00 (skill'li) | aynı | Fiyat takibi |
| Stajyer | her ayın 20'si 10:00 | aynı | Aylık alışveriş: en ucuz toplam |
| Müdür | 14:30 | aynı | Stajyer'in sabah turundan `fiyat-takip` skill'ini yaz |
| Müdür | 20:00 | 19:00 | Brifing + onay masası, patrona son yazdığı kanaldan |
| Müdür | 5 dakikada bir | aynı | Anlık iletme kuyruğu (yapay zeka çağırmaz) |
| Müdür | dakikada bir | aynı | Yükseltme kuyruğu ve günün kaydı (kuyruk boşsa çalışmaz) |

## İstemler

**Müdür · günün planı**
> Bugünün planını çıkar. Ekipteki her çalışana bugün yapacağı işi tek satırla ilet. Sonra patrona planı 5 satırı
> geçmeyecek şekilde özetle.

**Gündem · model radarı**
> `ortak/x-hesaplar.json`'daki resmi hesaplara X araması ile bak. Son turdan bu yana yeni model, yeni sürüm ya da
> büyük fiyat değişikliği varsa anlık bildirim biçimiyle Müdür'e hemen teslim et. Yoksa hiçbir şey gönderme.

**Gündem · akşam özeti**
> Bugün yapay zeka dünyasında olanlardan en önemli 3'ünü ve bir X taslağı hazırla, Müdür'e teslim et.

**Analist · rakip tarama**
> Kanalı ve rakipleri tara, sıradaki video önerisini hazırla, Müdür'e teslim et. Bu işi daha önce yaptıysan
> kaydettiğin skill'i kullan; iyi bir yöntem bulduysan skill olarak kaydet.

**Oyun Stüdyosu · hata turu**
> `ortak/oyunlar.json` içindeki öncelikli projenin yorumlarına ve X'e bak; yeni hata bildirimi yoksa `kod.is_listesi`
> dosyasındaki en üstteki işi al. SOUL.md'deki hata turunu izle: kontrol betiğiyle yeniden üret, Claude Code ile
> `kod.ofis_dali` dalında düzelt, projedeki komutlarla doğrula, PR'a hazır dalı Müdür'e teslim et.

**Oyun Stüdyosu · not ve devlog**
> `ortak/oyunlar.json` içindeki öncelikli projenin `kod.taban_dal` dalına son turdan bu yana ne girdiğini,
> açık PR'ları ve yeni mağaza yorumlarını üç satırda yaz.
> Bir devlog taslağı hazırla.
> Müdür'e teslim et.

**Stajyer · fiyat turu**
> `ortak/fiyat-takip.json`'daki ürünlerin fiyatını oku ve kaydet. İndirim gerçek mi, geçmişle karşılaştır. Hedefin
> altına düşen ya da 30 günün en düşüğüne gelen varsa Müdür'e hemen teslim et, yoksa sessiz kal.

**Stajyer · aylık alışveriş**
> `aylik` işaretli ürünler için en ucuz toplamı bul (kargo dahil), linkleriyle Müdür'e teslim et. Satın alma.

**Müdür · skill yaz**
> Stajyer'in sabahki fiyat turunun raporunu ve izlediği yolu oku. İşe yarayan adımları `fiyat-takip` skill'i olarak
> yaz: hangi site, hangi sayfa, fiyat ve geçmiş nereden okunur, neye dikkat edilir. Stajyer'e öğleden sonraki turda
> bu skill'i kullanmasını söyle.

**Müdür · brifing**
> Gün içinde gelen raporları birleştir. SOUL.md'deki brifing biçimiyle patrona son yazdığı kanaldan gönder. Onay
> bekleyen taslakları tek tek listele. Stajyer'in skill'siz ve skill'li turunu yan yana koyup farkı iki satırda yaz
> (süre, maliyet, doğru ürünü buldu mu).

**Stajyer · sosyal medya fikri (istek üzerine)**
> `ortak/sosyal.md` dosyasındaki format ve serilere göre bir içerik fikri taslağı hazırla. Dosyadaki taslak
> biçimini kullan. Müdür'e ve onay masasına teslim et; paylaşma.
