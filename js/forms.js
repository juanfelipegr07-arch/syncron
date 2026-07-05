/* ============================================================
   FORMS.JS — Syncron AI
   Única conversión: WhatsApp. Los botones abren wa.me en pestaña
   nueva (ya definido en el HTML) y mostramos un toast de aviso.
   No se bloquea la navegación.
   ============================================================ */

(function () {
  "use strict";

  var toast = document.getElementById("toast");
  var toastText = document.getElementById("toast-text");
  var timer = null;

  function showToast(mensaje) {
    if (!toast || !toastText) return;
    toastText.textContent = mensaje;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2600);
  }

  /* --- Botones de WhatsApp --- */
  document.querySelectorAll("[data-wa]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      // El enlace ya abre wa.me en pestaña nueva (target="_blank").
      // Solo confirmamos con un toast, sin preventDefault.
      showToast("Abriendo WhatsApp…");
    });
  });
})();
