(() => {
    const root = document.documentElement;
    const toggleButton = document.getElementById("themeToggle");
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const storageKey = "anb-theme";

    const getStoredTheme = () => {
        try {
            const savedTheme = localStorage.getItem(storageKey);
            return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
        } catch {
            return "light";
        }
    };

    const saveTheme = (theme) => {
        try {
            localStorage.setItem(storageKey, theme);
        } catch {
        }
    };

    const applyTheme = (theme, persist = true) => {
        const activeTheme = theme === "dark" ? "dark" : "light";
        const isLight = activeTheme === "light";
        root.dataset.theme = activeTheme;

        if (toggleButton) {
            const icon = toggleButton.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-sun", isLight);
                icon.classList.toggle("fa-moon", !isLight);
            }

            const label = isLight ? "Activar modo oscuro" : "Activar modo claro";
            toggleButton.setAttribute("aria-label", label);
            toggleButton.setAttribute("title", label);
            toggleButton.setAttribute("aria-pressed", String(!isLight));
        }

        if (themeColorMeta) {
            themeColorMeta.setAttribute("content", isLight ? "#f5f8f8" : "#0b1214");
        }

        if (persist) {
            saveTheme(activeTheme);
        }
    };

    applyTheme(getStoredTheme(), false);

    if (toggleButton) {
        toggleButton.addEventListener("click", () => {
            const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
        });
    }
})();
