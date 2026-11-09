# 06: Sorun giderme

[Önceki: Senaryolar](05-senaryolar.md) · [Başlangıç](../README.md) · [Sonraki: Güvenlik](07-guvenlik.md)

İlk adım kapsayıcıda repo kökünden `bash kurulum/kontrol.sh` çalıştırmaktır.
Doktor yalnız okur. `ozel/ayar.sh` kabuk kodu çalıştırabileceği için doktor onu kaynak olarak yüklemez;
özel yollarınızı `OFIS_EV`, `HERMES_HOME`, `OFIS_DIZIN` ile ortamda verin.
`✓` kontrolün geçtiğini, `!` eksik veya isteğe bağlı ayarı, `✗` düzeltilmesi gereken hatayı gösterir.
Hata varsa çıkış kodu 1, yoksa 0 olur. Doktor girişin süresini veya model erişimini ücretli çağrıyla sınamaz.

## Hızlı tablo

| Belirti | Olası neden | Çözüm |
|---|---|---|
| `hermes` bulunamadı | VPS ana terminali veya yanlış PATH | Hermes kapsayıcı terminalini açın, [kurulumdaki kullanıcıya](01-kurulum.md) geçin. |
| Profil veya SOUL yok | Yanlış kullanıcı, yanlış `HERMES_HOME`, yarım kurulum | Ortamı doğrulayın, yedeğinizden sonra `bash kurulum/kur.sh` çalıştırın. |
| Git klonlayamıyor | Deploy anahtarı eklenmemiş veya depo adresi hatalı | Açık anahtarı yalnız ilgili depoya ekleyin; `OFIS_REPO` adresini kontrol edin. |
| Yeni çalışan eklenemiyor | Repo Hermes kullanıcısı için yazılabilir değil veya profil zaten var | Sahipliği kontrol edin; mevcut profilin üzerine ekleme betiğiyle yazmayın. |
| Çıktı dosyası var, kart yok | Yanlış klasör, ara JSON/CSV dosyası veya ek çalışan | Tarihli Markdown yazdırın; [beş çalışan sınırını](04-uyarlama.md) kontrol edin. |
| Ekran hep temsili işler gösteriyor | `--uzak` olmadan demo açılmış | SSH hedefiyle yeniden başlatın; canlı görevin dosyasını kontrol edin. |
| Ekranda veri gelmiyor | SSH, Docker yetkisi, kapsayıcı adı veya sabit yol | `--kapsayici` seçin; uzak yolların `/opt/data` düzeninde olduğunu doğrulayın. |
| Tekrar kurulum öğrenimleri geri aldı | `ozel/ortak/` kaynağı canlı dosyadan eski | Canlı veri yedeğini geri alın, özel kaynağı da güncelleyin. |

## Claude Code: “Not logged in”

Hermes cron ve çalışan oturumları Hostinger şablonunda `HOME=/opt/data/home` ile açılır.
Manuel giriş `HOME=/opt/data` iken yapıldıysa Claude girişi `/opt/data/.claude` ve `.claude.json` altında kalır.
Böylece terminalde çalışan Claude, rutin içinden girişsiz görünebilir.

`kur.sh` araç adımında, `/opt/data/home` varsa ve kuran kullanıcının HOME'u farklıysa, iki yolu o HOME'a sembolik bağlar.
Önceden gerçek dosya/klasör varsa `.eski` ekiyle taşır; bu nedenle farklı bir giriş zaten varsa önce yedekleyin.
`OFIS_ARACSIZ` ile kurulum yaptıysanız bu bağlantı adımı da atlanır.

Elle çözüm, yalnız **Hermes kullanıcısının HOME'u `/opt/data` ise** uygulanır. Root'ta giriş yapmayın.
Önce `ls -ld /opt/data/home/.claude /opt/data/home/.claude.json` ile hedefleri inceleyin.
Gerçek dosya veya klasör bulunuyorsa güvenli bir adla yedeklemeden aşağıdaki komutu çalıştırmayın:

