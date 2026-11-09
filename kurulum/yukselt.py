"""Müdür'ün yükseltme rutini (Hermes cron, --no-agent, dakikada bir).

Bir çalışan bir işte takılınca (site engelledi, araç yok, giriş gerekiyor, veri boş) işi
~/ofis/yukselt/<calisan>-<YYYYAAGG-SSDD>.md olarak bırakır: görev, ne denendi, nerede takıldı, elde ne var.
Müdür bu rutinle işi daha güçlü bir ajana verir: sunucudaki Claude Code (Opus; web araması yapar, betik yazıp
çalıştırır, başka yol dener). Claude Code arka planda çalışır, bu rutin beklemez. Bitince sonuç
~/ofis/ciktilar/mudur/<tarih>-<is>-cozum.md olur (ofis ekranında görünür) ve özeti stdout'tan Telegram'a gider.

Rutin kendisi yapay zeka çağırmaz; çağrıyı Claude Code yapar, patronun Claude aboneliğinden düşer. Kuyruk boşsa
hiçbir şey basmaz, Telegram'a bir şey gitmez.
"""

import json
import os
import re
import shutil
import subprocess
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ADLAR = {"mudur": "Müdür", "gundem": "Gündem", "analist": "Analist", "oyun": "Oyun Stüdyosu", "stajyer": "Stajyer"}
TZ = ZoneInfo("Europe/Istanbul")
# Hermes cron betikleri HOME=/opt/data/home ile çalışır; ~/ofis orada yanlış klasöre gider (ilet.py ile aynı).
OFIS = Path(os.environ.get("OFIS_DIZIN") or ("/opt/data/ofis" if Path("/opt/data/ofis").is_dir() else os.path.expanduser("~/ofis")))
KUYRUK = OFIS / "yukselt"
CALISIYOR = KUYRUK / "calisiyor"
BITTI = KUYRUK / "bitti"
SURE = int(os.environ.get("YUKSELT_SURE", "900"))      # Claude Code en çok 15 dk
MODEL = os.environ.get("YUKSELT_MODEL", "opus")
CLAUDE_HOME = "/opt/data" if Path("/opt/data/.claude").exists() or Path("/opt/data/.claude.json").exists() else os.path.expanduser("~")
# Cron ortamının PATH'inde yerel kurulumdan önce eksik bir npm kopyası olabiliyor ("native binary not installed", 11-09):
# önce Claude Code'un kendi kurduğu yer.
CLAUDE = next((str(c) for c in (Path(CLAUDE_HOME) / ".local/bin/claude", Path.home() / ".local/bin/claude")
               if c.exists()), shutil.which("claude") or "claude")

ISTEM = """Sen bu yapay zeka ofisinde (sahibi ortak/sahip.md) Müdür'ün çağırdığı uzmansın. Bir çalışan aşağıdaki işte takıldı;
işi sen bitir. Ofis klasörü {ofis} (EL-KITABI.md, ortak/, ciktilar/). Önce EL-KITABI.md, ortak/sahip.md ve ortak/tercihler.md'yi oku,
kuralları geçerli. Şu an {simdi} (Europe/Istanbul).

ÇALIŞANIN NOTU ({kim}):
{not_}

Ne yapacaksın:
- Çalışanın denediği yolu tekrar etme, başka yol bul: web araması, resmi API'ler (App Store için
  itunes.apple.com/lookup ve müşteri yorumu RSS'i, Steam için api.steampowered.com), şirketlerin kendi blogları ve haber
  sayfaları, gerekiyorsa küçük bir betik yazıp çalıştır. ortak/ altındaki bilgi dosyalarını (oyunlar.json gibi) kullan.
- Uydurma yok: her bilgi bağlantıyla. Bulduğunu net söyle. Gerçekten bulunamayanı en sonda tek satırda, nedeni ve
  patrondan ne gerektiğiyle yaz.
- Dışarıya hiçbir şey gönderme: paylaşım, e-posta, yorum cevabı, git push, satın alma, hesaba giriş yok.
- Rapor dosyasını ve Telegram mesajını bu rutin senin son cevabından yazar: ciktilar/ altına rapor, ilet/ kuyruğuna mesaj
  YAZMA (iki kez görünür). Kanıt dosyaları gerekiyorsa ciktilar/mudur/<tarih>-kanit-<kisa-ad>/ klasörüne koy. Patronun
  onayını bekleyen bir taslak (X gönderisi gibi) varsa yalnız onu ~/ofis/onay/mudur-<kisa-ad>.md olarak yaz (ilk satır başlık).
- Son cevabın raporun olsun ve yalnız rapor olsun: ilk satır tek cümlelik sonuç (ofis ekranında bu görünür), sonra en çok
  8 madde, en sonda "Kaynaklar" başlığıyla bağlantılar. Türkçe, kısa; uzun tire ve şapkalı harf kullanma.
"""


