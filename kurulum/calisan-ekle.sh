#!/usr/bin/env bash
# Kullanım: bash kurulum/calisan-ekle.sh editor "Editör" "Taslakları denetler" [model]
set -euo pipefail
KOK="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$KOK/ozel/ayar.sh" ]; then source "$KOK/ozel/ayar.sh"; fi
if [ "$(id -u)" = 0 ] && id hermes >/dev/null 2>&1; then
  exec runuser -u hermes -- env HOME="${OFIS_EV:-/opt/data}" HERMES_HOME="${HERMES_HOME:-/opt/data}" \
    PATH="${OFIS_EV:-/opt/data}/.local/bin:/opt/hermes/.venv/bin:/opt/hermes/bin:/usr/local/bin:/usr/bin:/bin" \
    OFIS_UCUZ_MODEL="${OFIS_UCUZ_MODEL:-}" OFIS_DIZIN="${OFIS_DIZIN:-}" bash "$0" "$@"
fi
if [ "$#" -lt 3 ] || [ "$#" -gt 4 ]; then
  echo 'Kullanım: bash kurulum/calisan-ekle.sh <kisa-ad> "<Görünen Ad>" "<rol açıklaması>" [model]' >&2
  exit 1
fi
ad="$1"; gorunen="$2"; rol="$3"; model="${4:-${OFIS_UCUZ_MODEL:-gpt-6-luna}}"
if [[ ! "$ad" =~ ^[a-z][a-z0-9_]*$ ]] || [[ "$ad" = default || "$ad" = mudur || "$ad" = ortak || "$ad" = skills ]]; then
  echo 'Kısa ad küçük ASCII harfle başlamalı; yalnız a-z, 0-9 ve alt çizgi içermeli. default, mudur, ortak ve skills ayrılmıştır.' >&2
  exit 1
fi
[ -n "$gorunen" ] && [ -n "$rol" ] && [ -n "$model" ] || { echo 'Ad, rol ve model boş olamaz.' >&2; exit 1; }
command -v hermes >/dev/null || { echo 'Hermes bulunamadı. Hermes kurulu terminali açın.' >&2; exit 1; }
HH="${HERMES_HOME:-$HOME/.hermes}"; OFIS="${OFIS_DIZIN:-$HOME/ofis}"
[ -f "$OFIS/EL-KITABI.md" ] || { echo 'Önce bash kurulum/kur.sh çalıştırın.' >&2; exit 1; }
mevcut="$(hermes profile list)"
if printf '%s\n' "$mevcut" | grep -qw "$ad"; then
  echo "Profil zaten var: $ad. Üzerine yazılmadı. SOUL güncellemek için kur.sh kullanın." >&2
  exit 1
fi
if [ ! -f "$KOK/botlar/$ad/SOUL.md" ]; then
  mkdir -p "$KOK/botlar/$ad"
  python3 - "$KOK/botlar/_sablon/SOUL.md" "$KOK/botlar/$ad/SOUL.md" "$ad" "$gorunen" "$rol" <<'PY'
import sys
from pathlib import Path
kaynak, hedef, ad, gorunen, rol = sys.argv[1:]
metin = Path(kaynak).read_text(encoding="utf-8")
for once, sonra in (("{{KISA_AD}}", ad), ("{{GORUNEN_AD}}", gorunen), ("{{ROL}}", rol)):
    metin = metin.replace(once, sonra)
Path(hedef).write_text(metin, encoding="utf-8")
PY
fi
hermes profile create "$ad" --clone --no-alias --description "$gorunen: $rol" >/dev/null
hermes -p "$ad" config set model.default "$model" >/dev/null
source "$KOK/kurulum/ortak.sh"
soul_yaz "$HH/profiles/$ad/SOUL.md" "$ad"
mkdir -p "$OFIS/ciktilar/$ad"
printf '✓ %s (%s) eklendi. Model: %s\n' "$gorunen" "$ad" "$model"
echo 'Rutin eklenmedi. Rutin örneği ve beş çalışanla sınırlı ekran için docs/04-uyarlama.md dosyasını okuyun.'
