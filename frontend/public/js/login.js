const form = document.getElementById("loginForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const errorText = document.getElementById("error");

        errorText.textContent = "";

        if (!email || !password) {
            errorText.textContent = "Todos los campos son obligatorios.";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                errorText.textContent = data.message;
                return;
            }

            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";

        } catch (error) {
            errorText.textContent = "No se pudo conectar al servidor.";
        }
    });
}

const registerBtn = document.getElementById("goRegister");

if (registerBtn) {
    registerBtn.addEventListener("click", () => {
        window.location.href = "register.html";
    });
}
