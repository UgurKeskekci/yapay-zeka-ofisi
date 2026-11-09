#!/usr/bin/env bash
# Yapay Zeka Ofisi kurulumu. Hostinger'ın Hermes Agent şablonunda (Docker kapsayıcısı) çalışır.
#
#   bash kurulum/kur.sh          # ofis: 5 çalışan, tarifler, rutinler, isteğe bağlı araç ve depo anahtarı
#   bash kurulum/kur.sh repo     # yapılandırılan depo (GitHub'a depo anahtarı eklendikten sonra)
#
# Ortam değişkenleri README.md'de. OFIS_REPO boşsa depo ve anahtar adımları atlanır.
# Godot yalnız OFIS_GODOT=1 ise indirilir. OFIS_ARACSIZ=1 araç indirmelerini atlar.
set -euo pipefail

KOK="$(cd "$(dirname "$0")/.." && pwd)"
# Git'e girmeyen gerçek ayarlar, örneklerden ayrı tutulur.
if [ -f "$KOK/ozel/ayar.sh" ]; then
  source "$KOK/ozel/ayar.sh"
fi

# hermes kullanıcısıyla çalışmalı (veri onun). Terminal root açıldıysa kullanıcı değiştirilir.
if [ "$(id -u)" = 0 ] && id hermes >/dev/null 2>&1; then
  exec runuser -u hermes -- env HOME="${OFIS_EV:-/opt/data}" HERMES_HOME="${HERMES_HOME:-/opt/data}" \
    PATH="${OFIS_EV:-/opt/data}/.local/bin:/opt/hermes/.venv/bin:/opt/hermes/bin:/usr/local/bin:/usr/bin:/bin" \
    OFIS_GUCLU_MODEL="${OFIS_GUCLU_MODEL:-}" OFIS_UCUZ_MODEL="${OFIS_UCUZ_MODEL:-}" OFIS_REPO="${OFIS_REPO:-}" \
    OFIS_REPO_AD="${OFIS_REPO_AD:-proje}" OFIS_GODOT="${OFIS_GODOT:-0}" \
    OFIS_ARACSIZ="${OFIS_ARACSIZ:-}" OFIS_DIZIN="${OFIS_DIZIN:-}" OFIS_RUTIN="${OFIS_RUTIN:-}" bash "$0" "$@"
fi

HH="${HERMES_HOME:-$HOME/.hermes}"
OFIS="${OFIS_DIZIN:-$HOME/ofis}"
TZ_OFIS="Europe/Istanbul"
GUCLU="${OFIS_GUCLU_MODEL:-gpt-6.1-sol}"
UCUZ="${OFIS_UCUZ_MODEL:-gpt-6-luna}"
REPO="${OFIS_REPO:-}"
REPO_AD="${OFIS_REPO_AD:-proje}"
if [[ ! "$REPO_AD" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]; then
  echo "OFIS_REPO_AD yalnız harf, rakam, kısa tire ve alt çizgi içerebilir; harf veya rakamla başlamalı."
  exit 1
fi
# GitHub SSH adresini bu depoya ait anahtarı kullanan takma ada bağla.
case "$REPO" in
  git@github.com:*) REPO="git@github-$REPO_AD:${REPO#git@github.com:}" ;;
  ssh://git@github.com/*) REPO="ssh://git@github-$REPO_AD/${REPO#ssh://git@github.com/}" ;;
esac
GODOT_SURUM="4.7.2"
PY="$(command -v python3)"

adim()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$1"; }
tamam() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
uyari() { printf '  \033[33m!\033[0m %s\n' "$1"; }

command -v hermes >/dev/null || { echo "hermes bulunamadı. Bu betik Hermes'in kurulu olduğu kapsayıcıda çalışır."; exit 1; }

