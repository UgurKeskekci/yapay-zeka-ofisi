'use strict';
// Çizim koordinatları 1920 × 1080 sunuma göre sabittir; tüm ofis birlikte küçülür.
const ofis = document.getElementById('ofis');
const tuval = document.getElementById('dunya');
const c = tuval.getContext('2d');
c.imageSmoothingEnabled = false;
const SAHNE_ORANI = 1312 / 1376;
// UST: üst başlık kalkınca sahne bu kadar uzadı; boşluk gökyüzüne verildi, bina aynı yerde çizilir.
const W = 1376, H = 850, UST = 56, ASANSOR_X = 1260;
c.setTransform(SAHNE_ORANI, 0, 0, 1, 0, UST);
const odalar = [
  { id: 'mudur', x: 106, y: 158, w: 1104, kat: 0, duvar: '#505e4c', vurgu: '#a8b58c', ev: 620 },
  { id: 'gundem', x: 106, y: 342, w: 544, kat: 1, duvar: '#405768', vurgu: '#91b2c2', ev: 291 },
  { id: 'analist', x: 666, y: 342, w: 544, kat: 1, duvar: '#455d53', vurgu: '#a0baa0', ev: 851 },
  { id: 'oyun', x: 106, y: 526, w: 544, kat: 2, duvar: '#665044', vurgu: '#d2a184', ev: 291 },
  { id: 'stajyer', x: 666, y: 526, w: 544, kat: 2, duvar: '#595268', vurgu: '#b9a6ca', ev: 851 },
];
const odaBul = id => odalar.find(o => o.id === id);
let durum, zaman = 0, sonKare = 0, oncekiPanel = '', sakinMod = false;
const teslimSirasi = [];
let yolculuk = null;
let asansorY = 158;
const renkler = { is: '#b9c8b5', teslim: '#88b4cc', onay: '#e0bc77', hata: '#e09b87', skill: '#b9a6d7' };
const turAdlari = { is: 'Çalışma', teslim: 'Teslim', onay: 'Onay', hata: 'Tekrar deniyor', skill: 'Yeni skill' };

function boyutlandir() {
  const oran = Math.min(innerWidth / 1920, innerHeight / 1080);
  ofis.style.transform = `scale(${oran})`;
  ofis.style.left = `${(innerWidth - 1920 * oran) / 2}px`;
  ofis.style.top = `${(innerHeight - 1080 * oran) / 2}px`;
}
addEventListener('resize', boyutlandir);
boyutlandir();
function kutu(x, y, w, h, renk) { c.fillStyle = renk; c.fillRect(Math.round(x), Math.round(y), w, h); }
function yazi(metin, x, y, boyut = 18, renk = '#e4e5d2', hizalama = 'left') {
  c.fillStyle = renk; c.font = `${boyut >= 20 ? 600 : 500} ${boyut}px "OfisRakam", "Pixelify Sans", monospace`;
  c.letterSpacing = '.03em';
  c.textAlign = hizalama; c.textBaseline = 'top'; c.fillText(metin, Math.round(x), Math.round(y));
}
function cizgi(noktalar, renk, kalinlik = 4) {
  c.strokeStyle = renk; c.lineWidth = kalinlik; c.beginPath();
  noktalar.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function kisalt(metin, sinir = 46) { return metin.length > sinir ? metin.slice(0, sinir - 3).trimEnd() + '...' : metin; }
function satirlar(metin, genislik, boyut = 18) {
  c.font = `${boyut >= 20 ? 600 : 500} ${boyut}px "OfisRakam", "Pixelify Sans", monospace`;
  c.letterSpacing = '.03em';
  const sonuc = []; let satir = '';
  for (const kelime of metin.split(' ')) {
    const aday = satir ? satir + ' ' + kelime : kelime;
    if (c.measureText(aday).width > genislik && satir) { sonuc.push(satir); satir = kelime; } else satir = aday;
  }
  if (satir) sonuc.push(satir);
  return sonuc;
}
function bitki(x, y) {
  kutu(x, y - 18, 28, 18, '#a87754'); kutu(x - 2, y - 22, 32, 6, '#c08d64');
  kutu(x + 12, y - 64, 4, 42, '#84965d');
  kutu(x - 4, y - 54, 18, 10, '#6e8b5e'); kutu(x + 16, y - 64, 18, 10, '#92a471');
  kutu(x + 16, y - 40, 22, 8, '#6e8b5e');
}
function raf(x, y, w = 110) {
  kutu(x, y, w, 8, '#a28b6a'); kutu(x + 6, y + 8, 4, 10, '#5d5041'); kutu(x + w - 10, y + 8, 4, 10, '#5d5041');
  ['#8fa77e', '#b09a76', '#7896a4', '#c2ad80', '#9687a8'].forEach((r, i) => kutu(x + 10 + i * 13, y - 22 - i % 2 * 4, 9, 22 + i % 2 * 4, r));
}
function masa(x, y, w = 150) {
  kutu(x, y, w, 6, '#b39871'); kutu(x + 4, y + 6, w - 8, 3, '#796b51');
  kutu(x + 10, y + 9, 8, 10, '#6d6554'); kutu(x + w - 18, y + 9, 8, 10, '#6d6554');
  kutu(x + w - 46, y + 9, 30, 10, '#877b61'); kutu(x + w - 36, y + 12, 9, 2, '#c3ad87');
}
function ekranGovde(x, y, w = 68, h = 44) {
  kutu(x, y, w, h, '#222e32'); kutu(x + 4, y + 4, w - 8, h - 8, '#8ca9a0');
  kutu(x + w / 2 - 3, y + h, 6, 7, '#afb4a2'); kutu(x + w / 2 - 15, y + h + 7, 30, 4, '#afb4a2');
}
function sandalye(x, y) {
  kutu(x, y - 34, 22, 28, '#303a3b'); kutu(x - 3, y - 8, 30, 8, '#798176');
  kutu(x + 8, y, 5, 18, '#373e3c'); kutu(x - 2, y + 14, 27, 4, '#373e3c');
}
function odaCiz(o) {
  const { x, y, w } = o;
  kutu(x - 10, y - 8, w + 20, 184, '#242b29');
  kutu(x, y, w, 164, o.duvar);
  kutu(x, y, w, 30, '#2b3634'); kutu(x, y + 30, w, 3, '#7d8771');
  for (let xx = x + 30; xx < x + w; xx += 72) kutu(xx, y + 34, 2, 116, '#ffffff08');
  kutu(x, y + 150, w, 14, '#393f36');
  kutu(x - 6, y + 164, w + 12, 10, '#a0a18a');
  for (let xx = x + 12; xx < x + w; xx += 58) kutu(xx, y + 167, 4, 4, '#5a6659');
  const bot = OfisVeri.botlar.find(b => b.id === o.id);
  yazi(bot.ad, x + 14, y + 3, 23, o.vurgu);
  // Model adı yalnız geniş Müdür odasında başlıkta; diğerlerinde ekip listesinde.
  if (o.id === 'mudur') { c.font = '600 23px "OfisRakam", "Pixelify Sans", monospace'; yazi(bot.model, x + 26 + c.measureText(bot.ad).width, y + 7, 17, '#9fae9f'); }
  const mx = o.ev + 30;
  sandalye(o.ev - 14, y + 145);
  masa(mx, y + 145, 158);
  ekranGovde(mx + 10, y + 94, 90, 40);
  kutu(mx + 4, y + 139, 76, 5, '#d0c7a4');
  kutu(mx + 122, y + 130, 13, 14, '#e0d2ad');
  if (o.id === 'mudur') {
    raf(x + 44, y + 116, 150); bitki(x + 1020, y + 150);
    kutu(x + 245, y + 102, 160, 44, '#798373'); kutu(x + 234, y + 121, 182, 27, '#6b7665');
    kutu(mx + 180, y + 124, 46, 8, '#e4dcb9'); kutu(mx + 182, y + 118, 42, 6, '#a99c7a');
    yazi('Onay', mx + 186, y + 92, 18, '#d6d7b7');
  } else if (o.id === 'gundem') {
    ekranGovde(x + 20, y + 79, 100, 57);
    kutu(x + 30, y + 87, 80, 9, '#b0b6a5');
    kutu(x + 30, y + 103, 32, 24, '#627e8c');
    kutu(x + 69, y + 103, 39, 5, '#c5c9ae');
    kutu(x + 69, y + 115, 31, 5, '#c5c9ae');
    cizgi([[x + 70, y + 78], [x + 58, y + 66]], '#aab6ad', 3);
    raf(x + 420, y + 140, 102);
  } else if (o.id === 'analist') {
    kutu(x + 20, y + 83, 106, 64, '#b8c3a6'); kutu(x + 25, y + 88, 96, 54, '#2e4c44');
    [16, 28, 23, 40, 44].forEach((h, i) => kutu(x + 35 + i * 16, y + 136 - h, 10, h, '#90b88b'));
    raf(x + 420, y + 140, 102);
  } else if (o.id === 'oyun') {
    kutu(x + 28, y + 70, 68, 82, '#343b40'); kutu(x + 22, y + 68, 80, 14, '#d5ab74');
    kutu(x + 36, y + 88, 52, 34, '#182e32'); kutu(x + 46, y + 98, 12, 12, '#a4bb7d');
    kutu(x + 69, y + 104, 10, 8, '#d5997e'); kutu(x + 20, y + 125, 82, 10, '#82755c');
    kutu(x + 34, y + 121, 4, 9, '#e5c394'); kutu(x + 74, y + 123, 6, 4, '#c77c66');
    kutu(x + 440, y + 132, 64, 18, '#c4c5ae');
    kutu(x + 450, y + 136, 12, 4, '#4b5550'); kutu(x + 454, y + 132, 4, 12, '#4b5550');
    kutu(x + 487, y + 136, 5, 5, '#b36f61');
  } else {
    raf(x + 18, y + 94, 112); bitki(x + 34, y + 152);
    kutu(x + 455, y + 124, 22, 22, '#9cae91'); kutu(x + 461, y + 116, 10, 12, '#c2c9a8');
    kutu(x + 459, y + 134, 14, 8, '#728b80');
  }
}

// Sabit toprak ve oda eşyaları bir kez çizilir, animasyonda bu katman kopyalanır.
function arkaPlanCiz() {
  const katmanlar = ['#69543e', '#604c3a', '#554538', '#493e34', '#403a32'];
  katmanlar.forEach((r, i) => kutu(0, 138 + i * 145, W, 145, r));
  let tohum = 24;
  function rastgele() { tohum = (tohum * 1664525 + 1013904223) >>> 0; return tohum / 4294967296; }
  for (let i = 0; i < 640; i++) {
    const x = Math.floor(rastgele() * W / 4) * 4, y = 148 + Math.floor(rastgele() * 670 / 4) * 4;
    const w = 4 + Math.floor(rastgele() * 4) * 4;
    kutu(x, y, w, 4, i % 3 ? '#b69b6a20' : '#171d2028');
  }
  for (let i = 0; i < 75; i++) {
    const x = Math.floor(rastgele() * W / 4) * 4, y = 154 + Math.floor(rastgele() * 642 / 4) * 4;
    const w = 12 + Math.floor(rastgele() * 5) * 4;
    kutu(x + 4, y, w - 8, 5, '#80725a'); kutu(x, y + 5, w, 10, '#766752'); kutu(x + 4, y + 15, w - 8, 4, '#3c3c32');
  }
  // Kablolar makine dairesinden çıkıp her kattaki odalara uzanır.
  [56, 66, 76].forEach((x, i) => {
    cizgi([[x + 240, 796], [x, 796], [x, 214 + i * 12], [106, 214 + i * 12]], ['#819180', '#a28a63', '#787a88'][i], 4);
    for (const y of [366, 550]) cizgi([[x, y + i * 8], [106, y + i * 8]], ['#819180', '#a28a63', '#787a88'][i], 4);
  });
  for (let y = 280; y < 790; y += 72) kutu(50, y, 34, 5, '#c3b491');
  cizgi([[1340, 830], [1340, 252], [1325, 252]], '#807d67', 10);
  for (let y = 280; y < 820; y += 90) kutu(1332, y, 17, 8, '#aaa287');
  odalar.forEach(odaCiz);
  // Asansör boşluğu odaların önünde kesintisiz bir koridordur.
  kutu(1226, 150, 88, 666, '#272e2d'); kutu(1232, 154, 76, 662, '#36403c');
  kutu(1238, 157, 4, 655, '#788373'); kutu(1298, 157, 4, 655, '#788373');
  [158, 342, 526, 710].forEach((y, i) => {
    kutu(1212, y + 163, 108, 10, '#9b9c83'); kutu(1312, y + 60, 17, 27, '#28322e');
    yazi(String(i + 1).padStart(2, '0'), 1320, y + 64, 18, '#c9c6a5', 'center');
  });
  // Makine dairesi: dört fiziksel kabin ve iki büyük, okunur sayaç.
  const y = 710;
  kutu(96, y - 8, 1124, 158, '#262d2b'); kutu(106, y, 1104, 136, '#3b494a');
  kutu(106, y, 1104, 30, '#283334'); yazi('04 / Makine dairesi', 122, y + 5, 19, '#b4c7b5');
  kutu(106, y + 128, 1104, 14, '#899584');
  for (let i = 0; i < 4; i++) {
    const x = 148 + i * 118;
    kutu(x, y + 39, 94, 88, '#202d32'); kutu(x + 4, y + 43, 86, 80, '#526268');
    for (let j = 0; j < 5; j++) {
      kutu(x + 9, y + 48 + j * 14, 76, 10, '#2b3b3f');
      for (let k = 0; k < 5; k++) kutu(x + 16 + k * 7, y + 51 + j * 14, 3, 4, '#7d8980');
    }
    kutu(x + 8, y + 124, 8, 5, '#283032'); kutu(x + 78, y + 124, 8, 5, '#283032');
  }
  kutu(674, y + 44, 290, 72, '#222f31'); kutu(1000, y + 38, 182, 82, '#222f31');
}
const sabitKatman = document.createElement('canvas'); sabitKatman.width = 1312; sabitKatman.height = H + UST;
function arkaPlaniHazirla() {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, tuval.width, tuval.height); c.restore(); arkaPlanCiz();
  const sk = sabitKatman.getContext('2d'); sk.clearRect(0, 0, sabitKatman.width, sabitKatman.height); sk.drawImage(tuval, 0, 0);
}

