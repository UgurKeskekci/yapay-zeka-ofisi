(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const SIRA = ['oyun', 'gundem', 'analist', 'stajyer', 'mudur'];
  const TURLER = { metin: 'metin', gorsel: 'görsel', video: 'video' };
  const sutunlar = new Map(), botlar = new Map(), onbellek = new Map(), gorulen = new Set();
  const pencere = $('okuma');
  let okunan = null, donusOdagi = null, okumaSayaci = 0, ilkDurum = true;
  let acilisSecimi = new URLSearchParams(location.search).get('sec');

  function eleman(tur, sinif = '', metin = '') {
    const e = document.createElement(tur);
    e.className = sinif; e.textContent = metin;
    return e;
  }
  function metinYaz(e, metin) {
    const s = String(metin ?? '');
    if (e.textContent !== s) e.textContent = s;
  }
  function guvenliAdres(yol, taban = location.href) {
    if (typeof yol !== 'string' || !yol.trim()) return null;
    try {
      const u = new URL(yol, taban);
      return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
    } catch { return null; }
  }
  function baglanti(ad, yol, taban) {
    const a = eleman('a', '', ad), adres = guvenliAdres(yol, taban);
    if (adres) a.href = adres;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }
  const kimlik = c => String(c.id || c.yol);
  const surum = c => JSON.stringify([c.yol, c.id, c.t]);
  const renk = bot => /^#[\da-f]{6}$/i.test(bot.renk || '') ? bot.renk : '#89998e';
  const saatDegeri = t => /^\d{2}:\d{2}(?::\d{2})?$/.test(t || '') ? Number(t.replaceAll(':', '').padEnd(6, '0')) : -1;

  // Başarısız istek de saklanır; yalnız "Tekrar dene" ile yenilenir.
  function metniGetir(cikti) {
    const anahtar = surum(cikti);
    if (!onbellek.has(anahtar)) {
      const adres = guvenliAdres(cikti.yol);
      const istek = (adres ? fetch(adres, { cache: 'no-cache' }) : Promise.reject(new Error('Geçersiz dosya yolu')))
        .then(r => { if (!r.ok) throw new Error('Dosya okunamadı'); return r.text(); });
      onbellek.set(anahtar, istek);
    }
    return onbellek.get(anahtar);
  }

  // Markdown yalnız DOM düğümleri üretir. Ham HTML metin olarak kalır.
  function satirIci(metin, taban, derinlik = 0) {
    const kok = document.createDocumentFragment();
    if (derinlik > 8) { kok.append(document.createTextNode(metin)); return kok; }
    const desen = /`([^`]+)`|\[([^\]]+)\]\(([^\s()]*(?:\([^\s()]*\)[^\s()]*)*)\)|\*\*(.+?)\*\*|__(.+?)__|\*([^*]+)\*|(^|\s)(https?:\/\/[^\s<>]+)/g;
    let konum = 0;
    for (const m of metin.matchAll(desen)) {
      kok.append(document.createTextNode(metin.slice(konum, m.index)));
      if (m[1] != null) kok.append(eleman('code', '', m[1]));
      else if (m[2] != null) {
        const a = baglanti('', m[3], taban);
        a.append(satirIci(m[2], taban, derinlik + 1)); kok.append(a);
      } else if (m[4] != null || m[5] != null || m[6] != null) {
        const e = eleman(m[6] != null ? 'em' : 'strong');
        e.append(satirIci(m[4] ?? m[5] ?? m[6], taban, derinlik + 1)); kok.append(e);
      } else {
        const url = m[8].replace(/[.,;:!?\)\]]+$/, '');
        const adres = guvenliAdres(url, taban);
        const youtube = adres && /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(adres).hostname);
        kok.append(document.createTextNode(m[7]), baglanti(youtube ? 'İzle' : url, url, taban), document.createTextNode(m[8].slice(url.length)));
      }
      konum = m.index + m[0].length;
    }
    kok.append(document.createTextNode(metin.slice(konum)));
    return kok;
  }
  function ilkSatir(metin, yedek, yol) {
    const satir = metin.split(/\r?\n/).find(s => s.trim()) || yedek || 'Başlıksız çıktı';
    const duz = satir.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/\s+#+\s*$/, '');
    return satirIci(duz, guvenliAdres(yol) || location.href).textContent;
  }
  function hucreler(satir) {
    let s = satir.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
    const sonuc = []; let hucre = '', kod = false;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '\\' && s[i + 1] === '|') { hucre += '|'; i++; }
      else if (s[i] === '`') { kod = !kod; hucre += s[i]; }
      else if (s[i] === '|' && !kod) { sonuc.push(hucre.trim()); hucre = ''; }
      else hucre += s[i];
    }
    sonuc.push(hucre.trim()); return sonuc;
  }
  function tabloAyraci(satir) {
    return satir.includes('|') && hucreler(satir).every(h => /^:?-{3,}:?$/.test(h));
  }
  function markdown(metin, yol) {
    const kok = document.createDocumentFragment(), satirlar = metin.replace(/\r/g, '').split('\n');
    const taban = guvenliAdres(yol) || location.href;
    const paragraf = []; let listeler = [], sonMadde = null;
    const paragrafBitir = () => {
      if (!paragraf.length) return;
      const p = eleman('p');
      paragraf.splice(0).forEach((s, i) => { if (i) p.append(document.createElement('br')); p.append(satirIci(s, taban)); });
      kok.append(p);
    };
    const listeBitir = () => { listeler = []; sonMadde = null; };
    for (let i = 0; i < satirlar.length; i++) {
      const s = satirlar[i];
      const cit = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(s);
      if (cit) {
        paragrafBitir(); listeBitir();
        const kod = [], kapama = new RegExp('^\\s{0,3}' + cit[1][0] + '{' + cit[1].length + ',}\\s*$');
        while (++i < satirlar.length && !kapama.test(satirlar[i])) kod.push(satirlar[i]);
        const pre = eleman('pre'); pre.tabIndex = 0; pre.setAttribute('aria-label', 'Kod bloğu');
        pre.append(eleman('code', '', kod.join('\n'))); kok.append(pre); continue;
      }
      if (s.includes('|') && i + 1 < satirlar.length && tabloAyraci(satirlar[i + 1])) {
        paragrafBitir(); listeBitir();
        const basliklar = hucreler(s), ayarlar = hucreler(satirlar[++i]);
        const sar = eleman('div', 'tablo-kaydir'); sar.tabIndex = 0; sar.setAttribute('aria-label', 'Tablo, yatay kaydırılabilir');
        const tablo = eleman('table'), thead = eleman('thead'), tbody = eleman('tbody');
        const satirEkle = (degerler, baslik) => {
          const tr = eleman('tr');
          basliklar.forEach((_, n) => {
            const h = eleman(baslik ? 'th' : 'td'); if (baslik) h.scope = 'col';
            const a = ayarlar[n] || '';
            if (a.endsWith(':')) h.style.textAlign = a.startsWith(':') ? 'center' : 'right';
            h.append(satirIci(degerler[n] || '', taban)); tr.append(h);
          });
          (baslik ? thead : tbody).append(tr);
        };
        satirEkle(basliklar, true);
        while (i + 1 < satirlar.length && satirlar[i + 1].trim() && satirlar[i + 1].includes('|')) satirEkle(hucreler(satirlar[++i]), false);
        tablo.append(thead, tbody); sar.append(tablo); kok.append(sar); continue;
      }
      const baslik = /^\s{0,3}(#{1,6})\s+(.+)$/.exec(s);
      const madde = /^(\s*)(?:([-*+])\s+|(\d+)[.)]\s+)(.*)$/.exec(s);
      if (!s.trim()) { paragrafBitir(); listeBitir(); }
      else if (baslik) {
        paragrafBitir(); listeBitir();
        const h = eleman('h' + baslik[1].length); h.append(satirIci(baslik[2].replace(/\s+#+\s*$/, ''), taban)); kok.append(h);
      } else if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(s)) {
        paragrafBitir(); listeBitir(); kok.append(eleman('hr'));
      } else if (/^\s{0,3}>\s?/.test(s)) {
        paragrafBitir(); listeBitir(); const alinti = [];
        do { alinti.push(satirlar[i].replace(/^\s{0,3}>\s?/, '')); i++; } while (i < satirlar.length && /^\s{0,3}>/.test(satirlar[i]));
        i--; const q = eleman('blockquote'); q.append(markdown(alinti.join('\n'), yol)); kok.append(q);
      } else if (madde) {
        paragrafBitir(); const girinti = madde[1].replace(/\t/g, '    ').length, tur = madde[2] ? 'ul' : 'ol';
        while (listeler.length && listeler.at(-1).girinti > girinti) listeler.pop();
        if (listeler.at(-1)?.girinti === girinti && listeler.at(-1).tur !== tur) listeler.pop();
        if (!listeler.length || listeler.at(-1).girinti < girinti) {
          const liste = eleman(tur);
          if (tur === 'ol') liste.start = Number(madde[3]);
          const ebeveyn = listeler.at(-1)?.liste.lastElementChild || kok; ebeveyn.append(liste);
          listeler.push({ girinti, tur, liste });
        }
        sonMadde = eleman('li'); sonMadde.append(satirIci(madde[4], taban)); listeler.at(-1).liste.append(sonMadde);
      } else if (sonMadde && /^\s{2,}\S/.test(s)) {
        sonMadde.append(document.createElement('br'), satirIci(s.trim(), taban));
      } else { listeBitir(); paragraf.push(s); }
    }
    paragrafBitir(); return kok;
  }

  function sutunKur(bot) {
    const sutun = eleman('section', 'sutun'), ust = eleman('header', 'sutun-ust');
    const kim = eleman('div', 'sutun-kimlik'), ad = eleman('h2', '', bot.ad), sayi = eleman('span', 'sutun-sayi', '0');
    ad.id = 'bot-' + bot.id; sutun.setAttribute('aria-labelledby', ad.id);
    sayi.setAttribute('aria-label', '0 çıktı'); kim.append(ad, sayi);
    const rol = eleman('p', 'rol', bot.rol), model = eleman('div', 'model', bot.model);
    ust.append(kim, rol, model);
    const kartlar = eleman('div', 'kartlar'), bos = eleman('p', 'bos', 'Henüz çıktı yok'); kartlar.append(bos);
    sutun.append(ust, kartlar); $('tahta').append(sutun);
    const kayit = { sutun, ad, sayi, rol, model, kartlar, bos, kartlarMap: new Map() };
    sutunlar.set(bot.id, kayit); return kayit;
  }
  function kartGuncelle(kayit, cikti) {
    kayit.cikti = cikti;
    metinYaz(kayit.baslik, cikti.baslik || 'Başlıksız çıktı');
    metinYaz(kayit.saat, cikti.t || ''); metinYaz(kayit.tur, TURLER[cikti.tur] || 'metin');
    kayit.dugum.title = cikti.baslik || 'Başlıksız çıktı';
    if (cikti.tur !== 'metin') return;
    metniGetir(cikti).then(metin => {
      if (kayit.cikti !== cikti) return;
      const baslik = ilkSatir(metin, cikti.baslik, cikti.yol);
      metinYaz(kayit.baslik, baslik); kayit.dugum.title = baslik;
    }).catch(() => { /* Dosya açılınca yeniden deneme seçeneği gösterilir. */ });
  }
  function guncelle(durum) {
    metinYaz($('saat'), durum.saat || '...'); let toplam = 0;
    for (const id of SIRA) {
      const sabit = OfisVeri.botlar.find(b => b.id === id);
      const bot = { ...sabit, ...durum.botlar?.find(b => b.id === id), id };
      bot.ciktilar = [...(bot.ciktilar || [])].sort((a, b) => saatDegeri(b.t) - saatDegeri(a.t));
      botlar.set(id, bot);
      const p = sutunlar.get(id) || sutunKur(bot);
      p.sutun.style.setProperty('--bot-renk', renk(bot));
      metinYaz(p.ad, bot.ad); metinYaz(p.rol, bot.rol); metinYaz(p.model, bot.model);
      p.model.hidden = !bot.model;
      metinYaz(p.sayi, bot.ciktilar.length); p.sayi.setAttribute('aria-label', `${bot.ciktilar.length} çıktı`);
      toplam += bot.ciktilar.filter(c => saatDegeri(c.t) >= 0).length;
      p.bos.hidden = bot.ciktilar.length > 0;
      const mevcut = new Set();
      bot.ciktilar.forEach((cikti, i) => {
        const anahtar = kimlik(cikti), ortakAnahtar = id + ':' + anahtar; mevcut.add(anahtar);
        let k = p.kartlarMap.get(anahtar);
        if (!k) {
          const dugum = eleman('button', 'kart'); dugum.type = 'button';
          const baslik = eleman('span', 'kart-baslik'), alt = eleman('span', 'kart-alt'), saat = eleman('time'), tur = eleman('span', 'tur');
          alt.append(saat, tur); dugum.append(baslik, alt); k = { dugum, baslik, saat, tur };
          dugum.addEventListener('click', () => okumaAc(id, kimlik(k.cikti), dugum));
          if (!ilkDurum && !gorulen.has(ortakAnahtar)) {
            dugum.classList.add('yeni'); dugum.addEventListener('animationend', () => dugum.classList.remove('yeni'), { once: true });
          }
          p.kartlarMap.set(anahtar, k);
        }
        gorulen.add(ortakAnahtar);
        const imza = JSON.stringify(cikti);
        if (k.imza !== imza) { k.imza = imza; kartGuncelle(k, cikti); }
        const yerdeki = p.kartlar.children[i]; if (yerdeki !== k.dugum) p.kartlar.insertBefore(k.dugum, yerdeki || null);
      });
      for (const [anahtar, k] of p.kartlarMap) if (!mevcut.has(anahtar)) { k.dugum.remove(); p.kartlarMap.delete(anahtar); }
    }
    metinYaz($('toplam'), toplam); ilkDurum = false;
    gezinmeGuncelle();
    // Canlı bağlantının boş ilk durumunda seçim kaybolmaz.
    if (acilisSecimi && botlar.get(acilisSecimi)?.ciktilar.length) {
      const id = acilisSecimi; acilisSecimi = null;
      const ilk = botlar.get(id).ciktilar[0];
      okumaAc(id, kimlik(ilk), sutunlar.get(id).kartlarMap.get(kimlik(ilk))?.dugum);
    }
  }

  function gezinmeGuncelle() {
    if (!okunan) return;
    const ciktilar = botlar.get(okunan.bot)?.ciktilar || [], i = ciktilar.findIndex(c => kimlik(c) === okunan.id);
    $('onceki').disabled = i <= 0; $('sonraki').disabled = i < 0 || i >= ciktilar.length - 1;
    metinYaz($('sira'), i < 0 ? 'Dosya listeden kaldırıldı' : `${i + 1} / ${ciktilar.length}`);
  }
  function medyayiTemizle() {
    const video = $('okuma-icerik').querySelector('video');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  }
  function metinGoster(cikti, sira) {
    const alan = $('okuma-icerik'); alan.setAttribute('aria-busy', 'true');
    alan.replaceChildren(eleman('p', '', 'Dosya okunuyor...'));
    metniGetir(cikti).then(metin => {
      if (!pencere.open || sira !== okumaSayaci) return;
      const baslik = ilkSatir(metin, cikti.baslik, cikti.yol), icerik = markdown(metin, cikti.yol);
      metinYaz($('okuma-baslik'), baslik);
      if (/^H[1-6]$/.test(icerik.firstElementChild?.tagName || '') && icerik.firstElementChild.textContent === baslik) icerik.firstElementChild.remove();
      alan.replaceChildren(icerik); alan.setAttribute('aria-busy', 'false');
    }).catch(() => {
      if (!pencere.open || sira !== okumaSayaci) return;
      const tekrar = eleman('button', '', 'Tekrar dene'); tekrar.type = 'button';
      tekrar.addEventListener('click', () => {
        onbellek.delete(surum(cikti)); metinGoster(cikti, sira);
      });
      alan.replaceChildren(eleman('p', '', 'Dosya okunamadı. Dosyayı yeni sekmede açabilir ya da tekrar deneyebilirsiniz.'), tekrar);
      alan.setAttribute('aria-busy', 'false');
    });
  }
  function okumaAc(botId, ciktiId, odak) {
    const bot = botlar.get(botId), cikti = bot?.ciktilar.find(c => kimlik(c) === ciktiId); if (!cikti) return;
    if (!pencere.open) donusOdagi = odak || document.activeElement;
    medyayiTemizle(); okunan = { bot: botId, id: ciktiId }; const sira = ++okumaSayaci;
    pencere.style.setProperty('--bot-renk', renk(bot));
    metinYaz($('okuma-bot'), bot.ad); metinYaz($('okuma-saat'), cikti.t || '');
    metinYaz($('okuma-baslik'), cikti.baslik || 'Başlıksız çıktı');
    const adres = guvenliAdres(cikti.yol);
    $('dosyayi-ac').hidden = !adres;
    if (adres) $('dosyayi-ac').href = adres; else $('dosyayi-ac').removeAttribute('href');
    const alan = $('okuma-icerik'); alan.replaceChildren(); alan.setAttribute('aria-busy', 'false');
    if (!pencere.open) { document.body.classList.add('okuma-acik'); pencere.showModal(); $('kapat').focus(); }
    if (cikti.tur === 'metin') metinGoster(cikti, sira);
    else if (adres) {
      const medya = eleman(cikti.tur === 'video' ? 'video' : 'img');
      if (cikti.tur === 'video') { medya.controls = true; medya.playsInline = true; medya.preload = 'metadata'; }
      else medya.alt = cikti.baslik || 'Çıktı görseli';
      medya.addEventListener('error', () => {
        if (sira !== okumaSayaci || !pencere.open) return;
        alan.replaceChildren(eleman('p', 'medya-hata', 'Dosya yüklenemedi. Üstteki Dosyayı aç bağlantısını kullanabilirsiniz.'));
      }, { once: true });
      medya.src = adres; alan.append(medya);
    } else alan.append(eleman('p', 'medya-hata', 'Dosya yolu geçersiz.'));
    $('okuma-kaydir').scrollTop = 0; gezinmeGuncelle();
  }
  function gezin(adim) {
    if (!okunan) return;
    const bot = botlar.get(okunan.bot), i = bot.ciktilar.findIndex(c => kimlik(c) === okunan.id);
    const hedef = i >= 0 && bot.ciktilar[i + adim];
    if (hedef) okumaAc(bot.id, kimlik(hedef));
  }
  $('kapat').addEventListener('click', () => pencere.close());
  $('onceki').addEventListener('click', () => gezin(-1));
  $('sonraki').addEventListener('click', () => gezin(1));
  pencere.addEventListener('close', () => {
    const bot = okunan && botlar.get(okunan.bot);
    const hedef = donusOdagi?.isConnected ? donusOdagi : bot && sutunlar.get(bot.id).kartlarMap.values().next().value?.dugum;
    okunan = null; okumaSayaci++; medyayiTemizle(); $('okuma-icerik').replaceChildren();
    document.body.classList.remove('okuma-acik'); if (hedef) hedef.focus({ preventScroll: true });
  });
  pencere.addEventListener('click', olay => { if (olay.target === pencere) pencere.close(); });
  pencere.addEventListener('keydown', olay => {
    if (olay.altKey || olay.ctrlKey || olay.metaKey || olay.shiftKey || /INPUT|TEXTAREA|SELECT|VIDEO/.test(olay.target.tagName) || olay.target.isContentEditable) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(olay.key)) return;
    // Kod ve tabloların yatay kaydırması ok tuşlarını kullanabilir.
    const kaydir = olay.target.closest('pre, .tablo-kaydir');
    if (kaydir && kaydir.scrollWidth > kaydir.clientWidth) return;
    olay.preventDefault(); gezin(olay.key === 'ArrowLeft' ? -1 : 1);
  });
  OfisVeri.abone(guncelle);
  OfisVeri.baslat(4000);
})();
