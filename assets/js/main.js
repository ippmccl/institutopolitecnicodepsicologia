/* =========================================================
   INSTITUTO POLITÉCNICO DE PSICOLOGÍA® — JS global del sitio
   Menú móvil, aviso de cookies y envío del formulario de contacto.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });

    /* En móvil, permite abrir/cerrar los submenús tocando la palabra */
    document.querySelectorAll(".has-dropdown > a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (window.innerWidth <= 760) {
          var parent = link.parentElement;
          var dropdown = parent.querySelector(".dropdown");
          if (dropdown) {
            e.preventDefault();
            parent.classList.toggle("dropdown-open");
            dropdown.style.display = parent.classList.contains("dropdown-open") ? "block" : "none";
          }
        }
      });
    });
  }

  /* ---------- Aviso de cookies ---------- */
  var COOKIE_KEY = "ipp_cookie_consent";
  var banner = document.querySelector(".cookie-banner");
  if (banner) {
    var stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      banner.classList.add("is-visible");
      document.body.classList.add("has-cookie-banner");
    }
    var setConsent = function (value) {
      localStorage.setItem(COOKIE_KEY, value);
      banner.classList.remove("is-visible");
      document.body.classList.remove("has-cookie-banner");
    };
    var acceptAll = banner.querySelector('[data-cookie="accept"]');
    var rejectOpt = banner.querySelector('[data-cookie="reject"]');
    if (acceptAll) acceptAll.addEventListener("click", function () { setConsent("accepted"); });
    if (rejectOpt) rejectOpt.addEventListener("click", function () { setConsent("rejected"); });
  }

  /* ---------- Formulario de contacto ---------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    var statusOk = form.querySelector(".form-status.ok");
    var statusError = form.querySelector(".form-status.error");
    var isMailto = form.dataset.mode === "mailto";

    /* Ocultos hasta que haya un envío real */
    if (statusOk) statusOk.style.display = "none";
    if (statusError) statusError.style.display = "none";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (statusOk) statusOk.style.display = "none";
      if (statusError) statusError.style.display = "none";

      if (isMailto) {
        /* Sin backend: prepara un email con lo que ha escrito la persona
           y lo abre en su gestor de correo (Gmail, Outlook, Mail...). */
        var get = function (name) {
          var el = form.querySelector('[name="' + name + '"]');
          return el ? el.value.trim() : "";
        };
        var nombre = get("nombre");
        var email = get("email");
        var telefono = get("telefono");
        var motivo = get("motivo");
        var mensaje = get("mensaje");

        var subject = "Contacto web - " + (motivo || "Consulta general");
        var bodyLines = [
          "Nombre: " + nombre,
          "Email: " + email,
          "Teléfono: " + (telefono || "-"),
          "Motivo: " + (motivo || "-"),
          "",
          "Mensaje:",
          mensaje
        ];
        var to = form.dataset.mailto;
        var mailtoUrl =
          "mailto:" + encodeURIComponent(to) +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(bodyLines.join("\n"));

        window.location.href = mailtoUrl;
        if (statusOk) statusOk.style.display = "block";
        form.reset();
        return;
      }

      /* Modo con backend propio (Formspree u otro), si se configura en el futuro */
      var data = new FormData(form);
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Enviando..."; }

      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            if (statusOk) statusOk.style.display = "block";
          } else {
            if (statusError) statusError.style.display = "block";
          }
        })
        .catch(function () {
          if (statusError) statusError.style.display = "block";
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Enviar mensaje"; }
        });
    });
  }
});
