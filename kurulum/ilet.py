"""Müdür'ün anlık iletme rutini (Hermes cron, --no-agent).

Çalışanlar patrona hemen gitmesi gereken metni ~/ofis/ilet/<calisan>-<zaman>.md olarak bırakır. Bu betik kuyruğu
okur, her mesajın başına kimden geldiğini yazar, stdout'a basar ve dosyaları gonderildi/ altına taşır. Hermes stdout'u
Telegram'a iletir; kuyruk boşsa çıktı boştur ve hiçbir şey gönderilmez. Yapay zeka çağırmaz, maliyeti sıfırdır.
"""

import os
import shutil
from pathlib import Path

ADLAR = {"mudur": "Müdür", "gundem": "Gündem", "analist": "Analist", "oyun": "Oyun Stüdyosu", "stajyer": "Stajyer"}

# Hermes cron betikleri HOME=/opt/data/home ile çalışır; ~/ofis orada yanlış klasöre gider.
OFIS = Path(os.environ.get("OFIS_DIZIN") or ("/opt/data/ofis" if Path("/opt/data/ofis").is_dir() else os.path.expanduser("~/ofis")))
kuyruk = OFIS / "ilet"
giden = kuyruk / "gonderildi"
giden.mkdir(parents=True, exist_ok=True)

parcalar = []
for dosya in sorted(kuyruk.glob("*.md"), key=lambda p: p.stat().st_mtime):
    metin = dosya.read_text(encoding="utf-8", errors="replace").strip()
    if metin:
        kim = ADLAR.get(dosya.name.split("-", 1)[0].lower(), "Ofis")
        parcalar.append(f"{kim}:\n{metin}")
    shutil.move(str(dosya), str(giden / dosya.name))

if parcalar:
    print("\n\n".join(parcalar))