```bash
ln -sfn /opt/data/.claude /opt/data/home/.claude
ln -sfn /opt/data/.claude.json /opt/data/home/.claude.json
claude
bash kurulum/kontrol.sh
```

`ln` yalnız hedef boşsa veya doğru sembolik bağ zaten varsa kullanılmalıdır. Giriş bilgisinin içeriğini göstermeyin.
Giriş komutunu önce kurulum rehberindeki kullanıcı ortamında çalıştırın.
Rutin, eksik npm kopyasına gidiyorsa gerçek Claude yolu `/opt/data/.local/bin/claude` olmalıdır;
`yukselt.py` bu yerel kurulumu önce arar. Farklı sunucuda yolları uyarlayın.

## Hermes paneli (`hstgr.cloud`) açılmıyor

Bazı ülke veya ağlarda bu adreslere erişim sorunlu olabilir. Önce farklı bir ağ, VPN veya WARP ile deneyin.
Bu durum tek başına Hermes'in çalışmadığı anlamına gelmez.

Alternatif: kendi bilgisayarınızdan SSH tüneli açın. Panelin sunucuda hangi **host portuna** yayınlandığını
hPanel'deki kapsayıcı ağ ayarından öğrenin. Aşağıdaki `PANEL_PORTU` ve diğer büyük harfli alanlar yer tutucudur:

```bash
ssh -N -L 8799:127.0.0.1:PANEL_PORTU KULLANICI@SUNUCU_IP
```

Komutu açık tutun, tarayıcıda `http://localhost:8799` adresini deneyin. Panel HTTPS kullanıyorsa şemayı ona göre seçin;
alan adına bağlı yönlendirme varsa şablonun ağ ayarını kontrol edin. Host portu yayınlanmıyorsa bu tünel tek başına yetmez.
Port numarası tahmin etmeyin. `8799` yalnız bilgisayarınızdaki boş yerel port örneğidir.

## Panel portu internete açık

Önce SSH bağlantınızın ve tünelin çalıştığını doğrulayın.
Sonra Hostinger hPanel'de güvenlik duvarı benzeri bölümden panelin host portuna dış erişimi kapatın;
SSH erişiminizi engellemeyin. Docker port yayınlarını da kontrol edin. Kuraldan sonra dış ağdan erişimin kapandığını,
tünelden ise panelin açıldığını doğrulayın. Kesin bölüm ve düğme adları şablona göre değişebilir.
Ofisin yerel ekranı `127.0.0.1` üzerinde açılır, bunun için herkese açık panel portu gerekmez.

## Claude aboneliğini Hermes'e bağlamak ücretsiz mi?