def simdi():
    return datetime.now(TZ)


def kisa_ad(metin, varsayilan):
    m = re.search(r"^#\s*(?:Yükseltme:)?\s*(.+)$", metin, re.M)
    ad = (m.group(1) if m else varsayilan).strip().lower()
    for a, b in (("ı", "i"), ("ğ", "g"), ("ü", "u"), ("ş", "s"), ("ö", "o"), ("ç", "c")):
        ad = ad.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "-", ad).strip("-")[:40] or varsayilan


def calisiyor_mu(pid):
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    try:   # zombi süreç bitmiş sayılır
        return Path(f"/proc/{pid}/status").read_text().find("State:\tZ") < 0
    except OSError:
        return True


def baslat(dosya):
    metin = dosya.read_text(encoding="utf-8", errors="replace").strip()
    kim = dosya.name.split("-", 1)[0].lower()
    hedef = CALISIYOR / dosya.name
    shutil.move(str(dosya), str(hedef))
    cikti = hedef.with_suffix(".out")
    istem = ISTEM.format(ofis=OFIS, simdi=simdi().strftime("%Y-%m-%d %H:%M"), kim=ADLAR.get(kim, kim), not_=metin)
    env = dict(os.environ, HOME=CLAUDE_HOME)
    istem_dosya = hedef.with_suffix(".istem")
    istem_dosya.write_text(istem, encoding="utf-8")
    # çıkış kodu .kod dosyasına: hata çıktısı sonuç diye yazılmasın
    komut = (f'timeout {SURE} "{CLAUDE}" -p "$(cat "{istem_dosya}")" --model {MODEL} --max-turns 40 '
             f'--allowedTools "WebSearch,WebFetch,Read,Write,Edit,Glob,Grep,Bash" > "{cikti}" 2>&1; '
             f'echo $? > "{hedef.with_suffix(".kod")}"')
    p = subprocess.Popen(["sh", "-c", komut], cwd=str(OFIS), stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, env=env, start_new_session=True)
    hedef.with_suffix(".json").write_text(json.dumps({"pid": p.pid, "basla": time.time(), "kim": kim,
                                                      "is": kisa_ad(metin, kim)}, ensure_ascii=False))


def bitir(dosya, bilgi):
    cikti = dosya.with_suffix(".out")
    rapor = cikti.read_text(encoding="utf-8", errors="replace").strip() if cikti.exists() else ""
    kod_d = dosya.with_suffix(".kod")
    kod = kod_d.read_text().strip() if kod_d.exists() else "?"
    if kod != "0":
        rapor = ""
    dk = max(1, round((time.time() - bilgi["basla"]) / 60))
    kim = ADLAR.get(bilgi["kim"], bilgi["kim"])
    gun = simdi().strftime("%Y-%m-%d")
    hedef = OFIS / "ciktilar" / "mudur" / f"{gun}-{bilgi['is']}-cozum.md"
    if rapor:
        hedef.write_text(rapor + f"\n\n_{kim} bu işte takıldı; Müdür işi Claude Code'a ({MODEL}) verdi, {dk} dk sürdü._\n",
                         encoding="utf-8")
        ozet = "\n".join(rapor.splitlines()[:6])
        print(f"Müdür: {kim} bir işte takıldı, işi Claude Code'a verdim ({dk} dk). Sonuç:\n{ozet}\n\nTam rapor: ciktilar/mudur/{hedef.name}")
    else:
        print(f"Müdür: {kim} takıldığı işi Claude Code'a verdim ama cevap gelmedi ({dk} dk, çıkış {kod}). "
              f"Elle bakmak gerekiyor: yukselt/bitti/{dosya.name}")
    if dosya.with_suffix(".json").exists():
        dosya.with_suffix(".json").touch()   # ofis ekranı "çözdü" anını bu dosyanın saatinden okur
    for ek in (dosya, cikti, dosya.with_suffix(".json"), kod_d, dosya.with_suffix(".istem")):
        if ek.exists():
            shutil.move(str(ek), str(BITTI / ek.name))


for k in (KUYRUK, CALISIYOR, BITTI):
    k.mkdir(parents=True, exist_ok=True)
for dosya in sorted(CALISIYOR.glob("*.md")):
    try:
        bilgi = json.loads(dosya.with_suffix(".json").read_text())
    except (OSError, ValueError):
        continue
    if not calisiyor_mu(bilgi["pid"]):
        bitir(dosya, bilgi)
for dosya in sorted(KUYRUK.glob("*.md"), key=lambda p: p.stat().st_mtime):
    baslat(dosya)
