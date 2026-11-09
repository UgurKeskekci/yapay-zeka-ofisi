"""Günün kaydı (Hermes cron, --no-agent, dakikada bir).

Ofisin o anki durumunu (kurulum/durum.py) ~/ofis/gecmis/<YYYY-AA-GG>.jsonl dosyasına bir satır olarak ekler. Bilgisayar
kapalıyken geçen günü ofis ekranı bu kayıttan hızlı oynatır (günün tekrarı). Hiçbir şey basmaz, Telegram'a gitmez.
"""

import os
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ofis = Path(os.environ.get("OFIS_DIZIN") or ("/opt/data/ofis" if Path("/opt/data/ofis").is_dir() else os.path.expanduser("~/ofis")))  # cron betikleri HOME=/opt/data/home ile çalışır
durum_py = ofis / "durum.py"
if not durum_py.exists():
    durum_py = Path("/opt/data/ofis-kurulum/kurulum/durum.py")
r = subprocess.run(["python3", str(durum_py)], capture_output=True, text=True, timeout=50)
satir = r.stdout.strip()
if r.returncode == 0 and satir.startswith("{"):
    klasor = ofis / "gecmis"
    klasor.mkdir(parents=True, exist_ok=True)
    gun = datetime.now(ZoneInfo("Europe/Istanbul")).strftime("%Y-%m-%d")
    with open(klasor / f"{gun}.jsonl", "a", encoding="utf-8") as f:
        f.write(satir + "\n")
