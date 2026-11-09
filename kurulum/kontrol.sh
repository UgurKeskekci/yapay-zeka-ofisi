#!/usr/bin/env bash
# Salt okur doktor. ozel/ayar.sh çalıştırılmaz: kabuk kodu dosya değiştirebilir.
# Özel yollar kullanıyorsanız OFIS_EV, HERMES_HOME ve OFIS_DIZIN ortamda tanımlı olmalı.
set -euo pipefail
if [ "$(id -u)" = 0 ] && id hermes >/dev/null 2>&1; then
  exec runuser -u hermes -- env HOME="${OFIS_EV:-/opt/data}" HERMES_HOME="${HERMES_HOME:-/opt/data}" \
    OFIS_DIZIN="${OFIS_DIZIN:-}" \
    PATH="${OFIS_EV:-/opt/data}/.local/bin:/opt/hermes/.venv/bin:/opt/hermes/bin:/usr/local/bin:/usr/bin:/bin" bash "$0" "$@"
fi
if ! command -v python3 >/dev/null; then
  echo '✗ Python 3 bulunamadı. Çözüm: Python 3.10+ kurulu Hermes ortamında çalıştırın.'
  echo 'Özet: 0 başarılı, 0 uyarı, 1 hata.'
  exit 1
fi
python3 - <<'PY'
import os
import re
import shutil
import subprocess
from pathlib import Path

hh = Path(os.environ.get("HERMES_HOME") or Path.home() / ".hermes")
ofis = Path(os.environ.get("OFIS_DIZIN") or Path.home() / "ofis")
sayac = {"✓": 0, "!": 0, "✗": 0}

def bildir(isaret, metin, cozum=""):
    sayac[isaret] += 1
    print(f"{isaret} {metin}" + (f" Çözüm: {cozum}" if cozum else ""))

def komut(*args):
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=45)
        return r.stdout if r.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None

beklenen = {
    "default": ("mudur", ["Anlık iletme", "Yükseltme", "Günün kaydı", "Günün planı", "Skill yaz", "Akşam brifingi"]),
    "gundem": ("gundem", ["Model radarı", "Akşam özeti"]),
    "analist": ("analist", ["Rakip tarama"]),
    "oyun": ("oyun", ["Hata turu", "Not ve devlog"]),
    "stajyer": ("stajyer", ["Fiyat turu (skill'siz)", "Fiyat turu (skill'li)", "Aylık alışveriş"]),
}
if shutil.which("hermes"):
    bildir("✓", "Hermes komutu bulundu.")
    liste = komut("hermes", "profile", "list")
    if liste is None:
        bildir("✗", "Profil listesi okunamadı.", "Hermes kullanıcısını ve HERMES_HOME yolunu kontrol edin.")
    for profil, (bot, adlar) in beklenen.items():
        var = liste is not None and bool(re.search(rf"(?<!\w){re.escape(profil)}(?!\w)", liste))
        if profil == "default" and liste is not None:
            var = var or "Müdür" in liste
        bildir("✓" if var else "✗", f"Profil: {profil} ({bot}).",
               "bash kurulum/kur.sh çalıştırın; özel olarak kaldırdıysanız bu uyarı beklenir." if not var else "")
        model = komut("hermes", "-p", profil, "config", "get", "model.default")
        model = model.strip() if model else ""
        bildir("✓" if model else "✗", f"{profil} modeli: {model or 'okunamadı'}.",
               "hermes model ile sağlayıcı seçin; profil modelini docs/03-kullanim.md ile ayarlayın." if not model else "")
        cron = komut("hermes", "-p", profil, "cron", "list", "--all")
        if cron is None:
            bildir("✗", f"{profil} rutinleri okunamadı.", "Aynı kullanıcıyla cron list --all kontrolünü tekrarlayın.")
            continue
        bulunan = re.findall(rf"\[bot:{bot}\]\s*([^\r\n]+)", cron)
        bildir("✓" if len(bulunan) >= len(adlar) else "!",
               f"{profil}: [bot:{bot}] adlı {len(bulunan)} iş görüldü; varsayılan {len(adlar)}.")
        for ad in adlar:
            if not any(ad in satir for satir in bulunan):
                bildir("!", f"Eksik rutin: [bot:{bot}] {ad}. Bilerek kaldırmadıysanız kur.sh çalıştırın.")
        if re.search(r"paused|disabled|duraklat|devre dışı", cron, re.I):
            bildir("!", f"{profil}: duraklatılmış iş olabilir; listeyi inceleyin.")
