# 01: Kurulum

[Başlangıç](../README.md) · [Sonraki: İlk gün](02-ilk-gun.md)

## Neye ihtiyacınız var

- [ ] Sürekli açık bir Linux sunucu veya kalıcı veri diski olan Docker kapsayıcısı.
- [ ] Kurulu Hermes Agent. Bu repo Hermes'i kurmaz, çalışanları ve rutinleri ekler.
- [ ] Bash 4+, Python 3.10+, Git ve internet erişimi. SSH ile izleme için kendi bilgisayarınızda da Git, Python ve SSH.
- [ ] Hermes'in kullanabildiği model sağlayıcısı ve erişiminiz olan model adları. Abonelik veya API kullanımı sağlayıcının koşullarına tabidir.
- [ ] Telegram hesabı ve size ait bir bot jetonu.
- [ ] İsteğe bağlı Claude Code erişimi: kod düzeltme ve yükseltme için.
- [ ] İsteğe bağlı size ait kod deposu ve o deponun ayarlarına erişim.

Ücretli hizmetleri kendi hesabınızdan alırsınız. Repo için lisans bedeli yoktur; VPS ve model kullanımı ücretsiz sayılmaz.
Güvenlik adımları için [07: Güvenlik](07-guvenlik.md) dosyasını da okuyun.

## A yolu: Hostinger VPS

### 1. VPS ve Hermes şablonunu seçin

