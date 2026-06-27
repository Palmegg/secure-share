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
      receiveSuccess: "The content was retrieved and deleted from the server.",
      liveSession: "Live session",
      liveSessionHint: "Encrypted real-time chat between two devices.",
      liveLead: "Start a session to get a PIN, or join an existing one. Messages are end-to-end encrypted between the two devices.",
      liveStart: "Start",
      liveJoin: "Join",
      liveHostLead: "Share this PIN with the other device. They enter it under “Join”.",
      livePinLabel: "Session PIN",
      livePinExpiry: "Waiting for the other device. The PIN expires in",
      liveWaiting: "Waiting for the other device to join…",
      liveJoinLead: "Enter the 8-digit PIN shown on the other device.",
      liveJoinButton: "Join session",
      liveLeave: "Leave",
      liveConnected: "Connected",
      liveSafety: "Safety code",
      liveSafetyNote: "Both devices should show the same safety code. If they differ, stop — the channel is not private.",
      liveSend: "Send",
      livePlaceholder: "Message…",
      liveConnecting: "Connecting…",
      liveSecuring: "Securing channel…",
      livePeerLeft: "The other device left. Session ended.",
      livePeerDisconnected: "The other device dropped. Waiting for reconnect…",
      livePeerReconnected: "The other device reconnected.",
      liveReconnecting: "Connection lost. Reconnecting…",
      liveSessionExpired: "The session expired.",
      liveJoinFailed: "PIN is invalid, expired, or already in use.",
      livePinRequired: "Enter the 8-digit PIN.",
      liveConnectFailed: "Could not connect to the server.",
      liveEnded: "Session ended.",
      livePeerTyping: "The other device is typing…",
      liveCopy: "Copy",
      liveCopied: "Copied!"
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
      receiveSuccess: "Indholdet blev hentet og slettet fra serveren.",
      liveSession: "Live session",
      liveSessionHint: "Krypteret realtidschat mellem to enheder.",
      liveLead: "Start en session for at få en PIN, eller deltag i en eksisterende. Beskeder er end-to-end-krypteret mellem de to enheder.",
      liveStart: "Start",
      liveJoin: "Deltag",
      liveHostLead: "Del denne PIN med den anden enhed. De indtaster den under “Deltag”.",
      livePinLabel: "Session-PIN",
      livePinExpiry: "Venter på den anden enhed. PIN-koden udløber om",
      liveWaiting: "Venter på, at den anden enhed deltager…",
      liveJoinLead: "Indtast den 8-cifrede PIN, der vises på den anden enhed.",
      liveJoinButton: "Deltag i session",
      liveLeave: "Forlad",
      liveConnected: "Forbundet",
      liveSafety: "Sikkerhedskode",
      liveSafetyNote: "Begge enheder bør vise samme sikkerhedskode. Hvis de er forskellige, så stop — kanalen er ikke privat.",
      liveSend: "Send",
      livePlaceholder: "Besked…",
      liveConnecting: "Forbinder…",
      liveSecuring: "Sikrer kanal…",
      livePeerLeft: "Den anden enhed forlod sessionen. Session afsluttet.",
      livePeerDisconnected: "Den anden enhed mistede forbindelsen. Venter på genforbindelse…",
      livePeerReconnected: "Den anden enhed er forbundet igen.",
      liveReconnecting: "Forbindelse mistet. Genforbinder…",
      liveSessionExpired: "Sessionen udløb.",
      liveJoinFailed: "PIN er ugyldig, udløbet eller allerede i brug.",
      livePinRequired: "Indtast den 8-cifrede PIN.",
      liveConnectFailed: "Kunne ikke oprette forbindelse til serveren.",
      liveEnded: "Session afsluttet.",
      livePeerTyping: "Den anden enhed skriver…",
      liveCopy: "Kopiér",
      liveCopied: "Kopieret!"
    }
  };

  const views = {
    homeView: document.querySelector("#homeView"),
    sendView: document.querySelector("#sendView"),
    receiveView: document.querySelector("#receiveView"),
    liveChoiceView: document.querySelector("#liveChoiceView"),
    liveHostView: document.querySelector("#liveHostView"),
    liveJoinView: document.querySelector("#liveJoinView"),
    liveChatView: document.querySelector("#liveChatView")
  };

  const els = {
    appRoot: document.querySelector("main.app"),
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
    receivedSecretArea: document.querySelector("#receivedSecretArea"),
    livePin: document.querySelector("#livePin"),
    livePinCountdown: document.querySelector("#livePinCountdown"),
    liveHostStatus: document.querySelector("#liveHostStatus"),
    liveJoinForm: document.querySelector("#liveJoinForm"),
    livePinField: document.querySelector("#livePinField"),
    livePinError: document.querySelector("#livePinError"),
    livePinInput: document.querySelector("#livePinInput"),
    liveStatus: document.querySelector("#liveStatus"),
    liveSafetyCode: document.querySelector("#liveSafetyCode"),
    liveTranscript: document.querySelector("#liveTranscript"),
    liveTyping: document.querySelector("#liveTyping"),
    liveMsgForm: document.querySelector("#liveMsgForm"),
    liveMsgInput: document.querySelector("#liveMsgInput")
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

    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
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
    els.appRoot.classList.toggle("app-wide", id === "liveChatView");
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
    els.secretTextarea.classList.remove("is-censored");
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

  els.secretTextarea.addEventListener("focus", () => {
    els.secretTextarea.classList.remove("is-censored");
  });
  els.secretTextarea.addEventListener("input", () => {
    els.secretTextarea.classList.remove("is-censored");
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

      // The content stays in the box but is masked so it is no longer readable,
      // regardless of type (password -> dots, text -> CSS text-security).
      // Focusing the field reveals it again for a new entry.
      setSecretVisibility(els.secretInput, false);
      els.secretTextarea.classList.add("is-censored");
      clearSecretIdleTimer();

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

  // ---------------------------------------------------------------------------
  // Live session: end-to-end encrypted real-time chat.
  // ECDH (P-256) over the relay -> HKDF(shared, salt=PIN) -> AES-256-GCM.
  // The server only ever sees public keys and ciphertext.
  // ---------------------------------------------------------------------------

  const LIVE_INFO = new TextEncoder().encode("secure-share-live-v1");
  const lv = {
    ws: null, role: null, token: null, pin: null,
    keyPair: null, keysReady: null, myPubRaw: null, sessionKey: null,
    sendCounter: 0, lastRecvCounter: -1,
    active: false, closingByUser: false, reconnectAttempts: 0,
    pinTimer: null, reconnectTimer: null,
    typingSent: false, typingTimer: null, typingHideTimer: null
  };

  const liveSupported = () => Boolean(window.WebSocket && window.crypto && window.crypto.subtle);
  const liveWsUrl = () => `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/live-ws`;

  const bytesToB64 = (bytes) => {
    let s = "";
    for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  };
  const b64ToBytes = (b64) => {
    const s = atob(b64);
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i += 1) bytes[i] = s.charCodeAt(i);
    return bytes;
  };
  const compareBytes = (a, b) => {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i += 1) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  };

  const liveWsSend = (obj) => {
    if (lv.ws && lv.ws.readyState === WebSocket.OPEN) lv.ws.send(JSON.stringify(obj));
  };

  function liveGenKeys() {
    lv.keysReady = (async () => {
      lv.keyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
      lv.myPubRaw = new Uint8Array(await crypto.subtle.exportKey("raw", lv.keyPair.publicKey));
    })();
    return lv.keysReady;
  }

  async function liveDeriveKey(peerRawB64) {
    const peerRaw = b64ToBytes(peerRawB64);
    const peerKey = await crypto.subtle.importKey("raw", peerRaw, { name: "ECDH", namedCurve: "P-256" }, false, []);
    const sharedBits = await crypto.subtle.deriveBits({ name: "ECDH", public: peerKey }, lv.keyPair.privateKey, 256);
    const hkdfKey = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
    lv.sessionKey = await crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode(lv.pin), info: LIVE_INFO },
      hkdfKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    await liveComputeSafety(peerRaw);
  }

  async function liveComputeSafety(peerRaw) {
    const first = compareBytes(lv.myPubRaw, peerRaw) <= 0 ? lv.myPubRaw : peerRaw;
    const second = first === lv.myPubRaw ? peerRaw : lv.myPubRaw;
    const concat = new Uint8Array(first.length + second.length);
    concat.set(first, 0);
    concat.set(second, first.length);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", concat));
    const hex = [...hash.slice(0, 4)].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
    els.liveSafetyCode.textContent = `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }

  async function liveEncrypt(text) {
    const nonce = new Uint8Array(12);
    nonce[0] = lv.role === "host" ? 0 : 1;
    new DataView(nonce.buffer).setUint32(8, lv.sendCounter, false);
    lv.sendCounter += 1;
    const ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce }, lv.sessionKey, new TextEncoder().encode(text)
    ));
    const frame = new Uint8Array(12 + ct.length);
    frame.set(nonce, 0);
    frame.set(ct, 12);
    return bytesToB64(frame);
  }

  async function liveDecrypt(b64) {
    const frame = b64ToBytes(b64);
    if (frame.length < 13) throw new Error("short frame");
    const nonce = frame.slice(0, 12);
    const ct = frame.slice(12);
    const peerDir = lv.role === "host" ? 1 : 0;
    if (nonce[0] !== peerDir) throw new Error("bad direction");
    const counter = new DataView(nonce.buffer).getUint32(8, false);
    if (counter <= lv.lastRecvCounter) throw new Error("replay/reorder");
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, lv.sessionKey, ct);
    lv.lastRecvCounter = counter;
    return new TextDecoder().decode(pt);
  }

  const liveSetStatus = (key, ok) => {
    els.liveStatus.textContent = t(key);
    els.liveStatus.classList.toggle("live-status-ok", Boolean(ok));
    els.liveStatus.classList.toggle("live-status-warn", !ok);
  };

  const EYE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>';

  // Decide whether a message should render as a code block, and strip ``` fences.
  const liveClassify = (raw) => {
    const trimmed = raw.trim();
    const fence = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(trimmed);
    if (fence) return { code: true, text: fence[1] };
    const codey = /[{};]|=>|^\s{2,}\S|\b(function|const|let|var|def|class|import|export|return|public|void|sudo|npm|git|curl|docker|systemctl|#!\/)\b/m.test(raw);
    if (raw.includes("\n") && codey) return { code: true, text: raw };
    return { code: false, text: raw };
  };

  // Sent payloads carry the text, sender timestamp, and code flag (all encrypted).
  const liveParsePayload = (rawJson) => {
    try {
      const o = JSON.parse(rawJson);
      if (o && typeof o.x === "string") {
        return { text: o.x, ts: Number(o.ts) || Date.now(), code: Boolean(o.c) };
      }
    } catch { /* fall through to plain text */ }
    const cls = liveClassify(rawJson);
    return { text: cls.text, ts: Date.now(), code: cls.code };
  };

  const liveFormatTime = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const liveAppendMessage = (data, mine) => {
    const div = document.createElement("div");
    div.className = `live-msg ${mine ? "live-msg-mine" : "live-msg-peer"}${data.code ? " live-msg-code" : ""}`;

    const body = document.createElement("div");
    body.className = "live-msg-body";

    if (data.code) {
      const pre = document.createElement("pre");
      pre.className = "live-code";
      const codeEl = document.createElement("code");
      codeEl.className = "live-msg-text";
      codeEl.textContent = data.text; // textContent: never interpret content as HTML
      pre.append(codeEl);
      body.append(pre);
    } else {
      const span = document.createElement("span");
      span.className = "live-msg-text";
      span.textContent = data.text;
      body.append(span);
    }

    const time = document.createElement("time");
    time.className = "live-msg-time";
    time.textContent = liveFormatTime(data.ts);
    body.append(time);

    const actions = document.createElement("div");
    actions.className = "live-msg-actions";

    const eye = document.createElement("button");
    eye.type = "button";
    eye.className = "live-msg-eye";
    eye.setAttribute("aria-label", t("toggleSecret"));
    eye.innerHTML = EYE_SVG; // static markup, no user data
    eye.addEventListener("click", () => div.classList.toggle("revealed"));
    actions.append(eye);

    if (data.code) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "live-msg-copy";
      copy.textContent = t("liveCopy");
      copy.addEventListener("click", async () => {
        try {
          await writeClipboard(data.text);
          copy.textContent = t("liveCopied");
          copy.classList.add("is-copied");
          window.setTimeout(() => {
            copy.textContent = t("liveCopy");
            copy.classList.remove("is-copied");
          }, 1500);
        } catch {
          setStatus(t("copyFailed"), true);
        }
      });
      actions.append(copy);
    }

    div.append(body, actions);
    els.liveTranscript.append(div);
    els.liveTranscript.scrollTop = els.liveTranscript.scrollHeight;
  };

  const liveShowTyping = (on) => {
    window.clearTimeout(lv.typingHideTimer);
    if (on) {
      setHidden(els.liveTyping, false);
      els.liveTranscript.scrollTop = els.liveTranscript.scrollHeight;
      // Safety net in case the "off" frame is lost.
      lv.typingHideTimer = window.setTimeout(() => setHidden(els.liveTyping, true), 6000);
    } else {
      setHidden(els.liveTyping, true);
    }
  };

  const liveSendTyping = (on) => {
    if (!lv.sessionKey || lv.typingSent === on) return;
    lv.typingSent = on;
    liveWsSend({ t: "typing", on });
  };

  const liveEnterChat = () => {
    els.liveTranscript.replaceChildren();
    setHidden(els.liveTyping, true);
    els.liveSafetyCode.textContent = "····";
    els.liveMsgInput.value = "";
    showView("liveChatView");
  };

  const liveStopPinCountdown = () => {
    window.clearInterval(lv.pinTimer);
    lv.pinTimer = null;
  };

  const liveStartPinCountdown = (seconds) => {
    liveStopPinCountdown();
    let remaining = seconds;
    const render = () => {
      const mm = Math.floor(remaining / 60);
      const ss = String(remaining % 60).padStart(2, "0");
      els.livePinCountdown.textContent = `${mm}:${ss}`;
      if (remaining <= 0) liveStopPinCountdown();
      remaining -= 1;
    };
    render();
    lv.pinTimer = window.setInterval(render, 1000);
  };

  function liveReset() {
    lv.closingByUser = true;
    liveStopPinCountdown();
    window.clearTimeout(lv.reconnectTimer);
    lv.reconnectTimer = null;
    window.clearTimeout(lv.typingTimer);
    window.clearTimeout(lv.typingHideTimer);
    lv.typingTimer = null;
    lv.typingHideTimer = null;
    lv.typingSent = false;
    setHidden(els.liveTyping, true);
    if (lv.ws) { try { lv.ws.close(); } catch { /* ignore */ } }
    lv.ws = null;
    lv.role = null;
    lv.token = null;
    lv.pin = null;
    lv.keyPair = null;
    lv.keysReady = null;
    lv.myPubRaw = null;
    lv.sessionKey = null;
    lv.sendCounter = 0;
    lv.lastRecvCounter = -1;
    lv.active = false;
    lv.reconnectAttempts = 0;
    els.liveTranscript.replaceChildren();
    els.liveMsgInput.value = "";
    els.liveSafetyCode.textContent = "····";
  }

  function liveEnd(key, isError) {
    liveReset();
    showView("liveChoiceView");
    setStatus(t(key), Boolean(isError));
  }

  function liveConnect(onOpen) {
    let ws;
    try {
      ws = new WebSocket(liveWsUrl());
    } catch {
      liveEnd("liveConnectFailed", true);
      return;
    }
    lv.ws = ws;
    ws.onopen = () => { lv.reconnectAttempts = 0; if (onOpen) onOpen(); };
    ws.onmessage = (ev) => liveOnServer(ev.data);
    ws.onclose = () => liveOnClose();
    ws.onerror = () => {};
  }

  function liveOnClose() {
    if (lv.closingByUser) return;
    if (!lv.active) {
      liveReset();
      showView("liveChoiceView");
      setStatus(t("liveConnectFailed"), true);
      return;
    }
    if (lv.reconnectAttempts >= 5) {
      liveEnd("liveReconnecting", true);
      return;
    }
    lv.reconnectAttempts += 1;
    liveSetStatus("liveReconnecting", false);
    lv.reconnectTimer = window.setTimeout(() => {
      liveConnect(() => liveWsSend({ t: "resume", token: lv.token }));
    }, 1000 * lv.reconnectAttempts);
  }

  async function liveOnServer(raw) {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== "string") return;

    switch (m.t) {
      case "created":
        lv.role = "host";
        lv.token = m.token;
        lv.pin = m.pin;
        els.livePin.textContent = m.pin;
        liveStartPinCountdown(120);
        return;
      case "joined":
        lv.role = "guest";
        lv.token = m.token;
        liveEnterChat();
        liveSetStatus("liveSecuring", false);
        await liveGenKeys();
        liveWsSend({ t: "signal", data: bytesToB64(lv.myPubRaw) });
        return;
      case "peer-joined":
        liveStopPinCountdown();
        liveEnterChat();
        liveSetStatus("liveSecuring", false);
        await liveGenKeys();
        liveWsSend({ t: "signal", data: bytesToB64(lv.myPubRaw) });
        return;
      case "signal":
        if (lv.sessionKey || !lv.keysReady) return;
        try {
          await lv.keysReady;
          await liveDeriveKey(m.data);
          lv.active = true;
          liveSetStatus("liveConnected", true);
          els.liveMsgInput.focus();
        } catch {
          liveEnd("liveConnectFailed", true);
        }
        return;
      case "msg":
        if (!lv.sessionKey) return;
        liveShowTyping(false);
        try {
          liveAppendMessage(liveParsePayload(await liveDecrypt(m.data)), false);
        } catch { /* drop bad/replayed frame */ }
        return;
      case "typing":
        if (lv.sessionKey) liveShowTyping(Boolean(m.on));
        return;
      case "peer-disconnected":
        liveSetStatus("livePeerDisconnected", false);
        return;
      case "peer-reconnected":
        liveSetStatus("liveConnected", true);
        return;
      case "resumed":
        liveSetStatus("liveConnected", true);
        return;
      case "peer-left":
        liveEnd("livePeerLeft");
        return;
      case "session-expired":
        liveEnd("liveSessionExpired");
        return;
      case "join-failed":
        liveReset();
        showView("liveJoinView");
        setStatus(t("liveJoinFailed"), true);
        els.livePinInput.value = "";
        els.livePinInput.focus();
        return;
      case "resume-failed":
      case "error":
        liveEnd("liveConnectFailed", true);
        return;
      default:
        return;
    }
  }

  function liveStartHost() {
    if (!liveSupported()) { liveEnd("liveConnectFailed", true); return; }
    liveReset();
    lv.closingByUser = false;
    els.livePin.textContent = "········";
    els.livePinCountdown.textContent = "2:00";
    showView("liveHostView");
    liveConnect(() => liveWsSend({ t: "create" }));
  }

  function liveLeaveByUser() {
    if (lv.ws && lv.ws.readyState === WebSocket.OPEN) liveWsSend({ t: "leave" });
    liveReset();
    showView("liveChoiceView");
  }

  document.querySelectorAll("[data-live]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.live;
      if (action === "start") {
        liveStartHost();
      } else if (action === "join") {
        showView("liveJoinView");
        els.livePinInput.value = "";
        els.livePinInput.focus();
      } else if (action === "leave") {
        liveLeaveByUser();
      }
    });
  });

  els.livePinInput.addEventListener("input", () => {
    els.livePinInput.value = els.livePinInput.value.replace(/\D/g, "").slice(0, 8);
    setFieldError(els.livePinField, els.livePinError);
  });

  els.liveJoinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setFieldError(els.livePinField, els.livePinError);
    if (!liveSupported()) { setStatus(t("liveConnectFailed"), true); return; }

    const pin = els.livePinInput.value.trim();
    if (!/^\d{8}$/.test(pin)) {
      setFieldError(els.livePinField, els.livePinError, t("livePinRequired"));
      els.livePinInput.focus();
      return;
    }

    liveReset();
    lv.closingByUser = false;
    lv.pin = pin;
    setStatus(t("liveConnecting"));
    liveConnect(() => liveWsSend({ t: "join", pin }));
  });

  els.liveMsgInput.addEventListener("input", () => {
    if (!lv.sessionKey) return;
    liveSendTyping(els.liveMsgInput.value.length > 0);
    window.clearTimeout(lv.typingTimer);
    lv.typingTimer = window.setTimeout(() => liveSendTyping(false), 1500);
  });

  els.liveMsgInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      els.liveMsgForm.requestSubmit();
    }
  });

  els.liveMsgForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = els.liveMsgInput.value;
    if (!text || !lv.sessionKey) return;
    if (Array.from(text).length > MAX_CHARS) return;

    window.clearTimeout(lv.typingTimer);
    liveSendTyping(false);

    try {
      const cls = liveClassify(text);
      const ts = Date.now();
      const frame = await liveEncrypt(JSON.stringify({ x: cls.text, ts, c: cls.code }));
      liveWsSend({ t: "msg", data: frame });
      liveAppendMessage({ text: cls.text, ts, code: cls.code }, true);
      els.liveMsgInput.value = "";
      els.liveMsgInput.focus();
    } catch {
      setStatus(t("liveConnectFailed"), true);
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
