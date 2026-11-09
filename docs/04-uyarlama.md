# 04: Kendinize uyarlama

[Önceki: Kullanım](03-kullanim.md) · [Başlangıç](../README.md) · [Sonraki: Senaryolar](05-senaryolar.md)

Canlı veriler `~/ofis/`, kurulumu tekrar üretmek için kaynaklar repo içindedir.
Kişisel rol değişikliklerini `ozel/botlar/<ad>/SOUL.md`, ortak bilgileri `ozel/ortak/` içinde tutun.
Kurulum özel SOUL'u repodakinin yerine kullanır ve el kitabını sonuna ekler.
Yeni rol, eski rutinin istemini değiştirmez. Önce eski işleri duraklatın, sonra yeni görevi zamanlayın.

## Yeni çalışan ekleme

Kapsayıcıda repo kökünde:

```bash
bash kurulum/calisan-ekle.sh editor "Editör" "Kaynaklı taslakları dil ve tutarlılık açısından denetler"
```

İsteğe bağlı dördüncü argüman erişebildiğiniz model adıdır. Vermezseniz `OFIS_UCUZ_MODEL`, o da yoksa
`gpt-6-luna` kullanılır. Betik kısa adı denetler; aynı profil zaten varsa üzerine yazmadan durur.
`botlar/editor/SOUL.md` varsa kullanır; yoksa [şablondan](../botlar/_sablon/SOUL.md) ad ve rolü doldurup
**repoya da** yazar. Repo Hermes kullanıcısı için yazılabilir olmalıdır.
`ozel/botlar/editor/SOUL.md` varsa etkin rol olarak o seçilir.

Profil `--clone --no-alias --description` ile oluşur; model ayarlanır, el kitabıyla birlikte SOUL yazılır,
`~/ofis/ciktilar/editor/` açılır. Rutin eklenmez. Klonlama ana profilin erişimlerini de paylaşabileceği için
[anahtar sınırlarını](07-guvenlik.md) gözden geçirin. Sonraki `kur.sh` çalıştırmaları ek çalışanları bulur,
SOUL'u yeniler, mevcut modelini korur.

Örnek rutin, her gün 15:00:

```bash
hermes -p editor cron create "0 15 * * *" "EL-KITABI.md ve SOUL.md kurallarını oku. Onay masasındaki metinleri yalnız dil ve kaynak tutarlılığı için incele, asılları değiştirme. Sonucu ~/ofis/ciktilar/editor/ altına tarihli Markdown olarak yaz, özeti ~/ofis/ilet/editor-ozet.md dosyasına koy." --name "[bot:editor] Taslak denetimi" --deliver local --timezone Europe/Istanbul
hermes -p editor cron list --all
```

Müdür'e yeni çalışanın kısa adını, görevinin sınırını ve hangi işleri ona vermesi gerektiğini de söyleyin.
Kalıcı yönlendirmeyi `ozel/botlar/mudur/SOUL.md` içinde saklayın; mevcut Müdür davranışlarını koruyun.

### Elle ekleme

`editor` profilinin henüz bulunmadığını `hermes profile list` ile kontrol edin:

```bash
hermes profile create editor --clone --no-alias --description "Editör: taslak denetimi"
hermes -p editor config set model.default MODEL_ADI
hermes profile describe editor --text "Editör: taslak denetimi" --overwrite
```

`MODEL_ADI` yer tutucusunu değiştirin. Ardından `botlar/editor/SOUL.md` kaynağını şablondan oluşturup doldurun.
`bash kurulum/kur.sh` çalıştırın: kaynak rol ve el kitabını `$HERMES_HOME/profiles/editor/SOUL.md` içine yazar.
Elle yalnız profil dizinindeki SOUL'u düzenlemeyin; tekrar kurulumda kaynak sürüm uygulanır.

### Ekranın sınırı

`durum.py` içindeki `BOTLAR`, `arayuz/ortak/canli.js`, pano sırası ve ofisteki odalar beş varsayılan çalışana göre sabittir.
Yeni çalışan Hermes'te iş yapar, çıktı ve iletim kuyruğunu kullanabilir; **ofiste yeni oda veya pano sütunu oluşmaz**.
Ek çalışan raporlarını dosya yolundan okuyun veya Müdür'den aktarmasını isteyin.
Sırf Python listesini büyütmek çözmez: canlı veri katmanı bilinmeyen çalışanı eler.
Bu nedenle mevcut ekranı koruyan kurulum `durum.py` listesini değiştirmez.
Rolü değişen varsayılan çalışanlar da ekranda eski adla görünür; profilin yeni işi SOUL dosyasındadır.

