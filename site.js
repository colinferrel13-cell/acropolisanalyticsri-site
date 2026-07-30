(function () {
  const toggle = document.querySelector(".nav-toggle");
  const navigation = document.querySelector("#primary-navigation");
  const year = document.querySelector("[data-current-year]");

  if (year) {
    year.textContent = new Date().getFullYear();
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
