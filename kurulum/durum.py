"""Ofis ekranının canlı verisi. Hermes kapsayıcısında, hermes kullanıcısıyla çalışır, yalnız OKUR, JSON basar.

    python3 /opt/data/ofis-kurulum/kurulum/durum.py

Kaynaklar: her profilin state.db'si (oturumlar, son etkinlik, maliyet), cron/jobs.json (sıradaki iş), ~/ofis/ciktilar
(çıktılar), ~/ofis/ilet/gonderildi (Müdür'ün Telegram'a ilettikleri). Biçim arayüzdeki OfisVeri durumuyla aynı.
"""

import json
import os
import re
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Istanbul")
HH = Path(os.environ.get("HERMES_HOME", "/opt/data"))
OFIS = Path(os.environ.get("OFIS_DIZIN") or ("/opt/data/ofis" if Path("/opt/data/ofis").is_dir() else os.path.expanduser("~/ofis")))  # cron betikleri HOME=/opt/data/home ile çalışır
BOTLAR = ["mudur", "gundem", "analist", "oyun", "stajyer"]
AD = {"mudur": "Müdür", "gundem": "Gündem", "analist": "Analist", "oyun": "Oyun Stüdyosu", "stajyer": "Stajyer"}
CANLI_SN = 150  # son etkinlik bu kadar yeniyse çalışıyor sayılır

simdi = time.time()
bugun_bas = datetime.now(TZ).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()


def saat(ts):
    return datetime.fromtimestamp(ts, TZ).strftime("%H:%M") if ts else ""


def ev(bot):
    return HH if bot == "mudur" else HH / "profiles" / bot


def model_adi(bot):
    try:
        m = re.search(r"^model:\s*\n(?:[ \t]+.*\n)*?[ \t]+default:\s*(\S+)", (ev(bot) / "config.yaml").read_text(), re.M)
        return m.group(1).strip("'\"") if m else ""
    except OSError:
        return ""


def eylem_bul(araclar, son_rol):
    a = " ".join(araclar).lower()
    if any(k in a for k in ("delegate", "send_message", "message_agent", "cron")):
        return "devrediyor"
    if any(k in a for k in ("web", "browser", "x_search", "search")):
        return "geziyor"
    if any(k in a for k in ("write", "patch", "edit", "skill_manage", "memory")):
        return "yaziyor"
    if any(k in a for k in ("terminal", "execute", "process", "code")):
        return "calistiriyor"
    if any(k in a for k in ("read", "file", "session_search")):
        return "okuyor"
    return "dusunuyor" if son_rol == "assistant" else "calistiriyor"


def oturumlar(bot):
    db = ev(bot) / "state.db"
    if not db.exists():
        return [], None, 0.0
    c = sqlite3.connect(f"file:{db}?mode=ro", uri=True, timeout=2)
    c.row_factory = sqlite3.Row
    satirlar = c.execute(
        "select id, source, title, display_name, started_at, ended_at, last_activity_at, last_activity_description,"
        " estimated_cost_usd, tool_call_count from sessions where started_at >= ? order by started_at desc limit 40",
        (bugun_bas,)).fetchall()
    maliyet = sum((r["estimated_cost_usd"] or 0) for r in satirlar)
    aktif = None
    for r in satirlar:
        son = r["last_activity_at"] or r["started_at"]
        if r["ended_at"] is None and simdi - son < CANLI_SN:
            araclar = [m["tool_name"] for m in c.execute(
                "select tool_name from messages where session_id=? and tool_name is not null order by id desc limit 3",
                (r["id"],))]
            son_rol = (c.execute("select role from messages where session_id=? order by id desc limit 1",
                                 (r["id"],)).fetchone() or {"role": ""})["role"]
            aktif = {"r": r, "eylem": eylem_bul(araclar, son_rol)}
            break
    c.close()
    return satirlar, aktif, maliyet


def isler(bot):
    try:
        veri = json.loads((ev(bot) / "cron" / "jobs.json").read_text())
    except (OSError, ValueError):
        return []
    liste = veri.get("jobs", veri) if isinstance(veri, dict) else veri
    return [j for j in liste if isinstance(j, dict)]


def sade_ad(ad):
    ad = re.sub(r"^\[bot:[a-z]+\]\s*", "", ad or "").strip()
    ad = re.sub(r"^Subagent:\s*", "", ad)                          # Müdür'ün alt ajanları
    return re.sub(r"\s*·\s*[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}$", "", ad).strip()  # cron başlığındaki İngilizce tarih


EYLEM_TR = {"geziyor": "Web'de araştırıyor", "okuyor": "Okuyor", "yaziyor": "Yazıyor", "calistiriyor": "Komut çalıştırıyor",
            "dusunuyor": "Düşünüyor", "devrediyor": "İş dağıtıyor"}


