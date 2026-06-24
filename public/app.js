(() => {
  "use strict";

  const MAX_CHARS = 10000;
  const SECRET_IDLE_MS = 8000;
  const SHARE_STATUS_POLL_MS = 2500;
  const USED_RELOAD_SECONDS = 5;
  const COPIED_RELOAD_MS = 1600;
  const translations = {
    en: {
      pageTitle: "One time share",
      choiceTitle: "What do you want to do?",
      choiceText: "Choose one action.",
      appIntro: "Secure Share lets you hand over a short text or password through a single-use code. The content is encrypted on the server, can only be opened once, and is deleted automatically.",
      send: "Send",
      receive: "Receive",
      back: "Back",
      sendLead: "Enter the content, generate a code, and share the code through another channel.",
      receiveLead: "Enter the one-time code. The content is deleted from the server when it is retrieved.",
      contentType: "Content type",
      typeAria: "Choose content type",
      typePassword: "Password",
      typeText: "Text",
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
      qrLead: "The link opens the receive page with the code filled in.",
      copyReceiveLink: "Copy receive link",
      linkCopied: "Receive link copied.",
      codeWarningPrefix: "The code can only be used once and expires in",
      oneTimeCode: "One-time code",
      retrieveContent: "Retrieve content",
      contentRetrieved: "Content retrieved",
      deletedWarning: "The content has now been deleted from the server and cannot be retrieved again.",
      copyOnceNote: "You can copy the content once. It is removed from this page immediately afterwards.",
      copyContent: "Copy content",
      contentCopiedRemoved: "Copied. The content has been removed — reloading...",
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
      appIntro: "Secure Share lader dig overdrage en kort tekst eller adgangskode via en engangskode. Indholdet krypteres på serveren, kan kun åbnes én gang og slettes automatisk.",
      send: "Send",
      receive: "Modtag",
      back: "Tilbage",
      sendLead: "Indtast indholdet, generér en kode, og del koden via en anden kanal.",
      receiveLead: "Indtast engangskoden. Indholdet slettes fra serveren, når det hentes.",
      contentType: "Indholdstype",
      typeAria: "Vælg indholdstype",
      typePassword: "Adgangskode",
      typeText: "Tekst",
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
      qrLead: "Linket åbner modtagersiden med koden udfyldt.",
      copyReceiveLink: "Kopiér modtagerlink",
      linkCopied: "Modtagerlink kopieret.",
      codeWarningPrefix: "Koden kan kun bruges én gang og udløber om",
      oneTimeCode: "Engangskode",
      retrieveContent: "Hent indhold",
      contentRetrieved: "Indhold hentet",
      deletedWarning: "Indholdet er nu slettet fra serveren og kan ikke hentes igen.",
      copyOnceNote: "Du kan kopiere indholdet én gang. Det fjernes fra denne side umiddelbart efter.",
      copyContent: "Kopiér indhold",
      contentCopiedRemoved: "Kopieret. Indholdet er fjernet — genindlæser...",
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
    typeOptions: document.querySelector("#typeOptions"),
    typeSelect: document.querySelector("#typeSelect"),
    secretField: document.querySelector("#secretField"),
    secretError: document.querySelector("#secretError"),
    secretInput: document.querySelector("#secretInput"),
    secretTextarea: document.querySelector("#secretTextarea"),
    passwordWrap: document.querySelector("#passwordWrap"),
    ttlOptions: document.querySelector("#ttlOptions"),
    ttlSelect: document.querySelector("#ttlSelect"),
    sizeHint: document.querySelector("#sizeHint"),
    sendResult: document.querySelector("#sendResult"),
    generatedCode: document.querySelector("#generatedCode"),
    qrImage: document.querySelector("#qrImage"),
    qrCopyLink: document.querySelector("#qrCopyLink"),
    countdown: document.querySelector("#countdown"),
    codeField: document.querySelector("#codeField"),
    codeError: document.querySelector("#codeError"),
    codeInput: document.querySelector("#codeInput"),
    receiveResult: document.querySelector("#receiveResult"),
    receivedPasswordWrap: document.querySelector("#receivedPasswordWrap"),
    receivedSecret: document.querySelector("#receivedSecret"),
    receivedSecretArea: document.querySelector("#receivedSecretArea")
  };

  let countdownTimer = null;
  let secretIdleTimer = null;
  let shareStatusTimer = null;
  let reloadTimer = null;
  let currentReceiveUrl = "";
  let currentReceiveKind = "password";
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

  const setStatus = (message, error = false, success = false) => {
    els.status.textContent = message;
    els.status.classList.toggle("error", error);
    els.status.classList.toggle("success", success);
  };

  const setHidden = (node, hidden) => {
    node.hidden = hidden;
    node.classList.toggle("force-hidden", hidden);
    node.style.display = hidden ? "none" : "";
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
    setHidden(els.usedToast, true);
  };

  const stopShareStatusWatch = () => {
    window.clearInterval(shareStatusTimer);
    shareStatusTimer = null;
  };

  // Which send control is currently active (depends on the chosen content type).
  const sendControl = () => (els.typeSelect.value === "text" ? els.secretTextarea : els.secretInput);

  const showView = (id) => {
    Object.entries(views).forEach(([key, node]) => {
      setHidden(node, key !== id);
    });
    setHidden(els.sendResult, true);
    setHidden(els.receiveResult, true);
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
    const chars = Array.from(sendControl().value).length;
    els.sizeHint.textContent = `${chars} / ${MAX_CHARS} ${currentLang === "da" ? "tegn" : "characters"}`;
    els.sizeHint.classList.toggle("error", chars > MAX_CHARS);
  };

  const setSendType = (kind) => {
    const isText = kind === "text";
    const from = isText ? els.secretInput : els.secretTextarea;
    const to = isText ? els.secretTextarea : els.secretInput;

    // Carry the typed content across so switching type never loses input.
    to.value = from.value;
    from.value = "";

    els.typeSelect.value = isText ? "text" : "password";
    setHidden(els.passwordWrap, isText);
    setHidden(els.secretTextarea, !isText);
    if (!isText) setSecretVisibility(els.secretInput, false);

    els.typeOptions.querySelectorAll("[data-type]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.type === els.typeSelect.value);
    });

    setFieldError(els.secretField, els.secretError);
    updateSizeHint();
  };

  const writeClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const temp = document.createElement("textarea");
    temp.value = value;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.append(temp);
    temp.select();
    const ok = document.execCommand("copy");
    temp.remove();
    if (!ok) throw new Error("Copy command failed");
  };

  const copyValue = async (targetId) => {
    const node = document.querySelector(`#${targetId}`);
    const value = node.tagName === "INPUT" || node.tagName === "TEXTAREA" ? node.value : node.textContent.trim();

    try {
      await writeClipboard(value);
      setStatus(t("copied"));
    } catch {
      setStatus(t("copyFailed"), true);
    }
  };

  const receivedValue = () =>
    (currentReceiveKind === "text" ? els.receivedSecretArea.value : els.receivedSecret.value);

  // One-time copy: on success the content is wiped from the page instantly and the page reloads.
  const copyContentOnce = async () => {
    const value = receivedValue();

    try {
      await writeClipboard(value);
    } catch {
      // Keep the content in place so the user can still copy it manually.
      setStatus(t("copyFailed"), true);
      return;
    }

    els.receivedSecret.value = "";
    els.receivedSecretArea.value = "";
    setHidden(els.receiveResult, true);
    setStatus(t("contentCopiedRemoved"), false, true);

    window.setTimeout(() => window.location.reload(), COPIED_RELOAD_MS);
  };

  const buildReceiveUrl = (code) => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("code", code);
    return url.toString();
  };

  const setQrCode = (code) => {
    currentReceiveUrl = buildReceiveUrl(code);
    els.qrImage.src = `/api/qr?code=${encodeURIComponent(code)}`;
  };

  const showUsedToast = () => {
    stopShareStatusWatch();
    window.clearInterval(countdownTimer);

    let remaining = USED_RELOAD_SECONDS;
    els.reloadCountdown.textContent = String(remaining);
    setHidden(els.usedToast, false);
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

  document.querySelectorAll("[data-copy-once]").forEach((button) => {
    button.addEventListener("click", copyContentOnce);
  });

  els.qrCopyLink.addEventListener("click", async () => {
    if (!currentReceiveUrl) return;
    try {
      await writeClipboard(currentReceiveUrl);
      setStatus(t("linkCopied"));
    } catch {
      setStatus(t("copyFailed"), true);
    }
  });

  els.typeOptions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    setSendType(button.dataset.type);
    sendControl().focus();
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

  els.secretTextarea.addEventListener("input", () => {
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

    const control = sendControl();
    const value = control.value;
    const chars = Array.from(value).length;

    if (!value) {
      setFieldError(els.secretField, els.secretError, t("secretRequired"));
      control.focus();
      return;
    }

    if (chars > MAX_CHARS) {
      setFieldError(els.secretField, els.secretError, t("secretTooLarge", { chars, max: MAX_CHARS }));
      control.focus();
      return;
    }

    setStatus(t("saving"));
    setHidden(els.sendResult, true);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: value,
          kind: els.typeSelect.value,
          ttlSeconds: Number(els.ttlSelect.value)
        })
      });

      if (!response.ok) throw new Error(t("saveFailed"));

      const data = await response.json();
      els.generatedCode.textContent = data.code;
      setQrCode(data.code);
      setHidden(els.sendResult, false);
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
    setHidden(els.receiveResult, true);

    try {
      const response = await fetch("/api/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: els.codeInput.value.trim() })
      });

      if (!response.ok) throw new Error(t("receiveFailed"));

      const data = await response.json();
      currentReceiveKind = data.kind === "password" ? "password" : "text";

      if (currentReceiveKind === "text") {
        els.receivedSecretArea.value = data.secret;
        els.receivedSecret.value = "";
        setHidden(els.receivedPasswordWrap, true);
        setHidden(els.receivedSecretArea, false);
      } else {
        els.receivedSecret.value = data.secret;
        els.receivedSecretArea.value = "";
        setSecretVisibility(els.receivedSecret, false);
        setHidden(els.receivedPasswordWrap, false);
        setHidden(els.receivedSecretArea, true);
      }

      setHidden(els.receiveResult, false);
      els.codeInput.value = "";
      setStatus(t("receiveSuccess"));
    } catch {
      setStatus(t("receiveFailed"), true);
    }
  });

  applyTranslations();
  setSendType(els.typeSelect.value);
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
