const SERVICE_CONFIG = window.NB_SERVICE_CONFIG || {};

const initServiceDropdown = (serviceDropdown) => {
  if (!serviceDropdown) return null;

  const hiddenInput = serviceDropdown.querySelector('input[name="option"]');
  const trigger = serviceDropdown.querySelector(".service-dropdown__trigger");
  const valueLabel = serviceDropdown.querySelector(".service-dropdown__value");
  const menu = serviceDropdown.querySelector(".service-dropdown__menu");

  const getOptions = () =>
    Array.from(serviceDropdown.querySelectorAll(".service-dropdown__option"));

  const closeDropdown = () => {
    serviceDropdown.classList.remove("is-open");
    trigger?.setAttribute("aria-expanded", "false");
  };

  const openDropdown = () => {
    serviceDropdown.classList.add("is-open");
    trigger?.setAttribute("aria-expanded", "true");
  };

  const setSelectedValue = (nextValue) => {
    const options = getOptions();
    options.forEach((item) => {
      const itemValue = item.dataset.value || item.textContent.trim();
      item.setAttribute(
        "aria-selected",
        itemValue === nextValue ? "true" : "false",
      );
    });
    if (hiddenInput) hiddenInput.value = nextValue;
    if (valueLabel) {
      const dashIdx = nextValue.lastIndexOf(" - ");
      if (dashIdx !== -1) {
        const label = nextValue.slice(0, dashIdx);
        const price = nextValue.slice(dashIdx + 3);
        valueLabel.innerHTML =
          `<span class="service-dropdown__label">${label}</span>` +
          `<span class="service-dropdown__price">${price}</span>`;
      } else {
        valueLabel.textContent = nextValue;
      }
    }
  };

  const setOptions = (values, selectedValue) => {
    if (!menu) return;

    const safeValues = Array.isArray(values) ? values.filter(Boolean) : [];
    if (!safeValues.length) return;

    const nextSelected =
      selectedValue && safeValues.includes(selectedValue)
        ? selectedValue
        : safeValues[0];

    menu.innerHTML = "";
    safeValues.forEach((value) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "service-dropdown__option";
      optionButton.setAttribute("role", "option");
      optionButton.dataset.value = value;
      const dashIdx = value.lastIndexOf(" - ");
      if (dashIdx !== -1) {
        const label = value.slice(0, dashIdx);
        const price = value.slice(dashIdx + 3);
        optionButton.innerHTML =
          `<span class="service-dropdown__label">${label}</span>` +
          `<span class="service-dropdown__price">${price}</span>`;
      } else {
        optionButton.textContent = value;
      }
      optionButton.setAttribute(
        "aria-selected",
        value === nextSelected ? "true" : "false",
      );
      menu.appendChild(optionButton);
    });

    setSelectedValue(nextSelected);
    closeDropdown();
  };

  trigger?.addEventListener("click", () => {
    if (serviceDropdown.classList.contains("is-open")) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  menu?.addEventListener("click", (e) => {
    const option = e.target.closest(".service-dropdown__option");
    if (!option) return;
    const nextValue = option.dataset.value || option.textContent.trim();
    setSelectedValue(nextValue);
    closeDropdown();
    trigger?.focus();
  });

  serviceDropdown.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
      trigger?.focus();
      return;
    }

    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    const options = getOptions();
    if (!options.length) return;

    e.preventDefault();

    const currentIndex = options.findIndex(
      (option) => option.getAttribute("aria-selected") === "true",
    );
    const step = e.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + step + options.length) % options.length;

    const nextValue =
      options[nextIndex].dataset.value || options[nextIndex].textContent.trim();
    setSelectedValue(nextValue);

    if (!serviceDropdown.classList.contains("is-open")) {
      openDropdown();
    }
    options[nextIndex].scrollIntoView({ block: "nearest" });
  });

  document.addEventListener("click", (e) => {
    if (!serviceDropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  return {
    close: closeDropdown,
    open: openDropdown,
    setOptions,
    setSelectedValue,
  };
};

const dropdownApi = initServiceDropdown(
  document.querySelector(".service-dropdown"),
);

// =============================================
// Render service-details and service-what sections
// =============================================
const renderServiceContent = (config, serviceId) => {
  if (!config) return;

  // Render service-details description
  const detailsBody = document.querySelector(".service-details__body");
  if (detailsBody && config.description) {
    detailsBody.innerHTML = config.description
      .map((p) => `<p class="service-details__text">${p}</p>`)
      .join("");
  }

  // Update service-details title
  const detailsTitleFg = document.querySelector(".service-details__title-fg");
  const detailsTitleBgText = document.querySelector(
    ".service-details__title-bg text",
  );
  if (detailsTitleFg && config.titleHtml) {
    const plainTitle = config.titleHtml.replace(/<br\s*\/?>/g, " ");
    detailsTitleFg.textContent = plainTitle;
    if (detailsTitleBgText) {
      detailsTitleBgText.textContent = "GTA Online";
    }
  }

  // Render whatYouGet cards
  const whatGrid = document.querySelector(".service-what__grid");
  if (whatGrid && config.whatYouGet) {
    whatGrid.innerHTML = config.whatYouGet
      .map(
        (card) => `
      <article class="service-what__card" role="listitem">
        <h3 class="service-what__card-title">${card.title}</h3>
        <p class="service-what__card-lead">${card.lead}</p>
        <ul class="service-what__list">
          ${card.items.map((item) => `<li class="service-what__item">${item}</li>`).join("")}
        </ul>
      </article>
    `,
      )
      .join("");
  }

  // Render sections (platform info, who this is for, service process, etc.)
  const sectionsContainer = document.querySelector(".service-what__sections");
  if (sectionsContainer && config.sections) {
    sectionsContainer.innerHTML = config.sections
      .map(
        (section) => `
      <article class="service-what__section">
        <h3 class="service-what__section-title">${section.title}</h3>
        ${section.texts.map((t) => `<p class="service-what__section-text">${t}</p>`).join("")}
      </article>
    `,
      )
      .join("");
  }
};

const applyServiceToHero = (serviceId, { updateUrl = false } = {}) => {
  const config = SERVICE_CONFIG[serviceId];
  if (!config) return false;

  const titleEl = document.querySelector("#service-hero-title");
  const imgEl = document.querySelector(".service-hero__image");

  if (titleEl && config.titleHtml) {
    titleEl.innerHTML = config.titleHtml;
  }

  if (imgEl && config.imageSrc) {
    imgEl.src = config.imageSrc;
    if (config.imageAlt) imgEl.alt = config.imageAlt;
  }

  if (dropdownApi && config.options?.length) {
    dropdownApi.setOptions(config.options, config.defaultOption);
  }

  // Render description and whatYouGet content
  renderServiceContent(config, serviceId);

  if (updateUrl) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("service", serviceId);
    window.history.pushState({ service: serviceId }, "", nextUrl);
  }

  return true;
};

const getServiceFromUrl = () => {
  const id = new URLSearchParams(window.location.search).get("service");
  return id && SERVICE_CONFIG[id] ? id : null;
};

const initialService = getServiceFromUrl() || "gta-cash-cars-ps";
applyServiceToHero(initialService);

window.addEventListener("popstate", () => {
  const serviceId = getServiceFromUrl() || "gta-cash-cars-ps";
  applyServiceToHero(serviceId);
});

document.addEventListener("click", (e) => {
  const link = e.target.closest("a.service-card__btn");
  if (!link) return;
  if (link.classList.contains("service-card__btn--custom")) return;

  const datasetService = link.dataset.service;
  const serviceId =
    datasetService && SERVICE_CONFIG[datasetService] ? datasetService : null;

  if (!serviceId) return;

  e.preventDefault();
  const applied = applyServiceToHero(serviceId, { updateUrl: true });
  if (applied) {
    document
      .querySelector(".service-hero")
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
});

// =============================================
// "BUY NOW" form — add selected option to cart
// =============================================
const purchaseForm = document.querySelector(".service-hero__purchase");
if (purchaseForm) {
  purchaseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const serviceId = getServiceFromUrl() || "gta-cash-cars-ps";
    const config = SERVICE_CONFIG[serviceId];
    if (!config) return;

    const optionInput = purchaseForm.querySelector('input[name="option"]');
    const selectedOption = optionInput?.value || config.defaultOption || "";

    // Parse price from option string like "20 million - $15.99"
    const priceMatch = selectedOption.match(/\$([\d.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

    // Build clean name from title (strip HTML tags)
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = config.titleHtml || "";
    const name = tempDiv.textContent.trim();

    if (typeof window.NB_addToCart === "function") {
      window.NB_addToCart({
        id: serviceId,
        name: name,
        price: price,
        image: config.imageSrc || "",
        option: selectedOption,
      });
    }
  });
}
