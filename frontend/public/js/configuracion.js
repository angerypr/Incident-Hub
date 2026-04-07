document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");

    // Check initial layout
    if (localStorage.getItem("theme") === "light") {
        themeToggle.checked = true;
    }

    themeToggle.addEventListener("change", (e) => {
        if (e.target.checked) {
            document.documentElement.classList.add("light-mode");
            localStorage.setItem("theme", "light");
        } else {
            document.documentElement.classList.remove("light-mode");
            localStorage.setItem("theme", "dark");
        }
    });

    const languageSelect = document.getElementById("languageSelect");
    if (localStorage.getItem("lang")) {
        languageSelect.value = localStorage.getItem("lang");
    }

    languageSelect.addEventListener("change", (e) => {
        const lang = e.target.value;
        localStorage.setItem("lang", lang);
        applyLanguage(lang);
    });
});
