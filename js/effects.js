/* posezhaoyutao.github.io — high-tech motion & interactivity layer.
   Vanilla JS, no dependencies. Respects prefers-reduced-motion. Additive only:
   nothing here changes page content or links. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Scroll progress bar ---------- */
  (function () {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? h.scrollTop / max : 0) + ")";
    }
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();
  })();

  /* ---------- 2. Scroll-reveal with stagger ---------- */
  (function () {
    var targets = document.querySelectorAll(
      ".hero-copy, .hero-panel, .corner-planet-feature, .engine-feature, .section-heading, .project-card, .project-row, .compact-grid a, .note"
    );
    if (!targets.length) return;
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("reveal-in"); });
      return;
    }
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        // stagger siblings within the same grid/list
        var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(sibs, 6) * 70 + "ms";
        el.classList.add("reveal-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 3. Count-up metrics ---------- */
  (function () {
    var metrics = document.querySelectorAll(".metric");
    if (!metrics.length) return;
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = parseInt(el.textContent, 10);
        if (isNaN(target)) { io.unobserve(el); return; }
        var start = null, dur = 1100;
        el.textContent = "0";
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target).toString();
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    metrics.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 4. Scrollspy nav highlight ---------- */
  (function () {
    var links = Array.prototype.slice.call(document.querySelectorAll(".topbar a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("nav-active"); });
          if (map[e.target.id]) map[e.target.id].classList.add("nav-active");
        }
      });
    }, { threshold: 0.35, rootMargin: "-20% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  })();

  /* ---------- 5. Pointer tilt + glow on cards ---------- */
  (function () {
    if (reduce) return;
    var cards = document.querySelectorAll(".project-card, .compact-grid a, .corner-planet-feature, .engine-feature, .hero-panel");
    cards.forEach(function (card) {
      card.classList.add("tilt");
      card.addEventListener("pointermove", function (ev) {
        var r = card.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width;
        var py = (ev.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        card.style.setProperty("--rx", ((0.5 - py) * 6).toFixed(2) + "deg");
        card.style.setProperty("--ry", ((px - 0.5) * 6).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  })();

  /* ---------- 6. Cursor spotlight ---------- */
  (function () {
    if (reduce || matchMedia("(pointer: coarse)").matches) return;
    var glow = document.getElementById("cursor-glow");
    if (!glow) return;
    var x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf;
    addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      glow.style.transform = "translate(" + x + "px," + y + "px)";
      raf = requestAnimationFrame(loop);
    })();
  })();

  /* ---------- 7. Particle network background ---------- */
  (function () {
    var canvas = document.getElementById("fx-bg");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var w, h, dpr, nodes, raf, running = true;
    var mouse = { x: -9999, y: -9999 };

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function build() {
      var count = Math.max(28, Math.min(96, Math.floor((w * h) / 17000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35
        });
      }
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var link = 132;
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        // gentle pull toward cursor for liveliness
        var dxm = mouse.x - n.x, dym = mouse.y - n.y, dm = Math.hypot(dxm, dym);
        if (dm < 160) { n.vx += (dxm / dm) * 0.012; n.vy += (dym / dm) * 0.012; }
        n.vx = Math.max(-0.9, Math.min(0.9, n.vx));
        n.vy = Math.max(-0.9, Math.min(0.9, n.vy));
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(57,214,255,0.75)";
        ctx.fill();
      }
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.hypot(dx, dy);
          if (d < link) {
            var al = (1 - d / link) * 0.34;
            ctx.strokeStyle = "rgba(57,214,255," + al.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
        // link to cursor
        var cdx = nodes[a].x - mouse.x, cdy = nodes[a].y - mouse.y, cd = Math.hypot(cdx, cdy);
        if (cd < 170) {
          ctx.strokeStyle = "rgba(177,75,255," + ((1 - cd / 170) * 0.5).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    }
    function staticFrame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(57,214,255,0.55)"; ctx.fill();
      }
    }
    size(); build();
    if (reduce) { staticFrame(); }
    else { frame(); }
    addEventListener("resize", function () { size(); build(); if (reduce) staticFrame(); });
    addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running && !reduce) { cancelAnimationFrame(raf); frame(); }
    });
  })();
})();