// Saatten türetilen palet kareler arasında yumuşakça yaklaşır.
let gok = [164, 191, 192];
function yuzeyCiz() {
  const [sa, dk] = (durum.saat || '10:00').split(':').map(Number);
  const saat = sa + dk / 60;
  const duraklar = [[0, [29, 43, 59]], [5, [37, 52, 68]], [7, [164, 191, 192]],
    [16, [164, 191, 192]], [18.5, [156, 126, 118]], [21, [29, 43, 59]], [24, [29, 43, 59]]];
  const i = Math.max(0, duraklar.findIndex((d, n) => n < duraklar.length - 1 && saat >= d[0] && saat < duraklar[n + 1][0]));
  const [bas, bit] = [duraklar[i], duraklar[i + 1]];
  const p = Math.max(0, Math.min(1, (saat - bas[0]) / (bit[0] - bas[0])));
  const hedef = bas[1].map((v, n) => v + (bit[1][n] - v) * p);
  gok = gok.map((v, n) => v + (hedef[n] - v) * .025);
  const gokRenk = `rgb(${gok.map(Math.round).join(',')})`;
  kutu(0, -UST, W, 138 + UST, gokRenk);
  const geceOrani = Math.max(0, Math.min(1, (150 - gok[0]) / 100));
  c.save(); c.globalAlpha = geceOrani;
  [[30, 90], [1020, -30], [1100, 10], [990, 30], [60, -36]].forEach(([x, y]) => kutu(x, y, 3, 3, '#cbd4bd'));
  kutu(36, -24, 28, 28, '#d5dbc3'); kutu(46, -30, 26, 24, gokRenk);
  c.globalAlpha = 1 - geceOrani;
  kutu(40, -24, 34, 34, '#e6d5a2');
  c.restore();
  kutu(0, 112, W, 26, `rgb(${gok.map((v, i) => Math.round(v * .58 + [8, 20, 14][i])).join(',')})`);
  kutu(0, 138, W, 12, '#657c51'); kutu(0, 150, W, 8, '#99815a');
  for (let x = 12; x < W; x += 34) { kutu(x, 132 - x % 3 * 2, 4, 9 + x % 3 * 2, '#526e49'); kutu(x + 6, 136, 4, 7, '#8d9d65'); }
  // Giriş yapısı yüzeyde küçük tutulur; asıl ofis yerin altındadır.
  kutu(1144, 60, 180, 80, '#8f9987'); kutu(1134, 54, 200, 12, '#bcc0a0');
  kutu(1228, 76, 70, 70, '#2b3837'); kutu(1238, 80, 50, 64, '#5a6c66'); kutu(1262, 80, 4, 64, '#2f403d');
  kutu(1160, 79, 46, 27, '#364b4b'); kutu(1164, 83, 38, 19, '#9fb9b0'); kutu(1181, 83, 4, 19, '#536a61');
  kutu(1050, 34, 280, 34, '#293b38'); kutu(1056, 40, 268, 22, '#d2c9a2');
  yazi('Yapay Zeka Ofisi', 1190, 40, 23, '#34483c', 'center');
  kutu(1062, 68, 5, 70, '#6a7662'); kutu(1312, 68, 5, 70, '#6a7662');
  [1012].forEach(x => { kutu(x, 96, 8, 42, '#6c6a4e'); kutu(x - 18, 81, 44, 28, '#5e7f55'); kutu(x - 10, 71, 28, 18, '#75915e'); });
  panoCiz();
  kutu(1094, 128, 50, 8, '#a9aa8d'); kutu(1084, 136, 70, 6, '#c5bb96');
}
// Yüzeydeki pano: ofiste son olan önemli şey (çıktı, onay, skill, hata) tek büyük satırda.
let sonOlay = null;
function panoCiz() {
  const x = 110, y = -36, w = 880, h = 104;
  kutu(x + 70, y + h, 8, 138 - y - h, '#4f5446'); kutu(x + w - 78, y + h, 8, 138 - y - h, '#4f5446');
  const yeni = sonOlay && performance.now() - sonOlay.an < 5000;
  const vurgu = !sonOlay ? '#5b6762' : sonOlay.tur === 'onay' ? '#f0c26e' : sonOlay.tur === 'hata' ? '#e09b87' : sonOlay.tur === 'skill' ? '#c5b2e6' : '#9fd27f';
  kutu(x - 4, y - 4, w + 8, h + 8, yeni ? vurgu : '#2b3634'); kutu(x, y, w, h, '#132021');
  kutu(x + 20, y + 22, 10, 10, vurgu); yazi('SON OLAY', x + 38, y + 18, 18, '#9fae9f');
  yazi(sonOlay?.t || durum.saat || '', x + 20, y + 56, 28, '#cfd6c8');
  const metin = sonOlay?.metin || 'Ofis açıldı, ilk iş bekleniyor';
  c.font = '600 34px "OfisRakam", "Pixelify Sans", monospace';
  let m = metin; while (c.measureText(m).width > w - 180 && m.length > 4) m = m.slice(0, -2);
  if (m !== metin) m = m.trimEnd() + '...';
  yazi(m, x + 160, y + 33, 34, yeni ? vurgu : '#f0ead5');
}
function isEkrani(o, b) {
  const x = o.ev + 44, y = o.y + 98;
  kutu(x, y, 82, 32, '#213938');
  const hareket = Math.floor(zaman * 5) % 3;
  if (b.eylem === 'kurguluyor') {
    ['#c28a76', '#82a78c', '#8b9ebd'].forEach((renk, i) => {
      for (let j = 0; j < 3; j++) kutu(x + 4 + j * 25 + (i % 2) * 4, y + 4 + i * 10, 18 - (j % 2) * 5, 7, renk);
    });
    const ilerleme = b.kurgu ? b.kurgu.ilerleme / 100 : (zaman % 5) / 5;
    kutu(x + 4 + 74 * ilerleme, y + 2, 2, 28, '#f1d9b6');
  } else if (b.eylem === 'calistiriyor') {
    for (let i = 0; i < 4; i++) kutu(x + 5, y + 5 + i * 7, 24 + (i + hareket) % 3 * 14, 3, '#9dca8b');
  } else if (b.eylem === 'geziyor') {
    kutu(x + 3, y + 3, 76, 6, '#adc4bc'); kutu(x + 6, y + 13, 24, 18, '#779f9a');
    [0, 1, 2].forEach(i => kutu(x + 36, y + 13 + i * 7, 36 - i * 4, 3, '#b8c8b5'));
  } else {
    [0, 1, 2].forEach(i => kutu(x + 6, y + 7 + i * 8, 36 + (i + hareket) % 3 * 12, 3, b.durum === 'bosta' ? '#668179' : '#b6cdb0'));
  }
}
// Aynı 28 × 32 piksel insan hem sahnede hem 4 kat portrede kullanılır.
const spriteOnbellegi = new Map();
function sprite(b, yuruyor = false, tasiyor = false, sabit = false) {
  const hareket = sabit ? 0 : Math.floor(zaman * 7) % 2;
  const anahtar = JSON.stringify([b.id, b.cinsiyet, b.sac, b.ten, b.renk, b.eylem, yuruyor, tasiyor, hareket]);
  if (spriteOnbellegi.has(anahtar)) return spriteOnbellegi.get(anahtar);
  const resim = document.createElement('canvas'); resim.width = 28; resim.height = 32;
  const k = resim.getContext('2d');
  const r = (x, y, w, h, renk) => { k.fillStyle = renk; k.fillRect(x, y, w, h); };
  const kadin = b.cinsiyet === 'kadin', ten = b.ten || '#e2b48c', sac = b.sac || '#3d3930';
  const adim = yuruyor ? hareket * 2 : 0;
  r(3, 30, 22, 2, '#25332f');
  if (kadin) {
    r(6, 1, 16, 18, sac);
    if (b.id === 'analist') { r(21, 6, 4, 13, sac); r(20, 6, 4, 2, b.renk); }
  }
  r(8, 23, 5, 7 - adim, '#293d47'); r(16, 23, 5, 7 + adim, '#293d47');
  r(6, 29 - adim, 8, 3, '#202e30'); r(16, 29, 8, 3, '#202e30');
  r(7, 13, 14, kadin ? 13 : 12, b.renk);
  if (kadin) { r(6, 22, 16, 4, b.renk); r(11, 13, 6, 2, ten); r(12, 15, 4, 1, ten); r(13, 16, 2, 1, ten); }
  else { r(13, 14, 2, 11, '#e8dcb2'); r(9, 13, 4, 3, '#e1d7b5'); }
  r(8, 3, 12, 10, ten); r(7, 1, 14, 4, sac);
  r(7, 5, kadin ? 3 : 2, kadin ? 9 : 4, sac);
  r(17, 7, 2, 2, '#303b38'); r(19, 10, 2, 2, ten);
  if (kadin) { r(15, 10, 2, 1, '#d98f7e'); r(17, 11, 2, 1, '#b5574f'); }
  if (b.id === 'analist') { r(11, 7, 10, 3, '#344a49'); r(12, 7, 3, 1, '#bdccc0'); }
  r(3, 14, 5, 9, b.renk); r(3, 22, 4, 3, ten);
  const yaziyor = ['yaziyor', 'kurguluyor', 'calistiriyor'].includes(b.eylem) && !yuruyor;
  const el = yaziyor ? hareket : 0;
  r(20, 14, 4, 7 + el, b.renk); r(22, 20 + el, 5, 3, ten);
  if (tasiyor || b.eylem === 'devrediyor') { r(21, 14, 7, 10, '#e4dcb9'); r(23, 17, 4, 1, '#8e9580'); r(23, 20, 3, 1, '#8e9580'); }
  else if (b.eylem === 'okuyor') { r(19, 16, 9, 9, '#dfd3ae'); r(23, 16, 1, 9, '#918a70'); }
  else if (yaziyor) { r(20, 24, 8, 2, '#c4c7ad'); r(21, 24, 1, 1, '#6d7f73'); r(24, 24, 1, 1, '#6d7f73'); }
  // Canlı veri değiştiğinde önbelleğin sınırsız büyümesini önler.
  if (spriteOnbellegi.size > 160) spriteOnbellegi.clear();
  spriteOnbellegi.set(anahtar, resim); return resim;
}
function adEtiketi(o, b) {
  // Ad ve model oda başlığında. Burada yalnız odasının dışındaki (yürüyen) çalışanın adı yazılır.
  if (o) return;
}
function karakter(b, x, ayak, yuruyor, tasiyor, etiket = true) {
  c.drawImage(sprite(b, yuruyor, tasiyor), Math.round(x - 42), Math.round(ayak - 96), 84, 96);
  if (!etiket) {
    c.font = '600 18px "OfisRakam", "Pixelify Sans", monospace';
    const g = c.measureText(b.ad).width + 14;
    kutu(x - g / 2, ayak - 124, g, 24, '#1d2826'); yazi(b.ad, x, ayak - 121, 18, '#f0ead5', 'center');
  }
  if (onayBekliyor(b)) {
    const y = ayak - 98 - Math.max(0, Math.sin(zaman * 3)) * 5;
    kutu(x + 34, y, 26, 29, '#e3b567'); yazi('!', x + 47, y + 1, 27, '#2b3430', 'center');
  }
  if (b.eylem === 'dusunuyor' && !yuruyor) {
    for (let i = 0; i < 3; i++) kutu(x + 42 + i * 8, ayak - 80, 4, 4, Math.floor(zaman * 3) % 3 === i ? '#ede0b3' : '#939f8b');
  }
}
const DURUM_RENK = { calisiyor: ['ÇALIŞIYOR', '#9fd27f'], dusunuyor: ['DÜŞÜNÜYOR', '#c5b2e6'], onay: ['ONAY BEKLİYOR', '#f0c26e'], bosta: ['BOŞTA', '#8d9a93'] };
function odaDurumu(o, b) {
  const d = onayBekliyor(b) ? 'onay' : (b.durum in DURUM_RENK ? b.durum : 'bosta');
  const [ad, renk] = DURUM_RENK[d];
  const sag = o.x + o.w - 14, y = o.y;
  c.font = '600 17px "OfisRakam", "Pixelify Sans", monospace';
  const g = c.measureText(ad).width + 30;
  kutu(sag - g, y + 5, g, 21, '#1c2423'); kutu(sag - g + 8, y + 12, 8, 8, renk);
  yazi(ad, sag - 8, y + 6, 17, renk, 'right');
  // Adım ilerlemesi: kurgu yüzdesi ya da "2/4" ve küçük kutular
  let x = sag - g - 14;
  if (d !== 'bosta' && b.kurgu) {
    const pay = Math.max(0, Math.min(100, b.kurgu.ilerleme));
    kutu(x - 90, y + 12, 90, 8, '#1c2423'); kutu(x - 90, y + 12, 90 * pay / 100, 8, '#d79b7f');
    yazi(`%${Math.round(pay)}`, x - 98, y + 6, 17, '#e8c6ae', 'right');
  } else if (d !== 'bosta' && b.adimlar?.length) {
    const n = b.adimlar.length, k = Math.min(n, b.adim || 0);
    for (let i = n - 1; i >= 0; i--) { x -= 14; kutu(x, y + 10, 10, 12, i < k ? renk : i === k ? '#e9e2c4' : '#3a4542'); }
    yazi(`${Math.min(k + 1, n)}/${n}`, x - 8, y + 6, 17, '#cfd6c8', 'right');
  }
}
function odaKarart(o, b) {
  if (b.durum !== 'bosta' || onayBekliyor(b)) return;
  c.fillStyle = 'rgba(10, 15, 17, .5)'; c.fillRect(o.x, o.y + 33, o.w, 131);
}
function balon(o, b) {
  if (b.durum === 'bosta' || !b.is) return;
  const x = o.id === 'mudur' ? 830 : o.x + 262, y = o.y + 40;
  const w = o.id === 'mudur' ? 360 : 272;
  const metin = satirlar(kisalt(b.is, 60), w - 20, 20);
  // Uzun sözcükler dahil iki satırlık alanın dışına çıkılmaz.
  if (metin.length > 2) {
    let son = metin.slice(1).join(' ');
    while (c.measureText(son + '...').width > w - 20 && son.length) son = son.slice(0, -1);
    metin.splice(1, metin.length - 1, son.trimEnd() + '...');
  }
  const h = metin.length * 24 + 12;
  const zemin = onayBekliyor(b) ? '#f0c26e' : '#e0ddbf';
  kutu(x - 2, y - 2, w + 4, h + 4, '#293832'); kutu(x, y, w, h, zemin);
  kutu(x + 13, y + h, 10, 4, zemin);
  metin.forEach((s, i) => yazi(s, x + 10, y + 6 + i * 24, 20, '#1f3128'));
}

