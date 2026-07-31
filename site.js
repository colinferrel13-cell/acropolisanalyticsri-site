(function () {
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector("#primary-navigation");
  const year = document.querySelector("[data-current-year]");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const main = document.querySelector("main");
  const permittedOrnaments = new Set([
    "column-cracked",
    "column-damaged",
    "column-destroyed",
    "helmet-column",
    "shield-column",
    "helmet-shield",
  ]);
  const ornamentKeys = [
    document.body.dataset.ornamentOne,
    document.body.dataset.ornamentTwo,
  ].filter((key) => key && permittedOrnaments.has(key));

  if (main && ornamentKeys.length) {
    const ornamentLayer = document.createElement("div");
    ornamentLayer.className = "page-ornaments";
    ornamentLayer.setAttribute("aria-hidden", "true");

    const ornaments = ornamentKeys.map((key, index) => {
      const ornament = document.createElement("span");
      ornament.className = `scroll-ornament scroll-ornament--${index + 1} scroll-ornament--${key}`;
      ornamentLayer.appendChild(ornament);
      return ornament;
    });

    main.prepend(ornamentLayer);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameRequested = false;

    const updateOrnaments = () => {
      frameRequested = false;

      if (reducedMotion.matches) {
        ornaments.forEach((ornament) => {
          ornament.style.removeProperty("--parallax-y");
        });
        return;
      }

      const scrollRange = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollRange));
      const travel = (progress - 0.5) * 90;

      ornaments.forEach((ornament, index) => {
        const direction = index === 0 ? 1 : -0.72;
        ornament.style.setProperty(
          "--parallax-y",
          `${(travel * direction).toFixed(1)}px`,
        );
      });
    };

    const requestOrnamentUpdate = () => {
      if (!frameRequested) {
        frameRequested = true;
        window.requestAnimationFrame(updateOrnaments);
      }
    };

    const setOrnamentMotion = () => {
      window.removeEventListener("scroll", requestOrnamentUpdate);
      window.removeEventListener("resize", requestOrnamentUpdate);

      if (!reducedMotion.matches) {
        window.addEventListener("scroll", requestOrnamentUpdate, { passive: true });
        window.addEventListener("resize", requestOrnamentUpdate);
      }

      updateOrnaments();
    };

    setOrnamentMotion();

    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", setOrnamentMotion);
    } else if (typeof reducedMotion.addListener === "function") {
      reducedMotion.addListener(setOrnamentMotion);
    }
  }

  if (!toggle || !navigation) {
    return;
  }

  const setMenuState = (isOpen) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.querySelector(".sr-only").textContent = isOpen
      ? "Close navigation"
      : "Open navigation";
    navigation.dataset.open = String(isOpen);
  };

  toggle.addEventListener("click", () => {
    setMenuState(toggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenuState(false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    const clickedInsideNavigation =
      navigation.contains(event.target) || toggle.contains(event.target);

    if (!clickedInsideNavigation && toggle.getAttribute("aria-expanded") === "true") {
      setMenuState(false);
    }
  });

  const wideLayout = window.matchMedia("(min-width: 1081px)");
  wideLayout.addEventListener("change", (event) => {
    if (event.matches) {
      setMenuState(false);
    }
  });
})();
