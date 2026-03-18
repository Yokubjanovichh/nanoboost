(function () {
  const form = document.querySelector("#contact-form");
  const hint = document.querySelector("#contact-form-hint");

  const contactButtons = Array.from(
    document.querySelectorAll(".contact-card--apps .contact-app[data-contact]"),
  );
  const contactLabel = document.querySelector(
    '.contact-form__label[for="contact-discord"]',
  );
  const contactInput = document.querySelector("#contact-discord");

  let preferredContact = "discord";

  if (!form) return;

  const safeValue = (value) => String(value || "").trim();

  const applyPreferredContact = (channel) => {
    preferredContact = channel === "whatsapp" ? "whatsapp" : "discord";

    if (contactLabel) {
      contactLabel.textContent =
        preferredContact === "whatsapp" ? "WhatsApp" : "Discord";
    }

    if (contactInput) {
      if (preferredContact === "whatsapp") {
        contactInput.type = "tel";
        contactInput.autocomplete = "tel";
        contactInput.placeholder = "Enter your WhatsApp number";
      } else {
        contactInput.type = "text";
        contactInput.autocomplete = "off";
        contactInput.placeholder = "DiscordName#0000 or username";
      }
    }

    contactButtons.forEach((button) => {
      const isActive = button.getAttribute("data-contact") === preferredContact;
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });
  };

  if (contactButtons.length) {
    contactButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const channel = button.getAttribute("data-contact");
        applyPreferredContact(channel);
        if (contactInput) contactInput.focus();
      });
    });
  }

  applyPreferredContact(preferredContact);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const contactHandle = safeValue(formData.get("discord"));
    const email = safeValue(formData.get("email"));
    const comment = safeValue(formData.get("comment"));

    const subject = "Nanoboost Contact Request";
    const bodyLines = [
      "New message from Contact page:",
      "",
      `Preferred contact: ${preferredContact === "whatsapp" ? "WhatsApp" : "Discord"}`,
      `${preferredContact === "whatsapp" ? "WhatsApp" : "Discord"}: ${
        contactHandle || "-"
      }`,
      `Email: ${email || "-"}`,
      "",
      "Comment:",
      comment || "-",
      "",
      "---",
      "Sent from nanoboost website",
    ];

    const mailto = `mailto:support@nanoboost.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    if (hint) {
      hint.textContent = "Opening your email app…";
    }

    window.location.href = mailto;
  });
})();