// Bir karakterin çoklu teslimleri birleştirilir. Tek kabin sırayla taşır.
// Her hedefe yaklaşık 1,5 saniyede gidilir; sonra karakter kendi masasına döner.
function teslimEkle(o) {
  if (sakinMod) return; // sakin modda kimse odasından çıkmaz
  if (o.tur !== 'teslim' || !odaBul(o.kimden) || !odaBul(o.kime) || o.kimden === o.kime) return;
  const son = teslimSirasi[teslimSirasi.length - 1];
  if (son && son.kimden === o.kimden) son.hedefler.push(o.kime);
  else teslimSirasi.push({ kimden: o.kimden, hedefler: [o.kime] });
}
function rotaHazirla(is) {
  const kaynak = odaBul(is.kimden); const rota = [];
  let x = kaynak.ev, y = kaynak.y;
  function ekle(nx, ny, sure, tasiyor, asansor = false, veriyor = false) {
    rota.push({ x, y, nx, ny, sure, tasiyor, asansor, veriyor }); x = nx; y = ny;
  }
  for (const hedef of is.hedefler) {
    const oda = odaBul(hedef);
    ekle(ASANSOR_X, y, .34, true);
    if (y !== oda.y) ekle(ASANSOR_X, oda.y, .38, true, true);
    ekle(oda.ev + 45, oda.y, .38, true);
    ekle(oda.ev + 45, oda.y, .20, true, false, true);
  }
  ekle(ASANSOR_X, y, .34, false);
  if (y !== kaynak.y) ekle(ASANSOR_X, kaynak.y, .38, false, true);
  ekle(kaynak.ev, kaynak.y, .34, false);
  return { ...is, rota, adim: 0, gecen: 0, x: kaynak.ev, y: kaynak.y, tasiyor: true, yuruyor: false };
}
function teslimGuncelle(dt) {
  if (!yolculuk && teslimSirasi.length) yolculuk = rotaHazirla(teslimSirasi.shift());
  if (!yolculuk) return;
  const k = yolculuk; let kalan = dt;
  while (kalan > 0 && yolculuk) {
    const a = k.rota[k.adim], sure = Math.min(kalan, a.sure - k.gecen);
    k.gecen += sure; kalan -= sure;
    const p = Math.min(1, k.gecen / a.sure);
    const yumusak = a.asansor ? p * p * (3 - 2 * p) : p;
    k.x = a.x + (a.nx - a.x) * yumusak; k.y = a.y + (a.ny - a.y) * yumusak;
    k.tasiyor = a.tasiyor && !(a.veriyor && p > .6); k.yuruyor = a.x !== a.nx;
    if (a.asansor || a.nx === ASANSOR_X) asansorY = k.y;
    if (k.gecen >= a.sure) { k.gecen = 0; k.adim++; if (k.adim >= k.rota.length) yolculuk = null; }
  }
}
function asansorCiz() {
  cizgi([[ASANSOR_X + 10, 150], [ASANSOR_X + 10, asansorY + 80]], '#afb29a', 3);
  kutu(1232, asansorY + 76, 76, 88, '#a4ac94'); kutu(1236, asansorY + 80, 68, 80, '#67766a');
  kutu(1236, asansorY + 80, 5, 80, '#cad0af'); kutu(1299, asansorY + 80, 5, 80, '#cad0af');
  kutu(1242, asansorY + 84, 56, 4, '#c9cca8'); kutu(1236, asansorY + 154, 68, 6, '#cad0af');
  if (!yolculuk) kutu(1268, asansorY + 90, 3, 60, '#9aa48d');
}
function sunucuCiz() {
  const cpu = Math.max(0, Math.min(100, durum.sunucu.cpu));
  const ram = Math.max(0, Math.min(100, durum.sunucu.ram));
  // Yük arttıkça ışıkların sıklığı ve yanan ışık sayısı artar; parlama uygulanmaz.
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
    const acik = Math.sin(zaman * (1 + cpu / 9) + i * 3 + j * 2) > 1 - cpu / 55;
    kutu(220 + i * 118, 761 + j * 14, 6, 4, acik ? '#b9cf88' : '#596b57');
  }
  yazi(`CPU  %${Math.round(cpu)}`, 690, 762, 19, '#c0d6a6');
  yazi(`RAM  %${Math.round(ram)}`, 690, 792, 19, '#acc8cc');
  [[cpu, 767, '#a3bd85'], [ram, 797, '#8ab1b3']].forEach(([deger, y, renk]) => {
    for (let i = 0; i < 14; i++) kutu(816 + i * 9, y, 6, 12, i < deger / 100 * 14 ? renk : '#40534e');
  });
  yazi(durum.sunucu.ad, 1130, 716, 18, '#b4c7b5', 'right');
  yazi('Kesintisiz çalışıyor', 1012, 754, 17, '#9fae9f');
  yazi(durum.sunucu.acik || '', 1012, 778, 28, '#e8ead8');
}
function eleman(etiket, sinif, metin) {
  const e = document.createElement(etiket); if (sinif) e.className = sinif; e.textContent = metin; return e;
}
function kare(simdi) {
  const dt = sonKare ? Math.min((simdi - sonKare) / 1000, .05) : 0;
  sonKare = simdi; if (!sakinMod) zaman += dt;
  if (durum) {
    teslimGuncelle(dt); gezginHedefiGuncelle(); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, tuval.width, tuval.height); c.drawImage(sabitKatman, 0, 0); c.restore(); yuzeyCiz();
    odalar.forEach(o => { const b = durum.botlar.find(b => b.id === o.id); if (b) isEkrani(o, b); });
    asansorCiz();
    odalar.forEach(o => {
      const b = durum.botlar.find(b => b.id === o.id); if (!b) return;
      if (yolculuk?.kimden !== b.id) karakter(b, o.ev, o.y + 163, false, false);
      odaKarart(o, b); odaDurumu(o, b);
      balon(o, b);
    });
    if (yolculuk) { const b = durum.botlar.find(b => b.id === yolculuk.kimden); if (b) karakter(b, yolculuk.x, yolculuk.y + 163, yolculuk.yuruyor, yolculuk.tasiyor, false); }
    sunucuCiz();
  }
  requestAnimationFrame(kare);
}

