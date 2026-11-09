"use strict";

(() => {
  const params = new URLSearchParams(location.search);
  const theme = params.get("uygulama") === "telegram" ? "telegram" : "whatsapp";
  const requestedSpeed = Number(params.get("hiz") || 1);
  const speed = Number.isFinite(requestedSpeed) && requestedSpeed > 0 ? requestedSpeed : 1;
  const requestedStart = Number(params.get("bas") || 0);
  const start = Number.isFinite(requestedStart) ? Math.max(0, Math.floor(requestedStart)) : 0;
  const autoplay = params.get("oynat") === "1";
  const messages = document.getElementById("messages");
  const phone = document.getElementById("phone");
  const clock = document.getElementById("status-time");
  const subtitle = document.getElementById("contact-subtitle");
  const composer = document.querySelector(".composer");
  const composeText = document.getElementById("compose-text");
  const composeButton = document.getElementById("compose-button");
  const composeIcon = document.getElementById("compose-icon");
  const bots = {
    gundem: { name: "Gündem", color: "#5aa9e6" },
    analist: { name: "Analist", color: "#7bc67b" },
    oyun: { name: "Oyun Stüdyosu", color: "#e07a5f" },
    stajyer: { name: "Stajyer", color: "#b39ddb" }
  };
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("tr", { granularity: "grapheme" }) : null;
  let items = [];
  let contactSubtitle = "";
  let next = 0;
  let phase = null;
  let paused = false;
  let loaded = false;
  let frame = null;
  let previousTime = null;
  let scrollMotion = null;

  document.body.dataset.theme = theme;
  document.documentElement.style.setProperty("--entry-duration", `${180 / speed}ms`);

  function fitPhone() {
    const scale = Math.max(0, Math.min(1, (innerWidth - 32) / 440, (innerHeight - 32) / 940));
    document.documentElement.style.setProperty("--phone-scale", scale);
  }
  fitPhone();
  window.addEventListener("resize", fitPhone);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.classList.add("icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", `#icon-${name}`);
    svg.append(use);
    return svg;
  }

  // Biçimlendirme yalnız metin düğümleriyle yapılır.
  function appendLinks(parent, text) {
    const pattern = /(?:https?:\/\/|\bx\.com\/)[^\s<>]+/giu;
    let offset = 0;
    for (const match of text.matchAll(pattern)) {
      parent.append(document.createTextNode(text.slice(offset, match.index)));
      const link = match[0].replace(/[.,!?;:)}\]]+$/u, "");
      parent.append(element("span", "message-link", link));
      parent.append(document.createTextNode(match[0].slice(link.length)));
      offset = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(offset)));
  }

  function appendFormatted(parent, text) {
    const pattern = /\*\*([\s\S]+?)\*\*/gu;
    let offset = 0;
    for (const match of text.matchAll(pattern)) {
      appendLinks(parent, text.slice(offset, match.index));
      const strong = element("strong");
      appendLinks(strong, match[1]);
      parent.append(strong);
      offset = match.index + match[0].length;
    }
    appendLinks(parent, text.slice(offset));
  }

  function scrollBottom(animate) {
    const target = Math.max(0, messages.scrollHeight - messages.clientHeight);
    if (!animate) {
      scrollMotion = null;
      messages.scrollTop = target;
      return;
    }
    scrollMotion = { from: messages.scrollTop, target, elapsed: 0 };
    schedule();
  }

  function appendItem(item, animate = false) {
    if (Object.hasOwn(item, "ayrac")) {
      messages.append(element("div", "date-divider", String(item.ayrac)));
      return;
    }
    const outgoing = item.kim === "patron";
    const group = element("article", `message-group${outgoing ? " outgoing" : ""}${animate ? " entering" : ""}`);
    group.setAttribute("aria-label", outgoing ? "Patron" : document.getElementById("contact-name").textContent);
    group.addEventListener("animationend", () => group.classList.remove("entering"), { once: true });
    const bubble = element("div", "bubble");
    const bot = bots[item.bot];
    if (bot) {
      const label = element("div", "bot-name", bot.name);
      label.style.color = bot.color;
      bubble.append(label);
    }
    const body = element("div", "message-text");
    appendFormatted(body, String(item.metin || ""));
    const meta = element("div", "message-meta");
    meta.append(element("time", "", String(item.saat || "")));
    if (outgoing) {
      const checks = icon("checks");
      meta.setAttribute("aria-label", `${item.saat || ""}, gönderildi`);
      meta.append(checks);
    }
    bubble.append(body, meta);
    group.append(bubble);
    if (Array.isArray(item.dugmeler) && item.dugmeler.length) {
      const actions = element("div", "message-actions");
      for (const label of item.dugmeler) {
        const button = element("button", "", String(label));
        button.type = "button";
        actions.append(button);
      }
      group.append(actions);
    }
    messages.append(group);
    if (item.saat) clock.textContent = String(item.saat);
  }

  function typing(active) {
    subtitle.textContent = active ? "yazıyor..." : contactSubtitle;
    subtitle.classList.toggle("typing", active);
  }

  function setDraft(text = "") {
    const previousHeight = composer.offsetHeight;
    composeText.replaceChildren(text ? document.createTextNode(text) : element("span", "placeholder", "Mesaj"));
    composer.classList.toggle("has-text", Boolean(text));
    composeIcon.setAttribute("href", text ? "#icon-send" : "#icon-mic");
    composeButton.setAttribute("aria-label", text ? "Gönder" : "Mikrofon");
    composeText.scrollTop = composeText.scrollHeight;
    if (composer.offsetHeight !== previousHeight) scrollBottom(true);
  }

  // Bütün beklemeler aynı saatle ilerler; duraklatmada süre kaybolmaz.
  function prepareNext() {
    typing(false);
    setDraft();
    while (next < items.length && Object.hasOwn(items[next], "ayrac")) {
      appendItem(items[next++]);
      scrollBottom(false);
    }
    if (next >= items.length) {
      phase = null;
      return;
    }
    const item = items[next];
    const plain = String(item.metin || "").replace(/\*\*([\s\S]+?)\*\*/gu, "$1");
    if (item.kim === "patron") {
      const chars = segmenter ? Array.from(segmenter.segment(plain), part => part.segment) : Array.from(plain);
      phase = { kind: "outgoing", elapsed: 0, duration: Math.max(1, chars.length) * 1000 / 18 + 250, chars, shown: 0 };
    } else {
      phase = { kind: "incoming", elapsed: 0, duration: 800 + Math.min(800, Array.from(plain).length * 4) };
      typing(true);
    }
  }

  function revealNext() {
    typing(false);
    setDraft();
    if (next < items.length) appendItem(items[next++], !paused);
    scrollBottom(true);
    phase = next < items.length ? { kind: "gap", elapsed: 0, duration: 1200 } : null;
  }

  function schedule() {
    if (!paused && frame === null && (phase || scrollMotion)) frame = requestAnimationFrame(tick);
  }

  function tick(time) {
    frame = null;
    const delta = previousTime === null ? 0 : (time - previousTime) * speed;
    previousTime = time;
    if (phase) {
      phase.elapsed += delta;
      if (phase.kind === "outgoing") {
        const count = Math.min(phase.chars.length, Math.floor(phase.elapsed * 18 / 1000));
        if (count !== phase.shown) {
          phase.shown = count;
          setDraft(phase.chars.slice(0, count).join(""));
        }
      }
      if (phase.elapsed >= phase.duration) {
        if (phase.kind === "gap") prepareNext();
        else revealNext();
      }
    }
    if (scrollMotion) {
      scrollMotion.elapsed += delta;
      const progress = Math.min(1, scrollMotion.elapsed / 240);
      messages.scrollTop = scrollMotion.from + (scrollMotion.target - scrollMotion.from) * (1 - (1 - progress) ** 3);
      if (progress === 1) scrollMotion = null;
    }
    if (!phase && !scrollMotion) previousTime = null;
    schedule();
  }

  function reset(readyCount) {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
    phase = null;
    scrollMotion = null;
    paused = false;
    phone.classList.remove("paused");
    messages.replaceChildren();
    clock.textContent = "";
    typing(false);
    setDraft();
    next = 0;
    const limit = Math.min(readyCount, items.length);
    while (next < limit) appendItem(items[next++]);
    scrollBottom(false);
  }

  window.addEventListener("keydown", event => {
    if (!loaded || event.altKey || event.ctrlKey || event.metaKey) return;
    if (!["Space", "ArrowRight", "KeyR"].includes(event.code)) return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.code === "Space") {
      paused = !paused;
      phone.classList.toggle("paused", paused);
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
      schedule();
    } else if (event.code === "ArrowRight") {
      // Bekleme aralığında da tam olarak bir sonraki mesaj gösterilir.
      while (next < items.length && Object.hasOwn(items[next], "ayrac")) appendItem(items[next++]);
      revealNext();
      if (paused) scrollBottom(false);
      previousTime = null;
      schedule();
    } else {
      reset(0);
      prepareNext();
      schedule();
    }
  });

  async function readData(file) {
    const url = new URL(file, location.href);
    if (url.origin !== location.origin) throw new Error("Veri dosyası aynı sunucuda olmalı.");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const error = new Error("Mesaj dosyası yüklenemedi.");
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.mesajlar) || !data.kisi ||
        !data.mesajlar.every(item => item && typeof item === "object" &&
          (Object.hasOwn(item, "ayrac") || (typeof item.metin === "string" && ["patron", "mudur"].includes(item.kim))))) {
      throw new Error("Mesaj dosyasının biçimi uygun değil.");
    }
    return { data, sample: url.pathname.endsWith("/mesajlar.ornek.json") };
  }

  async function init() {
    try {
      let result;
      const customFile = params.get("veri");
      if (customFile) result = await readData(customFile);
      else {
        try { result = await readData("mesajlar.json"); }
        catch (error) {
          if (error.status !== 404) throw error;
          result = await readData("mesajlar.ornek.json");
        }
      }
      const { data, sample } = result;
      items = data.mesajlar;
      document.getElementById("contact-name").textContent = String(data.kisi.ad || "Müdür");
      const detail = String(data.kisi.alt || "");
      contactSubtitle = theme === "telegram" ? (detail ? `${detail} · bot` : "bot") : detail;
      document.getElementById("sample-label").hidden = !sample || params.get("temiz") === "1";
      loaded = true;
      reset(autoplay ? start : items.length);
      if (autoplay) {
        prepareNext();
        schedule();
      }
    } catch (error) {
      subtitle.textContent = "Veri yüklenemedi";
      messages.replaceChildren(element("p", "load-error", `${error.message} Dosya yolunu ve JSON içeriğini kontrol edin.`));
    }
  }

  init();
})();
