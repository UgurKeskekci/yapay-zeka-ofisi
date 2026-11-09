// CANLI VERİ: sunucudaki Hermes'ten gelen durum. sunucu.py --uzak ile açılınca /ortak/veri.js bu dosyadır.
// /durum.json'u birkaç saniyede bir çeker (sunucuda kurulum/durum.py üretir). Arayüz ornek.js ile aynı OfisVeri'yi görür.
(function () {
  const BOTLAR = [
    { id: "mudur",   ad: "Müdür",         rol: "Plan, anlık iletme, brifing, onay masası", model: "", renk: "#e8b04a", cinsiyet: "erkek", sac: "#2b2118", ten: "#e2b48c" },
    { id: "gundem",  ad: "Gündem",        rol: "X'te yeni model radarı",                  model: "", renk: "#5aa9e6", cinsiyet: "kadin", sac: "#7a3b1d", ten: "#f0c9a5" },
    { id: "analist", ad: "Analist",       rol: "Kanal ve rakip analizi",                  model: "", renk: "#7bc67b", cinsiyet: "kadin", sac: "#1c1c22", ten: "#c98f63" },
    { id: "oyun",    ad: "Oyun Stüdyosu", rol: "Oyun projesi: hata, test, PR'a hazır dal", model: "", renk: "#e07a5f", cinsiyet: "erkek", sac: "#5a3a22", ten: "#d9a77e" },
    { id: "stajyer", ad: "Stajyer",       rol: "Fiyat takibi (deney: ucuz model)",        model: "", renk: "#b39ddb", cinsiyet: "erkek", sac: "#c9a24a", ten: "#f1cfae" },
  ];
  const MODEL_AD = { "gpt-6.1-sol": "GPT 6.1 Sol", "gpt-6-sol": "GPT 6 Sol", "gpt-6-luna": "GPT 6 Luna", "gpt-6-astra": "GPT 6 Astra" };
  const modelYaz = (id, m) => (id === "oyun" ? "Claude Code" : MODEL_AD[m] || m || "");

  const bos = (b) => ({ ...b, durum: "bosta", eylem: "", is: "Bağlanıyor", maliyet: 0, biten: 0, adimlar: [], adim: 0, kurgu: null, gecmis: [], ciktilar: [] });
  let durum = { saat: "", sunucu: { ad: "Hostinger KVM 2", cpu: 0, ram: 0, acik: "" }, harcama: { bugun: 0, kredi: null },
    botlar: BOTLAR.map(bos), akis: [], onay: [], skill: 0 };
  const dinleyiciler = [], olayDinleyiciler = [];
  const bilinen = new Map();  // bot -> görülen çıktı kimlikleri
  let ilk = true;

  const kopya = () => JSON.parse(JSON.stringify(durum));
  const yayinla = () => { const k = kopya(); dinleyiciler.forEach((f) => f(k)); };

  function isle(d) {
    d.botlar = BOTLAR.map((s) => {
      const x = d.botlar.find((b) => b.id === s.id) || bos(s);
      s.model = modelYaz(s.id, x.model) || s.model;
      return { ...s, ...x, ad: s.ad, rol: s.rol, model: s.model };
    });
    // Yeni çıktı = çalışan işini Müdür'e teslim etti (ofiste yürüyüş animasyonu).
    for (const b of d.botlar) {
      const gorulen = bilinen.get(b.id) || new Set();
      for (const c of b.ciktilar) {
        if (!gorulen.has(c.id) && !ilk && b.id !== "mudur") olayDinleyiciler.forEach((f) => f({ tur: "teslim", kimden: b.id, kime: "mudur" }));
        gorulen.add(c.id);
      }
      bilinen.set(b.id, gorulen);
    }
    durum = d;
    yayinla();
    // Oda başlıkları (Müdür'ün modeli) sabit katmanda; ilk gerçek veriden sonra bir kez yeniden çizilir.
    if (ilk && typeof window.arkaPlaniHazirla === "function") window.arkaPlaniHazirla();
    ilk = false;
  }

  async function cek() {
    try {
      const r = await fetch("/durum.json", { cache: "no-store" });
      if (r.ok) isle(await r.json());
    } catch (e) { /* bağlantı koptuysa son durum ekranda kalır */ }
  }

  async function tekrarOynat(hiz) {
    let kareler = [];
    try {
      const metin = await (await fetch("/gecmis.jsonl", { cache: "no-store" })).text();
      kareler = metin.split("\n").filter((s) => s.trim().startsWith("{")).map((s) => JSON.parse(s));
    } catch (e) { /* kayıt yoksa canlıya dön */ }
    if (!kareler.length) { cek(); setInterval(cek, 4000); return; }
    const bekle = Math.max(80, 60000 / hiz);
    let i = 0;
    const oynat = () => { isle(kareler[i]); i += 1; if (i < kareler.length) setTimeout(oynat, bekle); };
    oynat();
  }

  document.querySelector("footer .ornek")?.remove();

  window.OfisVeri = {
    botlar: BOTLAR,
    abone(f) { dinleyiciler.push(f); f(kopya()); },
    olay(f) { olayDinleyiciler.push(f); },
    baslat() {
      // ?tekrar=1: bilgisayar kapalıyken geçen günü kayıttan hızlı oynatır (&hiz=60: 1 dakika = 1 saniye).
      const q = new URLSearchParams(location.search);
      if (q.has("tekrar")) { tekrarOynat(Number(q.get("hiz")) || 60); return 0; }
      cek(); return setInterval(cek, 4000);
    },
    async finderdaGoster() { return false; },  // çıktılar sunucuda: arayüz "Aç" düğmesini gösterir
  };
})();
