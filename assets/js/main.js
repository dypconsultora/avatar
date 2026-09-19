/* =========================================================
   AVATAR INFORMÁTICA — sistema de movimiento (GSAP 3.15)
   ScrollSmoother · ScrollTrigger · SplitText · ScrambleText · DrawSVG
   ========================================================= */
(() => {
  "use strict";

  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Modo día / noche (funciona aunque falle la CDN)
     --------------------------------------------------------- */
  (function theme() {
    const btn = $("#theme-toggle");
    if (!btn) return;
    const meta = $('meta[name="theme-color"]');
    const noMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sync = () => {
      const light = html.dataset.theme === "light";
      btn.setAttribute("aria-label", light ? "Activar modo noche" : "Activar modo día");
      if (meta) meta.setAttribute("content", light ? "#f3f4ec" : "#060705");
    };
    const apply = (t) => {
      html.dataset.theme = t;
      try { localStorage.setItem("avatar-theme", t); } catch (e) { /* almacenamiento no disponible */ }
      sync();
    };
    sync();
    btn.addEventListener("click", () => {
      const next = html.dataset.theme === "light" ? "dark" : "light";
      if (!document.startViewTransition || noMotion) { apply(next); return; }
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const vt = document.startViewTransition(() => apply(next));
      vt.ready.then(() => {
        html.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
          { duration: 1000, easing: "cubic-bezier(0.76, 0, 0.24, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      });
    });
  })();

  // Si la CDN falla, el sitio queda usable y estático.
  if (!window.gsap || !window.ScrollTrigger) {
    html.classList.add("is-ready");
    const l = $("#loader");
    if (l) l.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, ScrambleTextPlugin, DrawSVGPlugin);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const rnd = gsap.utils.random;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  let smoother = null;
  if (!reduce) {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.15,
      effects: true,
      smoothTouch: false,
    });
    smoother.paused(true);
  }

  /* ---------------------------------------------------------
     Scroll a anclas
     --------------------------------------------------------- */
  function scrollToTarget(hash) {
    const target = hash === "#top" ? 0 : $(hash);
    if (target === null) return;
    if (smoother) {
      smoother.scrollTo(target, true, "top top");
    } else {
      const y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
  }

  function setMotivo(value) {
    const select = $("#motivo");
    if (!select) return;
    const opt = [...select.options].find((o) => o.value === value || o.text === value);
    if (opt) {
      select.value = opt.value || opt.text;
      const field = select.closest(".field");
      field.classList.remove("is-flash");
      void field.offsetWidth;
      field.classList.add("is-flash");
    }
  }

  /* ---------------------------------------------------------
     Preparación de DOM
     --------------------------------------------------------- */
  function buildCircuit() {
    const svg = $("#circuit");
    if (!svg) return { traces: [], pulses: [], pads: [] };
    const NS = "http://www.w3.org/2000/svg";
    const W = 1440, H = 900, cx = W / 2, n = 34;
    const traces = [], pulses = [], pads = [];
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1)) * 2 - 1;
      const at = Math.abs(t);
      const x0 = cx + t * 150;
      const y1 = H - 110 - (1 - at) * 260;
      const x2 = cx + t * 680 + rnd(-6, 6);
      const y2 = y1 - Math.abs(x2 - x0);
      const y3 = Math.max(10, y2 - rnd(80, Math.max(90, y2 - 10)));
      const d = `M${x0.toFixed(1)} ${H + 10}V${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}V${y3.toFixed(1)}`;

      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("class", "trace");
      svg.appendChild(p);
      traces.push(p);

      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x2.toFixed(1));
      c.setAttribute("cy", y3.toFixed(1));
      c.setAttribute("r", "3.2");
      c.setAttribute("class", "pad");
      svg.appendChild(c);
      pads.push(c);

      if (i % 2 === 0 || Math.random() > 0.6) {
        const q = document.createElementNS(NS, "path");
        q.setAttribute("d", d);
        q.setAttribute("class", "pulse");
        svg.appendChild(q);
        pulses.push(q);
      }
    }
    return { traces, pulses, pads };
  }

  function buildGeoDots() {
    const g = $(".cover-geo .dots");
    if (!g) return;
    const NS = "http://www.w3.org/2000/svg";
    for (let x = 12; x < 400; x += 14) {
      for (let y = 12; y < 220; y += 14) {
        const v = Math.sin(x * 0.021) * 1.1 + Math.cos(y * 0.035 + x * 0.008) * 0.9;
        if (v > 0.1) {
          const c = document.createElementNS(NS, "circle");
          c.setAttribute("cx", x);
          c.setAttribute("cy", y);
          c.setAttribute("r", v > 1.1 ? 2.2 : 1.4);
          g.appendChild(c);
        }
      }
    }
  }

  function prepareTyping() {
    const code = $("#code");
    if (!code) return [];
    const chars = [];
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      for (const ch of node.textContent) {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        frag.appendChild(s);
        chars.push(s);
      }
      node.replaceWith(frag);
    });
    return chars;
  }

  /* ---------------------------------------------------------
     Editor: tipeo de código + terminal
     --------------------------------------------------------- */
  function typeCode(chars) {
    const termCaret = $("#term-caret");
    const outs = $$(".term-out");
    gsap.set(outs, { opacity: 0, y: 6 });
    gsap.set(termCaret, { display: "none" });

    const caret = document.createElement("span");
    caret.className = "caret";
    if (chars[0]) chars[0].before(caret);

    let shown = 0;
    const state = { i: 0 };
    const tl = gsap.timeline();
    tl.to(state, {
      i: chars.length,
      duration: chars.length * 0.0095,
      ease: "power1.inOut",
      onUpdate() {
        const n = Math.floor(state.i);
        while (shown < n) chars[shown++].classList.add("on");
        if (shown > 0) chars[shown - 1].after(caret);
      },
      onComplete() {
        chars.forEach((c) => c.classList.add("on"));
        caret.remove();
        gsap.set(termCaret, { display: "inline-block" });
      },
    });

    const cmd = "avatar deploy --entorno=produccion";
    const cmdEl = $("#term-cmd");
    const c2 = { i: 0 };
    tl.to(c2, {
      i: cmd.length,
      duration: 1.1,
      ease: "none",
      onUpdate() { cmdEl.textContent = cmd.slice(0, Math.round(c2.i)); },
    }, "+=0.25");
    tl.to(outs, { opacity: 1, y: 0, duration: 0.6, stagger: 0.35, ease: "expo.out" }, "+=0.3");
    return tl;
  }

  /* ---------------------------------------------------------
     Preloader
     --------------------------------------------------------- */
  function runLoader(onExit) {
    const loader = $("#loader");
    const num = $("#loader-num");
    const lines = $$("[data-loader-line]");
    const texts = lines.map((l) => l.textContent);
    const word = $(".loader__word");
    const brs = $$(".loader__br");

    gsap.set(lines, { opacity: 0 });
    gsap.set(word, { clipPath: "inset(0 50% 0 50%)" });
    const half = word.offsetWidth / 2;
    gsap.set(brs[0], { x: half });
    gsap.set(brs[1], { x: -half });
    gsap.set(loader, { clipPath: "inset(0% 0% 0% 0%)" });

    const counter = { v: 0 };
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.to(counter, {
      v: 100, duration: 2, ease: "power2.inOut",
      onUpdate() { num.textContent = String(Math.round(counter.v)).padStart(3, "0"); },
    }, 0)
      .to("#loader-bar", { scaleX: 1, duration: 2, ease: "power2.inOut" }, 0)
      .to(brs, { x: 0, duration: 1.3, ease: "expo.inOut" }, 0.35)
      .to(word, { clipPath: "inset(0 0% 0 0%)", duration: 1.3, ease: "expo.inOut" }, 0.35);

    lines.forEach((l, i) => {
      tl.set(l, { opacity: 1 }, 0.1 + i * 0.42)
        .to(l, { duration: 0.5, scrambleText: { text: texts[i], chars: "01<>/{}#$", speed: 0.9 } }, 0.1 + i * 0.42);
    });

    tl.to([".loader__log", ".loader__count", ".loader__bar"], { opacity: 0, y: -16, duration: 0.5, stagger: 0.05, ease: "power2.in" }, 2.15)
      .to(".loader__brand", { yPercent: -30, opacity: 0, duration: 0.7, ease: "power3.in" }, 2.2)
      .add(() => onExit && onExit(), 2.55)
      .to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, 2.55)
      .add(() => loader.remove());
    return tl;
  }

  /* ---------------------------------------------------------
     HERO
     --------------------------------------------------------- */
  function heroIntro(chars, circuit) {
    const split = SplitText.create("#hero-title", {
      type: "lines,words",
      mask: "lines",
      linesClass: "split-line",
    });
    const scr = $("[data-hero-scramble]");
    const scrTxt = scr ? scr.textContent : "";

    const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    tl.from(split.words, { yPercent: 115, rotate: 4, duration: 1.5, stagger: 0.035, transformOrigin: "0% 100%" }, 0)
      .from(".hero__eyebrow > *", { y: 18, opacity: 0, duration: 1, stagger: 0.1 }, 0.15)
      .to(scr, { duration: 1.2, scrambleText: { text: scrTxt, chars: "upperCase", speed: 0.6 } }, 0.2)
      .from(".hero__sub", { y: 36, opacity: 0, filter: "blur(10px)", duration: 1.4 }, 0.55)
      .from(".hero__ctas .btn", { y: 36, opacity: 0, duration: 1.3, stagger: 0.1 }, 0.65)
      .from("#editor", { y: 140, opacity: 0, duration: 1.8 }, 0.55)
      .from(".stat", { y: 40, opacity: 0, duration: 1.3, stagger: 0.08 }, 0.9)
      .add(() => typeCode(chars), 1.25)
      .add(() => split.revert(), 2.4);

    if (circuit.traces.length) {
      const order = circuit.traces.map((_, i) => i).sort((a, b) => Math.abs(a - 16.5) - Math.abs(b - 16.5));
      gsap.set(circuit.traces, { drawSVG: "0% 0%" });
      gsap.set(circuit.pads, { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(circuit.pulses, { drawSVG: "0% 0%" });
      tl.to(order.map((i) => circuit.traces[i]), { drawSVG: "0% 100%", duration: 2.2, stagger: 0.035, ease: "power3.inOut" }, 0)
        .to(circuit.pads, { scale: 1, duration: 0.6, stagger: 0.02, ease: "back.out(3)" }, 1.4)
        .add(() => startPulses(circuit.pulses), 1.6);
    }
    return tl;
  }

  let pulseTweens = [];
  function startPulses(pulses) {
    pulseTweens = pulses.map((p) =>
      gsap.fromTo(p, { drawSVG: "0% 0%" }, {
        keyframes: [
          { drawSVG: "0% 7%", duration: 0.25, ease: "none" },
          { drawSVG: "93% 100%", duration: rnd(1.6, 2.8), ease: "power1.inOut" },
          { drawSVG: "100% 100%", duration: 0.25, ease: "none" },
        ],
        repeat: -1,
        repeatDelay: rnd(0.4, 3.5),
        delay: rnd(0, 2.5),
      })
    );
  }

  function heroScroll() {
    // El editor "se endereza" al hacer scroll
    gsap.fromTo("#editor-tilt",
      { rotateX: 24, scale: 0.9, transformPerspective: 1800 },
      { rotateX: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: ".hero__stage", start: "top 98%", end: "top 22%", scrub: true } });

    gsap.to(".hero__inner", {
      y: 140, opacity: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=750", scrub: true },
    });
    gsap.to(".hero__bg", {
      yPercent: 18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Pausar los pulsos del circuito fuera de vista
    ScrollTrigger.create({
      trigger: ".hero__bg", start: "top top", end: "bottom top",
      onToggle: (self) => pulseTweens.forEach((t) => (self.isActive ? t.resume() : t.pause())),
    });

    // Glow que sigue al puntero + leve inclinación del editor
    if (finePointer) {
      const glow = $(".hero__glow");
      const hero = $(".hero");
      const gx = gsap.quickTo(glow, "x", { duration: 1.4, ease: "power3" });
      const gy = gsap.quickTo(glow, "y", { duration: 1.4, ease: "power3" });
      const ed = $("#editor");
      const ry = gsap.quickTo(ed, "rotationY", { duration: 1.2, ease: "power3" });
      const rx = gsap.quickTo(ed, "rotationX", { duration: 1.2, ease: "power3" });
      gsap.set(glow, { x: window.innerWidth * 0.62, y: window.innerHeight * 0.32 });
      gsap.set(ed, { transformPerspective: 1600 });
      window.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        if (e.clientY > r.bottom) return;
        gx(e.clientX);
        gy(e.clientY - r.top);
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        ry(nx * 5);
        rx(-ny * 3);
      }, { passive: true });
    }

    // Contadores
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count;
      const o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => (el.textContent = Math.round(o.v)),
      });
    });
  }

  /* ---------------------------------------------------------
     Marquee reactivo a la velocidad de scroll
     --------------------------------------------------------- */
  function marquees(pageST) {
    const rows = $$(".marquee");
    const tweens = [];
    const inners = [];
    rows.forEach((m) => {
      const inner = $(".marquee__inner", m);
      inner.innerHTML += inner.innerHTML;
      const dir = +m.dataset.dir || 1;
      tweens.push(gsap.fromTo(inner,
        { xPercent: dir > 0 ? 0 : -50 },
        { xPercent: dir > 0 ? -50 : 0, duration: 46, ease: "none", repeat: -1 }));
      inners.push(inner);
    });

    let active = false, speed = 1, dirSign = 1, skew = 0;
    ScrollTrigger.create({
      trigger: ".stack", start: "top bottom", end: "bottom top",
      onToggle: (s) => {
        active = s.isActive;
        tweens.forEach((t) => (active ? t.resume() : t.pause()));
      },
    });
    const setSkew = inners.map((el) => gsap.quickSetter(el, "skewX", "deg"));
    gsap.ticker.add(() => {
      if (!active) return;
      const v = pageST.getVelocity();
      if (Math.abs(v) > 5) dirSign = v > 0 ? 1 : -1;
      const target = dirSign * (1 + Math.min(Math.abs(v) / 220, 7));
      speed += (target - speed) * 0.08;
      tweens.forEach((t) => t.timeScale(speed));
      skew += (gsap.utils.clamp(-9, 9, v / -260) - skew) * 0.1;
      setSkew.forEach((s) => s(skew));
    });
  }

  /* ---------------------------------------------------------
     Equipo: manifiesto + tarjetas apiladas
     --------------------------------------------------------- */
  function team(mm) {
    const ms = SplitText.create("#manifesto", { type: "words", wordsClass: "w" });
    gsap.fromTo(ms.words, { opacity: 0.13 }, {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: "#manifesto", start: "top 82%", end: "bottom 42%", scrub: true },
    });

    mm.add("(min-width: 768px)", () => {
      const cards = $$(".scard");
      const last = cards[cards.length - 1];
      const off = (i) => 104 + i * 22;
      cards.forEach((card, i) => {
        if (card === last) return;
        ScrollTrigger.create({
          trigger: card,
          start: () => `top ${off(i)}px`,
          endTrigger: last,
          end: () => `top ${off(cards.length - 1)}px`,
          pin: true,
          pinSpacing: false,
        });
        gsap.to($(".scard__shell", card), {
          scale: 0.93, "--dim": 0.6, ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: () => `top ${off(i + 1)}px`,
            scrub: true,
          },
        });
      });
    });

    // Arte de cada tarjeta
    gsap.to(".art-seal .seal-rot", { rotation: 360, svgOrigin: "100 100", duration: 26, ease: "none", repeat: -1 });
    gsap.to(".art-globe .orbit", { rotation: -360, svgOrigin: "100 100", duration: 9, ease: "none", repeat: -1 });
    gsap.fromTo(".art-target circle:not(.fill)", { scale: 0.85, opacity: 0.2, svgOrigin: "100 100" },
      { scale: 1, opacity: 1, duration: 1.8, stagger: { each: 0.3, repeat: -1, yoyo: true }, ease: "sine.inOut" });
    $$(".scard").forEach((card) => {
      gsap.from($(".scard__txt", card).children, {
        y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 75%", once: true },
      });
    });
  }

  /* ---------------------------------------------------------
     Servicios: scroll horizontal
     --------------------------------------------------------- */
  function services(mm) {
    mm.add("(min-width: 1024px)", () => {
      const track = $("#services-track");
      const bar = $("#svc-bar");
      const count = $("#svc-count");
      const dist = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: ".services",
          start: "top top",
          end: () => "+=" + dist(),
          pin: true,
          scrub: 1,
          refreshPriority: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            gsap.set(bar, { scaleX: self.progress });
            count.textContent = String(gsap.utils.clamp(1, 4, Math.round(self.progress * 3.4) + 1)).padStart(2, "0");
          },
        },
      });

      $$(".svc").forEach((card) => {
        gsap.fromTo(card,
          { y: 90, rotate: 3, opacity: 0.25 },
          { y: 0, rotate: 0, opacity: 1, ease: "power2.out",
            scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 100%", end: "left 55%", scrub: true } });
        gsap.from($(".svc__num", card), {
          yPercent: 100, opacity: 0, ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 85%", end: "left 50%", scrub: true },
        });
      });
      gsap.from(".services__outro > *", {
        x: 80, opacity: 0, stagger: 0.1, ease: "power2.out",
        scrollTrigger: { trigger: ".services__outro", containerAnimation: tween, start: "left 100%", end: "left 60%", scrub: true },
      });
    });

    mm.add("(max-width: 1023px)", () => {
      $$(".svc, .services__outro").forEach((el) => {
        gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
    });

    // Visuales de cada servicio (en loop mientras la sección está visible)
    const loops = [];
    const bars = $$(".vis-code__lines i");
    loops.push(gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
      .fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.7, stagger: 0.14, ease: "expo.out" })
      .to(bars, { opacity: 0.25, duration: 0.5, stagger: 0.04 }, "+=1.4")
      .set(bars, { opacity: 1, scaleX: 0 }));

    const nodes = $$(".vis-team__grid i");
    loops.push(gsap.timeline({ repeat: -1 })
      .call(() => {
        nodes.forEach((n) => n.classList.remove("on"));
        gsap.utils.shuffle(nodes.slice()).slice(0, 5).forEach((n) => n.classList.add("on"));
      })
      .to({}, { duration: 1.1 }));

    loops.push(gsap.to(".vis-flow .flow-line", { strokeDashoffset: -16, duration: 0.8, ease: "none", repeat: -1 }));
    loops.push(gsap.to(".vis-flow .is-hub rect", { opacity: 0.55, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" }));

    const rows = $$(".vis-qa__row");
    const qa = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    rows.forEach((r, i) => qa.call(() => r.classList.add("pass"), null, 0.3 + i * 0.55));
    qa.call(() => rows.forEach((r) => r.classList.remove("pass")), null, "+=1.8");
    loops.push(qa);

    loops.forEach((l) => l.pause());
    ScrollTrigger.create({
      trigger: ".services", start: "top bottom", end: "bottom top",
      onToggle: (s) => loops.forEach((l) => (s.isActive ? l.resume() : l.pause())),
    });
  }

  /* ---------------------------------------------------------
     Soluciones: bento
     --------------------------------------------------------- */
  function solutions() {
    const tiles = $$(".tile");
    gsap.set(tiles, { y: 90, opacity: 0, rotateX: -10, transformOrigin: "50% 100%" });
    ScrollTrigger.batch(tiles, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, rotateX: 0, duration: 1.5, stagger: 0.09, ease: "expo.out" }),
    });

    // Spotlight compartido + tilt por tarjeta
    const bento = $("#bento");
    if (finePointer && bento) {
      bento.addEventListener("pointermove", (e) => {
        tiles.forEach((t) => {
          const r = t.getBoundingClientRect();
          t.style.setProperty("--mx", `${e.clientX - r.left}px`);
          t.style.setProperty("--my", `${e.clientY - r.top}px`);
        });
      }, { passive: true });
      tiles.forEach((t) => {
        const core = $(".tile__core", t);
        gsap.set(core, { transformPerspective: 900 });
        const rx = gsap.quickTo(core, "rotationX", { duration: 0.8, ease: "power3" });
        const ry = gsap.quickTo(core, "rotationY", { duration: 0.8, ease: "power3" });
        t.addEventListener("pointermove", (e) => {
          const r = t.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 6);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
        });
        t.addEventListener("pointerleave", () => { rx(0); ry(0); });
      });
    }

    const loops = [];
    const mods = $$(".vis-odoo span");
    loops.push(gsap.timeline({ repeat: -1 })
      .call(() => {
        mods.forEach((m) => m.classList.remove("on"));
        gsap.utils.shuffle(mods.slice()).slice(0, 3).forEach((m) => m.classList.add("on"));
      })
      .to({}, { duration: 1.2 }));
    loops.push(gsap.to(".vis-orbit .r1", { rotation: 360, duration: 7, ease: "none", repeat: -1 }));
    loops.push(gsap.to(".vis-orbit .r2", { rotation: -360, duration: 12, ease: "none", repeat: -1 }));
    loops.push(gsap.to(".vis-orbit .r3", { rotation: 360, duration: 18, ease: "none", repeat: -1 }));
    loops.push(gsap.to(".vis-bars i", {
      scaleY: () => rnd(0.35, 1), duration: 1.3, ease: "power2.inOut", stagger: 0.06,
      repeat: -1, yoyo: true, repeatRefresh: true,
    }));
    const chain = $$(".vis-chain span");
    let ci = 2;
    loops.push(gsap.timeline({ repeat: -1 })
      .call(() => { chain.forEach((c) => c.classList.remove("on")); ci = (ci + 1) % chain.length; chain[ci].classList.add("on"); })
      .to({}, { duration: 1.1 }));
    loops.push(gsap.to(".vis-net .hot", { scale: 1.5, transformOrigin: "50% 50%", duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut" }));

    gsap.from(".vis-gis path", {
      drawSVG: "0%", duration: 2.2, stagger: 0.2, ease: "power3.inOut",
      scrollTrigger: { trigger: ".tile--gis", start: "top 85%", once: true },
    });
    gsap.from(".vis-net path", {
      drawSVG: "0%", duration: 1.6, ease: "power3.inOut",
      scrollTrigger: { trigger: ".tile--infra", start: "top 88%", once: true },
    });

    loops.forEach((l) => l.pause());
    ScrollTrigger.create({
      trigger: "#bento", start: "top bottom", end: "bottom top",
      onToggle: (s) => loops.forEach((l) => (s.isActive ? l.resume() : l.pause())),
    });

    // Banner que se desplaza horizontalmente con el scroll
    const line = $("#ask-line");
    gsap.fromTo(line,
      { x: () => window.innerWidth * 0.25 },
      { x: () => -(line.scrollWidth - window.innerWidth * 0.75), ease: "none",
        scrollTrigger: { trigger: ".ask", start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } });
  }

  /* ---------------------------------------------------------
     Odoo: dolores, escenarios, statement, proceso
     --------------------------------------------------------- */
  function odoo(mm) {
    const pains = $$(".pain");
    gsap.set(pains, { y: 70, opacity: 0 });
    ScrollTrigger.batch(pains, {
      start: "top 90%", once: true,
      onEnter: (batch) => {
        gsap.to(batch, { y: 0, opacity: 1, duration: 1.3, stagger: 0.1, ease: "expo.out" });
        batch.forEach((p, i) => {
          const log = $(".pain__log", p);
          gsap.fromTo(log, { opacity: 0 }, { opacity: 1, duration: 0.1, delay: 0.25 + i * 0.1, repeat: 5, yoyo: true, ease: "steps(1)" });
        });
      },
    });

    // Checklist que se tilda al scrollear
    const items = $$("#checklist li");
    const countEl = $("#sc-count");
    const meter = $("#sc-meter");
    const update = () => {
      const n = items.filter((li) => li.classList.contains("is-checked")).length;
      countEl.textContent = n;
      gsap.to(meter, { scaleX: n / items.length, duration: 0.8, ease: "expo.out" });
    };
    items.forEach((li) => {
      ScrollTrigger.create({
        trigger: li, start: "top 62%",
        onEnter: () => { li.classList.add("is-checked"); update(); },
        onLeaveBack: () => { li.classList.remove("is-checked"); update(); },
      });
    });

    mm.add("(min-width: 961px)", () => {
      const head = $("#scenarios-head");
      const list = $("#checklist");
      ScrollTrigger.create({
        trigger: head, start: "top 130px",
        end: () => "+=" + Math.max(0, list.offsetHeight - head.offsetHeight),
        pin: true, pinSpacing: false, invalidateOnRefresh: true,
      });
      const wh = $("#why-head");
      const steps = $(".steps-wrap");
      ScrollTrigger.create({
        trigger: wh, start: "top 130px",
        end: () => "+=" + Math.max(0, steps.offsetHeight - wh.offsetHeight),
        pin: true, pinSpacing: false, invalidateOnRefresh: true,
      });
    });

    // Statement palabra por palabra
    const st = SplitText.create("#statement", { type: "words", wordsClass: "w" });
    gsap.fromTo(st.words, { opacity: 0.12, y: 20 }, {
      opacity: 1, y: 0, stagger: 0.12, ease: "power1.out",
      scrollTrigger: { trigger: "#statement", start: "top 80%", end: "bottom 50%", scrub: true },
    });

    // Proceso
    gsap.to("#steps-fill", {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: "#steps", start: "top 60%", end: "bottom 60%", scrub: true },
    });
    $$(".step").forEach((s) => {
      ScrollTrigger.create({
        trigger: s, start: "top 62%",
        onEnter: () => s.classList.add("is-active"),
        onLeaveBack: () => s.classList.remove("is-active"),
      });
    });

    gsap.to(".offer__glow", { scale: 1.25, opacity: 0.7, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
  }

  /* ---------------------------------------------------------
     Blog, CTA final, footer
     --------------------------------------------------------- */
  function tail() {
    $$(".post").forEach((p, i) => {
      gsap.from(p, { y: 90, opacity: 0, duration: 1.5, delay: i * 0.1, ease: "expo.out", scrollTrigger: { trigger: ".posts", start: "top 85%", once: true } });
    });
    gsap.from(".cover-geo .route", { drawSVG: "0%", duration: 2.2, ease: "power3.inOut", scrollTrigger: { trigger: ".posts", start: "top 80%", once: true } });
    gsap.to(".cover-geo .route", { strokeDashoffset: -22, duration: 1.2, ease: "none", repeat: -1 });
    gsap.from(".cover-crm path", { drawSVG: "0%", duration: 1.6, ease: "power3.inOut", scrollTrigger: { trigger: ".posts", start: "top 80%", once: true } });
    gsap.to(".cover-crm .hub", { scale: 1.25, transformOrigin: "50% 50%", duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1 });

    const fin = SplitText.create("#finale-title", { type: "words", wordsClass: "w" });
    gsap.from(fin.words, {
      yPercent: 60, opacity: 0, rotateX: -50, transformPerspective: 800, transformOrigin: "50% 100%",
      stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: ".finale", start: "top 75%", end: "center 55%", scrub: 1 },
    });
    gsap.fromTo(".finale__glow", { scale: 0.6, opacity: 0.3 }, {
      scale: 1.15, opacity: 1, ease: "none",
      scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom top", scrub: true },
    });

    const fw = SplitText.create("#footer-word", { type: "chars", charsClass: "char" });
    gsap.from(fw.chars, {
      yPercent: 105, stagger: 0.05, ease: "expo.out", duration: 1.4,
      scrollTrigger: { trigger: "#footer-word", start: "top 95%", once: true },
    });
    gsap.from(".footer__col", {
      y: 40, opacity: 0, stagger: 0.08, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: ".footer", start: "top 85%", once: true },
    });
  }

  /* ---------------------------------------------------------
     Reveals genéricos (títulos, textos, eyebrows)
     --------------------------------------------------------- */
  function reveals() {
    $$("[data-split]").forEach((el) => {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110, duration: 1.4, stagger: 0.1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        },
      });
    });

    $$("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        y: 50, opacity: 0, filter: "blur(8px)", duration: 1.4, ease: "expo.out",
        clearProps: "filter",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    $$("[data-reveal-group]").forEach((g) => {
      gsap.from(g.children, {
        y: 30, opacity: 0, duration: 1.2, stagger: 0.08, ease: "expo.out",
        scrollTrigger: { trigger: g, start: "top 88%", once: true },
      });
    });

    $$("[data-scramble]").forEach((el) => {
      const txt = el.textContent;
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: () => gsap.to(el, { duration: 1.1, scrambleText: { text: txt, chars: "01<>/_#", speed: 0.7 } }),
      });
    });
  }

  /* ---------------------------------------------------------
     NAV: indicador activo + progreso + scramble en hover
     --------------------------------------------------------- */
  function nav() {
    const ind = $(".nav__indicator");
    const links = $$(".nav__links a");
    const progress = $("#nav-progress");
    let activeLink = null;

    const moveInd = (link) => {
      if (!link) { gsap.to(ind, { opacity: 0, duration: 0.4, ease: "power2.out" }); return; }
      gsap.to(ind, { x: link.offsetLeft, width: link.offsetWidth, opacity: 1, duration: 0.7, ease: "expo.out" });
    };
    links.forEach((l) => {
      const txt = l.textContent;
      l.addEventListener("mouseenter", () => {
        moveInd(l);
        if (!reduce) gsap.to(l, { duration: 0.6, scrambleText: { text: txt, chars: "lowerCase", speed: 1 }, overwrite: true });
      });
    });
    $(".nav__links").addEventListener("mouseleave", () => moveInd(activeLink));

    // Sección activa: la última cuyo borde superior cruzó la mitad de la pantalla.
    // Se mide el pin-spacer de las secciones fijadas para respetar su recorrido extra.
    const secs = links.map((l) => $("#" + l.dataset.nav));
    const endEl = $(".finale");
    const box = (el) => (el.parentElement && el.parentElement.classList.contains("pin-spacer") ? el.parentElement : el);
    const check = () => {
      const mid = window.innerHeight * 0.5;
      let found = null;
      secs.forEach((s, i) => { if (s && box(s).getBoundingClientRect().top <= mid) found = links[i]; });
      if (endEl && endEl.getBoundingClientRect().top <= mid) found = null;
      if (found !== activeLink) {
        activeLink = found;
        links.forEach((l) => l.classList.toggle("is-active", l === found));
        moveInd(found);
      }
    };

    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => { gsap.set(progress, { scaleX: self.progress }); check(); },
      onRefresh: check,
    });
  }

  /* ---------------------------------------------------------
     Menú mobile
     --------------------------------------------------------- */
  function menu() {
    const burger = $(".nav__burger");
    const m = $("#menu");
    let open = false;
    let tl = null;

    const build = () => {
      const r = burger.getBoundingClientRect();
      const x = Math.round(r.left + r.width / 2);
      const y = Math.round(r.top + r.height / 2);
      return gsap.timeline({ paused: true })
        .set(m, { visibility: "visible" })
        .fromTo(m, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${Math.hypot(window.innerWidth, window.innerHeight) * 1.05}px at ${x}px ${y}px)`, duration: 0.9, ease: "expo.inOut" })
        .fromTo(".menu__label", { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.3)
        .fromTo([".menu .eyebrow", ".menu__list .mono", ".menu__foot"], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.03, ease: "expo.out" }, 0.4);
    };

    const setOpen = (v, after) => {
      open = v;
      burger.setAttribute("aria-expanded", String(v));
      burger.setAttribute("aria-label", v ? "Cerrar menú" : "Abrir menú");
      m.setAttribute("aria-hidden", String(!v));
      if (v) {
        tl = build();
        tl.play();
        if (smoother) smoother.paused(true);
      } else if (tl) {
        if (smoother) smoother.paused(false);
        tl.timeScale(1.6).reverse().eventCallback("onReverseComplete", () => {
          gsap.set(m, { visibility: "hidden" });
          if (after) after();
        });
      }
    };
    burger.addEventListener("click", () => setOpen(!open));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setOpen(false); });
    return { isOpen: () => open, close: (after) => setOpen(false, after) };
  }

  /* ---------------------------------------------------------
     Cursor custom + botones magnéticos
     --------------------------------------------------------- */
  function cursor() {
    if (!finePointer || reduce) return;
    html.classList.add("has-cursor");
    const c = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
    window.addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.add("is-hidden"));
    document.addEventListener("pointerenter", () => c.classList.remove("is-hidden"));
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, label, select, .tags li");
      if (lab) { label.textContent = lab.dataset.cursor; c.classList.add("is-label"); c.classList.remove("is-hover"); }
      else if (hov) { c.classList.add("is-hover"); c.classList.remove("is-label"); }
      else { c.classList.remove("is-hover", "is-label"); }
    });
  }

  function magnetic() {
    if (!finePointer || reduce) return;
    $$(".magnetic").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------------------------------------------------
     Formulario → abre el cliente de correo con la consulta
     --------------------------------------------------------- */
  function form() {
    const f = $("#contact-form");
    if (!f) return;
    const status = $("#form-status");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[required]", f).forEach((inp) => {
        const wrap = inp.closest(".field") || inp.closest(".check");
        const valid = inp.type === "checkbox" ? inp.checked : inp.checkValidity() && inp.value.trim() !== "";
        wrap.classList.toggle("is-invalid", !valid);
        if (!valid) {
          ok = false;
          wrap.classList.remove("is-flash");
          void wrap.offsetWidth;
          wrap.classList.add("is-flash");
        }
      });
      if (!ok) {
        status.className = "form__status mono err";
        status.textContent = "Revisá los campos marcados.";
        return;
      }
      const d = new FormData(f);
      const subject = `Consulta web — ${d.get("motivo")}`;
      const body = [
        `Nombre y apellido: ${d.get("nombre")}`,
        `E-mail: ${d.get("email")}`,
        `Compañía: ${d.get("empresa") || "-"}`,
        `Teléfono: ${d.get("telefono") || "-"}`,
        `Motivo: ${d.get("motivo")}`,
        "",
        d.get("mensaje"),
      ].join("\n");
      window.location.href = `mailto:info@avatarinformatica.com.ar?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.className = "form__status mono ok";
      status.textContent = "✓ Abriendo tu correo para enviar la consulta…";
    });
    $$("input, select, textarea", f).forEach((inp) => {
      inp.addEventListener("input", () => (inp.closest(".field") || inp.closest(".check")).classList.remove("is-invalid"));
      inp.addEventListener("change", () => (inp.closest(".field") || inp.closest(".check")).classList.remove("is-invalid"));
    });
  }

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */
  function bindLinks(menuApi) {
    $$("[data-scroll-link]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        e.preventDefault();
        if (a.dataset.motivo) setMotivo(a.dataset.motivo);
        if (menuApi.isOpen()) menuApi.close(() => scrollToTarget(href));
        else scrollToTarget(href);
      });
    });
    const top = $("#to-top");
    if (top) top.addEventListener("click", () => scrollToTarget("#top"));
  }

  function initReduced() {
    const l = $("#loader");
    if (l) l.remove();
    html.classList.add("is-ready");
    $$(".term-out").forEach((o) => (o.style.opacity = 1));
    const cmd = $("#term-cmd");
    if (cmd) cmd.textContent = "avatar deploy --entorno=produccion";
    odooChecks();
    nav();
    const menuApi = menu();
    bindLinks(menuApi);
    form();
  }

  function odooChecks() {
    const items = $$("#checklist li");
    const countEl = $("#sc-count");
    const meter = $("#sc-meter");
    items.forEach((li) => {
      ScrollTrigger.create({
        trigger: li, start: "top 62%",
        onToggle: () => {
          li.classList.add("is-checked");
          const n = items.filter((x) => x.classList.contains("is-checked")).length;
          countEl.textContent = n;
          meter.style.transform = `scaleX(${n / items.length})`;
        },
      });
    });
    $$(".step").forEach((s) => s.classList.add("is-active"));
    const fill = $("#steps-fill");
    if (fill) fill.style.transform = "scaleY(1)";
  }

  function init() {
    if (reduce) { initReduced(); return; }

    const circuit = buildCircuit();
    buildGeoDots();
    const chars = prepareTyping();

    const mm = gsap.matchMedia();
    const pageST = ScrollTrigger.create({ start: 0, end: "max" });

    // Orden = orden en la página (los pins afectan lo que viene después)
    heroScroll();
    marquees(pageST);
    team(mm);
    services(mm);
    solutions();
    odoo(mm);
    tail();
    reveals();
    nav();

    const menuApi = menu();
    bindLinks(menuApi);
    cursor();
    magnetic();
    form();

    const hero = heroIntro(chars, circuit);
    gsap.set(".nav__pill", { y: -90, opacity: 0 });

    runLoader(() => {
      hero.play();
      gsap.to(".nav__pill", { y: 0, opacity: 1, duration: 1.4, ease: "expo.out", delay: 0.35 });
      html.classList.add("is-ready");
      if (smoother) smoother.paused(false);
      ScrollTrigger.refresh();
    });
  }

  let started = false;
  const go = () => { if (started) return; started = true; init(); };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(go);
    setTimeout(go, 2500);
  } else {
    window.addEventListener("load", go);
  }
})();
