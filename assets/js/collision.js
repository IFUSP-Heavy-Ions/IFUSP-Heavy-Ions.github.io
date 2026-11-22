/*
 * Hero animation for the IFUSP Heavy-Ion Group:
 * a stylized heavy-ion collision seen in the reaction plane, rendered in the
 * IFUSP Cherenkov Cyan / Cobalt Blue / USP Gold palette.
 * Can be toggled live against the static SVG event-display illustration.
 */
(function () {
  "use strict";

  var canvas = document.querySelector("[data-collision]");
  if (!canvas || !canvas.getContext) return;
  var hero = canvas.closest(".hero");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var NUCLEONS = 60;
  var T_HIT = 1.5;
  var T_FREEZE = 1.05;
  var T_REST = 12;
  var T_END = T_HIT + 4.4 + T_REST;
  var CONTRACTION = 0.16;

  var W = 0, H = 0, cx = 0, cy = 0, R = 0, speed = 0;
  var event = null;
  var running = false, visible = true, lastTime = 0, rafId = 0;

  function isAnimatedMode() {
    return !hero || hero.getAttribute("data-hero-mode") !== "static";
  }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var wide = W > 720;
    cx = wide ? W * 0.74 : W * 0.5;
    cy = wide ? H * 0.46 : H * 0.3;
    R = Math.max(28, Math.min(H * 0.2, wide ? W * 0.1 : W * 0.24));
    speed = (cx + 1.4 * R) / T_HIT;
    event = newEvent();
  }

  function newEvent() {
    var b = rand(0.3, 1.15) * R;
    var centers = [cy - b / 2, cy + b / 2];
    var nucleons = [];
    for (var side = 0; side < 2; side++) {
      var yc = centers[side], yOther = centers[1 - side];
      for (var i = 0; i < NUCLEONS; i++) {
        var r = Math.sqrt(Math.random()) * R;
        var th = Math.random() * 2 * Math.PI;
        var ty = r * Math.cos(th);
        var tz = r * Math.sin(th);
        var y = yc + ty;
        nucleons.push({
          dir: side === 0 ? 1 : -1,
          ux: rand(-1, 1) * Math.sqrt(Math.max(0, 1 - (r * r) / (R * R))) * R * CONTRACTION,
          y: y,
          participant: Math.hypot(y - yOther, tz) < R * 0.92,
          rapidity: gauss(),
          px: 0, py: 0
        });
      }
    }
    return { t: 0, nucleons: nucleons, hadrons: [], frozen: false };
  }

  function spawnHadrons(ev) {
    var parts = ev.nucleons.filter(function (n) { return n.participant; });
    var count = Math.min(320, parts.length * 3);
    var v0 = Math.max(W, H) * 0.24;
    for (var i = 0; i < count; i++) {
      var p = parts[(Math.random() * parts.length) | 0];
      var phi = Math.random() * 2 * Math.PI;
      var s = rand(0.35, 1) * v0;
      var species = Math.random();
      ev.hadrons.push({
        x: p.px, y: p.py,
        vx: Math.cos(phi) * s * 0.9 + p.rapidity * v0 * 0.55,
        vy: Math.sin(phi) * s * 0.75,
        age: -Math.random() * 0.35,
        // ~65% sky-cyan, ~22% USP gold, ~13% indigo-violet
        color: species < 0.65 ? "125, 211, 252" : species < 0.87 ? "251, 191, 36" : "165, 180, 252"
      });
    }
  }

  function fireballGrowth(tau) { return 1 - Math.exp(-tau / 0.55); }

  function placeParticipants(ev, growth) {
    for (var i = 0; i < ev.nucleons.length; i++) {
      var n = ev.nucleons[i];
      if (!n.participant) continue;
      n.px = cx + n.ux * 0.4 + n.rapidity * R * 1.1 * growth;
      n.py = cy + (n.y - cy) * (1 + 0.45 * growth);
    }
  }

  function update(dt) {
    var ev = event;
    ev.t += dt;
    var tau = ev.t - T_HIT;
    if (tau > 0) placeParticipants(ev, fireballGrowth(tau));
    if (tau > T_FREEZE && !ev.frozen) {
      ev.frozen = true;
      spawnHadrons(ev);
    }
    for (var i = 0; i < ev.hadrons.length; i++) {
      var h = ev.hadrons[i];
      h.age += dt;
      if (h.age > 0) { h.x += h.vx * dt; h.y += h.vy * dt; }
    }
    if (ev.t > T_END) event = newEvent();
  }

  function drawDetector() {
    ctx.save();
    ctx.lineWidth = 1;
    var radii = [1.8, 2.6, 3.6, 4.9, 6.5];
    for (var i = 0; i < radii.length; i++) {
      ctx.strokeStyle = "rgba(147, 197, 253, " + (0.08 - i * 0.012) + ")";
      ctx.beginPath();
      ctx.arc(cx, cy, R * radii[i], 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = "rgba(147, 197, 253, 0.1)";
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    if (!event) return;
    var ev = event;
    var t = ev.t;
    var tau = t - T_HIT;
    ctx.clearRect(0, 0, W, H);
    drawDetector();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Impact flash: white-gold to electric cyan
    if (tau > 0 && tau < 0.45) {
      var k = 1 - tau / 0.45;
      var fr = R * (1.2 + 2.2 * tau);
      var flash = ctx.createRadialGradient(cx, cy, 0, cx, cy, fr);
      flash.addColorStop(0, "rgba(254, 243, 199, " + 0.78 * k + ")");
      flash.addColorStop(0.4, "rgba(56, 189, 248, " + 0.38 * k + ")");
      flash.addColorStop(1, "rgba(37, 99, 235, 0)");
      ctx.fillStyle = flash;
      ctx.fillRect(cx - fr, cy - fr, 2 * fr, 2 * fr);
    }

    // Fireball from participants: cools from white-gold to cyan to cobalt blue
    if (tau > 0) {
      var growth = fireballGrowth(tau);
      var heat = Math.exp(-tau / 0.9);
      var fade = tau < T_FREEZE ? 1 : clamp01(1 - (tau - T_FREEZE) / 0.7);
      var blob = R * (0.2 + 0.3 * growth);
      var rgbCore = heat > 0.55 ? "254, 243, 199" : heat > 0.3 ? "125, 211, 252" : "96, 165, 250";
      if (fade > 0) {
        for (var i = 0; i < ev.nucleons.length; i++) {
          var n = ev.nucleons[i];
          if (!n.participant) continue;
          var g = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, blob);
          g.addColorStop(0, "rgba(" + rgbCore + ", " + 0.22 * fade + ")");
          g.addColorStop(0.5, "rgba(14, 165, 233, " + 0.11 * fade + ")");
          g.addColorStop(1, "rgba(29, 78, 216, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(n.px - blob, n.py - blob, 2 * blob, 2 * blob);
        }
      }
    }

    // Hadron streaks
    for (var j = 0; j < ev.hadrons.length; j++) {
      var h = ev.hadrons[j];
      if (h.age <= 0) continue;
      var a = clamp01(1 - h.age / 2.9);
      if (a <= 0) continue;
      ctx.strokeStyle = "rgba(" + h.color + ", " + 0.78 * a + ")";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(h.x - h.vx * 0.07, h.y - h.vy * 0.07);
      ctx.lineTo(h.x, h.y);
      ctx.stroke();
    }
    ctx.restore();

    // Incoming nuclei and outgoing spectators (Cyan-Blue from left, Gold from right)
    var nr = R * 0.085;
    for (var m = 0; m < ev.nucleons.length; m++) {
      var nu = ev.nucleons[m];
      if (tau > 0 && nu.participant) continue;
      var alpha = tau > 0 ? clamp01(1 - tau / 1.6) : 1;
      if (alpha <= 0) continue;
      var x = cx - nu.dir * speed * (T_HIT - t) + nu.ux;
      ctx.fillStyle = nu.dir > 0
        ? "rgba(125, 211, 252, " + 0.85 * alpha + ")"
        : "rgba(252, 211, 77, " + 0.85 * alpha + ")";
      ctx.beginPath();
      ctx.arc(x, nu.y, nr, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    update(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden || !isAnimatedMode()) return;
    if (!W || !H) resize();
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function renderStill() {
    if (!W || !H) resize();
    event = newEvent();
    var target = T_HIT + T_FREEZE + 0.55;
    while (event.t < target) update(1 / 60);
    draw();
  }

  resize();
  if (reduceMotion) {
    renderStill();
  } else if (isAnimatedMode()) {
    start();
  }

  window.addEventListener("ifusp:heromode", function (e) {
    if (e.detail && e.detail.mode === "animated") {
      resize();
      if (reduceMotion) renderStill(); else start();
    } else {
      stop();
    }
  });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!isAnimatedMode()) return;
      resize();
      if (reduceMotion) renderStill();
    }, 120);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(hero || canvas);
  }
})();