else:
    bildir("✗", "Hermes bulunamadı.", "Hermes kurulu kapsayıcının terminalini açın, PATH ayarını kontrol edin.")

klasorler = ["ortak", "ilet/gonderildi", "onay/bitti", "fiyatlar", "gundem", "repo", "gecmis",
             "yukselt/calisiyor", "yukselt/bitti"] + [f"ciktilar/{b}" for b, _ in beklenen.values()]
for ad in klasorler:
    var = (ofis / ad).is_dir()
    bildir("✓" if var else "✗", f"Ofis klasörü: {ad}.", "bash kurulum/kur.sh çalıştırın." if not var else "")
dosyalar = ["sahip.md", "oyunlar.json", "rakipler.json", "x-hesaplar.json", "fiyat-takip.json",
            "sosyal.md", "tercihler.md", "is-listesi.md"]
for ad in dosyalar:
    yol = ofis / "ortak" / ad
    try:
        metin = yol.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        bildir("✗", f"Ortak dosya okunamadı: {ad}.", "Kurulumu ve dosyanın okuma iznini kontrol edin.")
        continue
    if re.search(r"Deniz|UCx{4,}|KULLANICI|KANALINIZ|hesabiniz|ÖRNEK|<[^>]+>|0000000", metin, re.I):
        bildir("!", f"{ad}: örnek veya yer tutucu olabilir. Kullanacağınız alanları doldurun.")
    else:
        bildir("✓", f"Ortak dosya: {ad}.")
for profil in beklenen:
    ev = hh if profil == "default" else hh / "profiles" / profil
    var = (ev / "SOUL.md").is_file()
    bildir("✓" if var else "✗", f"SOUL: {profil}.", "bash kurulum/kur.sh çalıştırın." if not var else "")
for ad in ("EL-KITABI.md", "rutinler.md", "durum.py", ".kurulum-bitti"):
    var = (ofis / ad).is_file()
    bildir("✓" if var else "✗", f"Ofis dosyası: {ad}.", "bash kurulum/kur.sh çalıştırın." if not var else "")
for ad in ("ofis_ilet.py", "ofis_yukselt.py", "ofis_kayit.py"):
    var = (hh / "scripts" / ad).is_file()
    bildir("✓" if var else "✗", f"Rutin betiği: {ad}.", "bash kurulum/kur.sh çalıştırın." if not var else "")
claude = shutil.which("claude") or (Path.home() / ".local/bin/claude").is_file()
bildir("✓" if claude else "!", "Claude Code kurulu." if claude else "Claude Code yok: kod işleri ve yükseltme kullanılamaz.")
cron_ev = Path("/opt/data/home")
if cron_ev.is_dir() and Path.home() != cron_ev:
    for ad in (".claude", ".claude.json"):
        yol = cron_ev / ad
        dogru = yol.is_symlink() and yol.resolve() == (Path.home() / ad).resolve()
        if not dogru:
            bildir("!", f"{ad}: çalışan HOME bağlantısı eksik veya farklı. docs/06-sorun-giderme.md dosyasına bakın.")
        elif not yol.exists():
            bildir("!", f"{ad}: bağlantı var, hedef yok. Doğru kullanıcıyla claude girişi yapın.")
        else:
            bildir("✓", f"{ad}: çalışan HOME bağlantısı hazır. Oturum geçerliliği burada sınanmaz.")
else:
    bildir("!", "Hostinger çalışan HOME yolu yok veya aynı: Claude bağlantı kontrolü uygulanmadı.")
print(f"\nÖzet: {sayac['✓']} başarılı, {sayac['!']} uyarı, {sayac['✗']} hata. Hiçbir dosya değiştirilmedi.")
raise SystemExit(1 if sayac["✗"] else 0)
PY