Hayır. [Hermes sağlayıcı belgesine](https://hermes-agent.nousresearch.com/docs/integrations/providers) göre
Anthropic OAuth yolu yalnız **Claude Max ve satın alınmış ek kullanım kredisiyle** çalışır.
Hermes kullanımı temel Max kotasını değil, ek kullanım kredisini tüketir. Pro bu OAuth yolu için yeterli değildir.
API anahtarıyla kullanım ayrıca API olarak ücretlendirilir. Koşulları bağlamadan önce kontrol edin.

Kod işleri için sunucuya ayrıca Claude Code kurulabilir ve `claude` ile kendi hesabınızın desteklediği giriş yapılabilir.
Bu repo Hermes profil modeliyle Claude Code'u ayrı çağırır; iki yolun kota ve ücret koşullarını aynı sanmayın.

## X araması yok

Hermes'in X aracı ek abonelik veya xAI anahtarı isteyebilir. Mevcut planınızın yeterli olduğunu varsaymayın;
[Hermes sağlayıcı belgesinden](https://hermes-agent.nousresearch.com/docs/integrations/providers) erişim yolunu kontrol edin.

Gündem'in [SOUL dosyasındaki](../botlar/gundem/SOUL.md) yedek yol resmi şirket blog ve haber sayfalarıdır.
Görülmeyen X gönderisi görülmüş gibi raporlanmaz. Rutin radarda bilinen X eksikliği için her tur ücretli yükseltme açılmaz;
yedek yol kullanılır, eksik en altta tek satır belirtilir.

## Site 403 veriyor veya boş açılıyor

Bazı siteler VPS IP'sini engeller; giriş veya etkileşimli doğrulama da isteyebilir.
Önce SOUL'daki yedek resmi kaynak denenir. Özel bir işte bu da olmazsa çalışan
`~/ofis/yukselt/` içine görev, denenen yol, hata ve elde olan veriyi yazar.
`yukselt.py` notu Claude Code'a aktarır; başka kaynak veya yöntem denenir. Başarı garantisi yoktur.

Claude Code da çözemezse görev kapsamını daraltın, erişebildiğiniz herkese açık alternatif kaynağı verin veya
kendi indirdiğiniz, paylaşmaya yetkili olduğunuz veriyi dosya olarak sağlayın. Şifre vermeyin, erişim engelini atlatmasını istemeyin.
Tekrar tekrar aynı yükseltmeyi açmak yerine eksik olan erişimi netleştirin.
`yukselt/bitti/` içindeki `.kod` çıkış sonucunu ve `.out` kaydını inceleyin; özel bilgileri paylaşmadan önce ayıklayın.

## Rutin çalışmıyor veya saati yanlış

```bash
hermes -p gundem cron list --all
```

Doğru profil ve iş kimliği üzerinden etkinlik durumunu, saati, son/sonraki çalışmayı inceleyin.
`kur.sh` içindeki `TZ_OFIS=Europe/Istanbul` oluşturulan işlere `--timezone` ile verilir.
Cron zamanını değiştirmek için [03](03-kullanim.md) adımlarını uygulayın.
Mevcut işlerin saatini yeniden `kur.sh` çalıştırmak değiştirmez. `rutinler.md` bir açıklamadır, cron kaynağı değildir.

Hermes'in zamanlayıcısının sürekli çalışması ve kapsayıcının açık kalması gerekir.
Hizmet yönetimi bu betiğin işi değildir; ayrıntı: [Hermes belgesi](https://github.com/NousResearch/hermes-agent).
B yolu kurulumda Python betiklerinin de doğru `OFIS_DIZIN` ve `HERMES_HOME` ortamını aldığına bakın.

## Telegram'a mesaj gelmiyor

1. Panelde Channels > Telegram benzeri bölümde bağlantıyı kontrol edin. Botunuza ilk mesajı gönderip yanıt bekleyin.
2. Müdür **ana profil `default`** olmalıdır. Ayrı `mudur` profili açmayın.
3. `hermes -p default cron list --all` ile ilgili işin teslimini inceleyin. Plan, brifing, iletim ve yükseltme
   `telegram`, kayıt `local` teslimiyle kurulur. Diğer raporların çoğu yereldir.
4. `~/ofis/ilet/` içinde Markdown var mı bakın. `ilet.py` çıktıyı Hermes'e verir, dosyayı `gonderildi/` altına taşır.
   Dosyanın taşınması Telegram'ın kesin teslim kanıtı değildir; kanal hatalarını da kontrol edin.

Müdür SOUL'undaki son yazılan kanal ifadesine rağmen kurulumdaki bu cron teslimleri **Telegram'a sabittir**.
Bu rehber WhatsApp kurulumunu yapmaz. Teslim hedefini değiştirmek için kurulu sürümün Hermes belgesini izleyin.

## Model limiti doldu

Önce hangi sağlayıcıda ve hangi profilde olduğunu belirleyin. Aynı hatayı tekrar tekrar çalıştırmayın.
Gündem ve Stajyer için erişebildiğiniz daha ekonomik modeli `OFIS_UCUZ_MODEL` olarak seçin;
sonraki kurulumda bu değer kullanılır. Canlı değişim için [profil modelini](03-kullanim.md) ayarlayın.
Rutinleri seyrekleştirin veya gereksiz işleri duraklatın. Daha ucuz model, bitmiş sağlayıcı kotasını kendiliğinden yenilemez.
Yükseltmeler ayrıca Claude Code tüketir; `YUKSELT_SURE` ve kapsamını da gözden geçirin.