## SOUL nasıl yazılır

İyi rol; kaynak, iş akışı, teslim ve durma koşulunu açıklar. Çalışanın sınırını dosyayla belirleyin.

**Kötü örnek, kullanmayın:** “Her şeyi araştır, satışları artır, gerekirse müşteriye yaz.”
Kaynak, teslim veya yetki sınırı yoktur; sonuç vaat eder ve güvenlik kuralını ihlal eder.

**İyi örnek:**

```text
Sen fiyat araştırmacısısın. Yalnız ortak/fiyat-takip.json içindeki ürünleri incele.
Tam model ve paket boyutu eşleşmiyorsa karşılaştırma yapma.
Önce tanımlı ürün sayfasını, sonra fiyat geçmişi kaynağını oku.
Fiyat, stok durumu, kontrol tarihi ve URL'yi kaydet. Okunmayan alan bilinmiyor kalır.
Raporu kendi çıktı klasörüne yaz. Satın alma, hesaba girme, satıcıya mesaj gönderme.
Özel görevde bütün kaynaklar kapanırsa denenenleri yazıp Müdür'e yükselt.
```

[Şablonun](../botlar/_sablon/SOUL.md) açıklama cümlelerini gerçek talimatlarla değiştirin.
“Her işi yap” demek yerine tek turda bitebilecek bir görev seçin. Araç ve modelin sağlayamadığı özelliği var saymayın.

## Skill yazma

