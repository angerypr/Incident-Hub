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

    // Language handling will be added here in the next step
});