# ---------------------------------------------------------------- depo (isteğe bağlı)
repo_kur() {
  adim "Proje deposu: $REPO_AD"
  if [ -z "$REPO" ]; then
    uyari "OFIS_REPO boş: depo kurulumu atlandı. Kodla çalışmak için kendi depo adresinizi girin."
    exit 0
  fi
  [ -f "$HOME/.ssh/$REPO_AD" ] || { echo "Önce: bash kurulum/kur.sh (depo anahtarını o üretir)"; exit 1; }
  hedef="$OFIS/repo/$REPO_AD"
  if [ ! -d "$hedef/.git" ]; then
    git clone "$REPO" "$hedef" || { uyari "Klonlanamadı. Depo anahtarı GitHub'a eklendi mi? (Settings > Deploy keys)"; exit 1; }
  fi
  tamam "repo: ~/ofis/repo/$REPO_AD ($(git -C "$hedef" rev-parse --abbrev-ref HEAD))"
  git -C "$hedef" config user.name "Yapay Zeka Ofisi"
  git -C "$hedef" config user.email "ofis@yapay-zeka-ofisi.local"
  # Kilit: bu kopyadan yalnız ofis/ ile başlayan dallar gönderilebilir. main'e yazılamaz.
  cat > "$hedef/.git/hooks/pre-push" <<'KANCA'
#!/bin/sh
while read yerel_ref yerel_sha uzak_ref uzak_sha; do
  case "$uzak_ref" in
    refs/heads/ofis/*) ;;
    *) echo "Ofis kilidi: yalnız ofis/ dallarına gönderilebilir ($uzak_ref reddedildi)." >&2; exit 1 ;;
  esac
done
exit 0
KANCA
  chmod +x "$hedef/.git/hooks/pre-push"
  tamam "kilit: yalnız ofis/ dallarına gönderilebilir"
  if [ "${OFIS_GODOT:-0}" = 1 ] && command -v godot >/dev/null; then
    tamam "Godot projeyi içe aktarıyor (arka planda, günlük: ~/ofis/godot-import.log)"
    (cd "$hedef" && nohup godot --headless --path . --import >"$OFIS/godot-import.log" 2>&1 &) || true
  fi
  exit 0
}
[ "${1:-}" = "repo" ] && repo_kur

# ---------------------------------------------------------------- 1. ofis klasörü
adim "1/5 Ofis klasörü"
mkdir -p "$OFIS"/{ortak,ilet/gonderildi,onay/bitti,fiyatlar,gundem,repo,gecmis} "$OFIS"/ciktilar/{mudur,gundem,analist,oyun,stajyer}
cp "$KOK/botlar/EL-KITABI.md" "$KOK/botlar/rutinler.md" "$OFIS/"
for f in "$KOK"/botlar/ortak/*; do
  ad="$(basename "$f")"
  case "$ad" in
    tercihler.md|is-listesi.md|fiyat-takip.json|sahip.md|sosyal.md) [ -e "$OFIS/ortak/$ad" ] && continue ;;  # sahibin doldurduğu dosyalar ezilmez
  esac
  cp "$f" "$OFIS/ortak/$ad"
done
# Özel ortak dosyaları, örneklerin üstüne kopyalanır; kaynak ozel/ klasörü değişmez.
for f in "$KOK"/ozel/ortak/*; do
  [ -f "$f" ] || continue
  cp "$f" "$OFIS/ortak/$(basename "$f")"
done
tamam "~/ofis: el kitabı, rutinler, ortak bilgiler, çıktı klasörleri"

# SOUL yazımı, çalışan ekleme betiğiyle aynı kuralları kullanır.
source "$KOK/kurulum/ortak.sh"

# ---------------------------------------------------------------- 2. çalışanlar
adim "2/5 Çalışanlar"
soul_yaz "$HH/SOUL.md" mudur
hermes profile rename default "Müdür" >/dev/null 2>&1 || true
tamam "Müdür: ana profil (Telegram'daki muhatap), model $(hermes config get model.default 2>/dev/null || echo '?')"

# Sıralı eşleme eski Bash sürümlerinde de okunabilir; profil ve model seçimleri aynıdır.
mevcut="$(hermes profile list 2>/dev/null || true)"
for b in gundem analist oyun stajyer; do
  case "$b" in
    gundem) model="$UCUZ"; rol="Gündem: X'te resmi hesaplardan yeni model radarı, akşam gündem özeti, X taslağı" ;;
    analist) model="$GUCLU"; rol="Analist: kendi kanal ve rakip analizi, sıradaki video önerisi" ;;
    oyun) model="$GUCLU"; rol="Oyun Stüdyosu: öncelikli proje; hata, kontrol betiği, Claude Code ile düzeltme, PR'a hazır dal" ;;
    stajyer) model="$UCUZ"; rol="Stajyer: fiyat takibi, aylık alışveriş ve sosyal medya fikirleri; en ucuz model, skill deneyi" ;;
  esac
  if ! printf '%s\n' "$mevcut" | grep -qw "$b"; then
    hermes profile create "$b" --clone --no-alias --description "$rol" >/dev/null
  fi
  soul_yaz "$HH/profiles/$b/SOUL.md" "$b"
  hermes -p "$b" config set model.default "$model" >/dev/null
  hermes profile describe "$b" --text "$rol" --overwrite >/dev/null 2>&1 || true
  tamam "${rol%%:*} · $model"
done
# Ek çalışanlar da tekrar kurulumda korunur. Model seçimleri değiştirilmez.
for kaynak in "$KOK"/botlar/*/SOUL.md "$KOK"/ozel/botlar/*/SOUL.md; do
  [ -f "$kaynak" ] || continue
  b="$(basename "$(dirname "$kaynak")")"
  case "$b" in mudur|gundem|analist|oyun|stajyer|_sablon) continue ;; esac
  [[ "$b" =~ ^[a-z][a-z0-9_]*$ ]] || { uyari "Geçersiz çalışan klasörü: $b"; continue; }
  if ! hermes profile list | grep -qw "$b"; then
    hermes profile create "$b" --clone --no-alias --description "$b: özel çalışan" >/dev/null
    hermes -p "$b" config set model.default "$UCUZ" >/dev/null
  fi
  soul_yaz "$HH/profiles/$b/SOUL.md" "$b"
  mkdir -p "$OFIS/ciktilar/$b"
done
for s in "$KOK"/botlar/skills/*/; do
  ad="$(basename "$s")"; mkdir -p "$HH/profiles/analist/skills/$ad"; cp "$s"SKILL.md "$HH/profiles/analist/skills/$ad/"
done
tamam "Analist'e skill: rakip-tarama"

# ---------------------------------------------------------------- 3. rutinler
adim "3/5 Rutinler (Türkiye saati, ${OFIS_RUTIN:-normal})"
# Liste bazen kilit yüzünden boş döner; boşsa birkaç kez yeniden sorulur, yoksa iş çift kaydedilir.
is_var() {
  for _ in 1 2 3 4 5; do
    liste="$(hermes -p "$1" cron list --all 2>/dev/null || true)"
    if printf '%s' "$liste" | grep -q "Name:"; then printf '%s' "$liste" | grep -qF "Name:      $2"; return; fi
    printf '%s' "$liste" | grep -qi "no scheduled jobs\|no jobs" && return 1
    sleep 1
  done
  return 1
}
cron_ekle() {  # profil ad zaman teslim istem [ek seçenekler]
  p="$1"; ad="$2"; zaman="$3"; teslim="$4"; istem="$5"; shift 5
  if is_var "$p" "$ad"; then tamam "var: $ad"; return; fi
  hermes -p "$p" cron create "$zaman" "$istem" --name "$ad" --deliver "$teslim" --timezone "$TZ_OFIS" "$@" >/dev/null
  tamam "$ad · $zaman"
}
CIKTI="Çıktını el kitabındaki gibi ~/ofis/ciktilar/<adın>/<YYYY-AA-GG>-<kisa-ad>.md dosyasına yaz, ilk satır tek cümlelik sonuç olsun."

# Rutin sıklığı: normal (varsayılan) ya da yogun (OFIS_RUTIN=yogun; ofisin videosu bu ayarla çekildi, model kullanımı artar).
if [ "${OFIS_RUTIN:-normal}" = yogun ]; then
  Z_PLAN="30 9 * * *"; Z_BRIFING="0 19 * * *"; Z_RADAR="0 9-23 * * *"; Z_OZET="30 18 * * *"
  Z_ANALIST="0 11,17 * * *"; Z_HATA="0 2,12 * * *"; Z_NOT="0 18 * * *"
else
  Z_PLAN="30 8 * * *"; Z_BRIFING="0 20 * * *"; Z_RADAR="0 9-21/3 * * *"; Z_OZET="30 19 * * *"
  Z_ANALIST="30 7 * * *"; Z_HATA="0 2 * * *"; Z_NOT="0 18 * * *"
fi

# Müdür'ün iletim rutini: ~/ofis/ilet/ kuyruğunu Telegram'a gönderir. Yapay zeka çağırmaz, kuyruk boşsa sessiz.
mkdir -p "$HH/scripts"
cp "$KOK/kurulum/ilet.py" "$HH/scripts/ofis_ilet.py"
if ! is_var default "[bot:mudur] Anlık iletme"; then
  hermes -p default cron create "*/5 * * * *" --name "[bot:mudur] Anlık iletme" --script ofis_ilet.py --no-agent \
    --deliver telegram --timezone "$TZ_OFIS" >/dev/null
fi
tamam "[bot:mudur] Anlık iletme · 5 dakikada bir"

# Yükseltme: takılan işi Müdür sunucudaki Claude Code'a (Opus) verir; sonuç Telegram'a gider. Kuyruk boşsa sessiz.
mkdir -p "$OFIS"/yukselt/{calisiyor,bitti}
cp "$KOK/kurulum/yukselt.py" "$HH/scripts/ofis_yukselt.py"
if ! is_var default "[bot:mudur] Yükseltme"; then
  hermes -p default cron create "* * * * *" --name "[bot:mudur] Yükseltme" --script ofis_yukselt.py --no-agent \
    --deliver telegram --timezone "$TZ_OFIS" >/dev/null
fi
tamam "[bot:mudur] Yükseltme · dakikada bir (takılan iş Claude Code'a)"

# Günün kaydı: ofisin durumu dakikada bir ~/ofis/gecmis/'e yazılır (bilgisayar kapalıyken günün tekrarı için). Sessiz.
cp "$KOK/kurulum/kayit.py" "$HH/scripts/ofis_kayit.py"
if ! is_var default "[bot:mudur] Günün kaydı"; then
  hermes -p default cron create "* * * * *" --name "[bot:mudur] Günün kaydı" --script ofis_kayit.py --no-agent \
    --deliver local --timezone "$TZ_OFIS" >/dev/null
fi
tamam "[bot:mudur] Günün kaydı · dakikada bir"

cron_ekle default "[bot:mudur] Günün planı" "$Z_PLAN" telegram \
  "Bugünün planını çıkar. ~/ofis/rutinler.md'ye bak, her çalışanın bugünkü işini tek satırla yaz. Patrona 5 satırı geçmeyen bir plan gönder. $CIKTI"
cron_ekle default "[bot:mudur] Skill yaz" "30 14 * * *" local \
  "Stajyer'in bugünkü sabah fiyat turunun raporunu (~/ofis/ciktilar/stajyer/) ve izlediği yolu oku. İşe yarayan adımları $HH/profiles/stajyer/skills/fiyat-takip/SKILL.md olarak yaz (name ve description başlığıyla): hangi site, hangi sayfa, fiyat ve geçmiş nereden okunur, neye dikkat edilir. $CIKTI"
cron_ekle default "[bot:mudur] Akşam brifingi" "$Z_BRIFING" telegram \
  "Bugün ~/ofis/ciktilar/ altına gelen bütün raporları oku ve SOUL.md'deki brifing biçimiyle patrona tek mesaj hazırla. Onay bekleyenleri tek tek listele. Stajyer'in skill'siz ve skill'li turunu süre, maliyet ve doğru ürünü bulup bulmadığı açısından iki satırda karşılaştır. $CIKTI"

cron_ekle gundem "[bot:gundem] Model radarı" "$Z_RADAR" local \
  "SOUL.md'deki model radarını çalıştır: ~/ofis/ortak/x-hesaplar.json'daki resmi hesapların son gönderilerine bak. Son turdan bu yana yeni model, sürüm ya da büyük fiyat değişikliği varsa anlık bildirim biçimiyle ~/ofis/ilet/ kuyruğuna ve çıktı klasörüne yaz. Yoksa hiçbir dosya yazma, kısa 'yeni bir şey yok' de."
cron_ekle gundem "[bot:gundem] Akşam özeti" "$Z_OZET" local \
  "Bugün yapay zeka dünyasında olanlardan en önemli 3'ünü ve bir X taslağı hazırla. Taslak onaya gider, paylaşma. $CIKTI"

cron_ekle analist "[bot:analist] Rakip tarama" "$Z_ANALIST" local \
  "Kanalı ve rakipleri tara, sıradaki video önerisini hazırla. rakip-tarama skill'ini kullan; daha iyi bir yöntem bulduysan skill'i güncelle. $CIKTI"

cron_ekle oyun "[bot:oyun] Hata turu" "$Z_HATA" local \
  "SOUL.md'deki hata turunu ~/ofis/ortak/oyunlar.json'daki öncelikli proje için çalıştır. Yerel kopya, dal, iş listesi ve doğrulama komutlarını projenin kod alanlarından al. Önce mağaza yorumlarına ve X'e bak, yeni hata yoksa iş listesindeki en üstteki işi al. Bitince PR'a hazır dalın bağlantısını ~/ofis/ilet/ kuyruğuna da yaz. $CIKTI"
cron_ekle oyun "[bot:oyun] Not ve devlog" "$Z_NOT" local \
  "~/ofis/ortak/oyunlar.json'daki öncelikli projede kod.taban_dal dalına son turdan bu yana ne girdiğini, ofis/ dallarını ve yeni mağaza yorumlarını üç satırda yaz, bir devlog taslağı hazırla. $CIKTI"

cron_ekle stajyer "[bot:stajyer] Fiyat turu (skill'siz)" "0 10 * * *" local \
  "~/ofis/ortak/fiyat-takip.json'daki ürünlerin fiyatını oku ve ~/ofis/fiyatlar/'a kaydet. Skill kullanma, kendi yönteminle yap; raporun başına 'Yöntem: skill'siz' yaz, ne kadar sürdüğünü de yaz. Gerçek bir düşüş varsa ~/ofis/ilet/ kuyruğuna yaz. $CIKTI"
cron_ekle stajyer "[bot:stajyer] Fiyat turu (skill'li)" "0 16 * * *" local \
  "~/ofis/ortak/fiyat-takip.json'daki ürünlerin fiyatını oku ve ~/ofis/fiyatlar/'a kaydet. fiyat-takip skill'in varsa onu kullan ve raporun başına 'Yöntem: skill (fiyat-takip)' yaz, ne kadar sürdüğünü de yaz. Gerçek bir düşüş varsa ~/ofis/ilet/ kuyruğuna yaz. $CIKTI"
cron_ekle stajyer "[bot:stajyer] Aylık alışveriş" "0 10 20 * *" local \
  "aylik işaretli ürünler için en ucuz toplamı bul (kargo dahil), linkleriyle yaz ve ~/ofis/ilet/ kuyruğuna da koy. Satın alma. $CIKTI"

# ---------------------------------------------------------------- 4. araçlar
adim "4/5 Araçlar"
mkdir -p "$HOME/.local/bin"
if [ "${OFIS_ARACSIZ:-0}" = 1 ]; then
  uyari "OFIS_ARACSIZ: Claude Code ve Godot atlandı"
else
  if command -v claude >/dev/null; then tamam "Claude Code zaten kurulu ($(claude --version 2>/dev/null | head -1))"
  else curl -fsSL https://claude.ai/install.sh | bash >/dev/null 2>&1 && tamam "Claude Code kuruldu" || uyari "Claude Code kurulamadı"; fi
  # Hermes'in cron ve çalışan oturumları HOME=/opt/data/home ile açılır; Claude Code girişi $HOME/.claude'da kalırsa onlar
  # giriş bilgisine ulaşamaz. Giriş tek yerde dursun, iki ev de onu görsün.
  if [ -d /opt/data/home ] && [ "$HOME" != /opt/data/home ]; then
    for f in .claude .claude.json; do
      [ -e "/opt/data/home/$f" ] && [ ! -L "/opt/data/home/$f" ] && mv "/opt/data/home/$f" "/opt/data/home/$f.eski"
      ln -sfn "$HOME/$f" "/opt/data/home/$f"
    done
    tamam "Claude Code girişi çalışanlarla paylaşıldı (/opt/data/home)"
  fi
  if [ "${OFIS_GODOT:-0}" != 1 ]; then uyari "Godot atlandı (kurmak için OFIS_GODOT=1)"
  elif command -v godot >/dev/null; then tamam "Godot zaten kurulu"
  else
    gecici="$(mktemp -d)"
    curl -fsSL -o "$gecici/godot.zip" "https://github.com/godotengine/godot/releases/download/${GODOT_SURUM}-stable/Godot_v${GODOT_SURUM}-stable_linux.x86_64.zip"
    "$PY" -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "$gecici/godot.zip" "$gecici"
    mv "$gecici"/Godot_v*_linux.x86_64 "$HOME/.local/bin/godot" && chmod +x "$HOME/.local/bin/godot"
    rm -rf "$gecici"
    tamam "Godot $GODOT_SURUM kuruldu (ekransız çalışır)"
  fi
fi

# ---------------------------------------------------------------- 5. depo anahtarı
adim "5/5 Proje için depo anahtarı"
if [ -z "$REPO" ]; then
  uyari "OFIS_REPO boş: depo ve deploy anahtarı atlandı. Ofis diğer görevlerle çalışabilir."
else
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
[ -f "$HOME/.ssh/$REPO_AD" ] || ssh-keygen -t ed25519 -N "" -C "yapay-zeka-ofisi" -f "$HOME/.ssh/$REPO_AD" -q
grep -Fxq "Host github-$REPO_AD" "$HOME/.ssh/config" 2>/dev/null || cat >> "$HOME/.ssh/config" <<SSH
Host github-$REPO_AD
  HostName github.com
  User git
  IdentityFile ~/.ssh/$REPO_AD
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
SSH
chmod 600 "$HOME/.ssh/config"
tamam "Bu anahtar YALNIZ $REPO_AD deposuna eklenecek (GitHub > repo > Settings > Deploy keys > Allow write access):"
echo; cat "$HOME/.ssh/$REPO_AD.pub"; echo
fi

touch "$OFIS/.kurulum-bitti"
cp "$KOK/kurulum/durum.py" "$OFIS/durum.py"
adim "Ofis kuruldu"
hermes profile list 2>/dev/null | sed 's/^/  /' || true
echo
echo "  Sonra: claude (Claude Code girişi, bir kez)"
if [ -n "$REPO" ]; then
  echo "  Depo anahtarını ekledikten sonra: bash kurulum/kur.sh repo"
fi