def ciktilar(bot):
    klasor = OFIS / "ciktilar" / bot
    if not klasor.is_dir():
        return []
    sonuc = []
    for f in sorted((x for x in klasor.iterdir() if x.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)[:40]:
        # Yalnız okunacak çıktılar: rapor (md) ve medya. Ara veri dosyaları (csv, json, txt) panoya girmez.
        if f.name.startswith(".") or f.suffix.lower() not in (".md", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".mp4", ".mov", ".webm"):
            continue
        uzanti = f.suffix.lower()
        tur = "video" if uzanti in (".mp4", ".mov", ".webm") else "gorsel" if uzanti in (".png", ".jpg", ".jpeg", ".svg", ".webp") else "metin"
        baslik = f.stem
        if tur == "metin":
            try:
                for satir in f.read_text(encoding="utf-8", errors="replace").splitlines():
                    if satir.strip():
                        baslik = satir.strip().lstrip("#").strip()[:90]
                        break
            except OSError:
                pass
        mt = f.stat().st_mtime
        if len(sonuc) >= 12:
            break
        sonuc.append({"id": f"{bot}-{f.name}", "tur": tur, "baslik": baslik, "yol": f"/ciktilar/{bot}/{f.name}",
                      "t": saat(mt) if mt >= bugun_bas else "dün", "durum": "hazir", "_mt": mt})
    return sonuc


def sunucu():
    try:
        bilgi = dict(re.findall(r"^(\w+):\s+(\d+)", Path("/proc/meminfo").read_text(), re.M))
        ram = 100 * (1 - int(bilgi["MemAvailable"]) / int(bilgi["MemTotal"]))
        yuk = float(Path("/proc/loadavg").read_text().split()[0])
        cpu = min(100, 100 * yuk / (os.cpu_count() or 1))
        acik = float(Path("/proc/uptime").read_text().split()[0])
    except (OSError, KeyError, ValueError):
        ram = cpu = acik = 0
    return {"ad": "Hostinger KVM 2", "cpu": round(cpu), "ram": round(ram),
            "acik": f"{int(acik // 86400)} gün {int(acik % 86400 // 3600)} sa" if acik >= 86400 else f"{int(acik // 3600)} sa {int(acik % 3600 // 60)} dk"}


durum = {"saat": saat(simdi), "sunucu": sunucu(), "harcama": {"bugun": 0.0, "kredi": None}, "botlar": [],
         "akis": [], "onay": [], "skill": 0, "canli": True}

for bot in BOTLAR:
    satirlar, aktif, maliyet = oturumlar(bot)
    cik = ciktilar(bot)
    is_listesi = isler(bot)
    gelecek = sorted((j for j in is_listesi if j.get("next_run_at") and j.get("enabled", True) is not False),
                     key=lambda j: j["next_run_at"])
    b = {"id": bot, "model": model_adi(bot), "durum": "bosta", "eylem": "", "maliyet": round(maliyet, 3),
         "biten": sum(1 for c in cik if c["t"] != "dün"), "adimlar": [], "adim": 0, "kurgu": None, "gecmis": [],
         "ciktilar": [{k: v for k, v in c.items() if k != "_mt"} for c in cik]}
    if aktif:
        r = aktif["r"]
        b["durum"] = "dusunuyor" if aktif["eylem"] == "dusunuyor" else "calisiyor"
        b["eylem"] = aktif["eylem"]
        # Hermes'in etkinlik notu İngilizce ("starting new turn"); ekranda oturumun Türkçe başlığı gösterilir.
        b["is"] = (sade_ad(r["title"] or r["display_name"]) or EYLEM_TR.get(aktif["eylem"], "Çalışıyor"))[:80]
    elif gelecek:
        g = gelecek[0]
        try:
            ne_zaman = datetime.fromisoformat(str(g["next_run_at"]).replace("Z", "+00:00")).astimezone(TZ)
            b["is"] = f"Sırada: {sade_ad(g.get('name'))} · {ne_zaman.strftime('%H:%M')}"
        except ValueError:
            b["is"] = f"Sırada: {sade_ad(g.get('name'))}"
    else:
        b["is"] = "Masasında bekliyor"
    for r in satirlar[:10]:
        ad = sade_ad(r["title"] or r["display_name"]) or ("Telegram'dan mesaj" if r["source"] == "telegram" else "Oturum")
        b["gecmis"].append({"t": saat(r["started_at"]), "metin": ad, "tur": "is", "_ts": r["started_at"]})
        durum["akis"].append({"t": saat(r["started_at"]), "metin": f"{AD[bot]}: {ad}", "tur": "is", "kimden": bot,
                              "_ts": r["started_at"]})
    for c in cik:
        if c["t"] != "dün":
            b["gecmis"].append({"t": c["t"], "metin": "Çıktı hazır: " + c["baslik"], "tur": "cikti", "_ts": c["_mt"]})
            durum["akis"].append({"t": c["t"], "metin": f"{AD[bot]}: {c['baslik']}", "tur": "cikti", "kimden": bot,
                                  "_ts": c["_mt"]})
    b["gecmis"] = [{k: v for k, v in g.items() if k != "_ts"} for g in sorted(b["gecmis"], key=lambda g: -g["_ts"])][:20]
    durum["harcama"]["bugun"] += maliyet
    durum["botlar"].append(b)

# Onay masası: patronun onayını bekleyen taslaklar ~/ofis/onay/<calisan>-<kisa-ad>.md, ilk satır başlık. Patron onaylayınca ya da
# reddedince Müdür dosyayı onay/bitti/ altına taşır.
for f in sorted((OFIS / "onay").glob("*.md"), key=lambda p: p.stat().st_mtime) if (OFIS / "onay").is_dir() else []:
    bot = f.name.split("-", 1)[0].lower()
    if bot not in BOTLAR:
        continue
    try:
        ilk = next((s.strip().lstrip("#").strip() for s in f.read_text(encoding="utf-8", errors="replace").splitlines() if s.strip()), "")
    except OSError:
        continue
    durum["onay"].append({"bot": bot, "baslik": (ilk or sade_ad(f.stem.split("-", 1)[-1]))[:70]})

# Müdür'ün yükseltmeleri (kurulum/yukselt.py): takılan işi Claude Code'a verdiği anlar ekranda görünsün
yk = OFIS / "yukselt"
mudur = next(b for b in durum["botlar"] if b["id"] == "mudur")
for j in sorted((yk / "calisiyor").glob("*.json")) if (yk / "calisiyor").is_dir() else []:
    try:
        bilgi = json.loads(j.read_text())
    except (OSError, ValueError):
        continue
    kim = AD.get(bilgi.get("kim"), "Bir çalışan")
    mudur["durum"], mudur["eylem"] = "calisiyor", "calistiriyor"
    mudur["is"] = f"{kim} takıldı · Claude Code çözüyor"
    durum["akis"].append({"t": saat(bilgi["basla"]), "metin": f"Müdür: {kim} takıldı, işi Claude Code'a verdi", "tur": "is",
                          "kimden": "mudur", "_ts": bilgi["basla"]})
for j in sorted((yk / "bitti").glob("*.json")) if (yk / "bitti").is_dir() else []:
    mt = j.stat().st_mtime
    if mt < bugun_bas:
        continue
    try:
        kim = AD.get(json.loads(j.read_text()).get("kim"), "Bir çalışan")
    except (OSError, ValueError):
        continue
    durum["akis"].append({"t": saat(mt), "metin": f"Müdür: {kim} işini Claude Code ile çözdü", "tur": "teslim", "kimden": "mudur",
                          "_ts": mt})

# Müdür'ün Telegram'a ilettikleri
for f in sorted((OFIS / "ilet" / "gonderildi").glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)[:10]:
    mt = f.stat().st_mtime
    if mt >= bugun_bas:
        kim = AD.get(f.name.split("-", 1)[0], "Ofis")
        durum["akis"].append({"t": saat(mt), "metin": f"Müdür Telegram'a iletti: {kim}", "tur": "teslim", "kimden": "mudur", "_ts": mt})

# Kurulumdan sonra yazılan ya da güncellenen skill'ler (öğrenilen). Kurulumun kopyaladıkları sayılmaz.
isaret = OFIS / ".kurulum-bitti"
esik = max(bugun_bas, isaret.stat().st_mtime if isaret.exists() else simdi)
for skill in list(HH.glob("skills/**/SKILL.md")) + list(HH.glob("profiles/*/skills/**/SKILL.md")):
    if skill.stat().st_mtime > esik:
        durum["skill"] += 1
        durum["akis"].append({"t": saat(skill.stat().st_mtime), "metin": f"Yeni skill: {skill.parent.name}", "tur": "skill",
                              "kimden": skill.relative_to(HH).parts[1] if skill.relative_to(HH).parts[0] == "profiles" else "mudur", "_ts": skill.stat().st_mtime})

durum["akis"] = [{k: v for k, v in a.items() if k != "_ts"} for a in sorted(durum["akis"], key=lambda a: -a["_ts"])][:40]
durum["harcama"]["bugun"] = round(durum["harcama"]["bugun"], 3)
print(json.dumps(durum, ensure_ascii=False))
