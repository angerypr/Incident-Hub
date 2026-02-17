const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const errorText = document.getElementById("error");

        errorText.textContent = "";

        try {
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                errorText.textContent = data.message;
                return;
            }

            alert("Usuario registrado correctamente");
            window.location.href = "login.html";

        } catch (error) {
            errorText.textContent = "Error al registrar usuario";
        }
    });
}
