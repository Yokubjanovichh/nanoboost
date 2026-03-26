(function () {
  const form = document.querySelector("#contact-form");
  const hint = document.querySelector("#contact-form-hint");
  const dropdown = document.querySelector("#contact-dropdown");
  const socialInput = document.querySelector("#contact-social-input");
  const emailInput = document.querySelector("#contact-email");

  if (!form || !dropdown) return;

  const trigger = dropdown.querySelector(".contact-dropdown__trigger");
  const valueLabel = dropdown.querySelector(".contact-dropdown__value");
  const menu = dropdown.querySelector(".contact-dropdown__menu");
  const options = dropdown.querySelectorAll(".contact-dropdown__option");

  const contactMeta = {
    discord: {
      label: "Discord",
      type: "text",
      autocomplete: "off",
      placeholder: "DiscordName#0000 or username",
    },
    telegram: {
      label: "Telegram",
      type: "text",
      autocomplete: "off",
      placeholder: "@username",
    },
    whatsapp: {
      label: "WhatsApp",
      type: "tel",
      autocomplete: "tel",
      placeholder: "Enter your WhatsApp number",
    },
  };

  let selected = "discord";

  const safeValue = (value) => String(value || "").trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ── Validation helpers ──
  const showError = (input, errorId, message) => {
    const errorEl = document.querySelector("#" + errorId);
    if (input) input.classList.add("is-invalid");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
    }
  };

  const clearError = (input, errorId) => {
    const errorEl = document.querySelector("#" + errorId);
    if (input) input.classList.remove("is-invalid");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("is-visible");
    }
  };

  const validateSocial = () => {
    const val = safeValue(socialInput?.value);
    if (!val) {
      showError(socialInput, "contact-social-error", `Please enter your ${contactMeta[selected].label}`);
      return false;
    }
    clearError(socialInput, "contact-social-error");
    return true;
  };

  const validateEmail = () => {
    const val = safeValue(emailInput?.value);
    if (!val) {
      showError(emailInput, "contact-email-error", "Please enter your email address");
      return false;
    }
    if (!emailRegex.test(val)) {
      showError(emailInput, "contact-email-error", "Please enter a valid email address");
      return false;
    }
    clearError(emailInput, "contact-email-error");
    return true;
  };

  // Real-time validation on blur
  if (socialInput) {
    socialInput.addEventListener("blur", () => {
      if (socialInput.value) validateSocial();
    });
    socialInput.addEventListener("input", () => {
      if (socialInput.classList.contains("is-invalid")) validateSocial();
    });
  }

  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      if (emailInput.value) validateEmail();
    });
    emailInput.addEventListener("input", () => {
      if (emailInput.classList.contains("is-invalid")) validateEmail();
    });
  }

  // ── Dropdown ──
  const openDropdown = () => {
    dropdown.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  };

  const closeDropdown = () => {
    dropdown.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  };

  const selectOption = (value) => {
    selected = contactMeta[value] ? value : "discord";
    const meta = contactMeta[selected];

    valueLabel.textContent = meta.label;

    options.forEach((opt) => {
      opt.setAttribute(
        "aria-selected",
        opt.dataset.value === selected ? "true" : "false",
      );
    });

    if (socialInput) {
      socialInput.type = meta.type;
      socialInput.autocomplete = meta.autocomplete;
      socialInput.placeholder = meta.placeholder;
      if (socialInput.classList.contains("is-invalid")) validateSocial();
    }

    closeDropdown();
  };

  trigger.addEventListener("click", () => {
    dropdown.classList.contains("is-open") ? closeDropdown() : openDropdown();
  });

  menu.addEventListener("click", (e) => {
    const opt = e.target.closest(".contact-dropdown__option");
    if (!opt) return;
    selectOption(opt.dataset.value);
    trigger.focus();
  });

  dropdown.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
      trigger.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) closeDropdown();
  });

  // ── Form submit ──
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const socialValid = validateSocial();
    const emailValid = validateEmail();

    if (!socialValid || !emailValid) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const contactHandle = safeValue(socialInput?.value);
    const email = safeValue(emailInput?.value);
    const comment = safeValue(form.querySelector("#contact-comment")?.value);

    const meta = contactMeta[selected];

    const payload = {
      type: "contact",
      preferredContact: meta.label,
      handle: contactHandle,
      email,
      comment,
    };

    const submitBtn = form.querySelector(".contact-form__btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "SENDING...";
    }
    if (hint) hint.textContent = "";

    fetch(window.NB_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === "ok") {
          if (hint) {
            hint.style.color = "#4ade80";
            hint.textContent = "Message sent! We\u2019ll get back to you soon.";
          }
          form.reset();
          selectOption("discord");
        } else {
          throw new Error(result.message || "Server error");
        }
      })
      .catch(() => {
        if (hint) {
          hint.style.color = "#ff6b6b";
          hint.textContent = "Something went wrong. Please try again or contact us via Discord.";
        }
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "SEND";
        }
      });
  });
})();
