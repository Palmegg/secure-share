(() => {
  "use strict";

  const MAX_CHARS = 101;
  const SECRET_IDLE_MS = 8000;
  const SHARE_STATUS_POLL_MS = 2500;
  const USED_RELOAD_SECONDS = 5;
  const translations = {
    en: {
      pageTitle: "One time share",
      choiceTitle: "What do you want to do?",
      choiceText: "Choose one action.",
      send: "Send",
      receive: "Receive",
      back: "Back",
      sendLead: "Enter the content, generate a code, and share the code through another channel.",
      receiveLead: "Enter the one-time code. The content is deleted from the server when it is retrieved.",
      content: "Content",
      expiry: "Expiry",
      expiryAria: "Choose expiry time",
      oneMinute: "1 min",
      fiveMinutes: "5 min",
      tenMinutes: "10 min",
      generateCode: "Generate one-time code",
      yourCode: "Your one-time code is:",
      copyCode: "Copy code",
      qrAlt: "QR code for receiving on mobile",
      scanMobile: "Scan from mobile",
      qrLead: "Opens the receive page with the code filled in.",
      openReceiveLink: "Open receive link",
      codeWarningPrefix: "The code can only be used once and expires in",
      oneTimeCode: "One-time code",
      retrieveContent: "Retrieve content",
      contentRetrieved: "Content retrieved",
      deletedWarning: "The content has now been deleted from the server and cannot be retrieved again.",
      copyContent: "Copy content",
      codeUsed: "Code used",
      reloadPrefix: "The page reloads in",
      seconds: "seconds.",
      toggleSecret: "Show or hide content",
      secretRequired: "Enter the content you want to share.",
      secretTooLarge: "The content is {chars} characters. The maximum is {max} characters.",
      codeRequired: "Enter the 8-digit one-time code.",
      saving: "Saving securely...",
      saveFailed: "The content could not be saved.",
      codeReady: "The one-time code is ready.",
      copied: "Copied.",
      copyFailed: "Could not copy automatically. Select and copy manually.",
      idleHidden: "Content was hidden after inactivity.",
      codeExpired: "The code has expired.",
      codeUsedStatus: "The code has been used. The page will reload shortly.",
      retrieving: "Retrieving...",
      receiveFailed: "The code is invalid or expired.",
      receiveSuccess: "The content was retrieved and deleted from the server."
    },
    da: {
      pageTitle: "One time share",
      choiceTitle: "Hvad vil du?",
      choiceText: "Vælg én handling.",
      send: "Send",
      receive: "Modtag",
      back: "Tilbage",
      sendLead: "Indtast indholdet, generér en kode, og del koden via en anden kanal.",
      receiveLead: "Indtast engangskoden. Indholdet slettes fra serveren, når det hentes.",
      content: "Indhold",
      expiry: "Udløb",
      expiryAria: "Vælg udløbstid",
      oneMinute: "1 min",
      fiveMinutes: "5 min",
      tenMinutes: "10 min",
      generateCode: "Generér engangskode",
      yourCode: "Din engangskode er:",
      copyCode: "Kopiér kode",
      qrAlt: "QR-kode til modtagelse på mobil",
      scanMobile: "Scan fra mobil",
      qrLead: "Åbner modtagersiden med koden udfyldt.",
      openReceiveLink: "Åbn modtagerlink",
      codeWarningPrefix: "Koden kan kun bruges én gang og udløber om",
      oneTimeCode: "Engangskode",
      retrieveContent: "Hent indhold",
      contentRetrieved: "Indhold hentet",
      deletedWarning: "Indholdet er nu slettet fra serveren og kan ikke hentes igen.",
      copyContent: "Kopiér indhold",
      codeUsed: "Koden er brugt",
      reloadPrefix: "Siden genindlæses om",
      seconds: "sekunder.",
      toggleSecret: "Vis eller skjul indhold",
      secretRequired: "Indtast det indhold, du vil dele.",
      secretTooLarge: "Indholdet er {chars} tegn. Maksimum er {max} tegn.",
      codeRequired: "Indtast den 8-cifrede engangskode.",
      saving: "Gemmer sikkert...",
      saveFailed: "Kunne ikke gemme indholdet.",
      codeReady: "Engangskoden er klar.",
      copied: "Kopieret.",
      copyFailed: "Kunne ikke kopiere automatisk. Markér og kopiér manuelt.",
      idleHidden: "Indholdet er skjult efter inaktivitet.",
      codeExpired: "Koden er udløbet.",
      codeUsedStatus: "Koden er brugt. Siden genindlæses om lidt.",
      retrieving: "Henter...",
      receiveFailed: "Koden er ugyldig eller udløbet.",
      receiveSuccess: "Indholdet blev hentet og slettet fra serveren."
    }
  };

  const views = {
    homeView: document.querySelector("#homeView"),
    sendView: document.querySelector("#sendView"),
    receiveView: document.querySelector("#receiveView")
  };

  const els = {
    langButtons: document.querySelectorAll("[data-lang]"),
    status: document.querySelector("#status"),
    usedToast: document.querySelector("#usedToast"),
    reloadCountdown: document.querySelector("#reloadCountdown"),
    sendForm: document.querySelector("#sendForm"),
    receiveForm: document.querySelector("#receiveForm"),
    secretField: document.querySelector("#secretField"),
    secretError: document.querySelector("#secretError"),
    secretInput: document.querySelector("#secretInput"),
    ttlOptions: document.querySelector("#ttlOptions"),
    ttlSelect: document.querySelector("#ttlSelect"),
    sizeHint: document.querySelector("#sizeHint"),
    sendResult: document.querySelector("#sendResult"),
    generatedCode: document.querySelector("#generatedCode"),
    qrImage: document.querySelector("#qrImage"),
    qrLink: document.querySelector("#qrLink"),
    countdown: document.querySelector("#countdown"),
    codeField: document.querySelector("#codeField"),
    codeError: document.querySelector("#codeError"),
    codeInput: document.querySelector("#codeInput"),
    receiveResult: document.querySelector("#receiveResult"),
    receivedSecret: document.querySelector("#receivedSecret")
  };

  let countdownTimer = null;
  let secretIdleTimer = null;
  let shareStatusTimer = null;
  let reloadTimer = null;
  let currentLang = getSavedLanguage();

  const t = (key, replacements = {}) => {
    let value = translations[currentLang]?.[key] || translations.en[key] || key;
    Object.entries(replacements).forEach(([name, replacement]) => {
      value = value.replace(`{${name}}`, String(replacement));
    });
    return value;
  };

  function getSavedLanguage() {
    try {
      return localStorage.getItem("secureShareLanguage") === "da" ? "da" : "en";
    } catch {
      return "en";
    }
  }

  const saveLanguage = (lang) => {
    try {
      localStorage.setItem("secureShareLanguage", lang);
    } catch {
      // Ignore storage failures; the selected language still applies for this session.
    }
  };

  const applyTranslations = () => {
    document.documentElement.lang = currentLang;
    document.title = t("pageTitle");

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((node) => {
      node.setAttribute("alt", t(node.dataset.i18nAlt));
    });

    els.langButtons.forEach((button) => {
      const selected = button.dataset.lang === currentLang;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  const setStatus = (message, error = false) => {
    els.status.textContent = message;
    els.status.classList.toggle("error", error);
  };

  const setFieldError = (field, errorNode, message = "") => {
    const hasError = Boolean(message);
    field.classList.toggle("has-error", hasError);
    errorNode.textContent = message;
    errorNode.hidden = !hasError;
    errorNode.classList.toggle("force-hidden", !hasError);
    errorNode.style.display = hasError ? "" : "none";
  };

  const clearValidation = () => {
    setFieldError(els.secretField, els.secretError);
    setFieldError(els.codeField, els.codeError);
  };

  const hideUsedToast = () => {
    window.clearInterval(reloadTimer);
    reloadTimer = null;
    els.usedToast.hidden = true;
    els.usedToast.classList.add("force-hidden");
    els.usedToast.style.display = "none";
  };

  const stopShareStatusWatch = () => {
    window.clearInterval(shareStatusTimer);
    shareStatusTimer = null;
  };

  const showView = (id) => {
    Object.entries(views).forEach(([key, node]) => {
      const active = key === id;
      node.hidden = !active;
      node.classList.toggle("force-hidden", !active);
      node.style.display = active ? "" : "none";
    });
    els.sendResult.hidden = true;
    els.sendResult.classList.add("force-hidden");
    els.sendResult.style.display = "none";
    els.receiveResult.hidden = true;
    els.receiveResult.classList.add("force-hidden");
    els.receiveResult.style.display = "none";
    stopShareStatusWatch();
    hideUsedToast();
    clearValidation();
    setStatus("");
  };

  const setSecretVisibility = (input, visible) => {
    input.type = visible ? "text" : "password";
  };

  const clearSecretIdleTimer = () => {
    window.clearTimeout(secretIdleTimer);
    secretIdleTimer = null;
  };

  const scheduleSecretCensor = () => {
    clearSecretIdleTimer();
    if (document.activeElement !== els.secretInput) return;

    secretIdleTimer = window.setTimeout(() => {
      if (document.activeElement === els.secretInput && els.secretInput.value) {
        setSecretVisibility(els.secretInput, false);
        setStatus(t("idleHidden"));
      }
    }, SECRET_IDLE_MS);
  };

  const updateSizeHint = () => {
    const chars = Array.from(els.secretInput.value).length;
    els.sizeHint.textContent = `${chars} / ${MAX_CHARS} ${currentLang === "da" ? "tegn" : "characters"}`;
    els.sizeHint.classList.toggle("error", chars > MAX_CHARS);
  };

  const copyValue = async (targetId) => {
    const node = document.querySelector(`#${targetId}`);
    const value = node.tagName === "INPUT" ? node.value : node.textContent.trim();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const temp = document.createElement("textarea");
        temp.value = value;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.append(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
      }
      setStatus(t("copied"));
    } catch {
      setStatus(t("copyFailed"), true);
    }
  };

  const buildReceiveUrl = (code) => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("code", code);
    return url.toString();
  };

  const setQrCode = (code) => {
    const receiveUrl = buildReceiveUrl(code);
    els.qrLink.href = receiveUrl;
    els.qrImage.src = `/api/qr?code=${encodeURIComponent(code)}`;
  };

  const showUsedToast = () => {
    stopShareStatusWatch();
    window.clearInterval(countdownTimer);

    let remaining = USED_RELOAD_SECONDS;
    els.reloadCountdown.textContent = String(remaining);
    els.usedToast.hidden = false;
    els.usedToast.classList.remove("force-hidden");
    els.usedToast.style.display = "";
    setStatus(t("codeUsedStatus"));

    window.clearInterval(reloadTimer);
    reloadTimer = window.setInterval(() => {
      remaining -= 1;
      els.reloadCountdown.textContent = String(Math.max(remaining, 0));
      if (remaining <= 0) {
        window.clearInterval(reloadTimer);
        window.location.reload();
      }
    }, 1000);
  };

  const startShareStatusWatch = (code) => {
    stopShareStatusWatch();

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/status?code=${encodeURIComponent(code)}`, {
          headers: { Accept: "application/json" }
        });
        const data = await response.json();

        if (response.ok && data.active === false) {
          showUsedToast();
        }
      } catch {
        // Keep the sender page quiet if a transient network error happens.
      }
    };

    shareStatusTimer = window.setInterval(checkStatus, SHARE_STATUS_POLL_MS);
  };

  const startCountdown = (seconds) => {
    window.clearInterval(countdownTimer);
    let remaining = seconds;

    const render = () => {
      const minutes = Math.floor(remaining / 60);
      const secs = String(remaining % 60).padStart(2, "0");
      els.countdown.textContent = `${minutes}:${secs}`;
      if (remaining <= 0) {
        window.clearInterval(countdownTimer);
        stopShareStatusWatch();
        setStatus(t("codeExpired"));
      }
      remaining -= 1;
    };

    render();
    countdownTimer = window.setInterval(render, 1000);
  };

  els.langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentLang = button.dataset.lang === "da" ? "da" : "en";
      saveLanguage(currentLang);
      applyTranslations();
      updateSizeHint();
      clearValidation();
      setStatus("");
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });

  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector(`#${button.dataset.toggle}`);
      setSecretVisibility(input, input.type === "password");
      if (input === els.secretInput) scheduleSecretCensor();
      input.focus();
    });
  });

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyValue(button.dataset.copy));
  });

  els.ttlOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ttl]");
    if (!button) return;

    els.ttlSelect.value = button.dataset.ttl;
    els.ttlOptions.querySelectorAll("[data-ttl]").forEach((option) => {
      option.classList.toggle("is-selected", option === button);
    });
  });

  els.secretInput.addEventListener("focus", () => {
    setSecretVisibility(els.secretInput, true);
    scheduleSecretCensor();
  });
  els.secretInput.addEventListener("blur", () => {
    clearSecretIdleTimer();
    setSecretVisibility(els.secretInput, false);
  });
  els.secretInput.addEventListener("input", () => {
    setSecretVisibility(els.secretInput, true);
    scheduleSecretCensor();
    updateSizeHint();
    setFieldError(els.secretField, els.secretError);
  });

  els.codeInput.addEventListener("input", () => {
    els.codeInput.value = els.codeInput.value.replace(/\D/g, "").slice(0, 8);
    setFieldError(els.codeField, els.codeError);
  });

  els.sendForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearValidation();

    const chars = Array.from(els.secretInput.value).length;
    if (!els.secretInput.value) {
      setFieldError(els.secretField, els.secretError, t("secretRequired"));
      els.secretInput.focus();
      return;
    }

    if (chars > MAX_CHARS) {
      setFieldError(els.secretField, els.secretError, t("secretTooLarge", { chars, max: MAX_CHARS }));
      els.secretInput.focus();
      return;
    }

    setStatus(t("saving"));
    els.sendResult.hidden = true;

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: els.secretInput.value,
          ttlSeconds: Number(els.ttlSelect.value)
        })
      });

      if (!response.ok) throw new Error(t("saveFailed"));

      const data = await response.json();
      els.generatedCode.textContent = data.code;
      setQrCode(data.code);
      els.sendResult.hidden = false;
      els.sendResult.classList.remove("force-hidden");
      els.sendResult.style.display = "";
      setSecretVisibility(els.secretInput, false);
      startCountdown(Number(data.expiresInSeconds || 300));
      startShareStatusWatch(data.code);
      setStatus(t("codeReady"));
    } catch {
      setStatus(t("saveFailed"), true);
    }
  });

  els.receiveForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearValidation();

    if (!/^\d{8}$/.test(els.codeInput.value.trim())) {
      setFieldError(els.codeField, els.codeError, t("codeRequired"));
      els.codeInput.focus();
      return;
    }

    setStatus(t("retrieving"));
    els.receiveResult.hidden = true;

    try {
      const response = await fetch("/api/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: els.codeInput.value.trim() })
      });

      if (!response.ok) throw new Error(t("receiveFailed"));

      const data = await response.json();
      els.receivedSecret.value = data.secret;
      setSecretVisibility(els.receivedSecret, false);
      els.receiveResult.hidden = false;
      els.receiveResult.classList.remove("force-hidden");
      els.receiveResult.style.display = "";
      els.codeInput.value = "";
      setStatus(t("receiveSuccess"));
    } catch {
      setStatus(t("receiveFailed"), true);
    }
  });

  applyTranslations();
  updateSizeHint();

  const initialCode = new URLSearchParams(window.location.search).get("code");
  if (/^\d{8}$/.test(initialCode || "")) {
    showView("receiveView");
    els.codeInput.value = initialCode;
    window.history.replaceState({}, "", window.location.pathname);
    els.codeInput.focus();
  } else {
    showView("homeView");
  }
})();
