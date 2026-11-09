"""Ofis arayüzünün yerel sunucusu (bağımlılıksız, Python 3.9+).

    python3 arayuz/sunucu.py                       # http://127.0.0.1:8790
    python3 arayuz/sunucu.py --ciktilar ~/ofis-ciktilari --port 8790
    python3 arayuz/sunucu.py --uzak root@SUNUCU_IP --anahtar ~/.ssh/ANAHTARINIZ   # canlı: sunucudaki Hermes

- arayuz/ klasörünü sunar (ofis ekranı: /ofis/). /ortak/veri.js: --uzak varsa canli.js, yoksa ornek.js.
- --uzak: /durum.json ve /ciktilar/ SSH ile sunucudaki Hermes kapsayıcısından okunur (kurulum/durum.py). Port açılmaz,
  bağlantı SSH anahtarıyla şifreli ve doğrulanmış gider.
- /ciktilar/<yol> -> --ciktilar klasöründeki dosya (varsayılan arayuz/ornek-ciktilar). Video sarabilmek için
  Range isteklerini destekler.
- POST /finder?yol=/ciktilar/<yol> -> dosyayı macOS Finder'da seçili gösterir. Yalnız macOS'ta ve yalnız
  127.0.0.1'den çalışır; VPS'te bu uç 404 döner, arayüz o zaman "Aç / İndir" düğmelerini gösterir.
"""

from __future__ import annotations

import argparse
import mimetypes
import re
import os
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

KOK = Path(__file__).resolve().parent
mimetypes.add_type("text/markdown; charset=utf-8", ".md")
mimetypes.add_type("image/svg+xml", ".svg")


def guvenli_yol(taban: Path, goreli: str) -> Path | None:
    """goreli yolu taban altında çözer; dışarı çıkmaya çalışırsa None."""
    yol = (taban / unquote(goreli).lstrip("/")).resolve()
    try:
        yol.relative_to(taban.resolve())
    except ValueError:
        return None
    return yol


class Uzak:
    """SSH ile sunucudaki Hermes kapsayıcısından okur. Tek bağlantı açık tutulur (ControlMaster)."""

    def __init__(self, hedef, anahtar, kapsayici):
        self.ssh = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "-o", "ControlMaster=auto",
                    "-o", "ControlPath=/tmp/ofis-ssh-%C", "-o", "ControlPersist=600"]
        if anahtar:
            self.ssh += ["-i", os.path.expanduser(anahtar)]
        self.ssh.append(hedef)
        if kapsayici is None:
            sonuc = self.calistir("docker ps --format '{{.Names}}'")
            if sonuc.returncode != 0:
                raise ValueError("Uzak sunucuda Docker kapsayıcıları listelenemedi. SSH bağlantısını ve Docker yetkisini kontrol edin.")
            kapsayici = next((ad.strip() for ad in sonuc.stdout.decode("utf-8").splitlines()
                             if "hermes" in ad.lower()), None)
            if kapsayici is None:
                raise ValueError("Uzak sunucuda adında 'hermes' geçen çalışan kapsayıcı bulunamadı. --kapsayici ile adı belirtin.")
        if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_.-]*", kapsayici):
            raise ValueError("Geçersiz Docker kapsayıcı adı.")
        self.kapsayici = kapsayici
        self.kilit = threading.Lock()
        self.son = (0.0, b"")

    def calistir(self, komut, sure=20):
        return subprocess.run(self.ssh + [komut], capture_output=True, timeout=sure)

    def durum(self):
        with self.kilit:
            if time.time() - self.son[0] < 2.5:
                return self.son[1]
            r = self.calistir(f"docker exec -u hermes {self.kapsayici} python3 /opt/data/ofis-kurulum/kurulum/durum.py")
            if r.returncode == 0 and r.stdout.strip():
                self.son = (time.time(), r.stdout)
            return self.son[1]

    def gecmis(self):
        """Günün kaydı (kurulum/kayit.py): en yeni ~/ofis/gecmis/*.jsonl dosyası."""
        r = self.calistir(f"docker exec -u hermes {self.kapsayici} sh -c 'cat \"$(ls -t /opt/data/ofis/gecmis/*.jsonl | head -1)\"'", sure=60)
        return r.stdout if r.returncode == 0 else b""

    def dosya(self, goreli):
        if not re.fullmatch(r"[a-z]+/[^/\\]+", goreli) or ".." in goreli:
            return None
        r = self.calistir(f"docker exec -u hermes {self.kapsayici} cat '/opt/data/ofis/ciktilar/{goreli}'", sure=60)
        return r.stdout if r.returncode == 0 else None


