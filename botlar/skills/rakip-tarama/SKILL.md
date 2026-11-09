---
name: rakip-tarama
description: YouTube kanalını ve rakip kanalları akışlarından tarayıp patlayan videoları ve sıradaki video önerisini çıkarır. Rakip analizi, kanal analizi, "sıradaki video ne olsun" işlerinde kullan.
---

# Rakip tarama

Analist ve Stajyer bu adımları sırayla izler. Adım atlanmaz, sayı tahmin edilmez.

## 1. Veriyi topla

1. `ortak/rakipler.json`'daki her kanal ve kendi kanal için akışı indir:
   `https://www.youtube.com/feeds/videos.xml?channel_id=<id>`
2. Her `<entry>` için şunları al: başlık (`title`), tarih (`published`), bağlantı (`link href`),
   izlenme (`media:statistics views`).
3. Bir akış açılmazsa kanalı "okunamadı" listesine yaz ve devam et. Tekrar denemeyi bir kez yap.

## 2. Hesapla

1. Her kanal için son 15 videonun izlenme **ortancasını** hesapla (ortalama değil; tek patlayan video ortalamayı bozar).
2. Son 7 günde yayınlanan her video için: `oran = izlenme / kanal ortancası`.
3. Videonun yaşı 2 günden azsa oranı "erken" diye işaretle; yeni videonun izlenmesi henüz oturmamıştır.
4. `oran >= 2` olanlar patlayan videodur. Orana göre sırala.

## 3. Konuyu çıkar

1. Patlayan videoların başlıklarından ana konuyu tek kelime öbeğiyle yaz (ör. "Hermes Agent kurulumu", "model karşılaştırma").
2. Aynı konu birden çok kanalda patladıysa bu güçlü sinyaldir; kaç kanalda olduğunu yaz.
3. Kendi kanalın son 15 başlığına bak: bu konuyu patron zaten yaptıysa "yapıldı" diye işaretle.

## 4. Öneriyi yaz

Patronun içerik yaklaşımını `ortak/sahip.md` dosyasından oku. Öneri bu yaklaşıma ve kanalın konularına uymalı.

```
Taranan: <n> kanal, son 7 günde <m> video. Okunamayan: <liste ya da yok>
Patlayanlar:
1. <kanal> "<başlık>" ortancanın <oran> katı (<izlenme> izlenme) <bağlantı>
2. ...
Ortak konu: <konu> (<k> kanalda)

Sıradaki video önerisi:
Başlık: ...
Neden şimdi: <yukarıdaki sayılarla>
Patronun farkı: <sahip.md ile uyumlu özgün yaklaşım>
İlk 30 saniye: ...
```

## Kontrol listesi (teslimden önce)

- [ ] Her sayının bir videoya ya da hesaba dayandığını kontrol et.
- [ ] Her patlayan videonun bağlantısı var.
- [ ] Öneri, patronun yapmadığı bir konu ya da yaptığı konuya yeni bir açı.