const $ = id => document.getElementById(id);
const onayBekliyor = b => b.durum === 'onay' || (durum?.onay || []).some(o => o.bot === b.id);
const durumAdlari = { calisiyor: 'Çalışıyor', dusunuyor: 'Düşünüyor', bosta: 'Boşta', onay: 'Onay bekliyor' };
Object.assign(renkler, { cikti: '#a8cd8f' });
let seciliId = null, panelParcalari = null, okunan = null, bildirimSayaci;
let ilkVeriGeldi = false, panelDonusOdagi = null;
const metinOnbellegi = new Map(), ciktiZamanlari = new Map(), kurguKareleri = new Map();
const odaDugmeleri = new Map();
const panelKaydirmalari = new Map();

function metinYaz(node, metin) {
  const yeni = String(metin ?? '');
  if (node.textContent !== yeni) node.textContent = yeni;
}
function guvenliAdres(yol, taban = location.href) {
  try {
    const u = new URL(yol, taban);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : null;
  } catch { return null; }
}
function yeniSekme(yol) {
  const adres = guvenliAdres(yol);
  if (adres) window.open(adres, '_blank', 'noopener,noreferrer');
}
function baglanti(yol, baslik) {
  const a = eleman('a', '', baslik);
  const adres = guvenliAdres(yol);
  if (adres) a.href = adres;
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  return a;
}
function dugme(metin, islev, sinif = '') {
  const b = eleman('button', sinif, metin); b.type = 'button'; b.addEventListener('click', islev); return b;
}
function bildir(metin, tur = '') {
  clearTimeout(bildirimSayaci); metinYaz($('bildirim'), metin); $('bildirim').hidden = false;
  $('bildirim').dataset.tur = tur;
  bildirimSayaci = setTimeout(() => { $('bildirim').hidden = true; }, 4000);
}
async function finderdaGoster(cikti) {
  try {
    if (await OfisVeri.finderdaGoster(cikti.yol)) return;
  } catch { /* Yerel Finder yoksa dosya tarayıcıda açılır. */ }
  bildir('Bu sunucuda Finder yok, dosya yeni sekmede açıldı'); yeniSekme(cikti.yol);
}
function metniGetir(yol, kimlik = yol) {
  if (!metinOnbellegi.has(kimlik)) {
    const adres = guvenliAdres(yol);
    const istek = (adres ? fetch(adres) : Promise.reject(new Error('Geçersiz dosya yolu')))
      .then(r => { if (!r.ok) throw new Error('Dosya okunamadı'); return r.text(); })
      .catch(hata => { metinOnbellegi.delete(kimlik); throw hata; });
    metinOnbellegi.set(kimlik, istek);
  }
  return metinOnbellegi.get(kimlik);
}
const kacir = metin => String(metin).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// Ham HTML çalıştırılmaz. Bağlantılarda yalnız http ve https kabul edilir.
function markdown(metin, yol) {
  function satirIci(satir) {
    const parcalar = [];
    const token = html => { parcalar.push(html); return `\u0000${parcalar.length - 1}\u0000`; };
    let sonuc = satir.replace(/\u0000/g, '').replace(/`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)/g, (eslesme, kod, ad, adres) => {
      if (kod != null) return token(`<code>${kacir(kod)}</code>`);
      const url = guvenliAdres(adres, guvenliAdres(yol) || location.href);
      return url ? token(`<a href="${kacir(url)}" target="_blank" rel="noopener noreferrer">${kacir(ad)}</a>`) : ad;
    }).replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_, bas, adres) => {
      const url = guvenliAdres(adres); if (!url) return bas + adres;
      const ad = /youtube\.com|youtu\.be/.test(adres) ? 'İzle' : adres.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40);
      return bas + token(`<a href="${kacir(url)}" target="_blank" rel="noopener noreferrer">${kacir(ad)}</a>`);
    });
    sonuc = kacir(sonuc).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return sonuc.replace(/\u0000(\d+)\u0000/g, (_, n) => parcalar[Number(n)] || '');
  }
  const html = [], paragraf = [];
  let liste = null, kod = null;
  const paragrafBitir = () => { if (paragraf.length) html.push(`<p>${paragraf.splice(0).map(satirIci).join('<br>')}</p>`); };
  const listeBitir = () => { if (liste) { html.push(`</${liste}>`); liste = null; } };
  for (const satir of metin.replace(/\r/g, '').split('\n')) {
    if (/^\s*```/.test(satir)) {
      paragrafBitir(); listeBitir();
      if (kod) { html.push(`<pre><code>${kacir(kod.join('\n'))}</code></pre>`); kod = null; } else kod = [];
      continue;
    }
    if (kod) { kod.push(satir); continue; }
    const baslik = /^(#{1,6})\s+(.+)$/.exec(satir);
    const madde = /^\s*(?:([-*+])\s+|\d+[.)]\s+)(.*)$/.exec(satir);
    if (liste && /^\s{2,}\S/.test(satir) && !madde) {
      // Girintili satır: önceki maddenin devamı (ör. alt satırdaki bağlantı)
      html[html.length - 1] = html[html.length - 1].replace(/<\/li>$/, `<br>${satirIci(satir.trim())}</li>`);
      continue;
    }
    if (baslik) { paragrafBitir(); listeBitir(); html.push(`<h${baslik[1].length}>${satirIci(baslik[2])}</h${baslik[1].length}>`); }
    else if (madde) {
      paragrafBitir(); const tur = madde[1] ? 'ul' : 'ol';
      if (liste !== tur) { listeBitir(); liste = tur; html.push(`<${tur}>`); }
      html.push(`<li>${satirIci(madde[2])}</li>`);
    } else if (!satir.trim()) { paragrafBitir(); listeBitir(); }
    else { listeBitir(); paragraf.push(satir); }
  }
  paragrafBitir(); listeBitir();
  if (kod) html.push(`<pre><code>${kacir(kod.join('\n'))}</code></pre>`);
  return html.join('\n');
}

