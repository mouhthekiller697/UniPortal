(function attachTheme(globalScope) {
  const storageKey = "uniportal-theme";
  const root = document.documentElement;

  const getPreferredTheme = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const getThemeMeta = (theme) =>
    theme === "dark"
      ? {
          iconClass: "fa-moon",
          label: "Dark mode enabled. Switch to light mode",
        }
      : {
          iconClass: "fa-sun",
          label: "Light mode enabled. Switch to dark mode",
        };

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(storageKey, theme);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const icon = button.querySelector("i");
      const { iconClass, label } = getThemeMeta(theme);
      if (icon) {
        icon.className = `fa-solid ${iconClass}`;
      }
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
  };

  const initThemeToggle = () => {
    applyTheme(getPreferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") || "light";
        applyTheme(current === "dark" ? "light" : "dark");
      });
    });
  };

  globalScope.UniPortalTheme = { initThemeToggle, applyTheme };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle, { once: true });
  } else {
    initThemeToggle();
  }
})(window);
