(function () {
  const form = document.querySelector("#contact-form");
  const hint = document.querySelector("#contact-form-hint");
  const dropdown = document.querySelector("#contact-dropdown");
  const socialInput = document.querySelector("#contact-social-input");

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

  // Dropdown open/close
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

  // Keyboard nav
  dropdown.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
      trigger.focus();
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) closeDropdown();
  });

  // Form submit
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const contactHandle = safeValue(formData.get("social"));
    const email = safeValue(formData.get("email"));
    const comment = safeValue(formData.get("comment"));

    const meta = contactMeta[selected];
    const subject = "Nanoboost Contact Request";
    const bodyLines = [
      "New message from Contact page:",
      "",
      `Preferred contact: ${meta.label}`,
      `${meta.label}: ${contactHandle || "-"}`,
      `Email: ${email || "-"}`,
      "",
      "Comment:",
      comment || "-",
      "",
      "---",
      "Sent from nanoboost website",
    ];

    const mailto = `mailto:support@nanoboost.io?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    if (hint) {
      hint.textContent = "Opening your email app…";
    }

    window.location.href = mailto;
  });
})();