function ciktiEylemleri(cikti) {
  const satir = eleman('div', 'cikti-eylemler', '');
  satir.append(baglanti(cikti.yol, 'Aç'), dugme("Finder'da göster", () => finderdaGoster(cikti)));
  return satir;
}
function isikAc(cikti) {
  const adres = guvenliAdres(cikti.yol); if (!adres) return;
  metinYaz($('isik-baslik'), cikti.baslik);
  const medya = document.createElement(cikti.tur === 'video' ? 'video' : 'img');
  if (cikti.tur === 'video') {
    medya.controls = true; medya.autoplay = true; medya.muted = false; medya.volume = 1; medya.playsInline = true;
  } else medya.alt = cikti.baslik;
  medya.src = adres;
  medya.addEventListener('error', () => {
    const hata = eleman('div', 'medya-hata', 'Dosya yüklenemedi. '); hata.append(baglanti(cikti.yol, 'Yeni sekmede aç'));
    $('isik-icerik').replaceChildren(hata);
  }, { once: true });
  $('isik-icerik').replaceChildren(medya);
  if (!$('isik-kutusu').open) $('isik-kutusu').showModal();
  if (cikti.tur === 'video') medya.play().catch(() => { /* Tarayıcı oynatmayı engellerse kontroller hazırdır. */ });
}
function isikKapat() { if ($('isik-kutusu').open) $('isik-kutusu').close(); }
$('isik-kapat').addEventListener('click', isikKapat);
$('isik-kutusu').addEventListener('click', olay => { if (olay.target === $('isik-kutusu')) isikKapat(); });
$('isik-kutusu').addEventListener('close', () => {
  const video = $('isik-icerik').querySelector('video');
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  $('isik-icerik').replaceChildren();
});

