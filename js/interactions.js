/* ============================================================
   INTERACTIONS.JS — Syncron AI
   Barra de progreso, scroll-reveal, nav (scroll + menú móvil),
   smooth scroll con compensación del nav fijo y respaldo del logo.
   ============================================================ */

(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var progress = document.getElementById("scroll-progress");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Barra de progreso + nav con fondo al hacer scroll --- */
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- Menú móvil --- */
  var toggle = document.getElementById("nav-toggle");
  toggle?.addEventListener("click", function () {
    var abierto = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación");
  });
  document.querySelectorAll("#nav-mobile a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });

  /* --- Scroll-reveal con IntersectionObserver --- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function () {
            entry.target.classList.add("visible");
          }, Math.min(i, 4) * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* --- Smooth scroll con compensación del nav fijo --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = this.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* --- Panel interactivo "Vendemos resultados" (tabs accesibles) --- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".results__tab"));
  if (tabs.length) {
    var panels = document.querySelectorAll(".results__detail");

    var activarTab = function (tab) {
      tabs.forEach(function (t) {
        var activo = t === tab;
        t.classList.toggle("is-active", activo);
        t.setAttribute("aria-selected", activo ? "true" : "false");
        t.setAttribute("tabindex", activo ? "0" : "-1");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.id === tab.getAttribute("aria-controls"));
      });
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        activarTab(tab);
      });
      tab.addEventListener("keydown", function (e) {
        var destino = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") destino = (i + 1) % tabs.length;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") destino = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") destino = 0;
        else if (e.key === "End") destino = tabs.length - 1;
        if (destino !== null) {
          e.preventDefault();
          tabs[destino].focus();
          activarTab(tabs[destino]);
        }
      });
    });
  }

  /* --- Respaldo del logo: si assets/logo/logo.png no existe,
         usamos el placeholder SVG sin romper nada. Contemplamos el
         caso en que la imagen ya falló antes de correr este script. --- */
  document.querySelectorAll("img[data-logo]").forEach(function (img) {
    function usarSvg() {
      if (img.src.indexOf("logo.svg") === -1) img.src = "assets/logo/logo.svg";
    }
    if (img.complete && img.naturalWidth === 0) {
      usarSvg();
    } else {
      img.addEventListener("error", usarSvg, { once: true });
    }
  });
})();