[Gerçek rakip-tarama skill'ini](../botlar/skills/rakip-tarama/SKILL.md) örnek alın:

1. `botlar/skills/<kisa-ad>/SKILL.md` oluşturun. Başta `name` ve hangi görevde kullanılacağını anlatan `description` olsun.
2. Girdi dosyalarını, kaynakları, adımları ve teslim biçimini yazın. Eksik veri ve sıfıra bölme gibi durumlarda ne yapılacağını belirtin.
3. Sayı üretme yöntemini açık yazın. Mevcut örnek, son 15 videonun ortancasını kullanır; oran eşik ve pencere bir yöntem kuralıdır, ölçülmüş başarı iddiası değildir.
4. Küçük gerçek görevde kaynakla karşılaştırın. Akışta izlenme yoksa “yok” yazın, boş ortancadan sonuç üretmeyin.
5. Kurulum `botlar/skills/` altındaki skill'leri **Analist** profiline kopyalar. Başka çalışan için kendiniz kopyalayın:

   ```bash
   mkdir -p "$HERMES_HOME/profiles/stajyer/skills/rakip-tarama"
   cp botlar/skills/rakip-tarama/SKILL.md "$HERMES_HOME/profiles/stajyer/skills/rakip-tarama/"
   ```

`HERMES_HOME` tanımlı olmalıdır; Hostinger Hermes terminalinde `/opt/data` kullanılır.
Yöntemi değiştirdiğinizde sadece ismini değil adımlarını da güncelleyin. Skill bir erişim izni veya yeni araç kurulumunun yerini tutmaz.

## Godot dışı kod deposu

Dosya adı `oyunlar.json` olsa da web, servis ve mobil uygulama tanımlanabilir.
En küçük `oncelik` değerli proje geliştirilir. Diğerleri yalnız takip edilir.
`OFIS_REPO_AD=proje` için `kod.yerel_kopya` değeri `~/ofis/repo/proje` olmalıdır.
Depo ve deploy anahtarı kurulumu için [01](01-kurulum.md) adımlarını izleyin; Godot gerekmiyorsa `OFIS_GODOT=0` bırakın.

Aşağıdaki **temsili** `kod` blokları, ilgili test araçları ve betikleri gerçekten bulunan projeler içindir.
Bunlar her repoda çalışacağı vaat edilen komutlar değildir. Kilit dosyası, test aracı ve sürümleri önce kontrol edin.
`<kisa-ad>` kontrol betiğinizin gerçek adıyla değiştirilir. Komutlar `yerel_kopya` dizininde çalıştırılır.

### Node / TypeScript web uygulaması

Bu örnek npm kilit dosyası ve Vitest bulunan proje içindir:

```json
{
  "yerel_kopya": "~/ofis/repo/proje",
  "taban_dal": "main",
  "ofis_dali": "ofis/<kisa-ad>",
  "ilk_kurulum": "npm ci",
  "kontrol_betikleri": "tests/<kisa-ad>_kontrol.test.ts",
  "kontrol_komutu": "npx vitest run tests/<kisa-ad>_kontrol.test.ts",
  "hizli_test": "npx tsc -b && npm test -- --run && npm run build",
  "pr_baglanti": "https://github.com/KULLANICI/DEPO/compare/{taban_dal}...{ofis_dali}?expand=1",
  "is_listesi": "ortak/is-listesi.md"
}
```

### Python servisi

Bu örnek `requirements.txt` ve pytest bulunan proje içindir:

```json
{
  "yerel_kopya": "~/ofis/repo/proje",
  "taban_dal": "main",
  "ofis_dali": "ofis/<kisa-ad>",
  "ilk_kurulum": "python3 -m venv .venv && .venv/bin/pip install -r requirements.txt pytest",
  "kontrol_betikleri": "tests/test_<kisa-ad>_kontrol.py",
  "kontrol_komutu": ".venv/bin/python -m pytest tests/test_<kisa-ad>_kontrol.py -q",
  "hizli_test": ".venv/bin/python -m pytest -q",
  "pr_baglanti": "https://github.com/KULLANICI/DEPO/compare/{taban_dal}...{ofis_dali}?expand=1",
  "is_listesi": "ortak/is-listesi.md"
}
```

### Expo mobil uygulama

Bu örnek npm, TypeScript ve Jest kurulmuş proje içindir. Gerçek bundle alınır; cihaz davranışı ayrıca denenir:

```json
{
  "yerel_kopya": "~/ofis/repo/proje",
  "taban_dal": "main",
  "ofis_dali": "ofis/<kisa-ad>",
  "ilk_kurulum": "npm ci",
  "kontrol_betikleri": "tests/<kisa-ad>_kontrol.test.ts",
  "kontrol_komutu": "npx jest tests/<kisa-ad>_kontrol.test.ts --runInBand",
  "hizli_test": "npx tsc --noEmit && npx jest --runInBand && npx expo export",
  "pr_baglanti": "https://github.com/KULLANICI/DEPO/compare/{taban_dal}...{ofis_dali}?expand=1",
  "is_listesi": "ortak/is-listesi.md"
}
```

Proje TypeScript referansları kullanıyorsa `tsc --noEmit` yerine `tsc -b` seçin.
SDK, Node/Python ve test bağımlılıklarının kurulumunu siz doğrulayın; `kur.sh` bu araç zincirlerini kurmaz.
Gerçek kullanıcı yorumu bağlantılarını `oyunlar` kaydına ekleyin. Yoksa yorum taramasını kullanmayın, iş listesinden çalışın.

## Çalışanı kaldırma

1. Önce `hermes -p <profil> cron list --all` ile işleri belirleyin. Telegram'dan Müdür'e kimlikleriyle duraklatın;
   sürümünüzün kaldırma işlemi için ayrıntı: [Hermes belgesi](https://github.com/NousResearch/hermes-agent).
2. Profilin çalışan turu kalmadığını kontrol edin, çıktıları yedekleyin. Müdür yönlendirmesinden bu rolü çıkarın.
3. Ek çalışanın `botlar/<ad>/SOUL.md` ve varsa `ozel/botlar/<ad>/SOUL.md` kaynaklarını kurulumun taramayacağı
   yedek klasöre taşıyın. Yoksa `kur.sh` profili yeniden oluşturabilir.
4. Profil kaldırmayı Hermes'in kendi belgelenmiş yönetim yöntemiyle yapın. Profil klasörünü elle silmeyin.

Beş varsayılan çalışandan birini tümüyle çıkarmak `kur.sh` içindeki profil ve cron tanımlarını da uyarlamayı gerektirir.
Daha kolay seçenek profili tutup rutinlerini duraklatmaktır; ekran odası kalır.
Doktor beş varsayılanı denetler, bilerek kaldırdığınız iş veya dosyalar için uyarı beklenir.
