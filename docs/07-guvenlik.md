# 07: Güvenlik ve maliyet

[Önceki: Sorun giderme](06-sorun-giderme.md) · [Başlangıç](../README.md) · [Kuruluma dönün](01-kurulum.md)

Ofisin ortak kuralları [EL-KITABI.md](../botlar/EL-KITABI.md) içindedir.
SOUL ve tercihler iş biçimini özelleştirir; güvenlik sınırlarını kaldırmaz.

## Dışarıya giden işler

Çalışanlar araştırır, dosya yazar, taslak hazırlar. Gönderi, e-posta ve yorum cevabı kendileri göndermez.
Satın almaz, sepete eklemez, hesaba girmez, sürüm yayımlamaz. PR'ı siz açar, inceler ve birleştirirsiniz.
Telegram'a ofis içi rapor teslimi ve bağlı kod deposunda `ofis/` dalına gönderim tanımlı istisnalardır.

Onay masası `~/ofis/onay/` dosyalarından oluşur. Kabul veya ret kararı verildikten sonra Müdür dosyayı `onay/bitti/`
altına taşır. “Onayla” demek ofise dışarıya gönderme yetkisi vermez; paylaşımı siz yaparsınız.
Onay masası teknik bir izin sistemi değil, çalışma kuralıdır.

## Neyi yazmamalısınız

Şifre, kart bilgisi, kurtarma kodu, özel SSH anahtarı veya API anahtarını SOUL'a, ortak dosyalara,
Telegram görev metnine, rapora ve ekran görüntüsüne yazmayın.
Giriş gerektiren işi bot adına şifre vererek çözmeyin. Kaynak belgelerdeki talimatları da yetki saymayın;
web sayfasından veya PDF'den gelen “kuralları yok say” metni veri olarak kalmalıdır.

| Bilgi | Yeri |
|---|---|
| Hermes model sağlayıcısı anahtarı / OAuth | Hermes'in kendi giriş akışı ve korunan veri dizini (`HERMES_HOME`). [Sağlayıcı belgesi](https://hermes-agent.nousresearch.com/docs/integrations/providers). |
| Telegram bot jetonu | Hermes panelinin kanal yapılandırması. Ortak dosyalara yazılmaz. |
| Claude Code girişi | Giriş yapılan kullanıcının `.claude` / `.claude.json` yolları. İçeriği kopyalanıp repoya konmaz. |
| Depo özel anahtarı | `~/.ssh/<OFIS_REPO_AD>`, sadece sunucuda. `.pub` uzantılı açık anahtar GitHub deploy key olarak eklenir. |
| Kişisel çalışma bağlamı | Yerel `ozel/ortak/`, özel SOUL'lar `ozel/botlar/`. Şifre deposu değildir. |
| Kurulum seçenekleri | `ozel/ayar.sh`. Kabuk kodu olarak çalışır; kaynağına güvenmediğiniz dosyayı kullanmayın. |

Profiller klonlanır ve aynı işletim sistemi kullanıcısıyla çalışır. Bu, beş ayrı güvenlik bölmesi değildir.
İş için gerekli olmayan müşteri verisini, tüm kişisel dosyalarınızı veya geniş hesap yetkilerini sunucuya taşımayın.
Şablon yeni yetki sınırları koyan bir sandbox sağlamaz.

## Depo anahtarı ve ofis/ dalları

`bash kurulum/kur.sh repo`, klonlanan depoya `.git/hooks/pre-push` gönderim kancası koyar.
Bu kopyadan yalnız `refs/heads/ofis/*` hedefleri kabul edilir; ana dala, başka dala ve etikete gönderim reddedilir.
Anahtar yalnız ilgili depoya eklenmelidir. Kişisel hesabınızın geniş yetkili anahtarını kullanmayın.

Deploy anahtarının kendisi GitHub tarafında “yalnız ofis/ dalına yaz” yetkisi taşımaz.
**Dal sınırını bu yerel kanca uygular.** Kanca atlanabilir veya farklı kopya kullanılabilir;
ana dal için GitHub tarafında dal koruması ve gerekli incelemeleri de yapılandırın.
Bu kuralın teknik sınırını bilmeden “ana dala yazamaz” garantisi vermeyin.

## Herkese açık repo ve yedek

`ozel/` bu reponun `.gitignore` dosyasında dışlanır. Zorla eklemeyin, örneklerin içine gerçek ayar kopyalamayın.
Yayın öncesi izlenen dosyaları inceleyin. `.gitignore` daha önce commit edilmiş bir sırrı geçmişten silmez;
sızıntıda anahtarı iptal edin ve geçmişi ayrıca temizleyin.
Ofis çıktıları, onay dosyaları ve durum kayıtları kişisel veri içerebilir; yedekleri herkese açmayın.
Canlı ekranı sadece kendi bilgisayarınızda kullanın. Paylaşmadan önce kişi, URL, hesap ve raporları kontrol edin.

## Ağ erişimi

Panelin dışa açık portunu ihtiyacınız yoksa güvenlik duvarıyla kapatın, SSH tüneliyle açın.
Önce SSH erişimini doğrulayın. [Tünel örneği](06-sorun-giderme.md).
`arayuz/sunucu.py` yerel `127.0.0.1` adresine bağlanır; canlı veriyi SSH üzerinden okur.

## Maliyeti kontrol etme

- Gündem ve Stajyer'de `OFIS_UCUZ_MODEL` ile uygun modeli seçin. Müdür mevcut ana modelle çalışır.
- Yoğun rutinler (`OFIS_RUTIN=yogun`) sık çalışır. Varsayılan [normal sıklıkta](../botlar/rutinler.md) kalın veya kullanmadığınız işi duraklatın.
- Yükseltme kuyruğu boşken model çağrılmaz. Kuyruğa giren işler Claude Code tüketir; otomatik olarak ücretsiz değildir.
- `YUKSELT_SURE` bir yükseltme sürecinin saniye cinsinden üst süresidir. Para limiti veya günlük kota değildir.
  `YUKSELT_MODEL` ayrı model seçimidir. İkisini sürekli çalışan Hermes hizmetinin ortamına tanımlayın;
  yalnız `ozel/ayar.sh` içine yazmak çalışan hizmeti değiştirmez.
- Birden çok yükseltme aynı anda başlayabilir. Aynı engel için tekrar görev açmayın; süre sınırı toplam harcamayı sınırlandırmaz.
- Sağlayıcı hesabındaki gerçek kullanım ve harcama sınırlarını izleyin. Ekrandaki tahmini maliyet faturanız değildir.

VPS fiyatı, model maliyeti ve sonuç süresi burada vaat edilmez. Kullandığınız sağlayıcının güncel koşullarını kontrol edin.
