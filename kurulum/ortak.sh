#!/usr/bin/env bash
# Kurulum ve çalışan eklemenin ortak SOUL yazımı. Tek başına çalıştırılmaz.
soul_yaz() {
  local hedef="$1" rol="$2" kaynak="$KOK/botlar/$2/SOUL.md"
  if [ -f "$KOK/ozel/botlar/$rol/SOUL.md" ]; then
    kaynak="$KOK/ozel/botlar/$rol/SOUL.md"
  fi
  [ -f "$kaynak" ] || { echo "SOUL kaynağı bulunamadı: $rol" >&2; return 1; }
  mkdir -p "$(dirname "$hedef")"
  if [ -f "$hedef" ] && [ ! -f "$hedef.ilk" ]; then cp "$hedef" "$hedef.ilk"; fi
  {
    echo '<!-- Yapay Zeka Ofisi: kurulum -->'
    printf 'Ofis klasörün %s. Metindeki ~/ofis ve ortak/ yollarını bu klasöre göre çöz.\n' "$OFIS"
    printf 'Çıktı klasörün %s/ciktilar/%s/. Her işten önce EL-KITABI.md, rutinler.md ve ortak/tercihler.md dosyalarını oku.\n' "$OFIS" "$rol"
    printf 'Hemen iletilecek özeti %s/ilet/%s-<YYYYAAGG-SSDD>.md olarak da yaz. İletim rutini 5 dakikada bir Telegram’a gönderir.\n\n' "$OFIS" "$rol"
    cat "$kaynak"
    printf '\n---\n\n'
    cat "$KOK/botlar/EL-KITABI.md"
  } > "$hedef"
}