[Hermes Agent VPS sayfasını](https://www.hostinger.com/vps/docker/hermes-agent) açın.
Hermes Agent tek tık Docker şablonunu seçin. En az KVM 2 (2 vCPU, 8 GB RAM) önerilir.
Satın alma ve hesap adımlarını tamamlayın. Şablonun kurulumunu bekleyin.

**Doğru gittiğini nasıl anlarsınız:** hPanel'de VPS > Docker Yöneticisi benzeri bölümde
`hermes-agent` kapsayıcısı “Çalışıyor” görünür. Buradaki şablon Hermes'i, aşağıdaki betik ise ofisi kurar.

### 2. Hermes panelini ve terminali açın

Docker Yöneticisi'nden Hermes panelini (web arayüzü) açın. Giriş bilgisini hPanel verir.
Aynı kapsayıcının terminalini hPanel'den ya da SSH üzerinden açın.
VPS'in ana terminaliyle kapsayıcı terminali farklıdır; komutları kapsayıcının içinde çalıştırın.

Terminal root açıldıysa, model girişini ve klonlamayı Hermes kullanıcısıyla yapın:

```bash
runuser -u hermes -- env HOME=/opt/data HERMES_HOME=/opt/data PATH=/opt/data/.local/bin:/opt/hermes/.venv/bin:/opt/hermes/bin:/usr/local/bin:/usr/bin:/bin bash
```

Zaten `hermes` kullanıcısındaysanız bunu tekrar çalıştırmayın. `whoami` ve `echo "$HOME"` ile kontrol edin.

**Doğru gittiğini nasıl anlarsınız:** panel açılır; terminalde `whoami` sonucu `hermes`, ev yolu `/opt/data` olur.
Panel açılmıyorsa [ağ ve tünel çözümlerine](06-sorun-giderme.md) geçin.

### 3. Model sağlayıcısını bağlayın

Aynı terminalde:

```bash
hermes model
```

Erişiminize göre ChatGPT/Codex aboneliğiyle OAuth ya da API anahtarı/OpenRouter yolunu seçin.
Sağlayıcının giriş adımlarını tamamlayın. Bu seçimi yapmadan profil klonlamayın.
Varsayılan betik modelleri `gpt-6.1-sol` ve `gpt-6-luna`; sağlayıcınızda bunlar yoksa erişebildiğiniz modelleri
`OFIS_GUCLU_MODEL` ve `OFIS_UCUZ_MODEL` ile değiştirin. Müdür ana profilin mevcut modelini korur.

```bash
hermes -p default config get model.default
```

**Doğru gittiğini nasıl anlarsınız:** model adı okunur ve Hermes panelinde kısa bir deneme mesajına cevap gelir.
Yalnız model adını görmek erişimin çalıştığını kanıtlamaz. Claude aboneliğini Hermes'e bağlamanın
[ayrı ücret koşullarını](06-sorun-giderme.md) okuyun.

### 4. Telegram'ı bağlayın

Telegram'da @BotFather'a `/newbot` yazın, bot oluşturma adımlarını izleyin ve jetonu alın.
Hermes panelinde Channels > Telegram benzeri bölümde bot jetonunu girin, bağlantıyı tamamlayın.
Jetonu ortak dosyalara veya bu repoya yazmayın. Botunuza Telegram'dan ilk mesajınızı gönderin.

**Doğru gittiğini nasıl anlarsınız:** bot yanıt verir. Sonraki kurulum ana profili Müdür yapar;
ayrı bir `mudur` profili oluşturmayın. Kanal ve teslim sorunları için [06](06-sorun-giderme.md).

### 5. Repoyu kapsayıcıya indirin ve kişiselleştirin

Hermes kullanıcısının terminalinde:

```bash
git clone https://github.com/UgurKeskekci/yapay-zeka-ofisi /opt/data/ofis-kurulum
cd /opt/data/ofis-kurulum
mkdir -p ozel/ortak
cp botlar/ortak/* ozel/ortak/
```

`ozel/ortak/` içindeki dosyaları terminaldeki bir metin düzenleyiciyle doldurun:

| Dosya | Ne yazacaksınız |
|---|---|
| `sahip.md` | İşiniz, hitap, dil ve içerik yaklaşımınız. Deniz kurgusal örnektir. |
| `rakipler.json` | Kendi kanalınız ve takip edeceğiniz kanalların doğrulanmış kimlikleri. |
| `oyunlar.json` | Gerçek projeniz ve varsa kod komutları. Projeniz yoksa `oyunlar` listesini boşaltın. |
| `fiyat-takip.json` | Tam ürün modeli, bağlantılar ve sizin hedefiniz. Kullanmayacaksanız `urunler: []`. |
| `sosyal.md` | Hesap, format, hitap. Kullanılmayan alanlara “kullanılmıyor” yazın. |
| `is-listesi.md` | Gerçek ve küçük bir ilk iş. Örnek hatayı gerçek iş diye bırakmayın. |
| `tercihler.md` | İlk çalışma kurallarınız. Güvenlik kurallarını gevşetmeyin. |
| `x-hesaplar.json` | İzlemek istediğiniz resmi kaynakları kontrol edin. |

İçerik üreticisi değilseniz [hazır senaryolardan](05-senaryolar.md) birini kullanın.
Örneklerde boş URL ve kimlikler bilerek bırakılmıştır; bunları doldurmadan veri gelmez.

**Doğru gittiğini nasıl anlarsınız:** `pwd` sonucu `/opt/data/ofis-kurulum` olur.
Ortak dosyalarda kullanacağınız alanlar doldurulmuştur. `ozel/` Git tarafından dışlanır.

### 6. Ofisi kurun

```bash
bash kurulum/kur.sh
bash kurulum/kontrol.sh
```

Betik profilleri, SOUL dosyalarını, ortak dosyaları ve zamanlı işleri oluşturur. Claude Code'u kurmayı dener;
Godot varsayılan olarak kurulmaz. Araç indirmesini atlamak için `OFIS_ARACSIZ=1 bash kurulum/kur.sh` kullanabilirsiniz.
Model adlarını değiştirecekseniz bu komuttan önce ortamda tanımlayın veya `ozel/ayar.sh` içine yazın.

**Doğru gittiğini nasıl anlarsınız:** beş profil görünür: ana profil `default` (Müdür), `gundem`, `analist`,
`oyun`, `stajyer`. Doktorun hatalarını çözün. Yer tutucu ve isteğe bağlı Claude uyarılarını ihtiyacınıza göre değerlendirin.
Doktor model çağrısı yapmaz; gerçek erişim için Telegram'dan küçük bir görev de verin.

### 7. İsteğe bağlı Claude Code girişi

Aynı Hermes kullanıcısı ve `HOME=/opt/data` ile:

```bash
claude
```

Kendi hesabınızla giriş yapın. Giriş kodunu ve hesabınızı repoya koymayın.
`kur.sh`, Hostinger şablonunda `/opt/data/home/.claude` ve `.claude.json` yollarını bu evdeki girişe bağlar.
Root olarak giriş yaptıysanız çalışanlar o girişi görmez. [Elle düzeltme](06-sorun-giderme.md).

**Doğru gittiğini nasıl anlarsınız:** Claude Code küçük bir isteğe yanıt verir, doktor bağlantıları görür.
Claude Code kullanmayacaksanız kod işi ve yükseltme beklemeyin; diğer araştırma işleri devam eder.

### 8. İsteğe bağlı kod deposu

`ozel/ayar.sh` dosyasını oluşturun. Aşağıdaki adres yer tutucudur:

```bash
OFIS_REPO="git@github.com:KULLANICI/DEPO.git"
OFIS_REPO_AD="proje"
OFIS_GODOT=0
```

Ardından:

```bash
bash kurulum/kur.sh
```

Gösterilen **açık** anahtarı yalnız kendi deponuzun Settings > Deploy keys benzeri bölümüne yazma izniyle ekleyin.
Özel anahtarı kopyalamayın. Sonra:

```bash
bash kurulum/kur.sh repo
```

`oyunlar.json` içindeki `kod.yerel_kopya`, oluşan `~/ofis/repo/proje` yoluyla aynı olmalıdır.
Gerçek kontrol komutları için [04: Uyarlama](04-uyarlama.md) dosyasına bakın.

**Doğru gittiğini nasıl anlarsınız:** depo klonlanır ve `.git/hooks/pre-push` oluşur.
Kanca yalnız `ofis/` dallarına gönderim kabul eder; [bu korumanın sınırını](07-guvenlik.md) okuyun.

### 9. Ofis ekranını kendi bilgisayarınızda açın

Bu komutlar VPS'te değil, kendi bilgisayarınızın terminalinde çalışır:

```bash
git clone https://github.com/UgurKeskekci/yapay-zeka-ofisi
cd yapay-zeka-ofisi
python3 arayuz/sunucu.py --uzak root@SUNUCU_IP --anahtar ~/.ssh/ANAHTARINIZ
```

`SUNUCU_IP` ve `ANAHTARINIZ` değerlerini değiştirin. SSH kullanıcınızın uzak sunucuda Docker çalıştırma yetkisi gerekir.
Birden çok Hermes kapsayıcısı varsa `--kapsayici KAPSAYICI_ADI` ekleyin.
Tarayıcıda `http://localhost:8790/ofis/` açın. `/pano/` çıktılar, `/telefon/` telefon görünümüdür.
`--uzak` vermeden çalıştırırsanız temsili verili demo açılır; bu bir canlı bağlantı testi değildir.

**Doğru gittiğini nasıl anlarsınız:** Telegram'dan verdiğiniz işin dosyası ilgili çalışanın altında görünür.
Canlı bağlantı SSH üzerinden yalnız okur; ofis için VPS'te yeni web portu açılmaz.

## B yolu: Hermes zaten başka Linux sunucuda veya Docker'da kurulu

1. Hermes'in çalıştığı **aynı kullanıcıyla**, aynı kapsayıcı içinde terminal açın. `hermes model` ile erişimi deneyin.
   **Doğru gittiğini nasıl anlarsınız:** ana profil model adı okunur, küçük mesaja cevap gelir.
2. Repoyu kullanıcının yazabildiği bir klasöre klonlayın, A yolunun ortak dosya adımlarını uygulayın.
   **Doğru gittiğini nasıl anlarsınız:** repo ve `ozel/` dosyalarını o kullanıcı düzenleyebilir.
3. Yolları açıkça tanımlayın. Aşağıdaki örnek mevcut kullanıcı içindir:

   ```bash
   export HERMES_HOME="$HOME/.hermes"
   export OFIS_DIZIN="$HOME/ofis"
   bash kurulum/kur.sh
   bash kurulum/kontrol.sh
   ```

   **Doğru gittiğini nasıl anlarsınız:** SOUL dosyaları gerçek Hermes profil dizininize, veriler `OFIS_DIZIN` altına gider.
4. Kanalı, cron hizmetini ve kalıcı diskleri Hermes kurulumunuzun belgelerine göre ayarlayın.
   **Doğru gittiğini nasıl anlarsınız:** terminali kapattıktan sonra zamanlı iş çıktı üretir; kapsayıcı yeniden başlayınca veriler durur.
5. Önce [ilk gün görevini](02-ilk-gun.md) deneyin. **Doğru gittiğini nasıl anlarsınız:** rapor doğru dizine yazılır.

| Değişken / yol | Neyi değiştirir |
|---|---|
| `OFIS_EV` | Yalnız root'tan `hermes` kullanıcısına geçişte HOME. Varsayılan `/opt/data`; normal kullanıcıda kendi HOME'unuzu kullanın. |
| `HERMES_HOME` | Hermes yapılandırması ve profilleri. Root geçişinde `/opt/data`, normal kullanıcıda `$HOME/.hermes`. |
| `OFIS_DIZIN` | Ofis verileri. Kurulumda `$HOME/ofis`; Python betiklerinde önce bu değer, yoksa mevcut `/opt/data/ofis`, sonra `~/ofis`. |
| Claude Code yolu | El kitabı ve Oyun SOUL'undaki `/opt/data/.local/bin/claude` yolunu kendi kurulumunuza uyarlayın. |
| Canlı ekran | `sunucu.py --uzak` Docker ve `/opt/data/ofis-kurulum`, `/opt/data/ofis` yollarını kullanır. Farklı yolları `Uzak` sınıfında uyarlayın; doğrudan Linux kurulumu otomatik desteklenmez. |

Standart dışı `OFIS_DIZIN` ve `HERMES_HOME` değerlerini Hermes'in sürekli çalışan hizmet ortamına da taşıyın;
yalnız terminalde `export` etmek cron hizmetinin ortamını değiştirmez. Betiklerdeki `~/ofis` örneklerini gerçek dizininize
göre yorumlayın; SOUL başlığı bunu belirtir. `ozel/ayar.sh` yalnız kurulum sırasında okunur, Hermes hizmetinin ayarı değildir.
Ayrıntı: [Hermes belgesi](https://github.com/NousResearch/hermes-agent).

## Tekrar kurulum ve güncelleme

Önce `ozel/` kaynaklarınızı ve ofis verilerini yedekleyin. Repo güncelledikten sonra `bash kurulum/kur.sh` çalıştırabilirsiniz.
Mevcut profiller ve aynı adlı rutinler çoğaltılmaz. SOUL ve kurulum dosyaları yenilenir;
`tercihler.md`, `is-listesi.md`, `fiyat-takip.json`, `sahip.md`, `sosyal.md` mevcutsa korunur.
Diğer ortak örnekler yeniden kopyalanır. `ozel/ortak/` her zaman en son uygulanır.

Bu yüzden çalışanların canlı dosyada öğrendiği tercihleri ve eklediği ürünleri tekrar kurulumdan önce kendi
`ozel/ortak/` kaynağınıza da alın; eski kaynakla yeni öğrenimleri ezmeyin.
`ozel/botlar/<ad>/SOUL.md` varsa rol için o kullanılır. İlk eski profil SOUL'u `.ilk` ekiyle saklanır.
Varsayılan çalışan modelleri yeniden ayarlanır; ek çalışanların mevcut modelleri korunur.
Mevcut rutinlerin saati ve istemi değişmez. `rutinler.md` dosyasını değiştirmek tek başına cron ayarı değildir.
