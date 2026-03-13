const GTA5_SERVICES = {
  ps: [
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services1.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost PS4/PS5",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-cash",
      imageSrc: "../assets/images/services2.webp",
      imageAlt: "GTA Online Cash Boost",
      title: "GTA Online Cash Boost PS4/PS5",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-level",
      imageSrc: "../assets/images/services3.webp",
      imageAlt: "GTA Online Level Boost",
      title: "GTA Online Level Boost PS4/PS5",
      priceNow: "$29.99",
    },
    {
      serviceParam: "gta-modded",
      imageSrc: "../assets/images/services4.webp",
      imageAlt: "GTA Online Modded Account",
      title: "GTA Online Modded Account PS4/PS5",
      priceNow: "$29.99",
    },
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services1.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost PS4/PS5",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services2.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost PS4/PS5",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services3.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost PS4/PS5",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services4.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost PS4/PS5",
      priceNow: "$19.99",
    },
  ],

  pc: [
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services1.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost PC",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-cash",
      imageSrc: "../assets/images/services2.webp",
      imageAlt: "GTA Online Cash Boost",
      title: "GTA Online Cash Boost PC",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-level",
      imageSrc: "../assets/images/services3.webp",
      imageAlt: "GTA Online Level Boost",
      title: "GTA Online Level Boost PC",
      priceNow: "$29.99",
    },
    {
      serviceParam: "gta-modded",
      imageSrc: "../assets/images/services4.webp",
      imageAlt: "GTA Online Modded Account",
      title: "GTA Online Modded Account PC",
      priceNow: "$29.99",
    },
  ],

  xbox: [
    {
      serviceParam: "gta-cash-cars",
      imageSrc: "../assets/images/services1.webp",
      imageAlt: "GTA Online Cash + Cars Boost",
      title: "GTA Online Cash + Cars Boost Xbox One/Series",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-cash",
      imageSrc: "../assets/images/services2.webp",
      imageAlt: "GTA Online Cash Boost",
      title: "GTA Online Cash Boost Xbox One/Series",
      priceNow: "$19.99",
    },
    {
      serviceParam: "gta-level",
      imageSrc: "../assets/images/services3.webp",
      imageAlt: "GTA Online Level Boost",
      title: "GTA Online Level Boost Xbox One/Series",
      priceNow: "$29.99",
    },
    {
      serviceParam: "gta-modded",
      imageSrc: "../assets/images/services4.webp",
      imageAlt: "GTA Online Modded Account",
      title: "GTA Online Modded Account Xbox One/Series",
      priceNow: "$29.99",
    },
  ],
};

const getInitialPlatform = () => {
  const url = new URL(window.location.href);
  const p = url.searchParams.get("platform");
  if (p === "ps" || p === "pc" || p === "xbox") return p;
  return "ps";
};

const setUrlPlatform = (platform) => {
  const url = new URL(window.location.href);
  url.searchParams.set("platform", platform);
  window.history.replaceState({ platform }, "", url);
};

const renderCards = (platform) => {
  const grid = document.querySelector("#gta5-services-grid");
  if (!grid) return;

  const items = GTA5_SERVICES[platform] || [];

  grid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "service-card";

    const img = document.createElement("img");
    img.className = "service-card__img";
    img.src = item.imageSrc;
    img.alt = item.imageAlt;
    img.loading = "lazy";

    const content = document.createElement("div");
    content.className = "service-card__content";

    const title = document.createElement("h3");
    title.className = "service-card__name";
    title.textContent = item.title;

    const price = document.createElement("p");
    price.className = "service-card__price";

    const amount = document.createElement("span");
    amount.className = "service-card__amount";
    amount.textContent = item.priceNow;

    price.appendChild(amount);

    const btn = document.createElement("a");
    btn.className = "service-card__btn";
    btn.href = `./services.html?service=${encodeURIComponent(item.serviceParam)}`;
    btn.dataset.service = item.serviceParam;
    btn.textContent = "BUY NOW";

    content.appendChild(title);
    content.appendChild(price);
    content.appendChild(btn);

    card.appendChild(img);
    card.appendChild(content);

    grid.appendChild(card);
  });
};

const setActiveTab = (platform) => {
  const tabs = Array.from(document.querySelectorAll(".gta5-intro__tab"));
  tabs.forEach((tab) => {
    const isActive = tab.dataset.platform === platform;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
};

const initGta5Tabs = () => {
  const tabs = Array.from(document.querySelectorAll(".gta5-intro__tab"));
  if (!tabs.length) return;

  const applyPlatform = (platform, { updateUrl = true } = {}) => {
    setActiveTab(platform);
    renderCards(platform);
    if (updateUrl) setUrlPlatform(platform);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const platform = tab.dataset.platform;
      if (!platform) return;
      applyPlatform(platform);
    });
  });

  const initial = getInitialPlatform();
  applyPlatform(initial, { updateUrl: false });

  window.addEventListener("popstate", () => {
    const p = getInitialPlatform();
    applyPlatform(p, { updateUrl: false });
  });
};

initGta5Tabs();
