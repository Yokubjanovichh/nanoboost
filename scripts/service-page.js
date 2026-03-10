const SERVICE_CONFIG = {
  "gta-cash-cars": {
    titleHtml: "GTA Online Cash+<br />Cars Boost PS4/PS5",
    imageSrc: "../assets/images/services1.webp",
    imageAlt: "GTA Online cash and cars boost",
    options: [
      "15 million - 19.99$",
      "25 million - 23.99$",
      "30 million - 27.99$",
      "50 million - 33.99$",
      "75 million - 39.99$",
      "100 million - 49.99$",
      "150 million - 60.99$",
      "200 million - 70.99$",
      "300 million - 85.99$",
      "500 million - 120.99$",
      "750 million - 150.99$",
      "1 Billion - 199.99$",
    ],
    defaultOption: "15 million - 19.99$",
  },
  "gta-cash": {
    titleHtml: "GTA Online Cash Boost<br />PS4/PS5",
    imageSrc: "../assets/images/services2.webp",
    imageAlt: "GTA Online cash boost",
    options: ["Cash Boost - From 19.99$"],
    defaultOption: "Cash Boost - From 19.99$",
  },
  "gta-level": {
    titleHtml: "GTA Online Level Boost<br />PS4/PS5",
    imageSrc: "../assets/images/services3.webp",
    imageAlt: "GTA Online level boost",
    options: ["Level Boost - From 29.99$"],
    defaultOption: "Level Boost - From 29.99$",
  },
  "gta-modded": {
    titleHtml: "GTA Online Modded Account<br />PS4/PS5",
    imageSrc: "../assets/images/services4.webp",
    imageAlt: "GTA Online modded account",
    options: ["Modded Account - From 29.99$"],
    defaultOption: "Modded Account - From 29.99$",
  },
};

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
    if (valueLabel) valueLabel.textContent = nextValue;
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
      optionButton.textContent = value;
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

  if (updateUrl) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("service", serviceId);
    nextUrl.hash = "service-hero-title";
    window.history.pushState({ service: serviceId }, "", nextUrl);
  }

  return true;
};

const getServiceFromUrl = () => {
  const id = new URLSearchParams(window.location.search).get("service");
  return id && SERVICE_CONFIG[id] ? id : null;
};

const initialService = getServiceFromUrl() || "gta-cash-cars";
applyServiceToHero(initialService);

window.addEventListener("popstate", () => {
  const serviceId = getServiceFromUrl() || "gta-cash-cars";
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