function okumaAc(cikti) {
  if (!panelParcalari) return;
  const p = panelParcalari;
  if (!okunan) p.listeKaydirma = p.kaydir.scrollTop;
  okunan = { id: cikti.id, yol: cikti.yol };
  p.ayrinti.hidden = true; p.okuma.hidden = false; p.okuma.replaceChildren(); p.kaydir.scrollTop = 0;
  const geri = dugme('← Geri', okumaKapat), baslik = eleman('h3', '', cikti.baslik);
  const icerik = eleman('article', 'markdown', 'Rapor okunuyor...');
  p.okuma.append(geri, baslik, icerik, ciktiEylemleri(cikti)); geri.focus({ preventScroll: true });
  metniGetir(cikti.yol, cikti.id || cikti.yol).then(metin => {
    if (p !== panelParcalari || okunan?.yol !== cikti.yol) return;
    icerik.innerHTML = markdown(metin, cikti.yol);
  }).catch(() => {
    if (p !== panelParcalari || okunan?.yol !== cikti.yol) return;
    icerik.replaceChildren(eleman('p', '', 'Rapor okunamadı. Dosyayı yeni sekmede açabilir ya da tekrar deneyebilirsiniz.'), dugme('Tekrar dene', () => okumaAc(cikti)));
  });
}
function okumaKapat() {
  if (!panelParcalari || !okunan) return;
  okunan = null; panelParcalari.okuma.hidden = true; panelParcalari.ayrinti.hidden = false;
  panelParcalari.kaydir.scrollTop = panelParcalari.listeKaydirma || 0;
  const ilk = panelParcalari.ciktilar.querySelector('button'); if (ilk) ilk.focus({ preventScroll: true });
}
function botSec(id, odakla = true) {
  const bot = durum?.botlar.find(b => b.id === id); if (!bot) return;
  if (seciliId === id) return;
  if (!seciliId) panelDonusOdagi = document.activeElement;
  if (seciliId && panelParcalari && !okunan) panelKaydirmalari.set(seciliId, panelParcalari.kaydir.scrollTop);
  seciliId = id; okunan = null;
  $('genel-paneller').hidden = true; $('bot-paneli').hidden = false;
  panelKur(); botPaneliniGuncelle();
  for (const [kimlik, node] of odaDugmeleri) { node.classList.toggle('secili', kimlik === id); node.setAttribute('aria-pressed', String(kimlik === id)); }
  panelParcalari.kaydir.scrollTop = panelKaydirmalari.get(id) || 0;
  if (odakla) panelParcalari.kapat.focus({ preventScroll: true });
}
function botKapat() {
  if (!seciliId) return;
  if (!okunan) panelKaydirmalari.set(seciliId, panelParcalari.kaydir.scrollTop);
  seciliId = null; okunan = null; panelParcalari = null;
  $('bot-paneli').hidden = true; $('genel-paneller').hidden = false;
  for (const node of odaDugmeleri.values()) { node.classList.remove('secili'); node.setAttribute('aria-pressed', 'false'); }
  if (panelDonusOdagi?.isConnected) panelDonusOdagi.focus({ preventScroll: true });
}
function panelKur() {
  const kok = $('bot-paneli'); kok.replaceChildren();
  const ust = eleman('div', 'bot-ust', ''), portre = document.createElement('canvas');
  portre.width = 112; portre.height = 128; portre.className = 'portre'; portre.setAttribute('aria-hidden', 'true');
  const kimlik = eleman('div', 'bot-kimlik', ''), ad = eleman('h2', '', ''), rol = eleman('div', 'bot-rol', ''), model = eleman('span', 'model', '');
  const kapat = dugme('✕', botKapat, 'kapat'); kapat.setAttribute('aria-label', 'Çalışan panelini kapat');
  kimlik.append(ad, model, rol); ust.append(portre, kimlik, kapat);
  const ozet = eleman('div', 'bot-ozet', ''), rozet = eleman('span', 'durum-rozeti', ''), sayilar = eleman('div', 'bot-sayi', '');
  const maliyet = eleman('strong', '', ''), biten = eleman('strong', '', '');
  sayilar.append(maliyet, document.createTextNode(' bugün · '), biten, document.createTextNode(' iş bitti')); ozet.append(rozet, sayilar);
  const kaydir = eleman('div', 'panel-kaydir', ''); kaydir.tabIndex = 0; kaydir.setAttribute('aria-label', 'Çalışan ayrıntıları, kaydırılabilir');
  const ayrinti = eleman('div', '', ''), okuma = eleman('div', 'okuma', ''); okuma.hidden = true;
  function bolum(baslik) { const b = eleman('section', 'panel-bolum', ''); if (baslik) b.append(eleman('h3', '', baslik)); ayrinti.append(b); return b; }
  const simdi = bolum('Şu an'), is = eleman('p', 'su-an', ''), adimlar = eleman('ol', 'adimlar', ''); simdi.append(is, adimlar);
  const kurgu = bolum(''); kurgu.hidden = true;
  const ciktibolum = bolum('Çıktılar'), ciktilar = eleman('div', 'cikti-listesi', ''); ciktibolum.append(ciktilar);
  const gecmisbolum = bolum('Geçmiş'), gecmis = eleman('ol', 'gecmis', ''); gecmisbolum.append(gecmis);
  kaydir.append(ayrinti, okuma); kok.append(ust, ozet, kaydir);
  panelParcalari = { portre, ad, rol, model, kapat, rozet, maliyet, biten, kaydir, ayrinti, okuma, is, adimlar, kurgu, ciktilar, gecmis, imzalar: {}, ciktiDugumleri: new Map() };
}
function degisince(anahtar, veri, islev) {
  const imza = JSON.stringify(veri);
  if (panelParcalari.imzalar[anahtar] === imza) return;
  panelParcalari.imzalar[anahtar] = imza; islev();
}
function kurguGuncelle(bot) {
  const p = panelParcalari;
  p.kurgu.hidden = !bot.kurgu;
  if (!bot.kurgu) return;
  if (!p.kurguGovde) {
    const baslik = eleman('div', 'kurgu-baslik', ''), oran = eleman('span', 'kurgu-oran', '');
    baslik.append(eleman('h3', '', 'Kurguluyor'), oran);
    const cubuk = eleman('div', 'ilerleme', ''), dolgu = eleman('span', '', ''); cubuk.append(dolgu);
    const serit = eleman('div', 'film-seridi', ''), kafa = eleman('span', 'oynatma-kafasi', ''); serit.append(kafa);
    p.kurgu.append(baslik, cubuk, serit); p.kurguGovde = { oran, dolgu, serit, kafa, resimler: new Map() };
  }
  const k = p.kurguGovde, yuzde = Math.max(0, Math.min(100, Number(bot.kurgu.ilerleme) || 0));
  metinYaz(k.oran, `%${yuzde}`); k.dolgu.style.width = `${yuzde}%`; k.kafa.style.left = `${yuzde}%`;
  k.serit.setAttribute('aria-label', `Kurgu zaman çizelgesi, yüzde ${yuzde}`);
  for (const [i, yol] of (bot.kurgu.kareler || []).entries()) {
    if (k.resimler.has(yol)) continue;
    const img = document.createElement('img'); img.src = guvenliAdres(yol) || ''; img.alt = `Kurgu karesi ${i + 1}`;
    k.resimler.set(yol, img); k.serit.insertBefore(img, k.kafa);
  }
  // Yeni kurgu başlamışsa önceki işin karelerini kaldırır.
  for (const [yol, img] of k.resimler) if (!(bot.kurgu.kareler || []).includes(yol)) { img.remove(); k.resimler.delete(yol); }
}
function ciktiKarti(cikti, bot) {
  const kart = eleman('article', 'cikti-karti', '');
  const goruntu = ['gorsel', 'video'].includes(cikti.tur);
  if (goruntu) {
    const ac = dugme('', () => isikAc(cikti), 'cikti-onizleme'); ac.setAttribute('aria-label', `${cikti.baslik}: önizlemeyi aç`);
    const poster = cikti.poster || kurguKareleri.get(bot.id)?.[0];
    if (cikti.tur === 'gorsel' || poster) {
      const img = document.createElement('img'); img.src = guvenliAdres(cikti.tur === 'gorsel' ? cikti.yol : poster) || ''; img.alt = cikti.baslik; img.loading = 'lazy'; ac.append(img);
      img.addEventListener('error', () => { img.hidden = true; ac.prepend(eleman('p', 'bos', 'Önizleme yüklenemedi. Açmak için tıklayın.')); }, { once: true });
    } else {
      // Kare bilgisi yoksa dosyanın ilk karesi sessiz bir önizleme olarak yüklenir.
      const video = document.createElement('video'); video.src = (guvenliAdres(cikti.yol) || '') + '#t=0.01'; video.preload = 'metadata'; video.muted = true; video.playsInline = true; video.setAttribute('aria-label', 'Videonun ilk karesi'); ac.append(video);
    }
    if (cikti.tur === 'video') ac.append(eleman('span', 'oynat', '▶'));
    kart.append(ac);
  }
  const bilgi = eleman('div', 'cikti-bilgi', ''), baslik = eleman('div', 'cikti-baslik', '');
  baslik.append(dugme(cikti.baslik, () => cikti.tur === 'metin' ? okumaAc(cikti) : isikAc(cikti)));
  const yeni = eleman('span', 'yeni', 'Yeni'); yeni.dataset.cikti = cikti.id; baslik.append(yeni); bilgi.append(baslik);
  if (cikti.tur === 'metin') {
    const onizleme = eleman('p', 'metin-onizleme', 'Önizleme okunuyor...'); bilgi.append(onizleme);
    metniGetir(cikti.yol, cikti.id || cikti.yol).then(metin => {
      onizleme.textContent = metin.split('\n').filter(s => s.trim()).slice(0, 2).map(s => s.replace(/^#+\s*/, '').replace(/\*\*/g, '')).join('\n') || 'Raporu okumak için başlığa tıklayın.';
    }).catch(() => { onizleme.textContent = 'Önizleme okunamadı. Raporu açmak için başlığa tıklayın.'; });
  }
  bilgi.append(eleman('span', 'hazir', `Hazır · ${cikti.t || ''}`), ciktiEylemleri(cikti)); kart.append(bilgi);
  return kart;
}
function ciktilariGuncelle(bot) {
  const p = panelParcalari, c = bot.ciktilar || [], anahtarlar = new Set();
  if (!c.length) {
    if (!p.bosCikti) { p.ciktilar.replaceChildren(eleman('p', 'bos', 'Henüz çıktı yok')); p.bosCikti = true; }
    p.ciktiDugumleri.clear(); return;
  }
  if (p.bosCikti) { p.ciktilar.replaceChildren(); p.bosCikti = false; }
  c.forEach((cikti, i) => {
    const anahtar = String(cikti.id || cikti.yol), imza = JSON.stringify(cikti); anahtarlar.add(anahtar);
    let kayit = p.ciktiDugumleri.get(anahtar);
    if (!kayit || kayit.imza !== imza) {
      const dugum = ciktiKarti(cikti, bot); if (kayit) kayit.dugum.replaceWith(dugum);
      kayit = { dugum, imza }; p.ciktiDugumleri.set(anahtar, kayit);
    }
    const yerdeki = p.ciktilar.children[i];
    if (yerdeki !== kayit.dugum) p.ciktilar.insertBefore(kayit.dugum, yerdeki || null);
    const zaman = ciktiZamanlari.get(anahtar);
    kayit.dugum.querySelector('.yeni').hidden = !zaman || Date.now() - zaman >= 60000;
  });
  for (const [anahtar, kayit] of p.ciktiDugumleri) if (!anahtarlar.has(anahtar)) { kayit.dugum.remove(); p.ciktiDugumleri.delete(anahtar); }
}
function botPaneliniGuncelle() {
  const bot = durum.botlar.find(b => b.id === seciliId); if (!bot || !panelParcalari) return;
  const p = panelParcalari, konum = p.kaydir.scrollTop;
  metinYaz(p.ad, bot.ad); metinYaz(p.rol, bot.rol); metinYaz(p.model, bot.model);
  const botDurumu = onayBekliyor(bot) ? 'onay' : bot.durum;
  metinYaz(p.rozet, durumAdlari[botDurumu] || 'Boşta'); p.rozet.dataset.durum = botDurumu;
  metinYaz(p.maliyet, `$${Number(bot.maliyet || 0).toFixed(3)}`); metinYaz(p.biten, bot.biten || 0);
  degisince('portre', [bot.renk, bot.sac, bot.ten, bot.cinsiyet, bot.eylem], () => {
    const pc = p.portre.getContext('2d'); pc.imageSmoothingEnabled = false; pc.clearRect(0, 0, 112, 128); pc.drawImage(sprite(bot, false, false, true), 0, 0, 112, 128);
  });
  metinYaz(p.is, bot.is || 'Sırada iş bekliyor');
  degisince('adimlar', [bot.adimlar, bot.adim, bot.durum], () => {
    p.adimlar.replaceChildren();
    (bot.adimlar || []).forEach((adim, i) => {
      const li = eleman('li', i < bot.adim ? 'tamam' : i === bot.adim ? 'etkin' : '', '');
      const isaret = eleman('span', 'adim-isaret', i < bot.adim ? '✓' : String(i + 1));
      li.append(isaret, eleman('span', '', adim));
      if (i === bot.adim) {
        li.setAttribute('aria-current', 'step');
        const noktalar = eleman('span', 'uc-nokta', ''); noktalar.setAttribute('aria-label', 'Devam ediyor');
        for (let n = 0; n < 3; n++) noktalar.append(document.createElement('i')); li.append(noktalar);
      }
      p.adimlar.append(li);
    });
  });
  kurguGuncelle(bot); ciktilariGuncelle(bot);
  degisince('gecmis', bot.gecmis || [], () => {
    p.gecmis.replaceChildren();
    if (!bot.gecmis?.length) p.gecmis.append(eleman('li', 'bos', 'Henüz geçmiş yok'));
    for (const olay of bot.gecmis || []) {
      const li = eleman('li', '', ''); li.style.setProperty('--olay-renk', renkler[olay.tur] || renkler.is);
      li.append(eleman('time', '', olay.t), eleman('p', '', olay.metin)); p.gecmis.append(li);
    }
  });
  // Yeni satırlar eklendiğinde okunan konum yerinde kalır. Okuma ve ışık kutusuna dokunulmaz.
  p.kaydir.scrollTop = konum;
}
function ciktiZamanlariniKaydet() {
  const mevcut = new Set();
  for (const bot of durum.botlar) {
    if (bot.kurgu?.kareler?.length) kurguKareleri.set(bot.id, [...bot.kurgu.kareler]);
    for (const cikti of bot.ciktilar || []) {
      const anahtar = String(cikti.id || cikti.yol);
      mevcut.add(anahtar);
      if (ciktiZamanlari.has(anahtar)) continue;
      let gelis = 0;
      if (ilkVeriGeldi) gelis = Date.now();
      else if (/^\d{2}:\d{2}$/.test(cikti.t || '') && /^\d{2}:\d{2}$/.test(durum.saat || '')) {
        const dakika = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
        const yas = (dakika(durum.saat) - dakika(cikti.t) + 1440) % 1440;
        if (yas === 0) gelis = Date.now();
      }
      ciktiZamanlari.set(anahtar, gelis);
    }
  }
  for (const anahtar of ciktiZamanlari.keys()) if (!mevcut.has(anahtar)) ciktiZamanlari.delete(anahtar);
  for (const kimlik of metinOnbellegi.keys()) if (!mevcut.has(String(kimlik))) metinOnbellegi.delete(kimlik);
  ilkVeriGeldi = true;
}
function panelleriGuncelle() {
  ciktiZamanlariniKaydet();
  const goster = (id, metin) => metinYaz($(id), metin);
  goster('saat', durum.saat || '09:58'); goster('sunucu-ad', durum.sunucu.ad);
  goster('calisan', `${durum.botlar.filter(b => b.durum !== 'bosta').length}/${durum.botlar.length}`);
  goster('biten', durum.botlar.reduce((a, b) => a + (b.biten || 0), 0));
  goster('onay-ust', durum.onay.length);
  ekibiGuncelle(); yenilikleriBildir();
  goster('harcama', '$' + durum.harcama.bugun.toFixed(2));
  // Abonelikle çalışan ofiste kalan kredi yoktur (canlı veride null): o kutu gizlenir.
  $('kredi').parentElement.hidden = durum.harcama.kredi == null;
  if (durum.harcama.kredi != null) goster('kredi', '$' + durum.harcama.kredi.toFixed(2));
  goster('skill', durum.skill);
  botPaneliniGuncelle();
  const imza = JSON.stringify(durum.onay);
  if (imza === oncekiPanel) return; oncekiPanel = imza;
  const onay = $('onay'); onay.replaceChildren(); goster('onay-sayi', `${durum.onay.length} bekliyor`);
  if (!durum.onay.length) {
    const bos = eleman('div', 'bekleme', ''); bos.append(eleman('div', 'bekleme-isaret', '✓'), eleman('p', '', 'Masa şimdilik boş.'));
    bos.append(eleman('small', '', 'Botların hazırladığı taslaklar onayınız için burada toplanır.')); onay.append(bos);
  } else durum.onay.forEach(o => {
    const satir = dugme(o.baslik + ' ↗', () => botSec(o.bot), 'onay-satir');
    satir.append(eleman('small', '', `${durum.botlar.find(b => b.id === o.bot)?.ad || o.bot} · Onayınız bekleniyor`)); onay.append(satir);
  });
}

// Sağ sütundaki ekip listesi: satırlar bir kez kurulur, yalnız metinleri değişir.
const ekipSatirlari = new Map();
function ekibiGuncelle() {
  const kok = $('ekip');
  for (const bot of durum.botlar) {
    let s = ekipSatirlari.get(bot.id);
    if (!s) {
      const dugum = dugme('', () => botSec(bot.id), 'ekip-satir');
      const portre = document.createElement('canvas'); portre.width = 56; portre.height = 64; portre.setAttribute('aria-hidden', 'true');
      const govde = eleman('div', '', ''), ust = eleman('div', 'ekip-ust', '');
      const ad = eleman('span', 'ekip-ad', bot.ad), dd = eleman('span', 'ekip-durum', '');
      ad.append(eleman('small', 'ekip-model', bot.model));
      const is = eleman('div', 'ekip-is', ''), son = eleman('div', 'ekip-son', '');
      ust.append(ad, dd); govde.append(ust, is, son); dugum.append(portre, govde); kok.append(dugum);
      s = { dugum, portre, dd, is, son, cizim: '' }; ekipSatirlari.set(bot.id, s);
    }
    const d = onayBekliyor(bot) ? 'onay' : (bot.durum in DURUM_RENK ? bot.durum : 'bosta');
    const [durumAdi, renk] = DURUM_RENK[d];
    s.dugum.dataset.durum = d; s.dugum.style.setProperty('--durum', renk);
    metinYaz(s.dd, durumAdi);
    const ilerleme = bot.kurgu ? ` · %${Math.round(bot.kurgu.ilerleme)}` : '';
    const onayIsi = durum.onay.find(o => o.bot === bot.id);
    const isMetni = d === 'bosta' ? 'Masasında, sıradaki işi bekliyor'
      : d === 'onay' && onayIsi && bot.durum === 'bosta' ? `Onayınızı bekliyor: ${onayIsi.baslik}` : (bot.is || '') + ilerleme;
    metinYaz(s.is, isMetni);
    const sonCikti = (bot.ciktilar || [])[0];
    metinYaz(s.son, sonCikti ? `Son çıktı: ${sonCikti.baslik} · ${sonCikti.t || ''}` : 'Henüz çıktı yok');
    const cizim = JSON.stringify([bot.renk, bot.sac, bot.ten, bot.cinsiyet]);
    if (cizim !== s.cizim) {
      s.cizim = cizim; const pc = s.portre.getContext('2d'); pc.imageSmoothingEnabled = false;
      pc.clearRect(0, 0, 56, 64); pc.drawImage(sprite(bot, false, false, true), 0, 0, 56, 64);
    }
  }
}
// Yeni çıktı ya da onay gelince sahnenin altında büyük bir bildirim çıkar.
let bilinenCiktilar = null, bilinenOnay = null, bilinenAkis = null;
function olayYaz(metin, tur) { sonOlay = { metin, tur, t: durum.saat, an: performance.now() }; }
function yenilikleriBildir() {
  const ciktilar = new Map(), onaylar = new Set(durum.onay.map(o => o.bot + '|' + o.baslik));
  for (const b of durum.botlar) for (const k of b.ciktilar || []) ciktilar.set(String(k.id || k.yol), [b, k]);
  if (bilinenCiktilar) {
    for (const [id, [b, k]] of ciktilar) if (!bilinenCiktilar.has(id)) olayYaz(`${b.ad}: ${k.baslik} hazır`, 'cikti');
    for (const o of durum.onay) if (!bilinenOnay.has(o.bot + '|' + o.baslik)) olayYaz(`Onay bekliyor: ${o.baslik}`, 'onay');
    const ilk = durum.akis[0];
    if (ilk && ilk !== bilinenAkis && ['skill', 'hata'].includes(ilk.tur) && JSON.stringify(ilk) !== bilinenAkis) olayYaz(ilk.metin, ilk.tur);
  }
  bilinenAkis = JSON.stringify(durum.akis[0] || null);
  bilinenCiktilar = new Set(ciktilar.keys()); bilinenOnay = onaylar;
}

for (const oda of odalar) {
  const bot = OfisVeri.botlar.find(b => b.id === oda.id);
  const hedef = dugme('', () => botSec(oda.id), 'oda-hedefi');
  hedef.style.left = `${oda.x * SAHNE_ORANI}px`; hedef.style.top = `${oda.y + UST}px`;
  hedef.style.width = `${oda.w * SAHNE_ORANI}px`; hedef.style.height = '174px';
  hedef.title = `${bot.ad}: çalışan panelini aç`;
  hedef.setAttribute('aria-label', hedef.title); hedef.setAttribute('aria-pressed', 'false'); hedef.setAttribute('aria-controls', 'bot-paneli');
  $('sahne').append(hedef); odaDugmeleri.set(oda.id, hedef);
}
// Teslim sırasında odasının dışına çıkan karakter de tıklanabilir kalır.
const gezginHedef = dugme('', () => { if (yolculuk) botSec(yolculuk.kimden); }, 'oda-hedefi gezgin-hedef');
gezginHedef.hidden = true; gezginHedef.tabIndex = -1; $('sahne').append(gezginHedef);
function gezginHedefiGuncelle() {
  gezginHedef.hidden = !yolculuk;
  if (!yolculuk) return;
  gezginHedef.style.left = `${(yolculuk.x - 40) * SAHNE_ORANI}px`;
  gezginHedef.style.top = `${yolculuk.y + 80 + UST}px`;
  gezginHedef.style.width = `${80 * SAHNE_ORANI}px`; gezginHedef.style.height = '84px';
  gezginHedef.setAttribute('aria-label', `${durum.botlar.find(b => b.id === yolculuk.kimden)?.ad}: çalışan panelini aç`);
}
// Sakin mod: kimse yürümez, yazma/ışık/ünlem hareketleri durur; veri ve yazılar güncellenmeye devam eder.
function sakinAyarla(acik) {
  sakinMod = acik; document.body.classList.toggle('sakin', acik);
  if (acik) { teslimSirasi.length = 0; yolculuk = null; asansorY = 158; }
  metinYaz($('sakin-durum'), acik ? 'açık' : 'kapalı'); $('sakin-dugme').setAttribute('aria-pressed', String(acik));
  try { localStorage.setItem('ofis-sakin', acik ? '1' : '0'); } catch {}
}
$('sakin-dugme').addEventListener('click', () => sakinAyarla(!sakinMod));
{ let ilk = false; try { ilk = localStorage.getItem('ofis-sakin') === '1'; } catch {}
  const q = new URLSearchParams(location.search).get('sakin'); if (q != null) ilk = q === '1'; sakinAyarla(ilk); }
addEventListener('keydown', olay => {
  if (olay.key === 'Escape') {
    if ($('isik-kutusu').open) { olay.preventDefault(); isikKapat(); }
    else botKapat();
    return;
  }
  if ($('isik-kutusu').open || olay.altKey || olay.ctrlKey || olay.metaKey || /INPUT|TEXTAREA|SELECT/.test(olay.target?.tagName || '') || olay.target?.isContentEditable) return;
  if (olay.key === 'm' || olay.key === 'M') { olay.preventDefault(); sakinAyarla(!sakinMod); return; }
  if (/^[1-5]$/.test(olay.key)) { olay.preventDefault(); botSec(OfisVeri.botlar[Number(olay.key) - 1].id); }
});

OfisVeri.abone(d => { durum = d; panelleriGuncelle(); });
OfisVeri.olay(teslimEkle);
// Font yüklenince sabit oda tabelaları da Türkçe karakterlerle yeniden çizilir.
arkaPlaniHazirla();
Promise.all([document.fonts.load('600 20px OfisRakam', '0'), document.fonts.load('600 20px "Pixelify Sans"', 'Ağ')]).catch(() => {}).then(arkaPlaniHazirla);
document.fonts.ready.then(arkaPlaniHazirla);
OfisVeri.baslat(Number(new URLSearchParams(location.search).get("hiz")) || 1000);
requestAnimationFrame(kare);
// ?sec=oyun ile açılışta bir çalışanın paneli açık gelir (kayıt ve ekran görüntüsü için).
{ const sec = new URLSearchParams(location.search).get('sec'); if (sec) setTimeout(() => botSec(sec), 300); }
