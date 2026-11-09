// ÖRNEK VERİ: arayüz için temsili akış. Tüm olaylar, ölçümler ve maliyetler örnektir.
// Gerçek sistemde aynı biçim Hermes eklentisinin /durum ucundan gelir (eklenti/).
// Çıktı dosyaları /ciktilar/ altından sunulur (yerelde arayuz/ornek-ciktilar/).
(function () {
  const BOTLAR = [
    { id: "mudur",   ad: "Müdür",         rol: "Onay masası ve brifing",       model: "GPT 6.1 Sol", renk: "#e8b04a", cinsiyet: "erkek", sac: "#2b2118", ten: "#e2b48c" },
    { id: "gundem",  ad: "Gündem",        rol: "X'te yeni model radarı",       model: "GPT 6 Luna",  renk: "#5aa9e6", cinsiyet: "kadin", sac: "#7a3b1d", ten: "#f0c9a5" },
    { id: "analist", ad: "Analist",       rol: "Kanal ve rakip analizi",       model: "GPT 6.1 Sol",       renk: "#7bc67b", cinsiyet: "kadin", sac: "#1c1c22", ten: "#c98f63" },
    { id: "oyun",    ad: "Oyun Stüdyosu", rol: "Oyun projesi: hata, test, PR'a hazır dal", model: "Claude Code", renk: "#e07a5f", cinsiyet: "erkek", sac: "#5a3a22", ten: "#d9a77e" },
    { id: "stajyer", ad: "Stajyer",       rol: "Fiyat takibi (deney: ucuz model)", model: "GPT 6 Luna", renk: "#b39ddb", cinsiyet: "erkek", sac: "#c9a24a", ten: "#f1cfae" },
  ];

  const C = "/ciktilar/";
  // Ofis açıldığında masada duran eski çıktılar (dünden)
  const ESKI = {};

  // Senaryo: sırayla oynatılan olaylar. sure = saniye.
  // eylem: yaziyor | okuyor | geziyor | calistiriyor | devrediyor | dusunuyor | kurguluyor | onay
  // adimlar: o anki işin adımları; adim: kaçıncı adımda olduğu.
  // cikti: işin sonunda masaya bırakılan dosya. kurgu: video kurgusunun ilerlemesi (0-100).
  const SENARYO = [
    { bot: "mudur", eylem: "dusunuyor", is: "Günün planını çıkarıyor", sure: 4, adimlar: ["Dünkü raporları oku", "İşleri dağıt", "Patrona planı yaz"], adim: 0 },
    { bot: "mudur", eylem: "devrediyor", is: "İşleri odalara dağıtıyor", sure: 3, teslim: ["gundem", "analist", "oyun", "stajyer"], adimlar: ["Dünkü raporları oku", "İşleri dağıt", "Patrona planı yaz"], adim: 1 },
    { bot: "gundem", eylem: "geziyor", is: "X'te resmi model hesaplarını tarıyor", sure: 5, adimlar: ["X'i tara", "Duyuruyu doğrula", "Müdür'e ilet"], adim: 0 },
    { bot: "analist", eylem: "geziyor", is: "Örnek kanalların YouTube akışını indiriyor", sure: 5, adimlar: ["Akışları indir", "Ortancayı hesapla", "Patlayanları bul", "Öneriyi yaz"], adim: 0 },
    { bot: "oyun", eylem: "okuyor", is: "Örnek Oyun yorumlarına ve iş listesine bakıyor", sure: 4, adimlar: ["İşi seç", "Betikle üret", "Claude Code düzeltsin", "Simülasyon", "Taslak PR"], adim: 0 },
    { bot: "stajyer", eylem: "okuyor", is: "SSD fiyatını okuyor (skill yok)", sure: 5, adimlar: ["Fiyatları oku", "Geçmişle karşılaştır", "Raporu yaz"], adim: 0 },
    { bot: "oyun", eylem: "calistiriyor", is: "Hatayı kontrol betiğiyle yeniden üretti", sure: 3, adimlar: ["İşi seç", "Betikle üret", "Claude Code düzeltsin", "Simülasyon", "Taslak PR"], adim: 1 },
    { bot: "analist", eylem: "calistiriyor", is: "Kanal ortancalarını hesaplıyor", sure: 4, adimlar: ["Akışları indir", "Ortancayı hesapla", "Patlayanları bul", "Öneriyi yaz"], adim: 1 },
    { bot: "oyun", eylem: "calistiriyor", is: "Claude Code düzeltmeyi yazıyor (ofis/ dalı)", sure: 3, adimlar: ["İşi seç", "Betikle üret", "Claude Code düzeltsin", "Simülasyon", "Taslak PR"], adim: 2 },
    { bot: "gundem", eylem: "okuyor", is: "Yeni model duyurusunu resmi sayfadan doğruluyor", sure: 4, adimlar: ["X'i tara", "Duyuruyu doğrula", "Müdür'e ilet"], adim: 1 },
    { bot: "oyun", eylem: "calistiriyor", is: "Claude Code iki dosyayı düzenledi", sure: 3, adimlar: ["İşi seç", "Betikle üret", "Claude Code düzeltsin", "Simülasyon", "Taslak PR"], adim: 2 },
    { bot: "gundem", eylem: "devrediyor", is: "Yeni model duyurusunu Müdür'e iletti", sure: 2, teslim: ["mudur"], adimlar: ["X'i tara", "Duyuruyu doğrula", "Müdür'e ilet"], adim: 2, cikti: { tur: "metin", baslik: "Yeni model duyurusu", yol: C + "gundem/yeni-model.md" } },
    { bot: "analist", eylem: "yaziyor", is: "Patlayan videoları sıralıyor", sure: 3, adimlar: ["Akışları indir", "Ortancayı hesapla", "Patlayanları bul", "Öneriyi yaz"], adim: 2, cikti: { tur: "gorsel", baslik: "Patlayan videolar grafiği", yol: C + "analist/patlayanlar.svg" } },
    { bot: "oyun", eylem: "calistiriyor", is: "Kontrol betiği ve oyun simülasyonu çalışıyor", sure: 3, adimlar: ["İşi seç", "Betikle üret", "Claude Code düzeltsin", "Simülasyon", "Taslak PR"], adim: 3 },
    { bot: "stajyer", eylem: "calistiriyor", is: "Fiyat geçmişiyle karşılaştırıyor", sure: 3, adimlar: ["Fiyatları oku", "Geçmişle karşılaştır", "Raporu yaz"], adim: 1, hata: "Satıcı sitesi açılmadı, karşılaştırma sitesinden okuyor" },
    { bot: "analist", eylem: "yaziyor", is: "Sıradaki video önerisini yazıyor", sure: 4, adimlar: ["Akışları indir", "Ortancayı hesapla", "Patlayanları bul", "Öneriyi yaz"], adim: 3 },
    { bot: "oyun", eylem: "devrediyor", is: "PR'a hazır dalı Müdür'e gönderdi", sure: 2, teslim: ["mudur"], onay: "Örnek Oyun: PR'a hazır dal", adimlar: ["İşi seç", "Betikle üret", "Claude Code düzeltsin", "Simülasyon", "Taslak PR"], adim: 4, cikti: { tur: "metin", baslik: "PR'a hazır dal: hata düzeltmesi", yol: C + "oyun/pr-ozeti.md" } },
    { bot: "analist", eylem: "devrediyor", is: "Raporu Müdür'e gönderdi", sure: 2, teslim: ["mudur"], cikti: { tur: "metin", baslik: "Rakip tarama raporu", yol: C + "analist/rakip-raporu.md" } },
    { bot: "stajyer", eylem: "devrediyor", is: "Fiyat raporunu Müdür'e gönderdi", sure: 2, teslim: ["mudur"], adimlar: ["Fiyatları oku", "Geçmişle karşılaştır", "Raporu yaz"], adim: 2, cikti: { tur: "metin", baslik: "SSD fiyatı (skill'siz)", yol: C + "stajyer/ssd-fiyati.md" } },
    { bot: "mudur", eylem: "yaziyor", is: "Stajyer için skill yazdı: fiyat-takip", sure: 3, skill: "fiyat-takip" },
    { bot: "oyun", eylem: "yaziyor", is: "Devlog taslağını yazıyor", sure: 4 },
    { bot: "oyun", eylem: "devrediyor", is: "Devlog taslağını Müdür'e gönderdi", sure: 2, teslim: ["mudur"], onay: "Örnek Oyun devlog", cikti: { tur: "metin", baslik: "Örnek Oyun devlog taslağı", yol: C + "oyun/devlog-taslagi.md" } },
    { bot: "analist", eylem: "yaziyor", is: "Yeni skill kaydetti: rakip-tarama", sure: 3, skill: "rakip-tarama" },
    { bot: "stajyer", eylem: "okuyor", is: "Aylık alışveriş için bu kez skill kullanıyor", sure: 4, adimlar: ["Fiyatları oku", "Geçmişle karşılaştır", "Raporu yaz"], adim: 0 },
    { bot: "gundem", eylem: "yaziyor", is: "Akşam özetini ve X taslağını yazıyor", sure: 3 },
    { bot: "stajyer", eylem: "devrediyor", is: "Aylık alışveriş listesini Müdür'e gönderdi", sure: 2, teslim: ["mudur"], adimlar: ["Fiyatları oku", "Geçmişle karşılaştır", "Raporu yaz"], adim: 2, cikti: { tur: "metin", baslik: "Aylık alışveriş (skill ile)", yol: C + "stajyer/aylik-alisveris.md" } },
    { bot: "gundem", eylem: "devrediyor", is: "X taslağını Müdür'e gönderdi", sure: 2, teslim: ["mudur"], onay: "X taslağı", cikti: { tur: "metin", baslik: "X taslağı", yol: C + "gundem/x-taslagi.md" } },
    { bot: "mudur", eylem: "yaziyor", is: "Brifingi derliyor", sure: 5, adimlar: ["Raporları topla", "Deneyi karşılaştır", "Brifingi yaz"], adim: 2, cikti: { tur: "metin", baslik: "Günün brifingi", yol: C + "mudur/brifing.md" } },
    { bot: "mudur", eylem: "onay", is: "3 iş onayını bekliyor", sure: 8 },
  ];

  const durum = {
    saat: "",
    sunucu: { ad: "Hostinger KVM 2", cpu: 18, ram: 41, acik: "7 sa 12 dk" },
    harcama: { bugun: 0.0, kredi: null },   // varsayılan kurulum abonelikle çalışır, kalan kredi kutusu gizli
    botlar: BOTLAR.map((b) => ({
      ...b, durum: "bosta", eylem: "", is: "Masasında bekliyor", maliyet: 0, biten: 0,
      adimlar: [], adim: 0, kurgu: null, gecmis: [], ciktilar: (ESKI[b.id] || []).map((c, i) => ({ id: b.id + "-eski-" + i, ...c, durum: "hazir" })),
    })),
    akis: [],
    onay: [],
    skill: 0,
  };

  const dinleyiciler = [];
  const olayDinleyiciler = [];
  // Senaryo bir iş gününü (09:30-20:00) tam bir kez oynar, sonra yeni gün başlar.
  const GUN_BAS = 9 * 3600 + 30 * 60, GUN_SON = 20 * 3600;
  const TIK = Math.round((GUN_SON - GUN_BAS) / SENARYO.reduce((a, o) => a + o.sure, 0));
  const ILK = JSON.parse(JSON.stringify(durum));
  let adim = 0, kalan = 0, saniye = GUN_BAS, sayac = 0;

  const bot = (id) => durum.botlar.find((b) => b.id === id);
  function saatYaz() {
    const s = Math.floor(saniye / 3600) % 24, d = Math.floor(saniye / 60) % 60;
    return String(s).padStart(2, "0") + ":" + String(d).padStart(2, "0");
  }
  function akisa(metin, tur, kimden) {
    durum.akis.unshift({ t: saatYaz(), metin, tur, kimden });
    durum.akis = durum.akis.slice(0, 40);
  }
  function gecmise(b, metin, tur) {
    b.gecmis.unshift({ t: saatYaz(), metin, tur });
    b.gecmis = b.gecmis.slice(0, 30);
  }

  function ilerle() {
    saniye += TIK;
    durum.saat = saatYaz();
    durum.sunucu.cpu = Math.max(6, Math.min(72, durum.sunucu.cpu + (Math.random() * 14 - 6)));
    durum.sunucu.ram = Math.max(30, Math.min(64, durum.sunucu.ram + (Math.random() * 4 - 2)));
    if (kalan > 0) { kalan--; yayinla(); return; }

    const o = SENARYO[adim % SENARYO.length];
    adim++;
    if (adim % SENARYO.length === 1 && adim > 1) {
      // Yeni gün: masaları topla, eski çıktıları bırak, onayları sıfırla
      // Yeni gün: her şey sabahki haline döner (sayaçlar, akış, çıktılar)
      const ilk = JSON.parse(JSON.stringify(ILK));
      Object.keys(ilk).forEach((k) => { if (k !== "sunucu") durum[k] = ilk[k]; });
      saniye = GUN_BAS; durum.saat = saatYaz();
    }
    const b = bot(o.bot);
    durum.botlar.forEach((x) => {
      if (x !== b && x.durum === "calisiyor" && !x.kurgu && Math.random() < 0.35) { x.durum = "bosta"; x.eylem = ""; x.is = "Sırada iş bekliyor"; }
    });
    b.durum = o.eylem === "onay" ? "onay" : o.eylem === "dusunuyor" ? "dusunuyor" : "calisiyor";
    b.eylem = o.eylem;
    b.is = o.is;
    if (o.adimlar) { b.adimlar = o.adimlar; b.adim = o.adim; }
    const ek = b.model.includes("Luna") ? 0.004 : b.model.startsWith("Claude") ? 0.04 : 0.012;
    b.maliyet = +(b.maliyet + ek).toFixed(3);
    durum.harcama.bugun = +(durum.harcama.bugun + ek).toFixed(3);

    const tur = o.hata ? "hata" : o.skill ? "skill" : o.teslim ? "teslim" : "is";
    akisa(b.ad + ": " + o.is, tur, b.id);
    gecmise(b, o.is, tur);
    if (o.hata) { akisa(b.ad + ": " + o.hata, "hata", b.id); gecmise(b, o.hata, "hata"); }
    if (o.skill) durum.skill++;
    if (o.cikti) {
      b.ciktilar = b.ciktilar.filter((c) => c.yol !== o.cikti.yol);
      b.ciktilar.unshift({ id: b.id + "-" + (++sayac), ...o.cikti, durum: "hazir", t: saatYaz() });
      gecmise(b, "Çıktı hazır: " + o.cikti.baslik, "cikti");
      if (o.cikti.tur === "video") b.kurgu = null;
    }
    if (o.onay) { durum.onay.push({ bot: b.id, baslik: o.onay }); akisa("Onay masasına düştü: " + o.onay, "onay", b.id); }
    if (o.teslim) { b.biten++; o.teslim.forEach((k) => olayYay({ tur: "teslim", kimden: b.id, kime: k })); }
    kalan = o.sure - 1;
    yayinla();
  }

  const kopya = () => JSON.parse(JSON.stringify(durum));
  function yayinla() { const k = kopya(); dinleyiciler.forEach((f) => f(k)); }
  function olayYay(o) { olayDinleyiciler.forEach((f) => f(o)); }

  window.OfisVeri = {
    botlar: BOTLAR,
    abone(f) { dinleyiciler.push(f); f(kopya()); },
    olay(f) { olayDinleyiciler.push(f); },
    baslat(hiz = 1000) { durum.saat = saatYaz(); ilerle(); return setInterval(ilerle, hiz); },
    // Finder'da göster: yalnız yerel sunucuda çalışır (sunucu.py, macOS). Başarısızsa false döner.
    async finderdaGoster(yol) {
      try { const r = await fetch("/finder?yol=" + encodeURIComponent(yol), { method: "POST" }); return r.ok; } catch { return false; }
    },
  };
})();