class Isleyici(SimpleHTTPRequestHandler):
    ciktilar: Path = KOK / "ornek-ciktilar"
    uzak: "Uzak | None" = None

    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(KOK), **k)

    def log_message(self, *a):  # sessiz
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/ortak/veri.js":
            return self.dosya_gonder(KOK / "ortak" / ("canli.js" if self.uzak else "ornek.js"))
        if self.uzak and u.path == "/gecmis.jsonl":
            return self.bayt_gonder(self.uzak.gecmis(), "application/x-ndjson; charset=utf-8")
        if self.uzak and u.path == "/durum.json":
            return self.bayt_gonder(self.uzak.durum(), "application/json; charset=utf-8")
        if u.path.startswith("/ciktilar/"):
            if self.uzak:
                goreli = unquote(u.path[len("/ciktilar/"):])
                veri = self.uzak.dosya(goreli)
                if veri is None:
                    return self.send_error(404)
                return self.bayt_gonder(veri, mimetypes.guess_type(goreli)[0] or "application/octet-stream")
            return self.dosya_gonder(guvenli_yol(self.ciktilar, u.path[len("/ciktilar/"):]))
        return super().do_GET()

    def bayt_gonder(self, veri: bytes, tur: str):
        if not veri:
            return self.send_error(503, "Sunucudan veri gelmedi")
        self.send_response(200)
        self.send_header("Content-Type", tur)
        self.send_header("Content-Length", str(len(veri)))
        self.end_headers()
        try:
            self.wfile.write(veri)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/finder":
            return self.send_error(404)
        if self.uzak or sys.platform != "darwin" or self.client_address[0] not in ("127.0.0.1", "::1"):
            return self.send_error(404, "Finder yalnız yerel Mac'te")
        istek = parse_qs(u.query).get("yol", [""])[0]
        if not istek.startswith("/ciktilar/"):
            return self.send_error(400)
        yol = guvenli_yol(self.ciktilar, istek[len("/ciktilar/"):])
        if not yol or not yol.exists():
            return self.send_error(404)
        subprocess.Popen(["open", "-R", str(yol)])
        self.send_response(204)
        self.end_headers()

    def dosya_gonder(self, yol: Path | None):
        if not yol or not yol.is_file():
            return self.send_error(404)
        boyut = yol.stat().st_size
        tur = mimetypes.guess_type(str(yol))[0] or "application/octet-stream"
        aralik = self.headers.get("Range")
        bas, son = 0, boyut - 1
        if aralik and aralik.startswith("bytes="):
            a, _, b = aralik[6:].partition("-")
            bas = int(a) if a else max(0, boyut - int(b))
            son = int(b) if a and b else boyut - 1
            son = min(son, boyut - 1)
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {bas}-{son}/{boyut}")
        else:
            self.send_response(200)
        self.send_header("Content-Type", tur)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(son - bas + 1))
        self.end_headers()
        with open(yol, "rb") as f:
            f.seek(bas)
            kalan = son - bas + 1
            while kalan > 0:
                parca = f.read(min(1 << 16, kalan))
                if not parca:
                    break
                try:
                    self.wfile.write(parca)
                except (BrokenPipeError, ConnectionResetError):
                    return
                kalan -= len(parca)


def main():
    p = argparse.ArgumentParser(description="Yapay zeka ofisi yerel sunucusu")
    p.add_argument("--port", type=int, default=8790)
    p.add_argument("--ciktilar", default=str(KOK / "ornek-ciktilar"))
    p.add_argument("--uzak", help="canlı veri: SSH hedefi, ör. root@SUNUCU_IP")
    p.add_argument("--anahtar", help="SSH anahtarı, ör. ~/.ssh/ANAHTARINIZ")
    p.add_argument("--kapsayici", help="Hermes kapsayıcısının adı; verilmezse adında 'hermes' geçen ilk çalışan kapsayıcı bulunur")
    a = p.parse_args()
    Isleyici.ciktilar = Path(os.path.expanduser(a.ciktilar)).resolve()
    if a.uzak:
        try:
            Isleyici.uzak = Uzak(a.uzak, a.anahtar, a.kapsayici)
        except (ValueError, OSError, subprocess.SubprocessError) as hata:
            p.error(str(hata))
    sunucu = ThreadingHTTPServer(("127.0.0.1", a.port), Isleyici)
    kaynak = f"canlı: {a.uzak}" if a.uzak else f"örnek veri, çıktılar: {Isleyici.ciktilar}"
    print(f"Ofis: http://127.0.0.1:{a.port}/ofis/  ({kaynak})")
    sunucu.serve_forever()


if __name__ == "__main__":
    main()
